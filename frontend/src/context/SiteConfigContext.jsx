import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

const Ctx = createContext(null);
export const useSiteConfig = () => useContext(Ctx);

const DEFAULT = {
  announcement: { enabled: true, text: "🎉 Free delivery on your first order — use FUDORA50 at checkout", bg: "#4A0E2E", fg: "#F59E0B" },
  branding: { name: "Fudora", tagline: "Your Food. Your Way." },
  hero: { enabled: true, badge_text: "Now delivering in Sasaram", heading_line1: "Delicious food,", heading_line2: "delivered to your door.", subheading: "Discover the best restaurants and order your favourite food in Sasaram — in under 30 minutes.", image_url: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=900&q=80", cta_text: "Explore Restaurants", cta_link: "/restaurants" },
  offers_section: { enabled: true, title: "Best offers for you" },
  popular_section: { enabled: true, title: "Popular near you", limit: 8, product_ids: [] },
  restaurants_section: { enabled: true, title: "All restaurants near you" },
  footer: { description: "", phone: "", email: "", address: "", socials: {}, columns: [], copyright: "" },
};

export function SiteConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/site-config");
      setConfig({ ...DEFAULT, ...data });
    } catch {}
    finally { setReady(true); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return <Ctx.Provider value={{ config, ready, refresh, setConfig }}>{children}</Ctx.Provider>;
}
