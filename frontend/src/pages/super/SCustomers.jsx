import { useEffect, useState } from "react";
import api from "@/lib/api";
export default function SCustomers() {
  const [c, setC] = useState([]);
  useEffect(() => { api.get("/admin/customers").then(({ data }) => setC(data)); }, []);
  return (
    <div>
      <h1 className="font-display font-black text-3xl text-[#4A0E2E]">Customers</h1>
      <div className="mt-5 bg-white rounded-2xl border border-brand-cream overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-brand-warm text-left text-xs uppercase text-slate-500 font-bold">
            <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Phone</th><th className="p-3">Joined</th></tr>
          </thead>
          <tbody className="divide-y divide-brand-cream">
            {c.map(u => (
              <tr key={u.id}><td className="p-3 font-bold">{u.name}</td><td className="p-3">{u.email}</td><td className="p-3">{u.phone||"—"}</td><td className="p-3 text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
