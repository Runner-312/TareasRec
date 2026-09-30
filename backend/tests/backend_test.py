"""Backend tests for TareasREC — auth, workers CRUD, entries, dashboard, admin views."""
import io
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


# ---------- fixtures ----------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"code": os.environ["TEST_ADMIN_CODE"]})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["role"] == "admin"
    assert data["user"]["name"] == "Wuilber"
    return data["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def temp_worker(admin_headers):
    """Create a temp worker for tests, deleted at teardown."""
    code = str(9000 + (uuid.uuid4().int % 1000))
    r = requests.post(f"{API}/admin/workers", json={"name": "TEST_Worker", "code": code}, headers=admin_headers)
    assert r.status_code == 200, r.text
    w = r.json()
    yield {"id": w["id"], "code": code, "name": w["name"]}
    requests.delete(f"{API}/admin/workers/{w['id']}", headers=admin_headers)


# ---------- auth ----------
class TestAuth:
    def test_login_admin_ok(self, admin_token):
        assert admin_token

    def test_login_wrong_code(self):
        r = requests.post(f"{API}/auth/login", json={"code": "0000"})
        assert r.status_code == 401

    def test_login_bad_format(self):
        r = requests.post(f"{API}/auth/login", json={"code": "12"})
        assert r.status_code == 400

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_ok(self, admin_headers):
        r = requests.get(f"{API}/auth/me", headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"


# ---------- workers CRUD ----------
class TestWorkers:
    def test_list(self, admin_headers):
        r = requests.get(f"{API}/admin/workers", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_duplicate_code_rejected(self, admin_headers, temp_worker):
        r = requests.post(f"{API}/admin/workers",
                          json={"name": "Dup", "code": temp_worker["code"]}, headers=admin_headers)
        assert r.status_code == 400

    def test_create_bad_code(self, admin_headers):
        r = requests.post(f"{API}/admin/workers", json={"name": "X", "code": "12"}, headers=admin_headers)
        assert r.status_code == 400

    def test_update(self, admin_headers, temp_worker):
        r = requests.put(f"{API}/admin/workers/{temp_worker['id']}",
                         json={"name": "TEST_Renamed"}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_Renamed"

    def test_worker_login(self, temp_worker):
        r = requests.post(f"{API}/auth/login", json={"code": temp_worker["code"]})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "worker"


# ---------- entries ----------
class TestEntries:
    def test_create_entry_and_duplicate(self, temp_worker):
        r = requests.post(f"{API}/auth/login", json={"code": temp_worker["code"]})
        token = r.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        # tiny PNG
        png = bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6300010000000500010d0a2db40000000049454e44ae426082")
        files = {"screenshot": ("s.png", io.BytesIO(png), "image/png")}
        data = {"minutes": "30"}
        r = requests.post(f"{API}/entries", data=data, files=files, headers=headers)
        # Might be 200 or 409 if already registered today (fresh worker => 200)
        assert r.status_code in (200, 409)
        if r.status_code == 200:
            # 2nd attempt must be 409
            files2 = {"screenshot": ("s.png", io.BytesIO(png), "image/png")}
            r2 = requests.post(f"{API}/entries", data={"minutes": "10"}, files=files2, headers=headers)
            assert r2.status_code == 409

    def test_dashboard(self, temp_worker):
        r = requests.post(f"{API}/auth/login", json={"code": temp_worker["code"]})
        token = r.json()["token"]
        r = requests.get(f"{API}/me/dashboard", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        d = r.json()
        assert "week" in d and "weekly" in d and "global" in d


# ---------- admin views ----------
class TestAdminViews:
    def test_week(self, admin_headers):
        r = requests.get(f"{API}/admin/week", headers=admin_headers)
        assert r.status_code == 200
        j = r.json()
        assert j["is_current"] is True
        assert len(j["days"]) == 7
        assert j["days"][0]["label"] == "Mié"
        assert j["days"][6]["label"] == "Mar"

    def test_rankings(self, admin_headers):
        r = requests.get(f"{API}/admin/rankings", headers=admin_headers)
        assert r.status_code == 200
        j = r.json()
        assert "weekly" in j and "global" in j

    def test_overview(self, admin_headers):
        r = requests.get(f"{API}/admin/overview", headers=admin_headers)
        assert r.status_code == 200
        j = r.json()
        assert "total_paid" in j and "pending" in j

    def test_entries(self, admin_headers):
        r = requests.get(f"{API}/admin/entries", headers=admin_headers)
        assert r.status_code == 200

    def test_maria_payment_math(self, admin_headers):
        """Deprecated: Prueba Maria removed from seed. Retain as skip."""
        pytest.skip("Seed data no longer includes Prueba Maria")


# ---------- payments toggle ----------
class TestPayments:
    def test_mark_and_unmark(self, admin_headers):
        # get a current-week worker with total > 0
        r = requests.get(f"{API}/admin/week", headers=admin_headers)
        j = r.json()
        candidate = next((row for row in j["table"] if row["total"] > 0), None)
        if not candidate:
            pytest.skip("no payable worker")
        ws = j["week_start"]
        r = requests.post(f"{API}/admin/payments",
                          json={"worker_id": candidate["id"], "week_start": ws}, headers=admin_headers)
        assert r.status_code == 200
        # unmark
        r = requests.delete(f"{API}/admin/payments",
                            params={"worker_id": candidate["id"], "week_start": ws}, headers=admin_headers)
        assert r.status_code == 200
