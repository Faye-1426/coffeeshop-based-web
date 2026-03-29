import { useEffect } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import { useProductsStore } from "./store/productsStore";
import { useSortedProducts } from "./hooks/useSortedProducts";
import ProductGrid from "./components/ProductGrid";
import ProductModal from "./components/ProductModal";
import type { PosProduct } from "../../types/pos";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { useTenant } from "../../lib/supabase/TenantContext";

export default function Product() {
  const { session } = useTenant();
  const syncFromRemote = useProductsStore((s) => s.syncFromRemote);

  useEffect(() => {
    if (!isSupabaseConfigured() || !session) return;
    void syncFromRemote();
  }, [session?.user?.id, syncFromRemote]);

  const categories = useProductsStore((s) => s.categories);
  const products = useProductsStore((s) => s.products);
  const modalOpen = useProductsStore((s) => s.modalOpen);
  const editing = useProductsStore((s) => s.editing);
  const form = useProductsStore((s) => s.form);
  const openCreate = useProductsStore((s) => s.openCreate);
  const openEdit = useProductsStore((s) => s.openEdit);
  const setForm = useProductsStore((s) => s.setForm);
  const closeModal = useProductsStore((s) => s.closeModal);
  const save = useProductsStore((s) => s.save);
  const remove = useProductsStore((s) => s.remove);

  const sorted = useSortedProducts(products);

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={
          isSupabaseConfigured()
            ? "Stok mengikuti database; penjualan mengurangi stok via trigger."
            : "Stok dan harga (dummy)."
        }
        action={<Button onClick={openCreate}>Add product</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <ProductGrid
          products={sorted}
          categories={categories}
          onEdit={(p: PosProduct) => openEdit(p)}
          onDelete={remove}
        />
      </div>

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
