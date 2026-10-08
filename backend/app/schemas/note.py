"""schemas note"""

from pydantic import BaseModel
from typing import Optional


class NoteBase(BaseModel):
    title: str
    content: Optional[str] = None
    folder_id: Optional[int] = None  # Базовая схема заметки


class NoteCreate(NoteBase):
    pass  # Схема для создания заметки


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    folder_id: Optional[int] = None  # Схема для обновления заметки


class NoteResponse(NoteBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True  # Схема для ответа API
