import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { CartItem, MenuProduct } from "./types";
import { getUnitPrice, useCartStore } from "./lib/cart";
import { menuProducts } from "./data/menuData";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { customerQueryKeys } from "../../lib/keys/customerQueryKeys";
import {
  customerMenuPayloadToPriceMap,
  customerMenuPayloadToStockMap,
  sbCustomerFetchMenu,
} from "../../lib/supabase/customerPublicData";
import { mapCustomerMenuToUi } from "./lib/catalogFromRemote";
import { storeKeyToTenantSlug } from "./lib/storePath";
import {
  useCustomerCreateOrderMutation,
  useCustomerMenuQuery,
} from "../../hooks/useCustomerRemoteData";

function findProductLocal(productId: string): MenuProduct | undefined {
  return menuProducts.find((p) => p.id === productId);
}

function formatRp(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export default function CheckoutPage() {
  const { storeKey } = useParams<{ storeKey: string }>();
  const tenantSlugDb = storeKey ? storeKeyToTenantSlug(storeKey) : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { items, clear } = useCartStore();
  const createOrder = useCustomerCreateOrderMutation();
  const menuQuery = useCustomerMenuQuery(tenantSlugDb);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [payment, setPayment] = useState<"cash" | "card">("cash");
  const [touched, setTouched] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [priceCheckPending, setPriceCheckPending] = useState(false);

  const useRemote = isSupabaseConfigured() && Boolean(tenantSlugDb);

  const catalogProducts = useMemo(() => {
    if (!useRemote || !menuQuery.data) {
      return menuProducts;
    }
    return mapCustomerMenuToUi(menuQuery.data).products;
  }, [useRemote, menuQuery.data]);

  const itemsWithProducts = useMemo(() => {
    const list: Array<{ item: CartItem; product: MenuProduct }> = [];
    for (const item of items) {
      const product =
        catalogProducts.find((p) => p.id === item.productId) ??
        findProductLocal(item.productId);
      if (!product) continue;
      list.push({ item, product });
    }
    return list;
  }, [items, catalogProducts]);

  const totalCount = useMemo(() => {
    return items.reduce((sum, i) => sum + i.quantity, 0);
  }, [items]);

  const totalPrice = useMemo(() => {
    return itemsWithProducts.reduce((sum, x) => {
      const unit = getUnitPrice(x.product, x.item.variantSelection);
      return sum + unit * x.item.quantity;
    }, 0);
  }, [itemsWithProducts]);

  const nameOk = name.trim().length > 0;
  const emailOk = isValidEmail(email);
  const formValid = nameOk && emailOk;
  const nameError = touched && !nameOk;
  const emailError = touched && !emailOk;

  if (!storeKey || !tenantSlugDb) {
    return (
      <div className="max-w-3xl mx-auto py-10 text-center text-sm text-neutral-600">
        Invalid store URL.
      </div>
    );
  }

  async function validateCartAgainstServer(): Promise<boolean> {
    if (!useRemote || !tenantSlugDb) return true;
    setValidationError(null);
    setPriceCheckPending(true);
    try {
      const payload = await queryClient.fetchQuery({
        queryKey: customerQueryKeys.menu(tenantSlugDb),
        queryFn: () => sbCustomerFetchMenu(tenantSlugDb),
      });
      const prices = customerMenuPayloadToPriceMap(payload);
      const stocks = customerMenuPayloadToStockMap(payload);
      for (const { item, product } of itemsWithProducts) {
        const serverPrice = prices.get(product.id);
        const stock = stocks.get(product.id);
        if (serverPrice === undefined) {
          setValidationError(
            `Product "${product.name}" is no longer available.`,
          );
          return false;
        }
        const unit = getUnitPrice(product, item.variantSelection);
        if (Math.abs(unit - serverPrice) > 0.01) {
          setValidationError(
            `Price changed for "${product.name}". Refresh and review your cart.`,
          );
          return false;
        }
        if (stock !== undefined && stock < item.quantity) {
          setValidationError(`Not enough stock for "${product.name}".`);
          return false;
        }
      }
      return true;
    } catch (e) {
      setValidationError(
        e instanceof Error ? e.message : "Could not validate cart.",
      );
      return false;
    } finally {
      setPriceCheckPending(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(`/${storeKey}`)}
          className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-bold hover:bg-neutral-50 transition"
        >
          ← Back to menu
        </button>

        <div className="text-xs text-neutral-500 font-bold">
          {totalCount > 0 ? `${totalCount} items` : "Cart empty"}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-neutral-200 bg-white/70 p-5 sm:p-6">
        <h1 className="font-extrabold text-2xl text-neutral-900">Checkout</h1>

        <div className="mt-2 text-sm text-neutral-600">
          {useRemote
            ? "Order is sent to the outlet (pending). Prices are verified on submit."
            : "Demo mode (no Supabase): order is not saved."}
        </div>

        {validationError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {validationError}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-4">
          {itemsWithProducts.length === 0 ? (
            <div className="rounded-3xl bg-neutral-50 border border-neutral-200 p-6">
              <div className="font-extrabold text-neutral-900">
                Your cart is empty
              </div>
              <div className="mt-2 text-sm text-neutral-600">
                Pick items from the menu first.
              </div>
              <button
                type="button"
                onClick={() => navigate(`/${storeKey}`)}
                className="mt-5 rounded-full bg-red-600 text-white px-5 py-2.5 text-sm font-extrabold hover:bg-red-700 transition"
              >
                Browse menu
              </button>
            </div>
          ) : (
            itemsWithProducts.map(({ item, product }) => {
              const selectionText = (product.variantGroups ?? [])
                .map((g) => {
                  const picked = item.variantSelection[g.id];
                  const opt = g.options.find((o) => o.id === picked);
                  return picked && opt ? `${g.name}: ${opt.label}` : "";
                })
                .filter(Boolean)
                .join(", ");

              const unit = getUnitPrice(product, item.variantSelection);
              const subtotal = unit * item.quantity;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-4"
                >
                  <div className="flex gap-4 items-start">
                    <img
                      src={product.imageSrc}
                      alt={product.name}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-neutral-900 text-sm sm:text-base">
                        {product.name}
                      </div>
                      {selectionText ? (
                        <div className="mt-1 text-xs text-neutral-600">
                          {selectionText}
                        </div>
                      ) : null}
                      <div className="mt-3 flex items-center justify-between gap-4">
                        <div className="text-sm text-neutral-600">
                          Qty:{" "}
                          <span className="font-extrabold">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-neutral-500">
                            Subtotal
                          </div>
                          <div className="font-extrabold text-neutral-900">
                            {formatRp(subtotal)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {itemsWithProducts.length > 0 ? (
          <div className="mt-6 rounded-3xl bg-neutral-50 border border-neutral-200 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block sm:col-span-2">
                <span className="text-sm font-extrabold text-neutral-900">
                  Name <span className="text-red-600">*</span>
                </span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={[
                    "mt-2 w-full rounded-2xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25",
                    nameError ? "border-red-400" : "border-neutral-200",
                  ].join(" ")}
                />
                {nameError ? (
                  <p className="mt-1 text-xs text-red-600">Name is required.</p>
                ) : null}
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-extrabold text-neutral-900">
                  Email <span className="text-red-600">*</span>
                </span>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={[
                    "mt-2 w-full rounded-2xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25",
                    emailError ? "border-red-400" : "border-neutral-200",
                  ].join(" ")}
                />
                {emailError ? (
                  <p className="mt-1 text-xs text-red-600">
                    Enter a valid email address.
                  </p>
                ) : null}
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-extrabold text-neutral-900">
                  Payment <span className="text-red-600">*</span>
                </span>
                <select
                  required
                  value={payment}
                  onChange={(e) =>
                    setPayment(e.target.value as "cash" | "card")
                  }
                  className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                </select>
              </label>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-extrabold text-neutral-900">
                  Total
                </div>
                <div className="text-xs text-neutral-600">
                  {useRemote
                    ? "Verified on place order"
                    : "Includes option deltas (demo)"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-neutral-500">Amount</div>
                <div className="font-extrabold text-neutral-900 text-xl">
                  {formatRp(totalPrice)}
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={
                  !formValid || priceCheckPending || createOrder.isPending
                }
                onClick={async () => {
                  setTouched(true);
                  if (!formValid) return;
                  const ok = await validateCartAgainstServer();
                  if (!ok) return;
                  if (useRemote && tenantSlugDb) {
                    try {
                      const lines = itemsWithProducts.map(
                        ({ item, product }) => ({
                          product_id: product.id,
                          quantity: item.quantity,
                          line_item_name: product.name,
                        }),
                      );
                      const orderId = await createOrder.mutateAsync({
                        tenantSlugDb,
                        customerName: name.trim(),
                        customerEmail: email.trim(),
                        tableNumber: "Online",
                        lines,
                      });
                      clear();
                      navigate(`/${storeKey}/order-success`, {
                        replace: true,
                        state: { orderId, live: true },
                      });
                    } catch (e) {
                      setValidationError(
                        e instanceof Error ? e.message : "Order failed",
                      );
                    }
                  } else {
                    clear();
                    navigate(`/${storeKey}/order-success`, {
                      replace: true,
                      state: { orderId: "demo", live: false },
                    });
                  }
                }}
                className={[
                  "flex-1 rounded-full py-3 text-sm font-extrabold shadow transition",
                  formValid && !priceCheckPending && !createOrder.isPending
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-red-200 text-red-800 cursor-not-allowed",
                ].join(" ")}
              >
                {priceCheckPending || createOrder.isPending
                  ? "Placing…"
                  : "Place order"}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/${storeKey}`)}
                className="rounded-full border border-neutral-200 bg-white py-3 px-5 text-sm font-extrabold hover:bg-neutral-50 transition"
              >
                Back to menu
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
