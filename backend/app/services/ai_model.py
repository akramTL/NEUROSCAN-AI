from __future__ import annotations

import hashlib
import logging
import random
from abc import ABC, abstractmethod
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)

CLASSES = ["AD", "CN", "MCI"]


class ModelBackend(ABC):
    @abstractmethod
    async def predict(
        self,
        csv_data: pd.DataFrame,
        mri_path: str | None,
        pet_path: str | None,
    ) -> dict:
        """
        Run inference and return a prediction dict.

        Returns:
            {
                "result": "AD" | "CN" | "MCI",
                "confidence_score": float,         # in [0.0, 1.0]
                "feature_importance": dict | None  # feature_name → score, or None
            }
        """


class StubBackend(ModelBackend):
    """
    Returns deterministic fake predictions seeded by CSV content hash.
    Same input always produces the same output — useful for frontend dev/testing.
    """

    async def predict(
        self,
        csv_data: pd.DataFrame,
        mri_path: str | None,
        pet_path: str | None,
    ) -> dict:
        from app.services.preprocessing import FEATURE_COLUMNS

        raw = csv_data.to_csv(index=False).encode()
        seed = int(hashlib.md5(raw).hexdigest(), 16) % (2**32)
        rng = random.Random(seed)

        result = rng.choice(CLASSES)
        confidence = round(rng.uniform(0.65, 0.98), 4)

        raw_scores = {feat: rng.uniform(0.0, 1.0) for feat in FEATURE_COLUMNS}
        total = sum(raw_scores.values()) or 1.0
        feature_importance = {k: round(v / total, 4) for k, v in raw_scores.items()}

        return {
            "result": result,
            "confidence_score": confidence,
            "feature_importance": feature_importance,
        }


class LocalModelBackend(ModelBackend):
    """
    Loads a scikit-learn compatible .pkl model and runs inference.
    Falls back to StubBackend with a warning if the model file does not exist.
    """

    def __init__(self, model_path: str) -> None:
        self._model_path = Path(model_path)
        self._model = None
        self._stub = StubBackend()

    def _load_model(self) -> bool:
        if self._model is not None:
            return True
        if not self._model_path.exists():
            logger.warning(
                "LocalModelBackend: model file not found at '%s' — falling back to StubBackend.",
                self._model_path,
            )
            return False
        import pickle
        with open(self._model_path, "rb") as fh:
            self._model = pickle.load(fh)
        logger.info("LocalModelBackend: loaded model from '%s'.", self._model_path)
        return True

    async def predict(
        self,
        csv_data: pd.DataFrame,
        mri_path: str | None,
        pet_path: str | None,
    ) -> dict:
        if not self._load_model():
            return await self._stub.predict(csv_data, mri_path, pet_path)

        from app.services.preprocessing import extract_csv_features, preprocess_mri, preprocess_pet
        import asyncio

        loop = asyncio.get_running_loop()

        # ── 1. CSV feature extraction ──────────────────────────────────────────
        csv_features = extract_csv_features(csv_data)   # np.ndarray shape (n_samples, 7)

        # ── 2. MRI preprocessing hook ──────────────────────────────────────────
        mri_features = None
        if mri_path:
            mri_features = await loop.run_in_executor(None, preprocess_mri, mri_path)

        # ── 3. PET preprocessing hook ──────────────────────────────────────────
        pet_features = None
        if pet_path:
            pet_features = await loop.run_in_executor(None, preprocess_pet, pet_path)

        # ── 4. Model inference ─────────────────────────────────────────────────
        # For a CSV-only model pass csv_features directly.
        # To fuse imaging features, concatenate with mri_features / pet_features here.
        result_label, confidence, feature_importance = await loop.run_in_executor(
            None, self._run_inference, csv_features
        )

        return {
            "result": result_label,
            "confidence_score": confidence,
            "feature_importance": feature_importance,
        }

    def _run_inference(self, csv_features):
        """Synchronous sklearn inference — runs in an executor thread."""
        import numpy as np

        # model.pkl is a dict: {model, classes, features, feature_importance, ...}
        if isinstance(self._model, dict):
            estimator    = self._model["model"]
            class_labels = list(self._model["classes"])
            fi_prebuilt  = self._model.get("feature_importance")
        else:
            estimator    = self._model
            class_labels = list(estimator.classes_)
            fi_prebuilt  = None

        proba      = estimator.predict_proba(csv_features)[0]
        class_idx  = int(np.argmax(proba))
        result_label = class_labels[class_idx]
        confidence   = float(proba[class_idx])

        # Use pre-built importances from pkl; fall back to model attribute
        if fi_prebuilt:
            feature_importance = {k: round(float(v), 4) for k, v in fi_prebuilt.items()}
        elif hasattr(estimator, "feature_importances_"):
            from app.services.preprocessing import FEATURE_COLUMNS
            feature_importance = {
                feat: round(float(imp), 4)
                for feat, imp in zip(FEATURE_COLUMNS, estimator.feature_importances_)
            }
        else:
            feature_importance = None

        return result_label, confidence, feature_importance


def get_model_backend() -> ModelBackend:
    """
    Factory — reads MODEL_BACKEND from settings.
      'stub'  → StubBackend  (default; no model file needed)
      'local' → LocalModelBackend  (requires MODEL_PATH to point to model.pkl)
    """
    from app.config import settings

    backend = settings.MODEL_BACKEND.lower().strip()
    if backend == "local":
        return LocalModelBackend(settings.MODEL_PATH)
    if backend == "stub":
        return StubBackend()

    logger.warning("Unknown MODEL_BACKEND '%s' — falling back to StubBackend.", backend)
    return StubBackend()
