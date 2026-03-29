import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import Button from "../../../components/ui/Button";
import { useTenant } from "../../../lib/supabase/TenantContext";
import { sbValidateAndBindSubscriptionKey } from "../../../lib/superAdminData";

export default function OutletSubscriptionKeySection() {
  const { tenantRow, subsKeyRow, refreshProfile } = useTenant();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!tenantRow || tenantRow.is_owner) {
    return null;
  }

  const locked = Boolean(subsKeyRow?.is_active);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    const raw = value.trim();
    if (!raw) {
      setErr("Masukkan subscription key.");
      return;
    }
    setBusy(true);
    try {
      const r = await sbValidateAndBindSubscriptionKey(raw);
      if (!r.ok) {
        if (r.error === "invalid_key") {
          setErr("Key tidak valid atau sudah dipakai.");
        } else if (r.error === "no_tenant") {
          setErr("Profil tidak memiliki outlet.");
        } else {
          setErr("Validasi gagal.");
        }
        return;
      }
      setValue("");
      await refreshProfile();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border-b border-neutral-200 py-8 max-w-3xl bg-amber-50/35">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
          <KeyRound className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold text-neutral-900">
            Subscription Key
          </h2>
          <p className="mt-1 text-sm text-neutral-600 leading-relaxed">
            {locked
              ? "Langganan aktif. Key terkunci dan tidak dapat diubah dari sini."
              : "Masukkan key dari Warcoop untuk mengaktifkan fitur POS outlet ini."}
          </p>
        </div>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-3">
        <label className="block">
          <span className="text-xs font-bold text-neutral-600">Key</span>
          {locked ? (
            <div
              className="mt-1 w-full rounded-2xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-sm font-mono tracking-[0.35em] text-neutral-500 select-none"
              aria-readonly
            >
              ••••••••••••••••
            </div>
          ) : (
            <input
              type="password"
              name="subscription-key"
              autoComplete="off"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Tempel subscription key"
              className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
            />
          )}
        </label>
        {err ? (
          <p className="text-sm font-semibold text-red-700">{err}</p>
        ) : null}
        {!locked ? (
          <Button type="submit" disabled={busy} className="w-full sm:w-auto">
            {busy ? "Memvalidasi…" : "Validasi & aktifkan"}
          </Button>
        ) : null}
      </form>
    </section>
  );
}
