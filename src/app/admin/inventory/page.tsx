"use client";

import { formatPrice, formatNumber } from "@/lib/format";

import React, { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { Boxes, AlertTriangle, CheckCircle2, RefreshCw, Search, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";

export default function AdminInventoryPage() {
  const { products, syncWithIrMarket, isLoadingSync, toggleProductActive } = useStore();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const searchLower = search.toLowerCase();
  const filtered = products.filter(
    (p) =>
      !searchLower ||
      (p.name && p.name.toLowerCase().includes(searchLower)) ||
      (p.customTitle && p.customTitle.toLowerCase().includes(searchLower)) ||
      (p.externalId && p.externalId.toString().includes(searchLower)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(searchLower)))
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const lowStockCount = products.filter((p) => p.stockCount < 25 && p.pricingUnit !== "per_1000").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-admin-text dark:text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            انبار و کنترل موجودی محصولات
          </h1>
          <p className="text-xs text-admin-textMuted dark:text-slate-400 mt-1">
            پایش برخط موجودی لایسنس‌ها در سرورهای irMarket و هشدار کمبود موجودی
          </p>
        </div>

        <button
          onClick={() => syncWithIrMarket()}
          disabled={isLoadingSync}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSync ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
          <span>استعلام زنده موجودی از API</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-5 shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-400/40 dark:hover:border-teal-400/30 hover:-translate-y-1.5 transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-teal-500/10 dark:bg-teal-400/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-admin-textMuted">کل اقلام ثبت‌شده</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-admin-text dark:text-white font-mono">
            {products.length} <span className="text-sm font-normal text-admin-textMuted">محصول</span>
          </div>
          <p className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold mt-1">
            همه متصل به وب‌سرویس irMarket
          </p>
        </div>

        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-5 shadow-card hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-400/40 dark:hover:border-emerald-400/30 hover:-translate-y-1.5 transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 dark:bg-emerald-400/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-admin-textMuted">اقلام با موجودی کافی</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {products.length - lowStockCount} <span className="text-sm font-normal text-admin-textMuted">محصول</span>
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
            آماده تحویل فوری و خودکار
          </p>
        </div>

        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-5 shadow-card hover:shadow-xl hover:shadow-amber-500/5 hover:border-amber-400/40 dark:hover:border-amber-400/30 hover:-translate-y-1.5 transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 dark:bg-amber-400/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-admin-textMuted">هشدار موجودی پایین</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {lowStockCount} <span className="text-sm font-normal text-admin-textMuted">مورد</span>
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1">
            کمتر از ۲۵ عدد در سرور مرجع
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs p-4 rounded-2xl border border-admin-borderLight dark:border-slate-800 shadow-card">
        <div className="relative">
          <input
            type="text"
            placeholder="جستجوی محصول جهت بررسی موجودی..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-admin-bg dark:bg-slate-800/90 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 pr-10 pl-4 text-xs outline-none transition-all duration-200"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white dark:bg-slate-900 border border-admin-borderLight dark:border-slate-800 rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-admin-container/60 dark:bg-slate-800/80 border-b border-admin-borderLight dark:border-slate-800 font-bold text-admin-text dark:text-slate-200">
                <th className="py-3.5 px-4">کد مرجع</th>
                <th className="py-3.5 px-4">نام محصول</th>
                <th className="py-3.5 px-4">واحد سفارش</th>
                <th className="py-3.5 px-4">موجودی اعلامی API</th>
                <th className="py-3.5 px-4">وضعیت موجودی</th>
                <th className="py-3.5 px-4 text-center">وضعیت در سایت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-borderLight dark:divide-slate-800">
              {paginated.map((p) => {
                const isLow = p.stockCount < 25 && p.pricingUnit !== "per_1000";

                return (
                  <tr key={p.id} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition-colors duration-150">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-muted">
                      #{p.externalId}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-admin-text dark:text-white block hover:text-teal-600 dark:hover:text-teal-400 transition-colors">{p.customTitle}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">{p.name}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[11px] bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-slate-300 px-2 py-0.5 rounded font-mono">
                        {p.pricingUnit === "per_1000" ? "هزارتایی (SMM)" : "تکی (اکانت)"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-admin-text dark:text-white">
                      {formatNumber(p.stockCount)}
                    </td>

                    <td className="py-3.5 px-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          موجودی محدود
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          موجود و پایدار
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleProductActive(p.id)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xs ${
                          p.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-neutral-100 dark:bg-slate-800 text-neutral-500 border-neutral-200 dark:border-slate-700 hover:bg-neutral-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {p.isActive ? "فعال در فروشگاه" : "مخفی از ویترین"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        itemName="محصول"
        onPageChange={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onItemsPerPageChange={(limit) => {
          setItemsPerPage(limit);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 20, 50, 100]}
      />
    </div>
  );
}

