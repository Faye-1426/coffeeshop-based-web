export type CategoryId =
  | "coffee"
  | "nonCoffee"
  | "snacks"
  | "meals";

export type Badge = "Popular" | "Best Seller" | "New" | "Hot" | "Limited";

export type MenuCategory = {
  id: CategoryId;
  name: string;
};

export type VariantOption = {
  id: string;
  label: string;
  priceDelta: number;
};

export type VariantGroup = {
  id: string;
  name: string;
  options: VariantOption[];
};

export type MenuProduct = {
  id: string;
  name: string;
  price: number; // in IDR
  categoryId: CategoryId;
  description?: string;
  badge?: Badge;
  imageSrc: string; // data URI (frontend-only)
  variantGroups?: VariantGroup[];
};

export type ProductVariantSelection = Record<string, string>; // groupId -> optionId

export type CartItem = {
  id: string; // unique by productId + selection
  productId: string;
  quantity: number;
  variantSelection: ProductVariantSelection;
};

