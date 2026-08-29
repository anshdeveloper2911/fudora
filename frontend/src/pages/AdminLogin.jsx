import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import { toast } from "sonner";
import { Shield } from "lucide-react";

export default function AdminLogin() {
  const { login, formatErr } = useAuth();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const u = await login(email, password);
      if (u.role === "super_admin") nav("/super");
      else if (u.role === "restaurant_admin") nav("/admin");
      else { toast.error("Use customer login"); nav("/login"); }
    } catch (e) { toast.error(formatErr(e)); }
    finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen bg-[#1E0A17] text-white flex items-center justify-center p-4"
      style={{ backgroundImage: "radial-gradient(circle at 30% 20%, rgba(245,158,11,0.15), transparent 50%)" }}>
      <div className="w-full max-w-md bg-black/40 backdrop-blur border border-white/10 rounded-3xl p-6 sm:p-8">
        <Link to="/"><Logo size={40} /></Link>
        <div className="mt-6 flex items-center gap-2 text-brand-gold text-xs font-black uppercase tracking-wider"><Shield size={14}/> Admin Access</div>
        <h1 className="mt-2 font-display font-black text-3xl">Sign in to your dashboard</h1>
        <p className="text-sm text-white/60 mt-1">Restaurant admins & platform owners.</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            data-testid="admin-email" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-brand-gold" />
          <input required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            data-testid="admin-password" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-brand-gold" />
          <button disabled={busy} data-testid="admin-login-submit" className="w-full bg-brand-gold text-[#4A0E2E] font-black text-sm py-3.5 rounded-lg hover:bg-amber-400 disabled:opacity-60">
            {busy ? "Signing in…" : "Login"}
          </button>
        </form>
        <div className="mt-4 text-center text-xs text-white/40"><Link to="/">← Back to Fudora</Link></div>
      </div>
    </div>
  );
}
