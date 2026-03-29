/** Set by TenantContext when Supabase profile loads (for Zustand stores that cannot use hooks). */
let remoteTenantId: string | null = null;

export function setRemoteTenantId(id: string | null) {
  remoteTenantId = id;
}

export function getRemoteTenantId(): string | null {
  return remoteTenantId;
}

export function requireRemoteTenantId(): string {
  if (!remoteTenantId) {
    throw new Error("Tenant context missing: assign profiles.tenant_id for this user.");
  }
  return remoteTenantId;
}
