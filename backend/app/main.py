"""main.py"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints.api import api_router

# Инициализация основного приложения FastAPI
app = FastAPI(
    title="Aether PKM",
    version="0.1.0-mvp",
    openapi_url="/api/v1/openapi.json",  # Путь к OpenAPI схеме
)

# Настройка CORS (разрешает фронтенду обращаться к бэкенду)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],
    # На продакшене заменяется на список
    # конкретных доменов (напр. ["http://localhost:3000"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение единого роутера API версии v1 (auth, folders и будущие модули)
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["system"])
async def root():
    """Корневой эндпоинт проверки работоспособности сервиса."""
    return {"message": "Welcome to Knowledge Vault API"}


@app.get("/health", tags=["system"])
async def health_check():
    """Эндпоинт для мониторинга статуса сервера (Health Check)."""
    return {"status": "ok"}
