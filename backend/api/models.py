from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Расширенная модель пользователя"""
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
    ]
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    avatar_url = models.URLField(blank=True, null=True)
    level = models.IntegerField(default=1)
    xp = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return f"{self.username} ({self.role})"


class Course(models.Model):
    """Модель курса"""
    id = models.CharField(max_length=100, primary_key=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    thumbnail_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['title']
    
    def __str__(self):
        return self.title


class Lesson(models.Model):
    """Модель урока"""
    id = models.CharField(max_length=100, primary_key=True)
    course = models.ForeignKey(Course, related_name='lessons', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    order = models.IntegerField()
    video_url = models.URLField(blank=True, null=True)
    pdf_file = models.URLField(blank=True, null=True, help_text="Ссылка на PDF файл (например, Google Drive)")
    content = models.TextField()  # Markdown content
    duration = models.IntegerField(default=10)  # minutes
    xp_reward = models.IntegerField(default=50)
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'title']
        unique_together = [['course', 'order']]
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"


class Challenge(models.Model):
    """Модель задания для урока (шаблон)"""
    lesson = models.OneToOneField(Lesson, related_name='challenge', on_delete=models.CASCADE)
    instructions = models.TextField()
    initial_code = models.TextField()
    expected_output = models.CharField(max_length=500, blank=True, null=True)
    hints = models.JSONField(default=list, blank=True)  # Список подсказок
    
    def __str__(self):
        return f"Challenge for {self.lesson.title}"


class StudentLesson(models.Model):
    """Индивидуальный урок для ученика"""
    student = models.ForeignKey(User, related_name='student_lessons', on_delete=models.CASCADE, limit_choices_to={'role': 'student'})
    lesson = models.ForeignKey(Lesson, related_name='student_lessons', on_delete=models.CASCADE)
    is_unlocked = models.BooleanField(default=False)  # Разблокирован ли урок для ученика
    is_completed = models.BooleanField(default=False)  # Завершен ли урок
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = [['student', 'lesson']]
        ordering = ['lesson__order']
    
    def __str__(self):
        return f"{self.student.username} - {self.lesson.title}"
    
    def save(self, *args, **kwargs):
        """Переопределяем save для синхронизации с UserProgress"""
        super().save(*args, **kwargs)
        
        # Синхронизируем is_unlocked с UserProgress.unlocked_lesson_ids
        try:
            progress = UserProgress.objects.get(
                user=self.student,
                course=self.lesson.course
            )
            unlocked_ids = progress.unlocked_lesson_ids or []
            
            if self.is_unlocked:
                # Добавляем урок в unlocked_lesson_ids, если его там нет
                if self.lesson.id not in unlocked_ids:
                    unlocked_ids.append(self.lesson.id)
                    progress.unlocked_lesson_ids = unlocked_ids
                    progress.save()
            else:
                # Удаляем урок из unlocked_lesson_ids, если он там есть
                if self.lesson.id in unlocked_ids:
                    unlocked_ids.remove(self.lesson.id)
                    progress.unlocked_lesson_ids = unlocked_ids
                    progress.save()
        except UserProgress.DoesNotExist:
            # Если прогресса нет и урок разблокирован, создаем прогресс
            if self.is_unlocked:
                UserProgress.objects.create(
                    user=self.student,
                    course=self.lesson.course,
                    unlocked_lesson_ids=[self.lesson.id],
                    completed_lesson_ids=[],
                    current_lesson_id=self.lesson.id
                )


class StudentChallenge(models.Model):
    """Индивидуальное задание для ученика"""
    student = models.ForeignKey(User, related_name='student_challenges', on_delete=models.CASCADE, limit_choices_to={'role': 'student'})
    lesson = models.ForeignKey(Lesson, related_name='student_challenges', on_delete=models.CASCADE)
    instructions = models.TextField()
    initial_code = models.TextField()
    expected_output = models.CharField(max_length=500, blank=True, null=True)
    hints = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = [['student', 'lesson']]
    
    def __str__(self):
        return f"Challenge for {self.student.username} - {self.lesson.title}"


class Submission(models.Model):
    """Отправленное задание от ученика к админу"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),  # Ожидает проверки
        ('approved', 'Approved'),  # Одобрено админом
        ('rejected', 'Rejected'),  # Отклонено админом
    ]
    
    student = models.ForeignKey(User, related_name='submissions', on_delete=models.CASCADE, limit_choices_to={'role': 'student'})
    lesson = models.ForeignKey(Lesson, related_name='submissions', on_delete=models.CASCADE)
    code = models.TextField()  # Код, который отправил ученик
    output = models.JSONField(default=list)  # Вывод кода
    error = models.TextField(blank=True, null=True)  # Ошибка, если была
    passed_auto_check = models.BooleanField(default=False)  # Прошел ли автоматическую проверку
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    admin_comment = models.TextField(blank=True, null=True)  # Комментарий админа
    reviewed_by = models.ForeignKey(User, related_name='reviewed_submissions', on_delete=models.SET_NULL, null=True, blank=True, limit_choices_to={'role__in': ['admin', 'teacher']})
    reviewed_at = models.DateTimeField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"Submission by {self.student.username} for {self.lesson.title} ({self.status})"


class UserProgress(models.Model):
    """Модель прогресса пользователя"""
    user = models.ForeignKey(User, related_name='progress', on_delete=models.CASCADE)
    course = models.ForeignKey(Course, related_name='user_progress', on_delete=models.CASCADE)
    completed_lesson_ids = models.JSONField(default=list)  # Список ID завершенных уроков
    unlocked_lesson_ids = models.JSONField(default=list)  # Список ID разблокированных уроков (из StudentLesson)
    current_lesson_id = models.CharField(max_length=100, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = [['user', 'course']]
    
    def __str__(self):
        return f"{self.user.username} - {self.course.title}"

