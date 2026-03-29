import { isSupabaseConfigured } from "../lib/supabaseClient";
import { queryClient } from "../lib/queryClient";
import { posQueryKeys } from "../lib/keys/posQueryKeys";
import { useCategoriesStore } from "../features/categories/store/categoriesStore";
import { useProductsStore } from "../features/products/store/productsStore";
import { useOrdersStore } from "../features/orders/store/ordersStore";
import { useTransactionsStore } from "../features/transactions/store/transactionsStore";
import { useOutstandingStore } from "../features/outstanding/store/outstandingStore";

const emptyProductForm = {
  name: "",
  price: "",
  stock: "",
  categoryId: "",
  badge: "",
};

/** Kosongkan cache POS di memori setelah sign out (mode Supabase). */
export function resetPosStoresAfterSignOut() {
  if (!isSupabaseConfigured()) return;

  void queryClient.removeQueries({ queryKey: posQueryKeys.root });

  useCategoriesStore.setState({
    categories: [],
    productsSnapshot: [],
    modalOpen: false,
    editing: null,
    name: "",
  });

  useProductsStore.setState({
    categories: [],
    products: [],
    modalOpen: false,
    editing: null,
    form: { ...emptyProductForm },
  });

  useOrdersStore.setState({
    orders: [],
    products: [],
    filter: "all",
    drawerOpen: false,
  });

  useTransactionsStore.setState({
    transactions: [],
  });

  useOutstandingStore.setState({
    rows: [],
  });
}
