# Restaurant admin: profile, products, analytics, data isolation
import uuid
from conftest import API


class TestRestaurantAdmin:
    def test_restaurant_me(self, royal_client):
        r = royal_client.get(f"{API}/restaurant/me", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "_id" not in d
        assert "Royal" in d["name"]

    def test_analytics(self, royal_client):
        r = royal_client.get(f"{API}/restaurant/analytics", timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        for k in ["today_orders", "total_sales", "commission_paid", "restaurant_earning",
                  "top_products", "daily_sales", "status_counts", "avg_order_value"]:
            assert k in d, f"missing {k}"
        assert len(d["daily_sales"]) == 7

    def test_products_isolation(self, royal_client, spice_client):
        royal_id = royal_client.get(f"{API}/restaurant/me", timeout=30).json()["id"]
        spice_id = spice_client.get(f"{API}/restaurant/me", timeout=30).json()["id"]
        assert royal_id != spice_id
        # create product for royal
        name = f"TEST_Item_{uuid.uuid4().hex[:6]}"
        cr = royal_client.post(f"{API}/restaurant/products", json={
            "name": name, "description": "TEST desc", "price": 249.0,
            "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8",
            "category_name": "Biryani", "is_veg": False}, timeout=30)
        assert cr.status_code == 200, cr.text[:300]
        pid = cr.json()["id"]
        assert cr.json()["restaurant_id"] == royal_id

        # verify persisted on public menu
        menu = royal_client.get(f"{API}/restaurants/{royal_id}/products", timeout=30).json()
        assert pid in [p["id"] for p in menu]
        spice_menu = spice_client.get(f"{API}/restaurants/{spice_id}/products", timeout=30).json()
        assert pid not in [p["id"] for p in spice_menu]

        # spice admin cannot update or delete royal product
        up = spice_client.patch(f"{API}/restaurant/products/{pid}", json={
            "name": "HACKED", "price": 1.0}, timeout=30)
        assert up.status_code == 404, f"cross-restaurant product update allowed: {up.status_code}"
        dl = spice_client.delete(f"{API}/restaurant/products/{pid}", timeout=30)
        assert dl.status_code == 200
        still = royal_client.get(f"{API}/restaurants/{royal_id}/products", timeout=30).json()
        assert pid in [p["id"] for p in still], "spice admin deleted royal's product!"

        # owner update works
        up2 = royal_client.patch(f"{API}/restaurant/products/{pid}", json={
            "name": name + "_upd", "price": 299.0, "is_veg": False}, timeout=30)
        assert up2.status_code == 200
        assert up2.json()["price"] == 299.0
        assert up2.json()["name"] == name + "_upd"

        # cleanup
        assert royal_client.delete(f"{API}/restaurant/products/{pid}", timeout=30).status_code == 200
        after = royal_client.get(f"{API}/restaurants/{royal_id}/products", timeout=30).json()
        assert pid not in [p["id"] for p in after]

    def test_category_crud(self, royal_client):
        rid = royal_client.get(f"{API}/restaurant/me", timeout=30).json()["id"]
        name = f"TEST_Cat_{uuid.uuid4().hex[:5]}"
        cr = royal_client.post(f"{API}/restaurant/categories", json={"name": name}, timeout=30)
        assert cr.status_code == 200
        cid = cr.json()["id"]
        cats = royal_client.get(f"{API}/restaurants/{rid}/categories", timeout=30).json()
        assert name in [c["name"] for c in cats]
        assert royal_client.delete(f"{API}/restaurant/categories/{cid}", timeout=30).status_code == 200
        cats2 = royal_client.get(f"{API}/restaurants/{rid}/categories", timeout=30).json()
        assert cid not in [c["id"] for c in cats2]

    def test_update_restaurant_profile(self, royal_client):
        orig = royal_client.get(f"{API}/restaurant/me", timeout=30).json()
        r = royal_client.patch(f"{API}/restaurant/me", json={
            "tagline": "TEST tagline QA", "delivery_time_mins": 33}, timeout=30)
        assert r.status_code == 200
        assert r.json()["tagline"] == "TEST tagline QA"
        assert r.json()["delivery_time_mins"] == 33
        again = royal_client.get(f"{API}/restaurant/me", timeout=30).json()
        assert again["tagline"] == "TEST tagline QA"
        # restore
        royal_client.patch(f"{API}/restaurant/me", json={
            "tagline": orig.get("tagline") or " ",
            "delivery_time_mins": orig.get("delivery_time_mins", 30)}, timeout=30)
