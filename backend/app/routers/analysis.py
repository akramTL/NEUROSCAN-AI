from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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


@router.get("/{analysis_id}/report")
async def download_report(
    analysis_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
) -> Response:
    from app.services.report import generate_report_pdf

    result = await db.execute(
        select(Analysis)
        .options(selectinload(Analysis.patient))
        .join(Patient, Analysis.patient_id == Patient.id)
        .where(Analysis.id == analysis_id, Patient.doctor_id == current_doctor.id)
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    if analysis.status != "completed":
        raise HTTPException(status_code=400, detail="Report only available for completed analyses")

    patient = analysis.patient
    pdf_bytes = generate_report_pdf(
        analysis_id=str(analysis.id),
        patient_name=f"{patient.first_name} {patient.last_name}",
        patient_dob=patient.date_of_birth,
        patient_gender=patient.gender,
        analysis_date=analysis.completed_at or analysis.created_at,
        result=analysis.result,
        confidence_score=analysis.confidence_score or 0.0,
        feature_importance=analysis.feature_importance,
        mri_used=bool(analysis.mri_file_path),
        doctor_name=current_doctor.full_name,
    )

    filename = f"neuroscan-report-{str(analysis.id)[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


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
