import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore, getCartCount, getUnitPrice } from "../lib/cart";
import { menuProducts } from "../data/menuData";
import type { CartItem, MenuProduct } from "../types";
import CartLineItem from "./CartLineItem";

function findProduct(productId: string): MenuProduct | undefined {
  return menuProducts.find((p) => p.id === productId);
}

function formatRp(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export default function CartDrawer() {
  const navigate = useNavigate();
  const { isOpen, items, close, clear } = useCartStore();

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

  return (
    <div
      className={[
        "fixed inset-0 z-40 transition-opacity",
        isOpen ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      aria-hidden={!isOpen}
    >
      <div
        className={[
          "absolute inset-0 bg-black/30 transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onClick={close}
      />

      <aside
        className={[
          "absolute right-0 top-0 h-dvh w-[92vw] sm:w-full max-w-md",
          "bg-white md:rounded-l-3xl shadow-2xl border-l border-neutral-200",
          "transition-transform duration-250 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between gap-4">
          <div>
            <div className="font-extrabold text-neutral-900 text-lg">Cart</div>
            <div className="text-xs text-neutral-600">
              {totalCount > 0 ? `${totalCount} items` : "Your cart is empty"}
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            className="rounded-full h-10 w-10 border border-neutral-200 bg-white hover:bg-neutral-50 transition"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        <div className="h-[calc(100dvh-200px)] overflow-y-auto p-5">
          {itemsWithProducts.length === 0 ? (
            <div className="rounded-3xl bg-neutral-50 border border-neutral-200 p-6">
              <div className="font-extrabold text-neutral-900">
                No items yet
              </div>
              <div className="mt-2 text-sm text-neutral-600">
                Pick something delicious from the menu first.
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {itemsWithProducts.map(({ item, product }) => (
                <CartLineItem key={item.id} item={item} product={product} />
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-600">Total</div>
            <div className="font-extrabold text-neutral-900">
              {formatRp(totalPrice)}
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              disabled={itemsWithProducts.length === 0}
              onClick={clear}
              className={[
                "flex-1 rounded-full py-2.5 text-sm font-bold transition",
                itemsWithProducts.length === 0
                  ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                  : "bg-neutral-900 text-white hover:bg-neutral-800",
              ].join(" ")}
            >
              Clear
            </button>
            <button
              type="button"
              disabled={itemsWithProducts.length === 0}
              onClick={() => {
                close();
                navigate("/checkout");
              }}
              className={[
                "flex-1 rounded-full py-2.5 text-sm font-bold transition",
                itemsWithProducts.length === 0
                  ? "bg-red-200 text-red-700 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700",
              ].join(" ")}
            >
              Checkout
            </button>
          </div>

          <div className="mt-3 text-[11px] text-neutral-500">
            Dummy checkout UI (no backend).
          </div>
        </div>
      </aside>
    </div>
  );
}
