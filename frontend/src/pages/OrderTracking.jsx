import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import api, { inr, formatErr } from "@/lib/api";
import { Check, Clock, PartyPopper, Star, Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { askPermission, notifPermission, fireNotification, notifSupported } from "@/lib/notify";

const STAGES = [
  { key: "pending", label: "Order Placed", msg: "We've received your order" },
  { key: "accepted", label: "Restaurant Accepted", msg: "Restaurant accepted your order" },
  { key: "preparing", label: "Preparing Food", msg: "Your food is being prepared" },
  { key: "ready", label: "Food Ready", msg: "Your food is ready" },
  { key: "out_for_delivery", label: "Out for Delivery", msg: "Your order is on the way" },
  { key: "completed", label: "Delivered", msg: "Order delivered — enjoy!" },
];

export default function OrderTracking() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const isNew = params.get("new");
  const [order, setOrder] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [perm, setPerm] = useState(notifPermission());
  const lastStatus = useRef(null);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        if (cancel) return;
        setOrder(prev => {
          if (prev && data.status !== prev.status) {
            const stage = STAGES.find(s => s.key === data.status);
            if (stage) {
              fireNotification("Fudora — order update", stage.msg, `track-${id}`);
              toast.success(stage.msg, { duration: 5000 });
            }
          }
          lastStatus.current = data.status;
          return data;
        });
      } catch {}
    };
    load();
    const t = setInterval(load, 5000);
    return () => { cancel = true; clearInterval(t); };
  }, [id]);

  const enableNotif = async () => {
    const p = await askPermission();
    setPerm(p);
    if (p === "granted") toast.success("Notifications enabled — we'll ping you on updates");
    else if (p === "denied") toast.error("Notifications blocked — enable them in your browser settings");
  };

  if (!order) return <div className="p-8 text-center text-slate-500">Loading order…</div>;

  const currentIdx = STAGES.findIndex(s => s.key === order.status);
  const isTerminal = ["cancelled", "rejected"].includes(order.status);

  const submitReview = async () => {
    try {
      await api.post("/reviews", { order_id: order.id, rating, comment });
      toast.success("Thanks for your review!");
      setSubmitted(true);
    } catch (e) { toast.error(formatErr(e)); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {isNew && (
        <div className="bg-gradient-to-r from-brand-mint to-emerald-600 text-white rounded-2xl p-5 flex items-center gap-3 shadow-lift">
          <PartyPopper size={32} className="text-white shrink-0"/>
          <div>
            <div className="font-display font-black text-xl text-white">Order placed!</div>
            <div className="text-sm text-white/95">The restaurant will confirm shortly.</div>
          </div>
        </div>
      )}

      {notifSupported() && perm !== "granted" && !isTerminal && order.status !== "completed" && (
        <button onClick={enableNotif} data-testid="enable-push-btn"
          className="mt-4 w-full bg-brand-gold/15 hover:bg-brand-gold/25 border border-brand-gold text-[#4A0E2E] rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-bold transition">
          <Bell size={16}/> {perm === "denied" ? "Notifications blocked — enable in browser settings" : "Get a phone notification when your order status changes"}
        </button>
      )}

      <div className="mt-5 bg-white rounded-2xl border border-brand-cream p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Order ID</div>
            <div className="font-display font-black text-xl text-[#4A0E2E]">#{order.id}</div>
          </div>
          <span data-testid="order-status-badge" className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
            order.status === "completed" ? "bg-brand-mint/15 text-brand-mint" :
            isTerminal ? "bg-red-100 text-red-600" : "bg-brand-gold/20 text-[#4A0E2E]"
          }`}>{order.status.replace(/_/g," ")}</span>
        </div>
        <div className="mt-1 text-sm text-slate-500">From <b className="text-[#4A0E2E]">{order.restaurant_name}</b></div>

        {!isTerminal && (
          <div data-testid="order-tracking-timeline" className="mt-6 space-y-4">
            {STAGES.map((s, idx) => {
              const done = idx <= currentIdx;
              const active = idx === currentIdx;
              return (
                <div key={s.key} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${done ? "bg-brand-mint" : "bg-slate-200"} ${active ? "ring-4 ring-brand-mint/25 animate-pulse" : ""}`}>
                      {done ? <Check size={16} /> : <Clock size={14} className="text-slate-500" />}
                    </div>
                    {idx < STAGES.length - 1 && <div className={`w-0.5 flex-1 min-h-[24px] ${done ? "bg-brand-mint" : "bg-slate-200"}`} />}
                  </div>
                  <div className="pb-2">
                    <div className={`font-bold text-sm ${done ? "text-[#4A0E2E]" : "text-slate-400"}`}>{s.label}</div>
                    {active && <div className="text-xs text-brand-mint font-bold">In progress…</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 bg-white rounded-2xl border border-brand-cream p-5">
        <h3 className="font-bold text-[#4A0E2E]">Order Summary</h3>
        <div className="mt-3 space-y-1.5">
          {order.items.map((it, idx) => (
            <div key={idx} className="flex justify-between text-sm"><span>{it.quantity} × {it.name}</span><b>{inr(it.line_total)}</b></div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-brand-cream space-y-1 text-sm">
          <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{inr(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-brand-mint"><span>Coupon</span><span>−{inr(order.discount)}</span></div>}
          <div className="flex justify-between text-slate-600"><span>Delivery + Tax</span><span>{inr(order.delivery_fee + order.tax)}</span></div>
          <div className="flex justify-between font-bold text-[#4A0E2E] text-base pt-1"><span>Total</span><span>{inr(order.total)}</span></div>
          <div className="text-xs text-slate-400 uppercase">Payment · {order.payment_method}</div>
        </div>
      </div>

      {order.status === "completed" && !submitted && (
        <div className="mt-4 bg-white rounded-2xl border border-brand-cream p-5">
          <h3 className="font-bold text-[#4A0E2E]">Rate your order</h3>
          <div className="mt-2 flex gap-1">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setRating(n)}>
                <Star size={26} className={n <= rating ? "fill-brand-gold text-brand-gold" : "text-slate-300"} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
            className="mt-2 w-full bg-brand-warm border border-brand-cream rounded-lg px-3 py-2 text-sm outline-none" placeholder="Tell us how it was…" />
          <button onClick={submitReview} disabled={!rating}
            className="mt-2 bg-[#4A0E2E] text-white font-bold text-sm px-5 py-2 rounded-full disabled:opacity-50">Submit Review</button>
        </div>
      )}

      <Link to="/orders" className="mt-6 block text-center text-sm font-bold text-[#4A0E2E]">← Back to my orders</Link>
    </div>
  );
}
