// Web Audio API chime — no asset file needed.
let ctx = null;
function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return null; }
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function beep(freq, start, dur = 0.18, gain = 0.18) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = "sine"; o.frequency.value = freq;
  o.connect(g); g.connect(c.destination);
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0.001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t); o.stop(t + dur + 0.02);
}

export function chime() {
  // Two-note ascending chime, repeated for salience
  beep(880, 0);
  beep(1320, 0.18);
  beep(880, 0.55);
  beep(1320, 0.73);
}

export function vibratePhone(pattern = [180, 90, 180, 90, 260]) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch {}
  }
}

export function primeAudio() {
  // Call inside a user gesture to unblock autoplay
  const c = ac(); if (!c) return;
  const g = c.createGain(); g.gain.value = 0; g.connect(c.destination);
  const o = c.createOscillator(); o.connect(g); o.start(); o.stop(c.currentTime + 0.01);
}
