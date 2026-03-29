import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import { getSupabase } from "../../lib/supabaseClient";
import { formatIDR } from "../../lib/formatCurrency";
import {
  sbRpcSuperDashboardSummary,
  sbFetchTenantsForSuper,
  type SuperTenantRow,
} from "../../lib/superAdminData";

type TxRow = {
  id: string;
  amount_paid: number;
  status: string;
  created_at: string;
  tenant_id: string;
};

export default function SuperDashboard() {
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [summaryErr, setSummaryErr] = useState<string | null>(null);
  const [tenants, setTenants] = useState<SuperTenantRow[]>([]);
  const [tx, setTx] = useState<TxRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const s = await sbRpcSuperDashboardSummary();
        if (!cancelled) {
          setSummary(s);
          setSummaryErr(null);
        }
        const tlist = await sbFetchTenantsForSuper();
        if (!cancelled) setTenants(tlist);
        const sb = getSupabase();
        if (sb) {
          const { data: txData, error: txErr } = await sb
            .from("transactions")
            .select("id, amount_paid, status, created_at, tenant_id")
            .order("created_at", { ascending: false })
            .limit(12);
          if (txErr) throw txErr;
          if (!cancelled) {
            setTx(
              (txData ?? []).map((r) => ({
                id: r.id,
                amount_paid: Number(r.amount_paid),
                status: String(r.status),
                created_at: String(r.created_at),
                tenant_id: String(r.tenant_id),
              })),
            );
          }
        }
        if (!cancelled) setLoadErr(null);
      } catch (e) {
        if (!cancelled) {
          setSummaryErr(
            e instanceof Error ? e.message : "Gagal memuat ringkasan.",
          );
          setLoadErr(e instanceof Error ? e.message : "Gagal memuat data.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const num = (v: unknown) =>
    typeof v === "number" ? v : typeof v === "string" ? Number(v) : 0;

  const chartData = [
    {
      name: "Outlet",
      value: num(summary?.total_tenants),
    },
    {
      name: "Berlangganan",
      value: num(summary?.subscriber_tenants),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan platform Warcoop."
      />

      {summaryErr ? (
        <p className="text-sm font-semibold text-red-700">{summaryErr}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">
            Total outlet
          </div>
          <div className="mt-2 text-2xl font-extrabold text-neutral-900">
            {summary ? String(summary.total_tenants ?? "—") : "…"}
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">
            Subscriber aktif
          </div>
          <div className="mt-2 text-2xl font-extrabold text-neutral-900">
            {summary ? String(summary.subscriber_tenants ?? "—") : "…"}
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">
            Transaksi paid
          </div>
          <div className="mt-2 text-2xl font-extrabold text-neutral-900">
            {summary ? String(summary.total_paid_transactions ?? "—") : "…"}
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-neutral-500">
            Revenue global
          </div>
          <div className="mt-2 text-xl font-extrabold text-neutral-900 tabular-nums">
            {summary
              ? formatIDR(num(summary.total_revenue_global))
              : "…"}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-sm font-extrabold text-neutral-900">
            Outlet vs subscriber
          </h2>
          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#dc2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-neutral-900">Tenant</h2>
            <Link
              to="/pos/super/tenants"
              className="text-xs font-bold text-red-700 hover:underline"
            >
              Kelola
            </Link>
          </div>
          <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto text-sm">
            {tenants.map((t) => (
              <li
                key={t.id}
                className="flex justify-between gap-2 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2"
              >
                <span className="font-semibold text-neutral-800 truncate">
                  {t.name}
                </span>
                {t.is_owner ? (
                  <span className="shrink-0 text-[10px] font-bold uppercase text-amber-800">
                    Platform
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-6 overflow-x-auto">
        <h2 className="text-sm font-extrabold text-neutral-900">
          Transaksi terbaru
        </h2>
        {loadErr ? (
          <p className="mt-2 text-sm text-red-700">{loadErr}</p>
        ) : (
          <table className="mt-4 w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs font-bold uppercase text-neutral-500">
                <th className="pb-2 pr-4">Waktu</th>
                <th className="pb-2 pr-4">Tenant</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {tx.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100">
                  <td className="py-2 pr-4 text-neutral-600 tabular-nums">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs text-neutral-500">
                    {row.tenant_id.slice(0, 8)}…
                  </td>
                  <td className="py-2 pr-4 font-semibold">{row.status}</td>
                  <td className="py-2 text-right font-semibold tabular-nums">
                    {formatIDR(row.amount_paid)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
