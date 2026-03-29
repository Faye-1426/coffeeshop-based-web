import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { sbInsertTenant } from "../../lib/superAdminData";
import { superQueryKeys } from "../../lib/superQueryKeys";
import { useSuperSubscriptionPlansQuery } from "../../hooks/useSuperAdminQueries";

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function SuperTenantNew() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const plansQuery = useSuperSubscriptionPlansQuery();
  const plans = (plansQuery.data ?? []).filter((x) => x.is_active);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [planId, setPlanId] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (name && !slug) setSlug(slugify(name));
  }, [name, slug]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    const sn = slugify(slug || name);
    if (!name.trim() || !sn) {
      setErr("Nama dan slug wajib diisi.");
      return;
    }
    setBusy(true);
    try {
      const row = await sbInsertTenant({
        name: name.trim(),
        slug: sn,
        plan_id: planId || null,
      });
      await queryClient.invalidateQueries({ queryKey: superQueryKeys.tenants() });
      await queryClient.invalidateQueries({
        queryKey: superQueryKeys.dashboardSummary(),
      });
      navigate(`/pos/super/tenants/${row.id}`, { replace: true });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Gagal membuat tenant.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader title="Outlet baru" subtitle="Tambah tenant outlet." />
      <Card className="p-6 sm:p-8">
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-neutral-600">Nama outlet</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-neutral-600">Slug</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-red-600/25"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-neutral-600">Paket (opsional)</span>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              disabled={plansQuery.isPending}
              className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
            >
              <option value="">—</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          {err ? (
            <p className="text-sm font-semibold text-red-700">{err}</p>
          ) : null}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan"}
            </Button>
            <Link
              to="/pos/super/tenants"
              className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-900 hover:bg-neutral-50"
            >
              Batal
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
