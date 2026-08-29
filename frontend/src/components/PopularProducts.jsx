import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Minus, Star, Clock } from "lucide-react";
import api, { fileUrl, inr } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function PopularProducts() {
  const { config } = useSiteConfig();
  const ps = config.popular_section || {};
  const [items, setItems] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const { cart, addItem, setQty, replaceWith } = useCart();

  useEffect(() => { api.get("/popular-products").then(({ data }) => setItems(data)).catch(() => {}); }, []);

  if (!ps.enabled || items.length === 0) return null;

  const onAdd = (p) => {
    const rest = { id: p.restaurant.id, name: p.restaurant.name, delivery_fee: p.restaurant.delivery_fee, min_order: p.restaurant.min_order, logo_url: p.restaurant.logo_url };
    addItem(rest, p, (r, prod) => setConfirm({ r, p: prod }));
  };

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-14">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display font-black text-3xl md:text-4xl text-[#4A0E2E]">{ps.title || "Popular near you"}</h2>
        <Link to="/restaurants" className="text-sm font-bold text-brand-gold hover:underline">See all →</Link>
      </div>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
        {items.map((p) => {
          const line = cart.items.find(i => i.product.id === p.id);
          const qty = line?.qty || 0;
          const finalPrice = p.discount_price || p.price;
          const hasDiscount = p.discount_price && p.discount_price < p.price;
          return (
            <div key={p.id} data-testid="popular-product-card"
              className="bg-white rounded-2xl border border-brand-cream overflow-hidden flex flex-col hover:shadow-lift transition">
              <Link to={`/r/${p.restaurant_id}`} className="relative aspect-[4/3] bg-brand-warm">
                <img src={fileUrl(p.image_url)} loading="lazy" alt={p.name} className="w-full h-full object-cover" />
                {hasDiscount && <span className="absolute top-2 left-2 bg-brand-mint text-white text-[10px] font-black px-2 py-0.5 rounded-full">{Math.round((1 - p.discount_price / p.price) * 100)}% OFF</span>}
                <span className={`absolute top-2 right-2 inline-flex w-4 h-4 border-2 rounded-sm items-center justify-center bg-white ${p.is_veg ? "border-brand-mint" : "border-red-500"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${p.is_veg ? "bg-brand-mint" : "bg-red-500"}`} />
                </span>
              </Link>
              <div className="p-3 flex-1 flex flex-col">
                <h4 className="font-display font-bold text-sm md:text-base text-[#1E1810] leading-tight line-clamp-2">{p.name}</h4>
                <Link to={`/r/${p.restaurant_id}`} className="mt-1 text-xs text-slate-500 truncate hover:text-[#4A0E2E]">{p.restaurant?.name}</Link>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-bold text-[#4A0E2E]">{inr(finalPrice)}</span>
                  {hasDiscount && <span className="text-xs text-slate-400 line-through">{inr(p.price)}</span>}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wide font-bold">
                  <Clock size={10}/> {p.restaurant?.delivery_time_mins || 30} min
                </div>
                <div className="mt-3">
                  {qty === 0 ? (
                    <button
                      onClick={() => onAdd(p)}
                      data-testid="popular-add-btn"
                      disabled={!p.restaurant?.active}
                      className="w-full bg-white border-2 border-brand-gold text-[#4A0E2E] font-black text-xs uppercase rounded-lg py-1.5 hover:bg-brand-gold transition disabled:opacity-50"
                    >{p.restaurant?.active ? "ADD" : "CLOSED"}</button>
                  ) : (
                    <div className="flex items-center justify-between bg-white border-2 border-brand-gold rounded-lg overflow-hidden">
                      <button onClick={() => setQty(p.id, qty - 1)} className="p-1.5 text-[#4A0E2E] hover:bg-brand-gold/20"><Minus size={13}/></button>
                      <span className="font-black text-sm text-[#4A0E2E]">{qty}</span>
                      <button onClick={() => setQty(p.id, qty + 1)} className="p-1.5 text-[#4A0E2E] hover:bg-brand-gold/20"><Plus size={13}/></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="bg-white">
          <DialogHeader><DialogTitle>Replace items in cart?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Your cart contains items from <b>{cart.restaurant?.name}</b>. Adding from <b>{confirm?.r.name}</b> will clear it.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button className="bg-[#4A0E2E] hover:bg-[#3A0A24]" onClick={() => { const rest = { id: confirm.r.id, name: confirm.r.name, delivery_fee: confirm.r.delivery_fee, min_order: confirm.r.min_order, logo_url: confirm.r.logo_url }; replaceWith(rest, confirm.p); setConfirm(null); }}>Clear & Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
