from __future__ import annotations

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_doctor
from app.models.doctor import Doctor
from app.models.notification import Notification
from app.schemas.notification import NotificationRead, UnreadCountRead

router = APIRouter()


# ── Static routes FIRST — must precede /{id} to avoid UUID parse errors ───────

@router.get("/unread-count", response_model=UnreadCountRead)
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
) -> UnreadCountRead:
    result = await db.execute(
        select(func.count())
        .select_from(Notification)
        .where(
            Notification.doctor_id == current_doctor.id,
            Notification.is_read == False,  # noqa: E712
        )
    )
    return UnreadCountRead(count=result.scalar_one())


@router.get("/", response_model=List[NotificationRead])
async def list_notifications(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
) -> List[NotificationRead]:
    result = await db.execute(
        select(Notification)
        .where(Notification.doctor_id == current_doctor.id)
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.patch("/read-all", response_model=UnreadCountRead)
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
) -> UnreadCountRead:
    await db.execute(
        update(Notification)
        .where(
            Notification.doctor_id == current_doctor.id,
            Notification.is_read == False,  # noqa: E712
        )
        .values(is_read=True)
    )
    await db.commit()
    return UnreadCountRead(count=0)


# ── Parameterized route LAST ───────────────────────────────────────────────────

@router.patch("/{notification_id}/read", response_model=NotificationRead)
async def mark_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
) -> NotificationRead:
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.doctor_id == current_doctor.id,
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return notif
