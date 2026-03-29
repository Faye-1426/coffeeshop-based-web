import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { MenuProduct, MenuCategory } from "./types";
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
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { useCustomerMenuQuery } from "../../hooks/useCustomerRemoteData";
import { storeKeyToTenantSlug } from "./lib/storePath";
import {
  buildCategoryCounts,
  buildCategoryProductCache,
  mapCustomerMenuToUi,
} from "./lib/catalogFromRemote";
import { useCartStore } from "./lib/cart";

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
  const { storeKey } = useParams<{ storeKey: string }>();
  const tenantSlugDb = storeKey ? storeKeyToTenantSlug(storeKey) : null;
  const useRemote = isSupabaseConfigured() && Boolean(tenantSlugDb);
  const menuQuery = useCustomerMenuQuery(tenantSlugDb);
  const setScopeStoreKey = useCartStore((s) => s.setScopeStoreKey);

  useEffect(() => {
    if (storeKey) setScopeStoreKey(storeKey);
  }, [storeKey, setScopeStoreKey]);

  const { categories, menuProductsList, badgeOptions, fromRemote } =
    useMemo(() => {
      if (useRemote && menuQuery.data) {
        const mapped = mapCustomerMenuToUi(menuQuery.data);
        const badges = Array.from(
          new Set(
            mapped.products
              .map((p) => p.badge)
              .filter((b): b is string => Boolean(b)),
          ),
        ).sort();
        return {
          categories: mapped.categories,
          menuProductsList: mapped.products,
          badgeOptions: badges,
          fromRemote: true,
        };
      }
      return {
        categories: menuCategories,
        menuProductsList: menuProducts,
        badgeOptions: undefined as string[] | undefined,
        fromRemote: false,
      };
    }, [useRemote, menuQuery.data]);

  const categoryProductCache = useMemo(
    () => buildCategoryProductCache(menuProductsList),
    [menuProductsList],
  );

  const categoryCounts = useMemo(
    () => buildCategoryCounts(menuProductsList),
    [menuProductsList],
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const activeCategoryId = useMemo(() => {
    if (!categories.length) return "";
    if (
      selectedCategoryId &&
      categories.some((c) => c.id === selectedCategoryId)
    ) {
      return selectedCategoryId;
    }
    return categories[0]!.id;
  }, [categories, selectedCategoryId]);

  const [searchQuery, setSearchQuery] = useState("");
  const [demoDelayDone, setDemoDelayDone] = useState(false);
  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<ProductSort>("name_asc");
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>("all");
  const [priceRange, setPriceRange] = useState<PriceRangeFilter>("all");

  useEffect(() => {
    if (useRemote) return;
    const t = window.setTimeout(() => setDemoDelayDone(true), 350);
    return () => window.clearTimeout(t);
  }, [useRemote]);

  const gridLoading = useRemote
    ? menuQuery.isLoading
    : !demoDelayDone;

  const detailProduct = useMemo(() => {
    if (!detailProductId) return null;
    return menuProductsList.find((p) => p.id === detailProductId) ?? null;
  }, [detailProductId, menuProductsList]);

  const afterSearch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const inCategory = categoryProductCache[activeCategoryId] ?? [];
    return inCategory.filter((p) => matchesSearch(p, q));
  }, [categoryProductCache, searchQuery, activeCategoryId]);

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
    (c) => c.id === activeCategoryId,
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

  if (!storeKey || !tenantSlugDb) {
    return (
      <main className="max-w-7xl mx-auto py-10">
        <p className="text-center text-neutral-600 text-sm">
          Invalid store URL. Expected{" "}
          <code className="font-mono text-xs">/your-tenant-slug-store</code>.
        </p>
      </main>
    );
  }

  if (useRemote && menuQuery.isError) {
    return (
      <main className="max-w-7xl mx-auto py-10">
        <p className="text-center text-red-600 text-sm font-semibold">
          Could not load menu.{" "}
          {menuQuery.error instanceof Error
            ? menuQuery.error.message
            : "Check tenant slug and Supabase RPC."}
        </p>
      </main>
    );
  }

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
        badgeOptions={fromRemote ? badgeOptions : undefined}
      />

      <CategoryTabs
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelect={setSelectedCategoryId}
        categoryCounts={categoryCounts}
      />

      <ProductGrid
        products={visibleProducts}
        isLoading={gridLoading}
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
