"""graph.py"""

from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.models.note import Note
from app.models.note_link import NoteLink
from app.models.user import User

router = APIRouter(prefix="/graph", tags=["Graph"])


@router.get("/")
async def get_knowledge_graph(
    folder_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Получение структуры графа знаний пользователя.
    Возвращает узлы (nodes) и связи (edges), поддерживая фильтрацию по папке/холсту.
    """
    notes_query = select(Note)
    if current_user:
        notes_query = notes_query.where(Note.user_id == current_user.id)
    if folder_id is not None:
        notes_query = notes_query.where(Note.folder_id == folder_id)

    notes_result = await db.execute(notes_query)
    notes = notes_result.scalars().all()
    note_ids = {note.id for note in notes}

    # Извлекаем связи, соединяющие только эти заметки
    links_result = await db.execute(select(NoteLink))
    all_links = links_result.scalars().all()
    links = [
        link for link in all_links
        if link.source_note_id in note_ids and link.target_note_id in note_ids
    ]

    nodes_data = [
        {
            "id": note.id,
            "title": note.title,
            "content": note.content or "",
            "folder_id": note.folder_id,
        }
        for note in notes
    ]

    edges_data = [
        {
            "id": link.id,
            "source": link.source_note_id,
            "target": link.target_note_id,
        }
        for link in links
    ]

    return {"nodes": nodes_data, "edges": edges_data}
