"""Quest Closet regression tests: catalog, FR fields, AI stylist no-match, events, guest cart + checkout."""
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
GUEST = str(uuid.uuid4())
H = {"X-Guest-Id": GUEST, "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def products():
    r = requests.get(f"{BASE_URL}/api/fitting-room/products", timeout=30)
    assert r.status_code == 200
    return {p["id"]: p for p in r.json()}


# ---- Catalog ----
class TestCatalog:
    def test_count(self, products):
        assert len(products) == 62

    @pytest.mark.parametrize("pid", ["weapon-oak-war-club", "weapon-troll-club", "armor-sunforged-breastplate",
                                     "armor-gold-lamellar", "armor-valkyrie-gold", "armor-lionheart-harness",
                                     "helm-gold-greathelm", "shield-gilded-sun", "boots-gilded-greaves", "weapon-gilded-mace"])
    def test_new_items_present(self, products, pid):
        assert pid in products

    def test_all_fr_fields(self, products):
        missing = [p["id"] for p in products.values() if not p.get("name_fr") or not p.get("description_fr")]
        assert missing == []

    def test_armor_descriptions_detailed(self, products):
        assert "4-in-1" in products["armor-chainmail"]["description"]
        assert "6.5 kg" in products["armor-gothic-cuirass"]["description"]

    def test_images_load(self, products):
        bad = []
        for pid in ["weapon-oak-war-club", "weapon-troll-club", "armor-sunforged-breastplate", "armor-gold-lamellar",
                    "armor-valkyrie-gold", "armor-lionheart-harness", "helm-gold-greathelm", "shield-gilded-sun",
                    "boots-gilded-greaves", "weapon-gilded-mace"]:
            img = products[pid]["image"]
            url = img if img.startswith("http") else BASE_URL + img
            r = requests.get(url, timeout=30)
            if r.status_code != 200 or not r.headers.get("content-type", "").startswith("image"):
                bad.append((pid, r.status_code))
        assert bad == []


# ---- AI stylist (sequential) ----
def _ask(payload):
    base = {"message": "", "history": [], "equipped_ids": [], "benched_ids": [], "filters": {}, "lang": "en"}
    base.update(payload)
    r = requests.post(f"{BASE_URL}/api/fitting-room/assistant", json=base, timeout=120)
    assert r.status_code == 200, r.text
    return r.json()


class TestStylist:
    def test_no_match_en(self):
        d = _ask({"message": "show me a pink helmet"})
        assert d["reply"] == "No items match your query."
        assert d["no_match"] is True and d["equip"] == [] and d["filters"] is None

    def test_no_match_fr(self):
        d = _ask({"message": "je veux un fusil laser", "lang": "fr"})
        assert d["reply"] == "Aucun article ne correspond à votre recherche."
        assert d["no_match"] is True

    def test_club(self):
        d = _ask({"message": "I want a club"})
        assert d["no_match"] is False
        assert set(d["equip"] + d["highlight"]) & {"weapon-oak-war-club", "weapon-troll-club"}, d

    def test_gold_armor_fr(self):
        d = _ask({"message": "montre-moi une armure dorée", "lang": "fr"})
        assert d["no_match"] is False
        gold = {"armor-sunforged-breastplate", "armor-gold-lamellar", "armor-valkyrie-gold", "armor-lionheart-harness"}
        assert set(d["equip"] + d["highlight"]) & gold, d
        print("FR reply:", d["reply"])

    def test_take_off_helmet(self):
        d = _ask({"message": "take off the helmet", "equipped_ids": ["helm-black-barbute"]})
        assert d["no_match"] is False
        assert "helm-black-barbute" in d["unequip"]


# ---- Events ----
class TestEvents:
    def test_list(self):
        r = requests.get(f"{BASE_URL}/api/events", timeout=30)
        assert r.status_code == 200
        ev = r.json()
        assert len(ev) >= 1
        for k in ("description_en", "description_fr", "description", "name", "start_date"):
            assert k in ev[0]

    def test_refresh_requires_guest(self):
        r = requests.post(f"{BASE_URL}/api/events/refresh", timeout=30)
        assert r.status_code == 401

    def test_refresh_flow(self):
        r = requests.post(f"{BASE_URL}/api/events/refresh", headers=H, timeout=30)
        assert r.status_code == 200 and r.json()["running"] is True
        deadline = time.time() + 280
        state = r.json()
        while time.time() < deadline:
            time.sleep(10)
            state = requests.get(f"{BASE_URL}/api/events/refresh", timeout=30).json()
            if not state["running"]:
                break
        assert state["running"] is False, "refresh still running after 280s"
        assert state["error"] is False
        assert len(requests.get(f"{BASE_URL}/api/events", timeout=30).json()) >= 1


# ---- Guest cart + checkout ----
class TestCheckout:
    def test_empty_checkout_400(self):
        h = {**H, "X-Guest-Id": str(uuid.uuid4())}
        r = requests.post(f"{BASE_URL}/api/checkout", json={"origin_url": BASE_URL}, headers=h, timeout=30)
        assert r.status_code == 400

    def test_add_and_checkout(self, products):
        p = products["weapon-oak-war-club"]
        size = (p.get("sizing") or {}).get("sizes", [""])[0]
        r = requests.post(f"{BASE_URL}/api/cart/add", json={"items": [{"product_id": p["id"], "qty": 1, "size": size}]}, headers=H, timeout=30)
        assert r.status_code == 200 and r.json()["items"][0]["product_id"] == p["id"]
        assert requests.get(f"{BASE_URL}/api/cart", headers=H, timeout=30).json()["items"][0]["product_id"] == p["id"]
        r = requests.post(f"{BASE_URL}/api/checkout", json={"origin_url": BASE_URL}, headers=H, timeout=60)
        assert r.status_code == 200, r.text
        assert r.json()["checkout_url"].startswith("https://checkout.stripe.com")
        requests.put(f"{BASE_URL}/api/cart", json={"items": []}, headers=H, timeout=30)
