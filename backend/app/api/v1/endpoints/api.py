"""api.py"""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, folders

api_router = APIRouter()

# Подключаем роутеры с префиксами и тегами для красивого отображения в /docs
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(folders.router, prefix="/folders", tags=["folders"])
