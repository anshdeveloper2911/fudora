# Super admin: dashboard, restaurants, toggle, coupons, customers, settings
import uuid
from conftest import API


class TestSuperAdmin:
    def test_dashboard(self, super_client):
        r = super_client.get(f"{API}/admin/dashboard", timeout=60)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        for k in ["total_restaurants", "active_restaurants", "total_customers", "total_orders",
                  "total_sales", "total_commission", "commission_pct", "daily_sales"]:
            assert k in d, f"missing {k}"
        assert d["total_restaurants"] >= 4
        assert len(d["daily_sales"]) == 7

    def test_restaurants_with_stats(self, super_client):
        r = super_client.get(f"{API}/admin/restaurants", timeout=60)
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 4
        for it in items:
            assert "_id" not in it
            assert "stats" in it
            assert "total_sales" in it["stats"] and "commission_paid" in it["stats"]

    def test_toggle_restaurant_active(self, super_client, anon):
        target = [x for x in super_client.get(f"{API}/admin/restaurants", timeout=60).json()
                  if "Bakers" in x["name"]][0]
        rid = target["id"]
        off = super_client.patch(f"{API}/admin/restaurants/{rid}", json={"active": False}, timeout=30)
        assert off.status_code == 200
        assert off.json()["active"] is False
        public = anon.get(f"{API}/restaurants", timeout=30).json()
        assert rid not in [x["id"] for x in public], "suspended restaurant still public"
        on = super_client.patch(f"{API}/admin/restaurants/{rid}", json={"active": True}, timeout=30)
        assert on.json()["active"] is True
        public2 = anon.get(f"{API}/restaurants", timeout=30).json()
        assert rid in [x["id"] for x in public2]

    def test_restaurant_stats_endpoint(self, super_client):
        rid = super_client.get(f"{API}/admin/restaurants", timeout=60).json()[0]["id"]
        r = super_client.get(f"{API}/admin/restaurants/{rid}/stats", timeout=30)
        assert r.status_code == 200
        assert "total_orders" in r.json()

    def test_customers_list_no_password(self, super_client):
        r = super_client.get(f"{API}/admin/customers", timeout=30)
        assert r.status_code == 200
        users = r.json()
        assert len(users) >= 1
        for u in users:
            assert u["role"] == "customer"
            assert "password_hash" not in u and "_id" not in u

    def test_coupon_crud(self, super_client, customer_client, anon):
        code = f"TESTQA{uuid.uuid4().hex[:4].upper()}"
        r = super_client.post(f"{API}/admin/coupons", json={
            "code": code.lower(), "description": "TEST coupon", "discount_type": "flat",
            "discount_value": 40, "min_order": 100, "usage_limit": 5, "active": True}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        cid = r.json()["id"]
        assert r.json()["code"] == code, "coupon code not uppercased"

        listed = super_client.get(f"{API}/admin/coupons", timeout=30).json()
        assert code in [c["code"] for c in listed]
        assert code in [c["code"] for c in anon.get(f"{API}/offers", timeout=30).json()]

        v = customer_client.post(f"{API}/coupons/validate", params={"code": code, "subtotal": 500}, timeout=30)
        assert v.status_code == 200 and v.json()["discount"] == 40

        assert super_client.delete(f"{API}/admin/coupons/{cid}", timeout=30).status_code == 200
        after = super_client.get(f"{API}/admin/coupons", timeout=30).json()
        assert cid not in [c["id"] for c in after]

    def test_settings_commission_update(self, super_client):
        orig = super_client.get(f"{API}/admin/settings", timeout=30).json()["commission_pct"]
        r = super_client.patch(f"{API}/admin/settings", json={"commission_pct": 12.5}, timeout=30)
        assert r.status_code == 200
        assert r.json()["commission_pct"] == 12.5
        got = super_client.get(f"{API}/admin/settings", timeout=30).json()
        assert got["commission_pct"] == 12.5, "commission not persisted/read back"
        # restore
        super_client.patch(f"{API}/admin/settings", json={"commission_pct": orig}, timeout=30)

    def test_create_restaurant_with_admin(self, super_client, anon):
        name = f"TEST_Rest_{uuid.uuid4().hex[:5]}"
        email = f"test_{uuid.uuid4().hex[:6]}@fudoratest.example.com"
        r = super_client.post(f"{API}/admin/restaurants", json={
            "name": name, "address": "1 TEST Road", "area": "Sasaram", "cuisines": ["Test"],
            "admin_email": email, "admin_password": "Test@2026", "admin_name": "TEST Admin"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        rid = r.json()["id"]
        # admin user created and can login + scoped
        lg = anon.post(f"{API}/auth/login", json={"email": email, "password": "Test@2026"}, timeout=30)
        assert lg.status_code == 200, "created restaurant admin cannot login"
        assert lg.json()["user"]["restaurant_id"] == rid
        tok = lg.json()["token"]
        import requests
        me = requests.get(f"{API}/restaurant/me", headers={"Authorization": f"Bearer {tok}"}, timeout=30)
        assert me.status_code == 200 and me.json()["id"] == rid
        # cleanup
        assert super_client.delete(f"{API}/admin/restaurants/{rid}", timeout=30).status_code == 200
        assert rid not in [x["id"] for x in anon.get(f"{API}/restaurants", timeout=30).json()]


class TestCustomerExtras:
    def test_address_crud(self, customer_client):
        r = customer_client.post(f"{API}/me/addresses", json={
            "label": "TEST Home", "name": "TEST QA", "phone": "9876543210",
            "line1": "5 GT Road", "area": "Sasaram", "city": "Sasaram", "pincode": "821115"}, timeout=30)
        assert r.status_code == 200
        aid = r.json()["id"]
        assert "_id" not in r.json()
        lst = customer_client.get(f"{API}/me/addresses", timeout=30).json()
        assert aid in [a["id"] for a in lst]
        assert customer_client.delete(f"{API}/me/addresses/{aid}", timeout=30).status_code == 200
        lst2 = customer_client.get(f"{API}/me/addresses", timeout=30).json()
        assert aid not in [a["id"] for a in lst2]

    def test_favourite_toggle(self, customer_client, anon):
        rid = anon.get(f"{API}/restaurants", timeout=30).json()[0]["id"]
        # make the test idempotent: clear any pre-existing favourite first
        pre = customer_client.get(f"{API}/me/favourites", timeout=30).json()
        if rid in [x["id"] for x in pre["restaurants"]]:
            customer_client.post(f"{API}/me/favourites/toggle", params={"type": "restaurant", "id": rid}, timeout=30)
        on = customer_client.post(f"{API}/me/favourites/toggle", params={"type": "restaurant", "id": rid}, timeout=30)
        assert on.status_code == 200 and on.json()["favourited"] is True
        favs = customer_client.get(f"{API}/me/favourites", timeout=30).json()
        assert rid in [x["id"] for x in favs["restaurants"]]
        off = customer_client.post(f"{API}/me/favourites/toggle", params={"type": "restaurant", "id": rid}, timeout=30)
        assert off.json()["favourited"] is False
