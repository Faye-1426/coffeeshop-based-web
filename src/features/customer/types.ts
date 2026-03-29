/** Category id from API (UUID) or demo data (string). */
export type CategoryId = string;

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
  /** Free-text badge from POS or demo labels. */
  badge?: string;
  imageSrc: string;
  variantGroups?: VariantGroup[];
};

export type ProductVariantSelection = Record<string, string>;

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  variantSelection: ProductVariantSelection;
};
