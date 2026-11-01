"""user.py schemas"""

from typing import Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class UserCreate(UserBase):
    password: str  # Схема для регистрации пользователя


class UserResponse(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True  # Схема для ответа данные пользователя
