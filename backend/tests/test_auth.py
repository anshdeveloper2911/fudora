# Auth: login, register, me, logout, cookies, bcrypt, role protection
import uuid
import requests
from conftest import API, SUPER, ROYAL, CUST


class TestAuth:
    def test_login_super_admin_sets_httponly_cookie(self, anon):
        r = anon.post(f"{API}/auth/login", json=SUPER, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["user"]["role"] == "super_admin"
        assert d["user"]["email"] == SUPER["email"]
        assert "password_hash" not in d["user"]
        assert "_id" not in d["user"]
        assert isinstance(d["token"], str) and len(d["token"]) > 20
        set_cookie = r.headers.get("set-cookie", "")
        assert "access_token=" in set_cookie
        assert "HttpOnly" in set_cookie
        assert "Secure" in set_cookie
        assert "samesite=none" in set_cookie.lower()

    def test_login_restaurant_admin_has_restaurant_id(self, anon):
        r = anon.post(f"{API}/auth/login", json=ROYAL, timeout=30)
        assert r.status_code == 200
        u = r.json()["user"]
        assert u["role"] == "restaurant_admin"
        assert u.get("restaurant_id"), "restaurant_admin missing restaurant_id"

    def test_login_customer(self, anon):
        r = anon.post(f"{API}/auth/login", json=CUST, timeout=30)
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "customer"

    def test_login_wrong_password(self, anon):
        r = anon.post(f"{API}/auth/login", json={"email": CUST["email"], "password": "WrongPass1"}, timeout=30)
        assert r.status_code == 401

    def test_login_unknown_email(self, anon):
        r = anon.post(f"{API}/auth/login", json={"email": "nobody@fudora.demo", "password": "x"}, timeout=30)
        assert r.status_code == 401

    def test_login_invalid_email_format_422(self, anon):
        r = anon.post(f"{API}/auth/login", json={"email": "notanemail", "password": "x"}, timeout=30)
        assert r.status_code == 422

    def test_brute_force_lockout_after_5_fails(self, anon):
        email = CUST["email"]
        statuses = []
        for _ in range(6):
            rr = requests.post(f"{API}/auth/login", json={"email": email, "password": "BadPass!1"}, timeout=30)
            statuses.append(rr.status_code)
        assert 429 in statuses or 423 in statuses, (
            f"No brute-force lockout: 6 failed logins returned {statuses}"
        )

    def test_register_and_me_and_logout(self, anon):
        email = f"test_{uuid.uuid4().hex[:8]}@fudoratest.example.com"
        s = requests.Session()
        r = s.post(f"{API}/auth/register", json={
            "name": "TEST Signup", "email": email, "password": "Test@2026", "phone": "9999999999"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["user"]["email"] == email
        assert d["user"]["role"] == "customer"
        token = d["token"]

        me = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"}, timeout=30)
        assert me.status_code == 200
        assert me.json()["email"] == email
        assert "password_hash" not in me.json()

        # cookie based auth
        me_cookie = s.get(f"{API}/auth/me", timeout=30)
        assert me_cookie.status_code == 200, "Cookie-based auth failed"

        dup = requests.post(f"{API}/auth/register", json={
            "name": "dup", "email": email, "password": "Test@2026"}, timeout=30)
        assert dup.status_code == 400

        out = s.post(f"{API}/auth/logout", timeout=30)
        assert out.status_code == 200

    def test_me_requires_auth(self, anon):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401

    def test_bcrypt_hash_format(self):
        import asyncio
        import os
        from motor.motor_asyncio import AsyncIOMotorClient
        from dotenv import dotenv_values
        env = dotenv_values("/app/backend/.env")

        async def _check():
            cl = AsyncIOMotorClient(env["MONGO_URL"])
            u = await cl[env["DB_NAME"]].users.find_one({"email": SUPER["email"]})
            cl.close()
            return u

        u = asyncio.run(_check())
        assert u is not None, "super admin not seeded in DB"
        assert u["password_hash"].startswith("$2b$"), f"hash prefix {u['password_hash'][:4]}"


class TestAuthProtection:
    def test_protected_endpoints_reject_anonymous(self):
        for path in ["/orders/mine", "/admin/dashboard", "/restaurant/orders",
                     "/me/addresses", "/me/favourites", "/restaurant/me",
                     "/admin/orders", "/admin/customers", "/admin/settings"]:
            r = requests.get(f"{API}{path}", timeout=30)
            assert r.status_code == 401, f"{path} returned {r.status_code}"

    def test_customer_rejected_on_admin_endpoints(self, customer_client):
        for path in ["/admin/dashboard", "/admin/restaurants", "/admin/orders",
                     "/admin/customers", "/restaurant/orders", "/restaurant/me"]:
            r = customer_client.get(f"{API}{path}", timeout=30)
            assert r.status_code == 403, f"{path} returned {r.status_code} for customer"

    def test_restaurant_admin_rejected_on_super_admin_endpoints(self, royal_client):
        for path in ["/admin/restaurants", "/admin/dashboard", "/admin/orders", "/admin/customers"]:
            r = royal_client.get(f"{API}{path}", timeout=30)
            assert r.status_code == 403, f"{path} returned {r.status_code} for restaurant_admin"

    def test_super_admin_rejected_on_restaurant_endpoints(self, super_client):
        r = super_client.get(f"{API}/restaurant/orders", timeout=30)
        assert r.status_code == 403, f"got {r.status_code}"

    def test_invalid_token_rejected(self):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer garbage.token.here"}, timeout=30)
        assert r.status_code == 401
