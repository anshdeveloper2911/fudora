import { useEffect, useState } from "react";
import api, { formatErr } from "@/lib/api";
import { toast } from "sonner";
export default function SSettings() {
  const [pct, setPct] = useState(10);
  useEffect(() => { api.get("/admin/settings").then(({data}) => setPct(data.commission_pct)); }, []);
  const save = async () => {
    try { await api.patch("/admin/settings", { commission_pct: parseFloat(pct) }); toast.success("Saved"); }
    catch (e) { toast.error(formatErr(e)); }
  };
  return (
    <div>
      <h1 className="font-display font-black text-3xl text-[#4A0E2E]">Platform Settings</h1>
      <div className="mt-5 bg-white rounded-2xl border border-brand-cream p-6 max-w-md">
        <div className="text-xs font-bold uppercase text-slate-500">Fudora Commission (%)</div>
        <input type="number" value={pct} onChange={e => setPct(e.target.value)}
          data-testid="super-admin-commission-rate-input"
          className="mt-2 w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm"/>
        <div className="text-xs text-slate-500 mt-2">Applied to future orders. Restaurant keeps the rest.</div>
        <button onClick={save} className="mt-4 bg-[#4A0E2E] text-white font-bold px-6 py-2.5 rounded-full">Save</button>
      </div>
    </div>
  );
}
