"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/context/StoreContext";
import {
  Search,
  X,
  Sparkles,
  ChevronLeft,
  Tag,
  Loader2,
  Package,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";

interface LiveSearchDropdownProps {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  onSelectProduct?: (id: string) => void;
  scope?: "public" | "admin";
}

const POPULAR_TAGS = [
  "تلگرام",
  "پرمیوم",
  "هوش مصنوعی",
  "چت جی‌پی‌تی",
  "اسپاتیفای",
  "نتفلیکس",
  "یوتیوب",
  "وی پی ان",
  "گیمینگ",
];

export const LiveSearchDropdown: React.FC<LiveSearchDropdownProps> = ({
  placeholder = "جستجوی سرویس (مثلاً ChatGPT Plus، تلگرام، اسپاتیفای...)",
  className = "",
  inputClassName = "",
  onSelectProduct,
  scope = "public",
}) => {
  const router = useRouter();
  
  const store = useStore();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    products: { item: any; score: number; highlights: string[] }[];
    categories: { item: any; score: number }[];
    suggestions: string[];
    totalMatches: number;
    tookMs: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced live search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        if (scope === "admin" && store?.products) {
          const searchLower = query.toLowerCase();
          const filtered = store.products.filter((p: any) => {
            return (
              (p.name && p.name.toLowerCase().includes(searchLower)) ||
              (p.customTitle && p.customTitle.toLowerCase().includes(searchLower)) ||
              (p.externalId && p.externalId.toString().includes(searchLower)) ||
              (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(searchLower)))
            );
          }).slice(0, 8);
          setResults({
            products: filtered.map((p: any) => ({ item: p, score: 1, highlights: [] })),
            categories: [],
            suggestions: [],
            totalMatches: filtered.length,
            tookMs: 1
          });
        } else {
          const res = await api.searchLive(query, scope, scope === "admin" ? 8 : 6);
          if (res) {
            setResults(res);
          }
        }
      } catch (err) {
        console.warn("Live search error:", err);
      } finally {
        setLoading(false);
      }
    }, 140);

    return () => clearTimeout(timer);
  }, [query, scope, store?.products]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsOpen(false);
    if (inputRef.current) inputRef.current.blur();
    if (scope === "admin") {
      router.push(`/admin/products?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectProduct = (productId: string, productName?: string) => {
    setIsOpen(false);
    if (onSelectProduct) {
      onSelectProduct(productId);
    } else if (scope === "admin") {
      router.push(`/admin/products?search=${encodeURIComponent(productName || productId)}`);
    } else {
      router.push(`/products/${productId}`);
    }
  };

  const handleSelectTag = (tag: string) => {
    setQuery(tag);
    setIsOpen(false);
    if (scope === "admin") {
      router.push(`/admin/products?search=${encodeURIComponent(tag)}`);
    } else {
      router.push(`/products?search=${encodeURIComponent(tag)}`);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || !results?.products?.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.products.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.products.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0) {
        const selected = results.products[selectedIndex];
        if (selected) {
          handleSelectProduct(selected.item.id, selected.item.customTitle || selected.item.name);
        }
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Bar Form */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full bg-brand-surfaceDim dark:bg-slate-800/80 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-brand-primary dark:focus:border-teal-400 focus:bg-white dark:focus:bg-slate-800 rounded-xl py-2.5 pr-11 pl-9 text-xs outline-none transition-all duration-200 placeholder:text-neutral-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-100 ${inputClassName}`}
        />

        {/* Search Icon or Loading Spinner */}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-brand-primary dark:text-teal-400" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults(null);
              if (inputRef.current) inputRef.current.focus();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 hover:scale-110 active:scale-90 transition-all duration-150 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Real-time ElasticSearch Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 left-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-brand-border dark:border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden text-right animate-fadeIn max-h-[480px] overflow-y-auto">
          {/* 1. When Query is Empty -> Show Trending / Popular Tags */}
          {!query.trim() && (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <TrendingUp className="w-4 h-4 text-brand-primary dark:text-teal-400" />
                <span>دسته‌ها و کلمات کلیدی پرطرفدار:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleSelectTag(tag)}
                    className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-700 dark:text-slate-300 hover:text-brand-primary dark:hover:text-teal-300 px-3 py-1.5 rounded-lg text-xs font-medium hover:scale-105 active:scale-95 transition-all duration-200 border border-slate-200 dark:border-slate-700/60 cursor-pointer"
                  >
                    <Tag className="w-3 h-3 opacity-60" />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. When Results Found */}
          {query.trim() && results && (
            <div>
              {/* Header Benchmark Badge */}
              <div className="bg-slate-50/80 dark:bg-slate-800/60 px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-primary dark:text-teal-400" />
                  <span>نتایج لحظه‌ای الستیک‌سرچ:</span>
                </div>
                <span className="font-mono text-[10px] text-teal-700 dark:text-teal-300">
                  {results.totalMatches} مورد در {results.tookMs}ms
                </span>
              </div>

              {/* Suggestions / Tags Bar */}
              {results.suggestions && results.suggestions.length > 0 && (
                <div className="p-2.5 bg-teal-50/50 dark:bg-teal-950/20 border-b border-teal-100 dark:border-teal-900/40 flex items-center gap-2 overflow-x-auto text-xs">
                  <span className="text-[11px] text-teal-800 dark:text-teal-300 font-bold shrink-0">
                    پیشنهاد تگ:
                  </span>
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    {results.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectTag(sug)}
                        className="bg-white dark:bg-slate-800 text-teal-900 dark:text-teal-200 px-2.5 py-0.5 rounded-md text-[11px] font-medium border border-teal-200 dark:border-teal-800 shadow-2xs hover:bg-teal-600 hover:text-white hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 cursor-pointer"
                      >
                        #{sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Products List */}
              {results.products.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results.products.map(({ item, score, highlights }, index) => {
                    const isSelected = selectedIndex === index;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectProduct(item.id, item.customTitle || item.name)}
                        className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors group/item ${
                          isSelected
                            ? "bg-teal-50 dark:bg-slate-800"
                            : "hover:bg-teal-50/50 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Product Thumbnail / Icon */}
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 group-hover/item:border-teal-400/40 transition-colors">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.customTitle}
                                className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-brand-primary dark:text-teal-400 group-hover/item:scale-110 transition-transform duration-300" />
                            )}
                          </div>

                          {/* Titles & Tags */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate block group-hover/item:text-teal-700 dark:group-hover/item:text-teal-300 transition-colors">
                                {item.customTitle}
                              </span>
                              {item.categoryTitleFa && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded shrink-0">
                                  {item.categoryTitleFa}
                                </span>
                              )}
                            </div>

                            {/* Tags Chips */}
                            {Array.isArray(item.tags) && item.tags.length > 0 && (
                              <div className="flex items-center gap-1 mt-1 overflow-hidden flex-nowrap">
                                {item.tags.slice(0, 3).map((t: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.2 rounded font-sans truncate"
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price & Stock Badge */}
                        <div className="text-left shrink-0">
                          <div className="font-mono font-bold text-xs text-brand-primary dark:text-teal-300">
                            {formatPrice(item.priceToman)} <span className="text-[10px] font-sans">تومان</span>
                          </div>
                          <span
                            className={`inline-block text-[10px] font-bold mt-0.5 ${
                              item.inStock ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {item.inStock ? "موجود در انبار" : "ناموجود"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <Package className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p>هیچ محصولی مطابق با عبارت &quot;{query}&quot; یافت نشد.</p>
                  <p className="text-[11px] text-slate-500">
                    می‌توانید با استفاده از تگ‌ها یا واژه‌های کلی‌تر جستجو نمایید.
                  </p>
                </div>
              )}

              {/* View Full Results Footer Link */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary dark:text-teal-400 hover:text-teal-600 dark:hover:text-teal-300 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <span>مشاهده همه نتایج جستجو برای &quot;{query}&quot;</span>
                  <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
