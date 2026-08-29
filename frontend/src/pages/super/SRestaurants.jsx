import { useEffect, useState } from "react";
import api, { inr, formatErr, fileUrl } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, Edit } from "lucide-react";

const EMPTY = { name: "", tagline: "", cuisines: [], address: "", area: "GT Road", city: "Sasaram", pincode: "821115", phone: "", logo_url: "", cover_url: "", delivery_time_mins: 30, delivery_fee: 25, min_order: 99, opening_time: "09:00", closing_time: "23:00", is_veg_only: false, active: true, admin_email: "", admin_password: "", admin_name: "" };

export default function SRestaurants() {
  const [rests, setRests] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get("/admin/restaurants").then(({ data }) => setRests(data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      await api.post("/admin/restaurants", { ...form, cuisines: typeof form.cuisines === "string" ? form.cuisines.split(",").map(s=>s.trim()) : form.cuisines });
      toast.success("Restaurant added"); setOpen(false); setForm(EMPTY); load();
    } catch (e) { toast.error(formatErr(e)); }
  };
  const toggle = async (r) => { await api.patch(`/admin/restaurants/${r.id}`, { active: !r.active }); load(); };
  const del = async (r) => { if (!confirm(`Delete ${r.name}?`)) return; await api.delete(`/admin/restaurants/${r.id}`); load(); };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display font-black text-3xl text-[#4A0E2E]">Restaurants</h1>
        <button onClick={() => setOpen(true)} data-testid="add-restaurant-btn" className="bg-[#4A0E2E] text-white font-bold text-sm px-4 py-2 rounded-full flex items-center gap-1.5"><Plus size={16}/> Add Restaurant</button>
      </div>
      <div className="mt-5 bg-white rounded-2xl border border-brand-cream overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-brand-warm text-left text-xs uppercase text-slate-500 font-bold">
            <tr><th className="p-3">Restaurant</th><th className="p-3">Today Sales</th><th className="p-3">Month Sales</th><th className="p-3">Total Sales</th><th className="p-3">Orders</th><th className="p-3">Commission</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-brand-cream">
            {rests.map(r => (
              <tr key={r.id}>
                <td className="p-3"><div className="flex items-center gap-2"><img src={fileUrl(r.logo_url)} className="w-9 h-9 rounded-lg object-cover"/><div><div className="font-bold text-[#4A0E2E]">{r.name}</div><div className="text-xs text-slate-500">{r.area}</div></div></div></td>
                <td className="p-3 font-bold">{inr(r.stats?.today_sales)}</td>
                <td className="p-3 font-bold">{inr(r.stats?.month_sales)}</td>
                <td className="p-3 font-bold">{inr(r.stats?.total_sales)}</td>
                <td className="p-3">{r.stats?.total_orders || 0}</td>
                <td className="p-3 text-brand-gold font-bold">{inr(r.stats?.commission_paid)}</td>
                <td className="p-3"><button onClick={() => toggle(r)} data-testid="super-admin-restaurant-toggle" className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${r.active ? "bg-brand-mint/15 text-brand-mint" : "bg-red-100 text-red-500"}`}>{r.active ? "Active" : "Suspended"}</button></td>
                <td className="p-3"><button onClick={() => del(r)} className="p-1.5 text-red-500"><Trash2 size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Restaurant</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <ImageUpload value={form.logo_url} onChange={v => setForm({...form, logo_url: v})} label="Logo" aspect="aspect-square"/>
            <ImageUpload value={form.cover_url} onChange={v => setForm({...form, cover_url: v})} label="Cover" aspect="aspect-square"/>
          </div>
          {[["name","Name"],["tagline","Tagline"],["address","Address"],["area","Area"],["phone","Phone"]].map(([k,l])=>(
            <input key={k} placeholder={l} value={form[k]||""} onChange={e=>setForm({...form,[k]:e.target.value})} className="w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm"/>
          ))}
          <input placeholder="Cuisines (comma-separated)" value={Array.isArray(form.cuisines)?form.cuisines.join(", "):form.cuisines} onChange={e=>setForm({...form,cuisines:e.target.value})} className="w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm"/>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" placeholder="Delivery mins" value={form.delivery_time_mins} onChange={e=>setForm({...form,delivery_time_mins:parseInt(e.target.value)||0})} className="bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm"/>
            <input type="number" placeholder="Delivery fee" value={form.delivery_fee} onChange={e=>setForm({...form,delivery_fee:parseFloat(e.target.value)||0})} className="bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm"/>
            <input type="number" placeholder="Min order" value={form.min_order} onChange={e=>setForm({...form,min_order:parseFloat(e.target.value)||0})} className="bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm"/>
          </div>
          <div className="pt-2 border-t border-brand-cream">
            <div className="text-xs font-bold uppercase text-slate-500 mb-2">Restaurant Admin Account</div>
            <input placeholder="Admin name" value={form.admin_name} onChange={e=>setForm({...form,admin_name:e.target.value})} className="w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm mb-2"/>
            <input placeholder="Admin email" value={form.admin_email} onChange={e=>setForm({...form,admin_email:e.target.value})} className="w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm mb-2"/>
            <input type="password" placeholder="Admin password" value={form.admin_password} onChange={e=>setForm({...form,admin_password:e.target.value})} className="w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm"/>
          </div>
          <Button onClick={save} className="bg-[#4A0E2E] hover:bg-[#3A0A24] w-full">Create</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
