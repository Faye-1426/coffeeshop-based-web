import { useMemo, useState } from "react";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ModalFrame from "../../../components/ui/ModalFrame";
import {
  categoryItemCount,
  posCategoriesSeed,
  posProductsSeed,
} from "../../../data/posDummyData";
import type { PosCategory } from "../../../types/pos";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<PosCategory[]>(() => [
    ...posCategoriesSeed,
  ]);
  const [products] = useState(() => [...posProductsSeed]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PosCategory | null>(null);
  const [name, setName] = useState("");

  const rows = useMemo(() => {
    return categories.map((c) => ({
      ...c,
      count: categoryItemCount(c.id, products),
    }));
  }, [categories, products]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setModalOpen(true);
  };

  const openEdit = (c: PosCategory) => {
    setEditing(c);
    setName(c.name);
    setModalOpen(true);
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (editing) {
      setCategories((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...c, name: trimmed } : c)),
      );
    } else {
      const id = `cat-${Date.now()}`;
      setCategories((prev) => [...prev, { id, name: trimmed }]);
    }
    setModalOpen(false);
  };

  const remove = (id: string) => {
    if (
      !window.confirm(
        "Hapus kategori? (UI only — produk tidak ikut di-update otomatis)",
      )
    )
      return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Kelola kategori menu (simulasi lokal)."
        action={<Button onClick={openCreate}>Add category</Button>}
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-5 py-3 font-extrabold text-neutral-900">
                  Name
                </th>
                <th className="px-5 py-3 font-extrabold text-neutral-900">
                  Items
                </th>
                <th className="px-5 py-3 font-extrabold text-neutral-900 w-48">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-10 text-center text-neutral-500"
                  >
                    Tidak ada kategori.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80"
                  >
                    <td className="px-5 py-3 font-semibold text-neutral-900">
                      {row.name}
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{row.count}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          className="py-1.5! px-3! text-xs!"
                          onClick={() => openEdit(row)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          className="py-1.5! px-3! text-xs!"
                          onClick={() => remove(row.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ModalFrame open={modalOpen} onClose={() => setModalOpen(false)}>
        <Card className="p-6 shadow-xl">
          <h2 className="text-lg font-extrabold">
            {editing ? "Edit category" : "New category"}
          </h2>
          <label className="block mt-4">
            <span className="text-xs font-bold text-neutral-600">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
              placeholder="Coffee"
              autoFocus={modalOpen}
            />
          </label>
          <div className="mt-6 flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </div>
        </Card>
      </ModalFrame>
    </div>
  );
}
