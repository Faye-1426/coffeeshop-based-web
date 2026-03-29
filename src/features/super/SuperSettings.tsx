import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import {
  sbUpdatePlatformSettings,
  sbUpdateTenant,
} from "../../lib/superAdminData";
import { superQueryKeys } from "../../lib/superQueryKeys";
import {
  useSuperOwnerTenantQuery,
  useSuperPlatformSettingsQuery,
} from "../../hooks/useSuperAdminQueries";

export default function SuperSettings() {
  const queryClient = useQueryClient();
  const platformQuery = useSuperPlatformSettingsQuery();
  const ownerQuery = useSuperOwnerTenantQuery();

  const [brandName, setBrandName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerSlug, setOwnerSlug] = useState("");
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ps = platformQuery.data;
    if (!ps) return;
    setBrandName(ps.brand_name ?? "");
    setPrimaryColor(ps.primary_color ?? "");
    setLogoUrl(ps.logo_url ?? "");
    setSupportEmail(ps.support_email ?? "");
  }, [platformQuery.data]);

  useEffect(() => {
    const owner = ownerQuery.data;
    if (!owner) {
      setOwnerId(null);
      return;
    }
    setOwnerId(owner.id);
    setOwnerName(owner.name);
    setOwnerSlug(owner.slug);
  }, [ownerQuery.data]);

  const onSavePlatform = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await sbUpdatePlatformSettings({
        brand_name: brandName.trim() || null,
        primary_color: primaryColor.trim() || null,
        logo_url: logoUrl.trim() || null,
        support_email: supportEmail.trim() || null,
      });
      await queryClient.invalidateQueries({
        queryKey: superQueryKeys.platformSettings(),
      });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Gagal simpan platform.");
    } finally {
      setBusy(false);
    }
  };

  const onSaveOwner = async (e: FormEvent) => {
    e.preventDefault();
    if (!ownerId) return;
    setBusy(true);
    setErr(null);
    try {
      await sbUpdateTenant(ownerId, {
        name: ownerName.trim(),
        slug: ownerSlug.trim(),
      });
      await queryClient.invalidateQueries({
        queryKey: superQueryKeys.ownerTenant(),
      });
      await queryClient.invalidateQueries({ queryKey: superQueryKeys.tenants() });
      await queryClient.invalidateQueries({
        queryKey: superQueryKeys.tenant(ownerId),
      });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Gagal simpan tenant platform.");
    } finally {
      setBusy(false);
    }
  };

  const loadErr =
    platformQuery.isError || ownerQuery.isError
      ? [
          platformQuery.error instanceof Error
            ? platformQuery.error.message
            : null,
          ownerQuery.error instanceof Error ? ownerQuery.error.message : null,
        ]
          .filter(Boolean)
          .join(" ") || "Gagal memuat settings."
      : null;

  return (
    <div className="space-y-8 max-w-xl">
      <PageHeader
        title="Settings"
        subtitle="Brand platform & baris tenant owner (Warcoop)."
      />
      {err ? <p className="text-sm font-semibold text-red-700">{err}</p> : null}
      {loadErr &&
      !platformQuery.isPending &&
      !ownerQuery.isPending &&
      (platformQuery.isError || ownerQuery.isError) ? (
        <p className="text-sm font-semibold text-red-700">{loadErr}</p>
      ) : null}

      <Card className="p-6 sm:p-8">
        <h2 className="text-sm font-extrabold text-neutral-900">
          Platform settings
        </h2>
        {platformQuery.isPending ? (
          <p className="mt-4 text-sm text-neutral-500">Memuat…</p>
        ) : (
          <form onSubmit={(e) => void onSavePlatform(e)} className="mt-4 space-y-3">
            <label className="block text-xs font-bold text-neutral-600">
              Brand name
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-normal"
              />
            </label>
            <label className="block text-xs font-bold text-neutral-600">
              Primary color (hex)
              <input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#dc2626"
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-normal font-mono"
              />
            </label>
            <label className="block text-xs font-bold text-neutral-600">
              Logo URL
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-normal"
              />
            </label>
            <label className="block text-xs font-bold text-neutral-600">
              Support email
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-normal"
              />
            </label>
            <Button type="submit" disabled={busy}>
              Simpan platform
            </Button>
          </form>
        )}
      </Card>

      <Card className="p-6 sm:p-8 border-amber-200 bg-amber-50/40">
        <h2 className="text-sm font-extrabold text-neutral-900">
          Tenant platform (is_owner)
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Satu baris khusus untuk entitas Warcoop di tabel tenants.
        </p>
        {ownerQuery.isPending ? (
          <p className="mt-4 text-sm text-neutral-500">Memuat…</p>
        ) : (
          <form onSubmit={(e) => void onSaveOwner(e)} className="mt-4 space-y-3">
            <label className="block text-xs font-bold text-neutral-600">
              Nama
              <input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-normal"
              />
            </label>
            <label className="block text-xs font-bold text-neutral-600">
              Slug
              <input
                value={ownerSlug}
                onChange={(e) => setOwnerSlug(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-normal font-mono"
              />
            </label>
            <Button type="submit" disabled={busy || !ownerId}>
              Simpan tenant platform
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
