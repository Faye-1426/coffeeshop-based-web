import { create } from "zustand";
import { posTransactionsSeed } from "../../../data/posDummyData";
import type { PosTransaction } from "../../../types/pos";
import { isSupabaseConfigured } from "../../../lib/supabaseClient";
import { sbFetchTransactions } from "../../../lib/posSupabaseData";

type TransactionsState = {
  transactions: PosTransaction[];
  syncFromRemote: () => Promise<void>;
  appendLocal: (row: PosTransaction) => void;
};

const useSeed = !isSupabaseConfigured();

export const useTransactionsStore = create<TransactionsState>((set) => ({
  transactions: useSeed ? [...posTransactionsSeed] : [],

  syncFromRemote: async () => {
    if (!isSupabaseConfigured()) return;
    const transactions = await sbFetchTransactions();
    set({ transactions });
  },

  appendLocal: (row) =>
    set((s) => ({ transactions: [row, ...s.transactions] })),
}));
