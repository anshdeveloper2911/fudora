import { useEffect, useState } from "react";
import api, { formatErr } from "@/lib/api";
import { useSiteConfig } from "@/context/SiteConfigContext";
import ImageUpload from "@/components/ImageUpload";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save, Trash2, Plus, RotateCcw } from "lucide-react";

function TextField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <input type={type} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4A0E2E]" />
    </label>
  );
}
function TextArea({ label, value, onChange, rows = 3 }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <textarea rows={rows} value={value || ""} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4A0E2E]" />
    </label>
  );
}
function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm font-bold text-[#4A0E2E]">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export default function SCustomization() {
  const { config, refresh } = useSiteConfig();
  const [draft, setDraft] = useState(config);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(config); }, [config]);

  const set = (key, val) => setDraft(d => ({ ...d, [key]: val }));
  const setNested = (section, key, val) => setDraft(d => ({ ...d, [section]: { ...d[section], [key]: val } }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        announcement: draft.announcement,
        branding: draft.branding,
        hero: draft.hero,
        offers_section: draft.offers_section,
        popular_section: draft.popular_section,
        restaurants_section: draft.restaurants_section,
        footer: draft.footer,
      };
      await api.patch("/admin/site-config", payload);
      toast.success("Website updated");
      refresh();
    } catch (e) { toast.error(formatErr(e)); }
    finally { setSaving(false); }
  };

  const reset = () => { setDraft(config); toast("Draft reset to published version"); };

  const addColumn = () => setNested("footer", "columns", [...(draft.footer.columns || []), { title: "New Column", links: [] }]);
  const removeColumn = (idx) => setNested("footer", "columns", draft.footer.columns.filter((_, i) => i !== idx));
  const setColumn = (idx, patch) => setNested("footer", "columns", draft.footer.columns.map((c, i) => i === idx ? { ...c, ...patch } : c));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-black text-3xl text-[#4A0E2E]">Website Customization</h1>
          <p className="text-sm text-slate-500">Edit every section of your customer-facing homepage without touching code.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="px-4 py-2 rounded-full text-sm font-bold border border-brand-cream text-slate-600 hover:bg-brand-warm flex items-center gap-1.5"><RotateCcw size={14}/> Reset</button>
          <button onClick={save} disabled={saving} data-testid="site-config-save"
            className="px-5 py-2 rounded-full text-sm font-black bg-[#4A0E2E] text-white hover:bg-[#3A0A24] flex items-center gap-1.5 disabled:opacity-60">
            <Save size={14}/> {saving ? "Saving…" : "Publish Changes"}
          </button>
        </div>
      </div>

      <Tabs defaultValue="branding" className="mt-6">
        <TabsList className="bg-white border border-brand-cream rounded-full p-1 flex flex-wrap gap-1 h-auto">
          {["branding","announcement","hero","categories","offers","popular","restaurants","footer"].map(t => (
            <TabsTrigger key={t} value={t} className="rounded-full px-4 py-1.5 text-xs font-bold uppercase data-[state=active]:bg-[#4A0E2E] data-[state=active]:text-white">{t}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="branding" className="mt-4 bg-white rounded-2xl border border-brand-cream p-5 space-y-3 max-w-2xl">
          <TextField label="Website name" value={draft.branding?.name} onChange={v => setNested("branding","name",v)} />
          <TextField label="Tagline" value={draft.branding?.tagline} onChange={v => setNested("branding","tagline",v)} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Primary color (hex)" value={draft.branding?.primary_color} onChange={v => setNested("branding","primary_color",v)} placeholder="#4A0E2E"/>
            <TextField label="Accent color (hex)" value={draft.branding?.accent_color} onChange={v => setNested("branding","accent_color",v)} placeholder="#F59E0B"/>
          </div>
        </TabsContent>

        <TabsContent value="announcement" className="mt-4 bg-white rounded-2xl border border-brand-cream p-5 space-y-3 max-w-2xl">
          <Toggle label="Show announcement bar at the top of every page" checked={draft.announcement?.enabled} onChange={v => setNested("announcement","enabled",v)} />
          <TextArea label="Announcement text (supports emoji)" value={draft.announcement?.text} onChange={v => setNested("announcement","text",v)} rows={2}/>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Background color" value={draft.announcement?.bg} onChange={v => setNested("announcement","bg",v)} placeholder="#4A0E2E"/>
            <TextField label="Text color" value={draft.announcement?.fg} onChange={v => setNested("announcement","fg",v)} placeholder="#F59E0B"/>
          </div>
        </TabsContent>

        <TabsContent value="hero" className="mt-4 bg-white rounded-2xl border border-brand-cream p-5 space-y-3 max-w-2xl">
          <Toggle label="Show hero section on homepage" checked={draft.hero?.enabled} onChange={v => setNested("hero","enabled",v)} />
          <ImageUpload value={draft.hero?.image_url} onChange={v => setNested("hero","image_url",v)} label="Hero image" aspect="aspect-video"/>
          <TextField label="Small badge above heading" value={draft.hero?.badge_text} onChange={v => setNested("hero","badge_text",v)} />
          <TextField label="Heading — line 1" value={draft.hero?.heading_line1} onChange={v => setNested("hero","heading_line1",v)} />
          <TextField label="Heading — line 2" value={draft.hero?.heading_line2} onChange={v => setNested("hero","heading_line2",v)} />
          <TextArea label="Subheading" value={draft.hero?.subheading} onChange={v => setNested("hero","subheading",v)} rows={2}/>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="CTA button text" value={draft.hero?.cta_text} onChange={v => setNested("hero","cta_text",v)} />
            <TextField label="CTA link" value={draft.hero?.cta_link} onChange={v => setNested("hero","cta_link",v)} />
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-4 bg-white rounded-2xl border border-brand-cream p-5 max-w-2xl">
          <p className="text-sm text-slate-600 mb-3">Food categories are managed on a dedicated page with image upload, reorder and enable/disable.</p>
          <a href="/super/categories" className="inline-block bg-[#4A0E2E] text-white font-bold text-sm px-5 py-2.5 rounded-full">Manage Categories →</a>
        </TabsContent>

        <TabsContent value="offers" className="mt-4 bg-white rounded-2xl border border-brand-cream p-5 space-y-3 max-w-2xl">
          <Toggle label="Show offers section on homepage" checked={draft.offers_section?.enabled} onChange={v => setNested("offers_section","enabled",v)} />
          <TextField label="Section title" value={draft.offers_section?.title} onChange={v => setNested("offers_section","title",v)} />
          <p className="text-xs text-slate-500">Coupons themselves are managed on <a href="/super/coupons" className="text-brand-gold font-bold hover:underline">Super Admin → Coupons</a>.</p>
        </TabsContent>

        <TabsContent value="popular" className="mt-4 bg-white rounded-2xl border border-brand-cream p-5 space-y-3 max-w-2xl">
          <Toggle label="Show 'Popular near you' section" checked={draft.popular_section?.enabled} onChange={v => setNested("popular_section","enabled",v)} />
          <TextField label="Section title" value={draft.popular_section?.title} onChange={v => setNested("popular_section","title",v)} />
          <TextField type="number" label="Number of products displayed" value={draft.popular_section?.limit} onChange={v => setNested("popular_section","limit",parseInt(v)||8)} />
          <TextArea label="Product IDs (comma-separated, leave blank to auto-fill with bestsellers)"
            value={(draft.popular_section?.product_ids || []).join(", ")}
            onChange={v => setNested("popular_section","product_ids", v.split(",").map(s => s.trim()).filter(Boolean))} rows={2}/>
        </TabsContent>

        <TabsContent value="restaurants" className="mt-4 bg-white rounded-2xl border border-brand-cream p-5 space-y-3 max-w-2xl">
          <Toggle label="Show restaurants section on homepage" checked={draft.restaurants_section?.enabled} onChange={v => setNested("restaurants_section","enabled",v)} />
          <TextField label="Section title" value={draft.restaurants_section?.title} onChange={v => setNested("restaurants_section","title",v)} />
          <p className="text-xs text-slate-500">Restaurants themselves are managed on <a href="/super/restaurants" className="text-brand-gold font-bold hover:underline">Super Admin → Restaurants</a>.</p>
        </TabsContent>

        <TabsContent value="footer" className="mt-4 bg-white rounded-2xl border border-brand-cream p-5 space-y-3 max-w-3xl">
          <TextArea label="Footer description" value={draft.footer?.description} onChange={v => setNested("footer","description",v)}/>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Phone" value={draft.footer?.phone} onChange={v => setNested("footer","phone",v)}/>
            <TextField label="Email" value={draft.footer?.email} onChange={v => setNested("footer","email",v)}/>
          </div>
          <TextField label="Address" value={draft.footer?.address} onChange={v => setNested("footer","address",v)}/>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Social links</div>
            <div className="grid grid-cols-2 gap-2">
              {["instagram","facebook","twitter","youtube","whatsapp"].map(k => (
                <TextField key={k} label={k} value={draft.footer?.socials?.[k]} onChange={v => setNested("footer","socials", { ...(draft.footer?.socials||{}), [k]: v })} placeholder="https://…"/>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Columns</div>
              <button onClick={addColumn} className="text-xs font-bold text-brand-gold flex items-center gap-1"><Plus size={12}/> Add column</button>
            </div>
            <div className="mt-2 space-y-3">
              {(draft.footer?.columns || []).map((c, idx) => (
                <div key={idx} className="bg-brand-warm border border-brand-cream rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input value={c.title} onChange={e => setColumn(idx, { title: e.target.value })} className="flex-1 bg-white border border-brand-cream rounded-lg px-3 py-1.5 text-sm font-bold"/>
                    <button onClick={() => removeColumn(idx)} className="p-1.5 text-red-500"><Trash2 size={14}/></button>
                  </div>
                  {c.links.map((lk, li) => (
                    <div key={li} className="grid grid-cols-2 gap-2">
                      <input placeholder="Label" value={lk.label} onChange={e => setColumn(idx, { links: c.links.map((x, xi) => xi === li ? { ...x, label: e.target.value } : x) })} className="bg-white border border-brand-cream rounded-lg px-3 py-1.5 text-xs"/>
                      <div className="flex gap-1">
                        <input placeholder="URL" value={lk.url} onChange={e => setColumn(idx, { links: c.links.map((x, xi) => xi === li ? { ...x, url: e.target.value } : x) })} className="flex-1 bg-white border border-brand-cream rounded-lg px-3 py-1.5 text-xs"/>
                        <button onClick={() => setColumn(idx, { links: c.links.filter((_, xi) => xi !== li) })} className="p-1.5 text-red-500"><Trash2 size={12}/></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setColumn(idx, { links: [...c.links, { label: "New Link", url: "/" }] })} className="text-[11px] font-bold text-brand-gold">+ Add link</button>
                </div>
              ))}
            </div>
          </div>
          <TextField label="Copyright text" value={draft.footer?.copyright} onChange={v => setNested("footer","copyright",v)}/>
        </TabsContent>
      </Tabs>
    </div>
  );
}
