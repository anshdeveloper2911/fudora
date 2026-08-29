import os
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = BASE_URL + "/api"

SUPER = {"email": "fudoraofficial05@gmail.com", "password": "Fudora@2026"}
ROYAL = {"email": "royal@fudora.demo", "password": "Restaurant@2026"}
SPICE = {"email": "spice@fudora.demo", "password": "Restaurant@2026"}
CUST = {"email": "customer@fudora.demo", "password": "Customer@2026"}


def login(creds):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json=creds, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"Login failed for {creds['email']}: {r.status_code} {r.text[:300]}")
    token = r.json().get("token")
    if not token:
        pytest.fail(f"No token in login response for {creds['email']}")
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="session")
def anon():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def super_client():
    return login(SUPER)


@pytest.fixture(scope="session")
def royal_client():
    return login(ROYAL)


@pytest.fixture(scope="session")
def spice_client():
    return login(SPICE)


@pytest.fixture(scope="session")
def customer_client():
    return login(CUST)
