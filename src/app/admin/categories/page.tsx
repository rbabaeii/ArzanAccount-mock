"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { formatNumber } from "@/lib/format";
import { Category } from "@/types";
import Pagination from "@/components/ui/Pagination";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FolderTree,
  Plus,
  Trash2,
  Edit3,
  X,
  Save,
  Bot,
  Film,
  Headphones,
  Share2,
  Sparkles,
  CheckCircle2,
  Search,
} from "lucide-react";

const categorySchema = z.object({
  title: z.string().min(2, "نام دسته‌بندی باید حداقل ۲ کاراکتر باشد"),
  slug: z
    .string()
    .min(2, "نامک باید حداقل ۲ کاراکتر باشد")
    .regex(/^[a-z0-9-]+$/, "نامک فقط می‌تواند شامل حروف کوچک انگلیسی، اعداد و خط تیره باشد"),
  description: z.string().optional(),
  icon: z.string().min(1, "آیکون را انتخاب کنید"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function AdminCategoriesPage() {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useStore();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form setups
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { title: "", slug: "", description: "", icon: "Bot" },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  // Editing state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Search, Sort and Pagination state
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"order" | "title" | "count">("order");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          cat.title.toLowerCase().includes(q) ||
          cat.slug.toLowerCase().includes(q) ||
          cat.description?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "title") return a.title.localeCompare(b.title, "fa");
        if (sortBy === "count") {
          const countA = products.filter((p) => p.categoryId === a.id).length;
          const countB = products.filter((p) => p.categoryId === b.id).length;
          return countB - countA;
        }
        return a.orderIndex - b.orderIndex;
      });
  }, [categories, products, search, sortBy]);

  const totalPages = Math.ceil(filteredCategories.length / pageSize);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const onSubmitCreate = (data: CategoryFormValues) => {
    addCategory({
      title: data.title.trim(),
      slug: data.slug.trim().toLowerCase(),
      description: data.description?.trim(),
      icon: data.icon,
      orderIndex: categories.length + 1,
    });

    resetCreate();
    setToastMessage("دسته‌بندی جدید با موفقیت اضافه شد!");
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    resetEdit({
      title: cat.title,
      slug: cat.slug,
      description: cat.description || "",
      icon: cat.icon || "Bot",
    });
  };

  const onSubmitEdit = async (data: CategoryFormValues) => {
    if (!editingCategory) return;

    setIsUpdating(true);
    try {
      await updateCategory(editingCategory.id, {
        title: data.title.trim(),
        slug: data.slug.trim().toLowerCase(),
        description: data.description?.trim(),
        icon: data.icon,
      });
      setEditingCategory(null);
      setToastMessage("تغییرات دسته‌بندی با موفقیت ذخیره شد!");
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error("Error updating category:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Bot":
        return <Bot className="w-4 h-4" />;
      case "Film":
        return <Film className="w-4 h-4" />;
      case "Headphones":
        return <Headphones className="w-4 h-4" />;
      case "Share2":
        return <Share2 className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-admin-text dark:text-white flex items-center gap-2">
          <FolderTree className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          مدیریت دسته‌بندی‌ها
        </h1>
        <p className="text-xs text-admin-textMuted dark:text-slate-400 mt-1">
          تعریف و ویرایش مشخصات دسته‌بندی‌های فروشگاه و تخصیص محصولات irMarket به آن‌ها
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Create Category Form (5 cols) */}
        <div className="lg:col-span-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-6 shadow-card hover:shadow-xl hover:border-teal-400/40 dark:hover:border-teal-400/30 transition-all duration-300">
          <h3 className="font-bold text-sm text-admin-text dark:text-white mb-4 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <span>افزودن دسته‌بندی جدید</span>
          </h3>

          <form onSubmit={handleCreateSubmit(onSubmitCreate)} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                نام فارسی دسته‌بندی:
              </label>
              <input
                type="text"
                placeholder="مثلاً: اکانت‌های آموزشی و زبان"
                {...registerCreate("title")}
                className="w-full bg-slate-50 dark:bg-slate-800/90 border border-admin-borderLight dark:border-slate-700 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-3 text-xs outline-none text-slate-800 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 transition-all"
              />
              {createErrors.title && <p className="text-rose-500 mt-1 text-[10px]">{createErrors.title.message}</p>}
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                نامک انگلیسی (Slug برای آدرس URL):
              </label>
              <input
                type="text"
                placeholder="مثلاً: learning"
                {...registerCreate("slug")}
                className="w-full bg-slate-50 dark:bg-slate-800/90 border border-admin-borderLight dark:border-slate-700 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-3 text-xs outline-none dir-ltr text-left text-slate-800 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 transition-all font-mono"
              />
              {createErrors.slug && <p className="text-rose-500 mt-1 text-[10px]">{createErrors.slug.message}</p>}
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                آیکون دسته‌بندی:
              </label>
              <select
                {...registerCreate("icon")}
                className="w-full bg-slate-50 dark:bg-slate-800/90 border border-admin-borderLight dark:border-slate-700 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-3 text-xs outline-none text-slate-800 dark:text-slate-100 transition-all"
              >
                <option value="Bot">هوش مصنوعی (Bot)</option>
                <option value="Film">فیلم و استریم (Film)</option>
                <option value="Headphones">موسیقی (Headphones)</option>
                <option value="Share2">شبکه‌های اجتماعی (Share2)</option>
                <option value="Sparkles">ابزارهای دیجیتال (Sparkles)</option>
              </select>
              {createErrors.icon && <p className="text-rose-500 mt-1 text-[10px]">{createErrors.icon.message}</p>}
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                توضیحات مختصر:
              </label>
              <textarea
                rows={3}
                placeholder="توضیح کوتاه درباره محصولات این شاخه..."
                {...registerCreate("description")}
                className="w-full bg-slate-50 dark:bg-slate-800/90 border border-admin-borderLight dark:border-slate-700 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2 px-3 text-xs outline-none resize-none text-slate-800 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 transition-all leading-relaxed"
              />
              {createErrors.description && <p className="text-rose-500 mt-1 text-[10px]">{createErrors.description.message}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-md hover:shadow-lg hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت دسته‌بندی جدید</span>
            </button>

            {toastMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800/60 animate-fadeIn shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{toastMessage}</span>
              </div>
            )}
          </form>
        </div>

        {/* Existing Categories List (7 cols) */}
        <div className="lg:col-span-7 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-6 shadow-card hover:shadow-lg transition-all duration-300 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-admin-borderLight dark:border-slate-800">
            <h3 className="font-bold text-sm text-admin-text dark:text-white flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>دسته‌بندی‌های فعال ({formatNumber(categories.length)})</span>
            </h3>

            {/* Quick Search & Sort */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="جستجو در دسته‌ها..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 rounded-lg py-1.5 pr-7 pl-2 text-xs outline-none text-slate-800 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 w-36 sm:w-44"
                />
                <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-slate-500 absolute right-2 top-1/2 -translate-y-1/2" />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 rounded-lg py-1.5 px-2 text-xs outline-none text-slate-800 dark:text-slate-100"
              >
                <option value="order">ترتیب اولویت</option>
                <option value="title">بر اساس نام</option>
                <option value="count">بیشترین محصول</option>
              </select>
            </div>
          </div>

          {filteredCategories.length > 0 ? (
            <div className="space-y-4">
              <div className="divide-y divide-admin-borderLight dark:divide-slate-800">
                {paginatedCategories.map((cat) => {
                  const productCount = products.filter((p) => p.categoryId === cat.id).length;
                  const activeCount = products.filter((p) => p.categoryId === cat.id && p.isActive).length;

                  return (
                    <div
                      key={cat.id}
                      className="py-3 px-3 rounded-xl flex items-center justify-between gap-4 group hover:bg-teal-50/50 dark:hover:bg-slate-800/60 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-800/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-2xs">
                          {getCategoryIcon(cat.icon)}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-2">
                            <span className="group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{cat.title}</span>
                            <span className="text-[10px] text-neutral-400 dark:text-slate-500 font-mono bg-neutral-100 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-neutral-200 dark:border-slate-700">
                              /{cat.slug}
                            </span>
                          </h4>
                          <p className="text-[11px] text-neutral-500 dark:text-slate-400 mt-0.5 max-w-sm line-clamp-1">
                            {cat.description || "بدون توضیحات"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="text-left text-[11px]">
                          <span className="font-bold text-teal-600 dark:text-teal-400 block font-mono">
                            {formatNumber(activeCount)} فعال
                          </span>
                          <span className="text-neutral-400 dark:text-slate-500 text-[10px] font-mono">
                            از {formatNumber(productCount)} محصول
                          </span>
                        </div>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-2 text-neutral-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-lg transition-all duration-150 hover:scale-110 active:scale-95"
                          title="ویرایش دسته‌بندی"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all duration-150 hover:scale-110 active:scale-95"
                          title="حذف دسته‌بندی"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredCategories.length}
                itemsPerPage={pageSize}
                itemName="دسته‌بندی"
                onPageChange={(p) => setCurrentPage(p)}
                className="border-t border-admin-borderLight dark:border-slate-800 pt-4"
              />
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-xs text-neutral-500 dark:text-slate-400">
                دسته‌بندی با این عنوان یافت نشد.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-admin-border dark:border-slate-800 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-admin-borderLight dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-admin-text dark:text-white">ویرایش دسته‌بندی</h3>
                  <span className="text-[10px] text-neutral-400 font-mono">/{editingCategory.slug}</span>
                </div>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white transition-all duration-150 hover:scale-110 active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit(onSubmitEdit)} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                  نام فارسی دسته‌بندی:
                </label>
                <input
                  type="text"
                  {...registerEdit("title")}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2 px-3 text-xs outline-none text-slate-800 dark:text-slate-100 transition-all font-bold"
                />
                {editErrors.title && <p className="text-rose-500 mt-1 text-[10px]">{editErrors.title.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                  نامک انگلیسی (Slug):
                </label>
                <input
                  type="text"
                  {...registerEdit("slug")}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2 px-3 text-xs outline-none dir-ltr text-left font-mono text-slate-800 dark:text-slate-100 transition-all"
                />
                {editErrors.slug && <p className="text-rose-500 mt-1 text-[10px]">{editErrors.slug.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                  آیکون:
                </label>
                <select
                  {...registerEdit("icon")}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2 px-3 text-xs outline-none text-slate-800 dark:text-slate-100 transition-all"
                >
                  <option value="Bot">هوش مصنوعی (Bot)</option>
                  <option value="Film">فیلم و استریم (Film)</option>
                  <option value="Headphones">موسیقی (Headphones)</option>
                  <option value="Share2">شبکه‌های اجتماعی (Share2)</option>
                  <option value="Sparkles">ابزارهای دیجیتال (Sparkles)</option>
                </select>
                {editErrors.icon && <p className="text-rose-500 mt-1 text-[10px]">{editErrors.icon.message}</p>}
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                  توضیحات:
                </label>
                <textarea
                  rows={3}
                  {...registerEdit("description")}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2 px-3 text-xs outline-none resize-none text-slate-800 dark:text-slate-100 transition-all leading-relaxed"
                />
                {editErrors.description && <p className="text-rose-500 mt-1 text-[10px]">{editErrors.description.message}</p>}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-md hover:shadow-lg hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isUpdating ? "در حال ذخیره..." : "ذخیره تغییرات"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all duration-150"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
