from django.urls import path, include
from django.views.decorators.csrf import csrf_exempt
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet, LessonViewSet, UserViewSet, UserProgressViewSet, check_code,
    StudentLessonViewSet, StudentChallengeViewSet, SubmissionViewSet
)
from .auth_views import login, logout, me

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'users', UserViewSet, basename='user')
router.register(r'progress', UserProgressViewSet, basename='userprogress')
router.register(r'student-lessons', StudentLessonViewSet, basename='studentlesson')
router.register(r'student-challenges', StudentChallengeViewSet, basename='studentchallenge')
router.register(r'submissions', SubmissionViewSet, basename='submission')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', csrf_exempt(login), name='login'),
    path('auth/logout/', csrf_exempt(logout), name='logout'),
    path('auth/me/', me, name='me'),
    path('check_code/', check_code, name='check_code'),
]

