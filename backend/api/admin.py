from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from .models import (
    Course, Lesson, Challenge, UserProgress,
    StudentLesson, StudentChallenge, Submission
)

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Админка для пользователей"""
    list_display = ['username', 'email', 'role', 'level', 'xp', 'is_staff']
    list_filter = ['role', 'is_staff', 'is_superuser']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Дополнительная информация', {
            'fields': ('role', 'avatar_url', 'level', 'xp')
        }),
    )


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    """Админка для курсов"""
    list_display = ['id', 'title', 'description', 'created_at']
    search_fields = ['title', 'description']
    list_filter = ['created_at']


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    """Админка для уроков"""
    list_display = ['id', 'title', 'course', 'order', 'duration', 'xp_reward', 'is_locked', 'has_pdf']
    list_filter = ['course', 'is_locked', 'order']
    search_fields = ['title', 'description']
    ordering = ['course', 'order']
    fieldsets = (
        ('Основная информация', {
            'fields': ('id', 'course', 'title', 'description', 'order')
        }),
        ('Контент', {
            'fields': ('video_url', 'pdf_file', 'content')
        }),
        ('Настройки', {
            'fields': ('duration', 'xp_reward', 'is_locked')
        }),
    )
    
    def has_pdf(self, obj):
        return bool(obj.pdf_file)
    has_pdf.boolean = True
    has_pdf.short_description = 'PDF ссылка'


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    """Админка для заданий"""
    list_display = ['lesson', 'expected_output']
    search_fields = ['lesson__title', 'instructions']


@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    """Админка для прогресса"""
    list_display = ['user', 'course', 'current_lesson_id', 'updated_at']
    list_filter = ['course', 'updated_at']
    search_fields = ['user__username', 'course__title']


@admin.register(StudentLesson)
class StudentLessonAdmin(admin.ModelAdmin):
    """Админка для индивидуальных уроков учеников"""
    list_display = ['student', 'lesson', 'is_unlocked', 'is_completed', 'completed_at']
    list_filter = ['is_unlocked', 'is_completed', 'created_at']
    search_fields = ['student__username', 'lesson__title']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(StudentChallenge)
class StudentChallengeAdmin(admin.ModelAdmin):
    """Админка для индивидуальных заданий учеников"""
    list_display = ['student', 'lesson', 'created_at']
    list_filter = ['created_at']
    search_fields = ['student__username', 'lesson__title']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    """Админка для отправленных заданий"""
    list_display = ['student', 'lesson', 'status', 'passed_auto_check', 'reviewed_by', 'submitted_at']
    list_filter = ['status', 'passed_auto_check', 'submitted_at', 'reviewed_at']
    search_fields = ['student__username', 'lesson__title', 'admin_comment']
    readonly_fields = ['submitted_at', 'updated_at']
    fieldsets = (
        ('Основная информация', {
            'fields': ('student', 'lesson', 'status', 'passed_auto_check')
        }),
        ('Код и вывод', {
            'fields': ('code', 'output', 'error')
        }),
        ('Проверка', {
            'fields': ('admin_comment', 'reviewed_by', 'reviewed_at')
        }),
        ('Даты', {
            'fields': ('submitted_at', 'updated_at')
        }),
    )

