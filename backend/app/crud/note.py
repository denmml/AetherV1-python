"""crud note"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate


async def get_notes_by_user(
    db: AsyncSession, user_id: int, folder_id: Optional[int] = None
) -> List[Note]:
    query = select(Note).where(Note.user_id == user_id)
    if folder_id is not None:
        query = query.where(Note.folder_id == folder_id)
    result = await db.execute(query)
    return list(result.scalars().all())  # Получить список заметок пользователя


async def get_note_by_id(
    db: AsyncSession, note_id: int, user_id: int
) -> Optional[Note]:
    result = await db.execute(
        select(Note).where(Note.id == note_id, Note.user_id == user_id)
    )
    return result.scalars().first()  # Получить конкретную заметку


async def create_note(db: AsyncSession, note: NoteCreate,
                      user_id: int) -> Note:
    db_note = Note(**note.model_dump(), user_id=user_id)
    db.add(db_note)
    await db.commit()
    await db.refresh(db_note)
    return db_note  # Создать заметку


async def update_note(
    db: AsyncSession, note_id: int, note_data: NoteUpdate, user_id: int
) -> Optional[Note]:
    db_note = await get_note_by_id(db, note_id, user_id)
    if not db_note:
        return None

    update_dict = note_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(db_note, key, value)

    await db.commit()
    await db.refresh(db_note)
    return db_note  # Обновить заметку


async def delete_note(db: AsyncSession, note_id: int, user_id: int) -> bool:
    db_note = await get_note_by_id(db, note_id, user_id)
    if not db_note:
        return False
    await db.delete(db_note)
    await db.commit()
    return True  # Удалить заметку
