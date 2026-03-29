import { useEffect, useState, type FormEvent } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import {
  sbFetchSubscriptionPlans,
  sbInsertSubscriptionPlan,
  sbUpdateSubscriptionPlan,
  sbDeleteSubscriptionPlan,
  type SubscriptionPlanRow,
} from "../../lib/superAdminData";
import { formatIDR } from "../../lib/formatCurrency";

export default function SuperSubscriptions() {
  const [rows, setRows] = useState<SubscriptionPlanRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("100000");

  const load = async () => {
    setErr(null);
    try {
      setRows(await sbFetchSubscriptionPlans());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal memuat paket.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await sbInsertSubscriptionPlan({
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
        price_monthly: Number(price) || 0,
      });
      setName("");
      setSlug("");
      setPrice("100000");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Gagal menambah.");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (p: SubscriptionPlanRow) => {
    setBusy(true);
    try {
      await sbUpdateSubscriptionPlan(p.id, { is_active: !p.is_active });
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Gagal update.");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (p: SubscriptionPlanRow) => {
    if (!window.confirm(`Hapus paket "${p.name}"?`)) return;
    setBusy(true);
    try {
      await sbDeleteSubscriptionPlan(p.id);
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Gagal hapus (mungkin dipakai tenant).");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Subscription plans"
        subtitle="Jenis paket langganan outlet."
      />
      {err ? <p className="text-sm font-semibold text-red-700">{err}</p> : null}

      <Card className="p-6 sm:p-8 max-w-xl">
        <h2 className="text-sm font-extrabold text-neutral-900">Tambah paket</h2>
        <form onSubmit={(e) => void onAdd(e)} className="mt-4 space-y-3">
          <input
            placeholder="Nama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
          />
          <input
            placeholder="slug-unik"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-mono"
          />
          <input
            type="number"
            placeholder="Harga / bulan (IDR)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
          />
          <Button type="submit" disabled={busy}>
            Tambah
          </Button>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/80 text-xs font-bold uppercase text-neutral-500">
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Harga</th>
              <th className="px-4 py-3">Aktif</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-neutral-100">
                <td className="px-4 py-3 font-semibold">{p.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.slug}</td>
                <td className="px-4 py-3 tabular-nums">
                  {formatIDR(p.price_monthly)}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void toggleActive(p)}
                    className="text-xs font-bold text-red-700 hover:underline"
                  >
                    {p.is_active ? "nonaktifkan" : "aktifkan"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onDelete(p)}
                    className="text-xs font-bold text-red-800 hover:underline"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
