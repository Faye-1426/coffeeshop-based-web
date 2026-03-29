import { create } from "zustand";
import { posOutstandingSeed } from "../../../data/posDummyData";
import type { PosOutstanding } from "../../../types/pos";
import { isSupabaseConfigured } from "../../../lib/supabaseClient";
import {
  sbFetchOutstanding,
  sbMarkOutstandingPaid,
} from "../../../lib/posSupabaseData";

type OutstandingState = {
  rows: PosOutstanding[];
  markPaid: (id: string) => void | Promise<void>;
  syncFromRemote: () => Promise<void>;
  appendLocal: (row: PosOutstanding) => void;
};

const useSeed = !isSupabaseConfigured();

export const useOutstandingStore = create<OutstandingState>((set, get) => ({
  rows: useSeed ? [...posOutstandingSeed] : [],

  syncFromRemote: async () => {
    if (!isSupabaseConfigured()) return;
    const rows = await sbFetchOutstanding();
    set({ rows });
  },

  markPaid: async (id) => {
    if (
      !window.confirm("Tandai sebagai lunas? Transaksi akan di-set paid dan piutang dihapus.")
    ) {
      return;
    }

    if (isSupabaseConfigured()) {
      const row = get().rows.find((r) => r.id === id);
      if (!row) return;
      try {
        await sbMarkOutstandingPaid(row.id, row.transactionId);
        await get().syncFromRemote();
      } catch (e) {
        window.alert(
          e instanceof Error
            ? e.message
            : "Gagal menutup piutang (perlu hak Manager/Owner).",
        );
      }
      return;
    }

    set((s) => ({ rows: s.rows.filter((r) => r.id !== id) }));
  },

  appendLocal: (row) => set((s) => ({ rows: [...s.rows, row] })),
}));
