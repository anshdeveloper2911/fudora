import { useSiteConfig } from "@/context/SiteConfigContext";

export default function AnnouncementBar() {
  const { config } = useSiteConfig();
  const a = config.announcement || {};
  if (!a.enabled || !a.text) return null;
  return (
    <div
      data-testid="announcement-bar"
      className="w-full text-center py-2 px-4 text-xs sm:text-sm font-bold tracking-wide"
      style={{ background: a.bg || "#4A0E2E", color: a.fg || "#F59E0B" }}
    >
      {a.text}
    </div>
  );
}
