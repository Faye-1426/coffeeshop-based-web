import { useEffect, useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ModalFrame from "../../../components/ui/ModalFrame";
import { formatIDR } from "../../../lib/formatCurrency";
import { formatOrderLabel } from "../../../lib/formatPosIds";
import type { PaymentMethod, PosOrder } from "../../../types/pos";

type CompletePaymentModalProps = {
  open: boolean;
  order: PosOrder | null;
  onClose: () => void;
  onConfirm: (payload: {
    method: PaymentMethod;
    amountPaid: number;
    dueDate?: string;
  }) => void | Promise<void>;
};

export default function CompletePaymentModal({
  open,
  order,
  onClose,
  onConfirm,
}: CompletePaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amountInput, setAmountInput] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  const total = order?.total ?? 0;

  useEffect(() => {
    if (!open || !order) return;
    setMethod("cash");
    setAmountInput(String(order.total));
    setDueDate("");
  }, [open, order?.id, order?.total]);

  useEffect(() => {
    if (!order) return;
    if (method === "qris") setAmountInput(String(order.total));
  }, [method, order]);

  const amountPaid = useMemo(() => {
    const n = Number(amountInput);
    return Number.isFinite(n) ? n : 0;
  }, [amountInput]);

  const changePreview =
    method === "cash" ? Math.max(0, amountPaid - total) : 0;

  const submit = () => {
    void (async () => {
      if (!order) return;
      if (method === "cash" && amountPaid < total) {
        window.alert("Jumlah uang tunai kurang dari total.");
        return;
      }
      if (method === "qris" && amountPaid < total) {
        window.alert("Nominal pembayaran kurang dari total.");
        return;
      }
      if (method === "bon" && !dueDate.trim()) {
        window.alert("Isi tanggal jatuh tempo untuk BON.");
        return;
      }
      setBusy(true);
      try {
        await onConfirm({
          method,
          amountPaid: method === "qris" ? total : amountPaid,
          dueDate: method === "bon" ? dueDate.trim() : undefined,
        });
        onClose();
      } catch {
        /* parent / store shows alert */
      } finally {
        setBusy(false);
      }
    })();
  };

  if (!order) return null;

  return (
    <ModalFrame open={open} onClose={onClose} maxWidthClass="max-w-lg">
      <Card className="p-6 shadow-xl">
        <h2 className="text-lg font-extrabold">Pembayaran & selesaikan order</h2>
        <p className="mt-1 text-sm text-neutral-600">
          {formatOrderLabel(order.id)} · Meja {order.tableNumber} ·{" "}
          {order.customerName}
        </p>
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50/80 px-4 py-3">
          <div className="text-xs font-bold text-neutral-500">Total tagihan</div>
          <div className="text-2xl font-extrabold text-neutral-900">
            {formatIDR(total)}
          </div>
        </div>

        <label className="mt-5 block">
          <span className="text-xs font-bold text-neutral-600">Metode</span>
          <select
            value={method}
            onChange={(e) =>
              setMethod(e.target.value as PaymentMethod)
            }
            className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
          >
            <option value="cash">Tunai</option>
            <option value="qris">QRIS</option>
            <option value="bon">BON / piutang</option>
          </select>
        </label>

        {method === "cash" ? (
          <label className="mt-4 block">
            <span className="text-xs font-bold text-neutral-600">
              Uang diterima
            </span>
            <input
              type="number"
              min={0}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
            />
            <p className="mt-2 text-sm font-semibold text-neutral-700">
              Kembalian: {formatIDR(changePreview)}
            </p>
          </label>
        ) : null}

        {method === "qris" ? (
          <label className="mt-4 block">
            <span className="text-xs font-bold text-neutral-600">
              Nominal (biasanya sama dengan total)
            </span>
            <input
              type="number"
              min={0}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
            />
          </label>
        ) : null}

        {method === "bon" ? (
          <label className="mt-4 block">
            <span className="text-xs font-bold text-neutral-600">
              Jatuh tempo
            </span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
            />
            <p className="mt-2 text-xs text-neutral-500">
              Transaksi dicatat sebagai belum lunas; piutang masuk ke menu
              Outstanding.
            </p>
          </label>
        ) : null}

        <div className="mt-6 flex gap-2 justify-end">
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button type="button" onClick={submit} disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan & selesai"}
          </Button>
        </div>
      </Card>
    </ModalFrame>
  );
}
