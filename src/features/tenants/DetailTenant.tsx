import { useQueryClient } from "@tanstack/react-query";
import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CreditCard, KeyRound } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { encodeMidtransKeyForStorage } from "../../lib/midtransKeyNormalize";
import {
  sbRpcCreateSubsKey,
  sbRpcSuperadminSetMidtransKey,
  sbUpdateTenant,
} from "../../lib/supabase/superAdminData";
import { superQueryKeys } from "../../lib/keys/superQueryKeys";
import {
  useSuperSubsKeysQuery,
  useSuperTenantByIdQuery,
} from "../../hooks/useSuperAdminQueries";

export default function DetailTenant() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tenantQuery = useSuperTenantByIdQuery(id);
  const subsKeysQuery = useSuperSubsKeysQuery();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [subStatus, setSubStatus] = useState("active");
  const [endSub, setEndSub] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [newKeyPlain, setNewKeyPlain] = useState<string | null>(null);
  const [midtransB64, setMidtransB64] = useState("");
  const [midtransRotate, setMidtransRotate] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const t = tenantQuery.data;

  useEffect(() => {
    if (!t) return;
    setName(t.name);
    setSlug(t.slug);
    setSubStatus(t.sub_status);
    setEndSub(t.end_subscription ? t.end_subscription.slice(0, 10) : "");
    setLogoUrl(t.logo_url ?? "");
    setIsOwner(t.is_owner);
  }, [t]);

  const keys = (subsKeysQuery.data ?? []).filter((k) => k.tenant_id === id);

  const refreshTenantQueries = async () => {
    if (id) {
      await queryClient.invalidateQueries({
        queryKey: superQueryKeys.tenant(id),
      });
    }
    await queryClient.invalidateQueries({ queryKey: superQueryKeys.tenants() });
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || isOwner) return;
    setBusy(true);
    setErr(null);
    try {
      await sbUpdateTenant(id, {
        name: name.trim(),
        slug: slug.trim(),
        sub_status: subStatus,
        end_subscription: endSub ? `${endSub}T12:00:00Z` : null,
        logo_url: logoUrl.trim() || null,
      });
      await refreshTenantQueries();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  };

  const onSaveMidtrans = async () => {
    if (!id || isOwner) return;
    const trimmed = midtransB64.trim();
    if (!trimmed) {
      setErr(
        "Tempel JSON Midtrans (serverKey + clientKey) atau Base64, atau hapus konfigurasi.",
      );
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const blob = encodeMidtransKeyForStorage(midtransB64);
      await sbRpcSuperadminSetMidtransKey(id, blob);
      setMidtransB64("");
      setMidtransRotate(false);
      await refreshTenantQueries();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Gagal menyimpan Midtrans.");
    } finally {
      setBusy(false);
    }
  };

  const onClearMidtrans = async () => {
    if (!id || isOwner) return;
    setBusy(true);
    setErr(null);
    try {
      await sbRpcSuperadminSetMidtransKey(id, null);
      setMidtransB64("");
      setMidtransRotate(false);
      await refreshTenantQueries();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Gagal menghapus Midtrans.");
    } finally {
      setBusy(false);
    }
  };

  const onCreateKey = async () => {
    setNewKeyPlain(null);
    setBusy(true);
    try {
      const r = await sbRpcCreateSubsKey();
      setNewKeyPlain(r.key);
      await queryClient.invalidateQueries({ queryKey: superQueryKeys.subsKeys() });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Gagal membuat key.");
    } finally {
      setBusy(false);
    }
  };

  if (!id) {
    return <p className="text-sm text-neutral-600">ID tidak valid.</p>;
  }

  const loadErr =
    tenantQuery.isError
      ? tenantQuery.error instanceof Error
        ? tenantQuery.error.message
        : "Gagal memuat."
      : tenantQuery.isSuccess && !t
        ? "Tenant tidak ditemukan."
        : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-wrap items-center gap-3">
        <PageHeader title={name || "Tenant"} subtitle="Detail & subscription key." />
        <Link
          to="/pos/super/tenants"
          className="text-sm font-bold text-red-700 hover:underline"
        >
          ← Daftar
        </Link>
      </div>

      {err ? <p className="text-sm font-semibold text-red-700">{err}</p> : null}
      {loadErr ? (
        <p className="text-sm font-semibold text-red-700">{loadErr}</p>
      ) : null}

      {tenantQuery.isPending ? (
        <p className="text-sm text-neutral-500">Memuat tenant…</p>
      ) : null}

      {t && isOwner ? (
        <Card className="p-6 border-amber-200 bg-amber-50/50">
          <p className="text-sm font-semibold text-amber-900">
            Ini adalah baris platform (owner). Edit dari menu Settings.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => navigate("/pos/super/settings")}
          >
            Buka Settings
          </Button>
        </Card>
      ) : t && !isOwner ? (
        <Card className="p-6 sm:p-8">
          <form onSubmit={(e) => void onSave(e)} className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-neutral-600">Nama</span>
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
              <span className="text-xs font-bold text-neutral-600">Sub status</span>
              <select
                value={subStatus}
                onChange={(e) => setSubStatus(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm"
              >
                <option value="active">active</option>
                <option value="expired">expired</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-600">
                Akhir langganan (opsional)
              </span>
              <input
                type="date"
                value={endSub}
                onChange={(e) => setEndSub(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-600">Logo URL</span>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </label>
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan perubahan"}
            </Button>
          </form>
        </Card>
      ) : null}

      {t && !isOwner ? (
        <Card className="p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-red-600 shrink-0 mt-0.5" aria-hidden />
            <div className="min-w-0 flex-1 space-y-3">
              <h2 className="text-sm font-extrabold text-neutral-900">
                Midtrans (customer QRIS)
              </h2>
              <p className="text-sm text-neutral-600">
                Tempel JSON{" "}
                <code className="rounded bg-neutral-100 px-1">
                  &#123; &quot;serverKey&quot;, &quot;clientKey&quot; &#125;
                </code>{" "}
                dari dashboard Midtrans, atau Base64 yang sudah di-encode. Aplikasi
                meng-encode JSON ke Base64 sebelum menyimpan. Nilai tidak pernah
                ditampilkan lagi setelah tersimpan.
              </p>
              {(t.midtrans_configured ?? false) && !midtransRotate ? (
                <div className="space-y-3">
                  <p className="font-mono text-sm tracking-widest text-neutral-800">
                    ••••••••
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => {
                        setErr(null);
                        setMidtransB64("");
                        setMidtransRotate(true);
                      }}
                    >
                      Ganti kunci
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void onClearMidtrans()}
                    >
                      Hapus konfigurasi
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-xs font-bold text-neutral-600">
                      Kredensial Midtrans
                    </span>
                    <textarea
                      value={midtransB64}
                      onChange={(e) => setMidtransB64(e.target.value)}
                      autoComplete="off"
                      rows={3}
                      className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-red-600/25"
                      style={
                        { WebkitTextSecurity: "disc" } as CSSProperties
                      }
                      placeholder='{"serverKey":"...","clientKey":"..."} atau Base64'
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={busy}
                      onClick={() => void onSaveMidtrans()}
                    >
                      {busy ? "Menyimpan…" : "Simpan Midtrans"}
                    </Button>
                    {(t.midtrans_configured ?? false) ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          setMidtransRotate(false);
                          setMidtransB64("");
                          setErr(null);
                        }}
                      >
                        Batal
                      </Button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : null}

      {t && !isOwner ? (
        <Card className="p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <KeyRound className="h-5 w-5 text-red-600 shrink-0 mt-0.5" aria-hidden />
            <div>
              <h2 className="text-sm font-extrabold text-neutral-900">
                Subscription keys
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Buat key baru; salin sekali lalu berikan ke outlet. Key disimpan sebagai
                plaintext di database (hanya untuk lingkungan yang memang menerima risiko ini).
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            disabled={busy}
            onClick={() => void onCreateKey()}
          >
            Generate key baru
          </Button>
          {newKeyPlain ? (
            <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
              <p className="text-xs font-bold uppercase text-green-800">
                Salin sekarang (tidak ditampilkan lagi)
              </p>
              <code className="mt-2 block break-all text-sm font-mono text-green-900">
                {newKeyPlain}
              </code>
            </div>
          ) : null}
          {subsKeysQuery.isPending ? (
            <p className="mt-6 text-sm text-neutral-500">Memuat keys…</p>
          ) : (
            <ul className="mt-6 space-y-2 text-sm">
              {keys.map((k) => (
                <li
                  key={k.id}
                  className="flex justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2 font-mono text-xs"
                >
                  <span>{k.id.slice(0, 8)}…</span>
                  <span className="font-bold">
                    {k.is_active ? "aktif" : "pending"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
    </div>
  );
}
