"""Batch tests: Caracas TZ, entry date validation, member deletion, rates, weekly-report."""
import io
import os
import uuid
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest
import requests
from motor.motor_asyncio import AsyncIOMotorClient  # noqa: F401 (mongo access via env)

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://trabajo-grabado.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
TZ = ZoneInfo("America/Caracas")

# 1x1 transparent PNG
PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d"
    "49444154789c6300010000000500010d0a2db40000000049454e44ae426082"
)


def week_start_of(d: date) -> date:
    return d - timedelta(days=(d.weekday() - 2) % 7)


@pytest.fixture(scope="module")
def admin_headers():
    r = requests.post(f"{API}/auth/login", json={"code": "1209"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="module")
def worker(admin_headers):
    code = str(6000 + (uuid.uuid4().int % 1000))
    r = requests.post(
        f"{API}/admin/workers",
        json={"name": "TEST_Caracas", "code": code},
        headers=admin_headers,
    )
    assert r.status_code == 200, r.text
    w = r.json()
    r2 = requests.post(f"{API}/auth/login", json={"code": code})
    token = r2.json()["token"]
    yield {"id": w["id"], "code": code, "token": token,
           "headers": {"Authorization": f"Bearer {token}"}}
    requests.delete(f"{API}/admin/workers/{w['id']}", headers=admin_headers)


# ---------- 1. Caracas TZ ----------
class TestCaracasTz:
    def test_dashboard_now_and_today(self, worker):
        r = requests.get(f"{API}/me/dashboard", headers=worker["headers"])
        assert r.status_code == 200
        d = r.json()
        # now should be ISO string containing -04:00 offset
        assert "-04:00" in d["now"], d["now"]
        now_car = datetime.fromisoformat(d["now"])
        # today_date should match Caracas today
        assert d["today_date"] == now_car.date().isoformat()
        # week.start is Wednesday of current Caracas week
        ws = date.fromisoformat(d["week"]["start"])
        assert ws.weekday() == 2  # Wed
        assert ws == week_start_of(now_car.date())


# ---------- 2. POST /entries date semantics ----------
class TestEntryDate:
    def test_future_date_rejected(self, worker):
        tomorrow = (datetime.now(TZ).date() + timedelta(days=1)).isoformat()
        r = requests.post(
            f"{API}/entries",
            data={"minutes": "10", "date": tomorrow},
            files={"screenshot": ("s.png", io.BytesIO(PNG), "image/png")},
            headers=worker["headers"],
        )
        assert r.status_code == 400
        assert "aún no ha llegado" in r.json()["detail"]

    def test_prev_week_date_rejected(self, worker):
        prev = (week_start_of(datetime.now(TZ).date()) - timedelta(days=1)).isoformat()
        r = requests.post(
            f"{API}/entries",
            data={"minutes": "10", "date": prev},
            files={"screenshot": ("s.png", io.BytesIO(PNG), "image/png")},
            headers=worker["headers"],
        )
        assert r.status_code == 400

    def test_past_day_this_week_ok_then_duplicate_409(self, worker):
        today = datetime.now(TZ).date()
        ws = week_start_of(today)
        # pick yesterday or the earliest past day in week that is not today
        target = today - timedelta(days=1) if today > ws else today
        if target < ws:
            target = today  # fallback: today
        r = requests.post(
            f"{API}/entries",
            data={"minutes": "45", "date": target.isoformat()},
            files={"screenshot": ("s.png", io.BytesIO(PNG), "image/png")},
            headers=worker["headers"],
        )
        assert r.status_code == 200, r.text
        entry = r.json()
        assert entry["date"] == target.isoformat()
        assert entry["minutes"] == 45
        assert "created_at" in entry

        # duplicate → 409
        r2 = requests.post(
            f"{API}/entries",
            data={"minutes": "20", "date": target.isoformat()},
            files={"screenshot": ("s.png", io.BytesIO(PNG), "image/png")},
            headers=worker["headers"],
        )
        assert r2.status_code == 409


# ---------- 3. DELETE /entries/{id} ----------
class TestDeleteMyEntry:
    def test_delete_current_week_ok(self, worker):
        # get list from dashboard
        r = requests.get(f"{API}/me/dashboard", headers=worker["headers"])
        entries = r.json()["entries"]
        assert entries, "worker should have at least one entry from previous test"
        eid = entries[0]["id"]
        r = requests.delete(f"{API}/entries/{eid}", headers=worker["headers"])
        assert r.status_code == 200, r.text
        assert r.json()["deleted"] is True

    def test_delete_nonexistent_404(self, worker):
        r = requests.delete(f"{API}/entries/nope-{uuid.uuid4()}", headers=worker["headers"])
        assert r.status_code == 404

    def test_delete_other_users_entry_404(self, worker, admin_headers):
        # create another worker+entry
        code = str(5000 + (uuid.uuid4().int % 1000))
        r = requests.post(f"{API}/admin/workers",
                          json={"name": "TEST_Other", "code": code}, headers=admin_headers)
        other_id = r.json()["id"]
        tok = requests.post(f"{API}/auth/login", json={"code": code}).json()["token"]
        r = requests.post(
            f"{API}/entries",
            data={"minutes": "30"},
            files={"screenshot": ("s.png", io.BytesIO(PNG), "image/png")},
            headers={"Authorization": f"Bearer {tok}"},
        )
        eid = r.json()["id"]
        # first worker tries to delete → 404
        r = requests.delete(f"{API}/entries/{eid}", headers=worker["headers"])
        assert r.status_code == 404
        # cleanup
        requests.delete(f"{API}/admin/workers/{other_id}", headers=admin_headers)

    def test_delete_prev_week_entry_400(self, worker, admin_headers):
        """Insert a prev-week entry directly via Mongo, then try to delete it."""
        import asyncio
        mongo_url = os.environ["MONGO_URL"]
        db_name = os.environ["DB_NAME"]

        async def insert_prev():
            cli = AsyncIOMotorClient(mongo_url)
            db = cli[db_name]
            prev = (week_start_of(datetime.now(TZ).date()) - timedelta(days=2)).isoformat()
            eid = str(uuid.uuid4())
            await db.entries.insert_one({
                "id": eid, "worker_id": worker["id"], "date": prev,
                "minutes": 60, "screenshot_path": "test/none.png",
                "created_at": datetime.utcnow().isoformat(),
            })
            cli.close()
            return eid, prev

        eid, prev = asyncio.run(insert_prev())
        r = requests.delete(f"{API}/entries/{eid}", headers=worker["headers"])
        assert r.status_code == 400
        assert "semana en curso" in r.json()["detail"]
        # cleanup via admin
        requests.delete(f"{API}/admin/entries/{eid}", headers=admin_headers)


# ---------- 4. Rates ----------
class TestRates:
    def test_get_rates_defaults(self, admin_headers):
        r = requests.get(f"{API}/admin/rates", headers=admin_headers)
        assert r.status_code == 200
        j = r.json()
        assert "current" in j and "week_start" in j and "history" in j
        assert "kgen_rate" in j["current"] and "bonus_rate" in j["current"]

    def test_put_and_effect_on_dashboard(self, admin_headers, worker):
        # set 5.0 / 0.35
        r = requests.put(
            f"{API}/admin/rates",
            json={"kgen_rate": 5.0, "bonus_rate": 0.35},
            headers=admin_headers,
        )
        assert r.status_code == 200
        j = r.json()
        cur_ws = week_start_of(datetime.now(TZ).date()).isoformat()
        assert j["week_start"] == cur_ws
        assert j["kgen_rate"] == 5.0

        # create a small entry so worker has hours this week
        today = datetime.now(TZ).date()
        r = requests.post(
            f"{API}/entries",
            data={"minutes": "60", "date": today.isoformat()},
            files={"screenshot": ("s.png", io.BytesIO(PNG), "image/png")},
            headers=worker["headers"],
        )
        # 200 or 409 depending on prior tests
        assert r.status_code in (200, 409)

        r = requests.get(f"{API}/me/dashboard", headers=worker["headers"])
        d = r.json()
        assert d["rates"]["kgen_rate"] == 5.0
        assert d["rates"]["bonus_rate"] == 0.35
        # estimate.kgen == hours * 5
        hours = d["week"]["hours"]
        assert d["estimate"]["kgen"] == round(hours * 5.0, 2)

        # restore defaults
        r = requests.put(
            f"{API}/admin/rates",
            json={"kgen_rate": 4.0, "bonus_rate": 0.30},
            headers=admin_headers,
        )
        assert r.status_code == 200

    def test_negative_rejected(self, admin_headers):
        r = requests.put(
            f"{API}/admin/rates",
            json={"kgen_rate": -1, "bonus_rate": 0.3},
            headers=admin_headers,
        )
        assert r.status_code == 400


# ---------- 5. weekly-report-done ----------
class TestWeeklyReportDone:
    def test_mark_done(self, worker):
        r = requests.post(f"{API}/me/weekly-report-done", headers=worker["headers"])
        assert r.status_code == 200
        prev_ws = (week_start_of(datetime.now(TZ).date()) - timedelta(days=7)).isoformat()
        assert r.json()["done"] == prev_ws

        r = requests.get(f"{API}/me/dashboard", headers=worker["headers"])
        assert r.json()["weekly_report"]["done"] is True
