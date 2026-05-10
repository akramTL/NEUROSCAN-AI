from __future__ import annotations

import logging

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Canonical feature order fed into the model — must match training column order
FEATURE_COLUMNS = ['Age', 'sex_encoded', 'magnetic_field_strength', 'slices_per_volume']

_SEX_MAP = {"m": 0, "male": 0, "f": 1, "female": 1}


def extract_csv_features(df: pd.DataFrame) -> np.ndarray:
    """
    Validate and transform a biomarker DataFrame into a fixed-width feature matrix.

    Source columns expected (case-insensitive lookup):
      - Age / age
      - sex / gender  → sex_encoded (M/male → 0, F/female → 1)
      - magnetic_field_strength
      - slices_per_volume

    NaN values are imputed with per-column medians.

    Returns:
        np.ndarray of shape (n_samples, 4), dtype float32.
        Column order matches FEATURE_COLUMNS exactly.
    """
    work = df.copy()

    # ── Age: accept 'Age' or 'age' ─────────────────────────────────────────────
    if 'Age' not in work.columns and 'age' in work.columns:
        work['Age'] = work['age']

    # ── sex_encoded: derive from 'sex' or 'gender' if not already present ──────
    if 'sex_encoded' not in work.columns:
        src = None
        for candidate in ('sex', 'gender', 'Sex', 'Gender'):
            if candidate in work.columns:
                src = candidate
                break
        if src is not None:
            work['sex_encoded'] = (
                work[src].astype(str).str.lower().str.strip().map(_SEX_MAP)
            )
        else:
            logger.warning("extract_csv_features: no sex/gender column found — defaulting to 0.")
            work['sex_encoded'] = 0

    # ── fill completely absent feature columns with zero ───────────────────────
    missing = [col for col in FEATURE_COLUMNS if col not in work.columns]
    if missing:
        logger.warning("extract_csv_features: missing columns %s — filling with 0.", missing)
        for col in missing:
            work[col] = 0

    features = work[FEATURE_COLUMNS].copy()

    # ── NaN imputation with column medians ─────────────────────────────────────
    for col in FEATURE_COLUMNS:
        if features[col].isna().any():
            median_val = features[col].median()
            if pd.isna(median_val):
                median_val = 0.0
            features[col] = features[col].fillna(median_val)
            logger.warning(
                "extract_csv_features: NaN in '%s' imputed with median %.4f.", col, median_val
            )

    return features.to_numpy(dtype=np.float32)


def preprocess_mri(file_path: str) -> np.ndarray | None:
    """Hook for MRI volume preprocessing. Returns None until implemented."""
    logger.info("preprocess_mri: not yet implemented (path=%s) — returning None.", file_path)
    return None


def preprocess_pet(file_path: str) -> np.ndarray | None:
    """Hook for PET volume preprocessing. Returns None until implemented."""
    logger.info("preprocess_pet: not yet implemented (path=%s) — returning None.", file_path)
    return None
