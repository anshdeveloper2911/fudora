# Fudora — Product Requirements Document

## Problem Statement
Build a complete, production-ready multi-restaurant food delivery platform named **Fudora** (tagline "Your Food. Your Way.") — initially targeting Sasaram, Bihar, India, but architected for multi-city expansion. Mobile-first customer experience + Restaurant Admin panel + Super Admin panel. Three roles, strict data isolation.

## Stack
- Backend: FastAPI + Python + MongoDB (motor)
- Frontend: React 19 + React Router 7 + Tailwind + shadcn/ui + Recharts + framer-motion
- Auth: JWT (httpOnly cookies + Bearer fallback) with bcrypt hashing, RBAC
- Real-time: 5-second polling on order tracking + restaurant admin orders
- Image storage: Emergent object storage integration
- Payment: COD (online payment architecture stubbed)
- Commission: 10% platform default (configurable by super admin)

## Users
1. **Customer** — Browse Sasaram restaurants, add to cart, checkout, track orders, review, favourite
2. **Restaurant Admin** — Manage own restaurant only (menu, orders, analytics, profile)
3. **Super Admin** (`fudoraofficial05@gmail.com`) — Onboard restaurants, per-restaurant sales, commission

## Implemented (v1)
- Full auth system with 3 roles + protected routes
- 4 seeded demo restaurants in Sasaram with ~35 menu items + 3 coupons
- Customer flow: home → restaurants → menu → cart → checkout (COD) → order tracking → my orders → review → reorder
- Real image upload (Emergent object storage) for restaurant logo/cover + product images
- Restaurant Admin: dashboard w/ charts, orders (accept/preparing/ready/OFD/completed), products CRUD, profile
- Super Admin: dashboard, restaurants w/ per-restaurant sales & commission, add restaurant + auto-create admin, coupons, orders, customers, settings (commission %)
- Coupon validation on backend, tax + delivery + commission calculated backend-side
- Mobile-first UI with bottom nav (Home / Search / Orders / Favourites / Cart)
- Data isolation enforced backend-side on every restaurant_admin endpoint

## Backlog (P1)
- Real WebSocket instead of polling
- Razorpay/PhonePe online payments
- Delivery-partner assignment UI
- Push notifications (browser + FCM)
- Restaurant open/closed automatic from opening hours
- Address geocoding + area-based restaurant filtering
