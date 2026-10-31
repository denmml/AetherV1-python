"""links.py"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.deps import get_db
from app.models.note import Note
from app.models.note_link import NoteLink

router = APIRouter(prefix="/links", tags=["Note Links"])


class LinkCreate(BaseModel):
    source_note_id: int
    target_note_id: int


@router.post("/")
async def create_note_link(link_in: LinkCreate,
                           db: AsyncSession = Depends(get_db)):
    # Проверка целостности: обе соединяемые заметки должны существовать в базе
    source = await db.get(Note, link_in.source_note_id)
    target = await db.get(Note, link_in.target_note_id)

    if not source or not target:
        raise HTTPException(status_code=404,
                            detail="Одна или обе заметки не найдены")

# Предотвращение дублирования связей между теми же узлами в том же направлении
    existing = await db.execute(
        select(NoteLink).where(
            NoteLink.source_note_id == link_in.source_note_id,
            NoteLink.target_note_id == link_in.target_note_id,
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400,
                            detail="Такая связь уже существует")

    # Сохранение новой связи в базу данных
    new_link = NoteLink(
        source_note_id=link_in.source_note_id,
        target_note_id=link_in.target_note_id
    )
    db.add(new_link)
    await db.commit()
    await db.refresh(new_link)

    return {
        "status": "success",
        "link_id": new_link.id,
        "source": new_link.source_note_id,
        "target": new_link.target_note_id,
    }


@router.delete("/{link_id}")
async def delete_note_link(link_id: int, db: AsyncSession = Depends(get_db)):
    """
    Удаление существующей связи (стирание линии на блок-схеме).
    """
    link = await db.get(NoteLink, link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Связь не найдена")

    await db.delete(link)
    await db.commit()

    return {"status": "deleted", "link_id": link_id}
