"""crud initpy"""

from app.crud.user import get_user_by_id, get_user_by_email, create_user
from app.crud.folder import get_folders_by_user
from app.crud.folder import get_folder_by_id, create_folder
from app.crud.note import get_notes_by_user, get_note_by_id, create_note

__all__ = [
    "get_user_by_id",
    "get_user_by_email",
    "create_user",
    "get_folders_by_user",
    "get_folder_by_id",
    "create_folder",
    "get_notes_by_user",
    "get_note_by_id",
    "create_note",
]  # Экспорт основных CRUD функций для прямого импорта
