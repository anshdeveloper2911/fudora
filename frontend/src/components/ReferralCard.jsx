import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Copy, Check, Share2, Gift } from "lucide-react";
import { toast } from "sonner";

export default function ReferralCard() {
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { api.get("/me/referral").then(({ data }) => setData(data)).catch(() => {}); }, []);

  if (!data) return null;
  const shareUrl = `${window.location.origin}/signup?ref=${data.referral_code}`;
  const shareText = `Hey! Try Fudora — get ₹100 off your first food order in Sasaram. Use my code ${data.referral_code} at signup: ${shareUrl}`;

  const copy = () => { navigator.clipboard.writeText(data.referral_code); setCopied(true); toast.success("Code copied"); setTimeout(() => setCopied(false), 1200); };
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Fudora", text: shareText, url: shareUrl }); } catch {}
    } else {
      navigator.clipboard.writeText(shareText); toast.success("Invite copied — paste anywhere");
    }
  };

  return (
    <div className="mt-4 relative overflow-hidden bg-gradient-to-br from-[#4A0E2E] via-[#5A1338] to-[#3A0A24] text-white rounded-2xl p-5" data-testid="referral-card">
      <Gift className="absolute -right-4 -bottom-4 text-brand-gold/15" size={140} />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-brand-gold"><Gift size={13} /> Refer & Earn</div>
        <div className="mt-2 font-display font-black text-xl leading-tight">Give ₹100, get free delivery</div>
        <p className="mt-1 text-sm text-white/70">Share your code. When a friend signs up and orders, they get ₹100 off and you get free delivery on your next order.</p>
        <div className="mt-4 bg-white/10 backdrop-blur border border-white/15 rounded-xl p-3 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Your code</div>
            <div className="font-mono font-black text-lg text-brand-gold truncate" data-testid="referral-code">{data.referral_code}</div>
          </div>
          <button onClick={copy} data-testid="referral-copy-btn" className="bg-white/10 hover:bg-white/20 rounded-lg p-2" aria-label="Copy code">
            {copied ? <Check size={16}/> : <Copy size={16}/>}
          </button>
          <button onClick={share} data-testid="referral-share-btn" className="bg-brand-gold text-[#4A0E2E] font-black text-xs px-3 py-2 rounded-lg flex items-center gap-1"><Share2 size={13}/> Share</button>
        </div>
        <div className="mt-3 text-xs text-white/60"><b className="text-brand-gold">{data.referral_count}</b> friend{data.referral_count===1?"":"s"} referred so far</div>
      </div>
    </div>
  );
}
