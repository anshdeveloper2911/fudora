import { useEffect, useState } from "react";
import api, { inr } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, ShoppingBag, IndianRupee, Timer } from "lucide-react";

export default function RDashboard() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/restaurant/analytics").then(({ data }) => setS(data)); }, []);
  if (!s) return <div className="text-slate-500">Loading…</div>;
  const cards = [
    { label: "Today's Orders", v: s.today_orders, icon: ShoppingBag, color: "bg-brand-gold/15 text-brand-gold" },
    { label: "Today's Sales", v: inr(s.today_sales), icon: IndianRupee, color: "bg-brand-mint/15 text-brand-mint" },
    { label: "Month Sales", v: inr(s.month_sales), icon: TrendingUp, color: "bg-[#4A0E2E]/10 text-[#4A0E2E]" },
    { label: "Avg Order Value", v: inr(s.avg_order_value), icon: Timer, color: "bg-blue-100 text-blue-600" },
  ];
  return (
    <div className="space-y-6">
      <h1 className="font-display font-black text-3xl text-[#4A0E2E]">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-brand-cream p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}><c.icon size={18}/></div>
            <div className="mt-3 text-xs uppercase text-slate-500 font-bold">{c.label}</div>
            <div className="font-display font-black text-2xl text-[#4A0E2E] mt-1">{c.v}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-brand-cream p-4">
          <div className="font-bold mb-3">Sales · Last 7 days</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={s.daily_sales}><CartesianGrid strokeDasharray="3 3" stroke="#E5DEC9"/><XAxis dataKey="date" fontSize={11}/><YAxis fontSize={11}/><Tooltip/><Line type="monotone" dataKey="sales" stroke="#4A0E2E" strokeWidth={2.5}/></LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-brand-cream p-4">
          <div className="font-bold mb-3">Top products</div>
          <div className="space-y-2">
            {s.top_products.map(p => (
              <div key={p.name} className="flex justify-between text-sm border-b border-brand-cream pb-1.5">
                <span className="truncate">{p.name} <span className="text-slate-400">× {p.quantity}</span></span>
                <b>{inr(p.revenue)}</b>
              </div>
            ))}
            {s.top_products.length === 0 && <div className="text-sm text-slate-500">No sales yet.</div>}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-brand-cream p-4">
        <div className="font-bold mb-2">Status overview</div>
        <div className="flex flex-wrap gap-3 text-sm">
          {Object.entries(s.status_counts).map(([k,v]) => <div key={k} className="px-3 py-1.5 rounded-full bg-brand-warm"><b>{v}</b> <span className="text-slate-500 uppercase text-xs">{k.replace(/_/g," ")}</span></div>)}
        </div>
      </div>
    </div>
  );
}
