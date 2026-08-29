# Orders: place order (COD), commission calc, coupon, status flow, isolation
import requests
import pytest
from conftest import API

ADDRESS = {
    "label": "Home", "name": "TEST QA", "phone": "9876543210",
    "line1": "12 Fazalganj Road", "area": "Fazalganj", "city": "Sasaram",
    "pincode": "821115", "landmark": "Near Clock Tower",
}


def royal_restaurant(anon):
    for r in anon.get(f"{API}/restaurants", timeout=30).json():
        if "Royal" in r["name"]:
            return r
    return anon.get(f"{API}/restaurants", timeout=30).json()[0]


def build_items(anon, rid, target_subtotal):
    prods = [p for p in anon.get(f"{API}/restaurants/{rid}/products", timeout=30).json()
             if p.get("available", True)]
    assert prods, "no available products"
    p = sorted(prods, key=lambda x: -(x.get("discount_price") or x["price"]))[0]
    unit = p.get("discount_price") or p["price"]
    qty = max(1, int(target_subtotal // unit) + 1)
    return [{"product_id": p["id"], "quantity": qty}], unit * qty


@pytest.fixture(scope="module")
def placed_order(anon, customer_client):
    rest = royal_restaurant(anon)
    items, subtotal = build_items(anon, rest["id"], 300)
    r = customer_client.post(f"{API}/orders", json={
        "restaurant_id": rest["id"], "items": items, "address": ADDRESS,
        "coupon_code": "FUDORA50", "payment_method": "cod", "notes": "TEST order"}, timeout=60)
    assert r.status_code == 200, f"place order failed: {r.status_code} {r.text[:400]}"
    return r.json(), rest, subtotal


class TestPlaceOrder:
    def test_order_totals_and_commission(self, placed_order):
        o, rest, subtotal = placed_order
        assert o["id"].startswith("FUD")
        assert "_id" not in o
        assert o["status"] == "pending"
        assert o["payment_method"] == "cod"
        assert o["payment_status"] == "cod_pending"
        assert o["subtotal"] == round(subtotal, 2)
        # commission = 10% of subtotal
        assert o["commission_pct"] == 10
        assert o["commission_amount"] == round(subtotal * 0.10, 2), o
        assert o["restaurant_earning"] == round(subtotal - o["commission_amount"], 2)
        # FUDORA50: 50% capped at 100
        assert o["discount"] == min(round(subtotal * 0.5, 2), 100), o["discount"]
        expected_tax = round((o["subtotal"] - o["discount"]) * 0.05, 2)
        assert o["tax"] == expected_tax
        assert o["total"] == round(o["subtotal"] - o["discount"] + o["delivery_fee"] + o["tax"], 2)
        assert o["address"]["city"] == "Sasaram"
        assert o["status_history"][0]["status"] == "pending"

    def test_order_visible_in_my_orders(self, placed_order, customer_client):
        o, _, _ = placed_order
        r = customer_client.get(f"{API}/orders/mine", timeout=30)
        assert r.status_code == 200
        assert o["id"] in [x["id"] for x in r.json()]

    def test_get_order_by_id(self, placed_order, customer_client):
        o, _, _ = placed_order
        r = customer_client.get(f"{API}/orders/{o['id']}", timeout=30)
        assert r.status_code == 200
        assert r.json()["total"] == o["total"]

    def test_other_customer_cannot_read_order(self, placed_order, anon):
        import uuid
        o, _, _ = placed_order
        s = requests.Session()
        reg = s.post(f"{API}/auth/register", json={
            "name": "TEST Other", "email": f"TEST_{uuid.uuid4().hex[:8]}@fudoratest.example.com",
            "password": "Test@2026"}, timeout=30)
        assert reg.status_code == 200
        tok = reg.json()["token"]
        r = requests.get(f"{API}/orders/{o['id']}", headers={"Authorization": f"Bearer {tok}"}, timeout=30)
        assert r.status_code == 403, f"data leak: {r.status_code}"

    def test_place_order_requires_auth(self, anon):
        r = requests.post(f"{API}/orders", json={"restaurant_id": "x", "items": [], "address": ADDRESS}, timeout=30)
        assert r.status_code == 401

    def test_restaurant_admin_cannot_place_order(self, royal_client, anon):
        rest = royal_restaurant(anon)
        items, _ = build_items(anon, rest["id"], 300)
        r = royal_client.post(f"{API}/orders", json={
            "restaurant_id": rest["id"], "items": items, "address": ADDRESS}, timeout=30)
        assert r.status_code == 403

    def test_empty_cart_rejected(self, customer_client, anon):
        rest = royal_restaurant(anon)
        r = customer_client.post(f"{API}/orders", json={
            "restaurant_id": rest["id"], "items": [], "address": ADDRESS}, timeout=30)
        assert r.status_code == 400

    def test_cross_restaurant_product_rejected(self, customer_client, anon):
        rests = anon.get(f"{API}/restaurants", timeout=30).json()
        r1, r2 = rests[0], rests[1]
        p2 = anon.get(f"{API}/restaurants/{r2['id']}/products", timeout=30).json()[0]
        r = customer_client.post(f"{API}/orders", json={
            "restaurant_id": r1["id"], "items": [{"product_id": p2["id"], "quantity": 1}],
            "address": ADDRESS}, timeout=30)
        assert r.status_code == 400, f"accepted foreign product: {r.status_code}"

    def test_invalid_restaurant_rejected(self, customer_client):
        r = customer_client.post(f"{API}/orders", json={
            "restaurant_id": "nope", "items": [{"product_id": "x", "quantity": 1}],
            "address": ADDRESS}, timeout=30)
        assert r.status_code == 400


class TestCoupon:
    def test_fudora50_caps_at_100(self, customer_client):
        r = customer_client.post(f"{API}/coupons/validate", params={"code": "FUDORA50", "subtotal": 300}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["discount"] == 100.0, r.json()

    def test_fudora50_percentage_below_cap(self, customer_client):
        r = customer_client.post(f"{API}/coupons/validate", params={"code": "FUDORA50", "subtotal": 200}, timeout=30)
        assert r.status_code == 200
        assert r.json()["discount"] == 100.0

    def test_below_min_order_rejected(self, customer_client):
        r = customer_client.post(f"{API}/coupons/validate", params={"code": "FUDORA50", "subtotal": 150}, timeout=30)
        assert r.status_code == 400, r.text[:200]

    def test_invalid_coupon(self, customer_client):
        r = customer_client.post(f"{API}/coupons/validate", params={"code": "NOPE123", "subtotal": 500}, timeout=30)
        assert r.status_code == 400

    def test_coupon_validate_requires_auth(self):
        r = requests.post(f"{API}/coupons/validate", params={"code": "FUDORA50", "subtotal": 300}, timeout=30)
        assert r.status_code == 401


class TestOrderStatusFlowAndIsolation:
    def test_order_appears_in_restaurant_admin(self, placed_order, royal_client):
        o, rest, _ = placed_order
        r = royal_client.get(f"{API}/restaurant/orders", timeout=30)
        assert r.status_code == 200, r.text[:300]
        orders = r.json()
        assert o["id"] in [x["id"] for x in orders]
        assert all(x["restaurant_id"] == rest["id"] for x in orders), "data isolation broken"

    def test_order_appears_in_super_admin(self, placed_order, super_client):
        o, _, _ = placed_order
        r = super_client.get(f"{API}/admin/orders", timeout=30)
        assert r.status_code == 200
        assert o["id"] in [x["id"] for x in r.json()]

    def test_other_restaurant_admin_cannot_see_order(self, placed_order, spice_client):
        o, _, _ = placed_order
        assert o["id"] not in [x["id"] for x in spice_client.get(f"{API}/restaurant/orders", timeout=30).json()]
        r = spice_client.get(f"{API}/orders/{o['id']}", timeout=30)
        assert r.status_code == 403, f"cross-restaurant order leak: {r.status_code}"

    def test_other_restaurant_admin_cannot_update_status(self, placed_order, spice_client):
        o, _, _ = placed_order
        r = spice_client.patch(f"{API}/orders/{o['id']}/status", json={"status": "accepted"}, timeout=30)
        assert r.status_code == 403

    def test_full_status_progression(self, placed_order, royal_client, customer_client):
        o, _, _ = placed_order
        for st in ["accepted", "preparing", "ready", "out_for_delivery", "completed"]:
            r = royal_client.patch(f"{API}/orders/{o['id']}/status", json={"status": st}, timeout=30)
            assert r.status_code == 200, f"{st}: {r.status_code} {r.text[:200]}"
            assert r.json()["status"] == st
            # customer sees the update (polling equivalent)
            cr = customer_client.get(f"{API}/orders/{o['id']}", timeout=30)
            assert cr.status_code == 200 and cr.json()["status"] == st
        final = customer_client.get(f"{API}/orders/{o['id']}", timeout=30).json()
        assert final["payment_status"] == "paid"
        assert [h["status"] for h in final["status_history"]] == [
            "pending", "accepted", "preparing", "ready", "out_for_delivery", "completed"]

    def test_invalid_status_rejected(self, placed_order, royal_client):
        o, _, _ = placed_order
        r = royal_client.patch(f"{API}/orders/{o['id']}/status", json={"status": "teleported"}, timeout=30)
        assert r.status_code == 422

    def test_status_update_on_missing_order(self, royal_client):
        r = royal_client.patch(f"{API}/orders/NOPE/status", json={"status": "accepted"}, timeout=30)
        assert r.status_code == 404

    def test_review_completed_order(self, placed_order, customer_client, anon):
        o, rest, _ = placed_order
        r = customer_client.post(f"{API}/reviews", json={
            "order_id": o["id"], "rating": 5, "comment": "TEST great food"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["rating"] == 5
        dup = customer_client.post(f"{API}/reviews", json={"order_id": o["id"], "rating": 4}, timeout=30)
        assert dup.status_code == 400
        revs = anon.get(f"{API}/restaurants/{rest['id']}/reviews", timeout=30)
        assert revs.status_code == 200
        assert o["id"] in [x["order_id"] for x in revs.json()]
