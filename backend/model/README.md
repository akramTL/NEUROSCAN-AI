# Model Directory

Place your trained model file here as **`model.pkl`**.

---

## Model Contract

| Property | Requirement |
|----------|-------------|
| Format | Python `pickle` file (`.pkl`) |
| Interface | scikit-learn compatible estimator — must expose `predict_proba()` |
| Input shape | `(n_samples, 7)` — one row per subject |
| Output classes | `model.classes_` must be `['AD', 'CN', 'MCI']` (exact order) |
| Feature importances | Optional — expose `.feature_importances_` for chart in UI |

---

## Input Feature Order

The input array columns must appear in this exact order:

| Index | Feature | Description |
|-------|---------|-------------|
| 0 | `age` | Patient age in years |
| 1 | `gender_encoded` | 0 = Male, 1 = Female |
| 2 | `MMSE` | Mini-Mental State Examination (0–30) |
| 3 | `CDR` | Clinical Dementia Rating (0, 0.5, 1, 2, 3) |
| 4 | `eTIV` | Estimated total intracranial volume (mm³) |
| 5 | `nWBV` | Normalized whole-brain volume |
| 6 | `ASF` | Atlas scaling factor |

This order is defined in `app/services/preprocessing.py → FEATURE_COLUMNS`.

---

## Activating the Model

1. Drop `model.pkl` into this directory.
2. Set `MODEL_BACKEND=local` in `backend/.env`.
3. Restart the backend (`uvicorn` picks it up on next request if using `--reload`).

---

## Pipeline Support

If your model is wrapped in a `sklearn.pipeline.Pipeline`, `LocalModelBackend`
will automatically unwrap it to reach the final estimator for feature importance
extraction. No changes needed in the code.

---

## Verifying Locally

```python
import pickle, numpy as np

with open("model.pkl", "rb") as f:
    model = pickle.load(f)

# One sample: age=74, gender_encoded=1, MMSE=29, CDR=0, eTIV=1344, nWBV=0.743, ASF=1.306
x = np.array([[74, 1, 29, 0, 1344, 0.743, 1.306]], dtype=np.float32)

print("Classes:", model.classes_)          # should be ['AD', 'CN', 'MCI']
print("Probabilities:", model.predict_proba(x))
```
