import { useMemo } from "react";
import type { PosProduct } from "../../../types/pos";

export function useSortedProducts(products: PosProduct[]) {
  return useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  );
}
