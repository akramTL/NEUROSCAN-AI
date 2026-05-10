from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_doctor
from app.models.doctor import Doctor
from app.schemas.auth import DoctorCreate, DoctorRead, LoginRequest, TokenResponse
from app.services.auth import create_access_token, hash_password, verify_password

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=DoctorRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    payload: DoctorCreate,
    db: AsyncSession = Depends(get_db),
) -> DoctorRead:
    existing = await db.execute(select(Doctor).where(Doctor.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    doctor = Doctor(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
    )
    db.add(doctor)
    await db.flush()
    await db.refresh(doctor)
    return doctor


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    result = await db.execute(select(Doctor).where(Doctor.email == payload.email))
    doctor = result.scalar_one_or_none()
    if not doctor or not verify_password(payload.password, doctor.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    doctor.last_login = datetime.now(timezone.utc)
    await db.flush()

    token = create_access_token({"sub": str(doctor.id)})
    return TokenResponse(
        access_token=token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=DoctorRead)
async def get_me(current_doctor: Doctor = Depends(get_current_doctor)) -> DoctorRead:
    return current_doctor
