"""add feature_importance column to analyses

Revision ID: 0002_feature_importance
Revises: 0001_initial
Create Date: 2026-05-08
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0002_feature_importance"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "analyses",
        sa.Column("feature_importance", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("analyses", "feature_importance")
