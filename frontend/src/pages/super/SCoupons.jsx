import { useEffect, useState } from "react";
import api, { formatErr } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const EMPTY = { code: "", description: "", discount_type: "percent", discount_value: 10, min_order: 0, max_discount: null, usage_limit: 1000, active: true };

export default function SCoupons() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get("/admin/coupons").then(({ data }) => setItems(data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try { await api.post("/admin/coupons", form); toast.success("Coupon created"); setOpen(false); setForm(EMPTY); load(); }
    catch (e) { toast.error(formatErr(e)); }
  };
  const del = async (id) => { await api.delete(`/admin/coupons/${id}`); load(); };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display font-black text-3xl text-[#4A0E2E]">Coupons</h1>
        <button onClick={() => setOpen(true)} className="bg-[#4A0E2E] text-white font-bold text-sm px-4 py-2 rounded-full flex items-center gap-1.5"><Plus size={16}/> New Coupon</button>
      </div>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-brand-cream p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display font-black text-xl text-[#4A0E2E]">{c.code}</div>
                <div className="text-xs text-slate-500 mt-0.5">{c.description}</div>
                <div className="text-xs text-slate-400 mt-1">Min ₹{c.min_order} · {c.discount_type==="percent"?`${c.discount_value}%`:`₹${c.discount_value}`} off</div>
              </div>
              <button onClick={() => del(c.id)} className="p-1.5 text-red-500"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white">
          <DialogHeader><DialogTitle>New Coupon</DialogTitle></DialogHeader>
          <input placeholder="Code (e.g. FUDORA20)" value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} className="w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm uppercase"/>
          <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm"/>
          <div className="grid grid-cols-2 gap-2">
            <select value={form.discount_type} onChange={e=>setForm({...form,discount_type:e.target.value})} className="bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm">
              <option value="percent">Percent</option><option value="flat">Flat</option>
            </select>
            <input type="number" placeholder="Discount value" value={form.discount_value} onChange={e=>setForm({...form,discount_value:parseFloat(e.target.value)||0})} className="bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm"/>
            <input type="number" placeholder="Min order" value={form.min_order} onChange={e=>setForm({...form,min_order:parseFloat(e.target.value)||0})} className="bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm"/>
            <input type="number" placeholder="Max discount (opt)" value={form.max_discount||""} onChange={e=>setForm({...form,max_discount:e.target.value?parseFloat(e.target.value):null})} className="bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm"/>
          </div>
          <Button onClick={save} className="bg-[#4A0E2E] hover:bg-[#3A0A24] w-full">Create</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
