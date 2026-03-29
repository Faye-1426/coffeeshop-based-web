import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import {
  sbInsertSubscriptionPlan,
  sbUpdateSubscriptionPlan,
  sbDeleteSubscriptionPlan,
  type SubscriptionPlanRow,
} from "../../lib/supabase/superAdminData";
import { superQueryKeys } from "../../lib/keys/superQueryKeys";
import { formatIDR } from "../../lib/formatCurrency";
import { useSuperSubscriptionPlansQuery } from "../../hooks/useSuperAdminQueries";

export default function Subscription() {
  const queryClient = useQueryClient();
  const plansQuery = useSuperSubscriptionPlansQuery();
  const rows = plansQuery.data ?? [];
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("100000");

  const invalidatePlans = () =>
    queryClient.invalidateQueries({ queryKey: superQueryKeys.subscriptionPlans() });

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
      await invalidatePlans();
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
      await invalidatePlans();
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
      await invalidatePlans();
    } catch (ex) {
      setErr(
        ex instanceof Error
          ? ex.message
          : "Gagal hapus (mungkin dipakai tenant).",
      );
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
      {plansQuery.isError ? (
        <p className="text-sm font-semibold text-red-700">
          {plansQuery.error instanceof Error
            ? plansQuery.error.message
            : "Gagal memuat paket."}
        </p>
      ) : null}

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
            {plansQuery.isPending ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                  Memuat paket…
                </td>
              </tr>
            ) : (
              rows.map((p) => (
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
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
