/** Load Midtrans Snap.js (per client key) and expose `window.snap.pay`. */
export async function ensureMidtransSnapLoaded(
  snapJsUrl: string,
  clientKey: string,
): Promise<void> {
  const existing = document.getElementById("midtrans-snap-js");
  existing?.remove();
  const w = window as unknown as { snap?: unknown };
  try {
    delete w.snap;
  } catch {
    w.snap = undefined;
  }

  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.id = "midtrans-snap-js";
    s.src = snapJsUrl;
    s.async = true;
    s.setAttribute("data-client-key", clientKey);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Midtrans Snap"));
    document.body.appendChild(s);
  });
}

export type SnapPayHandlers = {
  onSuccess?: (result?: unknown) => void;
  onPending?: (result?: unknown) => void;
  onError?: (result?: unknown) => void;
  onClose?: () => void;
};

export function openMidtransSnapPay(
  token: string,
  handlers: SnapPayHandlers = {},
): void {
  const snap = (window as unknown as { snap?: { pay: (t: string, o?: SnapPayHandlers) => void } })
    .snap;
  if (!snap?.pay) {
    handlers.onError?.({ message: "Snap not available" });
    return;
  }
  snap.pay(token, handlers);
}
