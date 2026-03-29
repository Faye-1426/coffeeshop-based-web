import type { CustomerMenuPayload } from "../../../lib/supabase/customerPublicData";
import type { MenuCategory, MenuProduct } from "../types";
import { menuImageDataUri } from "./images";

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
}

export function mapCustomerMenuToUi(payload: CustomerMenuPayload): {
  categories: MenuCategory[];
  products: MenuProduct[];
} {
  const categories: MenuCategory[] = payload.categories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const products: MenuProduct[] = payload.products.map((p) => {
    const price = num(p.price);
    const label = p.name.trim().slice(0, 3) || "—";
    const imageSrc =
      p.image_url && p.image_url.trim().length > 0
        ? p.image_url.trim()
        : menuImageDataUri({
            label,
            bg: "#f5f5f4",
            icon: "coffee",
          });

    return {
      id: p.id,
      name: p.name,
      price,
      categoryId: p.category_id,
      description: undefined,
      badge: p.badge?.trim() ? p.badge.trim() : undefined,
      imageSrc,
      variantGroups: undefined,
    };
  });

  return { categories, products };
}

export function buildCategoryProductCache(
  products: MenuProduct[],
): Record<string, MenuProduct[]> {
  const by: Record<string, MenuProduct[]> = {};
  for (const p of products) {
    if (!by[p.categoryId]) by[p.categoryId] = [];
    by[p.categoryId]!.push(p);
  }
  return by;
}

export function buildCategoryCounts(
  products: MenuProduct[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of products) {
    counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1;
  }
  return counts;
}
