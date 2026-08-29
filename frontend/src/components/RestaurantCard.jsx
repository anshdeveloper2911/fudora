import { Link } from "react-router-dom";
import { Star, Clock, IndianRupee } from "lucide-react";
import { fileUrl, inr } from "@/lib/api";

export default function RestaurantCard({ r }) {
  return (
    <Link to={`/r/${r.id}`} data-testid="restaurant-card-item"
      className="group block bg-white rounded-2xl overflow-hidden border border-brand-cream hover:shadow-lift transition-all">
      <div className="relative aspect-[16/10] overflow-hidden bg-brand-warm">
        <img src={fileUrl(r.cover_url)} alt={r.name} loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {!r.active && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="bg-white text-slate-800 font-black text-xs px-3 py-1 rounded-full">CURRENTLY CLOSED</span></div>}
        {r.is_veg_only && <span className="absolute top-3 left-3 bg-white text-[10px] font-bold text-brand-mint border border-brand-mint px-2 py-1 rounded-full">PURE VEG</span>}
        {r.is_demo && <span className="absolute top-3 right-3 bg-brand-gold text-[#4A0E2E] text-[10px] font-black px-2 py-1 rounded-full">SAMPLE</span>}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-[17px] text-[#4A0E2E] truncate">{r.name}</h3>
            <p className="text-xs text-slate-500 truncate mt-0.5">{r.cuisines?.join(" · ")}</p>
          </div>
          <div className="flex items-center gap-1 bg-brand-mint/10 text-brand-mint font-bold text-xs px-2 py-1 rounded-md shrink-0">
            <Star size={11} fill="currentColor" /> {(r.rating || 4.3).toFixed(1)}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-600 font-medium">
          <span className="flex items-center gap-1"><Clock size={12} />{r.delivery_time_mins}–{r.delivery_time_mins+7} min</span>
          <span className="flex items-center gap-1"><IndianRupee size={12} />{inr(r.min_order)} min</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500 truncate">{r.area}</span>
        </div>
      </div>
    </Link>
  );
}
