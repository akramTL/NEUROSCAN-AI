"""
Test configuration.

CRITICAL: os.environ must be set BEFORE any app.* import because app/config.py
calls `settings = Settings()` at module level. pytest loads conftest.py before
collecting test files, so these assignments run first.
"""
import os
import pathlib
import tempfile

_tmp = tempfile.mkdtemp(prefix="neuroscan_test_")

os.environ.setdefault("DATABASE_URL", f"sqlite+aiosqlite:///{_tmp}/test.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
os.environ.setdefault("UPLOAD_DIR", f"{_tmp}/uploads")
os.environ.setdefault("MAX_FILE_SIZE_MB", "1")   # 1 MB keeps large-file tests fast
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.main import app
from app.database import Base, get_db

_DB_URL = os.environ["DATABASE_URL"]

engine = create_async_engine(_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def override_get_db():
    async with TestingSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    pathlib.Path(os.environ["UPLOAD_DIR"]).mkdir(parents=True, exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
