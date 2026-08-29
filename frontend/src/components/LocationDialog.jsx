import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin, Loader2, Search, LocateFixed, Home } from "lucide-react";
import { useLocation } from "@/context/LocationContext";
import api, { formatErr } from "@/lib/api";
import { toast } from "sonner";

const POPULAR = [
  { city: "Sasaram", state: "Bihar", formatted: "Sasaram, Bihar", area: "Sasaram", pincode: "821115" },
  { city: "Patna", state: "Bihar", formatted: "Patna, Bihar", area: "Patna", pincode: "800001" },
  { city: "Varanasi", state: "Uttar Pradesh", formatted: "Varanasi, UP", area: "Varanasi", pincode: "221001" },
  { city: "Gaya", state: "Bihar", formatted: "Gaya, Bihar", area: "Gaya", pincode: "823001" },
];

export default function LocationDialog({ open, onOpenChange }) {
  const { location, setLocation } = useLocation();
  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef();

  useEffect(() => {
    if (!open) { setGpsError(""); setQuery(""); setResults([]); }
  }, [open]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get("/geocode/search", { params: { q: query } });
        setResults(data);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const useGps = () => {
    setGpsError("");
    if (!("geolocation" in navigator)) {
      setGpsError("Your browser doesn't support location. Please pick manually.");
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          const { data } = await api.get("/geocode/reverse", { params: { lat, lng } });
          setLocation({ ...data, source: "gps" });
          toast.success(`Location set to ${data.city || data.area || "your area"}`);
          onOpenChange(false);
        } catch (e) {
          setGpsError(formatErr(e));
        } finally { setGpsBusy(false); }
      },
      (err) => {
        setGpsBusy(false);
        if (err.code === 1) setGpsError("Location permission was denied. Please enable location access or select manually.");
        else if (err.code === 2) setGpsError("Unable to detect your location. Please try again or select manually.");
        else if (err.code === 3) setGpsError("Location request timed out. Please try again or select manually.");
        else setGpsError("Unable to detect your location. Please try again or select manually.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const pick = (loc) => {
    setLocation({ ...loc, source: "manual" });
    toast.success(`Delivering to ${loc.city || loc.area || "your location"}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-lg max-h-[92vh] overflow-y-auto p-0">
        <div className="p-5 border-b border-brand-cream">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-2xl text-[#4A0E2E] flex items-center gap-2"><MapPin className="text-brand-gold" size={20}/> Set delivery location</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">Pick your location so we can show restaurants that deliver to you.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-5 space-y-4">
          <button
            onClick={useGps} disabled={gpsBusy}
            data-testid="use-current-location-btn"
            className="w-full bg-gradient-to-br from-[#4A0E2E] to-[#3A0A24] text-white rounded-2xl px-4 py-4 flex items-center gap-3 hover:shadow-lift transition disabled:opacity-70"
          >
            <div className="w-11 h-11 rounded-xl bg-brand-gold text-[#4A0E2E] flex items-center justify-center">
              {gpsBusy ? <Loader2 className="animate-spin" size={20}/> : <LocateFixed size={22}/>}
            </div>
            <div className="text-left flex-1">
              <div className="font-black text-base flex items-center gap-1.5">📍 Use Current Location</div>
              <div className="text-xs text-white/70">Detect your GPS location automatically</div>
            </div>
          </button>
          {gpsError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">
              {gpsError}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-testid="location-search-input"
              placeholder="🔍 Search area, city or pincode"
              className="w-full bg-brand-warm border border-brand-cream rounded-xl pl-10 pr-3 py-3 text-sm outline-none focus:border-[#4A0E2E]"
            />
          </div>

          {searching && <div className="text-center text-slate-500 text-sm py-2 flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={14}/> Searching…</div>}
          {results.length > 0 && (
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => pick(r)}
                  data-testid="location-result"
                  className="w-full flex items-start gap-3 text-left px-3 py-2.5 rounded-xl hover:bg-brand-warm border border-transparent hover:border-brand-cream transition"
                >
                  <MapPin size={16} className="text-brand-gold shrink-0 mt-0.5"/>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-[#4A0E2E] truncate">{r.city || r.area || "Unknown"}, {r.state}</div>
                    <div className="text-xs text-slate-500 truncate">{r.formatted}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.length === 0 && !searching && query.length >= 2 && (
            <div className="text-center text-slate-500 text-sm py-2">No results found</div>
          )}

          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Popular cities</div>
            <div className="grid grid-cols-2 gap-2">
              {POPULAR.map(p => (
                <button
                  key={p.city}
                  onClick={() => pick(p)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-brand-warm hover:bg-white border border-brand-cream text-left transition"
                >
                  <Home size={14} className="text-brand-gold"/>
                  <div>
                    <div className="text-sm font-bold text-[#4A0E2E]">{p.city}</div>
                    <div className="text-[10px] text-slate-500">{p.state}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {location.city && (
            <div className="text-xs text-slate-500 pt-2 border-t border-brand-cream">
              Currently delivering to <b className="text-[#4A0E2E]">{location.formatted}</b> · {location.source === "gps" ? "detected by GPS" : location.source === "manual" ? "manually set" : "default"}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
