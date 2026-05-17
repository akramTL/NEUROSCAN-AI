from __future__ import annotations

import hashlib
import logging
import random
from abc import ABC, abstractmethod
from pathlib import Path

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

CLASSES = ["AD", "CN", "MCI"]

# ── PyTorch MRI architecture ───────────────────────────────────────────────────
# Defined here (not imported) so torch.load can reconstruct the model from a
# raw state-dict without pickling issues.

try:
    import torch
    import torch.nn as nn

    class ChannelAttention3D(nn.Module):
        def __init__(self, in_channels, reduction_ratio=8):
            super().__init__()
            hidden = max(1, in_channels // reduction_ratio)
            self.gap = nn.AdaptiveAvgPool3d(1)
            self.fc1 = nn.Linear(in_channels, hidden)
            self.relu = nn.ReLU()
            self.fc2 = nn.Linear(hidden, in_channels)
            self.sigmoid = nn.Sigmoid()

        def forward(self, x):
            b, c, _, _, _ = x.size()
            y = self.gap(x).view(b, c)
            y = self.fc1(y)
            y = self.relu(y)
            y = self.fc2(y)
            y = self.sigmoid(y).view(b, c, 1, 1, 1)
            return x * y

    class ResNetBlock3D(nn.Module):
        def __init__(self, in_channels, out_channels, stride=1):
            super().__init__()
            self.conv1 = nn.Conv3d(in_channels, out_channels, 3, stride=stride, padding=1)
            self.bn1 = nn.InstanceNorm3d(out_channels)
            self.relu = nn.ReLU(inplace=True)
            self.conv2 = nn.Conv3d(out_channels, out_channels, 3, stride=1, padding=1)
            self.bn2 = nn.InstanceNorm3d(out_channels)

            # Attribute named 'down' to match the saved checkpoint key names
            self.down = None
            if stride != 1 or in_channels != out_channels:
                self.down = nn.Sequential(
                    nn.Conv3d(in_channels, out_channels, 1, stride=stride),
                    nn.InstanceNorm3d(out_channels)
                )

        def forward(self, x):
            identity = x
            out = self.relu(self.bn1(self.conv1(x)))
            out = self.bn2(self.conv2(out))
            if self.down is not None:
                identity = self.down(x)
            out = self.relu(out + identity)
            return out

    class Memory3DCNNTransformer(nn.Module):
        def __init__(self, num_classes=3, max_tokens=512):
            super().__init__()

            self.conv_in = nn.Conv3d(1, 16, kernel_size=3, stride=2, padding=1)
            self.bn_in   = nn.InstanceNorm3d(16)
            self.relu    = nn.ReLU(inplace=True)
            self.pool    = nn.MaxPool3d(kernel_size=2, stride=2)

            # 3 blocks: 16→32→64→128
            self.layer1 = ResNetBlock3D(16,  32, stride=2)
            self.layer2 = ResNetBlock3D(32,  64, stride=2)
            self.layer3 = ResNetBlock3D(64, 128, stride=2)

            self.attention = ChannelAttention3D(in_channels=128)

            self.d_model    = 128
            self.max_tokens = max_tokens

            encoder_layer = nn.TransformerEncoderLayer(
                d_model=self.d_model,
                nhead=4,
                dim_feedforward=256,
                dropout=0.1,
                batch_first=True
            )
            self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=1)

            self.cls_token     = nn.Parameter(torch.zeros(1, 1, self.d_model))
            self.pos_embedding = nn.Parameter(torch.zeros(1, max_tokens + 1, self.d_model))

            self.dropout = nn.Dropout(0.4)
            self.ln_fc   = nn.LayerNorm(self.d_model)
            self.fc1     = nn.Linear(self.d_model, 128)
            self.fc2     = nn.Linear(128, 64)
            self.fc3     = nn.Linear(64, num_classes)

            self.gradients  = None
            self.activations = None

        def activations_hook(self, grad):
            self.gradients = grad

        def forward(self, x):
            # x: (B, 1, D, H, W)
            x = self.conv_in(x)
            x = self.bn_in(x)
            x = self.relu(x)
            x = self.pool(x)

            x = self.layer1(x)
            x = self.layer2(x)
            x = self.layer3(x)

            if x.requires_grad:
                x.register_hook(self.activations_hook)
                self.activations = x

            x = self.attention(x)

            B, C, Dp, Hp, Wp = x.shape
            seq_len = Dp * Hp * Wp
            if seq_len > self.max_tokens:
                raise ValueError(
                    f"Flattened token length {seq_len} > max_tokens {self.max_tokens}"
                )

            x = x.view(B, C, seq_len).permute(0, 2, 1)

            cls_tokens = self.cls_token.expand(B, -1, -1)
            x = torch.cat([cls_tokens, x], dim=1)
            x = x + self.pos_embedding[:, : x.size(1), :]

            x = self.transformer(x)

            cls_repr    = x[:, 0, :]
            tokens_mean = x[:, 1:, :].mean(dim=1)
            h = 0.5 * cls_repr + 0.5 * tokens_mean

            h   = self.ln_fc(h)
            h   = self.dropout(h)
            h   = self.relu(self.fc1(h))
            h   = self.relu(self.fc2(h))
            out = self.fc3(h)
            return out

    _TORCH_AVAILABLE = True

except ImportError:
    _TORCH_AVAILABLE = False
    logger.warning("torch not installed — MRI inference will be unavailable.")


# ── Abstract backend ───────────────────────────────────────────────────────────

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
                "confidence_score": float,
                "feature_importance": dict | None,
            }
        """


# ── Stub backend ───────────────────────────────────────────────────────────────

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


# ── Local model backend ────────────────────────────────────────────────────────

class LocalModelBackend(ModelBackend):
    """
    Runs either:
    - PyTorch Memory3DCNNTransformer on MRI when an MRI .nii file is provided
    - scikit-learn / XGBoost .pkl model on CSV features as fallback
    Falls back to StubBackend when neither model file exists.
    """

    def __init__(self, model_path: str) -> None:
        self._model_path = Path(model_path)
        self._model      = None   # sklearn / XGBoost pkl model
        self._mri_model  = None   # PyTorch MRI model
        self._device     = None
        self._stub       = StubBackend()

    # ── sklearn / XGBoost loader ───────────────────────────────────────────────

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
        logger.info("LocalModelBackend: loaded CSV model from '%s'.", self._model_path)
        return True

    # ── PyTorch MRI loader ─────────────────────────────────────────────────────

    def _load_mri_model(self) -> bool:
        if self._mri_model is not None:
            return True
        if not _TORCH_AVAILABLE:
            return False
        from app.config import settings
        mri_path = Path(settings.MRI_MODEL_PATH)
        if not mri_path.exists():
            logger.warning("MRI model not found at '%s'.", mri_path)
            return False

        import torch
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model  = Memory3DCNNTransformer(num_classes=3, max_tokens=512)
        state  = torch.load(str(mri_path), map_location=device, weights_only=False)

        # Handle raw state dict OR checkpoint dict with a nested key
        if isinstance(state, dict) and not any(k.startswith('conv_in') for k in state):
            for key in ('model_state_dict', 'state_dict', 'model'):
                if key in state:
                    state = state[key]
                    break

        model.load_state_dict(state)
        model.to(device).eval()
        self._mri_model = model
        self._device    = device
        logger.info("MRI model loaded from '%s' on %s.", mri_path, device)
        return True

    # ── Inference helpers ──────────────────────────────────────────────────────

    def _run_mri_inference(self, volume: np.ndarray) -> tuple:
        """Synchronous PyTorch inference — runs in executor thread."""
        import torch
        # volume: (1, 64, 64, 64) → unsqueeze batch dim → (1, 1, 64, 64, 64)
        tensor = torch.from_numpy(volume).float().unsqueeze(0).to(self._device)
        with torch.no_grad():
            logits = self._mri_model(tensor)         # (1, 3)
            probs  = torch.softmax(logits, dim=1)[0] # (3,)
        names    = ['CN', 'MCI', 'AD']               # 0 = CN, 1 = MCI, 2 = AD
        probs_np = probs.cpu().numpy()
        idx      = int(probs_np.argmax())
        mri_probs = {n: round(float(p), 4) for n, p in zip(names, probs_np)}
        return names[idx], float(probs_np[idx]), mri_probs

    def _run_inference(self, csv_features: np.ndarray) -> tuple:
        """Synchronous sklearn inference — runs in executor thread."""
        if isinstance(self._model, dict):
            estimator    = self._model["model"]
            class_labels = list(self._model["classes"])
            fi_prebuilt  = self._model.get("feature_importance")
        else:
            estimator    = self._model
            class_labels = list(estimator.classes_)
            fi_prebuilt  = None

        proba        = estimator.predict_proba(csv_features)[0]
        class_idx    = int(np.argmax(proba))
        result_label = class_labels[class_idx]
        confidence   = float(proba[class_idx])

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

    # ── Main predict ───────────────────────────────────────────────────────────

    async def predict(
        self,
        csv_data: pd.DataFrame,
        mri_path: str | None,
        pet_path: str | None,
    ) -> dict:
        from app.services.preprocessing import extract_csv_features, preprocess_mri
        import asyncio

        loop = asyncio.get_running_loop()

        # ── MRI branch (takes priority when file present) ─────────────────────
        if mri_path and self._load_mri_model():
            volume = await loop.run_in_executor(None, preprocess_mri, mri_path)
            if volume is not None:
                result, conf, mri_probs = await loop.run_in_executor(
                    None, self._run_mri_inference, volume
                )
                return {
                    "result":             result,
                    "confidence_score":   conf,
                    "feature_importance": mri_probs,  # persisted in DB JSON col
                    "mri_probabilities":  mri_probs,
                }

        # ── CSV / XGBoost fallback ────────────────────────────────────────────
        if not self._load_model():
            return await self._stub.predict(csv_data, mri_path, pet_path)

        csv_features = extract_csv_features(csv_data)
        result_label, confidence, feature_importance = await loop.run_in_executor(
            None, self._run_inference, csv_features
        )
        return {
            "result":             result_label,
            "confidence_score":   confidence,
            "feature_importance": feature_importance,
        }


# ── Factory ────────────────────────────────────────────────────────────────────

def get_model_backend() -> ModelBackend:
    """
    Factory — reads MODEL_BACKEND from settings.
      'stub'  → StubBackend  (default; no model file needed)
      'local' → LocalModelBackend  (uses MRI model when .nii uploaded, else XGBoost)
    """
    from app.config import settings

    backend = settings.MODEL_BACKEND.lower().strip()
    if backend == "local":
        return LocalModelBackend(settings.MODEL_PATH)
    if backend == "stub":
        return StubBackend()

    logger.warning("Unknown MODEL_BACKEND '%s' — falling back to StubBackend.", backend)
    return StubBackend()
