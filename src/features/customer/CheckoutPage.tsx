import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { menuProducts } from "./data/menuData";
import type { CartItem, MenuProduct } from "./types";
import { getUnitPrice, useCartStore, getCartCount } from "./lib/cart";

function findProduct(productId: string): MenuProduct | undefined {
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
  const navigate = useNavigate();
  const { items, clear } = useCartStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [payment, setPayment] = useState<"cash" | "card">("cash");
  const [touched, setTouched] = useState(false);

  const itemsWithProducts = useMemo(() => {
    const list: Array<{ item: CartItem; product: MenuProduct }> = [];
    for (const item of items) {
      const product = findProduct(item.productId);
      if (!product) continue;
      list.push({ item, product });
    }
    return list;
  }, [items]);

  const totalCount = useMemo(() => getCartCount(items), [items]);
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-bold hover:bg-neutral-50 transition"
        >
          ← Back to menu
        </button>

        <div className="text-xs text-neutral-500 font-bold">
          {totalCount > 0 ? `${totalCount} items` : "Cart empty"}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-neutral-200 bg-white/70 p-5 sm:p-6">
        <h1 className="font-extrabold text-2xl text-neutral-900">
          Checkout
        </h1>

        <div className="mt-2 text-sm text-neutral-600">
          Dummy checkout UI (no backend). Place order to clear cart.
        </div>

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
                onClick={() => navigate("/")}
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
                          Qty: <span className="font-extrabold">{item.quantity}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-neutral-500">Subtotal</div>
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
                  onChange={(e) => setPayment(e.target.value as "cash" | "card")}
                  className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                </select>
              </label>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-extrabold text-neutral-900">Total</div>
                <div className="text-xs text-neutral-600">
                  Includes dummy option price deltas
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
                disabled={!formValid}
                onClick={() => {
                  setTouched(true);
                  if (!formValid) return;
                  clear();
                  navigate("/order-success");
                }}
                className={[
                  "flex-1 rounded-full py-3 text-sm font-extrabold shadow transition",
                  formValid
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-red-200 text-red-800 cursor-not-allowed",
                ].join(" ")}
              >
                Place order
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="rounded-full border border-neutral-200 bg-white py-3 px-5 text-sm font-extrabold hover:bg-neutral-50 transition"
              >
                Continue
              </button>
            </div>

            <div className="mt-3 text-[11px] text-neutral-500">
              Dummy form only: name/email/payment are not sent anywhere.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

