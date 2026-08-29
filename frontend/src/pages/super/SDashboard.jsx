import { useEffect, useState } from "react";
import api, { inr } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function SDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/admin/dashboard").then(({ data }) => setD(data)); }, []);
  if (!d) return <div className="text-slate-500">Loading…</div>;
  const cards = [
    { l: "Restaurants", v: `${d.active_restaurants}/${d.total_restaurants}` },
    { l: "Customers", v: d.total_customers },
    { l: "Today's Orders", v: d.today_orders },
    { l: "Today Sales", v: inr(d.today_sales) },
    { l: "Month Sales", v: inr(d.month_sales) },
    { l: "Platform Commission", v: inr(d.total_commission) },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-black text-3xl text-[#4A0E2E]">Platform Overview</h1>
        <div className="bg-brand-gold/20 text-[#4A0E2E] px-3 py-1.5 rounded-full text-xs font-black uppercase">Commission {d.commission_pct}%</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(c => (
          <div key={c.l} className="bg-white rounded-2xl border border-brand-cream p-4">
            <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">{c.l}</div>
            <div className="mt-1 font-display font-black text-xl text-[#4A0E2E]">{c.v}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-brand-cream p-4">
        <div className="font-bold mb-3">Sales & Commission · Last 7 days</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={d.daily_sales}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5DEC9"/><XAxis dataKey="date" fontSize={11}/><YAxis fontSize={11}/><Tooltip/>
            <Line type="monotone" dataKey="sales" stroke="#4A0E2E" strokeWidth={2.5}/>
            <Line type="monotone" dataKey="commission" stroke="#F59E0B" strokeWidth={2.5}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
