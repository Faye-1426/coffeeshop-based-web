import { getSupabase } from "../supabaseClient";

/** Outlet owner only: set or clear `tenants.midtrans_key` (Base64 blob). */
export async function sbRpcOwnerSetMidtransKey(
  midtransKeyB64: string | null,
): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.rpc("rpc_owner_set_midtrans_key", {
    p_midtrans_key_b64: midtransKeyB64 === null ? "" : midtransKeyB64,
  });
  if (error) throw error;
}
