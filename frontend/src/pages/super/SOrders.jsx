import { useEffect, useState } from "react";
import api, { inr } from "@/lib/api";
export default function SOrders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api.get("/admin/orders").then(({ data }) => setOrders(data)); }, []);
  return (
    <div>
      <h1 className="font-display font-black text-3xl text-[#4A0E2E]">All Orders</h1>
      <div className="mt-5 bg-white rounded-2xl border border-brand-cream overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-brand-warm text-left text-xs uppercase text-slate-500 font-bold">
            <tr><th className="p-3">Order</th><th className="p-3">Restaurant</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Commission</th><th className="p-3">Status</th><th className="p-3">Time</th></tr>
          </thead>
          <tbody className="divide-y divide-brand-cream">
            {orders.map(o => (
              <tr key={o.id}>
                <td className="p-3 font-mono text-xs">#{o.id}</td>
                <td className="p-3 font-bold">{o.restaurant_name}</td>
                <td className="p-3">{o.customer_name}</td>
                <td className="p-3 font-bold">{inr(o.total)}</td>
                <td className="p-3 text-brand-gold font-bold">{inr(o.commission_amount)}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-warm">{o.status.replace(/_/g," ")}</span></td>
                <td className="p-3 text-xs text-slate-500">{new Date(o.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
