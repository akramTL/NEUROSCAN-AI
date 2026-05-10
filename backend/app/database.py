from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator

from app.config import settings


# Async engine – echo=False in production; flip to True for SQL debug logging
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,   # recycle stale connections automatically
    pool_size=10,
    max_overflow=20,
)

# Session factory shared across the app
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # objects remain usable after commit without re-query
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides a database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
