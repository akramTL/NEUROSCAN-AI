"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-08 00:00:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "patients",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("doctor_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=False),
        sa.Column("gender", sa.String(length=20), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_patients_doctor_id"), "patients", ["doctor_id"], unique=False)

    op.create_table(
        "analyses",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("patient_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "processing", "completed", "failed", name="analysis_status"),
            nullable=False,
        ),
        sa.Column(
            "result",
            sa.Enum("AD", "CN", "MCI", name="analysis_result"),
            nullable=True,
        ),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("csv_file_path", sa.String(length=512), nullable=False),
        sa.Column("mri_file_path", sa.String(length=512), nullable=True),
        sa.Column("pet_file_path", sa.String(length=512), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_analyses_patient_id"), "analyses", ["patient_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_analyses_patient_id"), table_name="analyses")
    op.drop_table("analyses")
    op.drop_index(op.f("ix_patients_doctor_id"), table_name="patients")
    op.drop_table("patients")
    sa.Enum(name="analysis_result").drop(op.get_bind(), checkfirst=False)
    sa.Enum(name="analysis_status").drop(op.get_bind(), checkfirst=False)
