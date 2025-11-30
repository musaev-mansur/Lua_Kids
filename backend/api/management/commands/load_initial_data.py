"""
Команда для загрузки начальных данных
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Course, Lesson, Challenge

User = get_user_model()


class Command(BaseCommand):
    help = 'Загружает начальные данные для Roblox Academy'

    def handle(self, *args, **options):
        self.stdout.write('Загрузка начальных данных...')
        
        # Создаем пользователя
        user, created = User.objects.get_or_create(
            username='alex',
            defaults={
                'email': 'alex@example.com',
                'first_name': 'Alex',
                'role': 'student',
                'level': 3,
                'xp': 450,
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Создан пользователь: {user.username} (ID: {user.id})'))
        else:
            self.stdout.write(f'Пользователь {user.username} уже существует (ID: {user.id})')
        
        # Создаем курс
        course, created = Course.objects.get_or_create(
            id='roblox-lua-101',
            defaults={
                'title': 'Master Roblox Studio & Lua',
                'description': 'Learn how to build your own games in Roblox using Lua scripting. Perfect for beginners!',
                'thumbnail_url': '/placeholder.svg?height=200&width=400',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Создан курс: {course.title}'))
        else:
            self.stdout.write(f'Курс {course.title} уже существует')
        
        # Создаем уроки
        lessons_data = [
            {
                'id': 'lesson-1',
                'title': 'Introduction to Roblox Studio',
                'description': 'Learn the interface and how to move around the 3D world.',
                'order': 1,
                'duration': 10,
                'xp_reward': 50,
                'is_locked': False,
                'content': '''# Welcome to Roblox Studio!

In this lesson, we will learn the basics of the Roblox Studio interface. 

### Key Controls:
- **W, A, S, D**: Move the camera
- **Right Click + Drag**: Rotate the camera
- **Q / E**: Move Up / Down''',
                'video_url': 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'challenge': {
                    'instructions': 'Print "Hello Roblox" to the console.',
                    'initial_code': 'print("Hello World")',
                    'expected_output': 'Hello Roblox',
                }
            },
            {
                'id': 'lesson-2',
                'title': 'Your First Script',
                'description': 'Write your very first line of Lua code.',
                'order': 2,
                'duration': 15,
                'xp_reward': 100,
                'is_locked': True,
                'content': '''# Variables in Lua

Variables are like boxes where you can store data.

\`\`\`lua
local myName = "RobloxDev"
print(myName)
\`\`\`''',
                'challenge': {
                    'instructions': 'Create a variable called `score` and set it to 10. Then print it.',
                    'initial_code': '-- Write your code here\n',
                    'expected_output': '10',
                }
            },
            {
                'id': 'lesson-3',
                'title': 'Functions & Events',
                'description': 'Make things happen when players touch parts.',
                'order': 3,
                'duration': 20,
                'xp_reward': 150,
                'is_locked': True,
                'content': 'Functions allow you to reuse code...',
                'challenge': {
                    'instructions': 'Write a function that adds two numbers.',
                    'initial_code': 'function add(a, b)\n  -- return the sum\nend\n\nprint(add(5, 3))',
                    'expected_output': '8',
                }
            },
        ]
        
        for lesson_data in lessons_data:
            challenge_data = lesson_data.pop('challenge', None)
            lesson, created = Lesson.objects.get_or_create(
                id=lesson_data['id'],
                defaults={**lesson_data, 'course': course}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Создан урок: {lesson.title}'))
                if challenge_data:
                    Challenge.objects.create(lesson=lesson, **challenge_data)
            else:
                self.stdout.write(f'Урок {lesson.title} уже существует')
        
        self.stdout.write(self.style.SUCCESS('\nНачальные данные успешно загружены!'))
        self.stdout.write(f'\nПользователь для тестирования:')
        self.stdout.write(f'  Username: alex')
        self.stdout.write(f'  Password: password123')
        self.stdout.write(f'  ID: {user.id}')

