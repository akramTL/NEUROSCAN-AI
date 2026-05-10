from __future__ import annotations

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.doctor import Doctor
from app.services.auth import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_doctor(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Doctor:
    payload = decode_token(token)
    doctor_id_str = payload.get("sub")
    if not doctor_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        doctor_id = uuid.UUID(doctor_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    doctor = await db.get(Doctor, doctor_id)
    if not doctor or not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Doctor not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return doctor
