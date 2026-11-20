import base64
import io
import json
import logging
import os
import re
import uuid
from dataclasses import dataclass

import httpx
from emergentintegrations.llm.chat import ImageContent, LlmChat, UserMessage
from fastapi import APIRouter, Depends, HTTPException
from PIL import Image
from pydantic import BaseModel, ConfigDict, Field
from pymongo import ASCENDING, IndexModel

from catalog_fr import FR
from fitting_room_catalog import SEED_PRODUCTS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/fitting-room")
COLLECTION = "products"
INDEXES = [
    IndexModel([("id", ASCENDING)], name="id", unique=True),
    IndexModel([("category", ASCENDING), ("price", ASCENDING)], name="category_price"),
]
_db = None
_image_cache: dict[str, str] = {}


class Sizing(BaseModel):
    sizes: list[str]
    min_height_cm: int
    max_height_cm: int
    min_weight_kg: int
    max_weight_kg: int
    length_cm: float | None = None
    measurements: str = ""
    adjustable: bool = False
    one_of_a_kind: bool = False
    notes: str = ""


class BodyProfile(BaseModel):
    height_cm: float = Field(ge=100, le=250)
    weight_kg: float = Field(ge=25, le=300)
    gender: str = Field(pattern="^(men|women|other)$")


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    category: str
    price: float
    gender: str
    color: str
    aesthetic: str
    rarity: str
    seller: str
    material: str
    description: str
    name_fr: str = ""
    description_fr: str = ""
    tags: list[str] = []
    image: str
    currency: str = "USD"
    in_stock: bool = True
    wearable: bool = True
    sizing: Sizing | None = None


class TryOnRequest(BaseModel):
    selfie: str
    item_ids: list[str] = Field(default_factory=list, max_length=10)
    style_note: str = ""
    profile: BodyProfile | None = None


class ChatTurn(BaseModel):
    role: str
    content: str


class AssistantRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    history: list[ChatTurn] = Field(default_factory=list)
    equipped_ids: list[str] = Field(default_factory=list)
    benched_ids: list[str] = Field(default_factory=list)
    filters: dict = Field(default_factory=dict)
    style_note: str = ""
    profile: BodyProfile | None = None
    lang: str = Field("en", pattern="^(en|fr)$")


# Seed-managed text is refreshed on every start so catalog copy edits and translations reach the DB.
MANAGED_FIELDS = ("name", "description", "material", "image", "tags", "name_fr", "description_fr")


async def init(db):
    global _db
    _db = db
    await db[COLLECTION].create_indexes(INDEXES)
    for p in SEED_PRODUCTS:
        p["name_fr"], p["description_fr"] = FR.get(p["id"], ("", ""))
        await db[COLLECTION].update_one({"id": p["id"]}, {"$setOnInsert": p}, upsert=True)
        await db[COLLECTION].update_one({"id": p["id"]}, {"$set": {k: p[k] for k in MANAGED_FIELDS}})
        await db[COLLECTION].update_one({"id": p["id"], "sizing": {"$exists": False}}, {"$set": {"sizing": p["sizing"]}})
        await db[COLLECTION].update_one({"id": p["id"], "wearable": {"$exists": False}}, {"$set": {"wearable": p.get("wearable", True)}})


async def _all_products() -> list[Product]:
    docs = await _db[COLLECTION].find({}, {"_id": 0}).sort("price", 1).to_list(1000)
    return [Product.model_validate(d) for d in docs]


@dataclass
class ProductQuery:
    category: str | None = None
    gender: str | None = None
    color: str | None = None
    aesthetic: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    q: str | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    wearable: bool | None = None


def _range(field_min: str, field_max: str, value: float | None) -> dict:
    return {} if value is None else {field_min: {"$lte": value}, field_max: {"$gte": value}}


def _build_query(f: ProductQuery) -> dict:
    query: dict = {k: v for k, v in (("category", f.category), ("color", f.color), ("aesthetic", f.aesthetic)) if v}
    query |= _range("sizing.min_height_cm", "sizing.max_height_cm", f.height_cm)
    query |= _range("sizing.min_weight_kg", "sizing.max_weight_kg", f.weight_kg)
    if f.wearable is not None:
        query["wearable"] = {"$ne": False} if f.wearable else False
    if f.gender:
        query["gender"] = "unisex" if f.gender == "unisex" else {"$in": [f.gender, "unisex"]}
    price = {k: v for k, v in (("$gte", f.min_price), ("$lte", f.max_price)) if v is not None}
    if price:
        query["price"] = price
    if f.q:
        rx = {"$regex": re.escape(f.q), "$options": "i"}
        query["$or"] = [{"name": rx}, {"description": rx}, {"name_fr": rx}, {"description_fr": rx}, {"tags": rx}, {"color": rx}]
    return query


@router.get("/products", response_model=list[Product])
async def list_products(f: ProductQuery = Depends()):
    docs = await _db[COLLECTION].find(_build_query(f), {"_id": 0}).sort("price", 1).to_list(1000)
    return [Product.model_validate(d) for d in docs]


@router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    doc = await _db[COLLECTION].find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Product not found")
    return Product.model_validate(doc)


@router.get("/facets")
async def facets():
    products = await _all_products()
    pick = lambda f: sorted({getattr(p, f) for p in products})
    return {"categories": pick("category"), "genders": pick("gender"), "colors": pick("color"),
            "aesthetics": pick("aesthetic"), "max_price": max((p.price for p in products), default=0)}


def _shrink(raw: bytes, size: int) -> str:
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    img.thumbnail((size, size))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode()


async def _product_image_b64(client: httpx.AsyncClient, url: str) -> str:
    if url not in _image_cache:
        r = await client.get(url)
        r.raise_for_status()
        _image_cache[url] = _shrink(r.content, 512)
    return _image_cache[url]


def _decode_selfie(data_url: str) -> str:
    try:
        return _shrink(base64.b64decode(data_url.split(",", 1)[-1]), 1024)
    except Exception:
        raise HTTPException(400, "Invalid selfie image")


async def _load_available(item_ids: list[str]) -> list[Product]:
    docs = await _db[COLLECTION].find({"id": {"$in": item_ids}}, {"_id": 0}).to_list(20)
    items = [Product.model_validate(d) for d in docs]
    found = {p.id for p in items if p.in_stock}
    missing = [i for i in item_ids if i not in found]
    if missing:
        raise HTTPException(409, f"These items are no longer available: {', '.join(missing)}. Remove them and try again.")
    return items


def _gear_text(items: list[Product]) -> str:
    if not items:
        return ("No gear selected: this is the person's BASE MODEL. Replace their clothing with extremely basic, plain clothes only: "
                "a plain fitted light-grey crew-neck t-shirt, plain charcoal straight-leg trousers and simple plain black shoes. "
                "No logos, patterns, jackets, armor, jewelry, hats, weapons or props. Neutral relaxed standing pose, arms slightly away from the body.")
    listing = "\n".join(f"- Image {i + 2}: {p.name} ({p.category}, {p.color}) - {p.description}" for i, p in enumerate(items))
    return (f"The following reference images are marketplace listings. Dress the person in ALL of them, reproducing each one's exact shape, color and material:\n{listing}\n"
            "Every visible garment, armor piece, weapon and accessory MUST be one of these listings. Where the body isn't covered by a listing, "
            "show only a plain, featureless black base layer (no extra garments, belts, jewelry, armor, weapons or props).")


def _tryon_prompt(req: TryOnRequest, items: list[Product]) -> str:
    body = ""
    if req.profile:
        build = req.profile.gender if req.profile.gender != "other" else "any"
        body = f"Body: {req.profile.height_cm:g} cm tall, {req.profile.weight_kg:g} kg, {build} build. Keep proportions true to this.\n"
    mood = f"Overall styling/mood request: {req.style_note}\n" if req.style_note else ""
    return ("Image 1 is a selfie of a real person. Create a realistic, photographic, full-body head-to-toe portrait (feet and footwear visible) of THIS SAME person "
            "(keep their exact face, facial features, skin tone, hair and body type) standing confidently at a fantasy LARP event, "
            "soft cinematic lighting, slightly blurred forest-camp background. Weapons are held naturally, shields on the arm, helmets worn on the head "
            f"(keep the face visible if the helmet allows).\n{_gear_text(items)}\n{body}{mood}"
            "Do NOT invent or add any item that is not listed. Output a single image only.")


async def _render(prompt: str, images_b64: list[str]) -> dict:
    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"tryon-{uuid.uuid4()}",
                   system_message="You are a virtual try-on photo compositor for a LARP gear marketplace.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    try:
        _, images = await chat.send_message_multimodal_response(
            UserMessage(text=prompt, file_contents=[ImageContent(b) for b in images_b64]))
    except Exception as exc:
        logger.error("tryon generation failed: %s", exc)
        raise HTTPException(502, "The preview could not be generated. Please try again.")
    if not images:
        raise HTTPException(502, "No preview image was returned. Please try again.")
    return images[0]


@router.post("/tryon")
async def try_on(req: TryOnRequest):
    selfie_b64 = _decode_selfie(req.selfie)
    items = await _load_available(req.item_ids)
    async with httpx.AsyncClient(timeout=20) as client:
        item_imgs = [await _product_image_b64(client, p.image) for p in items]
    img = await _render(_tryon_prompt(req, items), [selfie_b64, *item_imgs])
    return {"image": f"data:{img.get('mime_type', 'image/png')};base64,{img['data']}", "item_ids": [p.id for p in items]}


ASSISTANT_SYSTEM = """You are "The Quartermaster", a witty but concise AI stylist inside a LARP gear marketplace's virtual fitting room.
The user sees a live AI preview of themselves wearing the equipped items. Their "selection" holds worn items plus items set aside (taken off but kept to swap back in).
You can change what they wear and filter the catalog. You may ONLY suggest, mention or equip available marketplace listings from this catalog, by exact id. Never invent items, brands or variants.
When a body profile is given, the list below only contains listings in the user's size.
Available listings (id | name | category | price USD | gender | color | aesthetic | tags | sizes | fits height cm | fits weight kg | one-off):
{catalog}

Rules:
- Actions: "equip" puts items on (an item already worn in that category is set aside automatically); "unequip" takes items off but keeps them set aside;
  "remove" deletes items from the selection entirely; "clear_all" removes everything. Commands like "take off the helmet", "swap the cloak back in",
  "put the dagger back on", "get rid of the boots", "swap the sword for a staff" map to these actions using the worn / set-aside ids given.
- One item per category can be equipped (helmet, armor, cloak, tunic, boots, weapon, shield, accessory). Equipping replaces the item in that category.
- Respect budget requests strictly (e.g. "under $50 each" means every equipped item price < 50).
- "Darker"/"lighter" aesthetic: swap items toward aesthetic=dark/light and darker/lighter colors, and set style_note for mood/lighting.
- If a request is only partly matched (e.g. a full kit where one piece is missing), equip what does match and say honestly what is missing.
- Use filters to show the user relevant catalog results (e.g. category=helmet, color=black). Set filters to null to leave them unchanged.
  Filter values must be the catalog's English values (category, color, aesthetic). "q" is one short English keyword or null; prefer category/color over q.
- If the user's body profile is given, only equip items whose fit range (height/weight) includes them, and prefer their gender fit or unisex. Mention size when helpful, and flag one-of-a-kind pieces.
- Keep reply to 1-3 short sentences, mention item names and prices.
- If the user asks for items and NO available listing matches what they asked for (the kind of item together with any color, material,
  style, price cap or size they named), set "no_match": true, equip nothing, leave filters null and do not offer substitutes.
  Example: "a pink helmet" with no pink helmet listed -> no_match. Otherwise "no_match": false.

Respond with ONLY a JSON object, no markdown:
{{"reply": str, "no_match": bool, "equip": [ids], "unequip": [ids], "remove": [ids], "clear_all": bool,
 "filters": null | {{"category": str|null, "gender": "men"|"women"|"unisex"|null, "color": str|null, "aesthetic": "dark"|"light"|"neutral"|null, "max_price": number|null, "q": str|null}},
 "style_note": str|null, "highlight": [ids]}}
style_note is a short mood/lighting/pose instruction for the image generator (null keeps the current one, "" clears it)."""


def _fits(p: Product, prof: BodyProfile) -> bool:
    z = p.sizing
    return not z or (z.min_height_cm <= prof.height_cm <= z.max_height_cm and z.min_weight_kg <= prof.weight_kg <= z.max_weight_kg)


FILTER_KEYS = {"category", "gender", "color", "aesthetic", "max_price", "min_price", "q"}


def _parse_json(text: str) -> dict:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("no json")
    return json.loads(match.group(0))


def _catalog_line(p: Product, lang: str = "en") -> str:
    z = p.sizing
    sizing = f"{'/'.join(z.sizes)} | {z.min_height_cm}-{z.max_height_cm} | {z.min_weight_kg}-{z.max_weight_kg} | {'yes' if z.one_of_a_kind else 'no'}" if z else "? | ? | ? | no"
    name = (p.name_fr or p.name) if lang == "fr" else p.name
    return f"{p.id} | {name} | {p.category} | {p.price:g} | {p.gender} | {p.color} | {p.aesthetic} | {', '.join(p.tags)} | {sizing}"


def _stylist_prompt(req: AssistantRequest) -> str:
    history = "\n".join(f"{t.role}: {t.content}" for t in req.history[-10:])
    profile = req.profile.model_dump() if req.profile else "not provided"
    return (f"Conversation so far:\n{history or '(none)'}\n\nCurrently worn ids: {req.equipped_ids or 'nothing'}\n"
            f"Set-aside ids: {req.benched_ids or 'nothing'}\nUser body profile: {profile}\n"
            f"Current catalog filters: {req.filters or 'none'}\nCurrent style note: {req.style_note or 'none'}\n\nUser: {req.message}")


LANG_RULE = {"en": "Always write the reply in English.",
             "fr": "Always write the reply in Québec French (the user may speak French or English). Use the item names exactly as listed."}
NO_MATCH = {"en": "No items match your query.", "fr": "Aucun article ne correspond à votre recherche."}


async def _ask_stylist(catalog: str, text: str, lang: str = "en") -> dict:
    system = ASSISTANT_SYSTEM.format(catalog=catalog) + "\n" + LANG_RULE[lang]
    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"stylist-{uuid.uuid4()}",
                   system_message=system).with_model("openai", "gpt-5.4")
    try:
        data = _parse_json(await chat.send_message(UserMessage(text=text)))
    except Exception as exc:
        logger.error("assistant failed: %s", exc)
        raise HTTPException(502, "The stylist is unavailable right now. Please try again.")
    if not isinstance(data, dict):
        raise HTTPException(502, "The stylist is unavailable right now. Please try again.")
    return data


def _ids(data: dict, key: str, allowed: set) -> list[str]:
    values = data.get(key)
    return [i for i in values if isinstance(i, str) and i in allowed] if isinstance(values, list) else []


def _clean_filters(filters) -> dict | None:
    if not isinstance(filters, dict):
        return None
    return {k: v for k, v in filters.items() if k in FILTER_KEYS and isinstance(v, (str, int, float)) and v != ""}


def _num(value) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


async def _filters_match_nothing(filters: dict | None, req: AssistantRequest) -> bool:
    """True when the stylist's filters (merged with the current ones) would leave the fitting-room catalog empty."""
    if not filters:
        return False
    merged = {**{k: v for k, v in req.filters.items() if k in FILTER_KEYS and v not in (None, "")}, **filters}
    text = lambda k: str(merged[k]) if merged.get(k) not in (None, "") else None
    query = _build_query(ProductQuery(
        category=text("category"), gender=text("gender"), color=text("color"), aesthetic=text("aesthetic"), q=text("q"),
        min_price=_num(merged.get("min_price")), max_price=_num(merged.get("max_price")), wearable=True,
        height_cm=req.profile.height_cm if req.profile else None, weight_kg=req.profile.weight_kg if req.profile else None))
    query["in_stock"] = {"$ne": False}
    return await _db[COLLECTION].count_documents(query, limit=1) == 0


def _no_match_response(lang: str) -> dict:
    return {"reply": NO_MATCH[lang], "no_match": True, "equip": [], "unequip": [], "remove": [], "clear_all": False,
            "filters": None, "style_note": None, "highlight": []}


@router.post("/assistant")
async def assistant(req: AssistantRequest):
    all_products = await _all_products()
    known = {p.id for p in all_products}
    by_id = {p.id: p for p in all_products if p.in_stock and p.wearable and (not req.profile or _fits(p, req.profile))}
    data = await _ask_stylist("\n".join(_catalog_line(p, req.lang) for p in by_id.values()), _stylist_prompt(req), req.lang)
    offered = _ids(data, "equip", {p.id for p in all_products if p.in_stock})
    equip = [i for i in offered if i in by_id]
    filters = _clean_filters(data.get("filters"))
    highlight = _ids(data, "highlight", set(by_id))
    if filters and await _filters_match_nothing(filters, req):
        # A stray keyword (often a translated phrase) is the usual culprit: drop it before giving up on the filters.
        filters = {k: v for k, v in filters.items() if k != "q"} or None
        if filters and await _filters_match_nothing(filters, req):
            filters = None
            if not equip and not highlight:
                return _no_match_response(req.lang)
    if not equip and not highlight and data.get("no_match") is True:
        return _no_match_response(req.lang)
    reply = str(data.get("reply") or ("C'est fait." if req.lang == "fr" else "Done."))
    dropped = [(p.name_fr or p.name) if req.lang == "fr" else p.name for p in all_products if p.id in offered and p.id not in by_id]
    if dropped:
        reply += (f" ({', '.join(dropped)} : pas offert dans vos mesures.)" if req.lang == "fr"
                  else f" (Skipped {', '.join(dropped)}: not sized for your measurements.)")
    note = data.get("style_note")
    return {
        "reply": reply,
        "no_match": False,
        "equip": equip,
        "unequip": _ids(data, "unequip", known),
        "remove": _ids(data, "remove", known),
        "clear_all": bool(data.get("clear_all")),
        "filters": filters,
        "style_note": note if isinstance(note, str) else None,
        "highlight": highlight,
    }
