# Health / public endpoints
import requests
from conftest import API


class TestPublic:
    def test_restaurants_list(self, anon):
        r = anon.get(f"{API}/restaurants", timeout=30)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 4, f"Expected >=4 seeded restaurants, got {len(data)}"
        for item in data:
            assert "_id" not in item
            assert item["active"] is True
            assert "name" in item and "delivery_fee" in item

    def test_restaurant_detail_and_menu(self, anon):
        rid = anon.get(f"{API}/restaurants", timeout=30).json()[0]["id"]
        r = anon.get(f"{API}/restaurants/{rid}", timeout=30)
        assert r.status_code == 200
        assert r.json()["id"] == rid

        prods = anon.get(f"{API}/restaurants/{rid}/products", timeout=30)
        assert prods.status_code == 200
        assert len(prods.json()) > 0, "Restaurant has no products seeded"
        cats = anon.get(f"{API}/restaurants/{rid}/categories", timeout=30)
        assert cats.status_code == 200
        # NOTE: seed_data.py never seeds the `categories` collection (products carry
        # category_name only), so this endpoint returns [] for all seeded restaurants.
        assert isinstance(cats.json(), list)

    def test_restaurant_404(self, anon):
        r = anon.get(f"{API}/restaurants/does-not-exist", timeout=30)
        assert r.status_code == 404

    def test_search(self, anon):
        r = anon.get(f"{API}/search", params={"q": "biryani"}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "restaurants" in d and "products" in d
        assert len(d["restaurants"]) + len(d["products"]) > 0

    def test_offers_has_fudora50(self, anon):
        r = anon.get(f"{API}/offers", timeout=30)
        assert r.status_code == 200
        codes = [c["code"] for c in r.json()]
        assert "FUDORA50" in codes, f"FUDORA50 missing, got {codes}"

    def test_banners(self, anon):
        r = anon.get(f"{API}/banners", timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
