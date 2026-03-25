import type { CategoryId, MenuCategory, MenuProduct, VariantGroup } from "../types";
import { menuImageDataUri } from "../lib/images";

export const menuCategories: MenuCategory[] = [
  { id: "coffee", name: "Coffee" },
  { id: "nonCoffee", name: "Non-Coffee" },
  { id: "snacks", name: "Snacks" },
  { id: "meals", name: "Meals" },
];

const img = (label: string, bg: string, icon: "coffee" | "milk" | "snack" | "meal"): string =>
  menuImageDataUri({ label, bg, icon });

const sizeGroup: VariantGroup = {
  id: "size",
  name: "Size",
  options: [
    { id: "s", label: "Small", priceDelta: 0 },
    { id: "m", label: "Medium", priceDelta: 3000 },
    { id: "l", label: "Large", priceDelta: 6000 },
  ],
};

const tempGroup: VariantGroup = {
  id: "temp",
  name: "Temperature",
  options: [
    { id: "hot", label: "Hot", priceDelta: 0 },
    { id: "iced", label: "Iced", priceDelta: 500 },
  ],
};

const sweetnessGroup: VariantGroup = {
  id: "sweetness",
  name: "Sweetness",
  options: [
    { id: "less", label: "Less Sugar", priceDelta: 0 },
    { id: "normal", label: "Normal", priceDelta: 1000 },
    { id: "extra", label: "Extra Sweet", priceDelta: 2000 },
  ],
};

const snackDipGroup: VariantGroup = {
  id: "dip",
  name: "Dip",
  options: [
    { id: "none", label: "No Dip", priceDelta: 0 },
    { id: "garlic", label: "Garlic", priceDelta: 800 },
    { id: "spicy", label: "Spicy", priceDelta: 1200 },
  ],
};

const mealSpiceGroup: VariantGroup = {
  id: "spice",
  name: "Spice Level",
  options: [
    { id: "mild", label: "Mild", priceDelta: 0 },
    { id: "mid", label: "Medium", priceDelta: 1000 },
    { id: "hot", label: "Extra Hot", priceDelta: 2000 },
  ],
};

const portionGroup: VariantGroup = {
  id: "portion",
  name: "Portion",
  options: [
    { id: "regular", label: "Regular", priceDelta: 0 },
    { id: "big", label: "Big", priceDelta: 7000 },
  ],
};

export const menuProducts: MenuProduct[] = [
  // Coffee
  {
    id: "espresso",
    name: "Espresso",
    price: 18000,
    categoryId: "coffee",
    description: "Bold & smooth, strong character.",
    badge: "Popular",
    imageSrc: img("Espresso", "#6B3E2E", "coffee"),
    variantGroups: [sizeGroup, tempGroup],
  },
  {
    id: "americano",
    name: "Americano",
    price: 22000,
    categoryId: "coffee",
    description: "A classic, clean coffee cup.",
    imageSrc: img("Americano", "#8A5A44", "coffee"),
    variantGroups: [sizeGroup, tempGroup],
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    price: 26000,
    categoryId: "coffee",
    description: "Foamy top, balanced flavor.",
    badge: "Best Seller",
    imageSrc: img("Cappuccino", "#9B6B4F", "coffee"),
    variantGroups: [sizeGroup, tempGroup],
  },
  {
    id: "latte",
    name: "Vanilla Latte",
    price: 32000,
    categoryId: "coffee",
    description: "Creamy vanilla sweetness.",
    badge: "New",
    imageSrc: img("Vanilla Latte", "#B0896C", "milk"),
    variantGroups: [sizeGroup, tempGroup],
  },
  {
    id: "mocha",
    name: "Mocha",
    price: 34000,
    categoryId: "coffee",
    description: "Chocolatey comfort with coffee kick.",
    badge: "Hot",
    imageSrc: img("Mocha", "#5B2D2D", "coffee"),
    variantGroups: [sizeGroup, tempGroup],
  },

  // Non-Coffee
  {
    id: "matcha",
    name: "Iced Matcha",
    price: 28000,
    categoryId: "nonCoffee",
    description: "Earthy matcha with a cool finish.",
    badge: "Popular",
    imageSrc: img("Matcha", "#2F7D32", "milk"),
    variantGroups: [sizeGroup, sweetnessGroup],
  },
  {
    id: "choco",
    name: "Choco Milk",
    price: 25000,
    categoryId: "nonCoffee",
    description: "Thick, sweet chocolate milk.",
    imageSrc: img("Choco Milk", "#7A3E2B", "milk"),
    variantGroups: [sizeGroup, sweetnessGroup],
  },
  {
    id: "lemonTea",
    name: "Lemon Tea Sparkling",
    price: 23000,
    categoryId: "nonCoffee",
    description: "Crisp lemon with a fizzy twist.",
    badge: "Limited",
    imageSrc: img("Lemon Tea", "#F59E0B", "milk"),
    variantGroups: [sizeGroup, sweetnessGroup],
  },
  {
    id: "jasmine",
    name: "Jasmine Tea (Hot)",
    price: 20000,
    categoryId: "nonCoffee",
    description: "Aromatics that feel like a reset.",
    imageSrc: img("Jasmine Tea", "#22C55E", "milk"),
    variantGroups: [sizeGroup, sweetnessGroup],
  },

  // Snacks
  {
    id: "croissant",
    name: "Butter Croissant",
    price: 18000,
    categoryId: "snacks",
    description: "Flaky layers, warm & buttery.",
    badge: "Best Seller",
    imageSrc: img("Croissant", "#D97706", "snack"),
    variantGroups: [portionGroup, snackDipGroup],
  },
  {
    id: "donut",
    name: "Strawberry Donut",
    price: 17000,
    categoryId: "snacks",
    description: "Sweet glaze with berry punch.",
    badge: "New",
    imageSrc: img("Strawberry Donut", "#F43F5E", "snack"),
    variantGroups: [portionGroup, snackDipGroup],
  },
  {
    id: "fritter",
    name: "Banana Fritters",
    price: 22000,
    categoryId: "snacks",
    description: "Crispy banana bites with dip.",
    imageSrc: img("Banana Fritters", "#92400E", "snack"),
    variantGroups: [portionGroup, snackDipGroup],
  },
  {
    id: "fries",
    name: "Garlic Fries",
    price: 24000,
    categoryId: "snacks",
    description: "Golden fries with garlic aroma.",
    badge: "Popular",
    imageSrc: img("Garlic Fries", "#9A3412", "snack"),
    variantGroups: [portionGroup, snackDipGroup],
  },

  // Meals
  {
    id: "katsu",
    name: "Chicken Katsu",
    price: 45000,
    categoryId: "meals",
    description: "Crisp katsu with tangy sauce.",
    badge: "Best Seller",
    imageSrc: img("Chicken Katsu", "#EF4444", "meal"),
    variantGroups: [portionGroup, mealSpiceGroup],
  },
  {
    id: "nasiGoreng",
    name: "Nasi Goreng Special",
    price: 42000,
    categoryId: "meals",
    description: "Smoky wok flavor, extra toppings.",
    badge: "Hot",
    imageSrc: img("Nasi Goreng", "#F97316", "meal"),
    variantGroups: [portionGroup, mealSpiceGroup],
  },
  {
    id: "spaghetti",
    name: "Spaghetti Bolognaise",
    price: 39000,
    categoryId: "meals",
    description: "Rich meat sauce over springy pasta.",
    imageSrc: img("Bolognaise", "#DC2626", "meal"),
    variantGroups: [portionGroup, mealSpiceGroup],
  },
  {
    id: "spicyChicken",
    name: "Spicy Crispy Chicken",
    price: 43000,
    categoryId: "meals",
    description: "Crunchy chicken with spicy kick.",
    badge: "Limited",
    imageSrc: img("Crispy Chicken", "#B91C1C", "meal"),
    variantGroups: [portionGroup, mealSpiceGroup],
  },
];

// Keeping this export for potential future extension.
export const allCategoryIds: CategoryId[] = ["coffee", "nonCoffee", "snacks", "meals"];

