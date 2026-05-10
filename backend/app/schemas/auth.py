from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class DoctorCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=200)
    password: str = Field(..., min_length=8)


class DoctorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
