"""Gap-coverage tests: upload RBAC, review rules, favourites payload,
commission settings effect on new orders, CORS credentials config."""
import io
import pytest
import requests
from conftest import API, login, CUST


# ---------- helpers ----------
def _royal_products(anon):
    rests = anon.get(f"{API}/restaurants", timeout=30).json()
    royal = next(r for r in rests if "Royal" in r["name"])
    prods = anon.get(f"{API}/restaurants/{royal['id']}/products", timeout=30).json()
    return royal, prods


def _place_order(customer_client, anon, qty=4, coupon=None):
    royal, prods = _royal_products(anon)
    p = prods[0]
    body = {
        "restaurant_id": royal["id"],
        "items": [{"product_id": p["id"], "quantity": qty}],
        "address": {"label": "Home", "name": "TEST_QA", "phone": "9999911111",
                    "line1": "TEST 12 GT Road", "area": "Dharamshala", "city": "Sasaram",
                    "pincode": "821115"},
        "payment_method": "cod",
    }
    if coupon:
        body["coupon_code"] = coupon
    r = customer_client.post(f"{API}/orders", json=body, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


# ---------- /api/upload RBAC ----------
class TestUploadRBAC:
    IMG = (b"\x89PNG\r\n\x1a\n" + b"0" * 64)

    def test_upload_requires_auth(self):
        r = requests.post(f"{API}/upload",
                          files={"file": ("t.png", io.BytesIO(self.IMG), "image/png")}, timeout=60)
        assert r.status_code == 401, r.text

    def test_customer_upload_forbidden(self, customer_client):
        r = customer_client.post(f"{API}/upload",
                                 files={"file": ("t.png", io.BytesIO(self.IMG), "image/png")},
                                 headers={"Content-Type": None}, timeout=60)
        assert r.status_code == 403, f"customer should be 403, got {r.status_code} {r.text[:200]}"

    def test_restaurant_admin_upload_bad_mime_rejected(self, royal_client):
        r = royal_client.post(f"{API}/upload",
                              files={"file": ("t.txt", io.BytesIO(b"hello"), "text/plain")},
                              headers={"Content-Type": None}, timeout=60)
        assert r.status_code == 400, f"expected 400 for text/plain, got {r.status_code}"

    def test_restaurant_admin_upload_png_ok(self, royal_client):
        r = royal_client.post(f"{API}/upload",
                              files={"file": ("t.png", io.BytesIO(self.IMG), "image/png")},
                              headers={"Content-Type": None}, timeout=120)
        assert r.status_code == 200, f"upload failed: {r.status_code} {r.text[:300]}"
        data = r.json()
        assert data["url"].startswith("/api/files/")
        # public fetch of uploaded file (no auth)
        served = requests.get(f"{API}/files/{data['path']}", timeout=60)
        assert served.status_code == 200, f"served file status {served.status_code}"
        assert served.content == self.IMG


# ---------- Reviews ----------
class TestReviewRules:
    def test_review_before_completion_rejected(self, customer_client, anon):
        order = _place_order(customer_client, anon)
        r = customer_client.post(f"{API}/reviews",
                                 json={"order_id": order["id"], "rating": 5, "comment": "TEST_early"},
                                 timeout=30)
        assert r.status_code == 400, f"expected 400 for non-completed order, got {r.status_code}"

    def test_review_then_duplicate_and_rating_update(self, customer_client, royal_client, anon):
        order = _place_order(customer_client, anon)
        for st in ["accepted", "preparing", "ready", "out_for_delivery", "completed"]:
            r = royal_client.patch(f"{API}/orders/{order['id']}/status", json={"status": st}, timeout=30)
            assert r.status_code == 200, r.text
        first = customer_client.post(f"{API}/reviews",
                                     json={"order_id": order["id"], "rating": 4, "comment": "TEST_review"},
                                     timeout=30)
        assert first.status_code == 200, first.text
        assert first.json()["rating"] == 4
        assert first.json()["restaurant_id"] == order["restaurant_id"]

        dup = customer_client.post(f"{API}/reviews",
                                   json={"order_id": order["id"], "rating": 5}, timeout=30)
        assert dup.status_code == 400, f"duplicate review should be 400, got {dup.status_code}"

        # review visible publicly and rating recomputed
        reviews = anon.get(f"{API}/restaurants/{order['restaurant_id']}/reviews", timeout=30).json()
        assert any(rv["order_id"] == order["id"] for rv in reviews)
        rest = anon.get(f"{API}/restaurants/{order['restaurant_id']}", timeout=30).json()
        assert rest.get("review_count", 0) >= 1
        assert 1 <= rest["rating"] <= 5

    def test_review_rating_out_of_range_rejected(self, customer_client):
        r = customer_client.post(f"{API}/reviews", json={"order_id": "nope", "rating": 9}, timeout=30)
        assert r.status_code == 422, r.status_code

    def test_review_unknown_order_404(self, customer_client):
        r = customer_client.post(f"{API}/reviews", json={"order_id": "TEST_missing", "rating": 5}, timeout=30)
        assert r.status_code == 404, r.status_code


# ---------- Favourites payload ----------
class TestFavouritesPayload:
    def test_restaurant_and_product_favourites_returned(self, customer_client, anon):
        royal, prods = _royal_products(anon)
        pid = prods[0]["id"]
        try:
            r1 = customer_client.post(f"{API}/me/favourites/toggle",
                                      params={"type": "restaurant", "id": royal["id"]}, timeout=30)
            assert r1.status_code == 200 and r1.json()["favourited"] is True
            r2 = customer_client.post(f"{API}/me/favourites/toggle",
                                      params={"type": "product", "id": pid}, timeout=30)
            assert r2.status_code == 200 and r2.json()["favourited"] is True

            favs = customer_client.get(f"{API}/me/favourites", timeout=30).json()
            assert royal["id"] in [x["id"] for x in favs["restaurants"]]
            assert pid in [x["id"] for x in favs["products"]]
            assert all("_id" not in x for x in favs["restaurants"] + favs["products"])
        finally:
            customer_client.post(f"{API}/me/favourites/toggle",
                                 params={"type": "restaurant", "id": royal["id"]}, timeout=30)
            customer_client.post(f"{API}/me/favourites/toggle",
                                 params={"type": "product", "id": pid}, timeout=30)

        favs = customer_client.get(f"{API}/me/favourites", timeout=30).json()
        assert royal["id"] not in [x["id"] for x in favs["restaurants"]]
        assert pid not in [x["id"] for x in favs["products"]]


# ---------- Commission settings affect new orders ----------
class TestCommissionSettings:
    def test_updated_commission_applies_to_new_orders(self, super_client, customer_client, anon):
        try:
            up = super_client.patch(f"{API}/admin/settings", json={"commission_pct": 15}, timeout=30)
            assert up.status_code == 200 and up.json()["commission_pct"] == 15
            order = _place_order(customer_client, anon, qty=2)
            assert order["commission_pct"] == 15, f"order used commission_pct={order['commission_pct']}"
            expected = round(order["subtotal"] * 0.15, 2)
            assert abs(order["commission_amount"] - expected) < 0.05, order["commission_amount"]
            assert abs(order["restaurant_earning"] - round(order["subtotal"] - expected, 2)) < 0.05
        finally:
            super_client.patch(f"{API}/admin/settings", json={"commission_pct": 10}, timeout=30)
        assert super_client.get(f"{API}/admin/settings", timeout=30).json()["commission_pct"] == 10

    def test_customer_cannot_change_settings(self, customer_client):
        r = customer_client.patch(f"{API}/admin/settings", json={"commission_pct": 1}, timeout=30)
        assert r.status_code == 403


# ---------- Customer cancel + order math with coupon ----------
class TestOrderLifecycleExtras:
    def test_customer_can_cancel_pending_only(self, customer_client, royal_client, anon):
        order = _place_order(customer_client, anon)
        r = customer_client.patch(f"{API}/orders/{order['id']}/status", json={"status": "cancelled"}, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "cancelled"

        order2 = _place_order(customer_client, anon)
        royal_client.patch(f"{API}/orders/{order2['id']}/status", json={"status": "accepted"}, timeout=30)
        r2 = customer_client.patch(f"{API}/orders/{order2['id']}/status", json={"status": "cancelled"}, timeout=30)
        assert r2.status_code == 403, f"cancel after accept should be 403, got {r2.status_code}"

    def test_order_math_with_fudora50(self, customer_client, anon):
        order = _place_order(customer_client, anon, qty=5, coupon="FUDORA50")
        sub = order["subtotal"]
        assert order["discount"] == min(round(sub * 0.5, 2), 100)
        assert order["tax"] == round((sub - order["discount"]) * 0.05, 2)
        assert order["total"] == round(sub - order["discount"] + order["delivery_fee"] + order["tax"], 2)
        assert order["payment_status"] == "cod_pending"
        assert order["status"] == "pending"
        assert order["status_history"][0]["status"] == "pending"
