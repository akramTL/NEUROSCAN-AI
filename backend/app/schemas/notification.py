from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

NotificationType = Literal["analysis_complete", "analysis_failed", "new_patient"]


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: NotificationType
    title: str
    message: str
    is_read: bool
    created_at: datetime
    analysis_id: uuid.UUID | None
    patient_id: uuid.UUID | None


class UnreadCountRead(BaseModel):
    count: int
