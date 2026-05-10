"""add doctors table and FK from patients

Revision ID: 0003_add_doctors
Revises: 0002_feature_importance
Create Date: 2026-05-08
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0003_add_doctors"
down_revision = "0002_feature_importance"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "doctors",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_doctors_email"), "doctors", ["email"], unique=True)

    # Remove any patients whose doctor_id doesn't exist in the new doctors table
    # (dev data that used the placeholder UUID 00000000-0000-0000-0000-000000000001)
    op.execute(
        "DELETE FROM patients WHERE doctor_id NOT IN (SELECT id FROM doctors)"
    )

    # Add FK from patients.doctor_id → doctors.id
    op.create_foreign_key(
        "fk_patients_doctor_id",
        "patients",
        "doctors",
        ["doctor_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("fk_patients_doctor_id", "patients", type_="foreignkey")
    op.drop_index(op.f("ix_doctors_email"), table_name="doctors")
    op.drop_table("doctors")
