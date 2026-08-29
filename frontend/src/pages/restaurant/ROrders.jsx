import { useEffect, useRef, useState } from "react";
import api, { inr, formatErr } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle, Bell, BellOff, Volume2 } from "lucide-react";
import { chime, vibratePhone, primeAudio } from "@/lib/sound";
import { askPermission, notifPermission, fireNotification } from "@/lib/notify";

const FLOW = { pending: ["accepted", "rejected"], accepted: ["preparing"], preparing: ["ready"], ready: ["out_for_delivery"], out_for_delivery: ["completed"] };
const ALERT_KEY = "fudora_admin_alerts";

export default function ROrders() {
  const [orders, setOrders] = useState([]);
  const [alerts, setAlerts] = useState(() => localStorage.getItem(ALERT_KEY) !== "off");
  const seenPending = useRef(null); // Set<orderId>, null until first load
  const hydrated = useRef(false);

  const load = async () => {
    try {
      const { data } = await api.get("/restaurant/orders");
      setOrders(data);
      const pendingIds = new Set(data.filter(o => o.status === "pending").map(o => o.id));
      if (seenPending.current === null) {
        seenPending.current = pendingIds;
      } else {
        const fresh = [...pendingIds].filter(id => !seenPending.current.has(id));
        if (fresh.length > 0 && hydrated.current && alerts) {
          const newest = data.find(o => o.id === fresh[0]);
          if (newest) {
            chime(); vibratePhone();
            fireNotification("New Fudora order 🔔", `${newest.customer_name} — ${inr(newest.total)} · #${newest.id}`, `order-${newest.id}`);
            toast.success(`New order from ${newest.customer_name} · ${inr(newest.total)}`, { duration: 6000 });
          }
        }
        seenPending.current = pendingIds;
      }
      hydrated.current = true;
    } catch {}
  };

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); /* eslint-disable-line */ }, []);

  const toggleAlerts = async () => {
    if (!alerts) {
      // Turning on — prime audio + request notif permission from user gesture
      primeAudio();
      chime(); vibratePhone([90]);
      if (notifPermission() === "default") await askPermission();
      localStorage.setItem(ALERT_KEY, "on"); setAlerts(true);
      toast.success("Sound & notifications enabled");
    } else {
      localStorage.setItem(ALERT_KEY, "off"); setAlerts(false);
      toast("Alerts muted");
    }
  };

  const update = async (id, status) => {
    try { await api.patch(`/orders/${id}/status`, { status }); toast.success(`Order → ${status.replace(/_/g," ")}`); load(); }
    catch (e) { toast.error(formatErr(e)); }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="font-display font-black text-3xl text-[#4A0E2E]">Orders</h1>
        <button onClick={toggleAlerts} data-testid="toggle-alerts"
          className={`px-3 py-2 rounded-full text-xs font-black uppercase flex items-center gap-1.5 border transition ${alerts ? "bg-brand-mint/15 text-brand-mint border-brand-mint" : "bg-white text-slate-400 border-brand-cream"}`}>
          {alerts ? <><Bell size={13}/> Sound + Push ON</> : <><BellOff size={13}/> Alerts OFF</>}
        </button>
      </div>
      {alerts && notifPermission() === "default" && (
        <div className="mt-3 flex items-center gap-2 bg-brand-gold/15 border border-brand-gold text-[#4A0E2E] rounded-xl px-3 py-2 text-xs font-semibold">
          <Volume2 size={14}/> Tap the sound button once to allow browser notifications so you never miss a new order.
        </div>
      )}
      <div className="mt-5 grid gap-3">
        {orders.map(o => (
          <div key={o.id} className={`bg-white rounded-2xl border p-4 ${o.status === "pending" ? "border-brand-gold shadow-warm" : "border-brand-cream"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display font-bold text-[#4A0E2E]">#{o.id}</div>
                <div className="text-xs text-slate-500">{o.customer_name} · {o.customer_phone}</div>
                <div className="text-xs text-slate-400 mt-0.5">{new Date(o.created_at).toLocaleString()}</div>
              </div>
              <div className="text-right shrink-0">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-gold/20 text-[#4A0E2E]">{o.status.replace(/_/g," ")}</span>
                <div className="mt-1 font-bold">{inr(o.total)}</div>
                <div className="text-[10px] text-slate-400 uppercase">{o.payment_method}</div>
              </div>
            </div>
            <div className="mt-3 text-sm text-slate-600 space-y-0.5">
              {o.items.map((i, idx) => <div key={idx}>{i.quantity}× {i.name}</div>)}
            </div>
            <div className="mt-3 text-xs text-slate-500 bg-brand-warm rounded-lg p-2">
              <b>{o.address.name}</b> · {o.address.phone}<br/>
              {o.address.line1}, {o.address.area}, {o.address.city} {o.address.pincode}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(FLOW[o.status] || []).map(next => (
                <button key={next} onClick={() => update(o.id, next)}
                  data-testid={next === "accepted" ? "restaurant-admin-order-accept-btn" : next === "ready" ? "restaurant-admin-order-ready-btn" : `order-${next}`}
                  className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${next === "rejected" ? "bg-red-100 text-red-600" : "bg-[#4A0E2E] text-white"}`}>
                  {next === "accepted" && <CheckCircle size={12} className="inline mr-1"/>} {next.replace(/_/g," ")}
                </button>
              ))}
            </div>
          </div>
        ))}
        {orders.length === 0 && <div className="text-center py-16 text-slate-500">No orders yet</div>}
      </div>
    </div>
  );
}
