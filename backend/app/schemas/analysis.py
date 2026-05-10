from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


AnalysisStatus = Literal["pending", "processing", "completed", "failed"]
AnalysisResult = Literal["AD", "CN", "MCI"]


class AnalysisCreate(BaseModel):
    patient_id: uuid.UUID
    csv_file_path: str
    mri_file_path: str | None = None
    pet_file_path: str | None = None


class AnalysisStatusUpdate(BaseModel):
    status: AnalysisStatus
    result: AnalysisResult | None = None
    confidence_score: float | None = Field(None, ge=0.0, le=1.0)
    error_message: str | None = None
    completed_at: datetime | None = None


class AnalysisRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    status: AnalysisStatus
    result: AnalysisResult | None
    confidence_score: float | None
    feature_importance: dict | None
    csv_file_path: str
    mri_file_path: str | None
    pet_file_path: str | None
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None


class AnalysisStatusRead(BaseModel):
    """Lightweight polling schema — only status and result fields, no file paths."""
    model_config = ConfigDict(from_attributes=True)

    # validation_alias maps the ORM attribute 'id' to the JSON key 'analysis_id'
    analysis_id: uuid.UUID = Field(validation_alias="id")
    status: AnalysisStatus
    result: AnalysisResult | None
    confidence_score: float | None


class UploadResponse(BaseModel):
    """Returned as HTTP 202 immediately after files are accepted and analysis is queued."""
    analysis_id: uuid.UUID
    status: Literal["pending"]
    message: str
