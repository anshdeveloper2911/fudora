import { useEffect, useState } from "react";
import api, { formatErr } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "sonner";

export default function RRestaurant() {
  const [r, setR] = useState(null);
  useEffect(() => { api.get("/restaurant/me").then(({ data }) => setR(data)); }, []);
  const save = async () => {
    try { const { data } = await api.patch("/restaurant/me", r); setR(data); toast.success("Saved"); }
    catch (e) { toast.error(formatErr(e)); }
  };
  if (!r) return null;
  return (
    <div>
      <h1 className="font-display font-black text-3xl text-[#4A0E2E]">Restaurant Profile</h1>
      <div className="mt-5 bg-white rounded-2xl border border-brand-cream p-4 sm:p-6 space-y-4 max-w-3xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><div className="text-xs font-bold uppercase text-slate-500 mb-1">Logo</div>
            <ImageUpload value={r.logo_url} onChange={v => setR({...r, logo_url: v})} label="Upload logo" aspect="aspect-square"/></div>
          <div><div className="text-xs font-bold uppercase text-slate-500 mb-1">Cover</div>
            <ImageUpload value={r.cover_url} onChange={v => setR({...r, cover_url: v})} label="Upload cover" aspect="aspect-video"/></div>
        </div>
        <input value={r.name} onChange={e => setR({...r, name: e.target.value})} className="w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2.5 text-sm" placeholder="Restaurant name"/>
        <input value={r.tagline} onChange={e => setR({...r, tagline: e.target.value})} className="w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2.5 text-sm" placeholder="Tagline"/>
        <input value={r.address} onChange={e => setR({...r, address: e.target.value})} className="w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2.5 text-sm" placeholder="Address"/>
        <div className="grid grid-cols-3 gap-2">
          <input type="number" value={r.delivery_time_mins} onChange={e => setR({...r, delivery_time_mins: parseInt(e.target.value)||0})} className="bg-brand-warm border border-brand-cream rounded-lg px-3 py-2.5 text-sm" placeholder="Delivery min"/>
          <input type="number" value={r.delivery_fee} onChange={e => setR({...r, delivery_fee: parseFloat(e.target.value)||0})} className="bg-brand-warm border border-brand-cream rounded-lg px-3 py-2.5 text-sm" placeholder="Delivery fee"/>
          <input type="number" value={r.min_order} onChange={e => setR({...r, min_order: parseFloat(e.target.value)||0})} className="bg-brand-warm border border-brand-cream rounded-lg px-3 py-2.5 text-sm" placeholder="Min order"/>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={r.active} onChange={e => setR({...r, active: e.target.checked})}/> Restaurant is receiving orders</label>
        <button onClick={save} className="bg-[#4A0E2E] text-white font-bold px-6 py-2.5 rounded-full">Save Changes</button>
      </div>
    </div>
  );
}
