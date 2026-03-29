import { useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { formatIDR } from "../../../lib/formatCurrency";
import type { PosOrder, PosOrderLine, PosProduct } from "../../../types/pos";

type LineDraft = Record<string, number>; // productId -> qty

export default function CreateOrderDrawer({
  open,
  onClose,
  products,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  products: PosProduct[];
  onCreate: (
    order: Omit<PosOrder, "id" | "createdAt">,
  ) => void | Promise<void>;
}) {
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [qtyByProduct, setQtyByProduct] = useState<LineDraft>({});

  const lines = useMemo(() => {
    const out: PosOrderLine[] = [];
    for (const p of products) {
      const q = qtyByProduct[p.id] ?? 0;
      if (q > 0) {
        out.push({
          productId: p.id,
          name: p.name,
          qty: q,
          unitPrice: p.price,
        });
      }
    }
    return out;
  }, [products, qtyByProduct]);

  const total = useMemo(
    () => lines.reduce((s, l) => s + l.unitPrice * l.qty, 0),
    [lines],
  );

  const setQty = (productId: string, raw: number) => {
    const q = Math.max(0, Math.floor(raw));
    setQtyByProduct((prev) => {
      const next = { ...prev };
      if (q === 0) delete next[productId];
      else next[productId] = q;
      return next;
    });
  };

  const submit = () => {
    void (async () => {
      if (!tableNumber.trim() || !customerName.trim() || lines.length === 0)
        return;
      try {
        await onCreate({
          status: "pending",
          tableNumber: tableNumber.trim(),
          customerName: customerName.trim(),
          items: lines,
          total,
        });
        setTableNumber("");
        setCustomerName("");
        setQtyByProduct({});
        onClose();
      } catch {
        /* store layer surfaces errors via alert */
      }
    })();
  };

  return (
    <div
      className={[
        "fixed inset-0 z-50 flex justify-end transition",
        open ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={[
          "absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out",
          open ? "opacity-100" : "opacity-0",
        ].join(" ")}
        aria-label="Close drawer"
        onClick={onClose}
      />
      <Card
        className={[
          "relative z-10 h-dvh w-full max-w-lg rounded-none sm:rounded-l-3xl border-l border-neutral-200 shadow-2xl flex flex-col overflow-hidden",
          "transform transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between gap-4">
          <h2 className="text-lg font-extrabold">Create order</h2>
          <Button variant="secondary" className="px-3! py-2!" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-neutral-600">
              Table number
            </span>
            <input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
              placeholder="A1"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-neutral-600">
              Customer name
            </span>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
            />
          </label>

          <div>
            <div className="text-xs font-extrabold text-neutral-700 mb-2">
              Products
            </div>
            <ul className="space-y-2">
              {products.map((p) => {
                const q = qtyByProduct[p.id] ?? 0;
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-2xl border border-neutral-200 px-3 py-2 bg-white"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{p.name}</div>
                      <div className="text-xs text-neutral-500">
                        {formatIDR(p.price)}
                      </div>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={q || ""}
                      onChange={(e) =>
                        setQty(p.id, Number(e.target.value) || 0)
                      }
                      className="w-16 rounded-xl border border-neutral-200 px-2 py-1 text-sm text-center"
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="p-5 border-t border-neutral-200 space-y-3 bg-neutral-50/80">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-neutral-600">Total</span>
            <span className="text-xl font-extrabold text-neutral-900">
              {formatIDR(total)}
            </span>
          </div>
          <Button
            className="w-full"
            onClick={submit}
            disabled={
              !tableNumber.trim() || !customerName.trim() || lines.length === 0
            }
          >
            Add order
          </Button>
        </div>
      </Card>
    </div>
  );
}
