"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import ProductCard from "@/components/store/ProductCard";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import AmbientGlow from "@/components/ui/AmbientGlow";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/format";
import Link from "next/link";
import {
  ArrowRight,
  Layers,
  PackageX,
  Search,
  ArrowUpDown,
  Zap,
  Grid2X2,
  StretchHorizontal,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Flame,
  X,
} from "lucide-react";
import Pagination from "@/components/ui/Pagination";

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { activeProducts, categories, calculateProductPrice } = useStore();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    "popular" | "newest" | "price_asc" | "price_desc" | "rating" | "on_sale"
  >("popular");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [mobileViewMode, setMobileViewMode] = useState<"grid" | "list">("grid");

  // Mobile default page size
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setPageSize(6);
    }
  }, []);

  const decodedSlug = useMemo(() => {
    try {
      return decodeURIComponent(slug || "");
    } catch {
      return slug || "";
    }
  }, [slug]);

  const currentCategory = categories.find(
    (c) => c.slug === slug || c.slug === decodedSlug
  );

  useEffect(() => {
    if (currentCategory?.title) {
      document.title = `خرید اشتراک‌های ${currentCategory.title} | ارزان اکانت`;
    }
  }, [currentCategory?.title]);

  // Theme customization based on category type
  const theme = useMemo(() => {
    const s = (slug || "").toLowerCase();
    const icon = currentCategory?.icon;
    if (s.includes("ai") || s.includes("gpt") || s.includes("bot") || icon === "Bot") {
      return {
        gradient: "from-slate-950 via-cyan-950 to-slate-900 border-cyan-500/30",
        accent: "text-cyan-400",
        badge: "border-cyan-400/40 text-cyan-300 bg-cyan-950/60",
        glow: "teal" as const,
        label: "سرویس‌های تخصصی هوش مصنوعی",
      };
    }
    if (s.includes("stream") || s.includes("film") || s.includes("movie") || icon === "Film" || icon === "Tv") {
      return {
        gradient: "from-slate-950 via-purple-950 to-slate-900 border-purple-500/30",
        accent: "text-rose-400",
        badge: "border-rose-400/40 text-rose-300 bg-rose-950/60",
        glow: "purple" as const,
        label: "سرویس‌های استریم فیلم، سینما و مدیا",
      };
    }
    if (s.includes("game") || s.includes("gaming") || icon === "Gamepad2") {
      return {
        gradient: "from-slate-950 via-violet-950 to-slate-900 border-violet-500/30",
        accent: "text-violet-400",
        badge: "border-violet-400/40 text-violet-300 bg-violet-950/60",
        glow: "purple" as const,
        label: "اشتراک‌ها و امکانات گیمینگ آنلاین",
      };
    }
    if (s.includes("music") || s.includes("spotify") || icon === "Headphones") {
      return {
        gradient: "from-slate-950 via-emerald-950 to-slate-900 border-emerald-500/30",
        accent: "text-emerald-400",
        badge: "border-emerald-400/40 text-emerald-300 bg-emerald-950/60",
        glow: "teal" as const,
        label: "اشتراک‌های موسیقی و پادکست اختصاصی",
      };
    }
    return {
      gradient: "from-slate-950 via-teal-950 to-slate-900 border-teal-500/30",
      accent: "text-teal-400",
      badge: "border-teal-400/40 text-teal-300 bg-teal-950/60",
      glow: "teal" as const,
      label: "اشتراک و لایسنس اورجینال",
    };
  }, [slug, currentCategory?.icon]);

  // Filter & Sort category products with in-stock priority
  const filteredProducts = useMemo(() => {
    if (!currentCategory) return [];

    return activeProducts
      .filter((p) => p.categoryId === currentCategory.id)
      .filter((p) => {
        const matchesSearch =
          !search.trim() ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.customTitle.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase());

        const matchesStock = !inStockOnly || p.inStock;
        const price = calculateProductPrice(p);
        const matchesSale = sortBy !== "on_sale" || Boolean(price.isOnSale || p.isFlashDeal);

        return matchesSearch && matchesStock && matchesSale;
      })
      .sort((a, b) => {
        // In-stock items first
        const stockA = a.inStock && (a.stockCount === undefined || a.stockCount > 0) ? 1 : 0;
        const stockB = b.inStock && (b.stockCount === undefined || b.stockCount > 0) ? 1 : 0;
        if (stockA !== stockB) {
          return stockB - stockA;
        }

        const priceA = calculateProductPrice(a).toman;
        const priceB = calculateProductPrice(b).toman;

        if (sortBy === "price_asc") return priceA - priceB;
        if (sortBy === "price_desc") return priceB - priceA;
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "newest") return b.externalId - a.externalId;
        if (sortBy === "on_sale") return (b.isFlashDeal ? 1 : 0) - (a.isFlashDeal ? 1 : 0);
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || b.reviewCount - a.reviewCount;
      });
  }, [activeProducts, currentCategory, search, inStockOnly, sortBy, calculateProductPrice]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (!currentCategory) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-brand-dark dark:text-slate-100">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
            <PackageX className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-brand-dark dark:text-white">
            دسته‌بندی مورد نظر یافت نشد!
          </h2>
          <p className="text-xs text-brand-muted dark:text-slate-400 mt-2">
            ممکن است آدرس وارد شده تغییر کرده یا حذف شده باشد.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>مشاهده تمام دسته‌بندی‌ها</span>
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <span>کاتالوگ کامل</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors relative overflow-x-hidden">
      {/* Background Ambient Glow */}
      <AmbientGlow variant={theme.glow} className="-top-28 -right-28 pointer-events-none" />
      <AmbientGlow variant="mixed" className="top-2/3 -left-32 pointer-events-none" />

      {currentCategory && (
        <BreadcrumbJsonLd
          items={[
            { name: "صفحه اصلی", url: "https://arzanaccount.ir" },
            { name: "دسته‌بندی‌ها", url: "https://arzanaccount.ir/categories" },
            { name: currentCategory.title, url: `https://arzanaccount.ir/category/${currentCategory.slug}` },
          ]}
        />
      )}

      <Header />

      {/* Breadcrumb Navigation Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-brand-border/80 dark:border-slate-800/80 py-3.5 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-brand-muted dark:text-slate-400">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2">
            <Link href="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              صفحه اصلی
            </Link>
            <span>/</span>
            <Link href="/categories" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              دسته‌بندی‌ها
            </Link>
            <span>/</span>
            <span className="text-brand-dark dark:text-white font-bold">
              {currentCategory?.title || "دسته"}
            </span>
          </nav>

          <Link
            href="/products"
            className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>کاتالوگ کامل</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 pb-24 sm:pb-12 space-y-6">
        {/* Dynamic Category Theme Banner */}
        <div
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${theme.gradient} text-white p-6 sm:p-10 shadow-2xl border`}
        >
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="absolute -top-16 -right-16 w-60 h-60 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${theme.badge}`}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{theme.label}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {currentCategory ? currentCategory.title : "دسته‌بندی"}
              </h1>

              {currentCategory?.description ? (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                  {currentCategory.description}
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  خرید آنلاین و ارزان اشتراک‌های اورجینال با تحویل خودکار و ضمانت کامل طول مدت استفاده.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/10 dark:bg-slate-800/40 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center sm:text-right shrink-0">
              <div className="px-3 py-1">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono block">
                  {filteredProducts.length}
                </span>
                <span className="text-[11px] text-teal-200 font-medium">سرویس آماده خرید</span>
              </div>
              <div className="hidden sm:block w-px h-10 bg-white/20" />
              <div className="px-3 py-1">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono flex items-center justify-center sm:justify-start gap-1">
                  <Zap className="w-5 h-5 fill-amber-400" />
                  <span>تحویل آنی</span>
                </span>
                <span className="text-[11px] text-teal-200 font-medium">پشتیبانی و گارانتی</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & View Controls Bar */}
        <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-brand-border/80 dark:border-slate-800/80 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Quick Search within category */}
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder={`جستجو در بین اشتراک‌های ${currentCategory?.title || ""}...`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-brand-surfaceDim dark:bg-slate-800/90 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2 pr-9 pl-8 text-xs outline-none text-slate-800 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500"
            />
            <Search className="w-4 h-4 text-neutral-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort pills & Layout toggles */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              <button
                onClick={() => {
                  setSortBy("popular");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all active:scale-95 ${
                  sortBy === "popular"
                    ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-2xs font-bold"
                    : "text-brand-muted dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800"
                }`}
              >
                محبوب‌ترین
              </button>
              <button
                onClick={() => {
                  setSortBy("price_asc");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all active:scale-95 ${
                  sortBy === "price_asc"
                    ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-2xs font-bold"
                    : "text-brand-muted dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800"
                }`}
              >
                ارزان‌ترین
              </button>
              <button
                onClick={() => {
                  setSortBy("rating");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all active:scale-95 ${
                  sortBy === "rating"
                    ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-2xs font-bold"
                    : "text-brand-muted dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800"
                }`}
              >
                امتیاز بالا
              </button>
              <button
                onClick={() => {
                  setSortBy("on_sale");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-1 ${
                  sortBy === "on_sale"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>تخفیف‌دار</span>
              </button>
            </div>

            {/* Mobile View Mode Toggle */}
            <div className="flex items-center sm:hidden bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setMobileViewMode("grid")}
                title="۲ ستونه"
                className={`p-1.5 rounded-lg transition-all ${
                  mobileViewMode === "grid"
                    ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-2xs"
                    : "text-slate-400"
                }`}
              >
                <Grid2X2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode("list")}
                title="تک ستونه"
                className={`p-1.5 rounded-lg transition-all ${
                  mobileViewMode === "list"
                    ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-2xs"
                    : "text-slate-400"
                }`}
              >
                <StretchHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="space-y-8">
            <div
              className={`grid ${
                mobileViewMode === "list"
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              } gap-2.5 sm:gap-4 md:gap-6`}
            >
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredProducts.length}
              itemsPerPage={pageSize}
              itemName="محصول"
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
          <div className="glass-panel border border-dashed border-brand-border dark:border-slate-800 rounded-3xl p-16 text-center shadow-card space-y-4">
            <PackageX className="w-14 h-14 text-neutral-300 dark:text-slate-600 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-brand-dark dark:text-white">
              اشتراکی در این دسته‌بندی با مشخصات وارد شده یافت نشد
            </h3>
            <p className="text-xs text-brand-muted dark:text-slate-400 max-w-md mx-auto">
              {search
                ? "می‌توانید با پاک کردن فیلتر جستجو سایر محصولات این دسته را مشاهده نمایید."
                : "محصولات جدید این دسته به‌زودی اضافه خواهند شد. می‌توانید از کاتالوگ جامع ارزان اکانت دیدن فرمایید."}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>پاک کردن جستجو</span>
                </button>
              )}
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-5 py-2.5 rounded-xl shadow-xs transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span>مشاهده تمام محصولات</span>
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
