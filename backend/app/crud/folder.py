"""crud folder"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.folder import Folder
from app.schemas.folder import FolderCreate, FolderUpdate


async def create_folder(db: AsyncSession, folder: FolderCreate,
                        user_id: int) -> Folder:
    db_folder = Folder(
        **folder.model_dump(), user_id=user_id
    )  # Создание папки с явным привязыванием user_id
    db.add(db_folder)
    await db.commit()  # Фиксация записи в БД
    await db.refresh(db_folder)  # Обновление объекта (получение id,created_at)
    return db_folder


async def get_folders_by_user(db: AsyncSession, user_id: int) -> List[Folder]:
    result = await db.execute(
        select(Folder).where(Folder.user_id == user_id)
    )  # Выборка только папок владельца
    return list(result.scalars().all())  # Приведение к списку сущностей Folder


async def get_folder_by_id(
    db: AsyncSession, folder_id: int, user_id: int
) -> Optional[Folder]:
    result = await db.execute(
        select(Folder).where(
            Folder.id == folder_id, Folder.user_id == user_id
        )  # Защита от IDOR: фильтр по ID и user_id
    )
    return result.scalars().first()


async def update_folder(
    db: AsyncSession, folder_id: int, folder: FolderUpdate, user_id: int
) -> Optional[Folder]:
    db_folder = await get_folder_by_id(
        db, folder_id, user_id
    )  # Проверка существования и прав владения
    if not db_folder:
        return None

    update_data = folder.model_dump(
        exclude_unset=True
    )  # Берём только переданные поля (для частичного обновления)
    for key, value in update_data.items():
        setattr(db_folder, key, value)

    await db.commit()
    await db.refresh(db_folder)
    return db_folder


async def delete_folder(db: AsyncSession, folder_id: int,
                        user_id: int) -> bool:
    db_folder = await get_folder_by_id(
        db, folder_id, user_id
    )  # Проверка наличия перед удалением
    if not db_folder:
        return False

    await db.delete(db_folder)
    await db.commit()  # Подтверждение удаления из БД
    return True
