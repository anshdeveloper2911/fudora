import { Link, useNavigate } from "react-router-dom";
import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { fileUrl, inr } from "@/lib/api";

export default function Cart() {
  const { cart, setQty, subtotal, count, clear } = useCart();
  const nav = useNavigate();
  const deliveryFee = cart.restaurant?.delivery_fee || 0;
  const tax = subtotal * 0.05;
  const total = subtotal + deliveryFee + tax;

  if (count === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 rounded-full bg-brand-warm mx-auto flex items-center justify-center"><ShoppingCart className="text-[#4A0E2E]" size={40} /></div>
        <h2 className="mt-4 font-display font-black text-2xl text-[#4A0E2E]">Your cart is empty</h2>
        <p className="text-slate-500 text-sm mt-1">Discover restaurants and add items to get started.</p>
        <Link to="/restaurants" className="mt-6 inline-block bg-[#4A0E2E] text-white font-bold text-sm px-6 py-3 rounded-full">Browse Restaurants</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-black text-3xl text-[#4A0E2E]">Your Cart</h1>
        <button onClick={clear} className="text-sm font-semibold text-red-500 flex items-center gap-1"><Trash2 size={14}/>Clear</button>
      </div>
      <div className="mt-2 text-sm text-slate-500">From <b className="text-[#4A0E2E]">{cart.restaurant?.name}</b></div>

      <div className="mt-5 bg-white rounded-2xl border border-brand-cream divide-y divide-brand-cream">
        {cart.items.map(i => {
          const price = i.product.discount_price || i.product.price;
          return (
            <div key={i.product.id} className="p-4 flex gap-3 items-center">
              <img src={fileUrl(i.product.image_url)} className="w-16 h-16 rounded-xl object-cover shrink-0" alt="" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[#4A0E2E] truncate">{i.product.name}</h4>
                <div className="text-xs text-slate-500">{inr(price)} each</div>
              </div>
              <div className="flex items-center bg-brand-warm rounded-full">
                <button onClick={() => setQty(i.product.id, i.qty - 1)} className="w-8 h-8 flex items-center justify-center text-[#4A0E2E]"><Minus size={14} /></button>
                <span className="w-8 text-center font-bold text-sm">{i.qty}</span>
                <button onClick={() => setQty(i.product.id, i.qty + 1)} className="w-8 h-8 flex items-center justify-center text-[#4A0E2E]"><Plus size={14} /></button>
              </div>
              <div className="w-20 text-right font-bold text-[#4A0E2E]">{inr(price * i.qty)}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 bg-white rounded-2xl border border-brand-cream p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-bold">{inr(subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">Delivery fee</span><span className="font-bold">{inr(deliveryFee)}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">Tax (5%)</span><span className="font-bold">{inr(tax)}</span></div>
        <div className="pt-2 border-t border-brand-cream flex justify-between text-base">
          <span className="font-bold">Total</span><span className="font-display font-black text-[#4A0E2E]">{inr(total)}</span>
        </div>
      </div>

      <button onClick={() => nav("/checkout")}
        data-testid="proceed-to-checkout"
        className="mt-5 w-full bg-brand-gold hover:bg-amber-500 text-[#4A0E2E] font-black text-base py-4 rounded-2xl shadow-lift">
        Proceed to Checkout · {inr(total)}
      </button>
    </div>
  );
}
