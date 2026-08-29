import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { inr } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { ShoppingBag } from "lucide-react";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const { replaceWith } = useCart();

  useEffect(() => { api.get("/orders/mine").then(({ data }) => setOrders(data)); }, []);

  if (orders.length === 0) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="w-24 h-24 rounded-full bg-brand-warm mx-auto flex items-center justify-center"><ShoppingBag className="text-[#4A0E2E]" size={40} /></div>
      <h2 className="mt-4 font-display font-black text-2xl text-[#4A0E2E]">No orders yet</h2>
      <p className="text-slate-500 text-sm mt-1">Your food journey starts here.</p>
      <Link to="/restaurants" className="mt-6 inline-block bg-[#4A0E2E] text-white font-bold text-sm px-6 py-3 rounded-full">Browse Restaurants</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display font-black text-3xl text-[#4A0E2E]">My Orders</h1>
      <div className="mt-5 space-y-3">
        {orders.map(o => (
          <Link key={o.id} to={`/orders/${o.id}`} className="block bg-white rounded-2xl border border-brand-cream p-4 hover:shadow-warm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display font-bold text-[#4A0E2E]">{o.restaurant_name}</div>
                <div className="text-xs text-slate-500 truncate mt-0.5">{o.items.map(i => `${i.quantity}× ${i.name}`).join(", ")}</div>
                <div className="text-[11px] text-slate-400 mt-1 uppercase font-bold">#{o.id} · {new Date(o.created_at).toLocaleString()}</div>
              </div>
              <div className="text-right shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  o.status === "completed" ? "bg-brand-mint/15 text-brand-mint" :
                  ["cancelled","rejected"].includes(o.status) ? "bg-red-100 text-red-600" : "bg-brand-gold/20 text-[#4A0E2E]"
                }`}>{o.status.replace(/_/g," ")}</span>
                <div className="mt-1 font-bold">{inr(o.total)}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
