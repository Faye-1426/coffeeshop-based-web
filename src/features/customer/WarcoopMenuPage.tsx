import { useEffect, useMemo, useState } from "react";
import type { CategoryId, MenuProduct, MenuCategory } from "./types";
import HeroPromoCard from "./components/HeroPromoCard";
import SearchAndFilters, {
  type ProductSort,
  type PriceRangeFilter,
  type BadgeFilter,
} from "./components/SearchAndFilters";
import CategoryTabs from "./components/CategoryTabs";
import ProductGrid from "./components/ProductGrid";
import ProductDetailModal from "./components/ProductDetailModal";
import { menuCategories, menuProducts } from "./data/menuData";

function getCategoryCounts(): Record<CategoryId, number> {
  const counts: Record<CategoryId, number> = {
    coffee: 0,
    nonCoffee: 0,
    snacks: 0,
    meals: 0,
  };

  for (const p of menuProducts) {
    counts[p.categoryId] += 1;
  }
  return counts;
}

function buildCategoryCache(
  products: MenuProduct[],
): Record<CategoryId, MenuProduct[]> {
  const by: Record<CategoryId, MenuProduct[]> = {
    coffee: [],
    nonCoffee: [],
    snacks: [],
    meals: [],
  };
  for (const p of products) {
    by[p.categoryId].push(p);
  }
  return by;
}

function matchesSearch(p: MenuProduct, query: string): boolean {
  if (!query) return true;
  const haystack = `${p.name} ${p.description ?? ""}`.toLowerCase();
  return haystack.includes(query);
}

function matchesBadge(p: MenuProduct, badgeFilter: BadgeFilter): boolean {
  if (badgeFilter === "all") return true;
  return p.badge === badgeFilter;
}

function matchesPriceRange(
  p: MenuProduct,
  priceRange: PriceRangeFilter,
): boolean {
  const { price } = p;
  switch (priceRange) {
    case "all":
      return true;
    case "lt25":
      return price < 25000;
    case "25to40":
      return price >= 25000 && price <= 40000;
    case "gt40":
      return price > 40000;
    default:
      return true;
  }
}

function sortProducts(list: MenuProduct[], sortBy: ProductSort): MenuProduct[] {
  const next = [...list];
  next.sort((a, b) => {
    switch (sortBy) {
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "name_desc":
        return b.name.localeCompare(a.name);
      case "price_asc":
        return a.price - b.price;
      case "price_desc":
        return b.price - a.price;
      default:
        return 0;
    }
  });
  return next;
}

export default function WarcoopMenuPage() {
  const categories = menuCategories;

  const [selectedCategoryId, setSelectedCategoryId] =
    useState<CategoryId>("coffee");
  const [searchQuery, setSearchQuery] = useState("");

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [detailProductId, setDetailProductId] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<ProductSort>("name_asc");
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>("all");
  const [priceRange, setPriceRange] = useState<PriceRangeFilter>("all");

  const detailProduct = useMemo(() => {
    if (!detailProductId) return null;
    return menuProducts.find((p) => p.id === detailProductId) ?? null;
  }, [detailProductId]);

  const categoryCounts = useMemo(() => getCategoryCounts(), []);
  const categoryProductCache = useMemo(
    () => buildCategoryCache(menuProducts),
    [],
  );

  useEffect(() => {
    const t = window.setTimeout(() => setIsInitialLoading(false), 350);
    return () => window.clearTimeout(t);
  }, []);

  const afterSearch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const inCategory = categoryProductCache[selectedCategoryId];
    return inCategory.filter((p) => matchesSearch(p, q));
  }, [categoryProductCache, searchQuery, selectedCategoryId]);

  const afterFilters = useMemo(() => {
    return afterSearch.filter(
      (p) => matchesBadge(p, badgeFilter) && matchesPriceRange(p, priceRange),
    );
  }, [afterSearch, badgeFilter, priceRange]);

  const visibleProducts = useMemo(
    () => sortProducts(afterFilters, sortBy),
    [afterFilters, sortBy],
  );

  const selectedCategory: MenuCategory | undefined = categories.find(
    (c) => c.id === selectedCategoryId,
  );

  const resetFilters = () => {
    setSortBy("name_asc");
    setBadgeFilter("all");
    setPriceRange("all");
  };

  const emptyState = useMemo(() => {
    if (visibleProducts.length > 0) return undefined;

    if (afterSearch.length === 0) {
      if (searchQuery.trim()) {
        return {
          title: `No results for "${searchQuery.trim()}"`,
          subtitle: "Try a different keyword or clear the search.",
          actionLabel: "Clear search" as const,
          onAction: () => setSearchQuery(""),
        };
      }
      return {
        title: `No items in ${selectedCategory?.name ?? "this category"}`,
        subtitle: "Come back soon for more menu updates.",
      };
    }

    return {
      title: "No items match your filters",
      subtitle: "Try changing sort, badge, or price range.",
      actionLabel: "Clear filters" as const,
      onAction: resetFilters,
    };
  }, [
    visibleProducts.length,
    afterSearch.length,
    searchQuery,
    selectedCategory?.name,
  ]);

  return (
    <main className="max-w-7xl mx-auto">
      <HeroPromoCard
        promoText="Discount up to 50%"
        subtitle="Freshly brewed deals every day. Limited time!"
      />

      <SearchAndFilters
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((v) => !v)}
        sortBy={sortBy}
        onSortBy={setSortBy}
        badgeFilter={badgeFilter}
        onBadgeFilter={setBadgeFilter}
        priceRange={priceRange}
        onPriceRange={setPriceRange}
      />

      <CategoryTabs
        categories={categories}
        activeCategoryId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
        categoryCounts={categoryCounts}
      />

      <ProductGrid
        products={visibleProducts}
        isLoading={isInitialLoading}
        onOpenDetail={(p) => setDetailProductId(p.id)}
        emptyState={emptyState}
      />

      <ProductDetailModal
        product={detailProduct}
        isOpen={detailProductId !== null}
        onClose={() => setDetailProductId(null)}
      />
    </main>
  );
}
