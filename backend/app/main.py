from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0",
    description="A modern TODO application API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Configure CORS - Production configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://todo-theta-azure-89.vercel.app",  # Vercel production
    ],
    allow_credentials=True,  # Allow credentials for JWT tokens
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint - health check."""
    return {
        "message": "TODO App API",
        "version": "1.0.0",
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# Include routers
from app.api.v1 import auth, todos, categories, tags

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(todos.router, prefix="/api/v1/todos", tags=["Todos"])
app.include_router(categories.router, prefix="/api/v1/categories", tags=["Categories"])
app.include_router(tags.router, prefix="/api/v1/tags", tags=["Tags"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
