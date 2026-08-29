import { Link } from "react-router-dom";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { inr } from "@/lib/api";

export default function FloatingCart() {
  const { count, subtotal, cart } = useCart();
  return (
    <Link
      to="/cart"
      data-testid="floating-cart"
      className="fixed left-3 right-3 md:right-6 md:left-auto md:w-96 bottom-20 md:bottom-6 z-30 bg-[#4A0E2E] text-white rounded-2xl shadow-lift px-4 py-3 flex items-center gap-3 hover:bg-[#3A0A24] transition"
    >
      <div className="w-11 h-11 rounded-xl bg-brand-gold text-[#4A0E2E] flex items-center justify-center">
        <ShoppingCart size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate">{count} Item{count>1?"s":""} · {inr(subtotal)}</div>
        <div className="text-xs text-white/70 truncate">from {cart.restaurant?.name}</div>
      </div>
      <div className="flex items-center gap-1 text-sm font-bold">View Cart <ArrowRight size={16} /></div>
    </Link>
  );
}
