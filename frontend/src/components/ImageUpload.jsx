import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import api, { fileUrl, formatErr } from "@/lib/api";
import { toast } from "sonner";

export default function ImageUpload({ value, onChange, label = "Upload Image", aspect = "aspect-video" }) {
  const inputRef = useRef();
  const [busy, setBusy] = useState(false);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(f.type)) {
      toast.error("Only JPG, PNG, WebP allowed"); return;
    }
    if (f.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }
    setBusy(true);
    try {
      const fd = new FormData(); fd.append("file", f);
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(data.url);
      toast.success("Uploaded");
    } catch (e) { toast.error(formatErr(e)); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  };

  return (
    <div className={`relative ${aspect} w-full rounded-xl border-2 border-dashed border-brand-cream bg-brand-warm/50 overflow-hidden group`}>
      {value ? (
        <>
          <img src={fileUrl(value)} alt="preview" className="w-full h-full object-cover" />
          <button type="button" onClick={() => onChange("")}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white rounded-full p-1.5">
            <X size={14} />
          </button>
        </>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-[#4A0E2E] transition">
          {busy ? <Loader2 className="animate-spin" size={22} /> : <Upload size={22} />}
          <span className="text-sm font-semibold">{busy ? "Uploading…" : label}</span>
          <span className="text-[11px] text-slate-400">JPG · PNG · WebP · max 5MB</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="hidden" />
      {value && !busy && (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="absolute bottom-2 right-2 bg-white/90 border border-brand-cream text-[#4A0E2E] text-xs font-bold rounded-full px-3 py-1">
          Replace
        </button>
      )}
    </div>
  );
}
