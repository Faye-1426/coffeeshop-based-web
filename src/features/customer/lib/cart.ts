import { create } from "zustand";
import type {
  CartItem,
  MenuProduct,
  ProductVariantSelection,
} from "../types";

type CartState = {
  /** URL segment `:storeKey` (e.g. `warkop-store`); switching clears cart. */
  scopeStoreKey: string | null;
  setScopeStoreKey: (storeKey: string) => void;
  isOpen: boolean;
  items: CartItem[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  clear: () => void;
  add: (args: { product: MenuProduct; quantity?: number; selection?: ProductVariantSelection }) => void;
  setQuantity: (args: { cartItemId: string; quantity: number }) => void;
  remove: (cartItemId: string) => void;
};

function stableSelectionKey(selection: ProductVariantSelection): string {
  // Sort keys so the same selection object always produces the same id.
  const keys = Object.keys(selection).sort();
  return keys.map((k) => `${k}:${selection[k]}`).join("|");
}

function makeCartItemId(productId: string, selection: ProductVariantSelection): string {
  return `${productId}::${stableSelectionKey(selection)}`;
}

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

export function getUnitPrice(product: MenuProduct, selection: ProductVariantSelection): number {
  const groups = product.variantGroups ?? [];
  let delta = 0;

  for (const group of groups) {
    const pickedOptionId = selection[group.id];
    if (!pickedOptionId) continue;
    const opt = group.options.find((o) => o.id === pickedOptionId);
    if (!opt) continue;
    delta += opt.priceDelta;
  }

  return product.price + delta;
}

export const useCartStore = create<CartState>((set, get) => ({
  scopeStoreKey: null,
  setScopeStoreKey: (storeKey: string) =>
    set((state) => {
      if (state.scopeStoreKey === storeKey) return state;
      return { scopeStoreKey: storeKey, items: [], isOpen: false };
    }),

  isOpen: false,
  items: [],

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set({ isOpen: !get().isOpen }),

  clear: () => set({ items: [] }),

  add: ({ product, quantity = 1, selection }) => {
    const resolvedSelection = selection ?? buildDefaultSelection(product);
    const cartItemId = makeCartItemId(product.id, resolvedSelection);

    set((state) => {
      const existing = state.items.find((i) => i.id === cartItemId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === cartItemId ? { ...i, quantity: i.quantity + quantity } : i,
          ),
        };
      }

      const newItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        quantity,
        variantSelection: resolvedSelection,
      };

      return { items: [...state.items, newItem] };
    });
  },

  setQuantity: ({ cartItemId, quantity }) => {
    set((state) => {
      const nextQty = Math.max(0, Math.floor(quantity));
      if (nextQty === 0) {
        return { items: state.items.filter((i) => i.id !== cartItemId) };
      }
      return {
        items: state.items.map((i) =>
          i.id === cartItemId ? { ...i, quantity: nextQty } : i,
        ),
      };
    });
  },

  remove: (cartItemId) => {
    set((state) => ({ items: state.items.filter((i) => i.id !== cartItemId) }));
  },
}));

export function getCartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

