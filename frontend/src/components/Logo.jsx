export default function Logo({ size = 36, showText = true }) {
  return (
    <div className="flex items-center gap-2" data-testid="fudora-logo">
      <div className="rounded-full bg-brand-primary flex items-center justify-center shadow-warm" style={{ width: size, height: size }}>
        <span className="font-display font-black text-brand-gold" style={{ fontSize: size * 0.62, lineHeight: 1 }}>F</span>
      </div>
      {showText && (
        <div className="leading-none">
          <div className="font-display font-black text-[22px] text-[#4A0E2E] tracking-tight">Fudora</div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-brand-gold font-bold">Your Food. Your Way.</div>
        </div>
      )}
    </div>
  );
}
