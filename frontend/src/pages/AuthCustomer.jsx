import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import { toast } from "sonner";

export default function AuthCustomer({ mode }) {
  const isSignup = mode === "signup";
  const { login, signup, formatErr } = useAuth();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", referral_code: params.get("ref") || "" });
  const [busy, setBusy] = useState(false);
  const [showRef, setShowRef] = useState(!!params.get("ref"));
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      if (isSignup) await signup(form); else await login(form.email, form.password);
      toast.success("Welcome to Fudora");
      nav(params.get("redirect") || "/");
    } catch (e) { toast.error(formatErr(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-brand-cream shadow-lift p-6 sm:p-8">
        <Link to="/"><Logo size={40} /></Link>
        <h1 className="mt-6 font-display font-black text-3xl text-[#4A0E2E]">{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="text-sm text-slate-500 mt-1">{isSignup ? "Order the best food in Sasaram." : "Log in to continue ordering."}</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          {isSignup && <>
            <input required placeholder="Full name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-brand-warm border border-brand-cream rounded-lg px-4 py-3 text-sm outline-none focus:border-[#4A0E2E]" data-testid="signup-name" />
            <input placeholder="Phone (optional)" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-brand-warm border border-brand-cream rounded-lg px-4 py-3 text-sm outline-none focus:border-[#4A0E2E]" />
            {showRef ? (
              <input placeholder="Referral code" value={form.referral_code} onChange={e => setForm({...form, referral_code: e.target.value.toUpperCase()})} className="w-full bg-brand-gold/10 border-2 border-brand-gold rounded-lg px-4 py-3 text-sm outline-none uppercase font-bold text-[#4A0E2E]" data-testid="signup-referral" />
            ) : (
              <button type="button" onClick={() => setShowRef(true)} className="text-xs font-bold text-brand-gold hover:underline text-left">+ Have a referral code?</button>
            )}
          </>}
          <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-brand-warm border border-brand-cream rounded-lg px-4 py-3 text-sm outline-none focus:border-[#4A0E2E]" data-testid="auth-email" />
          <input required type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full bg-brand-warm border border-brand-cream rounded-lg px-4 py-3 text-sm outline-none focus:border-[#4A0E2E]" data-testid="auth-password" />
          <button disabled={busy} className="w-full bg-[#4A0E2E] text-white font-black text-sm py-3.5 rounded-lg hover:bg-[#3A0A24] disabled:opacity-60" data-testid="auth-submit">
            {busy ? "Please wait…" : isSignup ? "Create Account" : "Login"}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-500">
          {isSignup ? <>Already have an account? <Link to="/login" className="text-[#4A0E2E] font-bold">Login</Link></> : <>New to Fudora? <Link to="/signup" className="text-[#4A0E2E] font-bold">Sign up</Link></>}
        </div>
        <div className="mt-3 text-center">
          <Link to="/admin/login" className="text-xs text-slate-400 hover:text-[#4A0E2E]">Restaurant / Admin login →</Link>
        </div>
      </div>
    </div>
  );
}
