import type { MenuCategory, CategoryId } from "../types";

type CategoryTabsProps = {
  categories: MenuCategory[];
  activeCategoryId: CategoryId;
  onSelect: (id: CategoryId) => void;
  categoryCounts: Record<CategoryId, number>;
};

function tabClasses(isActive: boolean) {
  return isActive
    ? "bg-red-600 text-white border-red-600 shadow-sm"
    : "bg-white/80 text-neutral-700 border-neutral-200 hover:bg-white";
}

export default function CategoryTabs({
  categories,
  activeCategoryId,
  onSelect,
  categoryCounts,
}: CategoryTabsProps) {
  return (
    <nav aria-label="Menu categories" className="mt-5">
      <div className="no-scrollbar overflow-x-auto">
        <div className="flex gap-3 whitespace-nowrap pb-1">
          {categories.map((cat) => {
            const isActive = cat.id === activeCategoryId;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect(cat.id)}
                className={[
                  "transition-all duration-200 rounded-full px-5 py-2.5 text-sm font-semibold border shadow-sm",
                  "focus:outline-none focus:ring-2 focus:ring-red-600/25",
                  tabClasses(isActive),
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                <span>{cat.name}</span>
                <span className="ml-2 opacity-80 text-xs font-bold">
                  ({categoryCounts[cat.id] ?? 0})
                </span>
                {isActive ? (
                  <span className="sr-only">Selected</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

