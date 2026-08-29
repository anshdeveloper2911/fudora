import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Package, Tag, Store, BarChart3, LogOut, Users, Ticket, Settings, ClipboardList, Layers, Paintbrush } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";

const RA_NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/products", label: "Menu", icon: Package },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/restaurant", label: "Restaurant", icon: Store },
];

const SA_NAV = [
  { to: "/super", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/super/restaurants", label: "Restaurants", icon: Store },
  { to: "/super/orders", label: "Orders", icon: ShoppingBag },
  { to: "/super/customers", label: "Customers", icon: Users },
  { to: "/super/categories", label: "Categories", icon: Layers },
  { to: "/super/coupons", label: "Coupons", icon: Ticket },
  { to: "/super/customization", label: "Website", icon: Paintbrush },
  { to: "/super/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ variant }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const items = variant === "super" ? SA_NAV : RA_NAV;
  const title = variant === "super" ? "Super Admin" : "Restaurant Admin";
  return (
    <div className="min-h-screen bg-brand-cream flex">
      <aside className="hidden md:flex flex-col w-64 bg-[#1E0A17] text-white sticky top-0 h-screen">
        <Link to="/" className="p-5 border-b border-white/10 flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-brand-gold flex items-center justify-center">
            <span className="font-display font-black text-[#4A0E2E] text-xl leading-none">F</span>
          </div>
          <div className="leading-none">
            <div className="font-display font-black text-xl text-white">Fudora</div>
            <div className="text-[10px] uppercase tracking-widest text-brand-gold font-bold">{title}</div>
          </div>
        </Link>
        <nav className="p-3 flex-1 space-y-1 overflow-y-auto">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${isActive ? "bg-brand-gold text-[#4A0E2E]" : "text-white/70 hover:bg-white/5 hover:text-white"}`
              }>
              <i.icon size={17} />
              {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2 px-2 py-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-brand-gold text-[#4A0E2E] flex items-center justify-center font-black text-xs">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <div className="font-bold truncate">{user?.name}</div>
              <div className="text-xs text-white/50 truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={async () => { await logout(); nav("/admin/login"); }}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white/70 hover:bg-white/5">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="md:hidden bg-[#1E0A17] text-white px-4 py-3 flex items-center justify-between">
          <Logo size={30} showText={false} />
          <div className="text-xs font-bold uppercase tracking-wider text-brand-gold">{title}</div>
          <button onClick={async () => { await logout(); nav("/admin/login"); }} className="text-white/70"><LogOut size={18} /></button>
        </header>
        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1E0A17] border-t border-white/10 grid" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end}
              className={({ isActive }) => `flex flex-col items-center py-2 gap-0.5 text-[10px] font-bold ${isActive ? "text-brand-gold" : "text-white/60"}`}>
              <i.icon size={18} />
              <span className="uppercase tracking-wide">{i.label}</span>
            </NavLink>
          ))}
        </nav>
        <main className="p-4 md:p-8 pb-24 md:pb-8"><Outlet /></main>
      </div>
    </div>
  );
}
