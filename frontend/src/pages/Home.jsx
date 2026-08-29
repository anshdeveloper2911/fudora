import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Sparkles, Zap, Search, Percent, MapPin } from "lucide-react";
import api from "@/lib/api";
import RestaurantCard from "@/components/RestaurantCard";
import PopularProducts from "@/components/PopularProducts";
import { useLocation } from "@/context/LocationContext";
import { useSiteConfig } from "@/context/SiteConfigContext";

export default function Home() {
  const [rests, setRests] = useState([]);
  const [offers, setOffers] = useState([]);
  const [cats, setCats] = useState([]);
  const { location } = useLocation();
  const { config } = useSiteConfig();
  const nav = useNavigate();

  useEffect(() => {
    api.get("/restaurants").then(({ data }) => setRests(data)).catch(() => {});
    api.get("/offers").then(({ data }) => setOffers(data)).catch(() => {});
    api.get("/platform-categories").then(({ data }) => setCats(data)).catch(() => {});
  }, []);

  const top = [...rests].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8);
  const cityMismatch = location.city && location.city.toLowerCase() !== "sasaram" && location.source !== "default";

  const hero = config.hero || {};
  const offersS = config.offers_section || {};
  const restsS = config.restaurants_section || {};

  return (
    <div>
      {/* Hero */}
      {hero.enabled !== false && (
        <section className="relative overflow-hidden bg-gradient-to-br from-[#4A0E2E] via-[#5A1338] to-[#3A0A24] text-white">
          <div className="absolute inset-0 opacity-25"
            style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #F59E0B 0px, transparent 40%), radial-gradient(circle at 80% 70%, #10B981 0px, transparent 40%)" }} />
          <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-24 grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7">
              {hero.badge_text && (
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-gold">
                  <Sparkles size={13} /> {hero.badge_text}
                </div>
              )}
              <h1 className="mt-5 font-display font-black text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
                {hero.heading_line1 || "Delicious food,"}<br />
                <span className="text-brand-gold">{(hero.heading_line2 || "delivered to your door.").split(" ")[0]}</span>{" "}
                {(hero.heading_line2 || "delivered to your door.").split(" ").slice(1).join(" ")}
              </h1>
              <p className="mt-5 text-white/70 text-base sm:text-lg lg:text-xl max-w-xl">{hero.subheading}</p>
              <form onSubmit={(e) => { e.preventDefault(); nav(`/search?q=${encodeURIComponent(new FormData(e.target).get("q") || "")}`); }}
                className="mt-7 flex gap-2 bg-white rounded-full p-1.5 shadow-lift max-w-xl">
                <Search className="ml-3 self-center text-slate-400" size={18} />
                <input name="q" placeholder="Search for restaurants, food or cuisines"
                  className="flex-1 bg-transparent text-slate-800 placeholder:text-slate-400 outline-none text-sm" />
                <button className="bg-brand-gold hover:bg-amber-500 text-[#4A0E2E] font-black text-sm px-6 py-2.5 rounded-full">Search</button>
              </form>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={hero.cta_link || "/restaurants"} className="inline-flex items-center gap-1.5 bg-brand-gold text-[#4A0E2E] font-black text-sm px-6 py-3 rounded-full hover:bg-amber-500">
                  {hero.cta_text || "Explore Restaurants"} <ChevronRight size={16} />
                </Link>
                <Link to="/offers" className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-white/20">
                  <Percent size={14} /> View Offers
                </Link>
              </div>
            </div>
            {hero.image_url && (
              <div className="hidden md:block relative md:col-span-5">
                <div className="aspect-square rounded-[2rem] overflow-hidden shadow-lift rotate-3">
                  <img src={hero.image_url} alt="food" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-5 -left-5 bg-white text-[#4A0E2E] rounded-2xl p-4 shadow-lift">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-brand-mint"><Zap size={14} /> Fast Delivery</div>
                  <div className="mt-1 font-display font-black text-2xl leading-none">25–30 min</div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {cityMismatch && (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-brand-gold/15 border border-brand-gold text-[#4A0E2E] rounded-2xl px-4 py-3 text-sm flex items-start gap-2">
            <MapPin size={16} className="text-brand-gold mt-0.5 shrink-0"/>
            <div>
              <b>Fudora is currently live only in Sasaram.</b> We couldn't find restaurants delivering to <b>{location.city}</b> yet — we're expanding fast, stay tuned!
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <h2 className="font-display font-black text-3xl md:text-4xl text-[#4A0E2E]">What's on your mind?</h2>
        <div className="mt-6 flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4 snap-x">
          {cats.map((c) => (
            <Link key={c.id} to={`/restaurants?cuisine=${encodeURIComponent(c.name)}`} data-testid="category-item"
              className="shrink-0 flex flex-col items-center gap-2 group snap-start">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-brand-warm shadow-warm ring-4 ring-white group-hover:ring-brand-gold/50 group-hover:shadow-lift transition-all">
                <img src={c.image_url} alt={c.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <span className="text-sm md:text-base font-bold text-[#4A0E2E] group-hover:text-brand-gold transition">{c.name}</span>
            </Link>
          ))}
          {cats.length === 0 && <div className="text-slate-400 text-sm py-8">Loading categories…</div>}
        </div>
      </section>

      {/* Offers */}
      {offersS.enabled !== false && offers.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-14">
          <h2 className="font-display font-black text-3xl md:text-4xl text-[#4A0E2E]">{offersS.title || "Best offers for you"}</h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {offers.slice(0, 3).map((o) => (
              <div key={o.id} className="bg-gradient-to-br from-[#4A0E2E] to-[#3A0A24] text-white rounded-2xl p-6 relative overflow-hidden">
                <Percent className="absolute -right-4 -bottom-4 text-brand-gold/20" size={160} />
                <div className="relative">
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-gold">{o.discount_type === "percent" ? `${o.discount_value}% OFF` : `₹${o.discount_value} OFF`}</div>
                  <div className="mt-2 font-display font-black text-3xl">{o.code}</div>
                  <p className="text-sm text-white/70 mt-2">{o.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Popular Products */}
      <PopularProducts />

      {/* Top Restaurants */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display font-black text-3xl md:text-4xl text-[#4A0E2E]">Top rated restaurants</h2>
          <Link to="/restaurants" className="text-sm font-bold text-brand-gold hover:underline">See all →</Link>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {top.map((r) => <RestaurantCard key={r.id} r={r} />)}
          {top.length === 0 && <div className="col-span-full text-center py-12 text-slate-500">Loading restaurants…</div>}
        </div>
      </section>

      {restsS.enabled !== false && (
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-14">
          <h2 className="font-display font-black text-3xl md:text-4xl text-[#4A0E2E]">{restsS.title || "All restaurants near you"}</h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {rests.map((r) => <RestaurantCard key={r.id} r={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
