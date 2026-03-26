import Card from "../../../components/ui/Card";
import type { PosCategory, PosProduct } from "../../../types/pos";
import ProductCard from "./ProductCard";

export default function ProductGrid({
  products,
  categories,
  onEdit,
  onDelete,
}: {
  products: PosProduct[];
  categories: PosCategory[];
  onEdit: (p: PosProduct) => void;
  onDelete: (id: string) => void;
}) {
  if (products.length === 0) {
    return (
      <Card className="p-8 text-center text-neutral-600 col-span-full">
        Belum ada produk.
      </Card>
    );
  }

  return (
    <>
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          categories={categories}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}
