import type { MenuProduct } from "../types";
import ProductCard from "./ProductCard";

type ProductGridProps = {
  products: MenuProduct[];
  isLoading?: boolean;
  onOpenDetail?: (product: MenuProduct) => void;
  emptyState?: {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
  };
};

function ProductCardSkeleton() {
  return (
    <div className="flex flex-row gap-4 rounded-2xl border border-neutral-200 bg-white/70 p-4 items-center shadow-sm">
      <div className="relative shrink-0">
        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl bg-neutral-200/70 animate-pulse" />
        <div className="absolute -top-2 -right-2 h-6 w-16 rounded-full bg-neutral-200/70 animate-pulse" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="h-5 w-3/4 rounded bg-neutral-200/70 animate-pulse" />
        <div className="mt-2 h-5 w-1/2 rounded bg-neutral-200/70 animate-pulse" />
        <div className="mt-3 h-4 w-full rounded bg-neutral-200/70 animate-pulse" />
        <div className="mt-2 h-4 w-5/6 rounded bg-neutral-200/70 animate-pulse" />
      </div>
    </div>
  );
}

export default function ProductGrid({
  products,
  isLoading,
  onOpenDetail,
  emptyState,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <section aria-busy="true" className="mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    if (!emptyState) return null;
    return (
      <section className="mt-6">
        <div className="rounded-3xl border border-neutral-200 bg-white/70 p-6 sm:p-8">
          <h2 className="text-lg font-extrabold text-neutral-900">
            {emptyState.title}
          </h2>
          {emptyState.subtitle ? (
            <p className="mt-2 text-sm text-neutral-600">
              {emptyState.subtitle}
            </p>
          ) : null}
          {emptyState.actionLabel && emptyState.onAction ? (
            <button
              type="button"
              onClick={emptyState.onAction}
              className="mt-5 inline-flex items-center justify-center rounded-full bg-red-600 text-white px-5 py-2.5 text-sm font-bold shadow-sm hover:bg-red-700 transition"
            >
              {emptyState.actionLabel}
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onOpenDetail={onOpenDetail} />
        ))}
      </div>
    </section>
  );
}

