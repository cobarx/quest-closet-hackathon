import asyncio
import json
import logging
import os
import re
import uuid
from contextlib import suppress
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from urllib.parse import urlparse

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import stripe  # noqa: E402
from fastapi import APIRouter, Depends, FastAPI, File, HTTPException, Request, UploadFile  # noqa: E402
from fastapi.responses import Response, StreamingResponse  # noqa: E402
from motor.motor_asyncio import AsyncIOMotorClient  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402
from pymongo import ASCENDING, DESCENDING, IndexModel  # noqa: E402
from starlette.concurrency import run_in_threadpool  # noqa: E402
from starlette.middleware.cors import CORSMiddleware  # noqa: E402

try:
    from backend.clerk_auth import clerk_router, require_user, verify_session_token
except ModuleNotFoundError:
    from clerk_auth import clerk_router, require_user, verify_session_token
import ai  # noqa: E402
import storage  # noqa: E402
from catalog import CATEGORIES, PRODUCT_MAP, PRODUCTS  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
TAX_MODE = "calc_only"

INDEXES = {
    "profiles": [IndexModel([("user_id", ASCENDING)], name="user_id", unique=True)],
    "events": [IndexModel([("id", ASCENDING)], name="id", unique=True), IndexModel([("key", ASCENDING)], name="key")],
    "looks": [IndexModel([("id", ASCENDING)], name="id", unique=True),
              IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)], name="user_created")],
    "interviews": [IndexModel([("id", ASCENDING)], name="id", unique=True)],
    "carts": [IndexModel([("user_id", ASCENDING)], name="user_id", unique=True)],
    "payment_transactions": [IndexModel([("session_id", ASCENDING)], name="session_id", unique=True),
                             IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)], name="user_created")],
}


async def ensure_indexes():
    for coll, models in INDEXES.items():
        for m in models:
            try:
                await db[coll].create_indexes([m])
            except Exception as exc:
                logger.error("ensure_indexes(%s): %s", coll, exc)


def now_iso():
    return datetime.now(timezone.utc).isoformat()


app = FastAPI()
api = APIRouter(prefix="/api")
GUEST_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")


def current_user(request: Request) -> dict:
    """Signed-in Clerk user if a valid token is sent, else the anonymous guest from X-Guest-Id."""
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer ") and len(auth) > 20:
        return {"user_id": verify_session_token(auth[7:])["sub"], "guest": False}
    gid = request.headers.get("x-guest-id", "").lower()
    if not GUEST_RE.match(gid):
        raise HTTPException(401, "Missing guest id")
    return {"user_id": f"guest_{gid}", "guest": True}


Uid = Depends(current_user)
Signed = Depends(require_user)


# ---------- Catalog ----------
@api.get("/catalog")
async def catalog():
    return {"categories": CATEGORIES, "products": PRODUCTS}


# ---------- Profile ----------
class ProfileIn(BaseModel):
    lang: str = "fr"
    city: str = ""
    gender: str = ""
    height_cm: Optional[int] = Field(None, ge=80, le=250)
    weight_kg: Optional[int] = Field(None, ge=25, le=300)
    budget: float = Field(400, ge=20, le=10000)


async def get_profile_doc(user_id):
    return await db.profiles.find_one({"user_id": user_id}, {"_id": 0}) or {}


@api.get("/profile")
async def get_profile(user: dict = Uid):
    return await get_profile_doc(user["user_id"])


@api.put("/profile")
async def put_profile(body: ProfileIn, user: dict = Uid):
    if body.lang not in ("fr", "en"):
        raise HTTPException(400, "Invalid language")
    await db.profiles.update_one({"user_id": user["user_id"]},
                                 {"$set": {**body.model_dump(), "updated_at": now_iso()},
                                  "$setOnInsert": {"user_id": user["user_id"]}}, upsert=True)
    return await get_profile_doc(user["user_id"])


@api.post("/profile/selfie")
async def upload_selfie(file: UploadFile = File(...), user: dict = Uid):
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(400, "Please upload a JPG, PNG or WEBP image")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(400, "Image too large (max 10 MB)")
    ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}[file.content_type]
    path = f"{storage.APP_NAME}/{user['user_id']}/selfie/{uuid.uuid4()}.{ext}"
    res = await run_in_threadpool(storage.put_object, path, data, file.content_type)
    await db.profiles.update_one({"user_id": user["user_id"]},
                                 {"$set": {"selfie_path": res["path"], "selfie_type": file.content_type}}, upsert=True)
    return {"selfie_path": res["path"]}


@api.get("/files/{path:path}")
async def download(path: str, user: dict = Uid):
    owners = [user["user_id"], *(await get_profile_doc(user["user_id"])).get("merged_guests", [])]
    if not any(f"/{o}/" in f"/{path}" for o in owners):
        raise HTTPException(404, "Not found")
    data, ctype = await run_in_threadpool(storage.get_object, path)
    return Response(content=data, media_type=ctype, headers={"Cache-Control": "private, max-age=3600"})


# ---------- Events ----------
AGE_SUFFIX = re.compile(r"[,;\s]*\(?(?:ages?\s*|âges?\s*)?\d{1,2}\s*(?:\+|ans\s*et\s*plus|[–-]\s*\d{1,2})\s*(?:ans)?\)?\s*$", re.I)


def _event_key(name):
    return re.sub(r"[^a-z0-9]", "", name.lower())


async def refresh_events():
    found = await ai.search_events()
    checked = now_iso()
    for e in found:
        key = _event_key(e["name"])
        doc = {k: e.get(k, "") for k in ("name", "start_date", "end_date", "dates_text_en", "dates_text_fr", "location",
                                          "drive_time", "genre_en", "genre_fr", "description_en", "description_fr", "url",
                                          "recurrence_en", "recurrence_fr", "age_range_en", "age_range_fr")}
        doc["distance_km"] = int(e.get("distance_km") or 0)
        for g in ("genre_en", "genre_fr"):
            doc[g] = AGE_SUFFIX.sub("", doc[g]).strip()
        doc.update({"key": key, "source_url": e.get("url", ""), "last_checked": checked})
        await db.events.update_one({"key": key}, {"$set": doc, "$setOnInsert": {"id": str(uuid.uuid4())}}, upsert=True)
    if found:
        today = datetime.now(timezone.utc).date().isoformat()
        fresh = await db.events.find({"last_checked": checked}, {"_id": 0, "url": 1}).to_list(100)
        hosts = {urlparse(e["url"]).netloc.removeprefix("www.") for e in fresh if e.get("url")}
        async for old in db.events.find({"last_checked": {"$ne": checked}}, {"_id": 0, "id": 1, "url": 1, "start_date": 1, "end_date": 1}):
            past = max(old.get("start_date") or "", old.get("end_date") or "") < today
            dup = urlparse(old.get("url") or "").netloc.removeprefix("www.") in hosts
            if past or dup:
                await db.events.delete_one({"id": old["id"]})
    return len(found)


refresh_state = {"running": False, "error": False}


async def _refresh_job():
    try:
        await refresh_events()
        refresh_state["error"] = False
    except Exception as exc:
        logger.error("event refresh failed: %s", exc)
        refresh_state["error"] = True
    finally:
        refresh_state["running"] = False


@api.get("/events")
async def list_events():
    today = datetime.now(timezone.utc).date().isoformat()
    upcoming = {"$or": [{"start_date": {"$gte": today}}, {"end_date": {"$gte": today}}]}
    events = await db.events.find(upcoming, {"_id": 0}).sort("start_date", ASCENDING).to_list(100)
    for e in events:
        for g in ("genre_en", "genre_fr"):
            e[g] = AGE_SUFFIX.sub("", e.get(g) or "").strip()
    return events


@api.post("/events/refresh")
async def refresh(user: dict = Uid):
    if not refresh_state["running"]:
        refresh_state["running"] = True
        asyncio.create_task(_refresh_job())
    return refresh_state


@api.get("/events/refresh")
async def refresh_status():
    return refresh_state


async def get_event(event_id):
    return await db.events.find_one({"id": event_id}, {"_id": 0}) if event_id else None


# ---------- Cart ----------
class CartIn(BaseModel):
    items: List[dict]


def clean_items(items):
    out = {}
    for it in items:
        pid, qty = it.get("product_id"), int(it.get("qty", 1))
        if pid in PRODUCT_MAP and 1 <= qty <= 20:
            out[pid] = qty
    return [{"product_id": k, "qty": v} for k, v in out.items()]


@api.get("/cart")
async def get_cart(user: dict = Uid):
    doc = await db.carts.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"items": doc["items"] if doc else []}


@api.put("/cart")
async def put_cart(body: CartIn, user: dict = Uid):
    items = clean_items(body.items)
    await db.carts.update_one({"user_id": user["user_id"]}, {"$set": {"items": items}}, upsert=True)
    return {"items": items}


class AddIn(BaseModel):
    product_ids: List[str]


@api.post("/cart/add")
async def add_to_cart(body: AddIn, user: dict = Uid):
    cart = (await get_cart(user))["items"]
    have = {i["product_id"] for i in cart}
    cart += [{"product_id": p, "qty": 1} for p in dict.fromkeys(body.product_ids) if p in PRODUCT_MAP and p not in have]
    return await put_cart(CartIn(items=cart), user)


# ---------- Looks ----------
class LookIn(BaseModel):
    flow: str = "build"
    event_id: Optional[str] = None
    item_ids: List[str]
    concept_name: str = ""
    concept_description: str = ""


class LookPatch(BaseModel):
    item_ids: List[str]


async def own_look(look_id, user_id):
    look = await db.looks.find_one({"id": look_id, "user_id": user_id}, {"_id": 0})
    if not look:
        raise HTTPException(404, "Not found")
    return look


@api.post("/looks")
async def create_look(body: LookIn, user: dict = Uid):
    look = {"id": str(uuid.uuid4()), "user_id": user["user_id"], "flow": body.flow if body.flow in ("build", "interview") else "build",
            "event_id": body.event_id, "item_ids": [i for i in dict.fromkeys(body.item_ids) if i in PRODUCT_MAP],
            "concept_name": body.concept_name, "concept_description": body.concept_description, "reasons": {},
            "preview_path": None, "preview_status": "none", "created_at": now_iso()}
    await db.looks.insert_one(dict(look))
    return look


@api.get("/looks")
async def list_looks(user: dict = Uid):
    return await db.looks.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", DESCENDING).to_list(100)


@api.get("/looks/{look_id}")
async def get_look(look_id: str, user: dict = Uid):
    return await own_look(look_id, user["user_id"])


@api.patch("/looks/{look_id}")
async def patch_look(look_id: str, body: LookPatch, user: dict = Uid):
    await own_look(look_id, user["user_id"])
    ids = [i for i in dict.fromkeys(body.item_ids) if i in PRODUCT_MAP]
    await db.looks.update_one({"id": look_id}, {"$set": {"item_ids": ids}})
    return await own_look(look_id, user["user_id"])


async def _run_preview(look, profile):
    try:
        selfie, _ = await run_in_threadpool(storage.get_object, profile["selfie_path"])
        img, mime = await ai.generate_preview(selfie, look["item_ids"], profile, look.get("concept_name", ""))
        path = f"{storage.APP_NAME}/{look['user_id']}/previews/{uuid.uuid4()}.png"
        res = await run_in_threadpool(storage.put_object, path, img, mime)
        await db.looks.update_one({"id": look["id"]}, {"$set": {"preview_path": res["path"], "preview_status": "ready"}})
    except Exception as exc:
        logger.error("preview failed: %s", exc)
        await db.looks.update_one({"id": look["id"]}, {"$set": {"preview_status": "failed"}})


@api.post("/looks/{look_id}/preview")
async def make_preview(look_id: str, user: dict = Uid):
    look = await own_look(look_id, user["user_id"])
    profile = await get_profile_doc(user["user_id"])
    if not profile.get("selfie_path"):
        raise HTTPException(400, "Upload a selfie first")
    if look["preview_status"] == "generating":
        return look
    await db.looks.update_one({"id": look_id}, {"$set": {"preview_status": "generating"}})
    asyncio.create_task(_run_preview(look, profile))
    return {**look, "preview_status": "generating"}


# ---------- Interview ----------
class InterviewIn(BaseModel):
    event_id: Optional[str] = None


class MessageIn(BaseModel):
    text: str = ""
    lang: str = "fr"


class RecommendIn(BaseModel):
    categories: List[str]
    lang: str = "fr"


async def own_interview(iid, user_id):
    iv = await db.interviews.find_one({"id": iid, "user_id": user_id}, {"_id": 0})
    if not iv:
        raise HTTPException(404, "Not found")
    return iv


@api.post("/interviews")
async def create_interview(body: InterviewIn, user: dict = Uid):
    iv = {"id": str(uuid.uuid4()), "user_id": user["user_id"], "event_id": body.event_id, "messages": [], "created_at": now_iso()}
    await db.interviews.insert_one(dict(iv))
    return iv


@api.post("/interviews/{iid}/message")
async def interview_message(iid: str, body: MessageIn, user: dict = Uid):
    iv = await own_interview(iid, user["user_id"])
    lang = body.lang if body.lang in ("fr", "en") else "fr"
    profile = await get_profile_doc(user["user_id"])
    event = await get_event(iv.get("event_id"))
    text = body.text.strip()[:1000]

    async def gen():
        reply = ""
        try:
            async for chunk in ai.stream_interview(lang, profile, event, iv["messages"], text):
                reply += chunk
                yield f"data: {json.dumps({'delta': chunk})}\n\n"
        except Exception as exc:
            logger.error("interview stream failed: %s", exc)
            yield f"data: {json.dumps({'error': 'failed'})}\n\n"
            return
        new = ([{"role": "player", "content": text}] if text else []) + [{"role": "oracle", "content": reply}]
        await db.interviews.update_one({"id": iid}, {"$push": {"messages": {"$each": new}}})
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@api.get("/interviews/{iid}")
async def get_interview(iid: str, user: dict = Uid):
    return await own_interview(iid, user["user_id"])


@api.post("/interviews/{iid}/recommend")
async def interview_recommend(iid: str, body: RecommendIn, user: dict = Uid):
    iv = await own_interview(iid, user["user_id"])
    cats = [c for c in body.categories if c in CATEGORIES] or CATEGORIES
    profile = await get_profile_doc(user["user_id"])
    event = await get_event(iv.get("event_id"))
    try:
        rec = await ai.recommend(body.lang if body.lang in ("fr", "en") else "fr", profile, event, iv["messages"], cats)
    except Exception as exc:
        logger.error("recommend failed: %s", exc)
        raise HTTPException(502, "Recommendation failed, please try again")
    look = await create_look(LookIn(flow="interview", event_id=iv.get("event_id"), item_ids=rec["item_ids"],
                                    concept_name=rec["concept_name"], concept_description=rec["concept_description"]), user)
    await db.looks.update_one({"id": look["id"]}, {"$set": {"reasons": rec["reasons"]}})
    return {**look, "reasons": rec["reasons"]}


# ---------- Checkout ----------
class Shipping(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    line1: str = Field(min_length=3, max_length=200)
    city: str = Field(min_length=2, max_length=100)
    province: str
    postal_code: str


class CheckoutIn(BaseModel):
    origin_url: str
    shipping: Shipping
    lang: str = "fr"


@api.post("/guest/merge")
async def merge_guest(request: Request, user: dict = Signed):
    gid = request.headers.get("x-guest-id", "").lower()
    if not GUEST_RE.match(gid):
        return {"merged": False}
    guest, uid = f"guest_{gid}", user["user_id"]
    await db.looks.update_many({"user_id": guest}, {"$set": {"user_id": uid}})
    await db.interviews.update_many({"user_id": guest}, {"$set": {"user_id": uid}})
    gcart = await db.carts.find_one({"user_id": guest}, {"_id": 0})
    if gcart and gcart["items"]:
        ucart = (await get_cart({"user_id": uid}))["items"]
        have = {i["product_id"] for i in ucart}
        merged = ucart + [i for i in gcart["items"] if i["product_id"] not in have]
        await db.carts.update_one({"user_id": uid}, {"$set": {"items": merged}}, upsert=True)
    gprof, uprof = await get_profile_doc(guest), await get_profile_doc(uid)
    fill = {k: v for k, v in gprof.items() if k not in ("user_id", "merged_guests") and v not in (None, "") and not uprof.get(k)}
    if gprof.get("selfie_path"):
        fill.update(selfie_path=gprof["selfie_path"], selfie_type=gprof.get("selfie_type"))
    await db.profiles.update_one({"user_id": uid}, {"$set": fill, "$addToSet": {"merged_guests": guest}}, upsert=True)
    await db.carts.delete_one({"user_id": guest})
    await db.profiles.delete_one({"user_id": guest})
    return {"merged": True}


@api.post("/checkout")
async def checkout(body: CheckoutIn, user: dict = Signed):
    s = body.shipping
    if s.province.upper() != "QC" or not ai.QC_POSTAL.match(s.postal_code.strip()):
        raise HTTPException(400, "quebec_only")
    cart = (await get_cart(user))["items"]
    if not cart:
        raise HTTPException(400, "Cart is empty")
    line_items = []
    for it in cart:
        prices = stripe.Price.list(lookup_keys=[it["product_id"]], active=True, limit=1).data
        if not prices:
            raise HTTPException(500, f"Price not found: {it['product_id']}")
        line_items.append({"price": prices[0].id, "quantity": it["qty"]})
    addr = {"line1": s.line1, "city": s.city, "state": "QC", "postal_code": s.postal_code.upper(), "country": "CA"}
    customer = stripe.Customer.create(name=s.name, address=addr, shipping={"name": s.name, "address": addr},
                                      metadata={"user_id": user["user_id"]})
    kwargs = dict(line_items=line_items, mode="payment", customer=customer.id,
                  locale="fr-CA" if body.lang == "fr" else "en",
                  success_url=f"{body.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
                  cancel_url=f"{body.origin_url}/payment/cancel",
                  metadata={"user_id": user["user_id"]})
    try:
        session = stripe.checkout.Session.create(**kwargs, automatic_tax={"enabled": True})
    except stripe.error.InvalidRequestError as exc:
        logger.warning("automatic tax unavailable: %s", exc.user_message)
        session = stripe.checkout.Session.create(**kwargs)
    subtotal = sum(PRODUCT_MAP[i["product_id"]]["price"] * i["qty"] for i in cart)
    await db.payment_transactions.insert_one({
        "session_id": session.id, "user_id": user["user_id"], "items": cart, "shipping": s.model_dump(),
        "amount": float(subtotal), "currency": "cad", "status": "initiated", "payment_status": "pending",
        "created_at": now_iso(), "updated_at": now_iso()})
    return {"checkout_url": session.url, "session_id": session.id}


async def mark_paid(session_id, s):
    res = await db.payment_transactions.update_one(
        {"session_id": session_id, "payment_status": {"$ne": "paid"}},
        {"$set": {"status": "completed", "payment_status": "paid", "amount_total": (s.get("amount_total") or 0) / 100,
                  "tax": ((s.get("total_details") or {}).get("amount_tax") or 0) / 100,
                  "stripe_payment_intent_id": s.get("payment_intent"), "updated_at": now_iso()}})
    if res.modified_count:
        rec = await db.payment_transactions.find_one({"session_id": session_id})
        await db.carts.update_one({"user_id": rec["user_id"]}, {"$set": {"items": []}})


@api.get("/payments/status/{session_id}")
async def payment_status(session_id: str, user: dict = Signed):
    rec = await db.payment_transactions.find_one({"session_id": session_id, "user_id": user["user_id"]})
    if not rec:
        raise HTTPException(404, "Transaction not found")
    if rec.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await mark_paid(session_id, s.to_dict())
                rec = await db.payment_transactions.find_one({"session_id": session_id})
        except stripe.error.StripeError:
            pass
    return {"session_id": rec["session_id"], "status": rec["status"], "payment_status": rec["payment_status"]}


@api.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(payload, request.headers.get("stripe-signature", ""), STRIPE_WEBHOOK_SECRET)
    except (stripe.error.SignatureVerificationError, ValueError):
        raise HTTPException(400, "Invalid signature")
    obj, t = event["data"]["object"], event["type"]
    if t in ("checkout.session.completed", "checkout.session.async_payment_succeeded") and obj.get("payment_status") == "paid":
        await mark_paid(obj["id"], obj)
    elif t == "checkout.session.async_payment_failed":
        await db.payment_transactions.update_one({"session_id": obj["id"]}, {"$set": {"status": "failed", "payment_status": "failed"}})
    elif t == "checkout.session.expired":
        await db.payment_transactions.update_one({"session_id": obj["id"]}, {"$set": {"status": "expired", "payment_status": "expired"}})
    elif t == "charge.refunded":
        await db.payment_transactions.update_one({"stripe_payment_intent_id": obj.get("payment_intent")},
                                                 {"$set": {"status": "refunded", "payment_status": "refunded"}})
    return {"status": "ok"}


@api.get("/orders")
async def orders(user: dict = Signed):
    return await db.payment_transactions.find({"user_id": user["user_id"], "payment_status": "paid"}, {"_id": 0}) \
        .sort("created_at", DESCENDING).to_list(100)


@api.get("/orders/{session_id}")
async def order(session_id: str, user: dict = Signed):
    rec = await db.payment_transactions.find_one({"session_id": session_id, "user_id": user["user_id"]}, {"_id": 0})
    if not rec:
        raise HTTPException(404, "Not found")
    return rec


app.include_router(api)
app.include_router(clerk_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
                   allow_methods=["*"], allow_headers=["*"])


async def _seed_events():
    with suppress(Exception):
        if await db.events.count_documents({}) == 0 and not refresh_state["running"]:
            refresh_state["running"] = True
            await _refresh_job()


@app.on_event("startup")
async def startup():
    app.state.index_task = asyncio.create_task(ensure_indexes())
    with suppress(Exception):
        await run_in_threadpool(storage.init_storage)
    asyncio.create_task(_seed_events())


@app.on_event("shutdown")
async def shutdown():
    app.state.index_task.cancel()
    with suppress(asyncio.CancelledError):
        await app.state.index_task
    client.close()
