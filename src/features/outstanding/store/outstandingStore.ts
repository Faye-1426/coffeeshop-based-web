import { create } from "zustand";
import { posOutstandingSeed } from "../../../data/posDummyData";
import type { PosOutstanding } from "../../../types/pos";
import { isSupabaseConfigured } from "../../../lib/supabaseClient";
import { queryClient } from "../../../lib/queryClient";
import { posQueryKeys } from "../../../lib/posQueryKeys";
import { sbMarkOutstandingPaid } from "../../../lib/posSupabaseData";

type OutstandingState = {
  rows: PosOutstanding[];
  markPaid: (row: PosOutstanding) => void | Promise<void>;
  appendLocal: (row: PosOutstanding) => void;
};

const useSeed = !isSupabaseConfigured();

export const useOutstandingStore = create<OutstandingState>((set) => ({
  rows: useSeed ? [...posOutstandingSeed] : [],

  markPaid: async (row) => {
    if (
      !window.confirm("Tandai sebagai lunas? Transaksi akan di-set paid dan piutang dihapus.")
    ) {
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        await sbMarkOutstandingPaid(row.id, row.transactionId);
        await queryClient.invalidateQueries({ queryKey: posQueryKeys.root });
      } catch (e) {
        window.alert(
          e instanceof Error
            ? e.message
            : "Gagal menutup piutang (perlu hak Manager/Owner).",
        );
      }
      return;
    }

    set((s) => ({ rows: s.rows.filter((r) => r.id !== row.id) }));
  },

  appendLocal: (row) => set((s) => ({ rows: [...s.rows, row] })),
}));
