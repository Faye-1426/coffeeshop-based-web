import type { CSSProperties, FormEvent, ReactNode } from "react";
import { useState } from "react";
import { CreditCard, Store, UserRound } from "lucide-react";
import { useTenant } from "../../tenants/context/TenantContext";
import {
  formatTenantShortId,
  formatUuidShort,
} from "../../../lib/formatPosIds";
import { encodeMidtransKeyForStorage } from "../../../lib/midtransKeyNormalize";
import { sbRpcOwnerSetMidtransKey } from "../../../lib/supabase/tenantMidtransRpc";

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
  const { tenantRow, profile, user, refreshProfile } = useTenant();
  const [midtransInput, setMidtransInput] = useState("");
  const [midtransBusy, setMidtransBusy] = useState(false);
  const [midtransErr, setMidtransErr] = useState<string | null>(null);
  const [rotateMidtrans, setRotateMidtrans] = useState(false);

  if (!tenantRow || !profile) return null;

  const isOutletOwner = profile.role_id === 1;

  const endLabel = tenantRow.end_subscription
    ? new Date(tenantRow.end_subscription).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const roleLabel =
    profile.role_name ?? `Peran #${profile.role_id}`;

  async function saveMidtrans(e: FormEvent) {
    e.preventDefault();
    setMidtransErr(null);
    const trimmed = midtransInput.trim();
    if (!trimmed) {
      setMidtransErr(
        "Tempel JSON Midtrans (serverKey + clientKey) atau Base64 yang sudah di-encode.",
      );
      return;
    }
    setMidtransBusy(true);
    try {
      const blob = encodeMidtransKeyForStorage(midtransInput);
      await sbRpcOwnerSetMidtransKey(blob);
      setMidtransInput("");
      setRotateMidtrans(false);
      await refreshProfile();
    } catch (ex) {
      setMidtransErr(
        ex instanceof Error ? ex.message : "Gagal menyimpan Midtrans.",
      );
    } finally {
      setMidtransBusy(false);
    }
  }

  async function clearMidtrans() {
    setMidtransErr(null);
    setMidtransBusy(true);
    try {
      await sbRpcOwnerSetMidtransKey(null);
      setMidtransInput("");
      setRotateMidtrans(false);
      await refreshProfile();
    } catch (ex) {
      setMidtransErr(
        ex instanceof Error ? ex.message : "Gagal menghapus konfigurasi.",
      );
    } finally {
      setMidtransBusy(false);
    }
  }

  const midtransStatusNonOwner = tenantRow.midtrans_configured ? (
    <span className="font-mono tracking-widest text-neutral-700">
      ••••••••
    </span>
  ) : (
    "Belum dikonfigurasi"
  );

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
            <CreditCard className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-neutral-900">
                Pembayaran QRIS (Midtrans)
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Tempel JSON dari Midtrans (serverKey + clientKey) atau Base64; akan
                di-encode ke Base64 sebelum disimpan dan tidak ditampilkan lagi.
              </p>
            </div>

            {midtransErr ? (
              <p className="text-sm font-semibold text-red-700">{midtransErr}</p>
            ) : null}

            {!isOutletOwner ? (
              <DetailRow
                label="Status kunci"
                value={
                  tenantRow.midtrans_configured ? (
                    <span className="font-mono tracking-widest">••••••••</span>
                  ) : (
                    "Belum dikonfigurasi — hubungi pemilik outlet."
                  )
                }
              />
            ) : tenantRow.midtrans_configured && !rotateMidtrans ? (
              <div className="space-y-3">
                <DetailRow label="Kunci Midtrans" value={midtransStatusNonOwner} />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={midtransBusy}
                    onClick={() => {
                      setMidtransErr(null);
                      setMidtransInput("");
                      setRotateMidtrans(true);
                    }}
                    className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-bold text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Ganti kunci
                  </button>
                  <button
                    type="button"
                    disabled={midtransBusy}
                    onClick={() => void clearMidtrans()}
                    className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-800 hover:bg-red-100 disabled:opacity-50"
                  >
                    Hapus konfigurasi
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => void saveMidtrans(e)} className="space-y-3">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                    Kredensial Midtrans
                  </span>
                  <textarea
                    value={midtransInput}
                    onChange={(e) => setMidtransInput(e.target.value)}
                    autoComplete="off"
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-red-600/25"
                    style={{ WebkitTextSecurity: "disc" } as CSSProperties}
                    placeholder='{"serverKey":"...","clientKey":"..."} atau Base64'
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={midtransBusy}
                    className="rounded-full bg-red-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {midtransBusy ? "Menyimpan…" : "Simpan"}
                  </button>
                  {tenantRow.midtrans_configured ? (
                    <button
                      type="button"
                      disabled={midtransBusy}
                      onClick={() => {
                        setRotateMidtrans(false);
                        setMidtransInput("");
                        setMidtransErr(null);
                      }}
                      className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-bold hover:bg-neutral-50"
                    >
                      Batal
                    </button>
                  ) : null}
                </div>
              </form>
            )}
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
