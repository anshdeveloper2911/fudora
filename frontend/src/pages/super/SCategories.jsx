import { useEffect, useState } from "react";
import api, { fileUrl, formatErr } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, Edit, GripVertical, EyeOff, Eye } from "lucide-react";

const EMPTY = { name: "", image_url: "", display_order: 100, active: true };

export default function SCategories() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    const { data } = await api.get("/admin/platform-categories");
    setItems(data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    try {
      if (editing) await api.patch(`/admin/platform-categories/${editing}`, form);
      else await api.post("/admin/platform-categories", form);
      toast.success("Saved");
      setOpen(false); setForm(EMPTY); setEditing(null);
      load();
    } catch (e) { toast.error(formatErr(e)); }
  };
  const del = async (id) => {
    if (!confirm("Delete this category?")) return;
    try { await api.delete(`/admin/platform-categories/${id}`); load(); }
    catch (e) { toast.error(formatErr(e)); }
  };
  const move = async (item, delta) => {
    const idx = items.findIndex(i => i.id === item.id);
    const swap = items[idx + delta];
    if (!swap) return;
    await api.patch(`/admin/platform-categories/${item.id}`, { display_order: swap.display_order });
    await api.patch(`/admin/platform-categories/${swap.id}`, { display_order: item.display_order });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display font-black text-3xl text-[#4A0E2E]">Food Categories</h1>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setOpen(true); }}
          data-testid="add-category-btn"
          className="bg-[#4A0E2E] text-white font-bold text-sm px-4 py-2 rounded-full flex items-center gap-1.5">
          <Plus size={16}/> Add Category
        </button>
      </div>
      <p className="mt-1 text-sm text-slate-500">These appear on the customer homepage. Add a large realistic food image for each category.</p>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((c, i) => (
          <div key={c.id} data-testid="scategory-card" className="bg-white rounded-2xl border border-brand-cream overflow-hidden">
            <div className="aspect-square bg-brand-warm">
              {c.image_url ? <img src={fileUrl(c.image_url)} alt={c.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No image</div>}
            </div>
            <div className="p-3">
              <div className="font-bold text-[#4A0E2E] truncate">{c.name}</div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Order {c.display_order}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                <button onClick={() => { setEditing(c.id); setForm(c); setOpen(true); }} className="p-1.5 text-[#4A0E2E] hover:bg-brand-warm rounded" title="Edit"><Edit size={14}/></button>
                <button onClick={() => move(c, -1)} disabled={i === 0} className="p-1.5 text-slate-500 hover:bg-brand-warm rounded disabled:opacity-30" title="Up">↑</button>
                <button onClick={() => move(c, 1)} disabled={i === items.length - 1} className="p-1.5 text-slate-500 hover:bg-brand-warm rounded disabled:opacity-30" title="Down">↓</button>
                <button onClick={() => del(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded ml-auto" title="Delete"><Trash2 size={14}/></button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="col-span-full text-center text-slate-500 py-16">No categories yet.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} category</DialogTitle>
            <DialogDescription>Upload a realistic food photo. It appears on the customer home page.</DialogDescription>
          </DialogHeader>
          <ImageUpload value={form.image_url} onChange={(v) => setForm({...form, image_url: v})} label="Upload category image" aspect="aspect-square" />
          <input data-testid="category-name-input" placeholder="Name (e.g. Biryani)" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm"/>
          <input data-testid="category-order-input" type="number" placeholder="Display order" value={form.display_order} onChange={e => setForm({...form, display_order: parseInt(e.target.value)||0})}
            className="w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm"/>
          <label className="flex items-center gap-2 text-sm"><input data-testid="category-active-toggle" type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})}/> Visible to customers</label>
          <Button onClick={save} data-testid="category-save-btn" className="bg-[#4A0E2E] hover:bg-[#3A0A24] w-full">Save</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
