from __future__ import annotations

from pathlib import Path
from typing import Literal

from fastapi import HTTPException, UploadFile, status

from app.config import settings

# Accepted extensions per modality
_ALLOWED_EXTENSIONS: dict[str, set[str]] = {
    "csv": {".csv"},
    "mri": {".nii", ".nii.gz", ".dcm"},
    "pet": {".nii", ".nii.gz", ".dcm"},
}


def _get_extension(filename: str) -> str:
    p = Path(filename)
    if p.suffix == ".gz" and p.stem.endswith(".nii"):
        return ".nii.gz"
    return p.suffix.lower()


def _check_magic_bytes(header: bytes, ext: str, filename: str) -> None:
    """Raise 415 if the file header does not match the expected magic bytes."""
    if ext == ".csv":
        # CSV must be valid UTF-8 text with no null bytes
        if b"\x00" in header:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"'{filename}' does not appear to be a valid CSV file (null bytes detected).",
            )
        try:
            header.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"'{filename}' does not appear to be a valid UTF-8 CSV file.",
            )

    elif ext == ".nii":
        # NIfTI-1: first 4 bytes are header size = 348 in little-endian (5C 01 00 00)
        if len(header) < 4 or header[:4] != b"\x5c\x01\x00\x00":
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"'{filename}' does not appear to be a valid NIfTI-1 file.",
            )

    elif ext == ".nii.gz":
        # Gzip magic bytes: 1F 8B
        if len(header) < 2 or header[:2] != b"\x1f\x8b":
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"'{filename}' does not appear to be a valid gzip/NIfTI.gz file.",
            )

    elif ext == ".dcm":
        # DICOM: bytes 128–131 must be the ASCII string "DICM"
        if len(header) < 132 or header[128:132] != b"DICM":
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"'{filename}' does not appear to be a valid DICOM file.",
            )


async def validate_file(
    upload: UploadFile,
    file_type: Literal["csv", "mri", "pet"],
) -> None:
    """
    Validate extension, size (pre-check), and magic bytes.
    Raises HTTP 415 on wrong type/magic, HTTP 413 on size violation.
    """
    filename = upload.filename or ""

    # ── 1. Extension check ────────────────────────────────────────────────────
    ext = _get_extension(filename)
    allowed = _ALLOWED_EXTENSIONS.get(file_type, set())
    if ext not in allowed:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported file type '{ext}' for {file_type}. "
                f"Allowed: {sorted(allowed)}"
            ),
        )

    # ── 2. Size pre-check (advisory — enforced strictly in _save_file) ────────
    if upload.size is not None and upload.size > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=(
                f"File size {upload.size / 1024 / 1024:.1f} MB exceeds "
                f"the limit of {settings.MAX_FILE_SIZE_MB} MB."
            ),
        )

    # ── 3. Magic bytes check ──────────────────────────────────────────────────
    header = await upload.read(512)
    await upload.seek(0)
    _check_magic_bytes(header, ext, filename)
