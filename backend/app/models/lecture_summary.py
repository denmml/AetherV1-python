"""lecture_summary"""

from datetime import datetime
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Text, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.lecture import Lecture


class LectureSummary(Base):
    __tablename__ = "lecture_summaries"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    summary_text: Mapped[str] = mapped_column(Text, nullable=False)

    key_points: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    action_items: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    lecture_id: Mapped[int] = mapped_column(
        ForeignKey("lectures.id", ondelete="CASCADE"), 
        unique=True, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    lecture: Mapped["Lecture"] = relationship("Lecture", 
                                              back_populates="summary")
