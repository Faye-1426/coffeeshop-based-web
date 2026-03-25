import { useMemo, useState } from "react";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import ModalFrame from "../../../components/ui/ModalFrame";
import { formatIDR } from "../../../lib/formatCurrency";
import {
  posCategoriesSeed,
  posProductsSeed,
  productCategoryName,
} from "../../../data/posDummyData";
import type { PosProduct } from "../../../types/pos";

export default function ProductsPage() {
  const [categories] = useState(() => [...posCategoriesSeed]);
  const [products, setProducts] = useState<PosProduct[]>(() => [
    ...posProductsSeed,
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PosProduct | null>(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    categoryId: posCategoriesSeed[0]?.id ?? "",
    badge: "",
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      price: "",
      stock: "",
      categoryId: categories[0]?.id ?? "",
      badge: "",
    });
    setModalOpen(true);
  };

  const openEdit = (p: PosProduct) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: String(p.price),
      stock: String(p.stock),
      categoryId: p.categoryId,
      badge: p.badge ?? "",
    });
    setModalOpen(true);
  };

  const save = () => {
    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!name || Number.isNaN(price) || Number.isNaN(stock)) return;
    const badge = form.badge.trim() || undefined;
    if (editing) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editing.id
            ? {
                ...p,
                name,
                price,
                stock,
                categoryId: form.categoryId,
                badge,
                lowStockThreshold: p.lowStockThreshold ?? 10,
              }
            : p,
        ),
      );
    } else {
      setProducts((prev) => [
        ...prev,
        {
          id: `p-${Date.now()}`,
          name,
          price,
          stock,
          categoryId: form.categoryId,
          badge,
          lowStockThreshold: 10,
        },
      ]);
    }
    setModalOpen(false);
  };

  const remove = (id: string) => {
    if (!window.confirm("Hapus produk?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const sorted = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  );

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Stok dan harga (dummy)."
        action={<Button onClick={openCreate}>Add product</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.length === 0 ? (
          <Card className="p-8 text-center text-neutral-600 col-span-full">
            Belum ada produk.
          </Card>
        ) : (
          sorted.map((p) => {
            const threshold = p.lowStockThreshold ?? 10;
            const low = p.stock <= threshold;
            return (
              <Card key={p.id} className="p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-neutral-900">
                      {p.name}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      {productCategoryName(p.categoryId, categories)}
                    </p>
                  </div>
                  {p.badge ? (
                    <Badge tone="info" className="shrink-0">
                      {p.badge}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-3 text-lg font-extrabold text-red-700">
                  {formatIDR(p.price)}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Stock:</span>
                  <span
                    className={`font-bold ${low ? "text-red-700" : "text-neutral-900"}`}
                  >
                    {p.stock}
                  </span>
                  {low ? (
                    <Badge tone="danger" className="ml-auto">
                      Low stock
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1 text-xs!"
                    onClick={() => openEdit(p)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1 text-xs!"
                    onClick={() => remove(p.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <ModalFrame open={modalOpen} onClose={() => setModalOpen(false)}>
        <Card className="p-6 shadow-xl max-h-[90dvh] overflow-y-auto">
          <h2 className="text-lg font-extrabold">
            {editing ? "Edit product" : "New product"}
          </h2>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-bold text-neutral-600">Name</span>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-600">Price</span>
              <input
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-600">Stock</span>
              <input
                type="number"
                value={form.stock}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stock: e.target.value }))
                }
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-600">
                Category
              </span>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value }))
                }
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-600">
                Badge (optional)
              </span>
              <input
                value={form.badge}
                onChange={(e) =>
                  setForm((f) => ({ ...f, badge: e.target.value }))
                }
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
                placeholder="Popular"
              />
            </label>
          </div>
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
