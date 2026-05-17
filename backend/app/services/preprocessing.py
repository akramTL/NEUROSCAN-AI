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
    """
    Load a .nii/.nii.gz MRI volume and return a (1, 64, 64, 64) float32 array.

    Pipeline (matches training exactly):
      1. Load with nibabel
      2. Skull strip: Otsu threshold → largest connected component → binary closing
      3. Spatial normalize: crop to bounding box → resize to (64, 64, 64)
      4. Intensity normalize: clip 1st-99th percentile → z-score
    """
    import nibabel as nib
    from skimage.filters import threshold_otsu
    from skimage.transform import resize
    from scipy.ndimage import label, binary_closing

    try:
        img = nib.load(file_path)
        volume = img.get_fdata().astype(np.float32)

        # rescale raw unnormalized intensities
        if volume.max() > 10000:
            volume = volume / volume.max() * 4095.0

        # ── Step 1: Skull strip ──────────────────────────────────────────────
        thresh = threshold_otsu(volume)
        mask = volume > thresh
        labeled, n_components = label(mask)
        if n_components == 0:
            brain = volume
        else:
            sizes = np.bincount(labeled.ravel())[1:]  # skip background label 0
            largest = int(sizes.argmax()) + 1
            brain_mask = binary_closing(labeled == largest, iterations=3)
            brain = volume * brain_mask

        # ── Step 2: Crop to bounding box ─────────────────────────────────────
        coords = np.array(np.where(brain > 0))
        if coords.shape[1] == 0:
            brain = volume  # fallback: stripping removed everything
        else:
            lo, hi = coords.min(axis=1), coords.max(axis=1)
            brain = brain[lo[0]:hi[0]+1, lo[1]:hi[1]+1, lo[2]:hi[2]+1]

        # ── Step 3: Resize to (64, 64, 64) ───────────────────────────────────
        brain = resize(
            brain, (64, 64, 64),
            anti_aliasing=True, preserve_range=True
        ).astype(np.float32)

        # ── Step 4: Intensity normalisation ──────────────────────────────────
        p1, p99 = np.percentile(brain, 1), np.percentile(brain, 99)
        brain = np.clip(brain, p1, p99)
        std = brain.std()
        brain = (brain - brain.mean()) / (std + 1e-8)

        return brain[np.newaxis]  # (1, 64, 64, 64) — channel dim for PyTorch

    except Exception:
        logger.exception("preprocess_mri failed for %s", file_path)
        return None


def preprocess_pet(file_path: str) -> np.ndarray | None:
    """Hook for PET volume preprocessing. Returns None until implemented."""
    logger.info("preprocess_pet: not yet implemented (path=%s) — returning None.", file_path)
    return None
