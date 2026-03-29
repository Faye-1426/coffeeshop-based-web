import { create } from "zustand";
import {
  posCategoriesSeed,
  posProductsSeed,
} from "../../../data/posDummyData";
import type { PosCategory, PosProduct } from "../../../types/pos";
import { isSupabaseConfigured } from "../../../lib/supabaseClient";
import { requireRemoteTenantId } from "../../../lib/supabase/remoteTenant";
import { queryClient } from "../../../lib/queryClient";
import { posQueryKeys } from "../../../lib/posQueryKeys";
import {
  sbDeleteProduct,
  sbInsertProduct,
  sbUpdateProduct,
} from "../../../lib/posSupabaseData";

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
  openCreate: (categories: PosCategory[]) => void;
  openEdit: (p: PosProduct) => void;
  setForm: (updater: (f: ProductFormState) => ProductFormState) => void;
  closeModal: () => void;
  save: () => void | Promise<void>;
  remove: (id: string) => void | Promise<void>;
};

const emptyForm = (categoryId: string): ProductFormState => ({
  name: "",
  price: "",
  stock: "",
  categoryId,
  badge: "",
});

const useSeed = !isSupabaseConfigured();

export const useProductsStore = create<ProductsState>((set, get) => ({
  categories: useSeed ? [...posCategoriesSeed] : [],
  products: useSeed ? [...posProductsSeed] : [],
  modalOpen: false,
  editing: null,
  form: emptyForm(useSeed ? posCategoriesSeed[0]?.id ?? "" : ""),

  openCreate: (categories) => {
    set({
      editing: null,
      form: emptyForm(categories[0]?.id ?? ""),
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

  save: async () => {
    const { editing, form } = get();
    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!name || Number.isNaN(price) || Number.isNaN(stock)) return;
    const badge = form.badge.trim() || undefined;

    if (isSupabaseConfigured()) {
      try {
        const tid = requireRemoteTenantId();
        if (editing) {
          await sbUpdateProduct(editing.id, {
            name,
            price,
            stock,
            categoryId: form.categoryId,
            badge,
          });
        } else {
          await sbInsertProduct(tid, {
            name,
            price,
            stock,
            categoryId: form.categoryId,
            badge,
          });
        }
        await queryClient.invalidateQueries({ queryKey: posQueryKeys.root });
        set({ modalOpen: false });
      } catch (e) {
        window.alert(e instanceof Error ? e.message : "Gagal menyimpan produk.");
      }
      return;
    }

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

  remove: async (id) => {
    if (!window.confirm("Hapus produk?")) return;

    if (isSupabaseConfigured()) {
      try {
        await sbDeleteProduct(id);
        await queryClient.invalidateQueries({ queryKey: posQueryKeys.root });
      } catch (e) {
        window.alert(e instanceof Error ? e.message : "Gagal menghapus produk.");
      }
      return;
    }

    set((s) => ({
      products: s.products.filter((p) => p.id !== id),
    }));
  },
}));
