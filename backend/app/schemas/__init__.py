"""schemas init py"""

from app.schemas.user import UserCreate, UserResponse
from app.schemas.folder import FolderCreate, FolderUpdate, FolderResponse
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse

__all__ = [
    "UserCreate",
    "UserResponse",
    "FolderCreate",
    "FolderUpdate",
    "FolderResponse",
    "NoteCreate",
    "NoteUpdate",
    "NoteResponse",
]  # Экспорт всех схем для удобного импорта
