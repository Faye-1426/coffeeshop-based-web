/**
 * Normalize Midtrans credentials for `tenants.midtrans_key` (Base64 blob consumed by Edge).
 * Accepts either JSON `{"serverKey","clientKey"}` (or snake_case) or an existing Base64 blob.
 */
function utf8ToBase64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]!);
  }
  return btoa(bin);
}

function validateParsedKeys(o: Record<string, unknown>): {
  serverKey: string;
  clientKey: string;
} {
  const serverRaw = o.serverKey ?? o.server_key;
  const clientRaw = o.clientKey ?? o.client_key;
  const serverKey =
    typeof serverRaw === "string" ? serverRaw.trim() : "";
  const clientKey =
    typeof clientRaw === "string" ? clientRaw.trim() : "";
  if (!serverKey || !clientKey) {
    throw new Error(
      "JSON harus memuat serverKey dan clientKey (atau server_key / client_key).",
    );
  }
  return { serverKey, clientKey };
}

/**
 * @returns Base64 string safe to store in DB / send to RPC
 */
export function encodeMidtransKeyForStorage(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Kredensial Midtrans kosong.");
  }

  if (trimmed.startsWith("{")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error("JSON tidak valid.");
    }
    if (!parsed || typeof parsed !== "object") {
      throw new Error("JSON tidak valid.");
    }
    const { serverKey, clientKey } = validateParsedKeys(
      parsed as Record<string, unknown>,
    );
    const json = JSON.stringify({ serverKey, clientKey });
    return utf8ToBase64(json);
  }

  const compact = trimmed.replace(/\s/g, "");
  try {
    const decoded = atob(compact);
    const o = JSON.parse(decoded) as Record<string, unknown>;
    validateParsedKeys(o);
    return compact;
  } catch {
    throw new Error(
      "Format tidak dikenali. Tempel JSON Midtrans atau string Base64 yang sudah benar.",
    );
  }
}
