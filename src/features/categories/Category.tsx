import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import { useCategoriesStore } from "./store/categoriesStore";
import { useCategoryRows } from "./hooks/useCategoryRows";
import CategoryTable from "./components/CategoryTable";
import CategoryModal from "./components/CategoryModal";
import type { PosCategory } from "../../types/pos";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import {
  usePosCategoriesQuery,
  usePosProductsQuery,
} from "../../hooks/usePosRemoteData";

export default function Category() {
  const categoriesQuery = usePosCategoriesQuery();
  const productsQuery = usePosProductsQuery();

  const storeCategories = useCategoriesStore((s) => s.categories);
  const storeProductsSnapshot = useCategoriesStore((s) => s.productsSnapshot);
  const modalOpen = useCategoriesStore((s) => s.modalOpen);
  const editing = useCategoriesStore((s) => s.editing);
  const name = useCategoriesStore((s) => s.name);
  const openCreate = useCategoriesStore((s) => s.openCreate);
  const openEdit = useCategoriesStore((s) => s.openEdit);
  const setName = useCategoriesStore((s) => s.setName);
  const closeModal = useCategoriesStore((s) => s.closeModal);
  const save = useCategoriesStore((s) => s.save);
  const remove = useCategoriesStore((s) => s.remove);

  const supa = isSupabaseConfigured();
  const categories = supa
    ? (categoriesQuery.data ?? [])
    : storeCategories;
  const productsSnapshot = supa
    ? (productsQuery.data ?? [])
    : storeProductsSnapshot;

  const rows = useCategoryRows(categories, productsSnapshot);
  const listLoading =
    supa && (categoriesQuery.isPending || productsQuery.isPending);

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle={
          isSupabaseConfigured()
            ? "Sinkron dengan Supabase (RLS per tenant)."
            : "Kelola kategori menu (simulasi lokal)."
        }
        action={<Button onClick={openCreate}>Add category</Button>}
      />

      {supa && (categoriesQuery.isError || productsQuery.isError) ? (
        <p className="text-sm text-red-700 py-2">
          Gagal memuat data. Coba muat ulang halaman.
        </p>
      ) : null}

      <CategoryTable
        rows={rows}
        loading={listLoading}
        onEdit={(c: PosCategory) => openEdit(c)}
        onDelete={remove}
      />

      <CategoryModal
        open={modalOpen}
        isEdit={Boolean(editing)}
        name={name}
        onNameChange={setName}
        onClose={closeModal}
        onSave={save}
      />
    </div>
  );
}
