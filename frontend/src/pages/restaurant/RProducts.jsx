import { useEffect, useState } from "react";
import api, { inr, formatErr, fileUrl } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Edit, Trash2, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const EMPTY = { name: "", description: "", price: 0, discount_price: null, category_name: "", image_url: "", is_veg: true, is_bestseller: false, is_recommended: false, available: true, prep_time_mins: 20 };

export default function RProducts() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get(`/restaurants/${user.restaurant_id}/products`).then(({ data }) => setItems(data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      if (editing) await api.patch(`/restaurant/products/${editing}`, form);
      else await api.post(`/restaurant/products`, form);
      toast.success("Saved"); setOpen(false); setForm(EMPTY); setEditing(null); load();
    } catch (e) { toast.error(formatErr(e)); }
  };
  const del = async (id) => { if (!confirm("Delete this item?")) return; await api.delete(`/restaurant/products/${id}`); load(); };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display font-black text-3xl text-[#4A0E2E]">Menu</h1>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setOpen(true); }} data-testid="restaurant-admin-add-product-btn"
          className="bg-[#4A0E2E] text-white font-bold text-sm px-4 py-2 rounded-full flex items-center gap-1.5"><Plus size={16}/> Add Product</button>
      </div>
      <div className="mt-5 grid gap-3">
        {items.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-brand-cream p-3 flex items-center gap-3">
            <img src={fileUrl(p.image_url)} className="w-16 h-16 rounded-xl object-cover shrink-0 bg-brand-warm" alt=""/>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[#4A0E2E] truncate">{p.name}</div>
              <div className="text-xs text-slate-500 truncate">{p.category_name}</div>
              <div className="mt-1 text-sm font-bold">{inr(p.discount_price || p.price)}</div>
            </div>
            <button onClick={() => { setEditing(p.id); setForm({...p}); setOpen(true); }} className="p-2 text-[#4A0E2E]"><Edit size={16}/></button>
            <button onClick={() => del(p.id)} className="p-2 text-red-500"><Trash2 size={16}/></button>
          </div>
        ))}
        {items.length === 0 && <div className="text-slate-500 text-center py-16">No menu items yet. Click "Add Product".</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} product</DialogTitle></DialogHeader>
          <ImageUpload value={form.image_url} onChange={(v) => setForm({...form, image_url: v})} label="Upload product image" />
          <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm"/>
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm"/>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Price" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value) || 0})} className="bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm"/>
            <input type="number" placeholder="Discount price" value={form.discount_price || ""} onChange={e => setForm({...form, discount_price: e.target.value ? parseFloat(e.target.value) : null})} className="bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm"/>
          </div>
          <input placeholder="Category (Starters, Main Course…)" value={form.category_name} onChange={e => setForm({...form, category_name: e.target.value})} className="w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm"/>
          <div className="flex flex-wrap gap-2 text-sm">
            <label className="flex items-center gap-1"><input type="checkbox" checked={form.is_veg} onChange={e => setForm({...form, is_veg: e.target.checked})}/> Veg</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={form.is_bestseller} onChange={e => setForm({...form, is_bestseller: e.target.checked})}/> Bestseller</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={form.is_recommended} onChange={e => setForm({...form, is_recommended: e.target.checked})}/> Recommended</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={form.available} onChange={e => setForm({...form, available: e.target.checked})}/> Available</label>
          </div>
          <Button onClick={save} className="bg-[#4A0E2E] hover:bg-[#3A0A24] w-full">Save</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
