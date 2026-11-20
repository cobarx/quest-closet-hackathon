import asyncio
import json
import logging
import os
import re
import uuid
from datetime import date, datetime, timezone

import stripe
from emergentintegrations.llm.chat import LlmChat, UserMessage
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from pymongo import ASCENDING, DESCENDING, IndexModel

from clerk_auth import require_user, verify_session_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
GUEST_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")
_db = None

INDEXES = {
    "carts": [IndexModel([("user_id", ASCENDING)], name="user_id", unique=True)],
    "payment_transactions": [IndexModel([("session_id", ASCENDING)], name="session_id", unique=True),
                             IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)], name="user_created")],
    "events": [IndexModel([("key", ASCENDING)], name="key", unique=True), IndexModel([("start_date", ASCENDING)], name="start")],
}


async def init(db):
    global _db
    _db = db
    for coll, models in INDEXES.items():
        await db[coll].create_indexes(models)


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def current_user(request: Request) -> dict:
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer ") and len(auth) > 20:
        return {"user_id": verify_session_token(auth[7:])["sub"], "guest": False}
    gid = request.headers.get("x-guest-id", "").lower()
    if not GUEST_RE.match(gid):
        raise HTTPException(401, "Missing guest id")
    return {"user_id": f"guest_{gid}", "guest": True}


Uid = Depends(current_user)
Signed = Depends(require_user)


# ---------- Cart ----------
class CartItem(BaseModel):
    product_id: str
    qty: int = Field(1, ge=1, le=20)
    size: str = ""


class CartIn(BaseModel):
    items: list[CartItem] = Field(max_length=50)


async def _products(ids):
    docs = await _db.products.find({"id": {"$in": list(ids)}}, {"_id": 0}).to_list(200)
    return {d["id"]: d for d in docs}


async def _clean(items: list[CartItem]):
    known = await _products({i.product_id for i in items})
    out = {}
    for i in items:
        p = known.get(i.product_id)
        if p and p.get("in_stock", True):
            size = i.size if i.size in (p.get("sizing") or {}).get("sizes", []) else ""
            out[(i.product_id, size)] = {"product_id": i.product_id, "qty": i.qty, "size": size}
    return list(out.values())


async def _get_cart(user_id):
    doc = await _db.carts.find_one({"user_id": user_id}, {"_id": 0})
    return doc["items"] if doc else []


async def _save_cart(user_id, items):
    await _db.carts.update_one({"user_id": user_id}, {"$set": {"items": items, "updated_at": now_iso()}}, upsert=True)
    return {"items": items}


@router.get("/cart")
async def get_cart(user: dict = Uid):
    return {"items": await _get_cart(user["user_id"])}


@router.put("/cart")
async def put_cart(body: CartIn, user: dict = Uid):
    return await _save_cart(user["user_id"], await _clean(body.items))


@router.post("/cart/add")
async def add_to_cart(body: CartIn, user: dict = Uid):
    cart = [CartItem(**i) for i in await _get_cart(user["user_id"])]
    have = {(i.product_id, i.size) for i in cart}
    cart += [i for i in body.items if (i.product_id, i.size) not in have]
    return await _save_cart(user["user_id"], await _clean(cart))


@router.post("/guest/merge")
async def merge_guest(request: Request, user: dict = Signed):
    gid = request.headers.get("x-guest-id", "").lower()
    if not GUEST_RE.match(gid):
        return {"merged": False}
    guest = await _get_cart(f"guest_{gid}")
    if guest:
        mine = await _get_cart(user["user_id"])
        have = {(i["product_id"], i.get("size", "")) for i in mine}
        await _save_cart(user["user_id"], mine + [i for i in guest if (i["product_id"], i.get("size", "")) not in have])
        await _save_cart(f"guest_{gid}", [])
    return {"merged": bool(guest)}


# ---------- Checkout (Stripe) ----------
class CheckoutIn(BaseModel):
    origin_url: str = Field(pattern=r"^https?://")


@router.post("/checkout")
async def checkout(body: CheckoutIn, user: dict = Signed):
    cart = await _get_cart(user["user_id"])
    if not cart:
        raise HTTPException(400, "Your bag is empty")
    products = await _products({i["product_id"] for i in cart})
    line_items, subtotal = [], 0.0
    for i in cart:
        p = products.get(i["product_id"])
        if not p or not p.get("in_stock", True):
            raise HTTPException(409, f"{i['product_id']} is no longer available")
        subtotal += p["price"] * i["qty"]
        name = p["name"] + (f" (size {i['size']})" if i.get("size") else "")
        line_items.append({"quantity": i["qty"], "price_data": {
            "currency": "usd", "unit_amount": int(round(p["price"] * 100)),
            "product_data": {"name": name, "images": [p["image"]], "tax_code": "txcd_99999999",
                             "metadata": {"product_id": p["id"], "seller": p.get("seller", "")}}}})
    kwargs = dict(line_items=line_items, mode="payment",
                  shipping_address_collection={"allowed_countries": ["US", "CA"]},
                  success_url=f"{body.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
                  cancel_url=f"{body.origin_url}/payment/cancel", metadata={"user_id": user["user_id"]})
    try:
        session = stripe.checkout.Session.create(**kwargs, automatic_tax={"enabled": True}, billing_address_collection="required")
    except stripe.error.InvalidRequestError as exc:
        logger.warning("automatic tax unavailable: %s", exc.user_message)
        session = stripe.checkout.Session.create(**kwargs)
    await _db.payment_transactions.insert_one({
        "session_id": session.id, "user_id": user["user_id"], "items": cart, "amount": float(subtotal), "currency": "usd",
        "status": "initiated", "payment_status": "pending", "created_at": now_iso(), "updated_at": now_iso()})
    return {"checkout_url": session.url, "session_id": session.id}


async def _mark_paid(session_id, s):
    res = await _db.payment_transactions.update_one(
        {"session_id": session_id, "payment_status": {"$ne": "paid"}},
        {"$set": {"status": "completed", "payment_status": "paid", "amount_total": (s.get("amount_total") or 0) / 100,
                  "tax": ((s.get("total_details") or {}).get("amount_tax") or 0) / 100,
                  "stripe_payment_intent_id": s.get("payment_intent"), "updated_at": now_iso()}})
    if res.modified_count:
        rec = await _db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0, "user_id": 1, "items": 1})
        bought = {(i["product_id"], i.get("size", "")) for i in rec["items"]}
        left = [i for i in await _get_cart(rec["user_id"]) if (i["product_id"], i.get("size", "")) not in bought]
        await _save_cart(rec["user_id"], left)


@router.get("/payments/status/{session_id}")
async def payment_status(session_id: str, user: dict = Signed):
    rec = await _db.payment_transactions.find_one({"session_id": session_id, "user_id": user["user_id"]}, {"_id": 0})
    if not rec:
        raise HTTPException(404, "Transaction not found")
    if rec["payment_status"] != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid":
                await _mark_paid(session_id, s.to_dict())
            elif s.status == "expired":
                await _db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"status": "expired", "payment_status": "expired"}})
            rec = await _db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        except stripe.error.StripeError:
            pass
    return {"session_id": session_id, "status": rec["status"], "payment_status": rec["payment_status"],
            "amount_total": rec.get("amount_total"), "tax": rec.get("tax")}


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    try:
        event = stripe.Webhook.construct_event(await request.body(), request.headers.get("stripe-signature", ""), WEBHOOK_SECRET)
    except (stripe.error.SignatureVerificationError, ValueError):
        raise HTTPException(400, "Invalid signature")
    obj, t = event["data"]["object"], event["type"]
    if t in ("checkout.session.completed", "checkout.session.async_payment_succeeded") and obj.get("payment_status") == "paid":
        await _mark_paid(obj["id"], obj)
    elif t in ("checkout.session.expired", "checkout.session.async_payment_failed"):
        status = "expired" if t.endswith("expired") else "failed"
        await _db.payment_transactions.update_one({"session_id": obj["id"], "payment_status": {"$ne": "paid"}},
                                                  {"$set": {"status": status, "payment_status": status, "updated_at": now_iso()}})
    return {"status": "ok"}


@router.get("/orders")
async def orders(user: dict = Signed):
    docs = await _db.payment_transactions.find({"user_id": user["user_id"], "payment_status": "paid"}, {"_id": 0}).sort("created_at", -1).to_list(100)
    products = await _products({i["product_id"] for d in docs for i in d["items"]})
    for d in docs:
        d["items"] = [{**i, "name": products.get(i["product_id"], {}).get("name", i["product_id"]),
                       "image": products.get(i["product_id"], {}).get("image", "")} for i in d["items"]]
    return docs


# ---------- Events (AI web search, Montreal area) ----------
EVENT_FIELDS = ("name", "start_date", "end_date", "dates_text", "recurrence", "age_range", "location",
                "distance_km", "drive_time", "genre", "description", "url")
EVENT_PROMPT = (
    "Search the web in French and English for upcoming LARP events (jeux de rôle grandeur nature, GN) in Quebec, Canada, "
    "within about a 4-hour drive of Montreal. Exclude Ontario and the USA. Try: 'GN Québec 2026', 'Bicolline', "
    "'Terres de Bélénos', 'LARP Quebec', 'grandeur nature médiéval fantastique'. "
    "Today is {today}. Only include events with a confirmed date on or after today. One entry per event series. "
    'Return ONLY a JSON array (max 12) of objects: {{"name": str, "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", '
    '"dates_text": str (next occurrence, with times if known), "recurrence": str (other upcoming dates or pattern, empty if one-off), '
    '"age_range": str (e.g. "16+", empty if unknown), "location": str (town, region), "distance_km": int (from Montreal), '
    '"drive_time": str like "2h15", "genre": str, "description": str (max 30 words), "url": str (official site)}}. '
    "Only include real events found in search results."
)
refresh_state = {"running": False, "error": False}


async def _search_events():
    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"events-{uuid.uuid4()}",
                   system_message="You are a meticulous research assistant for the Quebec LARP scene.")
    chat.with_model("anthropic", "claude-sonnet-5-5").with_tools([{"type": "web_search_20250305", "name": "web_search", "max_uses": 10}])
    resp = await chat.send_message_with_tools(UserMessage(text=EVENT_PROMPT.format(today=date.today().isoformat())))
    text = resp.content or ""
    start, end = text.find("["), text.rfind("]")
    found = json.loads(text[start:end + 1]) if start != -1 and end != -1 else []
    return [e for e in found if isinstance(e, dict) and e.get("name") and e.get("start_date")]


async def _refresh_job():
    try:
        checked = now_iso()
        for e in await _search_events():
            doc = {k: e.get(k) or "" for k in EVENT_FIELDS}
            doc["distance_km"] = int(e.get("distance_km") or 0)
            key = re.sub(r"[^a-z0-9]", "", doc["name"].lower())
            await _db.events.update_one({"key": key}, {"$set": {**doc, "last_checked": checked},
                                                       "$setOnInsert": {"key": key, "id": str(uuid.uuid4())}}, upsert=True)
        refresh_state["error"] = False
    except Exception as exc:
        logger.error("event refresh failed: %s", exc)
        refresh_state["error"] = True
    finally:
        refresh_state["running"] = False


@router.get("/events")
async def list_events():
    today = date.today().isoformat()
    query = {"$or": [{"start_date": {"$gte": today}}, {"end_date": {"$gte": today}}]}
    return await _db.events.find(query, {"_id": 0}).sort("start_date", 1).to_list(100)


@router.post("/events/refresh")
async def refresh_events(user: dict = Uid):
    if not refresh_state["running"]:
        refresh_state["running"] = True
        asyncio.create_task(_refresh_job())
    return refresh_state


@router.get("/events/refresh")
async def refresh_status():
    return refresh_state
