// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function decodeMidtransKeys(b64: string): {
  serverKey: string;
  clientKey: string;
} {
  const trimmed = b64.trim();
  const json = atob(trimmed);
  const o = JSON.parse(json) as { serverKey?: string; clientKey?: string };
  if (!o?.serverKey || !o?.clientKey) {
    throw new Error(
      "midtrans_key must decode to JSON with serverKey and clientKey",
    );
  }
  return { serverKey: String(o.serverKey), clientKey: String(o.clientKey) };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !serviceKey) {
      return jsonResponse({ error: "Missing Supabase env" }, 500);
    }

    const body = (await req.json().catch(() => null)) as {
      order_id?: string;
      checkout_nonce?: string;
    } | null;
    const orderId = body?.order_id?.trim();
    const nonce = body?.checkout_nonce?.trim();
    if (!orderId || !nonce) {
      return jsonResponse(
        { error: "order_id and checkout_nonce required" },
        400,
      );
    }

    const supabase = createClient(url, serviceKey);
    const { data: order, error: oErr } = await supabase
      .from("orders")
      .select(
        "id, tenant_id, status, total_price, checkout_nonce, customer_name, customer_email",
      )
      .eq("id", orderId)
      .maybeSingle();

    if (oErr || !order) {
      return jsonResponse({ error: "Order not found" }, 404);
    }

    if (String(order.status) !== "awaiting_payment") {
      return jsonResponse({ error: "Order is not awaiting payment" }, 400);
    }

    if (String(order.checkout_nonce) !== nonce) {
      return jsonResponse({ error: "Invalid checkout nonce" }, 403);
    }

    const { data: tenant, error: tErr } = await supabase
      .from("tenants")
      .select("midtrans_key, midtrans_configured")
      .eq("id", order.tenant_id)
      .maybeSingle();

    if (tErr || !tenant?.midtrans_key || !tenant.midtrans_configured) {
      return jsonResponse(
        { error: "Outlet has not configured Midtrans payment" },
        400,
      );
    }

    let keys: { serverKey: string; clientKey: string };
    try {
      keys = decodeMidtransKeys(String(tenant.midtrans_key));
    } catch {
      return jsonResponse({ error: "Invalid Midtrans key configuration" }, 500);
    }

    const production = Deno.env.get("MIDTRANS_PRODUCTION") === "true";
    const apiBase = production
      ? "https://app.midtrans.com"
      : "https://app.sandbox.midtrans.com";
    const snapJs = production
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    const gross = Number(order.total_price);
    if (!Number.isFinite(gross) || gross <= 0) {
      return jsonResponse({ error: "Invalid order amount" }, 400);
    }

    const snapBody = {
      transaction_details: {
        order_id: String(order.id),
        gross_amount: gross,
      },
      customer_details: {
        first_name: (order.customer_name as string)?.trim() || "Customer",
        email:
          (order.customer_email as string)?.trim() || "customer@example.com",
      },
      enabled_payments: ["qris"],
    };

    const auth = btoa(`${keys.serverKey}:`);
    const mtRes = await fetch(`${apiBase}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(snapBody),
    });

    const mtJson = (await mtRes.json().catch(() => null)) as {
      token?: string;
      error_messages?: string[];
      message?: string;
    } | null;

    if (!mtRes.ok || !mtJson?.token) {
      const msg =
        mtJson?.error_messages?.join?.("; ") ??
        mtJson?.message ??
        `Midtrans HTTP ${mtRes.status}`;
      console.error("midtrans-snap Midtrans error:", msg);
      return jsonResponse({ error: msg, data: mtJson }, 502);
    }

    return jsonResponse({
      token: mtJson.token,
      client_key: keys.clientKey,
      snap_js_url: snapJs,
    });
  } catch (e) {
    console.error("midtrans-snap:", e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Internal error" },
      500,
    );
  }
});
