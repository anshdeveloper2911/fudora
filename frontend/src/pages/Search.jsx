import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import api, { fileUrl, inr } from "@/lib/api";
import RestaurantCard from "@/components/RestaurantCard";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [text, setText] = useState(q);
  const [result, setResult] = useState({ restaurants: [], products: [] });

  useEffect(() => {
    const id = setTimeout(() => {
      if (text.trim().length >= 1) {
        api.get("/search", { params: { q: text } }).then(({ data }) => setResult(data));
        setParams({ q: text });
      } else {
        setResult({ restaurants: [], products: [] });
      }
    }, 250);
    return () => clearTimeout(id);
  }, [text, setParams]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-2 bg-white border border-brand-cream rounded-full p-1.5 shadow-warm">
        <SearchIcon className="ml-3 text-slate-400" size={18} />
        <input autoFocus value={text} onChange={(e) => setText(e.target.value)}
          data-testid="search-input"
          placeholder="Search 'biryani', 'pizza', 'thali'…"
          className="flex-1 bg-transparent outline-none text-sm py-2" />
      </div>

      {text.length < 1 && (
        <div className="mt-6">
          <h3 className="font-display font-bold text-lg text-[#4A0E2E]">Popular in Sasaram</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Biryani", "Thali", "Momos", "Pizza", "Cake", "Paneer", "Chinese"].map(s => (
              <button key={s} onClick={() => setText(s)} className="px-3 py-1.5 bg-white border border-brand-cream rounded-full text-sm font-semibold text-[#4A0E2E] hover:bg-brand-warm">{s}</button>
            ))}
          </div>
        </div>
      )}

      {result.restaurants?.length > 0 && (
        <section className="mt-6">
          <h3 className="font-display font-bold text-xl text-[#4A0E2E]">Restaurants</h3>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.restaurants.map(r => <RestaurantCard key={r.id} r={r} />)}
          </div>
        </section>
      )}

      {result.products?.length > 0 && (
        <section className="mt-8">
          <h3 className="font-display font-bold text-xl text-[#4A0E2E]">Dishes</h3>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.products.map(p => (
              <Link key={p.id} to={`/r/${p.restaurant_id}`} className="flex gap-3 bg-white p-3 rounded-2xl border border-brand-cream hover:shadow-warm">
                <img src={fileUrl(p.image_url)} className="w-20 h-20 rounded-xl object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#4A0E2E] truncate">{p.name}</h4>
                  <p className="text-xs text-slate-500 truncate">{p.description}</p>
                  <div className="mt-1 font-bold text-sm">{inr(p.discount_price || p.price)}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {text.length >= 1 && result.restaurants?.length === 0 && result.products?.length === 0 && (
        <div className="mt-16 text-center text-slate-500">No results for "{text}"</div>
      )}
    </div>
  );
}
