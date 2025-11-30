# Roblox Academy

An educational platform for learning Roblox Lua programming through interactive courses, hands-on coding challenges, and personalized learning paths.

## 🎯 Overview

Roblox Academy is a full-stack web application designed to teach Roblox game development using Lua scripting. The platform provides students with structured courses, interactive code editors, and personalized assignments that are reviewed by teachers and administrators.

## ✨ Features

### For Students
- **Interactive Courses**: Structured learning paths with video lessons, PDF materials, and coding challenges
- **Live Code Editor**: Built-in Monaco Editor with Lua syntax highlighting and code execution
- **Progress Tracking**: Track your learning progress, XP points, and completed lessons
- **Personalized Learning**: Individual assignments and materials assigned by teachers
- **Code Auto-save**: Your code is automatically saved to localStorage
- **Submission System**: Submit your code for teacher review and feedback

### For Teachers & Administrators
- **Course Management**: Create and manage courses, lessons, and materials
- **Student Progress Monitoring**: View student progress and submissions
- **Assignment Review**: Review and approve/reject student code submissions
- **Individual Assignments**: Create personalized challenges for specific students
- **Material Management**: Upload PDFs, videos, and other learning materials
- **Access Control**: Unlock lessons and materials based on student progress

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Django 5.0+ with Django REST Framework
- SQLite database (can be switched to PostgreSQL for production)
- Token-based authentication
- CORS enabled for frontend integration
- Swagger/OpenAPI documentation

**Frontend:**
- Next.js 16 with App Router
- TypeScript for type safety
- Redux Toolkit with RTK Query for state management
- Monaco Editor for code editing
- Fengari for Lua code execution in the browser
- Tailwind CSS for styling
- shadcn/ui component library

**DevOps:**
- Docker & Docker Compose for containerization
- Separate containers for backend and frontend
- Volume management for media and static files

## 📁 Project Structure

```
ROBLOX_ACADEMY/
├── backend/                 # Django REST API
│   ├── api/                # Main app with models, views, serializers
│   ├── roblox_academy/     # Django project settings
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # Next.js application
│   ├── app/                # Next.js app router pages
│   ├── components/         # React components
│   ├── lib/                # Utilities, API slices, Lua executor
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml      # Docker orchestration
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Docker (version 20.10+)
- Docker Compose (version 2.0+)

### Running with Docker

1. **Clone the repository** (if applicable)
   ```bash
   git clone <repository-url>
   cd ROBLOX_ACADEMY
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/
   - Django Admin: http://localhost:8000/admin/
   - API Documentation: http://localhost:8000/api/docs/

4. **Stop services**
   ```bash
   docker-compose down
   ```

### Local Development Setup

#### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py load_initial_data  # Load sample data
python manage.py runserver
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 📚 API Documentation

The API is fully documented with Swagger/OpenAPI. Access it at `http://localhost:8000/api/docs/` when the backend is running.

### Key Endpoints

**Authentication:**
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/me/` - Get current user

**Courses:**
- `GET /api/courses/` - List all courses
- `GET /api/courses/{id}/` - Get course details with lessons
- `POST /api/courses/` - Create course (admin only)

**Lessons:**
- `GET /api/lessons/` - List lessons
- `GET /api/lessons/{id}/` - Get lesson details
- `GET /api/lessons/?course={id}` - Filter lessons by course

**Student Progress:**
- `GET /api/progress/` - Get user progress
- `POST /api/progress/complete_lesson/` - Mark lesson as completed

**Submissions:**
- `GET /api/submissions/` - List code submissions
- `POST /api/submissions/{id}/approve/` - Approve submission (admin)
- `POST /api/submissions/{id}/reject/` - Reject submission (admin)

**Code Checking:**
- `POST /api/check_code/` - Validate Lua code and create submission

For detailed API examples, see `backend/API_EXAMPLES.md`.

## 🎓 Learning Features

### Interactive Code Editor
- Monaco Editor with Lua syntax highlighting
- Real-time code execution using Fengari
- Auto-save functionality
- Code validation and error handling

### Course Structure
- **Courses**: Top-level learning paths
- **Lessons**: Individual learning units with:
  - Video content
  - PDF materials
  - Text content (Markdown)
  - Coding challenges
- **Challenges**: Interactive coding assignments with:
  - Instructions
  - Initial code template
  - Expected output validation
  - Hints for students

### Progress System
- XP points for completed lessons
- Level progression
- Lesson unlocking based on completion
- Individual student progress tracking

## 🔐 Authentication & Authorization

- Token-based authentication
- Role-based access control (Student, Teacher, Admin)
- Protected routes on frontend
- API endpoints with permission classes

Default test user (from `load_initial_data`):
- Username: `alex`
- Password: `password123`
- Role: Student

## 🛠️ Development

### Backend Commands

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load initial data
python manage.py load_initial_data

# Collect static files
python manage.py collectstatic
```

### Frontend Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

### Docker Commands

```bash
# View logs
docker-compose logs -f

# Execute commands in container
docker-compose exec backend python manage.py migrate
docker-compose exec frontend npm install

# Rebuild specific service
docker-compose up --build backend
```

## 📝 Environment Variables

### Backend (docker-compose.yml)
```yaml
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1,backend
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://frontend:3000
```

### Frontend
```yaml
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 🗄️ Database Models

### Core Models
- **User**: Custom user model with roles (student, teacher, admin)
- **Course**: Learning course container
- **Lesson**: Individual lesson with content and challenges
- **Challenge**: Coding assignment with validation
- **Material**: Learning materials (PDF, video, text, links)

### Student-Specific Models
- **StudentLesson**: Individual lesson access for students
- **StudentChallenge**: Personalized assignments
- **StudentMaterial**: Material access control
- **Submission**: Code submissions for review
- **UserProgress**: Overall student progress tracking

## 🐛 Troubleshooting

### Port conflicts
Change ports in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Frontend
  - "8001:8000"  # Backend
```

### Database issues
```bash
docker-compose exec backend python manage.py migrate
```

### Static files
```bash
docker-compose exec backend python manage.py collectstatic --noinput
```

### Frontend build errors
Check that all dependencies are in `package-lock.json`:
```bash
cd frontend
npm install
```

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue in the repository.

---

**Built with ❤️ for Roblox developers**

