"""schemas note"""

# схема для api(pydantic)
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class NoteBase(BaseModel):
    title: str
    content: str
    folder: Optional[str] = "General"


class NoteCreate(NoteBase):
    user_id: int


class NoteResponse(NoteBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# это "защитная сетка" и валидатор данных API.
