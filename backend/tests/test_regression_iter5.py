"""Iteration 5 regression: verify me_dashboard refactor kept all expected keys/values."""
import io
import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
API = f"{BASE_URL}/api"

CARACAS = timezone(timedelta(hours=-4))
PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
    "0000000d49444154789c6300010000000500010d0a2db40000000049454e44ae426082"
)


@pytest.fixture(scope="module")
def admin_headers():
    r = requests.post(f"{API}/auth/login", json={"code": "1209"})
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="module")
def seeded_worker(admin_headers):
    code = str(7000 + uuid.uuid4().int % 1000)
    r = requests.post(
        f"{API}/admin/workers",
        json={"name": "TEST_Iter5", "code": code},
        headers=admin_headers,
    )
    assert r.status_code == 200, r.text
    wid = r.json()["id"]
    # login as worker
    tok = requests.post(f"{API}/auth/login", json={"code": code}).json()["token"]
    wh = {"Authorization": f"Bearer {tok}"}
    # seed 3 entries current week: today, yesterday, day before (build a streak)
    today = datetime.now(CARACAS).date()
    for delta in (2, 1, 0):
        d = today - timedelta(days=delta)
        files = {"screenshot": ("s.png", io.BytesIO(PNG), "image/png")}
        rr = requests.post(
            f"{API}/entries",
            data={"minutes": "60", "date": d.isoformat()},
            files=files,
            headers=wh,
        )
        assert rr.status_code in (200, 409), rr.text
    yield {"id": wid, "code": code, "headers": wh}
    requests.delete(f"{API}/admin/workers/{wid}", headers=admin_headers)


class TestDashboardShape:
    """Ensure post-refactor dashboard returns exactly the same top-level keys."""

    EXPECTED_TOP = {
        "name", "now", "today_date", "rates", "estimate", "earnings",
        "weekly_report", "binance_pay_id", "usdt_bep20_address",
        "streak", "best_streak", "on_fire",
        "days", "weeks",
        "day_minutes", "day_reviewed",
        "today", "week",
        "global_rank", "global_minutes", "historical_minutes",
        "weekly", "global", "entries",
    }

    def test_all_top_level_keys_present(self, seeded_worker):
        r = requests.get(f"{API}/me/dashboard", headers=seeded_worker["headers"])
        assert r.status_code == 200, r.text
        d = r.json()
        missing = self.EXPECTED_TOP - set(d.keys())
        assert not missing, f"missing keys after refactor: {missing}"

    def test_estimate_subkeys(self, seeded_worker):
        d = requests.get(f"{API}/me/dashboard", headers=seeded_worker["headers"]).json()
        for k in ("kgen", "bonus_if_goal", "bonus_now"):
            assert k in d["estimate"], f"estimate missing {k}"

    def test_weekly_report_subkeys(self, seeded_worker):
        d = requests.get(f"{API}/me/dashboard", headers=seeded_worker["headers"]).json()
        for k in ("due", "done", "prev_week_start", "prev_week_end", "prev_minutes"):
            assert k in d["weekly_report"], f"weekly_report missing {k}"

    def test_today_and_week_subkeys(self, seeded_worker):
        d = requests.get(f"{API}/me/dashboard", headers=seeded_worker["headers"]).json()
        assert "registered" in d["today"] and "minutes" in d["today"]
        for k in (
            "start", "end", "payday", "kgen_payday", "minutes", "hours",
            "goal_minutes", "remaining_minutes", "qualifies", "base",
            "bonus_pct", "bonus", "estimated_total", "kgen", "rank",
        ):
            assert k in d["week"], f"week missing {k}"

    def test_days_length_7(self, seeded_worker):
        d = requests.get(f"{API}/me/dashboard", headers=seeded_worker["headers"]).json()
        assert isinstance(d["days"], list) and len(d["days"]) == 7

    def test_weeks_structure(self, seeded_worker):
        d = requests.get(f"{API}/me/dashboard", headers=seeded_worker["headers"]).json()
        assert isinstance(d["weeks"], list) and len(d["weeks"]) > 0
        current = [w for w in d["weeks"] if w.get("status") == "current"]
        assert len(current) == 1, "must have exactly one current week"
        w = current[0]
        for k in ("status", "paid", "closed", "qualifies", "kgen_payday", "bonus_payday"):
            assert k in w, f"week entry missing {k}"


class TestDashboardStreakAndEarnings:
    def test_streak_from_three_consecutive_days(self, seeded_worker):
        d = requests.get(f"{API}/me/dashboard", headers=seeded_worker["headers"]).json()
        # We seeded 3 consecutive days (today included). Streak should be 3, best_streak >= 3
        assert d["streak"] == 3, f"streak={d['streak']} expected 3"
        assert d["best_streak"] >= 3
        assert d["on_fire"] in (True, False)

    def test_estimate_kgen_matches_hours_times_rate(self, seeded_worker):
        d = requests.get(f"{API}/me/dashboard", headers=seeded_worker["headers"]).json()
        rate = float(d["rates"]["kgen_rate"])
        hours = d["week"]["minutes"] / 60.0
        expected = round(hours * rate, 4)
        actual = float(d["estimate"]["kgen"])
        assert abs(actual - expected) < 0.01, (
            f"estimate.kgen={actual} expected≈{expected} (hours={hours}, rate={rate})"
        )

    def test_earnings_is_list(self, seeded_worker):
        d = requests.get(f"{API}/me/dashboard", headers=seeded_worker["headers"]).json()
        assert isinstance(d["earnings"], list)
