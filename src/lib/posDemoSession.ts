/** Dummy tenant + user shown in POS header menu (no backend). */
export const POS_DEMO_TENANT_NAME = "Warcoop — Cabang Sudirman";

export const POS_DEMO_USER_NAME = "Demo Owner";

export type PosAppRole = "cafe" | "super";

export const POS_ROLE_STORAGE_KEY = "warcoop_pos_role";

export function readPosRole(): PosAppRole {
  try {
    return localStorage.getItem(POS_ROLE_STORAGE_KEY) === "super"
      ? "super"
      : "cafe";
  } catch {
    return "cafe";
  }
}

export function writePosRole(r: PosAppRole) {
  try {
    localStorage.setItem(POS_ROLE_STORAGE_KEY, r);
  } catch {
    /* ignore */
  }
}
