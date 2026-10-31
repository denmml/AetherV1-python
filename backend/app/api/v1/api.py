"""api.py"""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, folders, graph, links, audio

api_router = APIRouter()

# Подключаем роутеры аутентификации (регистрация, вход, токены доступа)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Подключаем роутеры управления папками для категоризации записей
api_router.include_router(folders.router, prefix="/folders", tags=["folders"])

# Подключаем эндпоинт получения полной структуры 
# графа знаний (Obsidian-style визуализация)
api_router.include_router(graph.router)

# Подключаем эндпоинты ручного создания и удаления связей(линий)между заметками
api_router.include_router(links.router)

# Подключаем эндпоинты загрузки аудио и транскрипции через OpenAI Whisper API
api_router.include_router(audio.router)
