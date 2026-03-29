import { create } from "zustand";
import { posCategoriesSeed, posProductsSeed } from "../../../data/posDummyData";
import type { PosCategory, PosProduct } from "../../../types/pos";

type CategoriesState = {
  categories: PosCategory[];
  /** Snapshot for item counts (same pattern as original local state). */
  productsSnapshot: PosProduct[];
  modalOpen: boolean;
  editing: PosCategory | null;
  name: string;
  openCreate: () => void;
  openEdit: (c: PosCategory) => void;
  setName: (name: string) => void;
  closeModal: () => void;
  save: () => void;
  remove: (id: string) => void;
};

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [...posCategoriesSeed],
  productsSnapshot: [...posProductsSeed],
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

  save: () => {
    const { editing, name } = get();
    const trimmed = name.trim();
    if (!trimmed) return;
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

  remove: (id) => {
    if (
      !window.confirm(
        "Hapus kategori? (UI only — produk tidak ikut di-update otomatis)",
      )
    )
      return;
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
    }));
  },
}));
