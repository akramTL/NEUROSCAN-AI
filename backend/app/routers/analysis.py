from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_doctor
from app.models.analysis import Analysis
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.schemas.analysis import AnalysisRead, AnalysisStatusRead

router = APIRouter()


async def _get_owned_analysis(
    analysis_id: uuid.UUID,
    current_doctor: Doctor,
    db: AsyncSession,
) -> Analysis:
    """Return the analysis only if it belongs to a patient of current_doctor; 404 otherwise."""
    result = await db.execute(
        select(Analysis)
        .join(Patient, Analysis.patient_id == Patient.id)
        .where(Analysis.id == analysis_id, Patient.doctor_id == current_doctor.id)
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis


@router.get("/{analysis_id}/status", response_model=AnalysisStatusRead)
async def get_analysis_status(
    analysis_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
) -> AnalysisStatusRead:
    return await _get_owned_analysis(analysis_id, current_doctor, db)


@router.get("/{analysis_id}", response_model=AnalysisRead)
async def get_analysis(
    analysis_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
) -> AnalysisRead:
    return await _get_owned_analysis(analysis_id, current_doctor, db)


@router.get("/", response_model=List[AnalysisRead])
async def list_analyses(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
) -> List[AnalysisRead]:
    result = await db.execute(
        select(Analysis)
        .join(Patient, Analysis.patient_id == Patient.id)
        .where(Patient.doctor_id == current_doctor.id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()
