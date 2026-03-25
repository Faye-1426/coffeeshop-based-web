import type { MenuProduct, Badge } from "../types";
import { formatIDR } from "../lib/currency";
import { useCartStore } from "../lib/cart";

function badgeStyle(badge: Badge): string {
  switch (badge) {
    case "Popular":
      return "bg-red-600 text-white";
    case "Best Seller":
      return "bg-amber-500 text-black";
    case "New":
      return "bg-emerald-500 text-black";
    case "Hot":
      return "bg-rose-500 text-white";
    case "Limited":
      return "bg-violet-500 text-white";
    default:
      return "bg-red-600 text-white";
  }
}

type ProductCardProps = {
  product: MenuProduct;
  onOpenDetail?: (product: MenuProduct) => void;
};

export default function ProductCard({
  product,
  onOpenDetail,
}: ProductCardProps) {
  const open = () => onOpenDetail?.(product);
  const { add, open: openCart } = useCartStore();

  return (
    <article
      className={[
        "flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white/80",
        "p-4 items-center",
        "shadow-sm",
        "transition-all duration-200",
        "md:hover:-translate-y-0.5 md:hover:shadow-md md:hover:shadow-red-500/10",
        "cursor-pointer",
      ].join(" ")}
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") open();
      }}
      aria-label={`View details for ${product.name}`}
    >
      <div className="relative shrink-0">
        <img
          src={product.imageSrc}
          alt={product.name}
          className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-xl"
        />

        {product.badge ? (
          <span
            className={[
              "absolute -top-2 -right-2 text-[11px] font-extrabold rounded-full px-2 py-1 shadow",
              badgeStyle(product.badge),
            ].join(" ")}
          >
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 text-center">
        <div className="flex justify-between gap-3">
          <h3 className="font-bold text-neutral-900 text-sm sm:text-base text-center w-full">
            {product.name}
          </h3>
        </div>

        <div className="mt-1 text-red-700 font-extrabold text-sm sm:text-base">
          {formatIDR(product.price)}
        </div>

        {product.description ? (
          <p className="mt-1 text-neutral-600 text-xs sm:text-sm">
            {product.description}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          add({ product, quantity: 1 });
          openCart();
        }}
        className="shrink-0 rounded-full bg-red-600 text-white px-4 py-2 text-xs sm:text-sm font-extrabold shadow-sm hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-600/25 w-full"
        aria-label={`Add ${product.name} to cart`}
      >
        Add
      </button>
    </article>
  );
}
