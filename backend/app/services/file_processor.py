from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)


async def process_analysis(analysis_id: uuid.UUID) -> None:
    """
    Background worker: load the CSV, run the AI model, and persist results.

    Opens its own database session because FastAPI background tasks run after
    the request session has already been closed.
    """
    from app.config import settings
    from app.database import AsyncSessionLocal
    from app.models.analysis import Analysis
    from app.services.ai_model import get_model_backend

    async with AsyncSessionLocal() as db:
        analysis = await db.get(Analysis, analysis_id)
        if not analysis:
            logger.error("process_analysis: Analysis %s not found, aborting.", analysis_id)
            return

        analysis.status = "processing"
        await db.commit()

        try:
            upload_dir = Path(settings.UPLOAD_DIR)
            abs_csv_path = upload_dir / analysis.csv_file_path

            if not abs_csv_path.exists():
                raise FileNotFoundError(f"CSV not found: {abs_csv_path}")

            # Load CSV into a DataFrame (offloaded to executor — pandas is blocking)
            loop = asyncio.get_running_loop()
            df: pd.DataFrame = await loop.run_in_executor(
                None, pd.read_csv, str(abs_csv_path)
            )

            abs_mri_path: str | None = (
                str(upload_dir / analysis.mri_file_path) if analysis.mri_file_path else None
            )
            abs_pet_path: str | None = (
                str(upload_dir / analysis.pet_file_path) if analysis.pet_file_path else None
            )

            backend = get_model_backend()
            output = await backend.predict(df, abs_mri_path, abs_pet_path)

            analysis.status = "completed"
            analysis.result = output["result"]
            analysis.confidence_score = output["confidence_score"]
            analysis.feature_importance = output.get("feature_importance")
            analysis.completed_at = datetime.now(timezone.utc)

        except Exception as exc:
            logger.exception("process_analysis: Analysis %s failed.", analysis_id)
            analysis.status = "failed"
            analysis.error_message = f"{type(exc).__name__}: {exc}"
            analysis.completed_at = datetime.now(timezone.utc)

        finally:
            await db.commit()
