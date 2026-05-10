"""End-to-end API tests using an in-memory SQLite database.

Tests run sequentially and share state via _state{} so the full
register → login → create-patient → upload → poll flow is covered.
"""
import asyncio
import io

import pytest

# ── Shared state (passed between dependent tests) ────────────────────────────
_state: dict = {}

# ── Test data ────────────────────────────────────────────────────────────────
SAMPLE_CSV = (
    b"subject_id,age,gender,MMSE,CDR,eTIV,nWBV,ASF\n"
    b"OAS1_0001,74,F,29,0,1344,0.743,1.306\n"
)

DOCTOR_A = {
    "email": "alice@hospital.com",
    "full_name": "Dr. Alice",
    "password": "securepass1",
}
DOCTOR_B = {
    "email": "bob@hospital.com",
    "full_name": "Dr. Bob",
    "password": "securepass2",
}
PATIENT_DATA = {
    "first_name": "Jane",
    "last_name": "Doe",
    "date_of_birth": "1960-01-15",
    "gender": "female",
}


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ════════════════════════════════════════════════════════════════════════════
# Part 1 — Authentication
# ════════════════════════════════════════════════════════════════════════════

async def test_health_check(client):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


async def test_register_doctor(client):
    r = await client.post("/api/v1/auth/register", json=DOCTOR_A)
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == DOCTOR_A["email"]
    assert "id" in body
    assert "hashed_password" not in body
    _state["doctor_a_id"] = body["id"]


async def test_register_duplicate_email_returns_409(client):
    r = await client.post("/api/v1/auth/register", json=DOCTOR_A)
    assert r.status_code == 409


async def test_login_returns_token(client):
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": DOCTOR_A["email"], "password": DOCTOR_A["password"]},
    )
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    _state["token_a"] = body["access_token"]


async def test_login_wrong_password_returns_401(client):
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": DOCTOR_A["email"], "password": "wrongpassword"},
    )
    assert r.status_code == 401


async def test_protected_route_without_token_returns_401(client):
    r = await client.get("/api/v1/patients/")
    assert r.status_code == 401


# ════════════════════════════════════════════════════════════════════════════
# Part 2 — Patient CRUD (authenticated)
# ════════════════════════════════════════════════════════════════════════════

async def test_create_patient(client):
    r = await client.post(
        "/api/v1/patients/",
        json=PATIENT_DATA,
        headers=_auth(_state["token_a"]),
    )
    assert r.status_code == 201
    body = r.json()
    assert "id" in body
    assert body["doctor_id"] == _state["doctor_a_id"]
    _state["patient_id"] = body["id"]


async def test_list_patients_scoped_to_doctor(client):
    r = await client.get("/api/v1/patients/", headers=_auth(_state["token_a"]))
    assert r.status_code == 200
    ids = [p["id"] for p in r.json()]
    assert _state["patient_id"] in ids


# ════════════════════════════════════════════════════════════════════════════
# Part 3 — Doctor isolation
# ════════════════════════════════════════════════════════════════════════════

async def test_doctor_isolation_setup(client):
    """Register Doctor B and create a patient scoped to B."""
    r = await client.post("/api/v1/auth/register", json=DOCTOR_B)
    assert r.status_code == 201

    r = await client.post(
        "/api/v1/auth/login",
        json={"email": DOCTOR_B["email"], "password": DOCTOR_B["password"]},
    )
    assert r.status_code == 200
    _state["token_b"] = r.json()["access_token"]

    r = await client.post(
        "/api/v1/patients/",
        json=PATIENT_DATA,
        headers=_auth(_state["token_b"]),
    )
    assert r.status_code == 201
    _state["patient_b_id"] = r.json()["id"]


async def test_doctor_cannot_see_other_doctors_patients(client):
    # Doctor B must not see Doctor A's patient
    r = await client.get("/api/v1/patients/", headers=_auth(_state["token_b"]))
    assert r.status_code == 200
    ids = [p["id"] for p in r.json()]
    assert _state["patient_id"] not in ids

    # Doctor A must not see Doctor B's patient
    r = await client.get("/api/v1/patients/", headers=_auth(_state["token_a"]))
    ids = [p["id"] for p in r.json()]
    assert _state["patient_b_id"] not in ids


# ════════════════════════════════════════════════════════════════════════════
# Part 4 — Upload validation
# ════════════════════════════════════════════════════════════════════════════

async def test_upload_missing_csv_returns_422(client):
    r = await client.post(
        f"/api/v1/patients/{_state['patient_id']}/upload",
        headers=_auth(_state["token_a"]),
    )
    assert r.status_code == 422


async def test_upload_wrong_extension_returns_415(client):
    r = await client.post(
        f"/api/v1/patients/{_state['patient_id']}/upload",
        files={"csv_file": ("data.txt", io.BytesIO(b"some text content"), "text/plain")},
        headers=_auth(_state["token_a"]),
    )
    assert r.status_code == 415


async def test_upload_file_too_large_returns_413(client):
    # MAX_FILE_SIZE_MB=1 in test config; send 1.1 MB
    large = b"a" * (1024 * 1024 + 1)
    r = await client.post(
        f"/api/v1/patients/{_state['patient_id']}/upload",
        files={"csv_file": ("big.csv", io.BytesIO(large), "text/csv")},
        headers=_auth(_state["token_a"]),
    )
    assert r.status_code == 413


# ════════════════════════════════════════════════════════════════════════════
# Part 5 — Full upload + analysis flow
# ════════════════════════════════════════════════════════════════════════════

async def test_upload_csv_returns_202(client):
    r = await client.post(
        f"/api/v1/patients/{_state['patient_id']}/upload",
        files={"csv_file": ("sample.csv", io.BytesIO(SAMPLE_CSV), "text/csv")},
        headers=_auth(_state["token_a"]),
    )
    assert r.status_code == 202
    body = r.json()
    assert "analysis_id" in body
    _state["analysis_id"] = body["analysis_id"]


async def test_get_analysis_status(client):
    r = await client.get(
        f"/api/v1/analysis/{_state['analysis_id']}/status",
        headers=_auth(_state["token_a"]),
    )
    assert r.status_code == 200
    assert r.json()["status"] in {"pending", "processing", "completed"}


async def test_analysis_status_pending_then_completed(client):
    """Poll until the background task finishes (up to 5 s)."""
    for _ in range(20):
        r = await client.get(
            f"/api/v1/analysis/{_state['analysis_id']}/status",
            headers=_auth(_state["token_a"]),
        )
        assert r.status_code == 200
        if r.json()["status"] == "completed":
            return
        await asyncio.sleep(0.25)
    pytest.fail("Analysis did not complete within 5 seconds")


async def test_analysis_not_found_returns_404(client):
    fake_id = "00000000-0000-0000-0000-000000000000"
    r = await client.get(
        f"/api/v1/analysis/{fake_id}/status",
        headers=_auth(_state["token_a"]),
    )
    assert r.status_code == 404


async def test_doctor_cannot_read_other_doctors_analysis(client):
    """Doctor B must get 404 when requesting Doctor A's analysis."""
    r = await client.get(
        f"/api/v1/analysis/{_state['analysis_id']}",
        headers=_auth(_state["token_b"]),
    )
    assert r.status_code == 404
