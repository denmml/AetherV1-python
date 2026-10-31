"""graph.py"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from app.models.note import Note
from app.models.note_link import NoteLink

# Создаем роутер с префиксом /graph и группировкой в Swagger UI
router = APIRouter(prefix="/graph", tags=["Graph"])


@router.get("/")
async def get_knowledge_graph(db: AsyncSession = Depends(get_db)):
    """
    Получение полной структуры графа знаний.
    Возвращает словари с узлами (nodes) и связями (edges) для визуализации.
    """
    # 1. Извлекаем все заметки (вершины графа) из базы данных
    notes_result = await db.execute(select(Note))
    notes = notes_result.scalars().all()

    # 2. Извлекаем все связи (ребра графа) между заметками
    links_result = await db.execute(select(NoteLink))
    links = links_result.scalars().all()

    # 3. Преобразуем SQLAlchemy-модели заметок в легкие словари для клиента
    nodes_data = [
        {"id": note.id, "title": note.title,
         "content": note.content} for note in notes
    ]

    # 4. Преобразуем связи в пары source -> target для построения линий
    edges_data = [
        {"id": link.id, "source": link.source_note_id,
         "target": link.target_note_id}
        for link in links
    ]

    return {"nodes": nodes_data, "edges": edges_data}
