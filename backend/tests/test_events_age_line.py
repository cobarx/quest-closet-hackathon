# Events API: genre has no trailing age suffix; age_range still populated (iteration 2 bug fix)
import os, re, uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
AGE_END = re.compile(r"\d{1,2}\s*(\+|ans\s*et\s*plus|[–-]\s*\d{1,2})\s*(ans)?\)?\s*$", re.I)


@pytest.fixture(scope="module")
def events():
    r = requests.get(f"{BASE_URL}/api/events", headers={"X-Guest-Id": str(uuid.uuid4())}, timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and data
    return data


def test_no_mongo_id(events):
    assert all("_id" not in e for e in events)


def test_genre_has_no_age_suffix(events):
    bad = [(e["name"], e.get(g)) for e in events for g in ("genre_en", "genre_fr") if e.get(g) and AGE_END.search(e[g])]
    assert not bad, bad


def test_age_range_still_populated(events):
    assert any(e.get("age_range_en") for e in events)
    assert any(e.get("age_range_fr") for e in events)


def test_brumelance(events):
    b = [e for e in events if "brumelance" in (e.get("name", "") + e.get("genre_en", "")).lower()]
    assert b, "Brumelance event missing"
    e = b[0]
    assert e["genre_en"] == "Immersive adult LARP (Brumelance)", e["genre_en"]
    assert e["genre_fr"] == "GN immersif adulte (Brumelance)", e["genre_fr"]
    assert e["age_range_en"].startswith("18+")
    assert e["age_range_fr"].startswith(("18+", "18 ans"))
