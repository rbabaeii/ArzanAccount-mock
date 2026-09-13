"use client";

import React from "react";
import Link from "next/link";
import { Product } from "@/types";
import { useStore } from "@/context/StoreContext";
import { ArrowLeft, Zap, Star, ShoppingBag } from "lucide-react";

export default function ProductCard({ product }: { product: Product }) {
  const { calculateProductPrice, addToCart } = useStore();
  const price = calculateProductPrice(product);
  const isOutOfStock = !product.inStock || (product.stockCount !== undefined && product.stockCount <= 0);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product, product.pricingUnit === "per_1000" ? (product.minQty || 1000) : 1);
  };

  const cleanExcerpt = React.useMemo(() => {
    const raw = product.persianDescription || product.description;
    if (!raw) return "";
    const cleaned = raw
      .replace(/https?:\/\/\S+/gi, "")
      .replace(/[*#_~`>-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned.slice(0, 110);
  }, [product.description, product.persianDescription]);

  return (
    <article
      className={`group relative glass-card rounded-2xl overflow-hidden card-3d-interactive flex flex-col h-full ${
        isOutOfStock
          ? "border-slate-200/60 dark:border-slate-800/80 opacity-60 grayscale-[40%] hover:grayscale-0 hover:opacity-95"
          : "border-brand-border/80 dark:border-slate-800/80 hover:border-teal-500/50 dark:hover:border-teal-400/40 shadow-card hover:shadow-3d"
      }`}
    >
      {/* Dynamic 3D ambient hover lighting orb */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br from-teal-400/20 to-emerald-400/10 rounded-full blur-2xl group-hover:scale-150 group-hover:opacity-100 opacity-40 transition-all duration-500 pointer-events-none z-10" />

      {/* Media Box */}
      <div className="relative aspect-square w-full bg-brand-surfaceDim dark:bg-slate-800/60 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.customTitle}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-surfaceDim dark:bg-slate-800 text-neutral-400 dark:text-slate-500 font-mono text-[10px] sm:text-xs">
            بدون تصویر
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col gap-1 sm:gap-1.5 items-start pointer-events-none z-10">
          {isOutOfStock ? (
            <span className="text-[9px] sm:text-[10px] font-extrabold bg-slate-900/90 dark:bg-slate-800/90 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md shadow-xs border border-white/20">
              ناموجود
            </span>
          ) : (
            <>
              {product.badge && (
                <span className="text-[9px] sm:text-[10px] font-bold tracking-tight bg-brand-primary text-white px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md shadow-xs">
                  {product.badge}
                </span>
              )}
              {price.isOnSale && (
                <span className="text-[9px] sm:text-[10px] font-extrabold bg-rose-600 text-white px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5 sm:gap-1 animate-pulse">
                  <Zap className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                  حراج ویژه
                </span>
              )}
              {product.isFlashDeal && !price.isOnSale && (
                <span className="text-[9px] sm:text-[10px] font-extrabold bg-brand-accent text-white px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5 sm:gap-1">
                  <Zap className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                  تخفیف
                </span>
              )}
            </>
          )}
        </div>

        {/* Stock / Unit indicator */}
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 flex items-center gap-1 z-10">
          <span className="text-[9px] sm:text-[10px] font-medium bg-white/95 dark:bg-slate-900/90 backdrop-blur-xs text-brand-dark dark:text-slate-200 px-1.5 py-0.5 rounded-md border border-brand-border dark:border-slate-700 shadow-2xs">
            {isOutOfStock ? "ناموجود" : price.isPerThousand ? "تعرفه ۱۰۰۰ تایی" : "تحویل فوری"}
          </span>
        </div>

        {/* Quick Add overlay button */}
        {!isOutOfStock && (
          <button
            onClick={handleQuickAdd}
            title="افزودن سریع به سبد"
            className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-90 z-20"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>

      {/* Content Info */}
      <div className="p-2.5 sm:p-4 md:p-5 flex flex-col flex-1 justify-between gap-2 sm:gap-4 relative z-10">
        <div>
          {/* Rating and API source */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-brand-muted dark:text-slate-400 mb-1">
            <span className="font-mono text-[9px] sm:text-[10px] text-neutral-400 dark:text-slate-500 truncate max-w-[90px] sm:max-w-[150px]">
              {product.name}
            </span>
            <div className="flex items-center gap-0.5 sm:gap-1 text-amber-500 font-bold shrink-0">
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400" />
              <span>{product.rating ?? 4.9}</span>
              <span className="text-[9px] sm:text-[10px] text-neutral-400 dark:text-slate-500">({product.reviewCount ?? 15})</span>
            </div>
          </div>

          <Link href={`/products/${product.id}`}>
            <h3 className="font-bold text-xs sm:text-sm text-brand-dark dark:text-white group-hover:text-brand-primary dark:group-hover:text-teal-400 transition-colors line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] leading-snug sm:leading-relaxed">
              {product.customTitle}
            </h3>
          </Link>

          {/* Clean clamped description (strictly limited to at most 2 lines, prevents stretching) */}
          {cleanExcerpt ? (
            <p
              className="text-[11px] text-brand-muted dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed overflow-hidden max-h-9 break-words"
              title={cleanExcerpt}
            >
              {cleanExcerpt}
            </p>
          ) : (
            <div className="mt-1 h-4" />
          )}
        </div>

        {/* Price & CTA */}
        <div className="pt-2 sm:pt-3 border-t border-brand-border dark:border-slate-800 flex items-end justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0">
            {price.isOnSale && price.formattedOriginalToman ? (
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[9px] sm:text-[10px] text-neutral-400 dark:text-slate-500 line-through font-mono">
                  {price.formattedOriginalToman}
                </span>
                <span className="text-[8px] sm:text-[9px] bg-rose-600 text-white font-bold px-1 py-0.2 rounded shadow-2xs">
                  حراج
                </span>
              </div>
            ) : price.discountPercent > 0 ? (
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[9px] sm:text-[10px] text-neutral-400 dark:text-slate-500 line-through font-mono">
                  {price.formattedPublicRetailToman}
                </span>
                <span className="text-[8px] sm:text-[9px] bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 font-bold px-1 py-0.2 rounded">
                  %{price.discountPercent}
                </span>
              </div>
            ) : (
              <span className="text-[9px] sm:text-[10px] text-neutral-400 dark:text-slate-500 block font-medium">
                قیمت:
              </span>
            )}
            <div className="flex items-baseline gap-0.5 sm:gap-1 mt-0.5">
              <span className={`text-xs sm:text-base md:text-lg lg:text-xl font-black tracking-tight ${
                price.isOnSale ? "text-rose-600 dark:text-rose-400" : "text-brand-dark dark:text-white"
              }`}>
                {price.formattedToman}
              </span>
              <span className="text-[9px] sm:text-[11px] text-brand-muted dark:text-slate-400 font-semibold">ت</span>
            </div>
          </div>

          <Link
            href={`/products/${product.id}`}
            className={`group/btn inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shrink-0 border ${
              isOutOfStock
                ? "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                : "text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 border-transparent shadow-xs hover:shadow-md hover:shadow-teal-500/20"
            }`}
          >
            <span>{isOutOfStock ? "مشاهده" : "خرید"}</span>
            <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover/btn:-translate-x-0.5 transition-transform duration-200" />
          </Link>
        </div>
      </div>
    </article>
  );
}
