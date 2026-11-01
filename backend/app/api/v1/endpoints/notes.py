"""notes.py — CRUD endpoints for Notes."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.crud.note import (
    get_notes_by_user,
    get_note_by_id,
    create_note,
    update_note,
    delete_note,
)
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse
from app.models.user import User

router = APIRouter(prefix="/notes", tags=["Notes"])


def _serialize(note) -> dict:
    return {
        "id": note.id,
        "title": note.title,
        "content": note.content or "",
        "folder_id": note.folder_id,
        "user_id": note.user_id,
        "is_starred": note.is_starred,
        "created_at": note.created_at.isoformat() if note.created_at else None,
        "updated_at": note.updated_at.isoformat() if note.updated_at else None,
    }


@router.get("/", summary="List all notes for the current user")
async def list_notes(
    folder_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notes = await get_notes_by_user(db, user_id=current_user.id, folder_id=folder_id)
    return [_serialize(n) for n in notes]


@router.post("/", summary="Create a new note", status_code=status.HTTP_201_CREATED)
async def create_new_note(
    note_in: NoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = await create_note(db, note=note_in, user_id=current_user.id)
    return _serialize(note)


@router.get("/{note_id}", summary="Get a single note")
async def get_note(
    note_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = await get_note_by_id(db, note_id=note_id, user_id=current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")
    return _serialize(note)


@router.patch("/{note_id}", summary="Update a note")
async def update_existing_note(
    note_id: int,
    note_data: NoteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = await update_note(
        db, note_id=note_id, note_data=note_data, user_id=current_user.id
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found.")
    return _serialize(note)


@router.delete("/{note_id}", summary="Delete a note")
async def delete_existing_note(
    note_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ok = await delete_note(db, note_id=note_id, user_id=current_user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Note not found.")
    return {"status": "deleted", "note_id": note_id}
