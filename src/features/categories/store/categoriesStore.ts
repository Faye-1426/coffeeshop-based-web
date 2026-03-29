import { create } from "zustand";
import { posCategoriesSeed, posProductsSeed } from "../../../data/posDummyData";
import type { PosCategory, PosProduct } from "../../../types/pos";
import { isSupabaseConfigured } from "../../../lib/supabaseClient";
import { requireRemoteTenantId } from "../../../lib/supabase/remoteTenant";
import { queryClient } from "../../../lib/queryClient";
import { posQueryKeys } from "../../../lib/posQueryKeys";
import {
  sbDeleteCategory,
  sbInsertCategory,
  sbUpdateCategory,
} from "../../../lib/posSupabaseData";

type CategoriesState = {
  categories: PosCategory[];
  /** Snapshot for item counts (dummy mode only). */
  productsSnapshot: PosProduct[];
  modalOpen: boolean;
  editing: PosCategory | null;
  name: string;
  openCreate: () => void;
  openEdit: (c: PosCategory) => void;
  setName: (name: string) => void;
  closeModal: () => void;
  save: () => void | Promise<void>;
  remove: (id: string) => void | Promise<void>;
};

const useSeed = !isSupabaseConfigured();

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: useSeed ? [...posCategoriesSeed] : [],
  productsSnapshot: useSeed ? [...posProductsSeed] : [],
  modalOpen: false,
  editing: null,
  name: "",

  openCreate: () => {
    set({ editing: null, name: "", modalOpen: true });
  },

  openEdit: (c) => {
    set({ editing: c, name: c.name, modalOpen: true });
  },

  setName: (name) => set({ name }),

  closeModal: () => set({ modalOpen: false }),

  save: async () => {
    const { editing, name } = get();
    const trimmed = name.trim();
    if (!trimmed) return;

    if (isSupabaseConfigured()) {
      try {
        const tid = requireRemoteTenantId();
        if (editing) {
          await sbUpdateCategory(editing.id, trimmed);
        } else {
          await sbInsertCategory(tid, trimmed);
        }
        await queryClient.invalidateQueries({ queryKey: posQueryKeys.root });
        set({ modalOpen: false });
      } catch (e) {
        window.alert(
          e instanceof Error ? e.message : "Gagal menyimpan kategori.",
        );
      }
      return;
    }

    if (editing) {
      set((s) => ({
        categories: s.categories.map((c) =>
          c.id === editing.id ? { ...c, name: trimmed } : c,
        ),
        modalOpen: false,
      }));
    } else {
      const id = `cat-${Date.now()}`;
      set((s) => ({
        categories: [...s.categories, { id, name: trimmed }],
        modalOpen: false,
      }));
    }
  },

  remove: async (id) => {
    if (
      !window.confirm(
        "Hapus kategori? Produk yang memakai kategori ini mungkin gagal jika masih ada referensi.",
      )
    ) {
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        await sbDeleteCategory(id);
        await queryClient.invalidateQueries({ queryKey: posQueryKeys.root });
      } catch (e) {
        window.alert(
          e instanceof Error ? e.message : "Gagal menghapus kategori.",
        );
      }
      return;
    }

    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
    }));
  },
}));
