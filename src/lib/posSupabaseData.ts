import { getSupabase } from "./supabaseClient";
import type {
  OrderStatus,
  PaymentMethod,
  PosCategory,
  PosOrder,
  PosOrderLine,
  PosOutstanding,
  PosProduct,
  PosTransaction,
} from "../types/pos";

const LOW_STOCK_THRESHOLD = 10;

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
}

export async function sbFetchCategories(): Promise<PosCategory[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("categories")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.name }));
}

export async function sbInsertCategory(
  tenantId: string,
  name: string,
): Promise<PosCategory> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb
    .from("categories")
    .insert({ tenant_id: tenantId, name })
    .select("id, name")
    .single();
  if (error) throw error;
  return { id: data.id, name: data.name };
}

export async function sbUpdateCategory(id: string, name: string) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.from("categories").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function sbDeleteCategory(id: string) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function sbFetchProducts(): Promise<PosProduct[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("products")
    .select("id, name, price, stock_units, category_id, badge")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    price: num(r.price),
    stock: r.stock_units ?? 0,
    categoryId: r.category_id,
    badge: r.badge ?? undefined,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
  }));
}

export async function sbInsertProduct(
  tenantId: string,
  row: {
    name: string;
    price: number;
    stock: number;
    categoryId: string;
    badge?: string;
  },
): Promise<PosProduct> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb
    .from("products")
    .insert({
      tenant_id: tenantId,
      category_id: row.categoryId,
      name: row.name,
      price: row.price,
      stock_units: row.stock,
      badge: row.badge || null,
    })
    .select("id, name, price, stock_units, category_id, badge")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    price: num(data.price),
    stock: data.stock_units ?? 0,
    categoryId: data.category_id,
    badge: data.badge ?? undefined,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
  };
}

export async function sbUpdateProduct(
  id: string,
  row: {
    name: string;
    price: number;
    stock: number;
    categoryId: string;
    badge?: string;
  },
) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb
    .from("products")
    .update({
      name: row.name,
      price: row.price,
      stock_units: row.stock,
      category_id: row.categoryId,
      badge: row.badge || null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function sbDeleteProduct(id: string) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) throw error;
}

type OrderItemRow = {
  product_id: string;
  line_item_name: string;
  quantity: number;
  unit_price_at_sale: unknown;
};

type OrderRow = {
  id: string;
  status: OrderStatus;
  table_number: string;
  customer_name: string | null;
  created_at: string;
  total_price: unknown;
  order_items: OrderItemRow[] | null;
};

function mapOrderRow(o: OrderRow): PosOrder {
  const items: PosOrderLine[] = (o.order_items ?? []).map((li) => ({
    productId: li.product_id,
    name: li.line_item_name,
    qty: li.quantity,
    unitPrice: num(li.unit_price_at_sale),
  }));
  return {
    id: o.id,
    status: o.status,
    tableNumber: o.table_number,
    customerName: o.customer_name ?? "",
    createdAt: o.created_at,
    total: num(o.total_price),
    items,
  };
}

export async function sbFetchOrders(): Promise<PosOrder[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("orders")
    .select(
      `
      id,
      status,
      table_number,
      customer_name,
      created_at,
      total_price,
      order_items (
        product_id,
        line_item_name,
        quantity,
        unit_price_at_sale
      )
    `,
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapOrderRow(r as OrderRow));
}

export async function sbCreateOrder(
  tenantId: string,
  draft: Omit<PosOrder, "id" | "createdAt">,
) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data: order, error: e1 } = await sb
    .from("orders")
    .insert({
      tenant_id: tenantId,
      table_number: draft.tableNumber,
      customer_name: draft.customerName,
      status: draft.status,
      total_price: draft.total,
    })
    .select("id")
    .single();
  if (e1) throw e1;
  for (const line of draft.items) {
    const { error: e2 } = await sb.from("order_items").insert({
      order_id: order.id,
      product_id: line.productId,
      line_item_name: line.name,
      quantity: line.qty,
      unit_price_at_sale: line.unitPrice,
    });
    if (e2) throw e2;
  }
}

export async function sbUpdateOrderStatus(id: string, status: OrderStatus) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export type PayAndCompleteOrderInput = {
  tenantId: string;
  orderId: string;
  total: number;
  customerName: string | null;
  method: PaymentMethod;
  amountPaid: number;
  /** Wajib untuk metode BON (YYYY-MM-DD). */
  dueDate?: string;
};

/**
 * Insert transaksi (dan outstanding jika BON), lalu set order completed.
 */
export async function sbPayAndCompleteOrder(input: PayAndCompleteOrderInput) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");

  const isBon = input.method === "bon";
  const status = isBon ? "unpaid" : "paid";

  if (input.method === "cash" && input.amountPaid < input.total) {
    throw new Error("Jumlah tunai kurang dari total.");
  }
  if (input.method === "qris" && input.amountPaid < input.total) {
    throw new Error("Nominal pembayaran QRIS kurang dari total.");
  }
  if (isBon && !input.dueDate?.trim()) {
    throw new Error("BON memerlukan tanggal jatuh tempo.");
  }

  const amountPaidNum =
    input.method === "qris" ? input.total : input.amountPaid;
  const changeAmount =
    input.method === "cash"
      ? Math.max(0, amountPaidNum - input.total)
      : 0;

  const { data: txRow, error: e1 } = await sb
    .from("transactions")
    .insert({
      tenant_id: input.tenantId,
      order_id: input.orderId,
      payment_method: input.method,
      amount_paid: amountPaidNum,
      change_amount: changeAmount,
      customer_name: input.customerName?.trim() || null,
      status,
    })
    .select("id")
    .single();
  if (e1) throw e1;

  if (isBon && txRow?.id) {
    const { error: e2 } = await sb.from("outstanding").insert({
      tenant_id: input.tenantId,
      customer_name: input.customerName?.trim() || "BON",
      amount: input.total,
      due_date: input.dueDate!,
      transaction_id: txRow.id,
    });
    if (e2) throw e2;
  }

  const { error: e3 } = await sb
    .from("orders")
    .update({ status: "completed" })
    .eq("id", input.orderId);
  if (e3) throw e3;
}

function mapTransaction(r: {
  id: string;
  order_id: string | null;
  payment_method: PosTransaction["method"];
  amount_paid: unknown;
  change_amount: unknown;
  customer_name: string | null;
  status: PosTransaction["status"];
  created_at: string;
}): PosTransaction {
  return {
    id: r.id,
    orderId: r.order_id ?? undefined,
    method: r.payment_method,
    amount: num(r.amount_paid),
    change: num(r.change_amount),
    status: r.status,
    customerName: r.customer_name ?? undefined,
    createdAt: r.created_at,
  };
}

export async function sbFetchTransactions(): Promise<PosTransaction[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("transactions")
    .select(
      "id, order_id, payment_method, amount_paid, change_amount, customer_name, status, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapTransaction(r));
}

export async function sbFetchOutstanding(): Promise<PosOutstanding[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("outstanding")
    .select("id, customer_name, amount, due_date, transaction_id")
    .order("due_date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    customerName: r.customer_name,
    amount: num(r.amount),
    dueDate: r.due_date,
    transactionId: r.transaction_id,
  }));
}

export async function sbMarkOutstandingPaid(
  outstandingId: string,
  transactionId: string,
) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { error: e1 } = await sb
    .from("transactions")
    .update({ status: "paid" })
    .eq("id", transactionId);
  if (e1) throw e1;
  const { error: e2 } = await sb
    .from("outstanding")
    .delete()
    .eq("id", outstandingId);
  if (e2) throw e2;
}

export type DashboardSnapshot = {
  paidTotal: number;
  orderCount: number;
  activeOrders: number;
  lowStockCount: number;
  recent: PosTransaction[];
};

export async function sbFetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const sb = getSupabase();
  if (!sb) {
    return {
      paidTotal: 0,
      orderCount: 0,
      activeOrders: 0,
      lowStockCount: 0,
      recent: [],
    };
  }
  const [txRes, ordRes, prodRes, recentRes] = await Promise.all([
    sb
      .from("transactions")
      .select("amount_paid, status")
      .eq("status", "paid"),
    sb.from("orders").select("status"),
    sb.from("products").select("stock_units"),
    sb
      .from("transactions")
      .select(
        "id, order_id, payment_method, amount_paid, change_amount, customer_name, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (txRes.error) throw txRes.error;
  if (ordRes.error) throw ordRes.error;
  if (prodRes.error) throw prodRes.error;
  if (recentRes.error) throw recentRes.error;

  const paidTotal = (txRes.data ?? []).reduce(
    (s, t) => s + num(t.amount_paid),
    0,
  );
  const orders = ordRes.data ?? [];
  const orderCount = orders.length;
  const activeOrders = orders.filter((o) =>
    ["pending", "preparing", "served"].includes(o.status),
  ).length;
  const lowStockCount = (prodRes.data ?? []).filter(
    (p) => (p.stock_units ?? 0) < LOW_STOCK_THRESHOLD,
  ).length;
  const recent = (recentRes.data ?? []).map((r) => mapTransaction(r));

  return {
    paidTotal,
    orderCount,
    activeOrders,
    lowStockCount,
    recent,
  };
}

export async function sbRpcGlobalStats(): Promise<Record<string, unknown>> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb.rpc("rpc_admin_global_stats");
  if (error) throw error;
  return data as Record<string, unknown>;
}
