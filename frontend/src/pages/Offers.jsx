import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Percent, Copy, Check, Gift } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import ReferralCard from "@/components/ReferralCard";

export default function Offers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [copied, setCopied] = useState(null);
  useEffect(() => {
    api.get("/offers").then(({ data }) => setOffers(data));
    if (user) api.get("/me/coupons").then(({ data }) => setPersonal(data)).catch(() => {});
  }, [user]);

  const copy = (code) => {
    navigator.clipboard.writeText(code); setCopied(code); toast.success("Code copied");
    setTimeout(() => setCopied(null), 1200);
  };

  const Card = ({ o, personalStyle }) => (
    <div className={`relative rounded-2xl p-5 overflow-hidden ${personalStyle ? "bg-gradient-to-br from-brand-gold to-amber-600 text-[#4A0E2E]" : "bg-gradient-to-br from-[#4A0E2E] to-[#3A0A24] text-white"}`}>
      <Percent className={`absolute -right-4 -bottom-6 ${personalStyle ? "text-[#4A0E2E]/15" : "text-brand-gold/20"}`} size={160} />
      <div className="relative">
        {personalStyle && <div className="inline-flex items-center gap-1 bg-[#4A0E2E] text-brand-gold text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1"><Gift size={10}/> Your reward</div>}
        <div className={`text-xs font-bold uppercase tracking-wider ${personalStyle ? "text-[#4A0E2E]" : "text-brand-gold"}`}>{o.discount_type === "percent" ? `${o.discount_value}% OFF` : `₹${o.discount_value} OFF`}</div>
        <div className="mt-2 font-display font-black text-2xl">{o.code}</div>
        <p className={`text-sm mt-1 ${personalStyle ? "text-[#4A0E2E]/80" : "text-white/70"}`}>{o.description}</p>
        <div className={`mt-2 text-xs ${personalStyle ? "text-[#4A0E2E]/60" : "text-white/50"}`}>Min order ₹{o.min_order}{o.max_discount ? ` · Max ₹${o.max_discount}` : ""}</div>
        <button onClick={() => copy(o.code)} className={`mt-4 font-black text-xs px-4 py-2 rounded-full flex items-center gap-1.5 ${personalStyle ? "bg-[#4A0E2E] text-brand-gold" : "bg-brand-gold text-[#4A0E2E]"}`}>
          {copied === o.code ? <><Check size={14}/> Copied</> : <><Copy size={14}/> Copy Code</>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-display font-black text-3xl text-[#4A0E2E]">Offers & Coupons</h1>
      <p className="text-sm text-slate-500 mt-1">Save more on every order at Fudora.</p>

      {user && <ReferralCard />}

      {personal.length > 0 && (
        <section className="mt-6">
          <h3 className="font-display font-black text-xl text-[#4A0E2E]">Your rewards</h3>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {personal.map(o => <Card key={o.id} o={o} personalStyle />)}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h3 className="font-display font-black text-xl text-[#4A0E2E]">Everyone's offers</h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map(o => <Card key={o.id} o={o} />)}
        </div>
      </section>
    </div>
  );
}
