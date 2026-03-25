import { Minus, Plus } from "lucide-react";
import type { CartItem, MenuProduct } from "../types";
import { getUnitPrice, useCartStore } from "../lib/cart";

function formatSelectionLabels(product: MenuProduct, item: CartItem): string {
  const groups = product.variantGroups ?? [];
  const parts: string[] = [];
  for (const g of groups) {
    const picked = item.variantSelection[g.id];
    if (!picked) continue;
    const opt = g.options.find((o) => o.id === picked);
    if (!opt) continue;
    parts.push(`${g.name}: ${opt.label}`);
  }
  return parts.join(", ");
}

export default function CartLineItem({ item, product }: { item: CartItem; product: MenuProduct }) {
  const { setQuantity, remove } = useCartStore();
  const unitPrice = getUnitPrice(product, item.variantSelection);
  const subtotal = unitPrice * item.quantity;
  const selectionText = formatSelectionLabels(product, item);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4">
      <div className="flex gap-4 items-start">
        <img
          src={product.imageSrc}
          alt={product.name}
          className="h-16 w-16 rounded-xl object-cover shrink-0"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold text-neutral-900 text-sm sm:text-base">
                {product.name}
              </div>
              {selectionText ? (
                <div className="mt-1 text-xs text-neutral-600">
                  {selectionText}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => remove(item.id)}
              className="text-neutral-500 hover:text-neutral-900 transition"
              aria-label={`Remove ${product.name}`}
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity({ cartItemId: item.id, quantity: item.quantity - 1 })}
                className="h-9 w-9 rounded-full border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50 transition"
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <div className="min-w-8 text-center font-extrabold text-neutral-900">
                {item.quantity}
              </div>
              <button
                type="button"
                onClick={() => setQuantity({ cartItemId: item.id, quantity: item.quantity + 1 })}
                className="h-9 w-9 rounded-full border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50 transition"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="text-right">
              <div className="text-xs text-neutral-500">Subtotal</div>
              <div className="font-extrabold text-neutral-900">
                Rp {subtotal.toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

