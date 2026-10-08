"""folder.py schemas"""

from typing import Optional
from pydantic import BaseModel, ConfigDict, model_validator


class FolderBase(BaseModel):
    title: str  # Внешний мир видит только title

    @property
    def name(self) -> str:
        return self.title


class FolderCreate(FolderBase):
    pass


class FolderUpdate(BaseModel):
    title: Optional[str] = None

    @property
    def name(self) -> Optional[str]:
        return self.title


class FolderResponse(FolderBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def map_name_to_title(cls, data):
        # Если из БД приходит объект с полем name, прокидываем его в title
        if hasattr(data, "name") and not getattr(data, "title", None):
            setattr(data, "title", getattr(data, "name"))
        elif isinstance(data, dict) and "name" in data and "title" not in data:
            data["title"] = data["name"]
        return data
