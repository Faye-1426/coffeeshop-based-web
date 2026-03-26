import type { PosOrder } from "../../../types/pos";

export function nextOrderId(existing: PosOrder[]): string {
  const n =
    existing.reduce((max, o) => {
      const m = /^ORD-(\d+)$/.exec(o.id);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 1000) + 1;
  return `ORD-${n}`;
}
