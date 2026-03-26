import type { OrderStatus } from "../../../types/pos";

const FILTERS: readonly (OrderStatus | "all")[] = [
  "all",
  "pending",
  "preparing",
  "served",
  "completed",
  "cancelled",
] as const;

export default function OrderStatusFilters({
  value,
  onChange,
}: {
  value: OrderStatus | "all";
  onChange: (v: OrderStatus | "all") => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {FILTERS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={[
            "rounded-full px-4 py-2 text-xs font-bold border transition",
            value === s
              ? "bg-red-600 text-white border-red-600"
              : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50",
          ].join(" ")}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
