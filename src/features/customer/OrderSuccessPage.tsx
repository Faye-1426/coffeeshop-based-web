import { useEffect } from "react";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router-dom";

export default function OrderSuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const t = window.setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.65 },
      });
    }, 80);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="max-w-lg mx-auto text-center pt-8 pb-12">
      <div className="rounded-3xl border border-neutral-200 bg-white/80 p-8 sm:p-10 shadow-sm">
        <div className="text-5xl mb-4" aria-hidden>
          ✓
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
          Order placed!
        </h1>
        <p className="mt-3 text-sm text-neutral-600">
          Thank you for ordering at Warcoop. This is a demo — no payment was
          processed.
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-8 w-full rounded-full bg-red-600 text-white py-3.5 text-sm font-extrabold shadow hover:bg-red-700 transition"
        >
          Back to menu
        </button>
      </div>
    </div>
  );
}
