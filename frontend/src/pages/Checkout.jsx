import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import api, { formatErr, inr } from "@/lib/api";
import { toast } from "sonner";
import { Ticket, MapPin, Check } from "lucide-react";

export default function Checkout() {
  const { user } = useAuth();
  const { cart, subtotal, count, clear } = useCart();
  const nav = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [addr, setAddr] = useState({ label: "Home", name: user?.name || "", phone: user?.phone || "", line1: "", area: "GT Road", city: "Sasaram", pincode: "821115", landmark: "" });
  const [savedId, setSavedId] = useState(null);
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(null);
  const [payment, setPayment] = useState("cod");
  const [placing, setPlacing] = useState(false);
  const placedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    api.get("/me/addresses").then(({ data }) => {
      setAddresses(data);
      if (data.length) { setSavedId(data[0].id); setAddr(data[0]); }
    });
  }, [user]);

  useEffect(() => { if (count === 0 && !placedRef.current) nav("/"); }, [count, nav]);
  useEffect(() => { if (!user) nav("/login?redirect=/checkout"); }, [user, nav]);

  const discount = applied?.discount || 0;
  const delivery = cart.restaurant?.delivery_fee || 0;
  const tax = (subtotal - discount) * 0.05;
  const total = subtotal - discount + delivery + tax;

  const applyCoupon = async () => {
    if (!coupon.trim()) { toast.error("Please enter a coupon code"); return; }
    try {
      const { data } = await api.post("/coupons/validate", null, { params: { code: coupon, subtotal } });
      setApplied({ discount: data.discount, code: coupon });
      toast.success(`Coupon applied: ${inr(data.discount)} off`);
    } catch (e) { toast.error(formatErr(e)); setApplied(null); }
  };

  const placeOrder = async () => {
    if (!addr.line1 || !addr.name || !addr.phone) return toast.error("Complete delivery address");
    setPlacing(true);
    try {
      if (savedId === "new") {
        try { await api.post("/me/addresses", addr); } catch {}
      }
      const items = cart.items.map(i => ({ product_id: i.product.id, quantity: i.qty }));
      const { data } = await api.post("/orders", {
        restaurant_id: cart.restaurant.id, items, address: addr,
        coupon_code: applied?.code || null, payment_method: payment,
      });
      placedRef.current = true;
      nav(`/orders/${data.id}?new=1`, { replace: true });
      clear();
      toast.success(`Order placed: ${data.id}`);
    } catch (e) { toast.error(formatErr(e)); }
    finally { setPlacing(false); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display font-black text-3xl text-[#4A0E2E]">Checkout</h1>

      <section className="mt-5 bg-white rounded-2xl border border-brand-cream p-4">
        <h3 className="font-bold text-[#4A0E2E] flex items-center gap-2"><MapPin size={16} /> Delivery Address</h3>
        {addresses.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {addresses.map(a => (
              <button key={a.id} onClick={() => { setSavedId(a.id); setAddr(a); }}
                className={`px-3 py-2 rounded-xl text-left text-sm border ${savedId === a.id ? "border-[#4A0E2E] bg-brand-warm" : "border-brand-cream bg-white"}`}>
                <div className="font-bold">{a.label}</div>
                <div className="text-xs text-slate-500 truncate max-w-[180px]">{a.line1}, {a.area}</div>
              </button>
            ))}
            <button onClick={() => { setSavedId("new"); setAddr({ label: "Home", name: user?.name, phone: user?.phone || "", line1: "", area: "GT Road", city: "Sasaram", pincode: "821115", landmark: "" }); }}
              className={`px-3 py-2 rounded-xl text-sm border font-bold ${savedId === "new" ? "border-[#4A0E2E] bg-brand-warm" : "border-brand-cream bg-white"}`}>+ New</button>
          </div>
        )}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[["name","Full name"],["phone","Phone"],["line1","House / Street"],["area","Area / Locality"],["pincode","Pincode"],["landmark","Landmark"]].map(([k,l]) => (
            <input key={k} placeholder={l} value={addr[k] || ""}
              onChange={(e) => setAddr({...addr, [k]: e.target.value})}
              className="w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#4A0E2E]" />
          ))}
        </div>
      </section>

      <section className="mt-4 bg-white rounded-2xl border border-brand-cream p-4">
        <h3 className="font-bold text-[#4A0E2E] flex items-center gap-2"><Ticket size={16} /> Coupon</h3>
        <div className="mt-3 flex gap-2">
          <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Enter code (try FUDORA50)" className="flex-1 bg-brand-warm border border-brand-cream rounded-lg px-3 py-2.5 text-sm outline-none uppercase" />
          <button onClick={applyCoupon} className="bg-[#4A0E2E] text-white font-bold text-sm px-5 rounded-lg">Apply</button>
        </div>
        {applied && <div className="mt-2 flex items-center gap-1.5 text-brand-mint text-sm font-bold"><Check size={14}/> {inr(applied.discount)} off applied</div>}
      </section>

      <section className="mt-4 bg-white rounded-2xl border border-brand-cream p-4">
        <h3 className="font-bold text-[#4A0E2E]">Payment</h3>
        <div className="mt-3 space-y-2">
          <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${payment==="cod"?"border-[#4A0E2E] bg-brand-warm":"border-brand-cream"}`}>
            <input type="radio" checked={payment==="cod"} onChange={() => setPayment("cod")} />
            <div><div className="font-bold text-sm">Cash on Delivery</div><div className="text-xs text-slate-500">Pay when the food arrives</div></div>
          </label>
          <label className={`flex items-center gap-3 p-3 rounded-lg border opacity-60 cursor-not-allowed`}>
            <input type="radio" disabled />
            <div><div className="font-bold text-sm">Online Payment</div><div className="text-xs text-slate-500">Coming soon (Razorpay / UPI)</div></div>
          </label>
        </div>
      </section>

      <section className="mt-4 bg-white rounded-2xl border border-brand-cream p-4 text-sm">
        <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><b>{inr(subtotal)}</b></div>
        {discount > 0 && <div className="flex justify-between text-brand-mint"><span>Coupon discount</span><b>−{inr(discount)}</b></div>}
        <div className="flex justify-between"><span className="text-slate-600">Delivery</span><b>{inr(delivery)}</b></div>
        <div className="flex justify-between"><span className="text-slate-600">Tax (5%)</span><b>{inr(tax)}</b></div>
        <div className="pt-2 mt-2 border-t border-brand-cream flex justify-between text-base"><b>Total</b><b className="text-[#4A0E2E]">{inr(total)}</b></div>
      </section>

      <button onClick={placeOrder} disabled={placing}
        data-testid="checkout-place-order-button"
        className="mt-5 w-full bg-brand-gold hover:bg-amber-500 text-[#4A0E2E] font-black text-base py-4 rounded-2xl shadow-lift disabled:opacity-60">
        {placing ? "Placing…" : `Place Order · ${inr(total)}`}
      </button>
    </div>
  );
}
