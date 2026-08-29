import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, Leaf } from "lucide-react";
import api from "@/lib/api";
import RestaurantCard from "@/components/RestaurantCard";

export default function Restaurants() {
  const [params] = useSearchParams();
  const [rests, setRests] = useState([]);
  const [sort, setSort] = useState("recommended");
  const [vegOnly, setVegOnly] = useState(false);
  const cuisine = params.get("cuisine");

  useEffect(() => {
    api.get("/restaurants", { params: { cuisine: cuisine || undefined } }).then(({ data }) => setRests(data));
  }, [cuisine]);

  const filtered = useMemo(() => {
    let list = [...rests];
    if (vegOnly) list = list.filter(r => r.is_veg_only);
    if (sort === "rating") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sort === "delivery") list.sort((a, b) => a.delivery_time_mins - b.delivery_time_mins);
    return list;
  }, [rests, vegOnly, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div>
        <h1 className="font-display font-black text-3xl text-[#4A0E2E]">
          {cuisine ? `${cuisine} restaurants` : "All restaurants"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">{filtered.length} places · Sasaram</p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button onClick={() => setVegOnly(!vegOnly)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition ${vegOnly ? "bg-brand-mint text-white border-brand-mint" : "bg-white text-[#4A0E2E] border-brand-cream"}`}>
          <Leaf size={13} /> Pure Veg
        </button>
        {["recommended", "rating", "delivery"].map(s => (
          <button key={s} onClick={() => setSort(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize border transition ${sort === s ? "bg-[#4A0E2E] text-white border-[#4A0E2E]" : "bg-white text-[#4A0E2E] border-brand-cream"}`}>
            {s === "delivery" ? "Delivery Time" : s === "rating" ? "Top Rated" : "Recommended"}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(r => <RestaurantCard key={r.id} r={r} />)}
      </div>
      {filtered.length === 0 && (
        <div className="mt-16 text-center text-slate-500">
          <Filter className="mx-auto mb-2" />
          No restaurants match these filters
        </div>
      )}
    </div>
  );
}
