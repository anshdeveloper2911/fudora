import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LogOut, ShoppingBag, MapPin, User } from "lucide-react";
import ReferralCard from "@/components/ReferralCard";

export default function Profile() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  if (!user) { nav("/login"); return null; }
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-white rounded-2xl border border-brand-cream p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-gold text-[#4A0E2E] font-display font-black text-2xl flex items-center justify-center">{user.name?.[0]?.toUpperCase()}</div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-black text-xl text-[#4A0E2E]">{user.name}</div>
          <div className="text-sm text-slate-500 truncate">{user.email}</div>
          {user.phone && <div className="text-xs text-slate-400">{user.phone}</div>}
        </div>
      </div>
      <ReferralCard />
      <div className="mt-4 bg-white rounded-2xl border border-brand-cream divide-y divide-brand-cream">
        <Link to="/orders" className="flex items-center gap-3 p-4 hover:bg-brand-warm"><ShoppingBag className="text-brand-gold"/><span className="font-semibold">My Orders</span></Link>
        <Link to="/favourites" className="flex items-center gap-3 p-4 hover:bg-brand-warm"><MapPin className="text-brand-gold"/><span className="font-semibold">Favourites</span></Link>
        <Link to="/offers" className="flex items-center gap-3 p-4 hover:bg-brand-warm"><User className="text-brand-gold"/><span className="font-semibold">Offers</span></Link>
        <button onClick={async () => { await logout(); nav("/"); }} data-testid="logout-btn" className="w-full flex items-center gap-3 p-4 text-red-500 hover:bg-brand-warm"><LogOut/><span className="font-semibold">Logout</span></button>
      </div>
    </div>
  );
}
