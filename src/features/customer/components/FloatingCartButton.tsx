import { ShoppingBag } from "lucide-react";
import { useMemo } from "react";
import { useCartStore, getCartCount } from "../lib/cart";

export default function FloatingCartButton() {
  const { isOpen, items, open } = useCartStore();

  const count = useMemo(() => getCartCount(items), [items]);
  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={open}
      className="fixed bottom-6 right-6 z-50 rounded-full bg-red-600 text-white h-14 w-14 shadow-lg flex items-center justify-center transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/30"
      aria-label="Open cart"
    >
      <div className="relative">
        <ShoppingBag size={22} />
        {count > 0 ? (
          <span className="absolute -top-3 -right-3 min-w-6 h-6 px-1 rounded-full bg-black text-white text-[11px] font-extrabold flex items-center justify-center shadow">
            {count}
          </span>
        ) : null}
      </div>
    </button>
  );
}

