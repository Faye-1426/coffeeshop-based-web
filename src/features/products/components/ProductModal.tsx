import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ModalFrame from "../../../components/ui/ModalFrame";
import type { PosCategory } from "../../../types/pos";
import type { ProductFormState } from "../store/productsStore";

export default function ProductModal({
  open,
  isEdit,
  form,
  categories,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean;
  isEdit: boolean;
  form: ProductFormState;
  categories: PosCategory[];
  onChange: (updater: (f: ProductFormState) => ProductFormState) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <ModalFrame open={open} onClose={onClose}>
      <Card className="p-6 shadow-xl max-h-[90dvh] overflow-y-auto">
        <h2 className="text-lg font-extrabold">
          {isEdit ? "Edit product" : "New product"}
        </h2>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-bold text-neutral-600">Name</span>
            <input
              value={form.name}
              onChange={(e) =>
                onChange((f) => ({ ...f, name: e.target.value }))
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
                onChange((f) => ({ ...f, price: e.target.value }))
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
                onChange((f) => ({ ...f, stock: e.target.value }))
              }
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-neutral-600">Category</span>
            <select
              value={form.categoryId}
              onChange={(e) =>
                onChange((f) => ({ ...f, categoryId: e.target.value }))
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
                onChange((f) => ({ ...f, badge: e.target.value }))
              }
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
              placeholder="Popular"
            />
          </label>
        </div>
        <div className="mt-6 flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </div>
      </Card>
    </ModalFrame>
  );
}
