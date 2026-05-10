from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import List, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.analysis import AnalysisResult, AnalysisStatus


GENDER_TYPE = Literal["male", "female", "other", "prefer_not_to_say"]


class PatientBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: date
    gender: GENDER_TYPE


class PatientCreate(PatientBase):
    pass  # doctor_id is inferred from the JWT token


class PatientUpdate(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    date_of_birth: date | None = None
    gender: GENDER_TYPE | None = None


class AnalysisSummary(BaseModel):
    """Compact analysis view embedded inside patient detail responses."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: AnalysisStatus
    result: AnalysisResult | None
    confidence_score: float | None
    created_at: datetime
    completed_at: datetime | None


class PatientRead(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    doctor_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    # Default [] so the list endpoint (which skips eager-loading) passes validation
    analyses: List[AnalysisSummary] = []
