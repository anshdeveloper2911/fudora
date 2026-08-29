import { useState } from "react";
import { Plus, Minus, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { fileUrl, inr } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ProductCard({ product, restaurant }) {
  const { cart, addItem, setQty, replaceWith } = useCart();
  const line = cart.items.find(i => i.product.id === product.id);
  const qty = line?.qty || 0;
  const [confirm, setConfirm] = useState(null);

  const onAdd = () => {
    addItem(restaurant, product, (r, p) => setConfirm({ r, p }));
  };

  const finalPrice = product.discount_price || product.price;
  const hasDiscount = product.discount_price && product.discount_price < product.price;

  return (
    <>
      <div className="flex gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-brand-cream" data-testid="product-card">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-flex w-4 h-4 border-2 rounded-sm items-center justify-center ${product.is_veg ? "border-brand-mint" : "border-red-500"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${product.is_veg ? "bg-brand-mint" : "bg-red-500"}`} />
            </span>
            {product.is_bestseller && <span className="text-[10px] font-black text-brand-gold uppercase">★ Bestseller</span>}
            {product.is_recommended && !product.is_bestseller && <span className="text-[10px] font-black text-[#4A0E2E] uppercase">Chef's Pick</span>}
          </div>
          <h4 className="font-display font-bold text-[15px] sm:text-base text-[#1E1810] mt-1 leading-tight">{product.name}</h4>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-bold text-[#4A0E2E]">{inr(finalPrice)}</span>
            {hasDiscount && <span className="text-xs text-slate-400 line-through">{inr(product.price)}</span>}
            {hasDiscount && <span className="text-[10px] font-black text-brand-mint">{Math.round((1 - product.discount_price / product.price) * 100)}% OFF</span>}
          </div>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">{product.description}</p>
        </div>
        <div className="w-24 sm:w-28 shrink-0">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-brand-warm">
            {product.image_url && <img src={fileUrl(product.image_url)} alt={product.name} loading="lazy" className="w-full h-full object-cover" />}
          </div>
          <div className="mt-2 relative">
            {qty === 0 ? (
              <button
                onClick={onAdd}
                disabled={!product.available}
                data-testid="food-item-add-button"
                className="w-full bg-white border-2 border-brand-gold text-[#4A0E2E] font-black text-sm uppercase rounded-lg py-1.5 hover:bg-brand-gold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.available ? "ADD" : "OUT"}
              </button>
            ) : (
              <div className="flex items-center justify-between bg-white border-2 border-brand-gold rounded-lg overflow-hidden">
                <button onClick={() => setQty(product.id, qty - 1)} data-testid="food-item-quantity-decrement" className="p-1.5 text-[#4A0E2E] hover:bg-brand-gold/20"><Minus size={14} /></button>
                <span className="font-black text-sm text-[#4A0E2E]">{qty}</span>
                <button onClick={() => setQty(product.id, qty + 1)} data-testid="food-item-quantity-increment" className="p-1.5 text-[#4A0E2E] hover:bg-brand-gold/20"><Plus size={14} /></button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="bg-white">
          <DialogHeader><DialogTitle>Replace items in cart?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Your cart contains items from <b>{cart.restaurant?.name}</b>. Adding from <b>{confirm?.r.name}</b> will clear it.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button className="bg-[#4A0E2E] hover:bg-[#3A0A24]" onClick={() => { replaceWith(confirm.r, confirm.p); setConfirm(null); }}>Clear & Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
