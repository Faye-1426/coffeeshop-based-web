import { create } from "zustand";
import {
  posCategoriesSeed,
  posProductsSeed,
} from "../../../data/posDummyData";
import type { PosCategory, PosProduct } from "../../../types/pos";

export type ProductFormState = {
  name: string;
  price: string;
  stock: string;
  categoryId: string;
  badge: string;
};

type ProductsState = {
  categories: PosCategory[];
  products: PosProduct[];
  modalOpen: boolean;
  editing: PosProduct | null;
  form: ProductFormState;
  openCreate: () => void;
  openEdit: (p: PosProduct) => void;
  setForm: (updater: (f: ProductFormState) => ProductFormState) => void;
  closeModal: () => void;
  save: () => void;
  remove: (id: string) => void;
};

const emptyForm = (categoryId: string): ProductFormState => ({
  name: "",
  price: "",
  stock: "",
  categoryId,
  badge: "",
});

export const useProductsStore = create<ProductsState>((set, get) => ({
  categories: [...posCategoriesSeed],
  products: [...posProductsSeed],
  modalOpen: false,
  editing: null,
  form: emptyForm(posCategoriesSeed[0]?.id ?? ""),

  openCreate: () => {
    const cats = get().categories;
    set({
      editing: null,
      form: emptyForm(cats[0]?.id ?? ""),
      modalOpen: true,
    });
  },

  openEdit: (p) => {
    set({
      editing: p,
      form: {
        name: p.name,
        price: String(p.price),
        stock: String(p.stock),
        categoryId: p.categoryId,
        badge: p.badge ?? "",
      },
      modalOpen: true,
    });
  },

  setForm: (updater) => {
    set((s) => ({ form: updater(s.form) }));
  },

  closeModal: () => set({ modalOpen: false }),

  save: () => {
    const { editing, form } = get();
    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!name || Number.isNaN(price) || Number.isNaN(stock)) return;
    const badge = form.badge.trim() || undefined;
    if (editing) {
      set((s) => ({
        products: s.products.map((p) =>
          p.id === editing.id
            ? {
                ...p,
                name,
                price,
                stock,
                categoryId: form.categoryId,
                badge,
                lowStockThreshold: p.lowStockThreshold ?? 10,
              }
            : p,
        ),
        modalOpen: false,
      }));
    } else {
      set((s) => ({
        products: [
          ...s.products,
          {
            id: `p-${Date.now()}`,
            name,
            price,
            stock,
            categoryId: form.categoryId,
            badge,
            lowStockThreshold: 10,
          },
        ],
        modalOpen: false,
      }));
    }
  },

  remove: (id) => {
    if (!window.confirm("Hapus produk?")) return;
    set((s) => ({
      products: s.products.filter((p) => p.id !== id),
    }));
  },
}));
