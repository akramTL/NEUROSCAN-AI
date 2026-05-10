# NeuroScan AI

A medical AI platform for Alzheimer's disease classification from MRI/PET scans and CSV biomarker data.

---

## Overview

NeuroScan AI assists neurologists in detecting cognitive impairment by analyzing patient biomarker data. Doctors upload a CSV file of clinical measurements (and optionally MRI/PET scan files), and the AI model classifies the patient as:

| Result | Meaning |
|--------|---------|
| **CN** | Cognitively Normal |
| **MCI** | Mild Cognitive Impairment |
| **AD** | Alzheimer's Disease |

The platform uses a pluggable AI backend. By default it runs `StubBackend` — deterministic fake predictions seeded by the CSV content hash. Switch to `LocalModelBackend` by dropping `model.pkl` into `backend/model/` and setting `MODEL_BACKEND=local` in `.env`. See [Integrating a Real AI Model](#integrating-a-real-ai-model) for the full guide.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | FastAPI (Python 3.11+) |
| Database | PostgreSQL 15+ |
| ORM / Migrations | SQLAlchemy 2 (async) + Alembic |
| Frontend | React 18 + Vite + Tailwind CSS |
| State / Data fetching | TanStack Query v5 |
| Charts | Recharts |
| Containerization | Docker + Docker Compose |

---

## Project Structure

```
neuroscan-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, router mounting, global error handler
│   │   ├── config.py                # Settings (pydantic-settings v2) — DATABASE_URL, MODEL_BACKEND, etc.
│   │   ├── database.py              # Async SQLAlchemy engine + get_db()
│   │   ├── models/
│   │   │   ├── patient.py           # Patient ORM model
│   │   │   └── analysis.py          # Analysis ORM model — status/result enums + feature_importance JSON
│   │   ├── schemas/
│   │   │   ├── patient.py           # Pydantic request/response schemas
│   │   │   └── analysis.py          # Pydantic schemas + UploadResponse
│   │   ├── routers/
│   │   │   ├── patients.py          # CRUD (all endpoints eager-load analyses via selectinload)
│   │   │   ├── uploads.py           # POST /{id}/upload, GET /{id}/uploads
│   │   │   └── analysis.py          # GET detail, GET /status poll
│   │   ├── services/
│   │   │   ├── ai_model.py          # ModelBackend ABC, StubBackend, LocalModelBackend, get_model_backend()
│   │   │   ├── preprocessing.py     # extract_csv_features(), preprocess_mri(), preprocess_pet() hooks
│   │   │   └── file_processor.py    # Background worker: load CSV → run model → persist results
│   │   └── utils/
│   │       └── file_validator.py    # Extension + size validation
│   ├── alembic/
│   │   ├── env.py                   # Async Alembic env (% in URL escaped for configparser)
│   │   └── versions/
│   │       ├── 0001_initial_schema.py       # patients + analyses tables, enum types
│   │       └── 0002_add_feature_importance.py  # feature_importance JSON column
│   ├── model/
│   │   ├── .gitkeep                 # keeps directory in git
│   │   └── README.md                # model contract (input shape, class order, interface)
│   ├── tests/
│   │   ├── conftest.py              # SQLite fixtures — sets env vars before app import
│   │   └── test_api.py              # 4 end-to-end tests (no running DB required)
│   ├── requirements.txt
│   ├── pytest.ini                   # asyncio_mode = auto
│   ├── Dockerfile
│   ├── .env                         # Local dev credentials (not committed)
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/api.js               # Axios client — baseURL from VITE_API_BASE_URL
│   │   ├── components/
│   │   │   ├── Layout.jsx           # Sidebar + top bar
│   │   │   ├── StatusBadge.jsx      # pending / processing / completed / failed
│   │   │   └── ResultBadge.jsx      # CN / MCI / AD colour badges
│   │   └── pages/
│   │       ├── Dashboard.jsx        # Stats cards + recent analyses table
│   │       ├── Patients.jsx         # Searchable patient list + Add modal
│   │       ├── PatientDetail.jsx    # Patient info + analysis history
│   │       ├── Upload.jsx           # 3-step file upload with CSV preview
│   │       └── Result.jsx           # Live polling result page + feature importance bar chart
│   ├── .env                         # VITE_API_BASE_URL (not committed)
│   ├── vite.config.js               # Dev server on :5173, /api proxy → localhost:8000
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml               # postgres + backend + pgadmin + frontend
```

---

## Quick Start

### Prerequisites

| Tool | Minimum version |
|------|----------------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | latest |
| [Node.js](https://nodejs.org/) | 20 LTS |
| Python | 3.11+ |
| PostgreSQL | 15+ (if running manually) |

---

### Option A — Docker (all services at once)

```bash
# 1. Start PostgreSQL + backend + pgAdmin + frontend
docker compose up -d --build

# 2. Run migrations (first time only)
docker compose exec backend alembic upgrade head
```

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:5173 | React / Vite |
| Backend API | http://localhost:8000 | FastAPI |
| API docs (Swagger) | http://localhost:8000/docs | |
| Health check | http://localhost:8000/health | |
| pgAdmin | http://localhost:5050 | `admin@neuroscan.local` / `admin` |

---

### Option B — Manual (local dev, no Docker for app)

**1. Start PostgreSQL** (Docker one-liner if you don't have a local instance):

```bash
docker run -d \
  -p 5432:5432 \
  -e POSTGRES_USER=neuroscan \
  -e POSTGRES_PASSWORD=neuroscan_pass \
  -e POSTGRES_DB=neuroscan_db \
  postgres:15-alpine
```

> If you already have PostgreSQL installed, check the actual port — it may be 5433 or higher. Update `DATABASE_URL` in `backend/.env` accordingly.

**2. Configure the backend environment:**

```bash
cd backend
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL, SECRET_KEY
```

**3. Backend** (Terminal 1):

```bash
cd backend

python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**4. Frontend** (Terminal 2):

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL async connection string | — (required) |
| `SECRET_KEY` | Signing secret (`openssl rand -hex 32`) | — (required) |
| `UPLOAD_DIR` | Directory for uploaded files | `./uploads` |
| `MAX_FILE_SIZE_MB` | Max upload size in MB | `50` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:5173` |
| `MODEL_BACKEND` | `stub` or `local` | `stub` |
| `MODEL_PATH` | Path to `model.pkl` (used when `MODEL_BACKEND=local`) | `./model/model.pkl` |
| `MODEL_API_URL` | Reserved for future remote model API | `None` |

### URL-encoding special characters in DATABASE_URL

If your PostgreSQL password contains special characters, percent-encode them:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `%` | `%25` |
| `#` | `%23` |
| `:` | `%3A` |

Example — password `my@pass#word`:
```
DATABASE_URL=postgresql+asyncpg://postgres:my%40pass%23word@localhost:5432/neuroscan_db
```

### Frontend environment

`frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

The Vite dev server also proxies `/api/*` to `http://localhost:8000`, so relative API calls work during development without CORS issues.

---

## Running Tests

The test suite uses an in-memory SQLite database — no running PostgreSQL required.

```bash
cd backend
pip install -r requirements.txt   # if not done yet
pytest tests/ -v
```

Expected output:

```
tests/test_api.py::test_health_check            PASSED
tests/test_api.py::test_create_patient          PASSED
tests/test_api.py::test_upload_csv_returns_202  PASSED
tests/test_api.py::test_get_analysis_status     PASSED

4 passed
```

> `asyncio_mode = auto` in `pytest.ini` — no `@pytest.mark.asyncio` decorators needed on test functions.

---

## API Reference

### Patients

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/patients/` | List all patients |
| `POST` | `/api/v1/patients/` | Create a patient |
| `GET` | `/api/v1/patients/{id}` | Get patient + full analysis history |
| `PUT` | `/api/v1/patients/{id}` | Update patient info |
| `DELETE` | `/api/v1/patients/{id}` | Delete patient |

### Uploads & Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/patients/{id}/upload` | Upload CSV + optional MRI/PET → returns `analysis_id` |
| `GET` | `/api/v1/patients/{id}/uploads` | List all uploads for a patient |
| `GET` | `/api/v1/analysis/{id}` | Full analysis detail including `feature_importance` |
| `GET` | `/api/v1/analysis/{id}/status` | Lightweight poll — status, result, confidence |

Full interactive docs at **http://localhost:8000/docs**.

---

## CSV Format

```csv
subject_id,age,gender,MMSE,CDR,eTIV,nWBV,ASF
OAS1_0001,74,F,29,0,1344,0.743,1.306
OAS1_0002,55,M,28,0,1147,0.810,1.531
```

| Column | Description |
|--------|-------------|
| `subject_id` | Unique subject identifier |
| `age` | Patient age in years |
| `gender` | M / F |
| `MMSE` | Mini-Mental State Examination score (0–30) |
| `CDR` | Clinical Dementia Rating (0, 0.5, 1, 2, 3) |
| `eTIV` | Estimated total intracranial volume (mm³) |
| `nWBV` | Normalized whole-brain volume |
| `ASF` | Atlas scaling factor |

Missing columns are filled with zero and logged as a warning — they do not block the analysis.

---

## Accepted File Formats

| Modality | Extensions |
|----------|-----------|
| Biomarkers (required) | `.csv` |
| MRI scan (optional) | `.nii`, `.nii.gz`, `.dcm` |
| PET scan (optional) | `.nii`, `.nii.gz`, `.dcm` |

---

## Integrating a Real AI Model

Plugging in your model is three steps:

**Step 1 — Drop the model file**

```
backend/model/model.pkl
```

See [backend/model/README.md](backend/model/README.md) for the exact model contract: input shape `(n_samples, 7)`, required `predict_proba()` interface, and class order `['AD', 'CN', 'MCI']`.

**Step 2 — Fill in the preprocessing hooks**

Open [backend/app/services/preprocessing.py](backend/app/services/preprocessing.py). The functions `preprocess_mri()` and `preprocess_pet()` are documented stubs with step-by-step comments. Add your NIfTI/DICOM loading and normalization code there. `extract_csv_features()` is already fully implemented (gender encoding, NaN imputation, column validation).

**Step 3 — Activate the local backend**

```env
# backend/.env
MODEL_BACKEND=local
MODEL_PATH=./model/model.pkl
```

Restart the backend. The first analysis request loads `model.pkl` and calls `model.predict_proba()`.

---

### AI Backend Architecture

| Backend | Activated by | Behaviour |
|---------|-------------|-----------|
| `StubBackend` | `MODEL_BACKEND=stub` (default) | Deterministic fake output seeded by MD5 hash of CSV — same input always produces same result |
| `LocalModelBackend` | `MODEL_BACKEND=local` | Loads `model.pkl`; auto-unwraps `sklearn.Pipeline`; falls back to stub with a warning if file is missing |

If the model exposes `.feature_importances_` (tree-based models: RandomForest, XGBoost, etc.), the Result page automatically renders an interpretability bar chart showing each biomarker's contribution. No frontend changes required.

The factory function is `get_model_backend()` in [backend/app/services/ai_model.py](backend/app/services/ai_model.py).

---

## Database Migrations

```bash
# Apply all pending migrations (run after pulling new code)
alembic upgrade head

# Create a new migration after editing ORM models
alembic revision --autogenerate -m "describe the change"

# Roll back one migration
alembic downgrade -1
```

**Migration history:**

| Revision | Description |
|----------|-------------|
| `0001_initial` | `patients` and `analyses` tables, PostgreSQL enum types |
| `0002_feature_importance` | `feature_importance JSON` column on `analyses` |

> `alembic revision --autogenerate` requires a live database. The hand-written migrations in `versions/` work without one.

---

## Known Issues & Gotchas

**PostgreSQL port mismatch** — Multiple installed instances use different ports (5432, 5433, …). Check yours:
```bash
psql -U postgres -c "SHOW port;"
```
Then update `DATABASE_URL` in `backend/.env`.

**`%` in DATABASE_URL breaks Alembic** — Python's `configparser` treats `%` as an interpolation character. `alembic/env.py` escapes it automatically via `.replace("%", "%%")` before passing the URL to Alembic.

**SQLAlchemy async lazy-loading** — Relationship collections (`patient.analyses`) cannot be lazy-loaded in async context. All endpoints that return ORM objects with relationships must use `selectinload()` in the query. `db.refresh()` after a write does **not** load relationships.

**CORS on unhandled exceptions** — Starlette's `ServerErrorMiddleware` is the outermost layer; its 500 responses bypass `CORSMiddleware`. The global `@app.exception_handler(Exception)` in `main.py` converts any unhandled exception into a FastAPI `JSONResponse` so CORS headers are applied correctly.

---

## License

This project is for research and educational purposes only. It does not constitute a medical device and must not be used for clinical diagnosis.
