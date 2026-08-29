"""Iteration 4: platform categories, geocoding proxy, offers personal-coupon leak fix."""
import pytest
import requests
from conftest import API


# ---------------------------------------------------------------- platform categories (public)
class TestPlatformCategoriesPublic:
    def test_list_returns_seeded_sorted(self, anon):
        r = anon.get(f"{API}/platform-categories", timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 16, f"expected >=16 seeded categories, got {len(data)}"
        orders = [c["display_order"] for c in data]
        assert orders == sorted(orders), f"not sorted by display_order: {orders}"
        for c in data:
            assert set(["id", "name", "image_url", "display_order", "active"]).issubset(c.keys()), c
            assert c["active"] is True
            assert isinstance(c["image_url"], str) and c["image_url"].startswith("http")
            assert "_id" not in c
        assert data[0]["name"] == "Biryani", f"first category should be Biryani, got {data[0]['name']}"


# ---------------------------------------------------------------- geocoding
class TestGeocode:
    def test_reverse_sasaram(self, anon):
        r = anon.get(f"{API}/geocode/reverse", params={"lat": 24.949, "lng": 84.014}, timeout=40)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["city"] == "Sasaram", d
        assert d["state"] == "Bihar", d
        assert d["country"] == "India", d
        assert d["formatted"], d

    def test_reverse_mumbai(self, anon):
        r = anon.get(f"{API}/geocode/reverse", params={"lat": 19.076, "lng": 72.877}, timeout=40)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["country"] == "India", d
        assert "Mumbai" in (d.get("city") or "") or "Mumbai" in (d.get("formatted") or ""), d

    def test_search_patna(self, anon):
        r = anon.get(f"{API}/geocode/search", params={"q": "Patna"}, timeout=40)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert isinstance(d, list) and len(d) >= 1
        assert d[0]["lat"] is not None and d[0]["lng"] is not None

    @pytest.mark.parametrize("q", ["", "a"])
    def test_search_short_query_no_5xx(self, anon, q):
        r = anon.get(f"{API}/geocode/search", params={"q": q}, timeout=30)
        assert r.status_code < 500, f"5xx for q={q!r}: {r.status_code}"


# ---------------------------------------------------------------- offers leak fix
class TestOffersNoPersonalLeak:
    def test_offers_have_no_personal_coupons(self, anon):
        r = anon.get(f"{API}/offers", timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        leaked = [c for c in data if c.get("personal") is True]
        assert leaked == [], f"personal coupons leaked: {[c.get('code') for c in leaked]}"
        bad = [c for c in data if str(c.get("code", "")).startswith(("WELCOME", "FRIEND"))]
        assert bad == [], f"referral coupon codes leaked: {[c.get('code') for c in bad]}"
        codes = {c["code"] for c in data}
        assert {"FUDORA50", "SASARAM100", "FREEDEL"}.issubset(codes), codes

    def test_offers_leak_after_referral_coupons_exist(self, customer_client, anon):
        """Ensure customer with personal coupons doesn't cause them to appear publicly."""
        mine = customer_client.get(f"{API}/me/coupons", timeout=30)
        assert mine.status_code == 200, mine.text[:300]
        public = anon.get(f"{API}/offers", timeout=30).json()
        public_codes = {c["code"] for c in public}
        personal_codes = {c["code"] for c in mine.json() if c.get("personal")}
        assert not (personal_codes & public_codes), personal_codes & public_codes


# ---------------------------------------------------------------- super admin CRUD + RBAC
@pytest.fixture(scope="class")
def created_cat_ids():
    return []


@pytest.fixture(scope="class", autouse=True)
def cleanup_cats(super_client, created_cat_ids):
    yield
    for cid in created_cat_ids:
        super_client.delete(f"{API}/admin/platform-categories/{cid}", timeout=30)


class TestPlatformCategoryAdminCRUD:
    def test_create_update_delete(self, super_client, anon, created_cat_ids):
        payload = {"name": "TEST QA", "image_url": "x", "display_order": 999}
        r = super_client.post(f"{API}/admin/platform-categories", json=payload, timeout=30)
        assert r.status_code == 200, r.text[:300]
        doc = r.json()
        assert doc["name"] == "TEST QA"
        assert doc["display_order"] == 999
        assert "id" in doc and "_id" not in doc
        cid = doc["id"]
        created_cat_ids.append(cid)

        # verify persisted publicly
        listed = anon.get(f"{API}/platform-categories", timeout=30).json()
        assert any(c["id"] == cid for c in listed), "created category not in public list"

        # PATCH
        r2 = super_client.patch(f"{API}/admin/platform-categories/{cid}",
                                json={"name": "TEST QA2", "display_order": 998}, timeout=30)
        assert r2.status_code == 200, r2.text[:300]
        assert r2.json()["name"] == "TEST QA2"
        listed = anon.get(f"{API}/platform-categories", timeout=30).json()
        got = next(c for c in listed if c["id"] == cid)
        assert got["name"] == "TEST QA2" and got["display_order"] == 998

        # DELETE
        r3 = super_client.delete(f"{API}/admin/platform-categories/{cid}", timeout=30)
        assert r3.status_code == 200, r3.text[:300]
        listed = anon.get(f"{API}/platform-categories", timeout=30).json()
        assert not any(c["id"] == cid for c in listed), "category still present after delete"
        created_cat_ids.remove(cid)

    @pytest.mark.parametrize("client_name", ["customer_client", "royal_client"])
    def test_non_super_admin_forbidden(self, request, client_name):
        c = request.getfixturevalue(client_name)
        r = c.post(f"{API}/admin/platform-categories",
                   json={"name": "TEST QA nope", "image_url": "x", "display_order": 1}, timeout=30)
        assert r.status_code == 403, f"POST -> {r.status_code}"
        r = c.patch(f"{API}/admin/platform-categories/xyz", json={"name": "n"}, timeout=30)
        assert r.status_code == 403, f"PATCH -> {r.status_code}"
        r = c.delete(f"{API}/admin/platform-categories/xyz", timeout=30)
        assert r.status_code == 403, f"DELETE -> {r.status_code}"

    def test_anonymous_forbidden(self, anon):
        r = anon.post(f"{API}/admin/platform-categories",
                      json={"name": "TEST QA nope", "image_url": "x", "display_order": 1}, timeout=30)
        assert r.status_code in (401, 403), r.status_code
