"""add notifications table

Revision ID: 0004_add_notifications
Revises: 0003_add_doctors
Create Date: 2026-05-16
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0004_add_notifications"
down_revision = "0003_add_doctors"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "type",
            sa.Enum(
                "analysis_complete", "analysis_failed", "new_patient",
                name="notification_type",
            ),
            nullable=False,
        ),
        sa.Column("title",   sa.String(255),  nullable=False),
        sa.Column("message", sa.String(1000), nullable=False),
        sa.Column(
            "is_read",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("analysis_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("patient_id",  postgresql.UUID(as_uuid=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["doctor_id"], ["doctors.id"],   ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["analysis_id"], ["analyses.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["patient_id"], ["patients.id"],  ondelete="SET NULL"
        ),
    )
    op.create_index("ix_notifications_doctor_id",  "notifications", ["doctor_id"])
    op.create_index("ix_notifications_created_at", "notifications", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_notifications_created_at", table_name="notifications")
    op.drop_index("ix_notifications_doctor_id",  table_name="notifications")
    op.drop_table("notifications")
    op.execute("DROP TYPE IF EXISTS notification_type")
