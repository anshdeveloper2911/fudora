from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt as pyjwt
import requests as pyrequests
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, Response, Query, Header
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"
APP_NAME = os.environ.get('APP_NAME', 'fudora')
COMMISSION_PCT = float(os.environ.get('FUDORA_COMMISSION_PCT', '10'))
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
STORAGE_BASE = (os.environ.get('INTEGRATION_PROXY_URL') or '').strip() or 'https://integrations.emergentagent.com'
STORAGE_URL = STORAGE_BASE.rstrip('/') + '/objstore/api/v1/storage'

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Fudora API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
log = logging.getLogger("fudora")

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def today_range():
    now = datetime.now(timezone.utc)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return start.isoformat(), now.isoformat()

def month_range():
    now = datetime.now(timezone.utc)
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return start.isoformat(), now.isoformat()

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_access_token(user_id: str, role: str) -> str:
    payload = {"sub": user_id, "role": role, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def clean(doc):
    if not doc:
        return doc
    doc = dict(doc)
    doc.pop('_id', None)
    doc.pop('password_hash', None)
    return doc

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(401, "User not found")
    return clean(user)

def require_role(*roles):
    async def dep(user: dict = Depends(get_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(403, "Forbidden")
        return user
    return dep

# -----------------------------------------------------------------------------
# Object Storage
# -----------------------------------------------------------------------------
storage_key = None

def init_storage(force=False):
    global storage_key
    if storage_key and not force:
        return storage_key
    r = pyrequests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
    r.raise_for_status()
    storage_key = r.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    r = pyrequests.put(f"{STORAGE_URL}/objects/{path}",
                     headers={"X-Storage-Key": key, "Content-Type": content_type},
                     data=data, timeout=120)
    if r.status_code == 404:
        key = init_storage(force=True)
        r = pyrequests.put(f"{STORAGE_URL}/objects/{path}",
                         headers={"X-Storage-Key": key, "Content-Type": content_type},
                         data=data, timeout=120)
    r.raise_for_status()
    return r.json()

def get_object(path: str):
    key = init_storage()
    r = pyrequests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if r.status_code == 404:
        key = init_storage(force=True)
        r = pyrequests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    r.raise_for_status()
    return r.content, r.headers.get("Content-Type", "application/octet-stream")

MIME_ALLOWED = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MIME_TO_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/jpg": "jpg"}

# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------
class SignupIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    referral_code: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class AddressIn(BaseModel):
    label: str = "Home"
    name: str
    phone: str
    line1: str
    area: str
    city: str = "Sasaram"
    pincode: str
    landmark: Optional[str] = ""

class RestaurantIn(BaseModel):
    name: str
    tagline: Optional[str] = ""
    cuisines: List[str] = []
    address: str
    area: str = "Sasaram"
    city: str = "Sasaram"
    pincode: Optional[str] = ""
    phone: Optional[str] = ""
    logo_url: Optional[str] = ""
    cover_url: Optional[str] = ""
    delivery_time_mins: int = 30
    delivery_fee: float = 25.0
    min_order: float = 99.0
    opening_time: str = "09:00"
    closing_time: str = "23:00"
    is_veg_only: bool = False
    active: bool = True
    admin_email: Optional[EmailStr] = None
    admin_password: Optional[str] = None
    admin_name: Optional[str] = None
    is_demo: bool = False

class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    cuisines: Optional[List[str]] = None
    address: Optional[str] = None
    area: Optional[str] = None
    logo_url: Optional[str] = None
    cover_url: Optional[str] = None
    delivery_time_mins: Optional[int] = None
    delivery_fee: Optional[float] = None
    min_order: Optional[float] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    active: Optional[bool] = None

class CategoryIn(BaseModel):
    name: str

class ProductIn(BaseModel):
    name: str
    description: Optional[str] = ""
    price: float
    discount_price: Optional[float] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = ""
    image_url: Optional[str] = ""
    is_veg: bool = True
    is_bestseller: bool = False
    is_recommended: bool = False
    available: bool = True
    prep_time_mins: int = 20

class OrderItemIn(BaseModel):
    product_id: str
    quantity: int

class OrderIn(BaseModel):
    restaurant_id: str
    items: List[OrderItemIn]
    address: AddressIn
    coupon_code: Optional[str] = None
    payment_method: Literal["cod", "online"] = "cod"
    notes: Optional[str] = ""

class OrderStatusIn(BaseModel):
    status: Literal["accepted", "preparing", "ready", "out_for_delivery", "completed", "rejected", "cancelled"]

class ReviewIn(BaseModel):
    order_id: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = ""

class CouponIn(BaseModel):
    code: str
    description: str = ""
    discount_type: Literal["flat", "percent"] = "percent"
    discount_value: float
    min_order: float = 0
    max_discount: Optional[float] = None
    usage_limit: int = 1000
    expires_at: Optional[str] = None
    active: bool = True

class SettingsIn(BaseModel):
    commission_pct: Optional[float] = None

class PlatformCategoryIn(BaseModel):
    name: str
    image_url: Optional[str] = ""
    display_order: int = 0
    active: bool = True

class PlatformCategoryUpdate(BaseModel):
    name: Optional[str] = None
    image_url: Optional[str] = None
    display_order: Optional[int] = None
    active: Optional[bool] = None

class SiteConfigIn(BaseModel):
    announcement: Optional[dict] = None
    branding: Optional[dict] = None
    hero: Optional[dict] = None
    offers_section: Optional[dict] = None
    popular_section: Optional[dict] = None
    restaurants_section: Optional[dict] = None
    footer: Optional[dict] = None

# -----------------------------------------------------------------------------
# Auth Endpoints
# -----------------------------------------------------------------------------
def set_auth_cookie(response: Response, token: str):
    response.set_cookie(key="access_token", value=token, httponly=True,
                        secure=True, samesite="none", max_age=7 * 24 * 3600, path="/")

def gen_referral_code(name: str) -> str:
    prefix = "".join(c for c in (name or "FUD").upper() if c.isalpha())[:4] or "FUD"
    return f"{prefix}-{uuid.uuid4().hex[:5].upper()}"

async def issue_referral_coupons(new_user: dict, referrer: dict):
    """Give new user ₹100 off, give referrer free-delivery coupon. Personal, one-time."""
    now = now_iso()
    welcome = {
        "id": str(uuid.uuid4()),
        "code": f"WELCOME{uuid.uuid4().hex[:5].upper()}",
        "description": "Welcome to Fudora — ₹100 off your first order",
        "discount_type": "flat", "discount_value": 100.0,
        "min_order": 199.0, "max_discount": 100.0,
        "usage_limit": 1, "used_count": 0, "active": True,
        "user_id": new_user["id"], "personal": True,
        "created_at": now,
    }
    friend = {
        "id": str(uuid.uuid4()),
        "code": f"FRIEND{uuid.uuid4().hex[:5].upper()}",
        "description": f"Thanks for referring {new_user['name'].split()[0]} — free delivery on your next order",
        "discount_type": "flat", "discount_value": 25.0,
        "min_order": 149.0, "max_discount": 25.0,
        "usage_limit": 1, "used_count": 0, "active": True,
        "user_id": referrer["id"], "personal": True,
        "created_at": now,
    }
    await db.coupons.insert_many([welcome, friend])
    await db.users.update_one({"id": referrer["id"]}, {"$inc": {"referral_count": 1}})

@api.post("/auth/register")
async def register(payload: SignupIn, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    referrer = None
    if payload.referral_code:
        code = payload.referral_code.strip().upper()
        referrer = await db.users.find_one({"referral_code": code})
        if not referrer:
            raise HTTPException(400, "Invalid referral code")
    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name,
        "phone": payload.phone or "",
        "role": "customer",
        "referral_code": gen_referral_code(payload.name),
        "referral_count": 0,
        "referred_by": referrer["id"] if referrer else None,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    if referrer:
        await issue_referral_coupons(user, referrer)
    token = create_access_token(user["id"], "customer")
    set_auth_cookie(response, token)
    return {"user": clean(user), "token": token}

@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    token = create_access_token(user["id"], user["role"])
    set_auth_cookie(response, token)
    return {"user": clean(user), "token": token}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

# -----------------------------------------------------------------------------
# Upload endpoint
# -----------------------------------------------------------------------------
@api.post("/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if user["role"] not in ("restaurant_admin", "super_admin"):
        raise HTTPException(403, "Forbidden")
    ct = (file.content_type or "").lower()
    if ct not in MIME_ALLOWED:
        raise HTTPException(400, "Only JPG, PNG, WebP images allowed")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(400, "Max file size is 5MB")
    ext = MIME_TO_EXT.get(ct, "jpg")
    path = f"{APP_NAME}/uploads/{user['id']}/{uuid.uuid4()}.{ext}"
    result = put_object(path, data, ct)
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "content_type": ct,
        "size": result.get("size", len(data)),
        "owner_id": user["id"],
        "created_at": now_iso(),
    })
    url = f"/api/files/{result['path']}"
    return {"path": result["path"], "url": url}

@api.get("/files/{path:path}")
async def download_file(path: str):
    try:
        data, ct = get_object(path)
    except Exception:
        raise HTTPException(404, "File not found")
    return Response(content=data, media_type=ct, headers={"Cache-Control": "public, max-age=86400"})

# -----------------------------------------------------------------------------
# Public: restaurants, categories, products, offers
# -----------------------------------------------------------------------------
@api.get("/restaurants")
async def list_restaurants(q: Optional[str] = None, cuisine: Optional[str] = None,
                            veg: Optional[bool] = None):
    query = {"active": True}
    if q:
        query["$or"] = [{"name": {"$regex": q, "$options": "i"}},
                        {"cuisines": {"$regex": q, "$options": "i"}}]
    if cuisine:
        query["cuisines"] = {"$regex": cuisine, "$options": "i"}
    if veg is True:
        query["is_veg_only"] = True
    items = await db.restaurants.find(query, {"_id": 0}).to_list(500)
    return items

@api.get("/restaurants/{rid}")
async def get_restaurant(rid: str):
    r = await db.restaurants.find_one({"id": rid}, {"_id": 0})
    if not r:
        raise HTTPException(404, "Restaurant not found")
    return r

@api.get("/restaurants/{rid}/categories")
async def get_categories(rid: str):
    return await db.categories.find({"restaurant_id": rid}, {"_id": 0}).to_list(500)

@api.get("/restaurants/{rid}/products")
async def get_products(rid: str):
    return await db.products.find({"restaurant_id": rid}, {"_id": 0}).to_list(1000)

@api.get("/restaurants/{rid}/reviews")
async def get_reviews(rid: str):
    return await db.reviews.find({"restaurant_id": rid}, {"_id": 0}).sort("created_at", -1).to_list(200)

@api.get("/search")
async def global_search(q: str = ""):
    if not q or len(q) < 1:
        return {"restaurants": [], "products": []}
    rests = await db.restaurants.find(
        {"active": True, "$or": [{"name": {"$regex": q, "$options": "i"}},
                                  {"cuisines": {"$regex": q, "$options": "i"}}]},
        {"_id": 0}
    ).to_list(50)
    prods = await db.products.find(
        {"available": True, "$or": [{"name": {"$regex": q, "$options": "i"}},
                                     {"description": {"$regex": q, "$options": "i"}},
                                     {"category_name": {"$regex": q, "$options": "i"}}]},
        {"_id": 0}
    ).to_list(50)
    return {"restaurants": rests, "products": prods}

@api.get("/offers")
async def list_offers():
    return await db.coupons.find({"active": True, "personal": {"$ne": True}}, {"_id": 0}).to_list(200)

@api.get("/banners")
async def list_banners():
    return await db.banners.find({"active": True}, {"_id": 0}).to_list(50)

# -----------------------------------------------------------------------------
# Platform Categories (public read; super admin CRUD)
# -----------------------------------------------------------------------------
@api.get("/platform-categories")
async def list_platform_categories():
    return await db.platform_categories.find({"active": True}, {"_id": 0}).sort("display_order", 1).to_list(200)

@api.get("/admin/platform-categories")
async def list_all_platform_categories(user: dict = Depends(require_role("super_admin"))):
    return await db.platform_categories.find({}, {"_id": 0}).sort("display_order", 1).to_list(500)

@api.post("/admin/platform-categories")
async def create_platform_category(payload: PlatformCategoryIn, user: dict = Depends(require_role("super_admin"))):
    doc = payload.model_dump()
    doc.update({"id": str(uuid.uuid4()), "created_at": now_iso()})
    await db.platform_categories.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.patch("/admin/platform-categories/{cid}")
async def update_platform_category(cid: str, payload: PlatformCategoryUpdate, user: dict = Depends(require_role("super_admin"))):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        await db.platform_categories.update_one({"id": cid}, {"$set": updates})
    return await db.platform_categories.find_one({"id": cid}, {"_id": 0})

@api.delete("/admin/platform-categories/{cid}")
async def delete_platform_category(cid: str, user: dict = Depends(require_role("super_admin"))):
    await db.platform_categories.delete_one({"id": cid})
    return {"ok": True}

# -----------------------------------------------------------------------------
# Site Configuration (CMS) — public read, super admin write
# -----------------------------------------------------------------------------
DEFAULT_SITE_CONFIG = {
    "id": "main",
    "announcement": {
        "enabled": True,
        "text": "🎉 Free delivery on your first order — use code FUDORA50 at checkout",
        "bg": "#4A0E2E",
        "fg": "#F59E0B",
    },
    "branding": {
        "name": "Fudora",
        "tagline": "Your Food. Your Way.",
        "primary_color": "#4A0E2E",
        "accent_color": "#F59E0B",
    },
    "hero": {
        "enabled": True,
        "badge_text": "Now delivering in Sasaram",
        "heading_line1": "Delicious food,",
        "heading_line2": "delivered to your door.",
        "subheading": "Discover the best restaurants and order your favourite food in Sasaram — in under 30 minutes.",
        "image_url": "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=900&q=80",
        "cta_text": "Explore Restaurants",
        "cta_link": "/restaurants",
    },
    "offers_section": {"enabled": True, "title": "Best offers for you"},
    "popular_section": {"enabled": True, "title": "Popular near you", "product_ids": [], "limit": 8},
    "restaurants_section": {"enabled": True, "title": "All restaurants near you"},
    "footer": {
        "description": "Fudora is the fastest-growing food-delivery platform in Sasaram, connecting hungry customers with the best local restaurants.",
        "phone": "+91 99000 00000",
        "email": "hello@fudora.app",
        "address": "GT Road, Sasaram, Bihar 821115",
        "socials": {"instagram": "#", "facebook": "#", "twitter": "#", "youtube": "#", "whatsapp": "#"},
        "columns": [
            {"title": "Fudora", "links": [
                {"label": "About Fudora", "url": "/about"},
                {"label": "Careers", "url": "/about"},
                {"label": "Contact Us", "url": "/help"},
                {"label": "Partner With Us", "url": "/admin/login"},
                {"label": "Fudora for Business", "url": "/about"},
            ]},
            {"title": "Explore", "links": [
                {"label": "Restaurants", "url": "/restaurants"},
                {"label": "Popular Cuisines", "url": "/restaurants"},
                {"label": "Offers", "url": "/offers"},
                {"label": "Food Delivery", "url": "/"},
            ]},
            {"title": "Help", "links": [
                {"label": "Help & Support", "url": "/help"},
                {"label": "FAQ", "url": "/help"},
                {"label": "Terms & Conditions", "url": "/terms"},
                {"label": "Privacy Policy", "url": "/privacy"},
                {"label": "Refund Policy", "url": "/help"},
                {"label": "Cancellation Policy", "url": "/help"},
            ]},
            {"title": "For Restaurants", "links": [
                {"label": "Register Your Restaurant", "url": "/admin/login"},
                {"label": "Restaurant Partner Login", "url": "/admin/login"},
                {"label": "Restaurant Dashboard", "url": "/admin/login"},
                {"label": "Partner Support", "url": "/help"},
            ]},
            {"title": "For Delivery Partners", "links": [
                {"label": "Become a Delivery Partner", "url": "/help"},
                {"label": "Delivery Partner Login", "url": "/admin/login"},
                {"label": "Partner Support", "url": "/help"},
            ]},
        ],
        "copyright": "© 2026 Fudora Technologies Pvt Ltd. All rights reserved.",
    },
}

def merge_config(existing: dict) -> dict:
    """Deep-merge existing config over defaults so new fields don't break older stored configs."""
    import copy
    out = copy.deepcopy(DEFAULT_SITE_CONFIG)
    for k, v in (existing or {}).items():
        if k in ("_id", "id"): continue
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k].update({kk: vv for kk, vv in v.items() if vv is not None})
        elif v is not None:
            out[k] = v
    return out

@api.get("/site-config")
async def get_site_config():
    doc = await db.site_config.find_one({"id": "main"}, {"_id": 0}) or {}
    return merge_config(doc)

@api.patch("/admin/site-config")
async def update_site_config(payload: SiteConfigIn, user: dict = Depends(require_role("super_admin"))):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        await db.site_config.update_one({"id": "main"}, {"$set": updates}, upsert=True)
    doc = await db.site_config.find_one({"id": "main"}, {"_id": 0}) or {}
    return merge_config(doc)

# -----------------------------------------------------------------------------
# Popular products (homepage section)
# -----------------------------------------------------------------------------
@api.get("/popular-products")
async def popular_products():
    cfg = await db.site_config.find_one({"id": "main"}, {"_id": 0}) or {}
    ps = (cfg.get("popular_section") or {})
    limit = int(ps.get("limit") or 8)
    ids = ps.get("product_ids") or []
    if ids:
        products = await db.products.find({"id": {"$in": ids}, "available": True}, {"_id": 0}).to_list(limit * 2)
        # preserve requested order
        pmap = {p["id"]: p for p in products}
        products = [pmap[i] for i in ids if i in pmap][:limit]
    else:
        products = await db.products.find(
            {"is_bestseller": True, "available": True}, {"_id": 0}
        ).limit(limit).to_list(limit)
        if len(products) < limit:
            more = await db.products.find(
                {"available": True, "id": {"$nin": [p["id"] for p in products]}},
                {"_id": 0}
            ).limit(limit - len(products)).to_list(limit)
            products += more
    # attach restaurant name + delivery
    rest_ids = list({p["restaurant_id"] for p in products})
    rests = await db.restaurants.find({"id": {"$in": rest_ids}}, {"_id": 0}).to_list(200)
    rmap = {r["id"]: r for r in rests}
    for p in products:
        r = rmap.get(p["restaurant_id"], {})
        p["restaurant"] = {
            "id": r.get("id"), "name": r.get("name"), "logo_url": r.get("logo_url"),
            "delivery_fee": r.get("delivery_fee"), "min_order": r.get("min_order"),
            "delivery_time_mins": r.get("delivery_time_mins"),
            "active": r.get("active", True),
        }
    return products

# -----------------------------------------------------------------------------
# Geocoding (reverse) — proxies OpenStreetMap Nominatim
# -----------------------------------------------------------------------------
@api.get("/geocode/reverse")
async def reverse_geocode(lat: float = Query(...), lng: float = Query(...)):
    # Try Photon (Komoot) first — better rate limits than Nominatim
    try:
        r = pyrequests.get(
            "https://photon.komoot.io/reverse",
            params={"lat": lat, "lon": lng, "lang": "en"},
            headers={"User-Agent": "Fudora/1.0"},
            timeout=8,
        )
        r.raise_for_status()
        j = r.json()
        feats = j.get("features", [])
        if feats:
            p = feats[0].get("properties", {})
            return {
                "lat": lat, "lng": lng,
                "formatted": ", ".join(x for x in [p.get("name"), p.get("city") or p.get("county"), p.get("state"), p.get("country")] if x),
                "area": p.get("name") or p.get("district") or p.get("locality") or p.get("suburb") or "",
                "city": p.get("city") or p.get("county") or p.get("town") or p.get("village") or "",
                "state": p.get("state") or "",
                "country": p.get("country") or "",
                "pincode": p.get("postcode") or "",
            }
    except Exception as e:
        log.warning(f"photon reverse failed: {e}")
    # Fallback: Nominatim
    try:
        r = pyrequests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"lat": lat, "lon": lng, "format": "jsonv2", "addressdetails": 1, "zoom": 16},
            headers={"User-Agent": "Fudora/1.0 (contact@fudora.app)", "Accept-Language": "en"},
            timeout=8,
        )
        r.raise_for_status()
        j = r.json()
        a = j.get("address", {})
        return {
            "lat": lat, "lng": lng,
            "formatted": j.get("display_name", ""),
            "area": a.get("suburb") or a.get("neighbourhood") or a.get("village") or a.get("town") or a.get("city_district") or a.get("hamlet") or "",
            "city": a.get("city") or a.get("town") or a.get("village") or a.get("municipality") or a.get("state_district") or "",
            "state": a.get("state") or "",
            "country": a.get("country") or "",
            "pincode": a.get("postcode") or "",
        }
    except Exception as e:
        log.warning(f"nominatim reverse failed: {e}")
    raise HTTPException(400, "Unable to detect your location. Please try again or select manually.")

@api.get("/geocode/search")
async def geocode_search(q: str = Query(..., min_length=2)):
    # Try Photon first
    try:
        r = pyrequests.get(
            "https://photon.komoot.io/api/",
            params={"q": q, "limit": 6, "lang": "en"},
            headers={"User-Agent": "Fudora/1.0"},
            timeout=8,
        )
        r.raise_for_status()
        out = []
        for feat in r.json().get("features", []):
            p = feat.get("properties", {})
            coords = feat.get("geometry", {}).get("coordinates", [None, None])
            out.append({
                "lat": coords[1], "lng": coords[0],
                "formatted": ", ".join(x for x in [p.get("name"), p.get("city") or p.get("county"), p.get("state"), p.get("country")] if x),
                "area": p.get("name") or p.get("district") or p.get("locality") or "",
                "city": p.get("city") or p.get("county") or p.get("town") or p.get("village") or "",
                "state": p.get("state") or "",
                "pincode": p.get("postcode") or "",
            })
        if out: return out
    except Exception as e:
        log.warning(f"photon search failed: {e}")
    # Fallback: Nominatim
    try:
        r = pyrequests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": q, "format": "jsonv2", "addressdetails": 1, "limit": 6, "countrycodes": "in"},
            headers={"User-Agent": "Fudora/1.0 (contact@fudora.app)", "Accept-Language": "en"},
            timeout=8,
        )
        r.raise_for_status()
        out = []
        for j in r.json():
            a = j.get("address", {})
            out.append({
                "lat": float(j["lat"]), "lng": float(j["lon"]),
                "formatted": j.get("display_name", ""),
                "area": a.get("suburb") or a.get("neighbourhood") or a.get("village") or a.get("town") or "",
                "city": a.get("city") or a.get("town") or a.get("village") or a.get("municipality") or "",
                "state": a.get("state") or "",
                "pincode": a.get("postcode") or "",
            })
        return out
    except Exception as e:
        log.warning(f"nominatim search failed: {e}")
        return []

# -----------------------------------------------------------------------------
# Customer: addresses, favourites, orders
# -----------------------------------------------------------------------------
@api.get("/me/addresses")
async def list_addresses(user: dict = Depends(get_current_user)):
    return await db.addresses.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)

@api.post("/me/addresses")
async def add_address(payload: AddressIn, user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    doc.update({"id": str(uuid.uuid4()), "user_id": user["id"], "created_at": now_iso()})
    await db.addresses.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.delete("/me/addresses/{aid}")
async def del_address(aid: str, user: dict = Depends(get_current_user)):
    await db.addresses.delete_one({"id": aid, "user_id": user["id"]})
    return {"ok": True}

@api.get("/me/favourites")
async def get_favourites(user: dict = Depends(get_current_user)):
    favs = await db.favourites.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    r_ids = [f["restaurant_id"] for f in favs if f.get("type") == "restaurant"]
    p_ids = [f["product_id"] for f in favs if f.get("type") == "product"]
    restaurants = await db.restaurants.find({"id": {"$in": r_ids}}, {"_id": 0}).to_list(200)
    products = await db.products.find({"id": {"$in": p_ids}}, {"_id": 0}).to_list(200)
    return {"restaurants": restaurants, "products": products}

@api.post("/me/favourites/toggle")
async def toggle_favourite(type: str, id: str, user: dict = Depends(get_current_user)):
    key = {"user_id": user["id"], "type": type,
           "restaurant_id" if type == "restaurant" else "product_id": id}
    existing = await db.favourites.find_one(key)
    if existing:
        await db.favourites.delete_one({"_id": existing["_id"]})
        return {"favourited": False}
    doc = dict(key); doc["created_at"] = now_iso(); doc["id"] = str(uuid.uuid4())
    await db.favourites.insert_one(doc)
    return {"favourited": True}

# -----------------------------------------------------------------------------
# Orders
# -----------------------------------------------------------------------------
def gen_order_id() -> str:
    return f"FUD{datetime.now(timezone.utc).strftime('%y%m%d')}{str(uuid.uuid4())[:5].upper()}"

async def validate_coupon(code: str, subtotal: float, user_id: Optional[str] = None) -> dict:
    if not code or not code.strip():
        raise HTTPException(400, "Please enter a coupon code")
    c = await db.coupons.find_one({"code": code.strip().upper(), "active": True})
    if not c:
        raise HTTPException(400, "Invalid coupon")
    if c.get("user_id") and c["user_id"] != user_id:
        raise HTTPException(400, "This coupon is not available for your account")
    if c.get("used_count", 0) >= c.get("usage_limit", 999999):
        raise HTTPException(400, "Coupon already used")
    if c.get("expires_at"):
        try:
            if datetime.fromisoformat(c["expires_at"]) < datetime.now(timezone.utc):
                raise HTTPException(400, "Coupon expired")
        except ValueError:
            pass
    if subtotal < c.get("min_order", 0):
        raise HTTPException(400, f"Minimum order ₹{c['min_order']} required")
    if c["discount_type"] == "flat":
        discount = c["discount_value"]
    else:
        discount = subtotal * (c["discount_value"] / 100.0)
        if c.get("max_discount"):
            discount = min(discount, c["max_discount"])
    return {"discount": round(discount, 2), "coupon": clean(c)}

@api.post("/orders")
async def place_order(payload: OrderIn, user: dict = Depends(get_current_user)):
    if user["role"] != "customer":
        raise HTTPException(403, "Only customers can place orders")
    rest = await db.restaurants.find_one({"id": payload.restaurant_id})
    if not rest or not rest.get("active"):
        raise HTTPException(400, "Restaurant unavailable")
    if not payload.items:
        raise HTTPException(400, "Cart is empty")

    product_ids = [i.product_id for i in payload.items]
    products = await db.products.find({"id": {"$in": product_ids}, "restaurant_id": payload.restaurant_id}).to_list(500)
    prod_map = {p["id"]: p for p in products}
    if len(prod_map) != len(set(product_ids)):
        raise HTTPException(400, "Some items are unavailable")

    order_items = []
    subtotal = 0.0
    for it in payload.items:
        p = prod_map[it.product_id]
        if not p.get("available", True):
            raise HTTPException(400, f"{p['name']} is currently unavailable")
        unit = p.get("discount_price") or p["price"]
        line = unit * it.quantity
        subtotal += line
        order_items.append({
            "product_id": p["id"], "name": p["name"], "image_url": p.get("image_url", ""),
            "unit_price": unit, "quantity": it.quantity, "line_total": round(line, 2),
            "is_veg": p.get("is_veg", True),
        })

    if subtotal < rest.get("min_order", 0):
        raise HTTPException(400, f"Minimum order ₹{rest['min_order']} required")

    coupon_res = {"discount": 0, "coupon": None}
    if payload.coupon_code and payload.coupon_code.strip():
        coupon_res = await validate_coupon(payload.coupon_code, subtotal, user["id"])
    discount = coupon_res["discount"]
    delivery_fee = rest.get("delivery_fee", 25.0)
    tax = round((subtotal - discount) * 0.05, 2)
    total = round(subtotal - discount + delivery_fee + tax, 2)
    commission = round(subtotal * (COMMISSION_PCT / 100.0), 2)

    order = {
        "id": gen_order_id(),
        "customer_id": user["id"],
        "customer_name": user["name"],
        "customer_phone": user.get("phone", ""),
        "restaurant_id": rest["id"],
        "restaurant_name": rest["name"],
        "items": order_items,
        "subtotal": round(subtotal, 2),
        "discount": discount,
        "coupon_code": (payload.coupon_code or "").upper() if payload.coupon_code else "",
        "delivery_fee": delivery_fee,
        "tax": tax,
        "total": total,
        "commission_pct": COMMISSION_PCT,
        "commission_amount": commission,
        "restaurant_earning": round(subtotal - commission, 2),
        "payment_method": payload.payment_method,
        "payment_status": "pending" if payload.payment_method == "online" else "cod_pending",
        "status": "pending",
        "address": payload.address.model_dump(),
        "notes": payload.notes or "",
        "created_at": now_iso(),
        "status_history": [{"status": "pending", "at": now_iso()}],
    }
    await db.orders.insert_one(order)
    # Mark coupon usage
    if payload.coupon_code and coupon_res.get("coupon"):
        cc = coupon_res["coupon"]
        upd = {"$inc": {"used_count": 1}}
        if cc.get("personal"):
            upd["$set"] = {"active": False}
        await db.coupons.update_one({"code": cc["code"]}, upd)
    order.pop("_id", None)
    return order

@api.get("/orders/mine")
async def my_orders(user: dict = Depends(get_current_user)):
    return await db.orders.find({"customer_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)

@api.get("/orders/{oid}")
async def get_order(oid: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": oid}, {"_id": 0})
    if not order:
        raise HTTPException(404, "Order not found")
    if user["role"] == "customer" and order["customer_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    if user["role"] == "restaurant_admin" and order["restaurant_id"] != user.get("restaurant_id"):
        raise HTTPException(403, "Forbidden")
    return order

# Restaurant admin — orders
@api.get("/restaurant/orders")
async def restaurant_orders(user: dict = Depends(require_role("restaurant_admin"))):
    return await db.orders.find({"restaurant_id": user["restaurant_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api.patch("/orders/{oid}/status")
async def update_status(oid: str, payload: OrderStatusIn, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": oid})
    if not order:
        raise HTTPException(404, "Order not found")
    if user["role"] == "restaurant_admin" and order["restaurant_id"] != user.get("restaurant_id"):
        raise HTTPException(403, "Forbidden")
    if user["role"] == "customer":
        if order["customer_id"] != user["id"] or payload.status != "cancelled" or order["status"] != "pending":
            raise HTTPException(403, "Forbidden")
    if user["role"] not in ("restaurant_admin", "super_admin", "customer"):
        raise HTTPException(403, "Forbidden")
    entry = {"status": payload.status, "at": now_iso()}
    await db.orders.update_one({"id": oid}, {"$set": {"status": payload.status},
                                             "$push": {"status_history": entry}})
    if payload.status == "completed":
        await db.orders.update_one({"id": oid}, {"$set": {"payment_status": "paid" if order["payment_method"] == "cod" else order["payment_status"]}})
    return await db.orders.find_one({"id": oid}, {"_id": 0})

# -----------------------------------------------------------------------------
# Reviews
# -----------------------------------------------------------------------------
@api.post("/reviews")
async def create_review(payload: ReviewIn, user: dict = Depends(get_current_user)):
    if user["role"] != "customer":
        raise HTTPException(403, "Only customers")
    order = await db.orders.find_one({"id": payload.order_id, "customer_id": user["id"]})
    if not order:
        raise HTTPException(404, "Order not found")
    if order["status"] != "completed":
        raise HTTPException(400, "Can review only completed orders")
    if await db.reviews.find_one({"order_id": payload.order_id}):
        raise HTTPException(400, "Already reviewed")
    review = {
        "id": str(uuid.uuid4()),
        "order_id": payload.order_id,
        "restaurant_id": order["restaurant_id"],
        "customer_id": user["id"],
        "customer_name": user["name"],
        "rating": payload.rating,
        "comment": payload.comment or "",
        "created_at": now_iso(),
    }
    await db.reviews.insert_one(review)
    # Recalculate restaurant rating
    reviews = await db.reviews.find({"restaurant_id": order["restaurant_id"]}).to_list(2000)
    avg = round(sum(r["rating"] for r in reviews) / max(len(reviews), 1), 1)
    await db.restaurants.update_one({"id": order["restaurant_id"]},
                                    {"$set": {"rating": avg, "review_count": len(reviews)}})
    review.pop("_id", None)
    return review

# -----------------------------------------------------------------------------
# Coupons
# -----------------------------------------------------------------------------
@api.post("/coupons/validate")
async def validate_coupon_endpoint(code: str, subtotal: float, user: dict = Depends(get_current_user)):
    return await validate_coupon(code, subtotal, user["id"])

@api.get("/me/coupons")
async def my_coupons(user: dict = Depends(get_current_user)):
    return await db.coupons.find(
        {"user_id": user["id"], "active": True},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)

@api.get("/me/referral")
async def my_referral(user: dict = Depends(get_current_user)):
    # Ensure existing users have a referral code (migration for pre-referral accounts)
    if not user.get("referral_code"):
        code = gen_referral_code(user.get("name", "FUD"))
        await db.users.update_one({"id": user["id"]}, {"$set": {"referral_code": code, "referral_count": user.get("referral_count", 0)}})
        user["referral_code"] = code
    return {
        "referral_code": user["referral_code"],
        "referral_count": user.get("referral_count", 0),
    }

# -----------------------------------------------------------------------------
# Restaurant Admin: products & categories
# -----------------------------------------------------------------------------
@api.get("/restaurant/me")
async def my_restaurant(user: dict = Depends(require_role("restaurant_admin"))):
    r = await db.restaurants.find_one({"id": user["restaurant_id"]}, {"_id": 0})
    return r

@api.patch("/restaurant/me")
async def update_my_restaurant(payload: RestaurantUpdate, user: dict = Depends(require_role("restaurant_admin"))):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        await db.restaurants.update_one({"id": user["restaurant_id"]}, {"$set": updates})
    return await db.restaurants.find_one({"id": user["restaurant_id"]}, {"_id": 0})

@api.post("/restaurant/categories")
async def create_category(payload: CategoryIn, user: dict = Depends(require_role("restaurant_admin"))):
    doc = {"id": str(uuid.uuid4()), "restaurant_id": user["restaurant_id"], "name": payload.name, "created_at": now_iso()}
    await db.categories.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.delete("/restaurant/categories/{cid}")
async def del_category(cid: str, user: dict = Depends(require_role("restaurant_admin"))):
    await db.categories.delete_one({"id": cid, "restaurant_id": user["restaurant_id"]})
    return {"ok": True}

@api.post("/restaurant/products")
async def create_product(payload: ProductIn, user: dict = Depends(require_role("restaurant_admin"))):
    doc = payload.model_dump()
    doc.update({"id": str(uuid.uuid4()), "restaurant_id": user["restaurant_id"], "created_at": now_iso()})
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.patch("/restaurant/products/{pid}")
async def update_product(pid: str, payload: ProductIn, user: dict = Depends(require_role("restaurant_admin"))):
    existing = await db.products.find_one({"id": pid, "restaurant_id": user["restaurant_id"]})
    if not existing:
        raise HTTPException(404, "Not found")
    await db.products.update_one({"id": pid}, {"$set": payload.model_dump()})
    return await db.products.find_one({"id": pid}, {"_id": 0})

@api.delete("/restaurant/products/{pid}")
async def del_product(pid: str, user: dict = Depends(require_role("restaurant_admin"))):
    await db.products.delete_one({"id": pid, "restaurant_id": user["restaurant_id"]})
    return {"ok": True}

@api.get("/restaurant/analytics")
async def restaurant_analytics(user: dict = Depends(require_role("restaurant_admin"))):
    return await _restaurant_stats(user["restaurant_id"])

async def _restaurant_stats(rid: str):
    today_s, today_e = today_range()
    month_s, month_e = month_range()
    all_orders = await db.orders.find({"restaurant_id": rid, "status": {"$ne": "rejected"}}).to_list(5000)
    done = [o for o in all_orders if o["status"] not in ("cancelled", "rejected")]
    today_orders = [o for o in done if o["created_at"] >= today_s]
    month_orders = [o for o in done if o["created_at"] >= month_s]
    def sum_field(orders, f): return round(sum(o.get(f, 0) for o in orders), 2)
    top_products = {}
    for o in done:
        for it in o.get("items", []):
            top_products.setdefault(it["name"], {"name": it["name"], "quantity": 0, "revenue": 0.0})
            top_products[it["name"]]["quantity"] += it["quantity"]
            top_products[it["name"]]["revenue"] += it["line_total"]
    top = sorted(top_products.values(), key=lambda x: x["revenue"], reverse=True)[:5]
    status_counts = {}
    for o in all_orders:
        status_counts[o["status"]] = status_counts.get(o["status"], 0) + 1
    # Daily sales last 7 days
    now = datetime.now(timezone.utc)
    daily = []
    for i in range(6, -1, -1):
        d = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        d_end = d + timedelta(days=1)
        day_orders = [o for o in done if d.isoformat() <= o["created_at"] < d_end.isoformat()]
        daily.append({"date": d.strftime("%b %d"), "sales": sum_field(day_orders, "subtotal"), "orders": len(day_orders)})
    return {
        "today_orders": len(today_orders),
        "today_sales": sum_field(today_orders, "subtotal"),
        "month_orders": len(month_orders),
        "month_sales": sum_field(month_orders, "subtotal"),
        "total_orders": len(done),
        "total_sales": sum_field(done, "subtotal"),
        "avg_order_value": round(sum_field(done, "total") / max(len(done), 1), 2),
        "commission_paid": sum_field(done, "commission_amount"),
        "restaurant_earning": sum_field(done, "restaurant_earning"),
        "status_counts": status_counts,
        "top_products": top,
        "daily_sales": daily,
    }

# -----------------------------------------------------------------------------
# Super Admin
# -----------------------------------------------------------------------------
@api.get("/admin/restaurants")
async def sa_list_rests(user: dict = Depends(require_role("super_admin"))):
    items = await db.restaurants.find({}, {"_id": 0}).to_list(1000)
    for r in items:
        r["stats"] = await _restaurant_stats(r["id"])
    return items

@api.post("/admin/restaurants")
async def sa_create_rest(payload: RestaurantIn, user: dict = Depends(require_role("super_admin"))):
    rid = str(uuid.uuid4())
    rest = payload.model_dump(exclude={"admin_email", "admin_password", "admin_name"})
    rest.update({"id": rid, "rating": 0, "review_count": 0, "created_at": now_iso()})
    await db.restaurants.insert_one(rest)
    if payload.admin_email and payload.admin_password:
        admin = {
            "id": str(uuid.uuid4()),
            "email": payload.admin_email.lower(),
            "password_hash": hash_password(payload.admin_password),
            "name": payload.admin_name or rest["name"],
            "role": "restaurant_admin",
            "restaurant_id": rid,
            "created_at": now_iso(),
        }
        if not await db.users.find_one({"email": admin["email"]}):
            await db.users.insert_one(admin)
    rest.pop("_id", None)
    return rest

@api.patch("/admin/restaurants/{rid}")
async def sa_update_rest(rid: str, payload: RestaurantUpdate, user: dict = Depends(require_role("super_admin"))):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        await db.restaurants.update_one({"id": rid}, {"$set": updates})
    return await db.restaurants.find_one({"id": rid}, {"_id": 0})

@api.delete("/admin/restaurants/{rid}")
async def sa_delete_rest(rid: str, user: dict = Depends(require_role("super_admin"))):
    await db.restaurants.delete_one({"id": rid})
    await db.products.delete_many({"restaurant_id": rid})
    await db.categories.delete_many({"restaurant_id": rid})
    return {"ok": True}

@api.get("/admin/restaurants/{rid}/stats")
async def sa_rest_stats(rid: str, user: dict = Depends(require_role("super_admin"))):
    return await _restaurant_stats(rid)

@api.get("/admin/dashboard")
async def sa_dashboard(user: dict = Depends(require_role("super_admin"))):
    today_s, _ = today_range()
    month_s, _ = month_range()
    rests = await db.restaurants.find({}, {"_id": 0}).to_list(2000)
    customers_count = await db.users.count_documents({"role": "customer"})
    all_orders = await db.orders.find({}, {"_id": 0}).to_list(10000)
    done = [o for o in all_orders if o["status"] not in ("cancelled", "rejected")]
    today = [o for o in done if o["created_at"] >= today_s]
    month = [o for o in done if o["created_at"] >= month_s]
    def s(orders, f): return round(sum(o.get(f, 0) for o in orders), 2)
    status_counts = {}
    for o in all_orders:
        status_counts[o["status"]] = status_counts.get(o["status"], 0) + 1
    now = datetime.now(timezone.utc)
    daily = []
    for i in range(6, -1, -1):
        d = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        d_end = d + timedelta(days=1)
        day_orders = [o for o in done if d.isoformat() <= o["created_at"] < d_end.isoformat()]
        daily.append({"date": d.strftime("%b %d"), "sales": s(day_orders, "subtotal"),
                      "commission": s(day_orders, "commission_amount"),
                      "orders": len(day_orders)})
    return {
        "total_restaurants": len(rests),
        "active_restaurants": sum(1 for r in rests if r.get("active")),
        "suspended_restaurants": sum(1 for r in rests if not r.get("active")),
        "total_customers": customers_count,
        "total_orders": len(done),
        "today_orders": len(today),
        "today_sales": s(today, "subtotal"),
        "month_sales": s(month, "subtotal"),
        "total_sales": s(done, "subtotal"),
        "total_commission": s(done, "commission_amount"),
        "commission_pct": COMMISSION_PCT,
        "pending_orders": status_counts.get("pending", 0),
        "completed_orders": status_counts.get("completed", 0),
        "cancelled_orders": status_counts.get("cancelled", 0) + status_counts.get("rejected", 0),
        "status_counts": status_counts,
        "daily_sales": daily,
    }

@api.get("/admin/orders")
async def sa_orders(user: dict = Depends(require_role("super_admin"))):
    return await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api.get("/admin/customers")
async def sa_customers(user: dict = Depends(require_role("super_admin"))):
    users = await db.users.find({"role": "customer"}, {"_id": 0, "password_hash": 0}).to_list(2000)
    return users

@api.post("/admin/coupons")
async def sa_create_coupon(payload: CouponIn, user: dict = Depends(require_role("super_admin"))):
    doc = payload.model_dump()
    doc["code"] = doc["code"].upper()
    doc.update({"id": str(uuid.uuid4()), "created_at": now_iso(), "used_count": 0})
    await db.coupons.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/admin/coupons")
async def sa_coupons(user: dict = Depends(require_role("super_admin"))):
    return await db.coupons.find({}, {"_id": 0}).to_list(500)

@api.delete("/admin/coupons/{cid}")
async def sa_del_coupon(cid: str, user: dict = Depends(require_role("super_admin"))):
    await db.coupons.delete_one({"id": cid})
    return {"ok": True}

@api.get("/admin/settings")
async def sa_get_settings(user: dict = Depends(require_role("super_admin"))):
    return {"commission_pct": COMMISSION_PCT}

@api.patch("/admin/settings")
async def sa_update_settings(payload: SettingsIn, user: dict = Depends(require_role("super_admin"))):
    global COMMISSION_PCT
    if payload.commission_pct is not None:
        COMMISSION_PCT = float(payload.commission_pct)
    return {"commission_pct": COMMISSION_PCT}

# -----------------------------------------------------------------------------
# Startup — seed
# -----------------------------------------------------------------------------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.restaurants.create_index("id", unique=True)
    await db.products.create_index("id", unique=True)
    await db.orders.create_index("id", unique=True)
    try:
        init_storage()
        log.info("Storage initialized OK")
    except Exception as e:
        log.warning(f"Storage init deferred: {e}")
    from seed_data import seed_all, seed_platform_categories, fix_known_category_images
    await seed_all(db, hash_password, now_iso, log)
    await seed_platform_categories(db, now_iso, log)
    await fix_known_category_images(db, log)

@app.on_event("shutdown")
async def shutdown():
    client.close()

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
