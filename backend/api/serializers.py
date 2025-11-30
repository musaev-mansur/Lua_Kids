from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Course, Lesson, Challenge, UserProgress,
    StudentLesson, StudentChallenge, Submission
)

User = get_user_model()


class ChallengeSerializer(serializers.ModelSerializer):
    """Сериализатор для Challenge"""
    class Meta:
        model = Challenge
        fields = ['instructions', 'initial_code', 'expected_output', 'hints']


class LessonSerializer(serializers.ModelSerializer):
    """Сериализатор для Lesson"""
    challenge = ChallengeSerializer(read_only=True)
    is_locked = serializers.SerializerMethodField()
    pdf_file_url = serializers.URLField(source='pdf_file', read_only=True, allow_null=True)
    
    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'description', 'order', 'video_url', 'pdf_file',
            'pdf_file_url', 'content', 'duration', 'xp_reward', 'is_locked', 'challenge'
        ]
    
    def get_is_locked(self, obj):
        """
        Динамически определяет, заблокирован ли урок для конкретного пользователя
        Использует UserProgress.unlocked_lesson_ids (синхронизируется с StudentLesson.is_unlocked)
        """
        # Получаем пользователя из контекста запроса
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            # Если пользователь не аутентифицирован, используем базовое значение
            return getattr(obj, 'is_locked', False)
        
        user = request.user
        course = obj.course
        
        # Первый урок всегда доступен
        if obj.order == 1:
            return False
        
        # Получаем прогресс пользователя по курсу
        try:
            progress = UserProgress.objects.get(user=user, course=course)
            unlocked_lesson_ids = progress.unlocked_lesson_ids or []
            completed_lesson_ids = progress.completed_lesson_ids or []
        except UserProgress.DoesNotExist:
            # Если прогресса нет, проверяем StudentLesson напрямую (fallback)
            try:
                student_lesson = StudentLesson.objects.get(student=user, lesson=obj)
                # Синхронизируем StudentLesson с UserProgress
                UserProgress.objects.create(
                    user=user,
                    course=course,
                    unlocked_lesson_ids=[obj.id] if student_lesson.is_unlocked else [],
                    completed_lesson_ids=[],
                    current_lesson_id=obj.id if student_lesson.is_unlocked else None
                )
                return not student_lesson.is_unlocked
            except StudentLesson.DoesNotExist:
                # Если нет ни прогресса, ни StudentLesson, урок заблокирован (кроме первого)
                return obj.order > 1
        
        # Если урок разблокирован через StudentLesson (есть в unlocked_lesson_ids), он доступен
        if obj.id in unlocked_lesson_ids:
            return False
        
        # Если нет в unlocked_lesson_ids, проверяем логику последовательного разблокирования
        # Находим предыдущий урок
        previous_lesson = Lesson.objects.filter(
            course=course,
            order=obj.order - 1
        ).first()
        
        if not previous_lesson:
            # Если предыдущий урок не найден, используем базовое значение
            return obj.is_locked
        
        # Урок заблокирован, если предыдущий урок не выполнен
        is_locked = previous_lesson.id not in completed_lesson_ids
        
        return is_locked


class LessonCreateUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания/обновления Lesson с Challenge"""
    challenge = ChallengeSerializer(required=False, allow_null=True)
    
    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'description', 'order', 'video_url', 'pdf_file',
            'content', 'duration', 'xp_reward', 'is_locked', 'challenge'
        ]
    
    def create(self, validated_data):
        challenge_data = validated_data.pop('challenge', None)
        lesson = Lesson.objects.create(**validated_data)
        
        if challenge_data:
            Challenge.objects.create(lesson=lesson, **challenge_data)
        
        return lesson
    
    def update(self, instance, validated_data):
        challenge_data = validated_data.pop('challenge', None)
        
        # Обновляем поля урока
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Обновляем или создаем challenge
        if challenge_data is not None:
            if hasattr(instance, 'challenge'):
                challenge = instance.challenge
                for attr, value in challenge_data.items():
                    setattr(challenge, attr, value)
                challenge.save()
            else:
                Challenge.objects.create(lesson=instance, **challenge_data)
        
        return instance


class CourseSerializer(serializers.ModelSerializer):
    """Сериализатор для Course с уроками"""
    lessons = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'thumbnail_url', 'lessons']
    
    def get_lessons(self, obj):
        """Получаем уроки с учетом контекста запроса для правильного определения is_locked"""
        lessons = obj.lessons.all().order_by('order')
        return LessonSerializer(lessons, many=True, context=self.context).data


class CourseListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка курсов"""
    lessons_count = serializers.IntegerField(source='lessons.count', read_only=True)
    
    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'thumbnail_url', 'lessons_count']


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для User"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 
                  'role', 'avatar_url', 'level', 'xp']
        read_only_fields = ['id']


class UserProgressSerializer(serializers.ModelSerializer):
    """Сериализатор для UserProgress"""
    course_title = serializers.CharField(source='course.title', read_only=True)
    
    class Meta:
        model = UserProgress
        fields = [
            'id', 'user', 'course', 'course_title', 
            'completed_lesson_ids', 'unlocked_lesson_ids', 'current_lesson_id', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


class UserProgressCreateUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания/обновления UserProgress"""
    class Meta:
        model = UserProgress
        fields = [
            'id', 'user', 'course', 
            'completed_lesson_ids', 'unlocked_lesson_ids', 'current_lesson_id'
        ]


class StudentLessonSerializer(serializers.ModelSerializer):
    """Сериализатор для StudentLesson"""
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    lesson_order = serializers.IntegerField(source='lesson.order', read_only=True)
    lesson = serializers.SerializerMethodField()  # Используем SerializerMethodField для правильной передачи контекста
    
    class Meta:
        model = StudentLesson
        fields = [
            'id', 'student', 'lesson', 'lesson_title', 'lesson_order',
            'is_unlocked', 'is_completed', 'completed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_lesson(self, obj):
        """Возвращаем полный объект урока с правильным контекстом"""
        lesson = obj.lesson
        if lesson:
            try:
                # Используем LessonSerializer с контекстом из родительского сериализатора
                serializer = LessonSerializer(lesson, context=self.context)
                return serializer.data
            except Exception as e:
                # Если произошла ошибка при сериализации, возвращаем базовые данные
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Ошибка при сериализации урока: {e}")
                return {
                    'id': str(lesson.id),
                    'title': lesson.title,
                    'description': lesson.description,
                    'order': lesson.order,
                }
        return None


class StudentChallengeSerializer(serializers.ModelSerializer):
    """Сериализатор для StudentChallenge"""
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    
    class Meta:
        model = StudentChallenge
        fields = [
            'id', 'student', 'lesson', 'lesson_title',
            'instructions', 'initial_code', 'expected_output', 'hints',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class SubmissionSerializer(serializers.ModelSerializer):
    """Сериализатор для Submission"""
    student_username = serializers.CharField(source='student.username', read_only=True)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True)
    
    class Meta:
        model = Submission
        fields = [
            'id', 'student', 'student_username', 'lesson', 'lesson_title',
            'code', 'output', 'error', 'passed_auto_check',
            'status', 'admin_comment', 'reviewed_by', 'reviewed_by_username',
            'reviewed_at', 'submitted_at', 'updated_at'
        ]
        read_only_fields = ['submitted_at', 'updated_at']


class SubmissionCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания Submission"""
    class Meta:
        model = Submission
        fields = [
            'student', 'lesson', 'code', 'output', 'error', 'passed_auto_check'
        ]

