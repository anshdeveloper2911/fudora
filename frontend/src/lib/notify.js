// Browser Notification API — foreground push for order status changes.

export function notifSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notifPermission() {
  if (!notifSupported()) return "unsupported";
  return Notification.permission;
}

export async function askPermission() {
  if (!notifSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    const p = await Notification.requestPermission();
    return p;
  } catch { return "denied"; }
}

export function fireNotification(title, body, tag = "fudora") {
  if (!notifSupported() || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      tag,
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='48' fill='%234A0E2E'/%3E%3Ctext x='50' y='68' font-family='Georgia,serif' font-size='58' font-weight='900' text-anchor='middle' fill='%23F59E0B'%3EF%3C/text%3E%3C/svg%3E",
      badge: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='48' fill='%234A0E2E'/%3E%3C/svg%3E",
    });
    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
    setTimeout(() => n.close(), 6000);
  } catch {}
}
