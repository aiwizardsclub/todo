# TODO App - Backend API

FastAPI backend for the TODO application with PostgreSQL database.

## Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Database**: PostgreSQL (NeonTech)
- **ORM**: SQLAlchemy 2.0 (Async)
- **Authentication**: JWT (python-jose)
- **Password Hashing**: Bcrypt (passlib)
- **Migrations**: Alembic
- **Cache**: Redis
- **Validation**: Pydantic v2

## Getting Started

### Prerequisites

- Python 3.11 or higher
- PostgreSQL database (or NeonTech account)
- Redis (optional for caching)

### Installation

```bash
# Install dependencies with pip
pip install -r requirements.txt

# OR install with Poetry (recommended)
poetry install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
# - DATABASE_URL: Your PostgreSQL connection string
# - SECRET_KEY: Generate a secure secret key
# - CORS_ORIGINS: Your frontend URL
```

### Database Setup

```bash
# Run database migrations
alembic upgrade head

# Create a new migration (after model changes)
alembic revision --autogenerate -m "description"
```

### Development

```bash
# Run development server
uvicorn app.main:app --reload

# OR with Python
python -m app.main

# OR with Poetry
poetry run uvicorn app.main:app --reload

# API will be available at http://localhost:8000
# API docs at http://localhost:8000/api/docs
# ReDoc at http://localhost:8000/api/redoc
```

### Testing

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=app tests/

# Run tests in watch mode
pytest-watch
```

### Code Quality

```bash
# Format code with Black
black app tests

# Lint with Ruff
ruff check app tests

# Type checking with mypy
mypy app
```

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py              # Dependencies (auth, db)
│   │   └── v1/
│   │       ├── auth.py          # Authentication endpoints
│   │       ├── todos.py         # TODO endpoints
│   │       ├── categories.py   # Category endpoints
│   │       └── tags.py          # Tag endpoints
│   ├── core/
│   │   ├── config.py           # Settings & configuration
│   │   ├── security.py         # JWT & password utilities
│   │   └── database.py         # Database connection
│   ├── models/
│   │   ├── user.py             # User model
│   │   ├── todo.py             # TODO model
│   │   └── ...                 # Other models
│   ├── schemas/
│   │   ├── user.py             # User Pydantic schemas
│   │   ├── todo.py             # TODO Pydantic schemas
│   │   └── ...                 # Other schemas
│   ├── services/               # Business logic layer
│   ├── repositories/           # Data access layer
│   └── main.py                 # FastAPI application
├── alembic/
│   ├── versions/               # Migration files
│   ├── env.py                  # Alembic environment
│   └── script.py.mako          # Migration template
├── tests/
│   ├── test_auth.py
│   ├── test_todos.py
│   └── ...
├── alembic.ini                 # Alembic config
├── pyproject.toml              # Poetry config
└── requirements.txt            # Pip requirements
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token

### TODOs
- `GET /api/v1/todos` - List todos (with filters)
- `POST /api/v1/todos` - Create todo
- `GET /api/v1/todos/{id}` - Get todo
- `PUT /api/v1/todos/{id}` - Update todo
- `DELETE /api/v1/todos/{id}` - Delete todo
- `PATCH /api/v1/todos/{id}/status` - Toggle todo status

### Categories
- `GET /api/v1/categories` - List categories
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/{id}` - Update category
- `DELETE /api/v1/categories/{id}` - Delete category

### Tags
- `GET /api/v1/tags` - List tags
- `POST /api/v1/tags` - Create tag
- `DELETE /api/v1/tags/{id}` - Delete tag

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - Secret key for JWT signing
- `CORS_ORIGINS` - Allowed CORS origins (frontend URL)

### Optional Variables
- `DEBUG` - Enable debug mode (default: True)
- `REDIS_URL` - Redis connection string
- `ACCESS_TOKEN_EXPIRE_MINUTES` - JWT access token expiration
- `REFRESH_TOKEN_EXPIRE_DAYS` - JWT refresh token expiration

## Deployment

This backend is configured for deployment on Railway.

### Railway Deployment

1. Push code to GitHub
2. Connect Railway to your repository
3. Set environment variables in Railway dashboard
4. Deploy!

Railway will automatically:
- Detect Python and install dependencies
- Run database migrations
- Start the server with Uvicorn

### Manual Deployment

```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start server with Gunicorn (production)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## Features

- ✅ FastAPI framework with automatic OpenAPI docs
- ✅ Async SQLAlchemy 2.0 for database operations
- ✅ JWT authentication with refresh tokens
- ✅ Pydantic v2 for data validation
- ✅ Alembic for database migrations
- ✅ CORS middleware configured
- ✅ Type hints throughout
- 🔜 User registration & login
- 🔜 TODO CRUD operations
- 🔜 Categories & tags
- 🔜 Advanced filtering
- 🔜 Unit & integration tests

## License

MIT
