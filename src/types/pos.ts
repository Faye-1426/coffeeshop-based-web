export type OrderStatus =
  | "awaiting_payment"
  | "pending"
  | "preparing"
  | "served"
  | "completed"
  | "cancelled";

export type PosCategory = {
  id: string;
  name: string;
};

export type PosProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  categoryId: string;
  badge?: string;
  lowStockThreshold?: number;
};

export type PosOrderLine = {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
};

export type PosOrder = {
  id: string;
  status: OrderStatus;
  tableNumber: string;
  customerName: string;
  items: PosOrderLine[];
  createdAt: string;
  total: number;
};

export type PaymentMethod = "cash" | "qris" | "bon";

export type TransactionStatus = "paid" | "unpaid";

export type PosTransaction = {
  id: string;
  orderId?: string;
  method: PaymentMethod;
  amount: number;
  change: number;
  status: TransactionStatus;
  customerName?: string;
  createdAt: string;
};

export type PosOutstanding = {
  id: string;
  customerName: string;
  amount: number;
  dueDate: string;
  transactionId: string;
};
