"""app folders.py"""

from typing import Sequence
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import (
    get_db,
    get_current_user,
)  # Зависимости внедрения сессии БД и JWT-юзера
from app.crud.folder import (
    create_folder,
    get_folders_by_user,
    get_folder_by_id,
    update_folder,
    delete_folder,
)
from app.schemas.folder import FolderCreate, FolderUpdate, FolderResponse
from app.models.user import User

router = APIRouter()  # Роутер модуля управления папками


@router.post("/", response_model=FolderResponse,
             status_code=status.HTTP_201_CREATED)
async def create_new_folder(
    folder_in: FolderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await create_folder(
        db, folder=folder_in, user_id=current_user.id
    )  # Создать папку для тек. пользователя


@router.get("/", response_model=Sequence[FolderResponse])
async def read_folders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_folders_by_user(
        db, user_id=current_user.id
    )  # Список папок пользователя (Sequence для Pylance)


@router.get("/{folder_id}", response_model=FolderResponse)
async def read_folder(
    folder_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = await get_folder_by_id(db, folder_id=folder_id,
                                    user_id=current_user.id)
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found"
        )  # 404 если папка чужая/нет
    return folder


@router.put("/{folder_id}", response_model=FolderResponse)
async def update_existing_folder(
    folder_id: int,
    folder_in: FolderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    folder = await update_folder(
        db, folder_id=folder_id, folder=folder_in, user_id=current_user.id
    )
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found"
        )  # 404 при ошибке обновления
    return folder


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_folder(
    folder_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = await delete_folder(db, folder_id=folder_id,
                                  user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found"
        )  # 404 при ошибке удаления
