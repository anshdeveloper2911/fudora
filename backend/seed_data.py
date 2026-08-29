"""Fudora seed data — creates super admin + 4 demo restaurants in Sasaram, Bihar."""
import os
import uuid

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "fudoraofficial05@gmail.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Fudora@2026")

REST_ADMIN_PW = "Restaurant@2026"
TEST_CUSTOMER_EMAIL = "customer@fudora.demo"
TEST_CUSTOMER_PW = "Customer@2026"

# Image URLs — external CDN (Unsplash / Pexels)
IMG = {
    "royal_cover": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    "royal_logo": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80",
    "spice_cover": "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=1200&q=80",
    "spice_logo": "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80",
    "thali_cover": "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=1200&q=80",
    "thali_logo": "https://images.unsplash.com/photo-1567337710282-00832b415979?auto=format&fit=crop&w=400&q=80",
    "bakers_cover": "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=1200&q=80",
    "bakers_logo": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",

    "biryani_chicken": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    "biryani_mutton": "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=800&q=80",
    "biryani_veg": "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80",
    "kebab": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800&q=80",
    "butter_chicken": "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80",
    "paneer": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
    "naan": "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80",
    "dal": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    "thali_veg": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80",
    "thali_nonveg": "https://images.unsplash.com/photo-1567337710282-00832b415979?auto=format&fit=crop&w=800&q=80",
    "samosa": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    "gulab_jamun": "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80",
    "cake_choco": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
    "cake_vanilla": "https://images.unsplash.com/photo-1557925923-cd4648e211a0?auto=format&fit=crop&w=800&q=80",
    "pastry": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    "bread": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    "cookies": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
    "sandwich": "https://images.unsplash.com/photo-1553909489-cd47e0ef937f?auto=format&fit=crop&w=800&q=80",
    "burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    "pizza": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
    "momos": "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80",
    "noodles": "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
    "manchurian": "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=800&q=80",
    "dosa": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
    "idli": "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    "lassi": "https://images.unsplash.com/photo-1541544537156-7627a7a4aa1c?auto=format&fit=crop&w=800&q=80",
    "coldcoffee": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80",
}


def R(name, tagline, cuisines, area, logo, cover, dt, fee, minord, veg=False, rating=4.5):
    return {
        "id": str(uuid.uuid4()),
        "name": name, "tagline": tagline, "cuisines": cuisines,
        "area": area, "city": "Sasaram", "address": f"{area}, Sasaram, Bihar 821115",
        "pincode": "821115", "phone": "+91 99000 00000",
        "logo_url": logo, "cover_url": cover,
        "delivery_time_mins": dt, "delivery_fee": fee, "min_order": minord,
        "opening_time": "09:00", "closing_time": "23:30",
        "is_veg_only": veg, "active": True,
        "rating": rating, "review_count": 0,
        "is_demo": True,
    }


def P(rid, name, desc, price, dp, cat, img, veg=True, best=False, rec=False):
    return {
        "id": str(uuid.uuid4()), "restaurant_id": rid, "name": name, "description": desc,
        "price": price, "discount_price": dp, "category_id": None, "category_name": cat,
        "image_url": img, "is_veg": veg, "is_bestseller": best, "is_recommended": rec,
        "available": True, "prep_time_mins": 20,
    }


async def seed_all(db, hash_password, now_iso, log):
    # Super admin
    if not await db.users.find_one({"email": ADMIN_EMAIL}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Fudora Admin", "role": "super_admin", "created_at": now_iso(),
        })
        log.info(f"Super admin created: {ADMIN_EMAIL}")
    else:
        # Ensure password matches env
        existing = await db.users.find_one({"email": ADMIN_EMAIL})
        import bcrypt
        if not bcrypt.checkpw(ADMIN_PASSWORD.encode(), existing["password_hash"].encode()):
            await db.users.update_one({"email": ADMIN_EMAIL},
                                      {"$set": {"password_hash": hash_password(ADMIN_PASSWORD), "role": "super_admin"}})

    # Test customer
    if not await db.users.find_one({"email": TEST_CUSTOMER_EMAIL}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": TEST_CUSTOMER_EMAIL,
            "password_hash": hash_password(TEST_CUSTOMER_PW),
            "name": "Demo Customer", "phone": "+91 99999 99999",
            "role": "customer", "created_at": now_iso(),
        })

    # Skip restaurant seeding if already done
    if await db.restaurants.count_documents({"is_demo": True}) >= 4:
        return

    # 4 demo restaurants
    rests = [
        R("Royal Biryani House", "Authentic Awadhi biryani since 1998",
          ["Biryani", "Mughlai", "North Indian"], "GT Road",
          IMG["royal_logo"], IMG["royal_cover"], 28, 25, 149, rating=4.6),
        R("Sasaram Spice Villa", "Fiery Bihari & North Indian delights",
          ["North Indian", "Bihari", "Chinese"], "Fort Road",
          IMG["spice_logo"], IMG["spice_cover"], 32, 20, 99, rating=4.4),
        R("Grand Thali Junction", "Unlimited pure-veg thali & South Indian",
          ["Thali", "South Indian", "North Indian"], "Rauza Road",
          IMG["thali_logo"], IMG["thali_cover"], 25, 30, 79, veg=True, rating=4.5),
        R("GT Road Bakers", "Fresh bakes, cakes & quick bites",
          ["Bakery", "Cakes", "Desserts", "Snacks"], "GT Road",
          IMG["bakers_logo"], IMG["bakers_cover"], 20, 15, 49, veg=True, rating=4.3),
    ]

    admins = [
        ("royal@fudora.demo", "Royal Biryani Admin"),
        ("spice@fudora.demo", "Spice Villa Admin"),
        ("thali@fudora.demo", "Thali Junction Admin"),
        ("bakers@fudora.demo", "GT Road Bakers Admin"),
    ]

    for rest, (email, aname) in zip(rests, admins):
        await db.restaurants.insert_one({**rest, "created_at": now_iso()})
        if not await db.users.find_one({"email": email}):
            await db.users.insert_one({
                "id": str(uuid.uuid4()), "email": email,
                "password_hash": hash_password(REST_ADMIN_PW),
                "name": aname, "role": "restaurant_admin",
                "restaurant_id": rest["id"], "created_at": now_iso(),
            })

    rid_royal, rid_spice, rid_thali, rid_bakers = [r["id"] for r in rests]

    # Products
    products = [
        # Royal Biryani House
        P(rid_royal, "Chicken Biryani (Full)", "Slow-cooked long-grain basmati with tender chicken & royal spices", 299, 249, "Biryani", IMG["biryani_chicken"], veg=False, best=True, rec=True),
        P(rid_royal, "Mutton Biryani (Full)", "Aromatic mutton dum biryani, cooked on charcoal", 399, 359, "Biryani", IMG["biryani_mutton"], veg=False, best=True),
        P(rid_royal, "Veg Biryani (Full)", "Fragrant veg biryani with mixed vegetables", 199, 179, "Biryani", IMG["biryani_veg"], veg=True),
        P(rid_royal, "Seekh Kebab (6 pc)", "Charcoal-grilled minced meat kebabs", 259, None, "Starters", IMG["kebab"], veg=False, rec=True),
        P(rid_royal, "Butter Chicken", "Creamy tomato gravy, tandoori chicken", 289, 269, "Main Course", IMG["butter_chicken"], veg=False, best=True),
        P(rid_royal, "Paneer Butter Masala", "Cottage cheese in silky tomato-cream gravy", 229, None, "Main Course", IMG["paneer"], veg=True),
        P(rid_royal, "Butter Naan (2 pc)", "Soft tandoor-baked flatbread with butter", 60, None, "Breads", IMG["naan"], veg=True),
        P(rid_royal, "Sweet Lassi", "Chilled thick yogurt drink", 79, 69, "Drinks", IMG["lassi"], veg=True),
        P(rid_royal, "Gulab Jamun (2 pc)", "Warm milk dumplings in rose syrup", 69, None, "Desserts", IMG["gulab_jamun"], veg=True),

        # Sasaram Spice Villa
        P(rid_spice, "Dal Makhani", "Slow-cooked black lentils with cream", 199, 179, "Main Course", IMG["dal"], veg=True, best=True),
        P(rid_spice, "Chicken Curry Bihari", "Homestyle spicy Bihari-style chicken", 259, 239, "Main Course", IMG["butter_chicken"], veg=False, rec=True),
        P(rid_spice, "Veg Manchurian", "Indo-Chinese crispy veg balls in tangy sauce", 179, None, "Chinese", IMG["manchurian"], veg=True),
        P(rid_spice, "Hakka Noodles", "Wok-tossed noodles with vegetables", 149, 129, "Chinese", IMG["noodles"], veg=True, best=True),
        P(rid_spice, "Veg Momos (8 pc)", "Steamed dumplings with spicy chutney", 99, None, "Snacks", IMG["momos"], veg=True),
        P(rid_spice, "Samosa (2 pc)", "Crispy pastry with potato-pea filling", 40, None, "Snacks", IMG["samosa"], veg=True, best=True),
        P(rid_spice, "Tandoori Naan", "Tandoor-baked flatbread", 45, None, "Breads", IMG["naan"], veg=True),
        P(rid_spice, "Cold Coffee", "Iced coffee with cream", 99, 89, "Beverages", IMG["coldcoffee"], veg=True),
        P(rid_spice, "Gulab Jamun (2 pc)", "Traditional Indian sweet", 59, None, "Desserts", IMG["gulab_jamun"], veg=True),

        # Grand Thali Junction (veg only)
        P(rid_thali, "Deluxe Veg Thali", "Rice, roti, 3 sabzi, dal, salad, papad, sweet", 189, 169, "Thali", IMG["thali_veg"], veg=True, best=True, rec=True),
        P(rid_thali, "Special Bihari Thali", "Sattu paratha, chokha, dal, aloo bhujiya", 219, None, "Thali", IMG["thali_nonveg"], veg=True, best=True),
        P(rid_thali, "Plain Dosa", "Crispy South Indian rice crepe", 79, None, "South Indian", IMG["dosa"], veg=True),
        P(rid_thali, "Masala Dosa", "Dosa stuffed with spiced potato", 119, 99, "South Indian", IMG["dosa"], veg=True, rec=True),
        P(rid_thali, "Idli Sambar (4 pc)", "Steamed rice cakes with sambar & chutney", 89, None, "South Indian", IMG["idli"], veg=True),
        P(rid_thali, "Paneer Butter Masala", "Rich creamy paneer curry", 199, 179, "Main Course", IMG["paneer"], veg=True),
        P(rid_thali, "Tandoori Roti (2 pc)", "Whole wheat tandoor bread", 40, None, "Breads", IMG["naan"], veg=True),
        P(rid_thali, "Sweet Lassi", "Yogurt cooler", 69, None, "Drinks", IMG["lassi"], veg=True),

        # GT Road Bakers
        P(rid_bakers, "Chocolate Truffle Cake (500g)", "Rich chocolate cake with truffle icing", 349, 299, "Cakes", IMG["cake_choco"], veg=True, best=True),
        P(rid_bakers, "Vanilla Cake (500g)", "Classic fluffy vanilla cake", 299, None, "Cakes", IMG["cake_vanilla"], veg=True),
        P(rid_bakers, "Chicken Sandwich", "Grilled chicken sandwich with cheese", 129, 109, "Snacks", IMG["sandwich"], veg=False, rec=True),
        P(rid_bakers, "Veg Burger", "Aloo tikki burger with sauces", 89, 79, "Fast Food", IMG["burger"], veg=True, best=True),
        P(rid_bakers, "Margherita Pizza (7\")", "Cheese, tomato & basil", 179, 159, "Fast Food", IMG["pizza"], veg=True),
        P(rid_bakers, "Chicken Pizza (7\")", "Loaded chicken pizza", 249, 219, "Fast Food", IMG["pizza"], veg=False),
        P(rid_bakers, "Fresh Cream Pastry", "Chef's daily pastry", 69, None, "Desserts", IMG["pastry"], veg=True),
        P(rid_bakers, "Butter Cookies (250g)", "Classic butter cookies", 149, None, "Snacks", IMG["cookies"], veg=True),
        P(rid_bakers, "Cold Coffee", "Whipped iced coffee", 89, None, "Beverages", IMG["coldcoffee"], veg=True),
    ]
    for p in products:
        p["created_at"] = now_iso()
        await db.products.insert_one(p)

    # Sample coupons
    if await db.coupons.count_documents({}) == 0:
        coupons = [
            {"id": str(uuid.uuid4()), "code": "FUDORA50", "description": "50% off up to ₹100 on your first order",
             "discount_type": "percent", "discount_value": 50, "min_order": 199, "max_discount": 100,
             "usage_limit": 10000, "active": True, "used_count": 0, "created_at": now_iso()},
            {"id": str(uuid.uuid4()), "code": "SASARAM100", "description": "Flat ₹100 off on orders above ₹399",
             "discount_type": "flat", "discount_value": 100, "min_order": 399, "max_discount": None,
             "usage_limit": 10000, "active": True, "used_count": 0, "created_at": now_iso()},
            {"id": str(uuid.uuid4()), "code": "FREEDEL", "description": "Free delivery on orders above ₹149",
             "discount_type": "flat", "discount_value": 25, "min_order": 149, "max_discount": None,
             "usage_limit": 10000, "active": True, "used_count": 0, "created_at": now_iso()},
        ]
        for c in coupons:
            await db.coupons.insert_one(c)

    log.info("Fudora seed data loaded: 4 restaurants, ~35 products, 3 coupons")


PLATFORM_CATEGORIES = [
    ("Biryani", "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"),
    ("Pizza", "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80"),
    ("Burger", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"),
    ("Chinese", "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80"),
    ("North Indian", "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80"),
    ("South Indian", "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80"),
    ("Thali", "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80"),
    ("Momos", "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80"),
    ("Rolls", "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80"),
    ("Snacks", "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80"),
    ("Cakes", "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80"),
    ("Desserts", "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=600&q=80"),
    ("Ice Cream", "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80"),
    ("Beverages", "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80"),
    ("Fast Food", "https://images.unsplash.com/photo-1553909489-cd47e0ef937f?auto=format&fit=crop&w=600&q=80"),
    ("Sweets", "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=600&q=80"),
]


async def seed_platform_categories(db, now_iso, log):
    if await db.platform_categories.count_documents({}) > 0:
        return
    docs = []
    for idx, (name, img) in enumerate(PLATFORM_CATEGORIES):
        docs.append({
            "id": str(uuid.uuid4()),
            "name": name,
            "image_url": img,
            "display_order": idx,
            "active": True,
            "created_at": now_iso(),
        })
    await db.platform_categories.insert_many(docs)
    log.info(f"Seeded {len(docs)} platform categories")


FIX_CATEGORY_IMAGES = {
    # (name, old_seeded_url_fragment) -> new url. Only fixes categories that still have the original broken/duplicated seed URL.
    "Fast Food": ("photo-1553909489-cd47e0ef937f", "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=600&q=80"),
    "Momos": ("photo-1626074353765-517a681e40be", "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80"),
    "Rolls": ("photo-1626074353765-517a681e40be", "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80"),
    "Desserts": ("photo-1614252235316-8c857d38b5f4", "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=600&q=80"),
    "Thali": ("photo-1610057099443-fde8c4d50f91", "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80"),
    "Ice Cream": ("photo-1563805042-7684c019e1cb", "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?auto=format&fit=crop&w=600&q=80"),
    "Biryani": ("photo-1563379091339-03b21ab4a4f8", "https://images.unsplash.com/photo-1633945274309-2c16c9679b96?auto=format&fit=crop&w=600&q=80"),
}


async def fix_known_category_images(db, log):
    """One-shot: replace only known-broken/duplicated seeded images. User-uploaded images (uploaded via /api/upload, path starts with /api/files or absent unsplash fragment) are never touched."""
    fixed = 0
    for name, (old_frag, new_url) in FIX_CATEGORY_IMAGES.items():
        r = await db.platform_categories.update_one(
            {"name": name, "image_url": {"$regex": old_frag}},
            {"$set": {"image_url": new_url}}
        )
        fixed += r.modified_count
    if fixed:
        log.info(f"Fixed {fixed} category images")
