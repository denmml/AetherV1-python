"""api.py"""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, folders, graph, links, audio, notes

api_router = APIRouter()

# Аутентификация (регистрация, вход, токены доступа)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Управление папками
api_router.include_router(folders.router, prefix="/folders", tags=["folders"])

# Граф знаний (Obsidian-style визуализация)
api_router.include_router(graph.router)

# Ручное создание и удаление связей между заметками
api_router.include_router(links.router)

# Загрузка аудио и транскрипция через OpenAI Whisper API
api_router.include_router(audio.router)

# CRUD заметок / конспектов
api_router.include_router(notes.router)
