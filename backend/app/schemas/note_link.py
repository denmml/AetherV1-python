"""notelink.py schemas"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NoteLinkBase(BaseModel):
    source_id: int
    target_id: int


class NoteLinkCreate(NoteLinkBase):
    pass


class NoteLinkResponse(NoteLinkBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
