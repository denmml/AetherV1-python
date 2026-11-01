"""folder.py schemas"""

from typing import Optional
from pydantic import BaseModel, ConfigDict, model_validator


class FolderBase(BaseModel):
    title: Optional[str] = None
    name: Optional[str] = None


class FolderCreate(FolderBase):
    pass


class FolderUpdate(BaseModel):
    title: Optional[str] = None
    name: Optional[str] = None


class FolderResponse(BaseModel):
    id: int
    user_id: int
    title: str
    name: str

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def map_name_and_title(cls, data):
        if hasattr(data, "name") or hasattr(data, "title"):
            val = getattr(data, "name", None) or getattr(data, "title", None) or "Untitled"
            return {
                "id": getattr(data, "id", 0),
                "user_id": getattr(data, "user_id", 0),
                "title": str(val),
                "name": str(val),
            }
        elif isinstance(data, dict):
            val = data.get("name") or data.get("title") or "Untitled"
            data["name"] = str(val)
            data["title"] = str(val)
        return data
