import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4 text-center">
      <div>
        <div className="font-display font-black text-8xl text-[#4A0E2E]">404</div>
        <div className="mt-2 text-slate-500">This page doesn't exist on the menu.</div>
        <Link to="/" className="mt-6 inline-block bg-[#4A0E2E] text-white font-bold text-sm px-6 py-3 rounded-full">Back to Home</Link>
      </div>
    </div>
  );
}
