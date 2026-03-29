import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import { sbDeleteTenant, type SuperTenantRow } from "../../lib/superAdminData";
import { superQueryKeys } from "../../lib/superQueryKeys";
import { useSuperTenantsQuery } from "../../hooks/useSuperAdminQueries";
import { useState } from "react";

export default function SuperTenants() {
  const queryClient = useQueryClient();
  const tenantsQuery = useSuperTenantsQuery();
  const rows = tenantsQuery.data ?? [];
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const onDelete = async (t: SuperTenantRow) => {
    if (t.is_owner) return;
    if (!window.confirm(`Hapus tenant "${t.name}"?`)) return;
    setBusyId(t.id);
    setErr(null);
    try {
      await sbDeleteTenant(t.id);
      await queryClient.invalidateQueries({ queryKey: superQueryKeys.tenants() });
      await queryClient.invalidateQueries({
        queryKey: superQueryKeys.dashboardSummary(),
      });
      await queryClient.invalidateQueries({
        queryKey: superQueryKeys.recentTransactions(),
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menghapus.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Tenants" subtitle="Kelola outlet dan platform." />
        <Link
          to="/pos/super/tenants/new"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-900 shadow-sm transition hover:bg-neutral-50 sm:shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Tambah outlet
        </Link>
      </div>

      {err ? <p className="text-sm font-semibold text-red-700">{err}</p> : null}
      {tenantsQuery.isError ? (
        <p className="text-sm font-semibold text-red-700">
          {tenantsQuery.error instanceof Error
            ? tenantsQuery.error.message
            : "Gagal memuat tenant."}
        </p>
      ) : null}

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/80 text-xs font-bold uppercase text-neutral-500">
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tenantsQuery.isPending ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                  Memuat tenant…
                </td>
              </tr>
            ) : (
              rows.map((t) => (
                <tr key={t.id} className="border-b border-neutral-100">
                  <td className="px-4 py-3 font-semibold text-neutral-900">
                    <Link
                      to={`/pos/super/tenants/${t.id}`}
                      className="text-red-700 hover:underline"
                    >
                      {t.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{t.slug}</td>
                  <td className="px-4 py-3">{t.sub_status}</td>
                  <td className="px-4 py-3">
                    {t.is_owner ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                        Platform
                      </span>
                    ) : (
                      <span className="text-neutral-500">Outlet</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {t.is_owner ? (
                      <span className="text-xs text-neutral-400">—</span>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === t.id}
                        onClick={() => void onDelete(t)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-800 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        Hapus
                      </button>
                    )}
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
