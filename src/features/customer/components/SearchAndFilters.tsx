import { ListFilter, Search } from "lucide-react";
import type { Badge } from "../types";

export type ProductSort = "name_asc" | "name_desc" | "price_asc" | "price_desc";
export type PriceRangeFilter = "all" | "lt25" | "25to40" | "gt40";
export type BadgeFilter = "all" | Badge;

const BADGE_OPTIONS: BadgeFilter[] = [
  "all",
  "Popular",
  "Best Seller",
  "New",
  "Hot",
  "Limited",
];

type SearchAndFiltersProps = {
  searchValue: string;
  onSearchChange: (next: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  sortBy: ProductSort;
  onSortBy: (v: ProductSort) => void;
  badgeFilter: BadgeFilter;
  onBadgeFilter: (v: BadgeFilter) => void;
  priceRange: PriceRangeFilter;
  onPriceRange: (v: PriceRangeFilter) => void;
};

export default function SearchAndFilters({
  searchValue,
  onSearchChange,
  filtersOpen,
  onToggleFilters,
  sortBy,
  onSortBy,
  badgeFilter,
  onBadgeFilter,
  priceRange,
  onPriceRange,
}: SearchAndFiltersProps) {
  return (
    <div className="mt-4">
      <div className="flex gap-2 items-stretch">
        <div className="relative flex-1 min-w-0">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
            size={18}
          />
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search menu…"
            className="w-full rounded-full bg-white/90 border border-neutral-200/80 pl-11 pr-4 py-3 text-sm sm:text-base text-neutral-900 placeholder:text-neutral-500 shadow-sm outline-none focus:ring-2 focus:ring-red-600/25 focus:border-red-600/30 transition"
            aria-label="Search menu"
          />
        </div>
        <button
          type="button"
          onClick={onToggleFilters}
          aria-expanded={filtersOpen}
          aria-label={filtersOpen ? "Hide filters" : "Show filters"}
          className={[
            "shrink-0 rounded-full border px-4 flex items-center justify-center transition shadow-sm",
            filtersOpen
              ? "bg-red-600 text-white border-red-600"
              : "bg-white/90 border-neutral-200/80 text-neutral-800 hover:bg-white",
          ].join(" ")}
        >
          <ListFilter size={20} />
        </button>
      </div>

      <div
        className={[
          "grid transition-[grid-template-rows] duration-200 ease-out",
          filtersOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        ].join(" ")}
      >
        <div className="overflow-hidden min-h-0">
          <div
            className={[
              "mt-3 rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-sm transition-opacity duration-200",
              filtersOpen ? "opacity-100" : "opacity-0 pointer-events-none",
            ].join(" ")}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="block">
                <span className="text-xs font-extrabold text-neutral-700">
                  Sort
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => onSortBy(e.target.value as ProductSort)}
                  className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
                >
                  <option value="name_asc">Name A–Z</option>
                  <option value="name_desc">Name Z–A</option>
                  <option value="price_asc">Price: low → high</option>
                  <option value="price_desc">Price: high → low</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-extrabold text-neutral-700">
                  Badge
                </span>
                <select
                  value={badgeFilter}
                  onChange={(e) =>
                    onBadgeFilter(e.target.value as BadgeFilter)
                  }
                  className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
                >
                  {BADGE_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b === "all" ? "All" : b}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-extrabold text-neutral-700">
                  Price (base)
                </span>
                <select
                  value={priceRange}
                  onChange={(e) =>
                    onPriceRange(e.target.value as PriceRangeFilter)
                  }
                  className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
                >
                  <option value="all">All prices</option>
                  <option value="lt25">Under Rp 25.000</option>
                  <option value="25to40">Rp 25.000 – 40.000</option>
                  <option value="gt40">Above Rp 40.000</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
