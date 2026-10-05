"""note.py"""

# база жанных для sqlalchemy
from datetime import datetime
from typing import TYPE_CHECKING, Optional, List
from sqlalchemy import String, Text, ForeignKey, DateTime, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.folder import Folder
    from app.models.note_link import NoteLink


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, 
                                       default="Untitled")
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    is_starred: Mapped[bool] = mapped_column(Boolean, default=False)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    folder_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("folders.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="notes")
    folder: Mapped[Optional["Folder"]] = relationship("Folder", 
                                                      back_populates="notes")

    outgoing_links: Mapped[List["NoteLink"]] = relationship(
        "NoteLink",
        foreign_keys="[NoteLink.source_note_id]",
        back_populates="source_note",
        cascade="all, delete-orphan",
    )
    incoming_links: Mapped[List["NoteLink"]] = relationship(
        "NoteLink",
        foreign_keys="[NoteLink.target_note_id]",
        back_populates="target_note",
        cascade="all, delete-orphan",
    )
