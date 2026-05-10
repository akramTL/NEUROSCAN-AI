import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import String, Float, DateTime, Text, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# Enum types defined as PostgreSQL native enums for data-integrity at the DB layer
AnalysisStatusEnum = sa.Enum(
    "pending", "processing", "completed", "failed",
    name="analysis_status",
)

AnalysisResultEnum = sa.Enum(
    "AD", "CN", "MCI",
    name="analysis_result",
)


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Workflow state
    status: Mapped[str] = mapped_column(
        AnalysisStatusEnum, nullable=False, default="pending"
    )

    # Model output – null until analysis completes
    result: Mapped[str | None] = mapped_column(AnalysisResultEnum, nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Uploaded file paths stored relative to UPLOAD_DIR
    csv_file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    mri_file_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    pet_file_path: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Feature-level explanation from the model (feature_name → importance score)
    feature_importance: Mapped[dict | None] = mapped_column(sa.JSON(), nullable=True)

    # Populated when status == 'failed'
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationship back to patient
    patient: Mapped["Patient"] = relationship("Patient", back_populates="analyses")

    def __repr__(self) -> str:
        return f"<Analysis id={self.id} patient={self.patient_id} status={self.status}>"
