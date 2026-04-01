// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

function decodeMidtransKeys(b64: string): { serverKey: string; clientKey: string } {
  const trimmed = b64.trim();
  const json = atob(trimmed);
  const o = JSON.parse(json) as { serverKey?: string; clientKey?: string };
  if (!o?.serverKey || !o?.clientKey) {
    throw new Error("invalid midtrans_key");
  }
  return { serverKey: String(o.serverKey), clientKey: String(o.clientKey) };
}

async function sha512HexLower(s: string): Promise<string> {
  const data = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-512", data);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !serviceKey) {
      return new Response("Server misconfigured", { status: 500 });
    }

    const raw = await req.text();
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return new Response("Bad JSON", { status: 400 });
    }

    const orderId = String(payload.order_id ?? "").trim();
    const statusCode = String(payload.status_code ?? "").trim();
    const grossAmount = String(payload.gross_amount ?? "").trim();
    const signatureKey = String(payload.signature_key ?? "").trim().toLowerCase();
    const transactionStatus = String(payload.transaction_status ?? "")
      .trim()
      .toLowerCase();
    const transactionId = String(payload.transaction_id ?? "").trim();

    if (!orderId || !statusCode || !grossAmount || !signatureKey) {
      return new Response("Missing notification fields", { status: 400 });
    }

    const supabase = createClient(url, serviceKey);

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .select("id, tenant_id, status")
      .eq("id", orderId)
      .maybeSingle();

    if (oErr || !order) {
      // Ack to stop Midtrans retries for unknown IDs
      return new Response("OK", { status: 200 });
    }

    const { data: tenant, error: tErr } = await supabase
      .from("tenants")
      .select("midtrans_key")
      .eq("id", order.tenant_id)
      .maybeSingle();

    if (tErr || !tenant?.midtrans_key) {
      console.error("midtrans-webhook: no tenant key", order.tenant_id);
      return new Response("OK", { status: 200 });
    }

    let serverKey: string;
    try {
      serverKey = decodeMidtransKeys(String(tenant.midtrans_key)).serverKey;
    } catch {
      console.error("midtrans-webhook: decode key failed");
      return new Response("OK", { status: 200 });
    }

    const expected = await sha512HexLower(
      orderId + statusCode + grossAmount + serverKey,
    );
    if (expected !== signatureKey) {
      console.error("midtrans-webhook: bad signature");
      return new Response("Invalid signature", { status: 403 });
    }

    if (transactionStatus !== "settlement" && transactionStatus !== "capture") {
      return new Response("OK", { status: 200 });
    }

    if (!transactionId) {
      return new Response("OK", { status: 200 });
    }

    const grossNum = Number(grossAmount);
    if (!Number.isFinite(grossNum)) {
      return new Response("OK", { status: 200 });
    }

    const { data: fin, error: fErr } = await supabase.rpc(
      "rpc_finalize_midtrans_payment",
      {
        p_order_id: orderId,
        p_gateway_transaction_id: transactionId,
        p_gross_amount: grossNum,
        p_transaction_status: transactionStatus,
      },
    );

    if (fErr) {
      console.error("midtrans-webhook finalize:", fErr);
      return new Response(fErr.message, { status: 500 });
    }

    console.log("midtrans-webhook finalized:", orderId, fin);
    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("midtrans-webhook:", e);
    return new Response("Error", { status: 500 });
  }
});
