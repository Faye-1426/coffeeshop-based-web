import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import ListLoadingStatus from "../../components/ui/ListLoadingStatus";
import { useProductsStore } from "./store/productsStore";
import { useSortedProducts } from "./hooks/useSortedProducts";
import {
  usePosCategoriesQuery,
  usePosProductsQuery,
} from "../../hooks/usePosRemoteData";
import ProductGrid from "./components/ProductGrid";
import ProductModal from "./components/ProductModal";
import type { PosProduct } from "../../types/pos";
import { isSupabaseConfigured } from "../../lib/supabaseClient";

export default function Product() {
  const categoriesQuery = usePosCategoriesQuery();
  const productsQuery = usePosProductsQuery();

  const storeCategories = useProductsStore((s) => s.categories);
  const storeProducts = useProductsStore((s) => s.products);
  const modalOpen = useProductsStore((s) => s.modalOpen);
  const editing = useProductsStore((s) => s.editing);
  const form = useProductsStore((s) => s.form);
  const openCreate = useProductsStore((s) => s.openCreate);
  const openEdit = useProductsStore((s) => s.openEdit);
  const setForm = useProductsStore((s) => s.setForm);
  const closeModal = useProductsStore((s) => s.closeModal);
  const save = useProductsStore((s) => s.save);
  const remove = useProductsStore((s) => s.remove);

  const supa = isSupabaseConfigured();
  const categories = supa
    ? (categoriesQuery.data ?? [])
    : storeCategories;
  const products = supa ? (productsQuery.data ?? []) : storeProducts;

  const sorted = useSortedProducts(products);
  const listLoading = supa && (categoriesQuery.isPending || productsQuery.isPending);

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={
          isSupabaseConfigured()
            ? "Stok mengikuti database; penjualan mengurangi stok via trigger."
            : "Stok dan harga (dummy)."
        }
        action={
          <Button
            onClick={() => openCreate(categories)}
            disabled={supa && categories.length === 0 && listLoading}
          >
            Add product
          </Button>
        }
      />

      {listLoading ? (
        <ListLoadingStatus label="Memuat produk…" />
      ) : (
        <>
          {supa && (categoriesQuery.isError || productsQuery.isError) ? (
            <p className="text-sm text-red-700 py-2">
              Gagal memuat data. Coba muat ulang halaman.
            </p>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <ProductGrid
              products={sorted}
              categories={categories}
              onEdit={(p: PosProduct) => openEdit(p)}
              onDelete={remove}
            />
          </div>
        </>
      )}

      <ProductModal
        open={modalOpen}
        isEdit={Boolean(editing)}
        form={form}
        categories={categories}
        onChange={setForm}
        onClose={closeModal}
        onSave={save}
      />
    </div>
  );
}
