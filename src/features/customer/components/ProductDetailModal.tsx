import { useEffect, useMemo, useState } from "react";
import type { MenuProduct, ProductVariantSelection } from "../types";
import { getUnitPrice, useCartStore } from "../lib/cart";
import VariantGroupSelector from "./VariantGroupSelector";
import QuantityCounter from "./QuantityCounter";

function buildDefaultSelection(product: MenuProduct): ProductVariantSelection {
  const groups = product.variantGroups ?? [];
  const selection: ProductVariantSelection = {};
  for (const group of groups) {
    const first = group.options[0];
    if (!first) continue;
    selection[group.id] = first.id;
  }
  return selection;
}

function ProductDetailPanel({
  product,
  onClose,
}: {
  product: MenuProduct;
  onClose: () => void;
}) {
  const { add, open } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [selection, setSelection] = useState<ProductVariantSelection>(() =>
    buildDefaultSelection(product),
  );

  const unitPrice = useMemo(
    () => getUnitPrice(product, selection),
    [product, selection],
  );
  const totalPrice = unitPrice * quantity;

  return (
    <>
      <div className="p-5 sm:p-6 border-b border-neutral-200 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs text-neutral-500 font-bold">
            {product.categoryId}
          </div>
          <div className="font-extrabold text-neutral-900 text-lg sm:text-xl mt-1">
            {product.name}
          </div>
          {product.badge ? (
            <div className="mt-2 inline-flex rounded-full bg-red-600 text-white text-[11px] font-extrabold px-3 py-1 shadow">
              {product.badge}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full h-10 w-10 border border-neutral-200 bg-white hover:bg-neutral-50 transition"
          aria-label="Close product detail"
        >
          ✕
        </button>
      </div>

      <div className="p-5 sm:p-6 overflow-y-auto h-[calc(100dvh-164px)]">
        <div className="flex gap-4">
          <div className="relative shrink-0">
            <img
              src={product.imageSrc}
              alt={product.name}
              className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-red-700 font-extrabold text-lg">
              Rp {totalPrice.toLocaleString("id-ID")}
            </div>
            {product.description ? (
              <p className="mt-2 text-sm text-neutral-600">{product.description}</p>
            ) : null}
          </div>
        </div>

        {product.variantGroups && product.variantGroups.length > 0 ? (
          <div className="mt-5 flex flex-col gap-3">
            {product.variantGroups.map((group) => (
              <VariantGroupSelector
                key={group.id}
                group={group}
                selection={selection}
                onPick={(groupId, optionId) =>
                  setSelection((prev) => ({ ...prev, [groupId]: optionId }))
                }
              />
            ))}
          </div>
        ) : null}

        <div className="mt-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-extrabold text-neutral-900">
                Quantity
              </div>
              <div className="text-xs text-neutral-600">{quantity} item(s)</div>
            </div>
            <QuantityCounter
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={50}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => {
              add({ product, quantity, selection });
              open();
              onClose();
            }}
            className="flex-1 rounded-full bg-red-600 text-white py-3 font-extrabold shadow hover:bg-red-700 transition"
          >
            Add to cart
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-200 bg-white py-3 px-5 font-extrabold hover:bg-neutral-50 transition"
          >
            Keep browsing
          </button>
        </div>
      </div>
    </>
  );
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
}: {
  product: MenuProduct | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [displayProduct, setDisplayProduct] = useState<MenuProduct | null>(null);
  const [uiOpen, setUiOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !product) return;
    queueMicrotask(() => setDisplayProduct(product));
  }, [isOpen, product]);

  useEffect(() => {
    if (!isOpen) {
      queueMicrotask(() => setUiOpen(false));
      return;
    }
    const id = requestAnimationFrame(() => setUiOpen(true));
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  useEffect(() => {
    if (!uiOpen && displayProduct) {
      const t = window.setTimeout(() => setDisplayProduct(null), 300);
      return () => window.clearTimeout(t);
    }
  }, [uiOpen, displayProduct]);

  useEffect(() => {
    if (!isOpen && !uiOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, uiOpen, onClose]);

  if (!displayProduct) return null;

  return (
    <div
      className={[
        "fixed inset-0 z-50 transition-opacity duration-300 ease-out",
        uiOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      ].join(" ")}
      aria-hidden={!uiOpen}
    >
      <div
        className={[
          "absolute inset-0 bg-black/30 transition-opacity duration-300 ease-out",
          uiOpen ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onClick={onClose}
      />

      <div className="relative w-full h-dvh flex items-end sm:items-center justify-center p-4">
        <div
          className={[
            "w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-neutral-200",
            "transform transition-all duration-300 ease-out",
            uiOpen
              ? "translate-y-0 opacity-100 sm:scale-100"
              : "translate-y-8 opacity-0 sm:translate-y-0 sm:scale-[0.97]",
          ].join(" ")}
          role="dialog"
          aria-modal="true"
          aria-label="Product detail"
        >
          <ProductDetailPanel key={displayProduct.id} product={displayProduct} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
