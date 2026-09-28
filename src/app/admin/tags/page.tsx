"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "@/context/StoreContext";
import { api } from "@/lib/api";
import { Product } from "@/types";
import {
  Tag,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Hash,
  Boxes,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
  X,
  Check,
  Package,
  Layers,
  ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/lib/format";
import { z } from "zod";

interface TagItem {
  name: string;
  count: number;
  sampleProducts: { id: string; title: string }[];
}

const PRESET_CLUSTERS = [
  {
    title: "هوش مصنوعی (AI)",
    icon: "🤖",
    tags: ["هوش مصنوعی", "چت جی‌پی‌تی", "chatgpt", "openai", "gpt-4o", "اشتراک پلاس"],
  },
  {
    title: "تلگرام و استارز",
    icon: "✈️",
    tags: ["تلگرام", "پرمیوم", "استارز", "اکانت قانونی", "telegram"],
  },
  {
    title: "فیلم و استریمینگ",
    icon: "🎬",
    tags: ["نتفلیکس", "فیلم و سریال", "netflix", "یوتیوب پرمیوم", "4k"],
  },
  {
    title: "موسیقی و صدا",
    icon: "🎵",
    tags: ["اسپاتیفای", "موزیک", "spotify", "پرمیوم موزیک", "فمیلی"],
  },
  {
    title: "وی‌پی‌ان و امنیت",
    icon: "🛡️",
    tags: ["وی پی ان", "vpn", "اینترنت آزاد", "آی پی ثابت"],
  },
  {
    title: "گیمینگ و استیم",
    icon: "🎮",
    tags: ["گیمینگ", "استیم", "پلی استیشن", "اکانت بازی"],
  },
  {
    title: "ضمانت و تحویل فوری",
    icon: "✨",
    tags: ["اشتراک قانونی", "تحویل فوری", "ضمانت بازگشت وجه"],
  },
];

export default function AdminTagsPage() {
  const { products, refreshFromBackend } = useStore();

  const [tagsList, setTagsList] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReindexing, setIsReindexing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"count_desc" | "count_asc" | "alpha">("count_desc");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagSelectedProducts, setNewTagSelectedProducts] = useState<string[]>([]);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  const [renameModalData, setRenameModalData] = useState<{ oldTag: string; newTag: string } | null>(null);
  const [isSubmittingRename, setIsSubmittingRename] = useState(false);

  const [deleteModalTag, setDeleteModalTag] = useState<string | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  const [assignModalTag, setAssignModalTag] = useState<TagItem | null>(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignSelectedIds, setAssignSelectedIds] = useState<string[]>([]);
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAllTags();
      if (Array.isArray(data)) {
        setTagsList(data);
      }
    } catch (err: any) {
      console.warn("Failed to fetch tags:", err);
      // Fallback: calculate from products in store
      const map = new Map<string, { name: string; count: number; sampleProducts: { id: string; title: string }[] }>();
      products.forEach((p) => {
        (p.tags || []).forEach((t) => {
          const clean = t.trim();
          if (!clean) return;
          if (!map.has(clean)) {
            map.set(clean, { name: clean, count: 0, sampleProducts: [] });
          }
          const item = map.get(clean)!;
          item.count++;
          if (item.sampleProducts.length < 5) {
            item.sampleProducts.push({ id: p.id, title: p.customTitle || p.name });
          }
        });
      });
      setTagsList(Array.from(map.values()).sort((a, b) => b.count - a.count));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [products]);

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      await api.reindexSearch();
      await fetchTags();
      await refreshFromBackend();
      showToast("موتور جستجوی الستیک با موفقیت مجدداً ایندکس‌سازی شد.");
    } catch (err: any) {
      showToast("خطا در ایندکس‌سازی مجدد", "error");
    } finally {
      setIsReindexing(false);
    }
  };

  const tagSchema = z.object({
    tagName: z.string().min(2, "نام برچسب باید حداقل ۲ کاراکتر باشد").max(50, "نام برچسب طولانی است"),
  });

  // Add Tag
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = tagSchema.safeParse({ tagName: newTagName.trim() });
    if (!val.success) {
      showToast(val.error.issues[0].message, "error");
      return;
    }

    setIsSubmittingAdd(true);
    try {
      await api.createTag({
        tag: val.data.tagName,
        productIds: newTagSelectedProducts,
      });
      showToast(`برچسب «${val.data.tagName}» با موفقیت اضافه شد.`);
      setIsAddModalOpen(false);
      setNewTagName("");
      setNewTagSelectedProducts([]);
      await fetchTags();
      await refreshFromBackend();
    } catch (err: any) {
      showToast(err.message || "خطا در ایجاد برچسب", "error");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Rename Tag
  const handleRenameTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameModalData) return;
    const val = tagSchema.safeParse({ tagName: renameModalData.newTag.trim() });
    if (!val.success) {
      showToast(val.error.issues[0].message, "error");
      return;
    }

    setIsSubmittingRename(true);
    try {
      await api.renameTag({
        oldTag: renameModalData.oldTag,
        newTag: val.data.tagName,
      });
      showToast(`برچسب «${renameModalData.oldTag}» به «${val.data.tagName}» تغییر نام یافت.`);
      setRenameModalData(null);
      await fetchTags();
      await refreshFromBackend();
    } catch (err: any) {
      showToast(err.message || "خطا در تغییر نام برچسب", "error");
    } finally {
      setIsSubmittingRename(false);
    }
  };

  // Delete Tag
  const handleDeleteTag = async () => {
    if (!deleteModalTag) return;

    setIsSubmittingDelete(true);
    try {
      await api.deleteTag(deleteModalTag);
      showToast(`برچسب «${deleteModalTag}» با موفقیت از تمامی محصولات حذف شد.`);
      setDeleteModalTag(null);
      await fetchTags();
      await refreshFromBackend();
    } catch (err: any) {
      showToast(err.message || "خطا در حذف برچسب", "error");
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // Open Assign Modal
  const handleOpenAssign = (tagItem: TagItem) => {
    setAssignModalTag(tagItem);
    setAssignSearch("");
    // Pre-select products that have this tag
    const matchingIds = products
      .filter((p) => (p.tags || []).includes(tagItem.name))
      .map((p) => p.id);
    setAssignSelectedIds(matchingIds);
  };

  // Submit Assign
  const handleSaveAssign = async () => {
    if (!assignModalTag) return;

    setIsSubmittingAssign(true);
    try {
      // Find what to add and what to remove
      const currentAttachedIds = products
        .filter((p) => (p.tags || []).includes(assignModalTag.name))
        .map((p) => p.id);

      const toAdd = assignSelectedIds.filter((id) => !currentAttachedIds.includes(id));
      const toRemove = currentAttachedIds.filter((id) => !assignSelectedIds.includes(id));

      if (toAdd.length > 0) {
        await api.assignTag({
          tag: assignModalTag.name,
          productIds: toAdd,
          action: "add",
        });
      }

      if (toRemove.length > 0) {
        await api.assignTag({
          tag: assignModalTag.name,
          productIds: toRemove,
          action: "remove",
        });
      }

      showToast(`تخصیص برچسب «${assignModalTag.name}» با موفقیت بروزرسانی گردید.`);
      setAssignModalTag(null);
      await fetchTags();
      await refreshFromBackend();
    } catch (err: any) {
      showToast(err.message || "خطا در تخصیص برچسب", "error");
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Quick Preset Click
  const handleApplyPresetCluster = (clusterTags: string[]) => {
    setNewTagName(clusterTags.join(", "));
    setIsAddModalOpen(true);
  };

  // Filter and Sort
  const filteredTags = useMemo(() => {
    const list = tagsList.filter((t) =>
      t.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    if (sortBy === "count_desc") {
      list.sort((a, b) => b.count - a.count);
    } else if (sortBy === "count_asc") {
      list.sort((a, b) => a.count - b.count);
    } else if (sortBy === "alpha") {
      list.sort((a, b) => a.name.localeCompare(b.name, "fa"));
    }

    return list;
  }, [tagsList, searchQuery, sortBy]);

  // Statistics
  const totalTagsCount = tagsList.length;
  const taggedProductsCount = products.filter((p) => p.tags && p.tags.length > 0).length;
  const untaggedProductsCount = products.length - taggedProductsCount;
  const topTag = tagsList[0]?.name || "—";

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 left-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold transition-all transform translate-y-0 ${
            toast.type === "success"
              ? "bg-teal-900 text-white border border-teal-700"
              : "bg-rose-900 text-white border border-rose-700"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 text-teal-300" /> : <AlertCircle className="w-4 h-4 text-rose-300" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-6 rounded-3xl border border-brand-border dark:border-slate-800 shadow-card">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-2xs">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>مدیریت برچسب‌ها و تگ‌های هوشمند (Smart Tags)</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                مدیریت کلمات کلیدی، تقویت رتبه‌بندی جستجوی زنده الستیک و اتصال کالاهای مرتبط
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleReindex}
            disabled={isReindexing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
            title="به‌روزرسانی ایندکس حافظه موتور جستجو"
          >
            <RefreshCw className={`w-4 h-4 ${isReindexing ? "animate-spin" : ""}`} />
            <span>{isReindexing ? "در حال ایندکس‌سازی..." : "ایندکس مجدد سرچ"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setNewTagName("");
              setNewTagSelectedProducts([]);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن برچسب جدید</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-5 rounded-2xl border border-brand-border dark:border-slate-800/80 shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-400/40 dark:hover:border-teal-400/30 hover:-translate-y-1.5 transition-all duration-300 space-y-1">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-teal-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">کل تگ‌های یکتا</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Hash className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {formatNumber(totalTagsCount)}
          </div>
          <p className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">برچسب فعال در دیتابیس</p>
        </div>

        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-5 rounded-2xl border border-brand-border dark:border-slate-800/80 shadow-card hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-400/40 dark:hover:border-emerald-400/30 hover:-translate-y-1.5 transition-all duration-300 space-y-1">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">محصولات تگ‌دار</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatNumber(taggedProductsCount)}
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">از کل {formatNumber(products.length)} کالا</p>
        </div>

        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-5 rounded-2xl border border-brand-border dark:border-slate-800/80 shadow-card hover:shadow-xl hover:shadow-amber-500/5 hover:border-amber-400/40 dark:hover:border-amber-400/30 hover:-translate-y-1.5 transition-all duration-300 space-y-1">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">محصولات بدون تگ</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {formatNumber(untaggedProductsCount)}
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">نیازمند برچسب‌گذاری</p>
        </div>

        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-5 rounded-2xl border border-brand-border dark:border-slate-800/80 shadow-card hover:shadow-xl hover:shadow-purple-500/5 hover:border-purple-400/40 dark:hover:border-purple-400/30 hover:-translate-y-1.5 transition-all duration-300 space-y-1">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">پرکاربردترین تگ</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white truncate">
            {topTag}
          </div>
          <p className="text-[11px] text-purple-700 dark:text-purple-400 font-medium">با بیشترین اشتراک کالاها</p>
        </div>
      </div>

      {/* Preset Tag Clusters */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-5 rounded-3xl border border-brand-border dark:border-slate-800 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>دسته‌های کلیدی و بسته‌های پیشنهادی تگ (تخصیص سریع گروهی):</span>
          </div>
          <span className="text-[11px] text-slate-400">کلیک روی هر بسته برای افزودن یا مشاهده تگ‌ها</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {PRESET_CLUSTERS.map((cluster, idx) => (
            <div
              key={idx}
              onClick={() => handleApplyPresetCluster(cluster.tags)}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-teal-500 dark:hover:border-teal-400 hover:shadow-md hover:-translate-y-0.5 active:scale-98 cursor-pointer transition-all duration-200 space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{cluster.icon}</span>
                  <span>{cluster.title}</span>
                </span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 opacity-0 group-hover:opacity-100 font-bold transition-opacity">
                  + افزودن
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {cluster.tags.slice(0, 3).map((t, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 group-hover:border-teal-300 dark:group-hover:border-teal-700 transition-colors"
                  >
                    #{t}
                  </span>
                ))}
                {cluster.tags.length > 3 && (
                  <span className="text-[10px] text-slate-400 self-center">
                    +{cluster.tags.length - 3}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-4 rounded-2xl border border-brand-border dark:border-slate-800 shadow-card">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی عنوان برچسب یا کلمه کلیدی..."
            className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>مرتب‌سازی:</span>
          </span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none transition-all duration-200"
          >
            <option value="count_desc">بیشترین کالاها (نزولی)</option>
            <option value="count_asc">کمترین کالاها (صعودی)</option>
            <option value="alpha">حروف الفبا (الف - ی)</option>
          </select>
        </div>
      </div>

      {/* Tags Grid */}
      {isLoading ? (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs rounded-3xl p-16 text-center border border-brand-border dark:border-slate-800 shadow-card space-y-3">
          <RefreshCw className="w-8 h-8 text-teal-600 dark:text-teal-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">در حال دریافت و ساخت ساختار برچسب‌ها...</p>
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs rounded-3xl p-16 text-center border border-brand-border dark:border-slate-800 shadow-card space-y-3">
          <Tag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-white">هیچ برچسبی یافت نشد</h3>
          <p className="text-xs text-slate-500">
            {searchQuery ? "عبارت دیگری را جستجو کنید یا با دکمه بالا برچسب جدید بسازید." : "تاکنون برچسبی در سیستم ثبت نشده است."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTags.map((item, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-brand-border dark:border-slate-800/80 rounded-3xl p-5 shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-400/40 dark:hover:border-teal-400/30 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between gap-4"
            >
              <div className="absolute -top-10 -right-10 w-20 h-20 bg-teal-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-2xs">
                      #
                    </span>
                    <span className="font-black text-sm text-slate-900 dark:text-white break-all group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {item.name}
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80 shrink-0 font-mono shadow-2xs group-hover:bg-teal-100 dark:group-hover:bg-teal-900/40 transition-colors">
                    {formatNumber(item.count)} محصول
                  </span>
                </div>

                {/* Sample Products */}
                <div className="mt-3 space-y-1.5">
                  <span className="text-[11px] text-slate-400 block font-medium">نمونه کالاهای دارای این برچسب:</span>
                  {item.sampleProducts && item.sampleProducts.length > 0 ? (
                    <div className="space-y-1">
                      {item.sampleProducts.slice(0, 3).map((sp) => (
                        <div
                          key={sp.id}
                          className="text-xs text-slate-700 dark:text-slate-300 truncate flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                          <span className="truncate">{sp.title}</span>
                        </div>
                      ))}
                      {item.count > 3 && (
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold block pt-0.5">
                          و {formatNumber(item.count - 3)} محصول دیگر...
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">بدون محصول متصل</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRenameModalData({ oldTag: item.name, newTag: item.name })}
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition-all duration-150 hover:scale-110 active:scale-95"
                    title="ویرایش نام برچسب در تمام محصولات"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteModalTag(item.name)}
                    className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all duration-150 hover:scale-110 active:scale-95"
                    title="حذف این برچسب از تمامی محصولات"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAssign(item)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-800 text-xs font-bold transition-all duration-150 hover:scale-105 active:scale-95 shadow-2xs"
                >
                  <Boxes className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>تخصیص کالاها</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW TAG                                                      */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-brand-border dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-brand-primary dark:text-teal-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">افزودن برچسب یا کلمات کلیدی جدید</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان برچسب (می‌توانید چند برچسب را با کاما جدا کنید):
                </label>
                <input
                  type="text"
                  required
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="مثال: تلگرام پرمیوم, استارز, تحویل فوری"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white rounded-xl py-2.5 px-3 outline-none focus:border-brand-primary"
                />
              </div>

              {/* Suggestions Quick Chips */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">پیشنهادهای سریع:</span>
                <div className="flex flex-wrap gap-1.5">
                  {["هوش مصنوعی", "چت جی‌پی‌تی", "تلگرام پرمیوم", "استارز", "اسپاتیفای", "نتفلیکس", "وی پی ان", "استیم", "اشتراک قانونی"].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (!newTagName) setNewTagName(chip);
                        else setNewTagName(newTagName + ", " + chip);
                      }}
                      className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-brand-primary text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      +{chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select products to assign */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  تخصیص اولیه به محصولات (اختیاری - {formatNumber(newTagSelectedProducts.length)} انتخاب شده):
                </label>
                <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 divide-y divide-slate-100 dark:divide-slate-800">
                  {products.slice(0, 30).map((p) => {
                    const isChecked = newTagSelectedProducts.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className="py-1.5 px-2 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded cursor-pointer"
                      >
                        <span className="truncate text-slate-800 dark:text-slate-200">{p.customTitle || p.name}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setNewTagSelectedProducts(newTagSelectedProducts.filter((id) => id !== p.id));
                            } else {
                              setNewTagSelectedProducts([...newTagSelectedProducts, p.id]);
                            }
                          }}
                          className="accent-teal-600 rounded"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmittingAdd ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>ثبت و ایجاد برچسب</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RENAME TAG                                                       */}
      {/* ========================================================================= */}
      {renameModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-brand-border dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-brand-primary dark:text-teal-400 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">ویرایش عنوان برچسب</h3>
              </div>
              <button
                onClick={() => setRenameModalData(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenameTag} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  نام فعلی برچسب:
                </label>
                <input
                  type="text"
                  disabled
                  value={renameModalData.oldTag}
                  className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 rounded-xl py-2.5 px-3"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  نام جدید برچسب:
                </label>
                <input
                  type="text"
                  required
                  value={renameModalData.newTag}
                  onChange={(e) => setRenameModalData({ ...renameModalData, newTag: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white rounded-xl py-2.5 px-3 outline-none focus:border-brand-primary"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 text-[11px] text-teal-800 dark:text-teal-300 leading-relaxed">
                توجه: این تغییر بلافاصله در تمامی محصولات دارای این برچسب و موتور جستجوی الستیک اعمال خواهد شد.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameModalData(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRename}
                  className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmittingRename ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>ذخیره نام جدید</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION                                              */}
      {/* ========================================================================= */}
      {deleteModalTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-rose-200 dark:border-rose-900/50 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                آیا از حذف برچسب «{deleteModalTag}» اطمینان دارید؟
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                با حذف این برچسب، تگ مربوطه از تمامی محصولات متصل به آن حذف شده و در موتور جستجو دیگر پیشنهاد نخواهد شد.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalTag(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleDeleteTag}
                disabled={isSubmittingDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-900/10 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingDelete ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>حذف قطعی برچسب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ASSIGN TAG TO PRODUCTS                                           */}
      {/* ========================================================================= */}
      {assignModalTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-brand-border dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-brand-primary dark:text-teal-400 flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    تخصیص کالاها به برچسب «{assignModalTag.name}»
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    تعداد کالاهای انتخاب شده: {formatNumber(assignSelectedIds.length)} عدد
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignModalTag(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Search */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                placeholder="جستجو در نام محصولات برای تخصیص یا لغو تخصیص..."
                className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-primary"
              />
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2">
              {products
                .filter((p) =>
                  p.customTitle?.toLowerCase().includes(assignSearch.toLowerCase()) ||
                  p.name?.toLowerCase().includes(assignSearch.toLowerCase())
                )
                .slice(0, 100)
                .map((p) => {
                  const isChecked = assignSelectedIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className="py-2.5 px-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate pl-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {p.customTitle || p.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          #{p.externalId}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setAssignSelectedIds(assignSelectedIds.filter((id) => id !== p.id));
                          } else {
                            setAssignSelectedIds([...assignSelectedIds, p.id]);
                          }
                        }}
                        className="w-4 h-4 accent-teal-600 rounded shrink-0 cursor-pointer"
                      />
                    </label>
                  );
                })}
            </div>

            <div className="pt-2 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500">
                <span>{formatNumber(assignSelectedIds.length)} کالا دارای این تگ خواهند بود.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalTag(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssign}
                  disabled={isSubmittingAssign}
                  className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmittingAssign ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>ذخیره تغییرات تخصیص</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
