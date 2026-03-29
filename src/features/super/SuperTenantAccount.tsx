import { Link, useParams } from "react-router-dom";
import { Building2, Store } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import { useSuperTenantByIdQuery } from "../../hooks/useSuperAdminQueries";

export default function SuperTenantAccount() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const tenantQuery = useSuperTenantByIdQuery(tenantId);
  const row = tenantQuery.data ?? null;

  if (!tenantId) {
    return <p className="text-sm text-neutral-600">Parameter tidak valid.</p>;
  }

  const err =
    tenantQuery.isError
      ? tenantQuery.error instanceof Error
        ? tenantQuery.error.message
        : "Gagal memuat."
      : tenantQuery.isSuccess && !row
        ? "Tenant tidak ditemukan."
        : null;

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex flex-wrap items-center gap-3">
        <PageHeader
          title="Ringkasan outlet"
          subtitle="Tampilan read-only untuk super admin."
        />
        <Link
          to="/pos/super/tenants"
          className="text-sm font-bold text-red-700 hover:underline"
        >
          ← Tenants
        </Link>
      </div>

      {err ? <p className="text-sm font-semibold text-red-700">{err}</p> : null}

      {tenantQuery.isPending ? (
        <p className="text-sm text-neutral-500">Memuat…</p>
      ) : row ? (
        <Card className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white">
              <Building2 className="h-7 w-7" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-neutral-900 text-lg">{row.name}</div>
              <div className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
                <Store className="h-4 w-4 shrink-0" aria-hidden />
                <span className="font-mono text-xs">{row.slug}</span>
              </div>
              <dl className="mt-4 space-y-2 text-sm text-neutral-700">
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Status langganan</dt>
                  <dd className="font-semibold">{row.sub_status}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Tenant ID</dt>
                  <dd className="font-mono text-xs truncate max-w-[200px]">{row.id}</dd>
                </div>
              </dl>
              <Link
                to={`/pos/super/tenants/${row.id}`}
                className="mt-6 inline-block text-sm font-bold text-red-700 hover:underline"
              >
                Edit detail tenant →
              </Link>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
