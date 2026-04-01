import { useEffect } from "react";
import confetti from "canvas-confetti";
import { useLocation, useNavigate, useParams } from "react-router-dom";

type LocationState = {
  orderId?: string;
  live?: boolean;
  /** True: payment UI closed but fulfillment waits for Midtrans webhook. */
  awaitingPayment?: boolean;
};

export default function OrderSuccessPage() {
  const { storeKey } = useParams<{ storeKey: string }>();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { orderId, live, awaitingPayment } = (state ?? {}) as LocationState;

  useEffect(() => {
    if (awaitingPayment) return;
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
  }, [awaitingPayment]);

  const base = storeKey ? `/${storeKey}` : "/";

  return (
    <div className="max-w-lg mx-auto text-center pt-8 pb-12">
      <div className="rounded-3xl border border-neutral-200 bg-white/80 p-8 sm:p-10 shadow-sm">
        <div className="text-5xl mb-4" aria-hidden>
          ✓
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
          {awaitingPayment ? "Payment submitted" : "Order placed!"}
        </h1>
        <p className="mt-3 text-sm text-neutral-600">
          {live && orderId
            ? awaitingPayment
              ? `Thank you. We are confirming your QRIS payment with the bank. Order reference: ${orderId}. Kitchen preparation starts after confirmation is received.`
              : `Thank you. Your order reference: ${orderId}`
            : "Thank you — demo mode (no order saved to the server)."}
        </p>
        <button
          type="button"
          onClick={() => navigate(base)}
          className="mt-8 w-full rounded-full bg-red-600 text-white py-3.5 text-sm font-extrabold shadow hover:bg-red-700 transition"
        >
          Back to menu
        </button>
      </div>
    </div>
  );
}
