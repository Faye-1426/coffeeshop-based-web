import { useMemo } from "react";
import { categoryItemCount } from "../data";
import type { PosCategory, PosProduct } from "../../../types/pos";

export function useCategoryRows(
  categories: PosCategory[],
  products: PosProduct[],
) {
  return useMemo(
    () =>
      categories.map((c) => ({
        ...c,
        count: categoryItemCount(c.id, products),
      })),
    [categories, products],
  );
}
