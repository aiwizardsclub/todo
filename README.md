# TODO Application

A modern, full-stack TODO application built with Next.js and FastAPI.

## 🚀 Features

- ✅ **User Authentication** - Secure JWT-based authentication
- ✅ **TODO Management** - Create, read, update, delete tasks
- ✅ **Categories & Tags** - Organize todos with categories and tags
- ✅ **Priority Levels** - Mark tasks as high, medium, or low priority
- ✅ **Due Dates** - Set deadlines for your tasks
- ✅ **Filtering & Sorting** - Advanced filtering by status, category, priority, and more
- 🔜 **Reminders** - Email notifications for upcoming tasks
- 🔜 **Collaboration** - Share todos with others
- 🔜 **Analytics** - Track your productivity over time

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form + Zod
- **Deployment**: Vercel

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Database**: PostgreSQL (NeonTech)
- **ORM**: SQLAlchemy 2.0 (Async)
- **Authentication**: JWT
- **Deployment**: Railway

### Infrastructure
- **Database**: NeonTech (Serverless PostgreSQL)
- **Cache**: Redis
- **Email**: Resend (for reminders)

## 📁 Project Structure

```
todo-app/
├── frontend/          # Next.js frontend application
│   ├── app/          # Next.js App Router pages
│   ├── components/   # React components
│   ├── lib/          # Utilities and API client
│   └── types/        # TypeScript type definitions
│
├── backend/          # FastAPI backend API
│   ├── app/
│   │   ├── api/     # API endpoints
│   │   ├── core/    # Config, database, security
│   │   ├── models/  # SQLAlchemy models
│   │   ├── schemas/ # Pydantic schemas
│   │   └── main.py  # FastAPI application
│   ├── alembic/     # Database migrations
│   └── tests/       # Backend tests
│
└── README.md        # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL database (or NeonTech account)
- Redis (optional)

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update NEXT_PUBLIC_API_URL in .env
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Run development server
npm run dev
```

Frontend will be available at [http://localhost:3000](http://localhost:3000)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Update .env with your database URL and secret key
# DATABASE_URL=postgresql+asyncpg://user:password@host/dbname
# SECRET_KEY=your-secret-key-here

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload
```

Backend will be available at [http://localhost:8000](http://localhost:8000)

API documentation:
- Swagger UI: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- ReDoc: [http://localhost:8000/api/redoc](http://localhost:8000/api/redoc)

## 📖 Development Guide

### Frontend Development

```bash
cd frontend

# Run dev server
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build
```

### Backend Development

```bash
cd backend

# Run with auto-reload
uvicorn app.main:app --reload

# Run tests
pytest

# Create new migration
alembic revision --autogenerate -m "description"

# Run migrations
alembic upgrade head

# Format code
black app tests

# Type check
mypy app
```

## 🚀 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL
4. Deploy!

### Backend (Railway)

1. Push code to GitHub
2. Create new project in Railway
3. Connect GitHub repository
4. Add PostgreSQL and Redis addons
5. Set environment variables:
   - `DATABASE_URL`: Automatically set by Railway
   - `SECRET_KEY`: Generate secure key
   - `CORS_ORIGINS`: Your Vercel frontend URL
   - `REDIS_URL`: Automatically set by Railway
6. Deploy!

## 📋 Release Roadmap

### Release 1.0 - MVP ✅ (In Progress)
- [x] Project setup
- [ ] User authentication
- [ ] TODO CRUD operations
- [ ] Categories & tags
- [ ] Filtering & sorting
- [ ] Testing & documentation

### Release 2.0 - Reminders 🔜
- [ ] Email notifications
- [ ] Reminder scheduling
- [ ] User preferences
- [ ] Timezone support

### Release 3.0 - Collaboration 🔜
- [ ] Share todos
- [ ] Comments system
- [ ] Activity tracking
- [ ] Permissions

### Release 4.0 - Advanced Features 🔜
- [ ] Subtasks
- [ ] Analytics dashboard
- [ ] Recurring todos
- [ ] PWA support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [NeonTech](https://neon.tech/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Status**: 🚧 Under Development - Release 1.0 MVP in progress

For detailed setup instructions, see the README files in the `frontend/` and `backend/` directories.
