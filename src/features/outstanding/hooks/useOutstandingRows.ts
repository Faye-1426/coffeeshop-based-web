import { useOutstandingStore } from "../store/outstandingStore";

export function useOutstandingRows() {
  return useOutstandingStore((s) => s.rows);
}

export function useMarkOutstandingPaid() {
  return useOutstandingStore((s) => s.markPaid);
}
