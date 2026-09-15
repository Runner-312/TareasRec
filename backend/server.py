from dotenv import load_dotenv
load_dotenv()

import os
import io
import re
import uuid
import asyncio
import logging
from datetime import datetime, timezone, timedelta, date
from typing import Optional

import jwt
import openpyxl
import requests
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ADMIN_CODE = os.environ.get("ADMIN_CODE", "1209")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "wuilber1209@gmail.com")
APP_NAME = os.environ.get("APP_NAME", "tareasrec")

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
storage_key = None


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


app = FastAPI()
api_router = APIRouter(prefix="/api")
bearer = HTTPBearer(auto_error=False)

DAY_LABELS = ["Mié", "Jue", "Vie", "Sáb", "Dom", "Lun", "Mar"]
BONUS = {1: 0.30, 2: 0.20, 3: 0.10}
RATE_PER_HOUR = 0.30
GOAL_MINUTES = 600
PAYOUT_CURRENCY = "USDT"
TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "binance_template.xlsx")


def week_start_of(d: date) -> date:
    return d - timedelta(days=(d.weekday() - 2) % 7)


def calc_payment(minutes: int, rank: Optional[int]):
    hours = minutes / 60
    qualifies = hours > 10
    base = round(hours * RATE_PER_HOUR, 2) if qualifies else 0.0
    bonus_pct = BONUS.get(rank, 0.0) if qualifies and rank else 0.0
    bonus = round(base * bonus_pct, 2)
    return {
        "hours": round(hours, 2),
        "qualifies": qualifies,
        "base": base,
        "bonus_pct": bonus_pct,
        "bonus": bonus,
        "total": round(base + bonus, 2),
    }


def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    if not creds:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user


async def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo administrador")
    return user


async def build_week_table(ws: date):
    we = ws + timedelta(days=6)
    workers = await db.users.find({"role": "worker"}, {"_id": 0}).to_list(1000)
    entries = await db.entries.find(
        {"date": {"$gte": ws.isoformat(), "$lte": we.isoformat()}}, {"_id": 0}
    ).to_list(100000)
    minutes_by = {}
    for e in entries:
        minutes_by[e["worker_id"]] = minutes_by.get(e["worker_id"], 0) + e["minutes"]
    rows = []
    for w in workers:
        rows.append({"id": w["id"], "name": w["name"], "minutes": minutes_by.get(w["id"], 0)})
    rows.sort(key=lambda r: (-r["minutes"], r["name"].lower()))
    for i, r in enumerate(rows):
        r["rank"] = i + 1 if r["minutes"] > 0 else None
        r.update(calc_payment(r["minutes"], r["rank"]))
    paid = await db.payments.find({"week_start": ws.isoformat()}, {"_id": 0}).to_list(10000)
    paid_map = {p["worker_id"]: p for p in paid}
    for r in rows:
        r["paid"] = r["id"] in paid_map
    return rows, entries


async def build_global_ranking():
    workers = await db.users.find({"role": "worker"}, {"_id": 0}).to_list(1000)
    pipeline = [{"$group": {"_id": "$worker_id", "minutes": {"$sum": "$minutes"}}}]
    agg = await db.entries.aggregate(pipeline).to_list(10000)
    minutes_by = {a["_id"]: a["minutes"] for a in agg}
    rows = [
        {"id": w["id"], "name": w["name"], "minutes": minutes_by.get(w["id"], 0) + int(w.get("historical_minutes") or 0)}
        for w in workers
    ]
    rows.sort(key=lambda r: (-r["minutes"], r["name"].lower()))
    for i, r in enumerate(rows):
        r["rank"] = i + 1 if r["minutes"] > 0 else None
        r["hours"] = round(r["minutes"] / 60, 2)
    return rows


class LoginBody(BaseModel):
    code: str


class WorkerBody(BaseModel):
    name: str
    code: Optional[str] = None
    binance_pay_id: Optional[str] = None
    usdt_bep20_address: Optional[str] = None
    historical_minutes: Optional[int] = None


class WalletBody(BaseModel):
    usdt_bep20_address: str


def clean_wallet(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    v = value.strip()
    if v == "":
        return ""
    if not re.fullmatch(r"[0-9A-Za-z]{20,64}", v):
        raise HTTPException(status_code=400, detail="La dirección USDT (BEP20) no parece válida (20-64 letras y números)")
    return v


def clean_binance(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    return value.strip()[:40]


class PaymentBody(BaseModel):
    worker_id: str
    week_start: str


@api_router.get("/")
async def root():
    return {"message": "TareasREC API"}


@api_router.post("/auth/login")
async def login(body: LoginBody):
    code = body.code.strip()
    if not (code.isdigit() and len(code) == 4):
        raise HTTPException(status_code=400, detail="El código debe tener 4 dígitos")
    user = await db.users.find_one({"code": code, "active": True}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Código incorrecto")
    token = create_token(user["id"], user["role"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "role": user["role"]}}


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return {"id": user["id"], "name": user["name"], "role": user["role"]}


@api_router.get("/admin/workers")
async def list_workers(admin=Depends(require_admin)):
    workers = await db.users.find({"role": "worker"}, {"_id": 0}).sort("name", 1).to_list(1000)
    today = date.today()
    ws = week_start_of(today)
    we = ws + timedelta(days=6)
    entries = await db.entries.find(
        {"date": {"$gte": ws.isoformat(), "$lte": we.isoformat()}}, {"_id": 0}
    ).to_list(100000)
    week_min = {}
    for e in entries:
        week_min[e["worker_id"]] = week_min.get(e["worker_id"], 0) + e["minutes"]
    pipeline = [{"$group": {"_id": "$worker_id", "minutes": {"$sum": "$minutes"}}}]
    agg = await db.entries.aggregate(pipeline).to_list(10000)
    total_min = {a["_id"]: a["minutes"] for a in agg}
    for w in workers:
        w["week_minutes"] = week_min.get(w["id"], 0)
        w["historical_minutes"] = int(w.get("historical_minutes") or 0)
        w["binance_pay_id"] = w.get("binance_pay_id") or ""
        w["usdt_bep20_address"] = w.get("usdt_bep20_address") or ""
        w["total_minutes"] = total_min.get(w["id"], 0) + w["historical_minutes"]
    return workers


@api_router.post("/admin/workers")
async def create_worker(body: WorkerBody, admin=Depends(require_admin)):
    name = body.name.strip()
    code = (body.code or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="El nombre es obligatorio")
    if not (code.isdigit() and len(code) == 4):
        raise HTTPException(status_code=400, detail="El código debe tener 4 dígitos")
    existing = await db.users.find_one({"code": code})
    if existing:
        raise HTTPException(status_code=400, detail="Ese código ya está en uso")
    doc = {
        "id": str(uuid.uuid4()),
        "name": name,
        "code": code,
        "role": "worker",
        "active": True,
        "binance_pay_id": clean_binance(body.binance_pay_id) or "",
        "usdt_bep20_address": clean_wallet(body.usdt_bep20_address) or "",
        "historical_minutes": max(0, int(body.historical_minutes or 0)),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/workers/{worker_id}")
async def update_worker(worker_id: str, body: WorkerBody, admin=Depends(require_admin)):
    worker = await db.users.find_one({"id": worker_id, "role": "worker"})
    if not worker:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    updates = {}
    name = body.name.strip()
    if name:
        updates["name"] = name
    if body.code:
        code = body.code.strip()
        if not (code.isdigit() and len(code) == 4):
            raise HTTPException(status_code=400, detail="El código debe tener 4 dígitos")
        existing = await db.users.find_one({"code": code, "id": {"$ne": worker_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Ese código ya está en uso")
        updates["code"] = code
    if body.binance_pay_id is not None:
        updates["binance_pay_id"] = clean_binance(body.binance_pay_id)
    if body.usdt_bep20_address is not None:
        updates["usdt_bep20_address"] = clean_wallet(body.usdt_bep20_address)
    if body.historical_minutes is not None:
        if body.historical_minutes < 0:
            raise HTTPException(status_code=400, detail="Los minutos históricos no pueden ser negativos")
        updates["historical_minutes"] = int(body.historical_minutes)
    if updates:
        await db.users.update_one({"id": worker_id}, {"$set": updates})
    return await db.users.find_one({"id": worker_id}, {"_id": 0})


@api_router.delete("/admin/workers/{worker_id}")
async def delete_worker(worker_id: str, admin=Depends(require_admin)):
    result = await db.users.delete_one({"id": worker_id, "role": "worker"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    return {"deleted": True}


@api_router.get("/admin/week")
async def admin_week(start: Optional[str] = None, admin=Depends(require_admin)):
    if start:
        try:
            ws = date.fromisoformat(start)
        except ValueError:
            raise HTTPException(status_code=400, detail="Fecha inválida")
        ws = week_start_of(ws)
    else:
        ws = week_start_of(date.today())
    we = ws + timedelta(days=6)
    payday = ws + timedelta(days=13)
    rows, entries = await build_week_table(ws)
    days = []
    for i in range(7):
        d = ws + timedelta(days=i)
        tot = sum(e["minutes"] for e in entries if e["date"] == d.isoformat())
        days.append({"date": d.isoformat(), "label": DAY_LABELS[i], "total": tot})
    workers_chart = []
    for r in rows:
        data = []
        for i in range(7):
            d = (ws + timedelta(days=i)).isoformat()
            data.append(sum(e["minutes"] for e in entries if e["worker_id"] == r["id"] and e["date"] == d))
        workers_chart.append({"id": r["id"], "name": r["name"], "data": data})
    total_minutes = sum(d["total"] for d in days)
    return {
        "week_start": ws.isoformat(),
        "week_end": we.isoformat(),
        "payday": payday.isoformat(),
        "is_current": ws == week_start_of(date.today()),
        "days": days,
        "workers_chart": workers_chart,
        "table": rows,
        "totals": {
            "minutes": total_minutes,
            "hours": round(total_minutes / 60, 2),
            "avg_per_day": round(total_minutes / 7, 1),
            "active_workers": sum(1 for r in rows if r["minutes"] > 0),
        },
    }


@api_router.get("/admin/rankings")
async def admin_rankings(admin=Depends(require_admin)):
    ws = week_start_of(date.today())
    rows, _ = await build_week_table(ws)
    weekly = [
        {"rank": r["rank"], "id": r["id"], "name": r["name"], "minutes": r["minutes"], "hours": r["hours"]}
        for r in rows
    ]
    global_ranking = await build_global_ranking()
    return {"weekly": weekly, "global": global_ranking}


@api_router.get("/admin/overview")
async def admin_overview(admin=Depends(require_admin)):
    return await build_overview()


async def build_overview():
    today = date.today()
    entries = await db.entries.find({}, {"_id": 0}).to_list(100000)
    workers = {w["id"]: w for w in await db.users.find({"role": "worker"}, {"_id": 0}).to_list(1000)}
    groups = {}
    for e in entries:
        ws = week_start_of(date.fromisoformat(e["date"]))
        if ws + timedelta(days=6) < today:
            key = (e["worker_id"], ws)
            groups[key] = groups.get(key, 0) + e["minutes"]
    weeks = {}
    for (wid, ws), m in groups.items():
        weeks.setdefault(ws, []).append((wid, m))
    rank_of = {}
    for ws, lst in weeks.items():
        lst.sort(key=lambda x: -x[1])
        for i, (wid, m) in enumerate(lst):
            rank_of[(wid, ws)] = i + 1
    paid = await db.payments.find({}, {"_id": 0}).to_list(10000)
    paid_keys = {(p["worker_id"], p["week_start"]) for p in paid}
    total_paid = round(sum(p["amount"] for p in paid), 2)
    pending = []
    for (wid, ws), m in groups.items():
        if (wid, ws.isoformat()) in paid_keys:
            continue
        calc = calc_payment(m, rank_of[(wid, ws)])
        if calc["total"] > 0:
            pending.append({
                "worker_id": wid,
                "name": workers.get(wid, {}).get("name", "Eliminado"),
                "binance_pay_id": workers.get(wid, {}).get("binance_pay_id", ""),
                "week_start": ws.isoformat(),
                "week_end": (ws + timedelta(days=6)).isoformat(),
                "minutes": m,
                "hours": calc["hours"],
                "rank": rank_of[(wid, ws)],
                "base": calc["base"],
                "bonus": calc["bonus"],
                "total": calc["total"],
            })
    pending.sort(key=lambda p: p["week_start"], reverse=True)
    ws_cur = week_start_of(today)
    we_cur = ws_cur + timedelta(days=6)
    cur_minutes = sum(e["minutes"] for e in entries if ws_cur.isoformat() <= e["date"] <= we_cur.isoformat())
    return {
        "total_paid": total_paid,
        "pending_total": round(sum(p["total"] for p in pending), 2),
        "pending": pending,
        "current_week": {"minutes": cur_minutes, "hours": round(cur_minutes / 60, 2)},
    }


@api_router.post("/admin/payments")
async def mark_paid(body: PaymentBody, admin=Depends(require_admin)):
    return await mark_week_paid(body.worker_id, body.week_start)


async def mark_week_paid(worker_id: str, week_start: str):
    try:
        ws = week_start_of(date.fromisoformat(week_start))
    except ValueError:
        raise HTTPException(status_code=400, detail="Fecha inválida")
    rows, _ = await build_week_table(ws)
    row = next((r for r in rows if r["id"] == worker_id), None)
    if row is None:
        entries = await db.entries.find({"worker_id": worker_id}, {"_id": 0}).to_list(100000)
        we = ws + timedelta(days=6)
        m = sum(e["minutes"] for e in entries if ws.isoformat() <= e["date"] <= we.isoformat())
        calc = calc_payment(m, None)
        row = {"rank": None, **calc}
    doc = {
        "id": str(uuid.uuid4()),
        "worker_id": worker_id,
        "week_start": ws.isoformat(),
        "amount": row["total"],
        "base": row["base"],
        "bonus": row["bonus"],
        "rank": row["rank"],
        "paid_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payments.update_one(
        {"worker_id": worker_id, "week_start": ws.isoformat()},
        {"$set": doc},
        upsert=True,
    )
    return doc


def payout_rows(pending):
    by_worker = {}
    for p in pending:
        r = by_worker.setdefault(p["worker_id"], {"worker_id": p["worker_id"], "name": p["name"], "binance_pay_id": p["binance_pay_id"], "total": 0.0, "weeks": []})
        r["total"] = round(r["total"] + p["total"], 2)
        r["weeks"].append(p["week_start"])
    rows = sorted(by_worker.values(), key=lambda r: r["name"].lower())
    for r in rows:
        r["ready"] = bool(r["binance_pay_id"]) and r["total"] >= 0.5
        r["issue"] = None if r["ready"] else ("Sin Binance Pay ID" if not r["binance_pay_id"] else "Monto menor a 0.50 USDT")
    return rows


@api_router.get("/admin/payments/export")
async def payout_preview(admin=Depends(require_admin)):
    overview = await build_overview()
    rows = payout_rows(overview["pending"])
    ready = [r for r in rows if r["ready"]]
    return {
        "rows": rows,
        "ready_count": len(ready),
        "ready_total": round(sum(r["total"] for r in ready), 2),
        "currency": PAYOUT_CURRENCY,
    }


@api_router.get("/admin/payments/export.xlsx")
async def payout_xlsx(admin=Depends(require_admin)):
    overview = await build_overview()
    rows = [r for r in payout_rows(overview["pending"]) if r["ready"]]
    if not rows:
        raise HTTPException(status_code=400, detail="No hay pagos listos para exportar")
    wb = openpyxl.load_workbook(TEMPLATE_PATH)
    ws = wb.active
    for i, r in enumerate(rows[:250]):
        row = 3 + i
        ws.cell(row=row, column=1, value="Binance ID (BUID)")
        ws.cell(row=row, column=2, value=r["binance_pay_id"])
        ws.cell(row=row, column=3, value=PAYOUT_CURRENCY)
        ws.cell(row=row, column=4, value=r["total"])
        ws.cell(row=row, column=5, value=r["name"])
    buf = io.BytesIO()
    wb.save(buf)
    filename = f"binance_pay_{date.today().isoformat()}.xlsx"
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@api_router.post("/admin/payments/mark-all")
async def mark_all_paid(admin=Depends(require_admin)):
    overview = await build_overview()
    ready_ids = {r["worker_id"] for r in payout_rows(overview["pending"]) if r["ready"]}
    count = 0
    for p in overview["pending"]:
        if p["worker_id"] in ready_ids:
            await mark_week_paid(p["worker_id"], p["week_start"])
            count += 1
    return {"marked": count}


@api_router.delete("/admin/payments")
async def unmark_paid(worker_id: str = Query(...), week_start: str = Query(...), admin=Depends(require_admin)):
    ws = week_start_of(date.fromisoformat(week_start))
    await db.payments.delete_one({"worker_id": worker_id, "week_start": ws.isoformat()})
    return {"deleted": True}


@api_router.get("/admin/entries")
async def admin_entries(
    worker_id: Optional[str] = None,
    week_start: Optional[str] = None,
    admin=Depends(require_admin),
):
    query = {}
    if worker_id:
        query["worker_id"] = worker_id
    if week_start:
        try:
            ws = week_start_of(date.fromisoformat(week_start))
        except ValueError:
            raise HTTPException(status_code=400, detail="Fecha inválida")
        query["date"] = {"$gte": ws.isoformat(), "$lte": (ws + timedelta(days=6)).isoformat()}
    entries = await db.entries.find(query, {"_id": 0}).sort("date", -1).to_list(500)
    workers = {w["id"]: w["name"] for w in await db.users.find({"role": "worker"}, {"_id": 0}).to_list(1000)}
    for e in entries:
        e["worker_name"] = workers.get(e["worker_id"], "Eliminado")
        e["reviewed"] = bool(e.get("reviewed"))
    return entries


@api_router.patch("/admin/entries/{entry_id}/review")
async def review_entry(entry_id: str, reviewed: bool = Query(True), admin=Depends(require_admin)):
    result = await db.entries.update_one({"id": entry_id}, {"$set": {"reviewed": reviewed}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return {"id": entry_id, "reviewed": reviewed}


@api_router.delete("/admin/entries/{entry_id}")
async def delete_entry(entry_id: str, admin=Depends(require_admin)):
    result = await db.entries.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return {"deleted": True}


@api_router.post("/me/wallet")
async def set_my_wallet(body: WalletBody, user=Depends(get_current_user)):
    if user.get("role") != "worker":
        raise HTTPException(status_code=403, detail="Solo miembros")
    if user.get("usdt_bep20_address"):
        raise HTTPException(status_code=400, detail="Ya registraste tu dirección; pídele a Wuilber si necesitas cambiarla")
    addr = clean_wallet(body.usdt_bep20_address)
    if not addr:
        raise HTTPException(status_code=400, detail="Ingresa tu dirección USDT (BEP20)")
    await db.users.update_one({"id": user["id"]}, {"$set": {"usdt_bep20_address": addr}})
    return {"usdt_bep20_address": addr}


@api_router.post("/entries")
async def create_entry(
    minutes: int = Form(...),
    screenshot: UploadFile = File(...),
    user=Depends(get_current_user),
):
    if user.get("role") != "worker":
        raise HTTPException(status_code=403, detail="Solo miembros")
    if minutes <= 0 or minutes > 1440:
        raise HTTPException(status_code=400, detail="Minutos inválidos")
    today = date.today().isoformat()
    existing = await db.entries.find_one({"worker_id": user["id"], "date": today})
    if existing:
        raise HTTPException(status_code=409, detail="Ya registraste tus minutos de hoy")
    ext = (screenshot.filename or "png").split(".")[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp", "gif", "heic"):
        ext = "png"
    data = await screenshot.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen es demasiado grande")
    path = f"{APP_NAME}/uploads/{user['id']}/{uuid.uuid4()}.{ext}"
    try:
        result = await asyncio.to_thread(put_object, path, data, screenshot.content_type or "image/png")
    except Exception as e:
        logger.error(f"Storage upload failed: {e}")
        raise HTTPException(status_code=502, detail="No se pudo subir la captura")
    doc = {
        "id": str(uuid.uuid4()),
        "worker_id": user["id"],
        "date": today,
        "minutes": minutes,
        "screenshot_path": result["path"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.entries.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/me/dashboard")
async def me_dashboard(user=Depends(get_current_user)):
    if user.get("role") != "worker":
        raise HTTPException(status_code=403, detail="Solo miembros")
    today = date.today()
    ws = week_start_of(today)
    we = ws + timedelta(days=6)
    payday = ws + timedelta(days=13)
    kgen_payday = ws + timedelta(days=12)
    entries = await db.entries.find({"worker_id": user["id"]}, {"_id": 0}).sort("date", -1).to_list(1000)
    payments = await db.payments.find({"worker_id": user["id"]}, {"_id": 0}).to_list(1000)
    paid_weeks = {p["week_start"] for p in payments}
    week_starts = {week_start_of(date.fromisoformat(e["date"])) for e in entries} | {ws, ws + timedelta(days=7)}
    weeks = []
    for w0 in sorted(week_starts):
        w1 = w0 + timedelta(days=6)
        m = sum(e["minutes"] for e in entries if w0.isoformat() <= e["date"] <= w1.isoformat())
        weeks.append({
            "start": w0.isoformat(),
            "end": w1.isoformat(),
            "kgen_payday": (w0 + timedelta(days=12)).isoformat(),
            "bonus_payday": (w0 + timedelta(days=13)).isoformat(),
            "minutes": m,
            "qualifies": m > GOAL_MINUTES,
            "paid": w0.isoformat() in paid_weeks,
            "closed": w1 < today,
            "status": "current" if w0 == ws else ("future" if w0 > ws else "past"),
        })
    day_minutes = {e["date"]: e["minutes"] for e in entries}
    day_reviewed = [e["date"] for e in entries if e.get("reviewed")]
    week_minutes = sum(e["minutes"] for e in entries if ws.isoformat() <= e["date"] <= we.isoformat())
    today_entry = next((e for e in entries if e["date"] == today.isoformat()), None)
    rows, _ = await build_week_table(ws)
    me_row = next((r for r in rows if r["id"] == user["id"]), None)
    weekly = [
        {"rank": r["rank"], "id": r["id"], "name": r["name"], "minutes": r["minutes"], "hours": r["hours"]}
        for r in rows
    ]
    global_ranking = await build_global_ranking()
    my_global = next((g for g in global_ranking if g["id"] == user["id"]), None)
    remaining = max(0, GOAL_MINUTES - week_minutes)
    entry_dates = {e["date"] for e in entries}
    streak = 0
    cursor = today if today.isoformat() in entry_dates else today - timedelta(days=1)
    while cursor.isoformat() in entry_dates:
        streak += 1
        cursor -= timedelta(days=1)
    best_streak = 0
    run = 0
    prev = None
    for d in sorted(date.fromisoformat(x) for x in entry_dates):
        run = run + 1 if prev is not None and (d - prev).days == 1 else 1
        best_streak = max(best_streak, run)
        prev = d
    best_streak = max(best_streak, int(user.get("best_streak") or 0), streak)
    if best_streak != int(user.get("best_streak") or 0):
        await db.users.update_one({"id": user["id"]}, {"$set": {"best_streak": best_streak}})
    days = []
    for i in range(7):
        d = (ws + timedelta(days=i)).isoformat()
        days.append({"date": d, "label": DAY_LABELS[i], "total": sum(e["minutes"] for e in entries if e["date"] == d)})
    return {
        "name": user["name"],
        "binance_pay_id": user.get("binance_pay_id") or "",
        "usdt_bep20_address": user.get("usdt_bep20_address") or "",
        "streak": streak,
        "on_fire": bool(entries) and entries[0]["minutes"] > 300,
        "best_streak": best_streak,
        "days": days,
        "weeks": weeks,
        "day_minutes": day_minutes,
        "day_reviewed": day_reviewed,
        "today": {
            "registered": today_entry is not None,
            "minutes": today_entry["minutes"] if today_entry else 0,
            "screenshot_path": today_entry["screenshot_path"] if today_entry else None,
        },
        "week": {
            "start": ws.isoformat(),
            "end": we.isoformat(),
            "payday": payday.isoformat(),
            "kgen_payday": kgen_payday.isoformat(),
            "minutes": week_minutes,
            "hours": round(week_minutes / 60, 2),
            "goal_minutes": GOAL_MINUTES,
            "remaining_minutes": remaining,
            "qualifies": me_row["qualifies"] if me_row else False,
            "base": me_row["base"] if me_row else 0,
            "bonus_pct": me_row["bonus_pct"] if me_row else 0,
            "bonus": me_row["bonus"] if me_row else 0,
            "estimated_total": me_row["total"] if me_row else 0,
            "rank": me_row["rank"] if me_row else None,
        },
        "global_rank": my_global["rank"] if my_global else None,
        "global_minutes": my_global["minutes"] if my_global else 0,
        "historical_minutes": int(user.get("historical_minutes") or 0),
        "weekly": weekly,
        "global": global_ranking,
        "entries": entries[:30],
    }


@api_router.get("/files/{path:path}")
async def serve_file(path: str, token: str = Query(...)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    if not path.startswith(f"{APP_NAME}/"):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    try:
        data, content_type = await asyncio.to_thread(get_object, path)
    except Exception:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return Response(content=data, media_type=content_type)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("code", unique=True)
    await db.entries.create_index([("worker_id", 1), ("date", 1)], unique=True)
    await db.payments.create_index([("worker_id", 1), ("week_start", 1)], unique=True)
    existing = await db.users.find_one({"role": "admin"})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "name": "Wuilber",
            "email": ADMIN_EMAIL,
            "code": ADMIN_CODE,
            "role": "admin",
            "active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Admin Wuilber creado")
    else:
        await db.users.update_one(
            {"role": "admin"},
            {"$set": {"code": ADMIN_CODE, "name": "Wuilber", "email": ADMIN_EMAIL, "active": True}},
        )
    try:
        await asyncio.to_thread(init_storage)
        logger.info("Storage inicializado")
    except Exception as e:
        logger.error(f"Storage init falló: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
