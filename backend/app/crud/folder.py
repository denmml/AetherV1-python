"""crud folder"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.folder import Folder
from app.schemas.folder import FolderCreate, FolderUpdate


async def create_folder(db: AsyncSession, folder: FolderCreate, user_id: int) -> Folder:
    folder_name = folder.name or folder.title or "Untitled Canvas"
    db_folder = Folder(name=folder_name, user_id=user_id)
    db.add(db_folder)
    await db.commit()
    await db.refresh(db_folder)
    return db_folder


async def get_folders_by_user(db: AsyncSession, user_id: int) -> List[Folder]:
    result = await db.execute(select(Folder).where(Folder.user_id == user_id))
    return list(result.scalars().all())


async def get_folder_by_id(
    db: AsyncSession, folder_id: int, user_id: int
) -> Optional[Folder]:
    result = await db.execute(
        select(Folder).where(Folder.id == folder_id, Folder.user_id == user_id)
    )
    return result.scalars().first()


async def update_folder(
    db: AsyncSession, folder_id: int, folder: FolderUpdate, user_id: int
) -> Optional[Folder]:
    db_folder = await get_folder_by_id(db, folder_id, user_id)
    if not db_folder:
        return None

    new_name = folder.name or folder.title
    if new_name is not None:
        db_folder.name = new_name

    await db.commit()
    await db.refresh(db_folder)
    return db_folder


async def delete_folder(db: AsyncSession, folder_id: int, user_id: int) -> bool:
    db_folder = await get_folder_by_id(db, folder_id, user_id)
    if not db_folder:
        return False

    await db.delete(db_folder)
    await db.commit()
    return True
