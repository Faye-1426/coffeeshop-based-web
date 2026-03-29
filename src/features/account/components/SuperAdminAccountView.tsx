import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Coffee, Mail, Store, User } from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import { usePosRole } from "../../../components/layout/usePosRole";
import { POS_DEMO_TENANT_NAME, POS_DEMO_USER_NAME } from "../data";
import { useTenant } from "../../../lib/supabase/TenantContext";
import { isSupabaseConfigured } from "../../../lib/supabaseClient";
import { sbRpcGlobalStats } from "../../../lib/posSupabaseData";
import { formatIDR } from "../../../lib/formatCurrency";

export default function SuperAdminAccountView() {
  const { setRole } = usePosRole();
  const { isSupabase, user, profile, tenantName } = useTenant();
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [statsErr, setStatsErr] = useState<string | null>(null);

  const liveSuper =
    isSupabaseConfigured() &&
    isSupabase &&
    profile?.role_id === 0 &&
    profile.tenant_id === null;

  useEffect(() => {
    if (!liveSuper) return;
    let cancelled = false;
    void (async () => {
      try {
        const s = await sbRpcGlobalStats();
        if (!cancelled) {
          setStats(s);
          setStatsErr(null);
        }
      } catch (e) {
        if (!cancelled) {
          setStats(null);
          setStatsErr(e instanceof Error ? e.message : "Gagal memuat statistik.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [liveSuper]);

  const displayName = liveSuper
    ? profile?.full_name || user?.email || "Super admin"
    : POS_DEMO_USER_NAME;
  const displayEmail = liveSuper ? user?.email ?? "" : "owner@warcoop.demo";
  const displayTenant = liveSuper
    ? tenantName ?? "— (akun global)"
    : POS_DEMO_TENANT_NAME;

  const revenue =
    stats && typeof stats.total_revenue_global === "number"
      ? stats.total_revenue_global
      : typeof stats?.total_revenue_global === "string"
        ? Number(stats.total_revenue_global)
        : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-neutral-900">Account</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Super Administrator
          {liveSuper ? " — metrik global via RPC Postgres." : " (demo, tanpa backend)."}
        </p>
      </div>

      <Card className="p-6 sm:p-8 max-w-xl">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white">
            <User className="h-7 w-7" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-neutral-900">{displayName}</div>
            <div className="mt-1 flex items-center gap-2 text-sm text-neutral-600">
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              {displayEmail}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
              <Store className="h-4 w-4 shrink-0" aria-hidden />
              {displayTenant}
            </div>
          </div>
        </div>

        {liveSuper ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 text-sm">
            <div className="font-extrabold text-neutral-900 mb-2">
              rpc_admin_global_stats()
            </div>
            {statsErr ? (
              <p className="text-red-700 font-semibold">{statsErr}</p>
            ) : stats ? (
              <ul className="space-y-1 text-neutral-700">
                <li>
                  Tenant:{" "}
                  <strong>{String(stats.total_tenants ?? "—")}</strong>
                </li>
                <li>
                  Transaksi paid:{" "}
                  <strong>
                    {String(stats.total_paid_transactions ?? "—")}
                  </strong>
                </li>
                <li>
                  Revenue global:{" "}
                  <strong>
                    {revenue !== null && !Number.isNaN(revenue)
                      ? formatIDR(revenue)
                      : "—"}
                  </strong>
                </li>
              </ul>
            ) : (
              <p className="text-neutral-600">Memuat…</p>
            )}
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 text-sm text-neutral-600">
          <div className="flex items-center gap-2 font-bold text-neutral-800">
            <Coffee className="h-4 w-4 text-red-700" aria-hidden />
            Catatan
          </div>
          <p className="mt-2">
            {liveSuper
              ? "Akses penuh lintas tenant memakai service role di server — jangan expose di bundle browser."
              : "Peran, izin, dan pergantian sandi akan terhubung ke API. Untuk admin outlet sehari-hari gunakan menu ikon pengguna."}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-900 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-red-600/25"
          >
            View storefront
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-900 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-red-600/25"
          >
            Go to login
          </Link>
        </div>

        {!liveSuper ? (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/90 p-4">
            <div className="text-xs font-extrabold uppercase tracking-wide text-neutral-500">
              Pengembangan
            </div>
            <p className="mt-2 text-sm text-neutral-600">
              Kembali ke pengalaman admin outlet (tanpa detail Super Admin di
              halaman ini).
            </p>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => setRole("cafe")}
            >
              Simulasi admin outlet
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
