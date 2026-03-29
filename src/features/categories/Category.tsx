import { useEffect } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import { useCategoriesStore } from "./store/categoriesStore";
import { useCategoryRows } from "./hooks/useCategoryRows";
import CategoryTable from "./components/CategoryTable";
import CategoryModal from "./components/CategoryModal";
import type { PosCategory } from "../../types/pos";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { useTenant } from "../../lib/supabase/TenantContext";

export default function Category() {
  const { session } = useTenant();
  const syncFromRemote = useCategoriesStore((s) => s.syncFromRemote);

  useEffect(() => {
    if (!isSupabaseConfigured() || !session) return;
    void syncFromRemote();
  }, [session?.user?.id, syncFromRemote]);

  const categories = useCategoriesStore((s) => s.categories);
  const productsSnapshot = useCategoriesStore((s) => s.productsSnapshot);
  const modalOpen = useCategoriesStore((s) => s.modalOpen);
  const editing = useCategoriesStore((s) => s.editing);
  const name = useCategoriesStore((s) => s.name);
  const openCreate = useCategoriesStore((s) => s.openCreate);
  const openEdit = useCategoriesStore((s) => s.openEdit);
  const setName = useCategoriesStore((s) => s.setName);
  const closeModal = useCategoriesStore((s) => s.closeModal);
  const save = useCategoriesStore((s) => s.save);
  const remove = useCategoriesStore((s) => s.remove);

  const rows = useCategoryRows(categories, productsSnapshot);

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

      <CategoryTable
        rows={rows}
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
