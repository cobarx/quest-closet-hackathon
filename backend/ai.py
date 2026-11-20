import asyncio
import base64
import json
import os
import re
import uuid
from datetime import date

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent, TextDelta, StreamDone

from catalog import PRODUCTS, PRODUCT_MAP

LANG_NAME = {"fr": "French (Québécois)", "en": "English"}


_LOCK = asyncio.Lock()  # the shared key allows one concurrent LLM request


async def _call(fn):
    for attempt in range(4):
        async with _LOCK:
            try:
                return await fn()
            except Exception as exc:
                if "429" not in str(exc) and "concurrent" not in str(exc).lower() or attempt == 3:
                    raise
        await asyncio.sleep(3 * (attempt + 1))


def _key():
    return os.environ["EMERGENT_LLM_KEY"]


def _extract_json(text: str, opener: str):
    closer = "]" if opener == "[" else "}"
    start, end = text.find(opener), text.rfind(closer)
    if start == -1 or end == -1:
        raise ValueError("No JSON in model output")
    return json.loads(text[start:end + 1])


async def search_events():
    chat = LlmChat(api_key=_key(), session_id=f"events-{uuid.uuid4()}",
                   system_message="You are a meticulous research assistant for the Quebec LARP (GN, grandeur nature) scene.")
    chat.with_model("anthropic", "claude-sonnet-5-5").with_tools(
        [{"type": "web_search_20250305", "name": "web_search", "max_uses": 12}])
    prompt = (
        "Search the web in both French and English for upcoming or recurring LARP events (jeux de rôle grandeur nature, GN) "
        "held in the province of Quebec, Canada, within about a 4-hour drive of Montreal (e.g. Laurentides, Lanaudière, "
        "Estrie/Eastern Townships, Mauricie, Montérégie, Outaouais, Québec City, Centre-du-Québec). Exclude events in Ontario or the USA. "
        "Search terms to try: 'GN Québec 2026', 'grandeur nature médiéval fantastique Québec', 'Bicolline', 'Terres de Bélénos', 'LARP Quebec'. "
        "Search each organizer site for its announced calendar. Return ONLY a JSON array (no prose) of up to 15 events. Each object: "
        f"Today is {date.today().isoformat()}. Only include events with a confirmed upcoming date on or after today; skip anything with no announced future date. "
        "Never mention past dates, past editions or past seasons anywhere in the output. "
        "One entry per event or event series: never list the same series twice; put its other dates in recurrence. "
        '{"name": str (official name only, no dates), "start_date": "YYYY-MM-DD" (next upcoming occurrence, required), "end_date": "YYYY-MM-DD" (end of that occurrence), '
        '"dates_text_en": str (ONLY the next upcoming occurrence: date AND start/end time if known, e.g. "Sat Nov 21, 2026, 10 a.m. – 11 p.m."), "dates_text_fr": str (same in French), '
        '"recurrence_en": str (the repeat pattern or other UPCOMING dates only, e.g. "Every summer weekend, May–Sept"; empty if one-off), "recurrence_fr": str, '
        '"age_range_en": str (REQUIRED: look up the organizer registration/rules/FAQ page for the minimum age or minors policy and summarize it briefly, e.g. "16+", "18+", "All ages (minors with a guardian)"; empty only if no page states it), "age_range_fr": str, '
        '"location": str (town, region), "distance_km": int (driving km from Montreal), "drive_time": str like "2h15", '
        '"genre_en": str (genre and tone only, no age info, e.g. "Medieval fantasy, teen LARP"), "genre_fr": str, "description_en": str (max 30 words), "description_fr": str (max 30 words), '
        '"url": str (official organizer site)}. Only include real events you found in search results.'
    )
    resp = await _call(lambda: chat.send_message_with_tools(UserMessage(text=prompt)))
    events = _extract_json(resp.content or "", "[")
    return [e for e in events if isinstance(e, dict) and e.get("name")]


def _catalog_brief(lang):
    return "\n".join(f"- {p['id']} | {p['category']} | ${p['price']:.0f} CAD | {p['name'][lang]}: {p['description'][lang]}"
                     for p in PRODUCTS)


def _profile_brief(profile, event):
    bits = [f"budget {profile.get('budget', 300)} CAD"]
    for k in ("gender", "city"):
        if profile.get(k):
            bits.append(f"{k} {profile[k]}")
    if event:
        bits.append(f"attending '{event['name']}' ({event.get('genre_en', '')})")
    return ", ".join(bits)


def interview_system(lang, profile, event):
    return (
        f"You are the Oracle, a warm, witty character-creation guide at a Quebec LARP outfitter. "
        f"ALWAYS reply in {LANG_NAME[lang]}. Player context: {_profile_brief(profile, event)}. "
        "Interview the player to design their LARP character. Ask ONE short question at a time (max 2 sentences), "
        "covering in order: character type/species & archetype, combat role (fighter, mage, healer, rogue, scout...), "
        "the event's genre and tone, and look/comfort preferences (armor vs light, makeup tolerance, camping needs). "
        "After about 4 answers, briefly summarize the character concept in 2 sentences and tell them to press the "
        "'See my recommendations' button. Never list products or prices yourself."
    )


async def stream_interview(lang, profile, event, history, user_text):
    chat = LlmChat(api_key=_key(), session_id=f"iv-{uuid.uuid4()}", system_message=interview_system(lang, profile, event))
    chat.with_model("anthropic", "claude-sonnet-5-5")
    transcript = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in history)
    text = (f"Conversation so far:\n{transcript}\n\nPLAYER: {user_text}" if history
            else (user_text or "Start the interview: greet me and ask your first question."))
    async with _LOCK:
        async for ev in chat.stream_message(UserMessage(text=text)):
            if isinstance(ev, TextDelta):
                yield ev.content
            elif isinstance(ev, StreamDone):
                break


async def recommend(lang, profile, event, history, categories):
    chat = LlmChat(api_key=_key(), session_id=f"rec-{uuid.uuid4()}",
                   system_message="You are an expert LARP costumer. Output strict JSON only.")
    chat.with_model("anthropic", "claude-sonnet-5-5")
    transcript = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in history)
    budget = float(profile.get("budget") or 300)
    prompt = (
        f"Player context: {_profile_brief(profile, event)}.\nInterview transcript:\n{transcript}\n\n"
        f"Shop catalog (id | category | price | name: description):\n{_catalog_brief(lang)}\n\n"
        f"Allowed categories: {', '.join(categories)}. Pick a cohesive set: at most one item per role "
        f"(e.g. one main costume piece, optional layer, makeup, one weapon or weapon+shield, camping essentials) "
        f"with total price <= {budget:.0f} CAD. Write text in {LANG_NAME[lang]}.\n"
        'Return JSON: {"concept_name": str, "concept_description": str (max 45 words), '
        '"item_ids": [str], "reasons": {"<item_id>": str (max 15 words)}}'
    )
    data = _extract_json(await _call(lambda: chat.send_message(UserMessage(text=prompt))), "{")
    ids = [i for i in data.get("item_ids", []) if i in PRODUCT_MAP and PRODUCT_MAP[i]["category"] in categories]
    ids = list(dict.fromkeys(ids))
    while ids and sum(PRODUCT_MAP[i]["price"] for i in ids) > budget:
        ids.remove(max(ids, key=lambda i: PRODUCT_MAP[i]["price"]))
    return {"concept_name": data.get("concept_name", ""), "concept_description": data.get("concept_description", ""),
            "item_ids": ids, "reasons": {k: v for k, v in (data.get("reasons") or {}).items() if k in ids}}


async def generate_preview(selfie_bytes: bytes, items, profile, concept: str = ""):
    wearables = [PRODUCT_MAP[i]["look"] for i in items if PRODUCT_MAP[i]["look"]]
    body = []
    if profile.get("gender"):
        body.append(profile["gender"])
    if profile.get("height_cm"):
        body.append(f"about {profile['height_cm']} cm tall")
    if profile.get("weight_kg"):
        body.append(f"about {profile['weight_kg']} kg")
    prompt = (
        "Create a realistic, full-body (head to knees) photograph of THE SAME PERSON from the reference selfie, "
        "preserving their exact face, identity, skin tone and hair, dressed as a LARP character"
        + (f" ('{concept}')" if concept else "") + ". "
        + (f"Body type: {', '.join(body)}. " if body else "")
        + "They are wearing/holding: " + "; ".join(wearables or ["a simple medieval linen tunic"]) + ". "
        "Do not add any other weapons, props or accessories beyond those listed. "
        "Setting: a misty Quebec boreal forest LARP campsite at golden hour, cinematic lighting, photorealistic."
    )
    chat = LlmChat(api_key=_key(), session_id=f"prev-{uuid.uuid4()}", system_message="You are an expert costume photo artist.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    msg = UserMessage(text=prompt, file_contents=[ImageContent(base64.b64encode(selfie_bytes).decode())])
    _, images = await _call(lambda: chat.send_message_multimodal_response(msg))
    if not images:
        raise RuntimeError("No image returned")
    return base64.b64decode(images[0]["data"]), images[0].get("mime_type", "image/png")


QC_POSTAL = re.compile(r"^[GHJ]\d[A-Z]\s?\d[A-Z]\d$", re.I)
