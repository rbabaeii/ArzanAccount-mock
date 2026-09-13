"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import ProductCard from "@/components/store/ProductCard";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import AmbientGlow from "@/components/ui/AmbientGlow";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/format";
import Pagination from "@/components/ui/Pagination";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  Package,
  Grid2X2,
  StretchHorizontal,
  X,
  Sparkles,
  Flame,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get("q") || searchParams?.get("search") || "";
  const initialCat = searchParams?.get("category") || "all";

  const { activeProducts, categories, calculateProductPrice } = useStore();

  const [search, setSearch] = useState(initialSearch);
  const [selectedCat, setSelectedCat] = useState(initialCat);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<
    "popular" | "newest" | "price_asc" | "price_desc" | "rating" | "on_sale"
  >("popular");
  const [maxPriceToman, setMaxPriceToman] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileViewMode, setMobileViewMode] = useState<"grid" | "list">("grid");

  // Determine highest price in catalog to safely set slider maximums
  const highestPriceInCatalog = useMemo(() => {
    if (activeProducts.length === 0) return 5000000;
    const max = activeProducts.reduce((acc, p) => {
      const price = calculateProductPrice(p).toman;
      return price > acc ? price : acc;
    }, 1000000);
    return Math.max(3000000, Math.ceil(max / 500000) * 500000);
  }, [activeProducts, calculateProductPrice]);

  const currentMaxPrice = maxPriceToman ?? highestPriceInCatalog;

  // Resolve category by ID or slug (e.g. ?category=ai or ?category=cat-ai)
  const resolvedCategoryId = useMemo(() => {
    if (selectedCat === "all") return "all";
    const found = categories.find(
      (c) => c.id === selectedCat || c.slug === selectedCat
    );
    return found ? found.id : selectedCat;
  }, [selectedCat, categories]);

  const selectedCategoryObj = categories.find(
    (c) => c.id === resolvedCategoryId || c.id === selectedCat || c.slug === selectedCat
  );

  // Sync initial query params if they change
  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
      setCurrentPage(1);
    }
    if (initialCat) {
      setSelectedCat(initialCat);
      setCurrentPage(1);
    }
  }, [initialSearch, initialCat]);

  // Adjust default page size on mobile
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setPageSize(6);
    }
  }, []);

  // Update document.title on filter change
  useEffect(() => {
    if (selectedCategoryObj) {
      document.title = `خرید اشتراک‌های ${selectedCategoryObj.title} | کاتالوگ ارزان اکانت`;
    } else if (search.trim()) {
      document.title = `نتایج جستجوی «${search.trim()}» | ارزان اکانت`;
    } else {
      document.title = "کاتالوگ و خرید انواع اکانت و اشتراک قانونی | ارزان اکانت";
    }
  }, [selectedCategoryObj, search]);

  // Filtered & Sorted list with in-stock priority
  const filteredProducts = useMemo(() => {
    return activeProducts
      .filter((p) => {
        const matchesSearch =
          !search.trim() ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.customTitle.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase());

        const matchesCat =
          resolvedCategoryId === "all" || p.categoryId === resolvedCategoryId;
        const matchesStock = !inStockOnly || p.inStock;

        const price = calculateProductPrice(p);
        const matchesPrice =
          maxPriceToman === null || price.toman <= maxPriceToman;
        const matchesSale =
          sortBy !== "on_sale" || Boolean(price.isOnSale || p.isFlashDeal);

        return (
          matchesSearch &&
          matchesCat &&
          matchesStock &&
          matchesPrice &&
          matchesSale
        );
      })
      .sort((a, b) => {
        // 1. In-stock priority: available products appear before out-of-stock items
        const stockA =
          a.inStock && (a.stockCount === undefined || a.stockCount > 0) ? 1 : 0;
        const stockB =
          b.inStock && (b.stockCount === undefined || b.stockCount > 0) ? 1 : 0;
        if (stockA !== stockB) {
          return stockB - stockA;
        }

        // 2. Secondary sort criteria
        const priceA = calculateProductPrice(a).toman;
        const priceB = calculateProductPrice(b).toman;

        if (sortBy === "price_asc") return priceA - priceB;
        if (sortBy === "price_desc") return priceB - priceA;
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "newest") return b.externalId - a.externalId;
        if (sortBy === "on_sale")
          return (b.isFlashDeal ? 1 : 0) - (a.isFlashDeal ? 1 : 0);
        return (
          (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) ||
          b.reviewCount - a.reviewCount
        );
      });
  }, [
    activeProducts,
    search,
    resolvedCategoryId,
    inStockOnly,
    maxPriceToman,
    sortBy,
    calculateProductPrice,
  ]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const activeFiltersCount =
    (selectedCat !== "all" ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (search.trim() ? 1 : 0) +
    (maxPriceToman !== null && maxPriceToman < highestPriceInCatalog ? 1 : 0) +
    (sortBy !== "popular" ? 1 : 0);

  const resetFilters = () => {
    setSearch("");
    setSelectedCat("all");
    setInStockOnly(false);
    setMaxPriceToman(null);
    setSortBy("popular");
    setCurrentPage(1);
    setMobileFiltersOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <AmbientGlow
        variant="teal"
        className="-top-20 -right-20 pointer-events-none"
      />
      <AmbientGlow
        variant="amber"
        className="top-1/3 -left-32 pointer-events-none"
      />

      <BreadcrumbJsonLd
        items={[
          { name: "صفحه اصلی", url: "https://arzanaccount.ir" },
          { name: "کاتالوگ محصولات", url: "https://arzanaccount.ir/products" },
          ...(selectedCategoryObj
            ? [
                {
                  name: selectedCategoryObj.title,
                  url: `https://arzanaccount.ir/category/${selectedCategoryObj.slug}`,
                },
              ]
            : []),
        ]}
      />

      <Header />

      {/* Breadcrumbs & Sub-Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-brand-border/80 dark:border-slate-800/80 py-3.5 px-4 sm:px-6 lg:px-8 relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-brand-muted dark:text-slate-400">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2">
            <Link
              href="/"
              className="hover:text-brand-primary dark:hover:text-teal-400 transition-colors"
            >
              صفحه اصلی
            </Link>
            <span>/</span>
            <span className="text-brand-dark dark:text-white font-bold">
              کاتالوگ اشتراک‌های دیجیتال
            </span>
            {selectedCategoryObj && (
              <>
                <span>/</span>
                <span className="text-teal-600 dark:text-teal-400 font-bold">
                  {selectedCategoryObj.title}
                </span>
              </>
            )}
          </nav>

          <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold border border-teal-200/60 dark:border-teal-800/60">
              <Sparkles className="w-3 h-3 text-teal-500" />
              {filteredProducts.length} اشتراک آماده
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10 pb-24 sm:pb-12">
        {/* Mobile Filter Trigger & View Toggle Bar */}
        <div className="lg:hidden mb-4 flex items-center justify-between gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-brand-border/80 dark:border-slate-800/80 p-2.5 sm:p-3 rounded-2xl shadow-card">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 text-xs font-bold text-brand-dark dark:text-white bg-slate-100 dark:bg-slate-800/90 hover:bg-teal-50 dark:hover:bg-teal-950/40 px-3.5 py-2 rounded-xl transition-all active:scale-95 border border-slate-200/80 dark:border-slate-700/80"
          >
            <SlidersHorizontal className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>فیلترها و دسته‌ها</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-mono font-black flex items-center justify-center animate-pulse">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-brand-muted dark:text-slate-400 hidden xs:inline">
              چیدمان:
            </span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setMobileViewMode("grid")}
                title="نمایش ۲ ستونه"
                className={`p-1.5 rounded-lg transition-all ${
                  mobileViewMode === "grid"
                    ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-2xs"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <Grid2X2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode("list")}
                title="نمایش تک ستونه عریض"
                className={`p-1.5 rounded-lg transition-all ${
                  mobileViewMode === "list"
                    ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-2xs"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <StretchHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Sheet Filter Drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setMobileFiltersOpen(false)}
            />

            {/* Bottom Sheet Modal */}
            <div className="relative z-10 w-full max-h-[85vh] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-5 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2 font-bold text-sm text-brand-dark dark:text-white">
                  <SlidersHorizontal className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>فیلتر و جستجوی پیشرفته</span>
                  {activeFiltersCount > 0 && (
                    <span className="text-[11px] font-mono font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-full">
                      {activeFiltersCount} فعال
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-xs text-rose-600 hover:underline font-semibold"
                    >
                      حذف همه
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sheet Body (Scrollable) */}
              <div className="overflow-y-auto py-4 space-y-5 text-xs">
                {/* Search */}
                <div>
                  <label className="block font-semibold text-brand-dark dark:text-slate-200 mb-1.5">
                    جستجوی عنوان محصول:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="مثلاً ChatGPT، Spotify، تلگرام..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-xs outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900 dark:text-slate-100"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <label className="block font-semibold text-brand-dark dark:text-slate-200 mb-1.5">
                    انتخاب دسته‌بندی:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCat("all")}
                      className={`text-right p-2 rounded-xl text-xs font-semibold transition-all ${
                        selectedCat === "all"
                          ? "bg-teal-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      همه دسته‌ها ({activeProducts.length})
                    </button>
                    {categories.map((c) => {
                      const count = activeProducts.filter(
                        (p) => p.categoryId === c.id
                      ).length;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCat(c.id)}
                          className={`text-right p-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                            selectedCat === c.id
                              ? "bg-teal-600 text-white font-bold shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className="truncate">{c.title}</span>
                          <span className="font-mono text-[10px] opacity-75">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* In Stock Filter */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      فقط اشتراک‌های موجود و آماده تحویل
                    </span>
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="w-4 h-4 rounded accent-teal-600 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Price Slider */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      حداکثر سقف قیمت:
                    </span>
                    <span className="font-bold text-teal-600 dark:text-teal-400 font-mono text-xs">
                      {maxPriceToman === null
                        ? `بدون سقف (${formatPrice(highestPriceInCatalog)} ت)`
                        : `${formatPrice(maxPriceToman)} تومان`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100000"
                    max={highestPriceInCatalog}
                    step="50000"
                    value={currentMaxPrice}
                    onChange={(e) => setMaxPriceToman(Number(e.target.value))}
                    className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Sheet Action Bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(1);
                    setMobileFiltersOpen(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow-md active:scale-95"
                >
                  اعمال فیلترها ({filteredProducts.length} محصول)
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Desktop Sidebar Filters (3 cols) - Sticky Glassmorphic */}
          <aside className="hidden lg:block lg:col-span-3 glass-panel border border-brand-border/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-card hover:shadow-3d transition-all duration-300 space-y-6 sticky top-28">
            {/* Filter Header */}
            <div className="flex items-center justify-between pb-4 border-b border-brand-border/80 dark:border-slate-800/80">
              <div className="flex items-center gap-2 font-bold text-xs text-brand-dark dark:text-white">
                <SlidersHorizontal className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>فیلترهای پیشرفته</span>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1 font-semibold transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>حذف فیلترها</span>
                </button>
              )}
            </div>

            {/* Direct Search Input */}
            <div>
              <label className="block text-xs font-semibold text-brand-dark dark:text-slate-200 mb-2">
                جستجوی عنوان اشتراک:
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="عنوان محصول..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-brand-surfaceDim dark:bg-slate-800/80 border border-brand-border dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-8 text-xs outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 transition-all duration-200"
                />
                <Search className="w-4 h-4 text-neutral-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setCurrentPage(1);
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-xs font-semibold text-brand-dark dark:text-slate-200 mb-2">
                دسته‌بندی‌ها:
              </label>
              <div className="space-y-1 text-xs max-h-64 overflow-y-auto pr-1">
                <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-teal-50/60 dark:hover:bg-slate-800/60 transition-colors">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="cat"
                      checked={selectedCat === "all"}
                      onChange={() => {
                        setSelectedCat("all");
                        setCurrentPage(1);
                      }}
                      className="accent-teal-600"
                    />
                    <span className="font-semibold text-brand-dark dark:text-slate-200">
                      همه دسته‌ها
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 dark:text-slate-500 font-mono">
                    {activeProducts.length}
                  </span>
                </label>

                {categories.map((c) => {
                  const count = activeProducts.filter(
                    (p) => p.categoryId === c.id
                  ).length;
                  return (
                    <label
                      key={c.id}
                      className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-teal-50/60 dark:hover:bg-slate-800/60 transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="radio"
                          name="cat"
                          checked={selectedCat === c.id}
                          onChange={() => {
                            setSelectedCat(c.id);
                            setCurrentPage(1);
                          }}
                          className="accent-teal-600"
                        />
                        <span className="text-brand-muted dark:text-slate-300 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                          {c.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400 dark:text-slate-500 font-mono shrink-0 mr-1">
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* In-Stock Toggle */}
            <div className="pt-4 border-t border-brand-border/80 dark:border-slate-800/80">
              <label className="flex items-center justify-between cursor-pointer text-xs group py-1">
                <span className="font-semibold text-brand-dark dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  فقط اشتراک‌های موجود
                </span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="w-4 h-4 rounded accent-teal-600 cursor-pointer transition-transform group-hover:scale-110"
                />
              </label>
            </div>

            {/* Price range */}
            <div className="pt-4 border-t border-brand-border/80 dark:border-slate-800/80">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-semibold text-brand-dark dark:text-slate-200">
                  حداکثر قیمت:
                </span>
                <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">
                  {maxPriceToman === null
                    ? `بدون سقف (${formatPrice(highestPriceInCatalog)} ت)`
                    : `${formatPrice(maxPriceToman)} تومان`}
                </span>
              </div>
              <input
                type="range"
                min="100000"
                max={highestPriceInCatalog}
                step="50000"
                value={currentMaxPrice}
                onChange={(e) => {
                  setMaxPriceToman(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
            </div>
          </aside>

          {/* Product Grid & Sorting Section (9 cols) */}
          <section className="lg:col-span-9 space-y-6">
            {/* Sorting bar with glassmorphic styling */}
            <div className="glass-panel border border-brand-border/80 dark:border-slate-800/80 rounded-2xl p-3 sm:p-4 shadow-card hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-muted dark:text-slate-400">
                <ArrowUpDown className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>مرتب‌سازی:</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  onClick={() => {
                    setSortBy("popular");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl transition-all duration-200 font-semibold active:scale-95 ${
                    sortBy === "popular"
                      ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold shadow-2xs"
                      : "text-brand-muted dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800"
                  }`}
                >
                  محبوب‌ترین
                </button>
                <button
                  onClick={() => {
                    setSortBy("newest");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl transition-all duration-200 font-semibold active:scale-95 ${
                    sortBy === "newest"
                      ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold shadow-2xs"
                      : "text-brand-muted dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800"
                  }`}
                >
                  جدیدترین
                </button>
                <button
                  onClick={() => {
                    setSortBy("price_asc");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl transition-all duration-200 font-semibold active:scale-95 ${
                    sortBy === "price_asc"
                      ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold shadow-2xs"
                      : "text-brand-muted dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800"
                  }`}
                >
                  ارزان‌ترین
                </button>
                <button
                  onClick={() => {
                    setSortBy("price_desc");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl transition-all duration-200 font-semibold active:scale-95 ${
                    sortBy === "price_desc"
                      ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold shadow-2xs"
                      : "text-brand-muted dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800"
                  }`}
                >
                  گران‌ترین
                </button>
                <button
                  onClick={() => {
                    setSortBy("rating");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl transition-all duration-200 font-semibold active:scale-95 ${
                    sortBy === "rating"
                      ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold shadow-2xs"
                      : "text-brand-muted dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800"
                  }`}
                >
                  بیشترین امتیاز
                </button>
                <button
                  onClick={() => {
                    setSortBy("on_sale");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl transition-all duration-200 font-bold flex items-center gap-1 active:scale-95 ${
                    sortBy === "on_sale"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>تخفیف‌دار</span>
                </button>
              </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <div className="space-y-6 sm:space-y-8">
                <div
                  className={`grid ${
                    mobileViewMode === "list"
                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  } gap-2.5 sm:gap-4 lg:gap-6`}
                >
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination Controls */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredProducts.length}
                  itemsPerPage={pageSize}
                  itemName="اشتراک"
                  pageSizeOptions={[6, 12, 24, 48]}
                  onItemsPerPageChange={(newSize) => {
                    setPageSize(newSize);
                    setCurrentPage(1);
                  }}
                  onPageChange={(p) => {
                    setCurrentPage(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="border-t border-brand-border/80 dark:border-slate-800/80 pt-6"
                />
              </div>
            ) : (
              <div className="glass-panel border border-dashed border-brand-border dark:border-slate-800 rounded-3xl p-12 sm:p-16 text-center shadow-card">
                <Package className="w-14 h-14 text-neutral-300 dark:text-slate-600 mx-auto mb-3.5 animate-bounce" />
                <h3 className="font-bold text-base text-brand-dark dark:text-white">
                  محصولی با این مشخصات یا فیلترها یافت نشد!
                </h3>
                <p className="text-xs text-brand-muted dark:text-slate-400 mt-1.5 max-w-md mx-auto">
                  می‌توانید با پاک کردن فیلترها یا جستجوی عنوانی دیگر، کلیه
                  محصولات و اشتراک‌های موجود ارزان اکانت را مشاهده نمایید.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-teal-500/20 active:scale-95 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>پاک کردن همه فیلترها</span>
                  </button>
                  <Link
                    href="/categories"
                    className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>مشاهده دسته‌بندی‌ها</span>
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-brand-surfaceDim dark:bg-slate-950 text-slate-500">
          در حال بارگذاری کاتالوگ...
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
