"""One-off cleanup of QA-created test data (TEST_QA restaurants/products)."""
import requests
from conftest import API, login, SUPER, ROYAL

s = login(SUPER)
r = login(ROYAL)

# delete TEST_QA restaurants
rests = s.get(f"{API}/admin/restaurants", timeout=60).json()
for x in rests:
    if x["name"].startswith("TEST_QA"):
        print("deleting restaurant", x["name"], s.delete(f"{API}/admin/restaurants/{x['id']}", timeout=30).status_code)

# delete TEST_QA products of royal
me = r.get(f"{API}/restaurant/me", timeout=30).json()
prods = requests.get(f"{API}/restaurants/{me['id']}/products", timeout=30).json()
for p in prods:
    if p["name"].startswith("TEST_QA"):
        print("deleting product", p["name"], r.delete(f"{API}/restaurant/products/{p['id']}", timeout=30).status_code)

# ensure commission back to 10
print("commission:", s.patch(f"{API}/admin/settings", json={"commission_pct": 10}, timeout=30).json())
