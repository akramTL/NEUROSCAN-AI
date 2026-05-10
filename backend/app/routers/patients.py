from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_doctor
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientRead, PatientUpdate

router = APIRouter()


@router.post("/", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
async def create_patient(
    payload: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
) -> PatientRead:
    data = payload.model_dump()
    data["doctor_id"] = current_doctor.id
    patient = Patient(**data)
    db.add(patient)
    await db.flush()
    result = await db.execute(
        select(Patient)
        .where(Patient.id == patient.id)
        .options(selectinload(Patient.analyses))
    )
    return result.scalar_one()


@router.get("/", response_model=List[PatientRead])
async def list_patients(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
) -> List[PatientRead]:
    result = await db.execute(
        select(Patient)
        .where(Patient.doctor_id == current_doctor.id)
        .options(selectinload(Patient.analyses))
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{patient_id}", response_model=PatientRead)
async def get_patient(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
) -> PatientRead:
    result = await db.execute(
        select(Patient)
        .where(Patient.id == patient_id, Patient.doctor_id == current_doctor.id)
        .options(selectinload(Patient.analyses))
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.put("/{patient_id}", response_model=PatientRead)
async def update_patient(
    patient_id: uuid.UUID,
    payload: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
) -> PatientRead:
    result = await db.execute(
        select(Patient)
        .where(Patient.id == patient_id, Patient.doctor_id == current_doctor.id)
        .options(selectinload(Patient.analyses))
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)

    await db.flush()
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
) -> None:
    result = await db.execute(
        select(Patient)
        .where(Patient.id == patient_id, Patient.doctor_id == current_doctor.id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    await db.delete(patient)
