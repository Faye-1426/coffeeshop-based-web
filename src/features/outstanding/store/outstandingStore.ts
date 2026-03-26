import { create } from "zustand";
import { posOutstandingSeed } from "../../../data/posDummyData";
import type { PosOutstanding } from "../../../types/pos";

type OutstandingState = {
  rows: PosOutstanding[];
  markPaid: (id: string) => void;
};

export const useOutstandingStore = create<OutstandingState>((set) => ({
  rows: [...posOutstandingSeed],

  markPaid: (id) => {
    if (!window.confirm("Tandai sebagai lunas? (UI only)")) return;
    set((s) => ({ rows: s.rows.filter((r) => r.id !== id) }));
  },
}));
