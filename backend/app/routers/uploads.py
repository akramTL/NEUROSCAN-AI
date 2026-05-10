from __future__ import annotations

import shutil
import uuid
from pathlib import Path
from typing import List

import aiofiles
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_doctor
from app.models.analysis import Analysis
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.schemas.analysis import AnalysisRead, UploadResponse
from app.services.file_processor import process_analysis
from app.utils.file_validator import validate_file

router = APIRouter()

_CHUNK_SIZE = 64 * 1024  # 64 KB read chunks


async def _save_file(
    upload: UploadFile,
    patient_id: uuid.UUID,
    analysis_id: uuid.UUID,
) -> str:
    dest_dir = Path(settings.UPLOAD_DIR) / str(patient_id) / str(analysis_id)
    dest_dir.mkdir(parents=True, exist_ok=True)

    original_suffix = "".join(Path(upload.filename or "file").suffixes)
    filename = f"{uuid.uuid4()}{original_suffix}"
    dest_path = dest_dir / filename

    max_bytes = settings.max_file_size_bytes
    total_written = 0

    async with aiofiles.open(dest_path, "wb") as out:
        while True:
            chunk = await upload.read(_CHUNK_SIZE)
            if not chunk:
                break
            total_written += len(chunk)
            if total_written > max_bytes:
                dest_path.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=(
                        f"File exceeds the {settings.MAX_FILE_SIZE_MB} MB size limit "
                        f"({upload.filename})."
                    ),
                )
            await out.write(chunk)

    return str(dest_path.relative_to(settings.UPLOAD_DIR))


@router.post(
    "/{patient_id}/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_patient_files(
    patient_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
    csv_file: UploadFile = File(..., description="CSV biomarker file (required)"),
    mri_file: UploadFile | None = File(None, description="MRI scan .nii/.nii.gz/.dcm (optional)"),
    pet_file: UploadFile | None = File(None, description="PET scan .nii/.nii.gz/.dcm (optional)"),
) -> UploadResponse:
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.doctor_id == current_doctor.id,
        )
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Validate all files before touching disk
    await validate_file(csv_file, "csv")
    if mri_file is not None:
        await validate_file(mri_file, "mri")
    if pet_file is not None:
        await validate_file(pet_file, "pet")

    analysis_id = uuid.uuid4()
    orphan_dir = Path(settings.UPLOAD_DIR) / str(patient_id) / str(analysis_id)

    try:
        csv_path = await _save_file(csv_file, patient_id, analysis_id)
        mri_path = await _save_file(mri_file, patient_id, analysis_id) if mri_file else None
        pet_path = await _save_file(pet_file, patient_id, analysis_id) if pet_file else None

        analysis = Analysis(
            id=analysis_id,
            patient_id=patient_id,
            status="pending",
            csv_file_path=csv_path,
            mri_file_path=mri_path,
            pet_file_path=pet_path,
        )
        db.add(analysis)
        await db.commit()   # must commit before background task opens its own session

    except Exception:
        if orphan_dir.exists():
            shutil.rmtree(orphan_dir, ignore_errors=True)
        raise

    background_tasks.add_task(process_analysis, analysis_id)

    return UploadResponse(
        analysis_id=analysis_id,
        status="pending",
        message="Files received, analysis started",
    )


@router.get("/{patient_id}/uploads", response_model=List[AnalysisRead])
async def list_patient_uploads(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
) -> List[AnalysisRead]:
    result = await db.execute(
        select(Patient).where(
            Patient.id == patient_id,
            Patient.doctor_id == current_doctor.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Patient not found")

    result = await db.execute(
        select(Analysis).where(Analysis.patient_id == patient_id)
    )
    return result.scalars().all()
