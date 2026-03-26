import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import { formatIDR } from "../../../lib/formatCurrency";
import type { PosCategory, PosProduct } from "../../../types/pos";
import { productCategoryName } from "../data";

export default function ProductCard({
  product,
  categories,
  onEdit,
  onDelete,
}: {
  product: PosProduct;
  categories: PosCategory[];
  onEdit: (p: PosProduct) => void;
  onDelete: (id: string) => void;
}) {
  const p = product;
  const threshold = p.lowStockThreshold ?? 10;
  const low = p.stock <= threshold;

  return (
    <Card className="p-5 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-extrabold text-neutral-900">{p.name}</h3>
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
          onClick={() => onEdit(p)}
        >
          Edit
        </Button>
        <Button
          variant="danger"
          className="flex-1 text-xs!"
          onClick={() => onDelete(p.id)}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}
