# NeuroScan AI — Deployment Guide

## Architecture
- Frontend: Vercel (React + Vite)
- Backend: Railway (FastAPI + Docker)
- Database: Railway PostgreSQL addon
- Models: Included in repository (backend/model/)

## Step 1 — Deploy Backend on Railway

1. Go to railway.app → New Project → Deploy from GitHub
2. Select your neuroscan-ai repository
3. Set Root Directory: backend
4. Railway detects Dockerfile automatically
5. Add PostgreSQL: New → Database → Add PostgreSQL
   Railway injects DATABASE_URL automatically
6. Add these environment variables in Railway dashboard:
   SECRET_KEY=<run: openssl rand -hex 32>
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=480
   UPLOAD_DIR=/app/uploads
   MAX_FILE_SIZE_MB=100
   MODEL_BACKEND=local
   MODEL_PATH=./model/model.pkl
   MRI_MODEL_PATH=./model/model_v2_bal0.7724_ep1.pth
   ALLOWED_ORIGINS=["https://your-vercel-url.vercel.app"]
7. Deploy → wait for build (5-10 minutes first time)
8. Copy your Railway URL: https://xxxx.railway.app

## Step 2 — Deploy Frontend on Vercel

1. Go to vercel.com → New Project → Import GitHub repo
2. Set Root Directory: frontend
3. Framework: Vite (auto-detected)
4. Add environment variable:
   VITE_API_BASE_URL=https://xxxx.railway.app/api/v1
   (use your Railway URL from Step 1)
5. Deploy

## Step 3 — Update CORS

After Vercel deploys, copy your Vercel URL (https://xxxx.vercel.app)
Go to Railway dashboard → Variables → update:
ALLOWED_ORIGINS=["https://xxxx.vercel.app"]
Redeploy backend.

## Step 4 — Run Migrations

Railway runs migrations automatically via railway.toml startCommand:
alembic upgrade head && uvicorn ...

## Verify Deployment

curl https://xxxx.railway.app/health
Expected: {"status":"ok","version":"1.0.0"}

## Troubleshooting

Build fails with torch error:
  → Verify requirements.txt has --extra-index-url as first line
  → Verify Dockerfile installs torch==2.1.0+cpu explicitly

CORS error in browser:
  → Update ALLOWED_ORIGINS in Railway to match exact Vercel URL
  → Redeploy backend after changing

Database connection error:
  → Verify Railway PostgreSQL addon is attached to backend service
  → DATABASE_URL is injected automatically — do not set manually
