import type {
  PosCategory,
  PosOrder,
  PosOutstanding,
  PosProduct,
  PosTransaction,
} from "../types/pos";

export const posCategoriesSeed: PosCategory[] = [
  { id: "cat-coffee", name: "Coffee" },
  { id: "cat-noncoffee", name: "Non-Coffee" },
  { id: "cat-snacks", name: "Snacks" },
  { id: "cat-meals", name: "Meals" },
];

export const posProductsSeed: PosProduct[] = [
  {
    id: "p1",
    name: "Espresso",
    price: 18000,
    stock: 120,
    categoryId: "cat-coffee",
    badge: "Popular",
    lowStockThreshold: 20,
  },
  {
    id: "p2",
    name: "Cappuccino",
    price: 26000,
    stock: 8,
    categoryId: "cat-coffee",
    lowStockThreshold: 15,
  },
  {
    id: "p3",
    name: "Iced Matcha",
    price: 28000,
    stock: 45,
    categoryId: "cat-noncoffee",
    lowStockThreshold: 12,
  },
  {
    id: "p4",
    name: "Butter Croissant",
    price: 18000,
    stock: 6,
    categoryId: "cat-snacks",
    lowStockThreshold: 10,
  },
  {
    id: "p5",
    name: "Chicken Katsu",
    price: 45000,
    stock: 14,
    categoryId: "cat-meals",
    lowStockThreshold: 8,
  },
  {
    id: "p6",
    name: "Nasi Goreng",
    price: 42000,
    stock: 22,
    categoryId: "cat-meals",
    badge: "Best Seller",
    lowStockThreshold: 10,
  },
];

export const posOrdersSeed: PosOrder[] = [
  {
    id: "ORD-1042",
    status: "pending",
    tableNumber: "A3",
    customerName: "Budi",
    createdAt: "2026-03-25T09:15:00",
    total: 70000,
    items: [
      {
        productId: "p1",
        name: "Espresso",
        qty: 2,
        unitPrice: 18000,
      },
      { productId: "p4", name: "Butter Croissant", qty: 2, unitPrice: 18000 },
    ],
  },
  {
    id: "ORD-1041",
    status: "preparing",
    tableNumber: "B1",
    customerName: "Sari",
    createdAt: "2026-03-25T09:02:00",
    total: 98000,
    items: [
      { productId: "p2", name: "Cappuccino", qty: 2, unitPrice: 26000 },
      { productId: "p5", name: "Chicken Katsu", qty: 1, unitPrice: 45000 },
    ],
  },
  {
    id: "ORD-1040",
    status: "served",
    tableNumber: "C2",
    customerName: "Walk-in",
    createdAt: "2026-03-24T18:40:00",
    total: 28000,
    items: [{ productId: "p3", name: "Iced Matcha", qty: 1, unitPrice: 28000 }],
  },
  {
    id: "ORD-1038",
    status: "completed",
    tableNumber: "A1",
    customerName: "Rina",
    createdAt: "2026-03-24T17:10:00",
    total: 132000,
    items: [
      { productId: "p6", name: "Nasi Goreng", qty: 2, unitPrice: 42000 },
      { productId: "p1", name: "Espresso", qty: 2, unitPrice: 18000 },
    ],
  },
  {
    id: "ORD-1035",
    status: "cancelled",
    tableNumber: "D4",
    customerName: "-",
    createdAt: "2026-03-24T12:00:00",
    total: 0,
    items: [],
  },
];

export const posTransactionsSeed: PosTransaction[] = [
  {
    id: "TX-9001",
    orderId: "ORD-1038",
    method: "cash",
    amount: 132000,
    change: 18000,
    status: "paid",
    customerName: "Rina",
    createdAt: "2026-03-24T17:12:00",
  },
  {
    id: "TX-9002",
    orderId: "ORD-1037",
    method: "qris",
    amount: 56000,
    change: 0,
    status: "paid",
    customerName: "Andi",
    createdAt: "2026-03-24T16:30:00",
  },
  {
    id: "TX-9003",
    method: "bon",
    amount: 89000,
    change: 0,
    status: "unpaid",
    customerName: "PT Maju",
    createdAt: "2026-03-23T14:00:00",
  },
  {
    id: "TX-9004",
    method: "cash",
    amount: 34000,
    change: 6000,
    status: "paid",
    createdAt: "2026-03-22T10:05:00",
  },
];

export const posOutstandingSeed: PosOutstanding[] = [
  {
    id: "OUT-1",
    customerName: "PT Maju",
    amount: 89000,
    dueDate: "2026-04-01",
    transactionId: "TX-9003",
  },
  {
    id: "OUT-2",
    customerName: "Bu Dewi",
    amount: 125000,
    dueDate: "2026-03-28",
    transactionId: "TX-8891",
  },
];

export function categoryItemCount(
  categoryId: string,
  products: PosProduct[],
): number {
  return products.filter((p) => p.categoryId === categoryId).length;
}

export function productCategoryName(
  categoryId: string,
  categories: PosCategory[],
): string {
  return categories.find((c) => c.id === categoryId)?.name ?? categoryId;
}
