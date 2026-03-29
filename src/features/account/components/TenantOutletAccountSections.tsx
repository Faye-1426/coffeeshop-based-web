import type { ReactNode } from "react";
import { Store, UserRound } from "lucide-react";
import { useTenant } from "../../../features/tenants/context/TenantContext";
import {
  formatTenantShortId,
  formatUuidShort,
} from "../../../lib/formatPosIds";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,180px)_1fr] sm:items-start sm:gap-4">
      <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="text-sm font-semibold text-neutral-900 break-words">
        {value}
      </div>
    </div>
  );
}

export default function TenantOutletAccountSections() {
  const { tenantRow, profile, user } = useTenant();
  if (!tenantRow || !profile) return null;

  const endLabel = tenantRow.end_subscription
    ? new Date(tenantRow.end_subscription).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const roleLabel =
    profile.role_name ?? `Peran #${profile.role_id}`;

  return (
    <>
      <section className="border-b border-neutral-200 py-8 first:pt-0">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
            <Store className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-neutral-900">
                Data outlet
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Informasi tenant (read-only).
              </p>
            </div>
            <div className="space-y-4">
              <DetailRow label="Nama" value={tenantRow.name} />
              <DetailRow label="Slug" value={tenantRow.slug} />
              <DetailRow label="Status langganan" value={tenantRow.sub_status} />
              <DetailRow label="Akhir langganan" value={endLabel} />
              <DetailRow
                label="Logo URL"
                value={
                  tenantRow.logo_url ? (
                    <a
                      href={tenantRow.logo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-red-700 underline underline-offset-2 hover:text-red-800"
                    >
                      {tenantRow.logo_url}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <DetailRow
                label="Plan ID"
                value={
                  tenantRow.plan_id
                    ? formatUuidShort(tenantRow.plan_id, "PLN")
                    : "—"
                }
              />
              <DetailRow
                label="ID outlet"
                value={formatTenantShortId(tenantRow.id)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200 py-8">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
            <UserRound className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-neutral-900">
                Pengguna
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Akun yang sedang login (read-only).
              </p>
            </div>
            <div className="space-y-4">
              <DetailRow label="Email" value={user?.email ?? "—"} />
              <DetailRow label="Nama" value={profile.full_name || "—"} />
              <DetailRow label="Peran" value={roleLabel} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
