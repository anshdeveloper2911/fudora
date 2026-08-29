# Referral rewards: /api/me/referral, register with referral_code, personal coupons,
# coupon ownership + one-time use, order placement with personal coupon.
import uuid
import requests
import pytest
from conftest import API, login, CUST, SUPER, ROYAL

ADDRESS = {
    "label": "Home", "name": "TEST QA", "phone": "9876543210",
    "line1": "12 Fazalganj Road", "area": "Fazalganj", "city": "Sasaram",
    "pincode": "821115",
}


def new_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def register(name, referral_code=None):
    s = new_session()
    payload = {"name": name, "email": f"TEST_{uuid.uuid4().hex[:8]}@fudoratest.example.com",
               "password": "Test@2026", "phone": "9000000000"}
    if referral_code is not None:
        payload["referral_code"] = referral_code
    r = s.post(f"{API}/auth/register", json=payload, timeout=30)
    return s, r, payload


@pytest.fixture(scope="module")
def customer():
    return login(CUST)


@pytest.fixture(scope="module")
def referrer_code(customer):
    r = customer.get(f"{API}/me/referral", timeout=30)
    assert r.status_code == 200, r.text[:300]
    return r.json()["referral_code"]


@pytest.fixture(scope="module")
def referred(customer, referrer_code):
    """Register a brand new user with the demo customer's referral code."""
    before = customer.get(f"{API}/me/referral", timeout=30).json()["referral_count"]
    s, r, payload = register("TEST Referred User", referrer_code)
    assert r.status_code == 200, f"register with referral failed: {r.status_code} {r.text[:400]}"
    body = r.json()
    s.headers.update({"Authorization": f"Bearer {body['token']}"})
    return {"session": s, "user": body["user"], "count_before": before}


class TestReferralCode:
    def test_me_referral_shape_and_stability(self, customer):
        r1 = customer.get(f"{API}/me/referral", timeout=30)
        assert r1.status_code == 200, r1.text[:300]
        d1 = r1.json()
        assert isinstance(d1["referral_code"], str) and len(d1["referral_code"]) >= 5
        assert "-" in d1["referral_code"]
        assert isinstance(d1["referral_count"], int)
        d2 = customer.get(f"{API}/me/referral", timeout=30).json()
        assert d2["referral_code"] == d1["referral_code"], "referral code not stable"

    def test_me_referral_requires_auth(self):
        r = requests.get(f"{API}/me/referral", timeout=30)
        assert r.status_code == 401

    def test_super_admin_lazy_generates_code(self):
        c = login(SUPER)
        r = c.get(f"{API}/me/referral", timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["referral_code"]

    def test_restaurant_admin_lazy_generates_code(self):
        c = login(ROYAL)
        r = c.get(f"{API}/me/referral", timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["referral_code"]

    def test_new_signup_gets_own_code(self):
        s, r, _ = register("TEST Solo User")
        assert r.status_code == 200, r.text[:300]
        u = r.json()["user"]
        assert u["role"] == "customer"
        assert u.get("referral_code"), "new user has no referral_code"
        assert "password_hash" not in u

    def test_invalid_referral_code_rejected(self):
        s, r, _ = register("TEST Bad Ref", "NOSUCH-XX")
        assert r.status_code == 400, f"expected 400, got {r.status_code} {r.text[:200]}"
        assert "Invalid referral code" in r.text


class TestReferralCoupons:
    def test_new_user_gets_welcome_coupon(self, referred):
        r = referred["session"].get(f"{API}/me/coupons", timeout=30)
        assert r.status_code == 200, r.text[:300]
        coupons = r.json()
        welcome = [c for c in coupons if c["code"].startswith("WELCOME")]
        assert welcome, f"no WELCOME coupon: {coupons}"
        c = welcome[0]
        assert "_id" not in c
        assert c["discount_type"] == "flat"
        assert c["discount_value"] == 100.0
        assert c["min_order"] == 199.0
        assert c["personal"] is True
        assert c["user_id"] == referred["user"]["id"]
        assert c["usage_limit"] == 1 and c["used_count"] == 0

    def test_referrer_gets_friend_coupon(self, customer, referred):
        r = customer.get(f"{API}/me/coupons", timeout=30)
        assert r.status_code == 200
        friend = [c for c in r.json() if c["code"].startswith("FRIEND")]
        assert friend, "referrer has no FRIEND coupon"
        c = friend[0]
        assert c["discount_type"] == "flat"
        assert c["discount_value"] == 25.0
        assert c["min_order"] == 149.0
        assert c["personal"] is True

    def test_referral_count_incremented(self, customer, referred):
        after = customer.get(f"{API}/me/referral", timeout=30).json()["referral_count"]
        assert after == referred["count_before"] + 1, f"{after} vs {referred['count_before']}"

    def test_personal_coupon_only_for_owner(self, customer, referred):
        code = [c["code"] for c in referred["session"].get(f"{API}/me/coupons", timeout=30).json()
                if c["code"].startswith("WELCOME")][0]
        # owner can validate
        ok = referred["session"].post(f"{API}/coupons/validate", params={"code": code, "subtotal": 500}, timeout=30)
        assert ok.status_code == 200, ok.text[:300]
        assert ok.json()["discount"] == 100.0
        # someone else cannot
        bad = customer.post(f"{API}/coupons/validate", params={"code": code, "subtotal": 500}, timeout=30)
        assert bad.status_code == 400, f"personal coupon leaked to other user: {bad.status_code}"
        assert "not available for your account" in bad.text

    def test_personal_coupon_respects_min_order(self, referred):
        code = [c["code"] for c in referred["session"].get(f"{API}/me/coupons", timeout=30).json()
                if c["code"].startswith("WELCOME")][0]
        r = referred["session"].post(f"{API}/coupons/validate", params={"code": code, "subtotal": 100}, timeout=30)
        assert r.status_code == 400

    def test_personal_coupons_not_in_public_offers(self, anon, referred):
        code = [c["code"] for c in referred["session"].get(f"{API}/me/coupons", timeout=30).json()
                if c["code"].startswith("WELCOME")][0]
        offers = anon.get(f"{API}/offers", timeout=30).json()
        codes = [o["code"] for o in offers]
        assert code not in codes, "personal coupon exposed in public /api/offers"
        assert not any(o.get("personal") for o in offers), "personal coupons listed in /api/offers"


class TestOrderWithPersonalCoupon:
    def test_order_uses_and_burns_personal_coupon(self, anon, referred):
        sess = referred["session"]
        code = [c["code"] for c in sess.get(f"{API}/me/coupons", timeout=30).json()
                if c["code"].startswith("WELCOME")][0]
        rests = anon.get(f"{API}/restaurants", timeout=30).json()
        rest = next((r for r in rests if "Royal" in r["name"]), rests[0])
        prods = [p for p in anon.get(f"{API}/restaurants/{rest['id']}/products", timeout=30).json()
                 if p.get("available", True)]
        p = sorted(prods, key=lambda x: -(x.get("discount_price") or x["price"]))[0]
        unit = p.get("discount_price") or p["price"]
        qty = max(1, int(300 // unit) + 1)

        r = sess.post(f"{API}/orders", json={
            "restaurant_id": rest["id"], "items": [{"product_id": p["id"], "quantity": qty}],
            "address": ADDRESS, "coupon_code": code, "payment_method": "cod",
            "notes": "TEST referral coupon"}, timeout=60)
        assert r.status_code == 200, f"order failed: {r.status_code} {r.text[:400]}"
        o = r.json()
        assert o["discount"] == 100.0, o["discount"]
        assert o["coupon_code"] == code
        assert o["total"] == round(o["subtotal"] - 100.0 + o["delivery_fee"] + o["tax"], 2)

        # coupon now burnt: not in my coupons (active filter) and validate fails
        mine = sess.get(f"{API}/me/coupons", timeout=30).json()
        assert code not in [c["code"] for c in mine], "used personal coupon still listed as active"
        again = sess.post(f"{API}/coupons/validate", params={"code": code, "subtotal": 500}, timeout=30)
        assert again.status_code == 400, f"used coupon still valid: {again.status_code}"

        r2 = sess.post(f"{API}/orders", json={
            "restaurant_id": rest["id"], "items": [{"product_id": p["id"], "quantity": qty}],
            "address": ADDRESS, "coupon_code": code, "payment_method": "cod"}, timeout=60)
        assert r2.status_code == 400, f"reused personal coupon accepted: {r2.status_code}"
