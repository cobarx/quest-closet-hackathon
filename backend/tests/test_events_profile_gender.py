# Events listing (upcoming only, age fields) + profile gender persistence via guest header
import os, uuid, datetime
import pytest, requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")


@pytest.fixture(scope="module")
def events():
    r = requests.get(f"{BASE_URL}/api/events", timeout=30)
    assert r.status_code == 200
    return r.json()


def test_events_list_nonempty(events):
    assert isinstance(events, list) and len(events) >= 1
    assert all("_id" not in e for e in events)


def test_events_only_upcoming(events):
    today = datetime.datetime.now(datetime.timezone.utc).date().isoformat()
    for e in events:
        assert (e.get("start_date") or "") >= today or (e.get("end_date") or "") >= today, e["name"]


def test_events_have_age_fields(events):
    for e in events:
        assert e.get("age_range_en"), e["name"]
        assert e.get("age_range_fr"), e["name"]
        assert "not listed" not in e["age_range_en"].lower()


def test_events_core_fields(events):
    for e in events:
        assert e.get("url", "").startswith("http")
        assert e.get("location") and e.get("genre_en") and e.get("genre_fr")


def test_profile_gender_female_persist():
    h = {"X-Guest-Id": str(uuid.uuid4())}
    body = {"lang": "en", "city": "Montréal", "gender": "female", "budget": 400, "height_cm": None, "weight_kg": None}
    r = requests.put(f"{BASE_URL}/api/profile", json=body, headers=h, timeout=30)
    assert r.status_code == 200 and r.json()["gender"] == "female"
    g = requests.get(f"{BASE_URL}/api/profile", headers=h, timeout=30)
    assert g.status_code == 200 and g.json()["gender"] == "female"
    body["gender"] = "male"
    r = requests.put(f"{BASE_URL}/api/profile", json=body, headers=h, timeout=30)
    assert r.json()["gender"] == "male"
