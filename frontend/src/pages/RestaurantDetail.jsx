import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Star, Clock, IndianRupee, MapPin, Heart } from "lucide-react";
import api, { fileUrl } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function RestaurantDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [r, setR] = useState(null);
  const [prods, setProds] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState("All");
  const [fav, setFav] = useState(false);

  useEffect(() => {
    api.get(`/restaurants/${id}`).then(({ data }) => setR(data));
    api.get(`/restaurants/${id}/products`).then(({ data }) => setProds(data));
    api.get(`/restaurants/${id}/reviews`).then(({ data }) => setReviews(data));
  }, [id]);

  const categories = useMemo(() => {
    const set = new Set(prods.map(p => p.category_name).filter(Boolean));
    return ["All", ...set];
  }, [prods]);
  const visible = tab === "All" ? prods : prods.filter(p => p.category_name === tab);

  const toggleFav = async () => {
    if (!user) { toast.error("Please login to favourite"); return; }
    const { data } = await api.post(`/me/favourites/toggle`, null, { params: { type: "restaurant", id } });
    setFav(data.favourited);
  };

  if (!r) return <div className="p-8 text-center text-slate-500">Loading…</div>;

  return (
    <div>
      <div className="relative aspect-[16/8] sm:aspect-[16/6] bg-brand-warm">
        <img src={fileUrl(r.cover_url)} alt={r.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button onClick={toggleFav} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:scale-105">
          <Heart size={18} className={fav ? "fill-red-500 text-red-500" : "text-slate-600"} />
        </button>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
        <div className="bg-white rounded-2xl border border-brand-cream shadow-warm p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <img src={fileUrl(r.logo_url)} alt="" className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-brand-cream" />
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-black text-2xl sm:text-3xl text-[#4A0E2E]">{r.name}</h1>
              <p className="text-sm text-slate-500 truncate">{r.cuisines?.join(" · ")}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={11} />{r.address}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 bg-brand-mint/10 text-brand-mint font-bold px-2 py-1 rounded-md text-sm">
                <Star size={13} fill="currentColor" /> {(r.rating || 4.3).toFixed(1)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{r.review_count || 0} reviews</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-brand-cream flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5"><Clock size={14} className="text-brand-gold" /><b>{r.delivery_time_mins}–{r.delivery_time_mins+7} min</b></div>
            <div className="flex items-center gap-1.5"><IndianRupee size={14} className="text-brand-gold" /><b>₹{r.min_order}</b> min · <b>₹{r.delivery_fee}</b> delivery</div>
            {r.active ? <span className="text-brand-mint font-bold">🟢 Open now</span> : <span className="text-red-500 font-bold">🔴 Closed</span>}
          </div>
        </div>

        <div className="mt-6 sticky top-16 z-20 bg-brand-cream py-2 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
          {categories.map(c => (
            <button key={c} onClick={() => setTab(c)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition ${tab === c ? "bg-[#4A0E2E] text-white border-[#4A0E2E]" : "bg-white text-[#4A0E2E] border-brand-cream"}`}>
              {c}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 pb-6">
          {visible.map(p => <ProductCard key={p.id} product={p} restaurant={r} />)}
          {visible.length === 0 && <div className="py-16 text-center text-slate-500">No items in this category</div>}
        </div>

        {reviews.length > 0 && (
          <div className="mt-6 pb-8">
            <h3 className="font-display font-black text-xl text-[#4A0E2E]">Reviews</h3>
            <div className="mt-3 space-y-3">
              {reviews.slice(0, 5).map(rv => (
                <div key={rv.id} className="bg-white p-4 rounded-xl border border-brand-cream">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-warm flex items-center justify-center font-bold text-[#4A0E2E] text-xs">{rv.customer_name?.[0]}</div>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{rv.customer_name}</div>
                      <div className="flex items-center text-xs text-brand-gold">{"★".repeat(rv.rating)}<span className="text-slate-200">{"★".repeat(5-rv.rating)}</span></div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{rv.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
