from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import (
    Course, Lesson, UserProgress, Challenge,
    StudentLesson, StudentChallenge, Submission
)
from .serializers import (
    CourseSerializer, CourseListSerializer,
    LessonSerializer, LessonCreateUpdateSerializer,
    UserSerializer, UserProgressSerializer, UserProgressCreateUpdateSerializer,
    StudentLessonSerializer, StudentChallengeSerializer,
    SubmissionSerializer, SubmissionCreateSerializer
)

User = get_user_model()


class CourseViewSet(viewsets.ModelViewSet):
    """ViewSet для CRUD операций с курсами"""
    queryset = Course.objects.all()
    permission_classes = [AllowAny]  # Разрешаем GET без аутентификации
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CourseListSerializer
        return CourseSerializer
    
    def get_queryset(self):
        queryset = Course.objects.all()
        # Можно добавить фильтрацию по параметрам запроса
        return queryset.prefetch_related('lessons', 'lessons__challenge')
    
    @action(detail=True, methods=['get'])
    def lessons(self, request, pk=None):
        """Получить все уроки курса"""
        course = self.get_object()
        lessons = course.lessons.all().order_by('order')
        serializer = LessonSerializer(lessons, many=True, context={'request': request})
        return Response(serializer.data)


class LessonViewSet(viewsets.ModelViewSet):
    """ViewSet для CRUD операций с уроками"""
    queryset = Lesson.objects.all()
    permission_classes = [AllowAny]  # Разрешаем GET без аутентификации
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return LessonCreateUpdateSerializer
        return LessonSerializer
    
    def get_queryset(self):
        queryset = Lesson.objects.all()
        course_id = self.request.query_params.get('course', None)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset.select_related('course').prefetch_related('challenge').order_by('order')
    
    def create(self, request, *args, **kwargs):
        """Создать новый урок"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """Обновить урок"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet для CRUD операций с пользователями"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # Разрешаем GET без аутентификации
    
    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """Получить прогресс пользователя"""
        user = self.get_object()
        progress = UserProgress.objects.filter(user=user)
        serializer = UserProgressSerializer(progress, many=True)
        return Response(serializer.data)


class UserProgressViewSet(viewsets.ModelViewSet):
    """ViewSet для CRUD операций с прогрессом пользователя"""
    queryset = UserProgress.objects.all()
    permission_classes = [AllowAny]  # Разрешаем GET без аутентификации
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UserProgressCreateUpdateSerializer
        return UserProgressSerializer
    
    def get_queryset(self):
        queryset = UserProgress.objects.all()
        user_id = self.request.query_params.get('user', None)
        course_id = self.request.query_params.get('course', None)
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset.select_related('user', 'course')
    
    @action(detail=False, methods=['post'])
    def complete_lesson(self, request):
        """Отметить урок как завершенный"""
        user_id = request.data.get('user_id')
        course_id = request.data.get('course_id')
        lesson_id = request.data.get('lesson_id')
        
        if not all([user_id, course_id, lesson_id]):
            return Response(
                {'error': 'user_id, course_id и lesson_id обязательны'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        progress, created = UserProgress.objects.get_or_create(
            user_id=user_id,
            course_id=course_id,
            defaults={'current_lesson_id': lesson_id}
        )
        
        if lesson_id not in progress.completed_lesson_ids:
            progress.completed_lesson_ids.append(lesson_id)
            progress.current_lesson_id = lesson_id
            progress.save()
        
        serializer = self.get_serializer(progress)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='current')
    def current(self, request):
        """Получить текущий прогресс пользователя по курсу"""
        user_id = request.query_params.get('user_id')
        course_id = request.query_params.get('course_id')
        
        if not all([user_id, course_id]):
            return Response(
                {'error': 'user_id и course_id обязательны'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            progress = UserProgress.objects.get(user_id=user_id, course_id=course_id)
            serializer = self.get_serializer(progress)
            return Response(serializer.data)
        except UserProgress.DoesNotExist:
            # Возвращаем пустой прогресс вместо 404, чтобы frontend мог работать
            return Response({
                'user': int(user_id),
                'course': course_id,
                'completed_lesson_ids': [],
                'current_lesson_id': '',
            }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Требуем аутентификацию
def check_code(request):
    """
    Проверяет выполнение Lua кода, сравнивает результат с ожидаемым выводом
    и создает Submission для отправки админу
    """
    lesson_id = request.data.get('lesson_id')
    code = request.data.get('code', '')
    output = request.data.get('output', [])
    error = request.data.get('error')
    
    if not lesson_id:
        return Response(
            {'error': 'lesson_id обязателен'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        lesson = Lesson.objects.select_related('challenge').get(id=lesson_id)
    except Lesson.DoesNotExist:
        return Response(
            {'error': 'Урок не найден'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    user = request.user
    
    # Проверяем, есть ли индивидуальное задание для ученика
    student_challenge = None
    try:
        student_challenge = StudentChallenge.objects.get(student=user, lesson=lesson)
    except StudentChallenge.DoesNotExist:
        pass
    
    # Если нет индивидуального задания, используем общий challenge
    challenge = student_challenge if student_challenge else getattr(lesson, 'challenge', None)
    
    # Если есть ошибка выполнения, код не прошел
    if error:
        return Response({
            'passed': False,
            'message': 'Код содержит ошибки. Исправьте ошибки и попробуйте снова.',
            'error': error,
        })
    
    # Проверяем, есть ли challenge с ожидаемым выводом
    if challenge:
        if challenge.expected_output:
            expected_output = challenge.expected_output
            
            # Проверяем, совпадает ли вывод с ожидаемым
            passed_auto_check = False
            
            if isinstance(output, list):
                # Объединяем все строки вывода в одну строку через пробел
                actual_output = ' '.join(str(line).strip() for line in output if line)
                passed_auto_check = actual_output.strip() == str(expected_output).strip()
            elif isinstance(output, str):
                passed_auto_check = str(output).strip() == str(expected_output).strip()
            
            # Создаем Submission ТОЛЬКО если проверка пройдена
            if passed_auto_check:
                # Проверяем, есть ли уже submission для этого ученика и урока (pending или approved)
                # Если есть rejected - можно создать новый (ученик исправил код)
                existing_submission = Submission.objects.filter(
                    student=user,
                    lesson=lesson
                ).exclude(status='rejected').first()
                
                if existing_submission:
                    # Обновляем существующий submission
                    existing_submission.code = code
                    existing_submission.output = output
                    existing_submission.error = error
                    existing_submission.passed_auto_check = True
                    # Если был approved, сбрасываем статус на pending для повторной проверки
                    if existing_submission.status == 'approved':
                        existing_submission.status = 'pending'
                        existing_submission.reviewed_by = None
                        existing_submission.reviewed_at = None
                        existing_submission.admin_comment = None
                    existing_submission.save()
                    submission = existing_submission
                else:
                    # Создаем новый submission
                    submission = Submission.objects.create(
                        student=user,
                        lesson=lesson,
                        code=code,
                        output=output,
                        error=error,
                        passed_auto_check=True,
                        status='pending'
                    )
                
                return Response({
                    'passed': True,
                    'message': 'Challenge пройден! Задание отправлено на проверку админу.',
                    'expected': expected_output,
                    'actual': output,
                    'submission_id': submission.id,
                })
            else:
                # Код не прошел проверку - НЕ создаем Submission
                return Response({
                    'passed': False,
                    'message': 'Challenge не пройден. Проверьте код и попробуйте снова.',
                    'expected': expected_output,
                    'actual': output,
                })
        else:
            # Challenge есть, но нет expected_output - создаем Submission без проверки
            # Проверяем, есть ли уже submission для этого ученика и урока (pending или approved)
            existing_submission = Submission.objects.filter(
                student=user,
                lesson=lesson
            ).exclude(status='rejected').first()
            
            if existing_submission:
                # Обновляем существующий submission
                existing_submission.code = code
                existing_submission.output = output
                existing_submission.error = error
                existing_submission.passed_auto_check = True
                if existing_submission.status == 'approved':
                    existing_submission.status = 'pending'
                    existing_submission.reviewed_by = None
                    existing_submission.reviewed_at = None
                    existing_submission.admin_comment = None
                existing_submission.save()
                submission = existing_submission
            else:
                # Создаем новый submission
                submission = Submission.objects.create(
                    student=user,
                    lesson=lesson,
                    code=code,
                    output=output,
                    error=error,
                    passed_auto_check=True,  # Нет ожидаемого вывода, считаем успешным
                    status='pending'
                )
            
            return Response({
                'passed': True,
                'message': 'Код выполнен успешно. Задание отправлено на проверку админу.',
                'output': output,
                'submission_id': submission.id,
            })
    
    # Если нет challenge, создаем Submission без проверки
    # Проверяем, есть ли уже submission для этого ученика и урока (pending или approved)
    existing_submission = Submission.objects.filter(
        student=user,
        lesson=lesson
    ).exclude(status='rejected').first()
    
    if existing_submission:
        # Обновляем существующий submission
        existing_submission.code = code
        existing_submission.output = output
        existing_submission.error = error
        existing_submission.passed_auto_check = True
        if existing_submission.status == 'approved':
            existing_submission.status = 'pending'
            existing_submission.reviewed_by = None
            existing_submission.reviewed_at = None
            existing_submission.admin_comment = None
        existing_submission.save()
        submission = existing_submission
    else:
        # Создаем новый submission
        submission = Submission.objects.create(
            student=user,
            lesson=lesson,
            code=code,
            output=output,
            error=error,
            passed_auto_check=True,  # Нет challenge, считаем успешным
            status='pending'
        )
    
    return Response({
        'passed': True,
        'message': 'Код выполнен успешно. Задание отправлено на проверку админу.',
        'output': output,
        'submission_id': submission.id,
    })


class StudentLessonViewSet(viewsets.ModelViewSet):
    """ViewSet для CRUD операций с индивидуальными уроками учеников"""
    queryset = StudentLesson.objects.all()
    serializer_class = StudentLessonSerializer
    permission_classes = [AllowAny]  # Разрешаем GET без аутентификации
    
    def get_queryset(self):
        queryset = StudentLesson.objects.all()
        student_id = self.request.query_params.get('student', None)
        lesson_id = self.request.query_params.get('lesson', None)
        
        # Приоритет: если передан student_id в query params, используем его
        # Иначе, если пользователь аутентифицирован и является студентом, используем его ID
        if student_id:
            # Преобразуем student_id в число, если это возможно
            try:
                student_id_int = int(student_id)
                queryset = queryset.filter(student_id=student_id_int)
            except (ValueError, TypeError):
                # Если не удалось преобразовать, пробуем как строку (для UUID или других форматов)
                queryset = queryset.filter(student_id=student_id)
        elif self.request.user.is_authenticated and hasattr(self.request.user, 'role') and self.request.user.role == 'student':
            # Если student_id не передан, но пользователь аутентифицирован как студент, используем его ID
            queryset = queryset.filter(student=self.request.user)
        
        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)
        
        return queryset.select_related('student', 'lesson')
    
    @action(detail=True, methods=['post'])
    def unlock(self, request, pk=None):
        """Разблокировать урок для ученика"""
        student_lesson = self.get_object()
        student_lesson.is_unlocked = True
        student_lesson.save()  # save() автоматически синхронизирует с UserProgress.unlocked_lesson_ids
        
        serializer = self.get_serializer(student_lesson)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Отметить урок как завершенный"""
        student_lesson = self.get_object()
        student_lesson.is_completed = True
        student_lesson.completed_at = timezone.now()
        student_lesson.save()
        
        # Синхронизируем с UserProgress
        try:
            progress = UserProgress.objects.get(
                user=student_lesson.student,
                course=student_lesson.lesson.course
            )
            # Добавляем в completed_lesson_ids
            completed_ids = progress.completed_lesson_ids or []
            if student_lesson.lesson.id not in completed_ids:
                completed_ids.append(student_lesson.lesson.id)
                progress.completed_lesson_ids = completed_ids
            
            # Добавляем в unlocked_lesson_ids (если еще не там)
            unlocked_ids = progress.unlocked_lesson_ids or []
            if student_lesson.lesson.id not in unlocked_ids:
                unlocked_ids.append(student_lesson.lesson.id)
                progress.unlocked_lesson_ids = unlocked_ids
            
            progress.current_lesson_id = student_lesson.lesson.id
            progress.save()
        except UserProgress.DoesNotExist:
            UserProgress.objects.create(
                user=student_lesson.student,
                course=student_lesson.lesson.course,
                completed_lesson_ids=[student_lesson.lesson.id],
                unlocked_lesson_ids=[student_lesson.lesson.id],
                current_lesson_id=student_lesson.lesson.id
            )
        
        serializer = self.get_serializer(student_lesson)
        return Response(serializer.data)


class StudentChallengeViewSet(viewsets.ModelViewSet):
    """ViewSet для CRUD операций с индивидуальными заданиями учеников"""
    queryset = StudentChallenge.objects.all()
    serializer_class = StudentChallengeSerializer
    permission_classes = [AllowAny]  # Разрешаем GET без аутентификации
    
    def get_queryset(self):
        queryset = StudentChallenge.objects.all()
        student_id = self.request.query_params.get('student', None)
        lesson_id = self.request.query_params.get('lesson', None)
        
        # Приоритет: если передан student_id в query params, используем его
        # Иначе, если пользователь аутентифицирован и является студентом, используем его ID
        if student_id:
            # Преобразуем student_id в число, если это возможно
            try:
                student_id_int = int(student_id)
                queryset = queryset.filter(student_id=student_id_int)
            except (ValueError, TypeError):
                # Если не удалось преобразовать, пробуем как строку (для UUID или других форматов)
                queryset = queryset.filter(student_id=student_id)
        elif self.request.user.is_authenticated and hasattr(self.request.user, 'role') and self.request.user.role == 'student':
            # Если student_id не передан, но пользователь аутентифицирован как студент, используем его ID
            queryset = queryset.filter(student=self.request.user)
        
        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)
        
        return queryset.select_related('student', 'lesson')


class SubmissionViewSet(viewsets.ModelViewSet):
    """ViewSet для CRUD операций с отправленными заданиями"""
    queryset = Submission.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SubmissionCreateSerializer
        return SubmissionSerializer
    
    def get_queryset(self):
        queryset = Submission.objects.all()
        student_id = self.request.query_params.get('student', None)
        lesson_id = self.request.query_params.get('lesson', None)
        status_filter = self.request.query_params.get('status', None)
        
        # Если пользователь - студент, показываем только его отправки
        if self.request.user.is_authenticated and hasattr(self.request.user, 'role') and self.request.user.role == 'student':
            queryset = queryset.filter(student=self.request.user)
        elif student_id:
            queryset = queryset.filter(student_id=student_id)
        
        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.select_related('student', 'lesson', 'reviewed_by')
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Одобрить задание (только админ/учитель)"""
        if request.user.role not in ['admin', 'teacher']:
            return Response(
                {'error': 'Только админ или учитель могут одобрять задания'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        submission = self.get_object()
        admin_comment = request.data.get('admin_comment', '')
        
        submission.status = 'approved'
        submission.admin_comment = admin_comment
        submission.reviewed_by = request.user
        submission.reviewed_at = timezone.now()
        submission.save()
        
        # Разблокируем следующий урок для ученика
        lesson = submission.lesson
        course = lesson.course
        
        # Находим следующий урок
        next_lesson = Lesson.objects.filter(
            course=course,
            order=lesson.order + 1
        ).first()
        
        if next_lesson:
            student_lesson, created = StudentLesson.objects.get_or_create(
                student=submission.student,
                lesson=next_lesson,
                defaults={'is_unlocked': True}
            )
            if not created:
                student_lesson.is_unlocked = True
                student_lesson.save()
        
        # Отмечаем текущий урок как завершенный
        student_lesson_current, _ = StudentLesson.objects.get_or_create(
            student=submission.student,
            lesson=lesson
        )
        student_lesson_current.is_completed = True
        student_lesson_current.completed_at = timezone.now()
        student_lesson_current.save()
        
        serializer = self.get_serializer(submission)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Отклонить задание (только админ/учитель)"""
        if request.user.role not in ['admin', 'teacher']:
            return Response(
                {'error': 'Только админ или учитель могут отклонять задания'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        submission = self.get_object()
        admin_comment = request.data.get('admin_comment', '')
        
        submission.status = 'rejected'
        submission.admin_comment = admin_comment
        submission.reviewed_by = request.user
        submission.reviewed_at = timezone.now()
        submission.save()
        
        serializer = self.get_serializer(submission)
        return Response(serializer.data)

