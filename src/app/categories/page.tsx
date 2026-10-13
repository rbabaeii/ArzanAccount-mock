"use client";

import React, { useState, useMemo, useEffect } from "react";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import AmbientGlow from "@/components/ui/AmbientGlow";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/format";
import Link from "next/link";
import {
  FolderTree,
  Search,
  ArrowLeft,
  Sparkles,
  Bot,
  Film,
  Headphones,
  Share2,
  Package,
  ChevronLeft,
  Shield,
  Gamepad2,
  Code2,
  Tv,
  Zap,
  Tag,
  CheckCircle2,
  Layers,
  X,
} from "lucide-react";

export default function CategoriesArchivePage() {
  const { categories, activeProducts, products, calculateProductPrice } = useStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    document.title = "دسته‌بندی جامع اشتراک‌ها و اکانت‌های دیجیتال | ارزان اکانت";
  }, []);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Bot":
        return <Bot className="w-5 h-5 sm:w-6 sm:h-6" />;
      case "Film":
      case "Tv":
        return <Film className="w-5 h-5 sm:w-6 sm:h-6" />;
      case "Headphones":
      case "Music":
        return <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />;
      case "Share2":
      case "Social":
        return <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />;
      case "Gamepad":
      case "Gamepad2":
        return <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />;
      case "Shield":
      case "Security":
        return <Shield className="w-5 h-5 sm:w-6 sm:h-6" />;
      case "Code":
      case "Code2":
        return <Code2 className="w-5 h-5 sm:w-6 sm:h-6" />;
      default:
        return <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
  };

  // Map categories with stats, lowest starting price, and sample top items
  // Only display categories that have active products
  const categoriesWithStats = useMemo(() => {
    return categories
      .map((cat) => {
        const catProducts = activeProducts.filter(
          (p) => p.categoryId === cat.id || p.categoryId === cat.slug
        );
        const activeCount = catProducts.length;
        const totalCount = products.filter(
          (p) => p.categoryId === cat.id || p.categoryId === cat.slug
        ).length;

        // Find lowest price
        let minPriceToman: number | null = null;
        if (catProducts.length > 0) {
          minPriceToman = catProducts.reduce((min, p) => {
            const price = calculateProductPrice(p).toman;
            return min === null || price < min ? price : min;
          }, null as number | null);
        }

        // Sample top 3 product names
        const sampleItems = catProducts.slice(0, 3).map((p) => p.customTitle || p.name);

        return {
          ...cat,
          activeCount,
          totalCount,
          minPriceToman,
          sampleItems,
        };
      })
      .filter((cat) => cat.activeCount > 0);
  }, [categories, activeProducts, products, calculateProductPrice]);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return categoriesWithStats;
    return categoriesWithStats.filter((cat) => {
      return (
        cat.title.toLowerCase().includes(term) ||
        cat.slug.toLowerCase().includes(term) ||
        (cat.description && cat.description.toLowerCase().includes(term))
      );
    });
  }, [categoriesWithStats, searchTerm]);

  return (
    <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <AmbientGlow variant="purple" className="-top-24 -left-24 pointer-events-none" />
      <AmbientGlow variant="teal" className="top-1/2 -right-32 pointer-events-none" />

      {/* SEO Breadcrumb Schema */}
      <BreadcrumbJsonLd
        items={[
          { name: "صفحه اصلی", url: "https://arzanaccount.ir" },
          { name: "دسته‌بندی‌ها", url: "https://arzanaccount.ir/categories" },
        ]}
      />

      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 relative z-10 pb-32 sm:pb-16">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-brand-muted dark:text-slate-400">
          <Link href="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
            صفحه اصلی
          </Link>
          <span>/</span>
          <span className="text-brand-dark dark:text-white font-bold">تمام دسته‌بندی‌های اشتراک</span>
        </nav>

        {/* Hero Card with 3D & Liquid Glass Accent */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-10 shadow-2xl border border-teal-500/20">
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-teal-300 text-xs font-semibold border border-white/15 backdrop-blur-xs">
                <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                <span>دایرکتوری جامع سرویس‌های اشتراکی بین‌المللی</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                دسته‌بندی‌های تخصصی ارزان اکانت
              </h1>

              <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
                دسترسی منظم به بیش از ۳۰ شاخه اشتراک دیجیتال از جمله ابزارهای هوش مصنوعی، سرویس‌های استریمینگ فیلم و موزیک، شبکه‌های اجتماعی، اکانت‌های گیمینگ و لایسنس‌های قانونی با تحویل آنی و تضمین بازگشت وجه.
              </p>
            </div>

            <div className="flex flex-row items-center gap-4 bg-white/10 dark:bg-slate-800/40 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 shrink-0">
              <div className="text-center px-2">
                <span className="text-2xl sm:text-4xl font-black text-amber-400 font-mono block">
                  {categoriesWithStats.length}
                </span>
                <span className="text-[11px] text-teal-200 font-medium">دسته‌بندی دارای محصول</span>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center px-2">
                <span className="text-2xl sm:text-4xl font-black text-white font-mono block">
                  +{activeProducts.length}
                </span>
                <span className="text-[11px] text-teal-200 font-medium">اشتراک آماده تحویل</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Search & Filter Bar */}
        <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-brand-border/80 dark:border-slate-800/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:max-w-md relative">
            <input
              type="text"
              placeholder="جستجو در نام دسته (مثلاً هوش مصنوعی، نتفلیکس، اسپاتیفای، تلگرام...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-surfaceDim dark:bg-slate-800/90 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2.5 pr-10 pl-9 text-xs outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500"
            />
            <Search className="w-4 h-4 text-neutral-400 dark:text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-3 text-xs text-brand-muted dark:text-slate-400">
            <span>
              نمایش <strong className="font-mono text-brand-dark dark:text-white font-bold">{filteredCategories.length}</strong> دسته
            </span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-teal-600 dark:text-teal-400 hover:underline text-xs font-semibold"
              >
                پاک کردن جستجو
              </button>
            )}
          </div>
        </div>

        {/* Bento Grid of Categories */}
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
            {filteredCategories.map((cat, index) => {
              // Highlight top 2 categories in Bento layout on large screens
              const isBentoHighlight = index < 2 && !searchTerm;

              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className={`group relative overflow-hidden glass-card p-5 sm:p-6 rounded-2xl border border-brand-border/80 dark:border-slate-800/80 hover:border-teal-500/50 dark:hover:border-teal-400/40 shadow-card hover:shadow-3d transition-all duration-300 flex flex-col justify-between card-3d-interactive ${
                    isBentoHighlight ? "sm:col-span-2 bg-gradient-to-br from-white via-teal-50/20 to-white dark:from-slate-900 dark:via-teal-950/20 dark:to-slate-900" : ""
                  }`}
                >
                  {/* Glowing dynamic background orb */}
                  <div className="absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br from-teal-400/20 to-cyan-400/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />

                  <div>
                    {/* Top row: Icon + Count badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-slate-800 text-teal-600 dark:text-teal-400 group-hover:bg-gradient-to-tr group-hover:from-teal-600 group-hover:to-emerald-600 group-hover:text-white transition-all duration-300 flex items-center justify-center shadow-2xs group-hover:scale-110 group-hover:rotate-3">
                        {getCategoryIcon(cat.icon)}
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full font-mono transition-transform duration-200 group-hover:scale-105 border ${
                          cat.activeCount > 0
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {cat.activeCount > 0 ? `${cat.activeCount} سرویس فعال` : "سفارشی"}
                      </span>
                    </div>

                    {/* Title and slug */}
                    <h3 className="font-black text-sm sm:text-base text-brand-dark dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                      {cat.title}
                    </h3>

                    <span className="text-[10.5px] text-neutral-400 dark:text-slate-500 font-mono block mt-0.5 dir-ltr text-right truncate">
                      /{cat.slug}
                    </span>

                    {/* Description */}
                    <p className="text-xs text-brand-muted dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {cat.description || "سرویس‌های اورجینال با تضمین سلامت اکانت و تحویل فوری آنلاین."}
                    </p>

                    {/* Sample Product Chips */}
                    {cat.sampleItems.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        {cat.sampleItems.map((itemTitle, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium truncate max-w-[140px]"
                          >
                            {itemTitle}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Row: Starting Price + CTA */}
                  <div className="pt-4 mt-4 border-t border-brand-border/60 dark:border-slate-800 flex items-center justify-between text-xs">
                    {cat.minPriceToman ? (
                      <div className="text-[11px]">
                        <span className="text-neutral-400 dark:text-slate-500 block text-[9.5px]">شروع از:</span>
                        <span className="font-bold font-mono text-brand-dark dark:text-white">
                          {formatPrice(cat.minPriceToman)} تومان
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        تحویل فوری
                      </span>
                    )}

                    <div className="inline-flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
                      <span>مشاهده کاتالوگ</span>
                      <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel border border-dashed border-brand-border dark:border-slate-800 rounded-3xl p-16 text-center shadow-card space-y-3">
            <Package className="w-12 h-12 text-neutral-300 dark:text-slate-600 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-brand-dark dark:text-white">
              دسته‌بندی متناسب با عبارت «{searchTerm}» یافت نشد
            </h3>
            <p className="text-xs text-brand-muted dark:text-slate-400 max-w-md mx-auto">
              لطفاً املای عبارت را بررسی نموده یا از فهرست دسته‌بندی‌های کلی استفاده نمایید.
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-2 inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-teal-500/20 active:scale-95 transition-all"
            >
              <span>نمایش همه {categoriesWithStats.length} دسته‌بندی دارای محصول</span>
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
