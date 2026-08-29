import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Youtube, Smartphone, Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import Logo from "@/components/Logo";
import { useSiteConfig } from "@/context/SiteConfigContext";

const ICONS = { instagram: Instagram, facebook: Facebook, twitter: Twitter, youtube: Youtube, whatsapp: MessageCircle };

export default function Footer() {
  const { config } = useSiteConfig();
  const f = config.footer || {};
  const cols = f.columns || [];
  const socials = f.socials || {};
  const activeSocials = Object.entries(socials).filter(([, v]) => v && v !== "#" && v.length > 1);

  return (
    <footer className="bg-[#1E0A17] text-white/80 mt-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-2 gap-8 pb-10 border-b border-white/10">
          <div>
            <Logo size={44} showText={true} />
            <p className="mt-4 text-sm max-w-md text-white/60">{f.description}</p>
            {(f.phone || f.email || f.address) && (
              <div className="mt-4 space-y-1.5 text-sm text-white/70">
                {f.phone && <div className="flex items-center gap-2"><Phone size={13} className="text-brand-gold"/>{f.phone}</div>}
                {f.email && <div className="flex items-center gap-2"><Mail size={13} className="text-brand-gold"/>{f.email}</div>}
                {f.address && <div className="flex items-start gap-2"><MapPin size={13} className="text-brand-gold mt-0.5 shrink-0"/>{f.address}</div>}
              </div>
            )}
            {activeSocials.length > 0 && (
              <div className="mt-5 flex gap-2">
                {activeSocials.map(([k, v]) => {
                  const I = ICONS[k] || Instagram;
                  return (
                    <a key={k} href={v} aria-label={k} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-gold hover:text-[#4A0E2E] transition">
                      <I size={16}/>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <div className="text-brand-gold text-xs font-black uppercase tracking-widest">Get the Fudora App</div>
            <div className="mt-2 font-display font-black text-2xl text-white">Order faster. Delivered fresher.</div>
            <p className="mt-2 text-sm text-white/60 max-w-md">Coming soon on iOS and Android — track live orders, get push updates and unlock exclusive app-only offers.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="#" className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 transition">
                <Smartphone size={22} className="text-brand-gold"/>
                <div className="leading-tight">
                  <div className="text-[10px] uppercase tracking-wider text-white/60">Download on the</div>
                  <div className="font-display font-black text-base text-white">App Store</div>
                </div>
              </a>
              <a href="#" className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 transition">
                <Smartphone size={22} className="text-brand-gold"/>
                <div className="leading-tight">
                  <div className="text-[10px] uppercase tracking-wider text-white/60">Get it on</div>
                  <div className="font-display font-black text-base text-white">Google Play</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 py-10 border-b border-white/10">
          {cols.map((c, i) => (
            <div key={i}>
              <div className="font-display font-black text-brand-gold text-sm uppercase tracking-wider mb-3">{c.title}</div>
              <ul className="space-y-2">
                {(c.links || []).map((it, li) => (
                  <li key={li}><Link to={it.url || "/"} className="text-sm text-white/60 hover:text-white transition">{it.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-white/50">
          <div>{f.copyright || `© ${new Date().getFullYear()} Fudora. All rights reserved.`}</div>
          <div className="flex flex-wrap gap-4">
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <span>Made with 💛 in Sasaram, Bihar</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
