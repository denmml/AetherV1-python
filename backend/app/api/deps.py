"""deps.py"""

from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.core.security import decode_access_token
from app.crud.user import get_user_by_id
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="api/v1/auth/login"
)  # Схема извлечения Bearer токена


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session  # Генератор асинхронной сессии базы данных


async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception  # Токен невалиден или просрочен

    user_id_raw = payload.get("sub")
    if user_id_raw is None:
        raise credentials_exception  # В токене отсутствует ID пользователя

    try:
        user_id = int(user_id_raw)
    except (ValueError, TypeError):
        raise credentials_exception  
    # Явное приведение к int для валидации и Pylance
    user = await get_user_by_id(db, user_id=user_id)
    if user is None:
        raise credentials_exception  # Пользователь не найден в базе

    return user  # Вернуть текущего авторизованного пользователя
