import { getSupabase } from "../supabaseClient";

export type CustomerMenuCategoryRow = {
  id: string;
  name: string;
};

export type CustomerMenuProductRow = {
  id: string;
  name: string;
  price: number | string;
  stock_units: number;
  category_id: string;
  badge: string | null;
  image_url: string | null;
};

export type CustomerMenuPayload = {
  categories: CustomerMenuCategoryRow[];
  products: CustomerMenuProductRow[];
};

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
}

export async function sbCustomerFetchMenu(
  tenantSlugDb: string,
): Promise<CustomerMenuPayload> {
  const sb = getSupabase();
  if (!sb) {
    throw new Error("Supabase not configured");
  }
  const { data, error } = await sb.rpc("rpc_customer_menu", {
    p_slug: tenantSlugDb,
  });
  if (error) throw error;
  const raw = data as {
    categories?: unknown;
    products?: unknown;
  } | null;
  if (!raw || typeof raw !== "object") {
    return { categories: [], products: [] };
  }
  const categories = Array.isArray(raw.categories)
    ? (raw.categories as CustomerMenuCategoryRow[])
    : [];
  const products = Array.isArray(raw.products)
    ? (raw.products as CustomerMenuProductRow[])
    : [];
  return { categories, products };
}

export type CustomerCreateOrderLine = {
  product_id: string;
  quantity: number;
  line_item_name?: string;
};

export type CustomerCheckoutResult = {
  order_id: string;
  checkout_nonce: string;
};

export async function sbCustomerCreateCheckout(args: {
  tenantSlugDb: string;
  customerName: string;
  customerEmail: string;
  tableNumber?: string;
  lines: CustomerCreateOrderLine[];
}): Promise<CustomerCheckoutResult> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb.rpc("rpc_customer_create_checkout", {
    p_slug: args.tenantSlugDb,
    p_customer_name: args.customerName,
    p_customer_email: args.customerEmail,
    p_table_number: args.tableNumber ?? "Online",
    p_lines: args.lines as never,
  });
  if (error) throw error;
  const raw = data as {
    order_id?: string;
    checkout_nonce?: string;
  } | null;
  if (!raw?.order_id || !raw?.checkout_nonce) {
    throw new Error("Invalid checkout response");
  }
  return {
    order_id: String(raw.order_id),
    checkout_nonce: String(raw.checkout_nonce),
  };
}

export type MidtransSnapTokenResponse = {
  token: string;
  client_key: string;
  snap_js_url: string;
};

export async function sbInvokeMidtransSnap(args: {
  orderId: string;
  checkoutNonce: string;
}): Promise<MidtransSnapTokenResponse> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb.functions.invoke("midtrans-snap", {
    body: {
      order_id: args.orderId,
      checkout_nonce: args.checkoutNonce,
    },
  });
  if (error) throw error;
  const o = data as Record<string, unknown> | null;
  if (!o?.token || !o?.client_key || !o?.snap_js_url) {
    throw new Error(
      typeof o?.error === "string"
        ? o.error
        : "Midtrans Snap did not return a token",
    );
  }
  return {
    token: String(o.token),
    client_key: String(o.client_key),
    snap_js_url: String(o.snap_js_url),
  };
}

export function customerMenuPayloadToPriceMap(
  payload: CustomerMenuPayload,
): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of payload.products) {
    m.set(p.id, num(p.price));
  }
  return m;
}

export function customerMenuPayloadToStockMap(
  payload: CustomerMenuPayload,
): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of payload.products) {
    m.set(p.id, p.stock_units ?? 0);
  }
  return m;
}
