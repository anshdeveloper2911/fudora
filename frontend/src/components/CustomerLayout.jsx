import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation as useRouterLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, Heart, ShoppingCart, MapPin, LogIn, ChevronDown, HelpCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLocation } from "@/context/LocationContext";
import Logo from "@/components/Logo";
import FloatingCart from "@/components/FloatingCart";
import LocationDialog from "@/components/LocationDialog";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";

const navItems = [
  { to: "/", label: "Home", icon: Home, tid: "customer-bottom-nav-home" },
  { to: "/search", label: "Search", icon: Search, tid: "customer-bottom-nav-search" },
  { to: "/orders", label: "Orders", icon: ShoppingBag, tid: "customer-bottom-nav-orders" },
  { to: "/favourites", label: "Saved", icon: Heart, tid: "customer-bottom-nav-favourites" },
  { to: "/cart", label: "Cart", icon: ShoppingCart, tid: "customer-bottom-nav-cart", badge: true },
];

export default function CustomerLayout() {
  const { user } = useAuth();
  const { count } = useCart();
  const { location } = useLocation();
  const nav = useNavigate();
  const loc = useRouterLocation();
  const [locOpen, setLocOpen] = useState(false);
  const showFloatingCart = count > 0 && !["/cart", "/checkout"].some(p => loc.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <AnnouncementBar />
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-cream">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center gap-3">
          <Link to="/" className="shrink-0"><Logo size={38} showText={false} /></Link>
          <span className="hidden sm:inline font-display font-black text-2xl text-[#4A0E2E]">Fudora</span>
          <button
            onClick={() => setLocOpen(true)}
            data-testid="customer-header-location"
            className="ml-2 md:ml-6 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-brand-warm transition text-left min-w-0"
          >
            <MapPin size={16} className="text-brand-gold shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold leading-none">Delivering to</div>
              <div className="text-sm font-bold text-[#4A0E2E] truncate max-w-[140px] md:max-w-[200px] leading-tight mt-0.5 flex items-center gap-1">
                {location.city || location.area || "Choose location"}
                <ChevronDown size={13} className="text-slate-400" />
              </div>
            </div>
          </button>
          <button
            className="hidden md:flex flex-1 max-w-md items-center gap-2 bg-brand-warm hover:bg-white border border-brand-cream rounded-full px-4 py-2.5 text-sm text-slate-500 transition"
            onClick={() => nav("/search")}
            data-testid="customer-header-search-input"
          >
            <Search size={16} />
            Search restaurants, food or cuisines
          </button>
          <div className="ml-auto flex items-center gap-1 md:gap-2">
            <Link to="/offers" className="hidden md:inline text-sm font-semibold text-[#4A0E2E] hover:text-brand-gold px-3 py-1.5 rounded-full">Offers</Link>
            <Link to="/help" className="hidden md:flex items-center gap-1 text-sm font-semibold text-[#4A0E2E] hover:text-brand-gold px-3 py-1.5 rounded-full"><HelpCircle size={15}/> Help</Link>
            <Link to="/cart" className="hidden md:flex items-center gap-2 relative bg-brand-warm hover:bg-brand-cream text-[#4A0E2E] font-bold text-sm rounded-full px-4 py-2">
              <ShoppingCart size={16}/> Cart
              {count > 0 && <span className="ml-1 bg-[#4A0E2E] text-white text-[10px] font-black rounded-full px-1.5 py-0.5">{count}</span>}
            </Link>
            {user ? (
              <Link to="/profile" className="flex items-center gap-2 bg-[#4A0E2E] text-white text-sm font-semibold rounded-full pl-1 pr-3 py-1 hover:bg-[#3A0A24]">
                <span className="w-7 h-7 rounded-full bg-brand-gold text-[#4A0E2E] flex items-center justify-center text-xs font-black">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </span>
                <span className="hidden sm:inline">{user.name?.split(" ")[0]}</span>
              </Link>
            ) : (
              <Link to="/login" className="flex items-center gap-1.5 bg-[#4A0E2E] text-white text-sm font-semibold rounded-full px-4 py-2 hover:bg-[#3A0A24]" data-testid="header-login-btn">
                <LogIn size={15} /> Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-cream h-16 grid grid-cols-5">
        {navItems.map((n) => (
          <NavLink
            key={n.to} to={n.to} data-testid={n.tid}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition ${isActive ? "text-[#4A0E2E]" : "text-slate-500 hover:text-[#4A0E2E]"}`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`relative flex items-center justify-center ${isActive ? "bg-brand-gold/15 rounded-full p-2" : "p-2"}`}>
                  <n.icon size={20} />
                  {n.badge && count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#4A0E2E] text-white text-[9px] font-black rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">{count}</span>
                  )}
                </div>
                <span className="uppercase tracking-wide">{n.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {showFloatingCart && <FloatingCart />}

      <Footer />

      <LocationDialog open={locOpen} onOpenChange={setLocOpen} />
    </div>
  );
}
