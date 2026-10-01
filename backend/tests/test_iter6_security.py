"""Iteration 6 tests: PIN hash/encrypt, file token, image validation, custom xlsx, change-code.

Login-rate-limit tests are deferred until the very end to avoid locking out the IP
for other tests (5-fail / 15-min window per IP).
"""
import io
import os
import struct
import time
import uuid
import zlib

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_CODE = os.environ.get("TEST_ADMIN_CODE", "1209")


def _png_bytes(w=2, h=2):
    """Return a valid minimal PNG."""
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    raw = b"".join(b"\x00" + b"\xff\x00\x00" * w for _ in range(h))
    idat = zlib.compress(raw)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"code": ADMIN_CODE})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_h(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def temp_member(admin_h):
    code = str(7000 + (uuid.uuid4().int % 1000))
    while True:
        r = requests.post(f"{API}/admin/workers", json={"name": "TEST_Iter6", "code": code}, headers=admin_h)
        if r.status_code == 200:
            break
        code = str(7000 + (uuid.uuid4().int % 1000))
    w = r.json()
    yield {"id": w["id"], "code": code, "obj": w}
    requests.delete(f"{API}/admin/workers/{w['id']}", headers=admin_h)


# =============== Workers: code plaintext returned to admin, code_hash/code_enc hidden ===============
class TestWorkersCodeExposure:
    def test_create_returns_plaintext_code(self, temp_member):
        w = temp_member["obj"]
        assert w.get("code") == temp_member["code"]
        assert "code_hash" not in w
        assert "code_enc" not in w

    def test_list_returns_plaintext_code(self, admin_h, temp_member):
        r = requests.get(f"{API}/admin/workers", headers=admin_h)
        assert r.status_code == 200
        row = next(x for x in r.json() if x["id"] == temp_member["id"])
        assert row.get("code") == temp_member["code"]
        assert "code_hash" not in row and "code_enc" not in row

    def test_member_login_with_original_and_updated(self, admin_h, temp_member):
        r = requests.post(f"{API}/auth/login", json={"code": temp_member["code"]})
        assert r.status_code == 200
        # Change code
        new_code = str(int(temp_member["code"]) + 1).zfill(4)
        r2 = requests.put(f"{API}/admin/workers/{temp_member['id']}",
                          json={"name": "TEST_Iter6", "code": new_code}, headers=admin_h)
        assert r2.status_code == 200, r2.text
        assert r2.json()["code"] == new_code
        # Old code fails
        r3 = requests.post(f"{API}/auth/login", json={"code": temp_member["code"]})
        assert r3.status_code in (401, 429)
        # New works
        r4 = requests.post(f"{API}/auth/login", json={"code": new_code})
        assert r4.status_code == 200
        temp_member["code"] = new_code  # keep updated for later tests


# =============== Files: file-token, upload, GET /api/files with tokens ===============
class TestFilesAndUpload:
    @pytest.fixture(scope="class")
    def member_token(self, temp_member):
        r = requests.post(f"{API}/auth/login", json={"code": temp_member["code"]})
        assert r.status_code == 200
        return r.json()["token"]

    def test_file_token_endpoint(self, member_token):
        r = requests.post(f"{API}/auth/file-token", headers={"Authorization": f"Bearer {member_token}"})
        assert r.status_code == 200
        j = r.json()
        assert "token" in j and j["expires_in"] == 900

    def test_upload_png_and_fetch(self, member_token, temp_member):
        from datetime import date as _d
        # Get today's server date via admin_week... easier: use dashboard
        r = requests.get(f"{API}/me/dashboard", headers={"Authorization": f"Bearer {member_token}"})
        assert r.status_code == 200
        today = r.json()["today_date"]
        # If already registered, delete first
        for e in r.json().get("entries", []):
            if e["date"] == today:
                requests.delete(f"{API}/entries/{e['id']}", headers={"Authorization": f"Bearer {member_token}"})
        png = _png_bytes()
        files = {"screenshot": ("shot.png", png, "image/png")}
        data = {"minutes": "120", "date": today}
        r2 = requests.post(f"{API}/entries", data=data, files=files,
                           headers={"Authorization": f"Bearer {member_token}"})
        assert r2.status_code == 200, r2.text
        path = r2.json()["screenshot_path"]
        # Get file-token
        ft = requests.post(f"{API}/auth/file-token",
                           headers={"Authorization": f"Bearer {member_token}"}).json()["token"]
        r3 = requests.get(f"{API}/files/{path}", params={"token": ft})
        assert r3.status_code == 200
        assert r3.headers["Content-Type"] == "image/png"
        # Session token (scope=auth) must be rejected
        r4 = requests.get(f"{API}/files/{path}", params={"token": member_token})
        assert r4.status_code == 401

    def test_reject_fake_image(self, member_token):
        r = requests.get(f"{API}/me/dashboard", headers={"Authorization": f"Bearer {member_token}"})
        today = r.json()["today_date"]
        # remove any today's entry
        for e in r.json().get("entries", []):
            if e["date"] == today:
                requests.delete(f"{API}/entries/{e['id']}", headers={"Authorization": f"Bearer {member_token}"})
        files = {"screenshot": ("fake.png", b"hello world not an image", "image/png")}
        r = requests.post(f"{API}/entries", data={"minutes": "30", "date": today}, files=files,
                          headers={"Authorization": f"Bearer {member_token}"})
        assert r.status_code == 400
        assert "imagen" in r.json().get("detail", "").lower()


# =============== Custom payout XLSX ===============
class TestCustomPayout:
    def test_valid_xlsx(self, admin_h):
        payload = {"rows": [
            {"account_type": "Binance ID (BUID)", "account": "553311224", "currency": "USDT", "amount": 4.87, "note": "X"},
            {"account_type": "Binance Registered Email", "account": "a@b.com", "amount": 2},
        ]}
        r = requests.post(f"{API}/admin/payments/custom.xlsx", json=payload, headers=admin_h)
        assert r.status_code == 200
        ct = r.headers.get("Content-Type", "")
        assert "spreadsheet" in ct
        # Parse and verify row 3
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(r.content))
        ws = wb.active
        row3 = [ws.cell(row=3, column=c).value for c in range(1, 6)]
        assert row3 == ["Binance ID (BUID)", "553311224", "USDT", 4.87, "X"]

    def test_invalid_type(self, admin_h):
        r = requests.post(f"{API}/admin/payments/custom.xlsx",
                          json={"rows": [{"account_type": "Bogus", "account": "x", "amount": 1}]}, headers=admin_h)
        assert r.status_code == 400

    def test_empty_rows(self, admin_h):
        r = requests.post(f"{API}/admin/payments/custom.xlsx", json={"rows": []}, headers=admin_h)
        assert r.status_code == 400


# =============== Change admin code ===============
class TestChangeAdminCode:
    def test_flow(self, admin_h, temp_member):
        # wrong current -> 401
        r = requests.post(f"{API}/admin/change-code",
                          json={"current_code": "0000", "new_code": "5555"}, headers=admin_h)
        assert r.status_code == 401
        # new equal to a member's code -> 409
        r = requests.post(f"{API}/admin/change-code",
                          json={"current_code": ADMIN_CODE, "new_code": temp_member["code"]}, headers=admin_h)
        assert r.status_code == 409, r.text
        # success -> 5555
        r = requests.post(f"{API}/admin/change-code",
                          json={"current_code": ADMIN_CODE, "new_code": "5555"}, headers=admin_h)
        assert r.status_code == 200
        # login with 5555 works
        r = requests.post(f"{API}/auth/login", json={"code": "5555"})
        assert r.status_code == 200
        # RESTORE
        new_admin_h = {"Authorization": f"Bearer {r.json()['token']}"}
        r = requests.post(f"{API}/admin/change-code",
                          json={"current_code": "5555", "new_code": ADMIN_CODE}, headers=new_admin_h)
        assert r.status_code == 200
        # Verify restored
        r = requests.post(f"{API}/auth/login", json={"code": ADMIN_CODE})
        assert r.status_code == 200


# =============== Regression: automatic export ===============
class TestRegressionExport:
    def test_export_preview(self, admin_h):
        r = requests.get(f"{API}/admin/payments/export", headers=admin_h)
        assert r.status_code == 200
        j = r.json()
        for k in ("rows", "ready_count", "ready_total", "currency"):
            assert k in j


# =============== LOGIN RATE LIMIT - run LAST ===============
# Marked with a special name so it can be selected/deselected easily.
class TestLoginRateLimitLast:
    def test_zzz_rate_limit_locks_ip(self):
        """Deliberately last: this locks the current IP out for 15 minutes."""
        if os.environ.get("SKIP_RATE_LIMIT_TEST") == "1":
            pytest.skip("skipped by env")
        # 5 fails should trigger 429 with Retry-After
        got_429 = False
        for _ in range(7):
            r = requests.post(f"{API}/auth/login", json={"code": "0001"})
            if r.status_code == 429:
                got_429 = True
                assert "Retry-After" in {k for k in r.headers.keys()} or "retry-after" in {k.lower() for k in r.headers.keys()}
                break
            assert r.status_code == 401
        assert got_429, "Expected 429 after 5 failed logins from same IP"
