"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { Product } from "@/types";
import {
  Search,
  X,
  Edit2,
  ExternalLink,
  Save,
  CheckCircle2,
  Coins,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Flame,
  Star,
  Info,
  Package,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  Plus,
  Tag,
  Hash,
  Layers,
  Check,
  Lock,
  Mail,
  Key,
  Zap,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import ImageUploader from "@/components/ui/ImageUploader";
import Pagination from "@/components/ui/Pagination";
import { formatPrice, formatNumber } from "@/lib/format";
import { z } from "zod";

const productSchema = z.object({
  editTitle: z.string().min(2, "عنوان محصول باید حداقل ۲ کاراکتر باشد").max(120, "عنوان بسیار طولانی است"),
  editCategoryId: z.string().min(1, "انتخاب دسته‌بندی الزامی است"),
  editCostPriceUsd: z.number().min(0, "قیمت خرید نمی‌تواند منفی باشد"),
  editRetailPriceUsd: z.number().min(0, "قیمت بازار نمی‌تواند منفی باشد"),
  editMargin: z.number().min(0, "حاشیه سود نمی‌تواند منفی باشد"),
  editMinQty: z.number().min(1, "حداقل تعداد باید ۱ یا بیشتر باشد"),
  editMaxQty: z.number().min(1, "حداکثر تعداد باید ۱ یا بیشتر باشد"),
  editStockCount: z.number().min(0, "موجودی نمی‌تواند منفی باشد"),
  editSalePriceToman: z.string().optional().refine(val => !val || Number(val) > 0, "قیمت فروش باید بیشتر از صفر باشد"),
  editDiscountPercent: z.string().optional().refine(val => !val || (Number(val) > 0 && Number(val) <= 100), "درصد تخفیف باید بین ۱ تا ۱۰۰ باشد"),
}).refine((data) => data.editMinQty <= data.editMaxQty, {
  message: "حداقل تعداد نمی‌تواند بیشتر از حداکثر تعداد باشد",
  path: ["editMaxQty"],
});

export default function AdminProductsPage() {
  const {
    products,
    categories,
    settings,
    createProduct,
    toggleProductActive,
    updateProduct,
    calculateProductPrice,
  } = useStore();

  const [search, setSearch] = useState("");

  const searchParams = useSearchParams();

  useEffect(() => {
    const s = searchParams.get("search");
    if (s !== null) {
      setSearch(s);
      setCurrentPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setItemsPerPage(10);
    }
  }, []);

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [stockFilter, setStockFilter] = useState<"all" | "out_of_stock" | "in_stock">("all");
  const [requirementFilter, setRequirementFilter] = useState<"all" | "credentials" | "email" | "password" | "link" | "instant">("all");
  const [sortBy, setSortBy] = useState<"default" | "stock_asc" | "stock_desc" | "price_asc" | "price_desc" | "margin_desc">("default");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<
    "general" | "pricing" | "tags" | "media" | "requirements" | "visibility"
  >("general");
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInputText, setTagInputText] = useState("");

  // Editable fields state
  const [editTitle, setEditTitle] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPersianDescription, setEditPersianDescription] = useState("");
  const [editBadge, setEditBadge] = useState("");

  const [editCostPriceUsd, setEditCostPriceUsd] = useState<number>(0);
  const [editRetailPriceUsd, setEditRetailPriceUsd] = useState<number>(0);
  const [editMargin, setEditMargin] = useState<number>(15);
  const [editSalePriceToman, setEditSalePriceToman] = useState<string>("");
  const [editDiscountPercent, setEditDiscountPercent] = useState<string>("");

  const [editImage, setEditImage] = useState("");

  const [editRequiresEmail, setEditRequiresEmail] = useState(false);
  const [editRequiresPassword, setEditRequiresPassword] = useState(false);
  const [editRequiresLink, setEditRequiresLink] = useState(false);
  const [editRequiresComments, setEditRequiresComments] = useState(false);
  const [editPricingUnit, setEditPricingUnit] = useState<"unit" | "per_1000">("unit");
  const [editMinQty, setEditMinQty] = useState(1);
  const [editMaxQty, setEditMaxQty] = useState(1);
  const [editStockCount, setEditStockCount] = useState(100);
  const [editInStock, setEditInStock] = useState(true);

  const [editIsActive, setEditIsActive] = useState(false);
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editIsFlashDeal, setEditIsFlashDeal] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});


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
      title: "موسیقی و اسپاتیفای",
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

  const allExistingTags = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      (p.tags || []).forEach((t) => {
        if (t && t.trim()) set.add(t.trim());
      });
    });
    return Array.from(set);
  }, [products]);

  const handleAddTag = (tagToAdd?: string) => {
    const raw = tagToAdd || tagInputText;
    if (!raw.trim()) return;
    const parts = raw.split(",").map((t) => t.trim()).filter(Boolean);
    const updated = Array.from(new Set([...editTags, ...parts]));
    setEditTags(updated);
    setTagInputText("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter((t) => t !== tagToRemove));
  };

  const handleAddPresetCluster = (clusterTags: string[]) => {
    const updated = Array.from(new Set([...editTags, ...clusterTags]));
    setEditTags(updated);
  };

  const handleOpenCreate = () => {
    setIsCreatingProduct(true);
    setEditingProduct({
      id: "",
      externalId: 0,
      name: "",
      customTitle: "",
      costPriceUsd: 5.0,
      retailPriceUsd: 7.0,
      pricingUnit: "unit",
      stockCount: 100,
      inStock: true,
      rating: 5,
      reviewCount: 12,
      isActive: true,
      isFeatured: false,
      isFlashDeal: false,
      categoryId: categories[0]?.id || "",
      description: "",
      persianDescription: "",
      tags: [],
    } as any);
    setActiveTab("general");

    setEditTitle("");
    setEditCategoryId(categories[0]?.id ?? "");
    setEditDescription("");
    setEditPersianDescription("");
    setEditBadge("");

    setEditCostPriceUsd(5.0);
    setEditRetailPriceUsd(7.0);
    setEditMargin(settings.defaultMarginPercent || 15);
    setEditSalePriceToman("");
    setEditDiscountPercent("");

    setEditImage("");

    setEditRequiresEmail(false);
    setEditRequiresPassword(false);
    setEditRequiresLink(false);
    setEditRequiresComments(false);
    setEditPricingUnit("unit");
    setEditMinQty(1);
    setEditMaxQty(1);
    setEditStockCount(100);
    setEditInStock(true);

    setEditIsActive(true);
    setEditIsFeatured(false);
    setEditIsFlashDeal(false);

    setEditTags([]);
    setTagInputText("");
    setValidationErrors({});
  };

  // Open Edit Modal
  const handleOpenEdit = (product: Product) => {
    setIsCreatingProduct(false);
    setEditTags(product.tags ? [...product.tags] : []);
    setTagInputText("");
    setEditingProduct(product);
    setActiveTab("general");

    setEditTitle(product.customTitle || product.name);
    setEditCategoryId(product.categoryId || (categories[0]?.id ?? ""));
    setEditDescription(product.description || "");
    setEditPersianDescription(product.persianDescription || "");
    setEditBadge(product.badge || "");

    setEditCostPriceUsd(product.costPriceUsd || 0);
    setEditRetailPriceUsd(product.retailPriceUsd ?? product.costPriceUsd ?? 0);
    setEditMargin(product.customMarginPercent ?? settings.defaultMarginPercent);
    setEditSalePriceToman(product.salePriceToman ? String(product.salePriceToman) : "");
    setEditDiscountPercent(product.discountPercent ? String(product.discountPercent) : "");

    setEditImage(product.image || "");

    setEditRequiresEmail(Boolean(product.requiresEmail));
    setEditRequiresPassword(Boolean((product as any).requiresPassword));
    setEditRequiresLink(Boolean(product.requiresLink));
    setEditRequiresComments(Boolean(product.requiresComments));
    setEditPricingUnit(product.pricingUnit === "per_1000" ? "per_1000" : "unit");
    setEditMinQty(product.minQty ?? 1);
    setEditMaxQty(product.maxQty ?? 1);
    setEditStockCount(product.stockCount ?? 100);
    setEditInStock(product.inStock !== false);

    setEditIsActive(Boolean(product.isActive));
    setEditIsFeatured(Boolean(product.isFeatured));
    setEditIsFlashDeal(Boolean(product.isFlashDeal));
    setValidationErrors({});
  };

  // Save Modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const validationResult = productSchema.safeParse({
      editTitle, editCategoryId, editCostPriceUsd, editRetailPriceUsd,
      editMargin, editMinQty, editMaxQty, editStockCount,
      editSalePriceToman, editDiscountPercent
    });

    if (!validationResult.success) {
      const errs: Record<string, string> = {};
      validationResult.error.issues.forEach((err: z.ZodIssue) => {
        if (err.path[0]) errs[err.path[0] as string] = err.message;
      });
      setValidationErrors(errs);
      setToastMessage("لطفاً خطاهای فرم را برطرف کنید.");
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    setValidationErrors({});

    setIsSaving(true);
    try {
      await updateProduct(editingProduct.id, {
        customTitle: editTitle,
        categoryId: editCategoryId,
        description: editDescription.replace(/<[^>]*>?/gm, '').trim(),
        persianDescription: editPersianDescription.replace(/<[^>]*>?/gm, '').trim(),
        badge: editBadge.trim(),
        costPriceUsd: editCostPriceUsd,
        retailPriceUsd: editRetailPriceUsd,
        customMarginPercent: editMargin,
        salePriceToman: editSalePriceToman && Number(editSalePriceToman) > 0 ? Number(editSalePriceToman) : null,
        discountPercent: editDiscountPercent && Number(editDiscountPercent) > 0 ? Number(editDiscountPercent) : null,
        image: editImage,
        requiresEmail: editRequiresEmail,
        requiresPassword: editRequiresPassword,
        requiresLink: editRequiresLink,
        requiresComments: editRequiresComments,
        pricingUnit: editPricingUnit,
        minQty: editMinQty,
        maxQty: editMaxQty,
        stockCount: editStockCount,
        inStock: editInStock,
        isActive: editIsActive,
        isFeatured: editIsFeatured,
        isFlashDeal: editIsFlashDeal,
      } as any);

      setToastMessage("تمامی مشخصات محصول با موفقیت ذخیره و در سایت اعمال گردید.");
      setTimeout(() => setToastMessage(null), 3500);
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter and sort products
  const filteredProducts = products.filter((p) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !searchLower ||
      (p.name && p.name.toLowerCase().includes(searchLower)) ||
      (p.customTitle && p.customTitle.toLowerCase().includes(searchLower)) ||
      (p.externalId && p.externalId.toString().includes(searchLower)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(searchLower)));

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? p.isActive
        : !p.isActive;

    const matchesCategory =
      categoryFilter === "all" ? true : p.categoryId === categoryFilter;

    const isOutOfStock = p.stockCount === 0 || p.inStock === false;
    const matchesStock =
      stockFilter === "all"
        ? true
        : stockFilter === "out_of_stock"
        ? isOutOfStock
        : !isOutOfStock;

    const matchesRequirement =
      requirementFilter === "all"
        ? true
        : requirementFilter === "credentials"
        ? Boolean(p.requiresEmail || p.requiresPassword)
        : requirementFilter === "email"
        ? Boolean(p.requiresEmail)
        : requirementFilter === "password"
        ? Boolean(p.requiresPassword)
        : requirementFilter === "link"
        ? Boolean(p.requiresLink)
        : requirementFilter === "instant"
        ? !p.requiresEmail && !p.requiresPassword && !p.requiresLink
        : true;

    return matchesSearch && matchesStatus && matchesCategory && matchesStock && matchesRequirement;
  }).sort((a, b) => {
    if (sortBy === "stock_asc") {
      const stockA = a.inStock === false ? 0 : (a.stockCount ?? 0);
      const stockB = b.inStock === false ? 0 : (b.stockCount ?? 0);
      return stockA - stockB;
    }
    if (sortBy === "stock_desc") {
      const stockA = a.inStock === false ? 0 : (a.stockCount ?? 0);
      const stockB = b.inStock === false ? 0 : (b.stockCount ?? 0);
      return stockB - stockA;
    }
    if (sortBy === "price_asc") {
      return (a.costPriceUsd ?? 0) - (b.costPriceUsd ?? 0);
    }
    if (sortBy === "price_desc") {
      return (b.costPriceUsd ?? 0) - (a.costPriceUsd ?? 0);
    }
    if (sortBy === "margin_desc") {
      const marginA = a.customMarginPercent ?? settings.defaultMarginPercent ?? 15;
      const marginB = b.customMarginPercent ?? settings.defaultMarginPercent ?? 15;
      return marginB - marginA;
    }
    return 0;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate live preview in modal with dual pricing
  const modalCostToman = Math.round((editCostPriceUsd * settings.usdToRialRate) / 10);
  const modalRetailUsd = editRetailPriceUsd > 0 ? editRetailPriceUsd : editCostPriceUsd;
  const modalPublicRetailToman = Math.round((modalRetailUsd * settings.usdToRialRate) / 10);

  const isModalCustomMarginActive = editMargin !== null && editMargin !== undefined && editMargin > 0;
  const effectiveModalMargin = isModalCustomMarginActive ? editMargin : (settings.defaultMarginPercent || 0);

  let modalFinalToman = 0;
  if (isModalCustomMarginActive || !editRetailPriceUsd || editRetailPriceUsd <= 0) {
    modalFinalToman = Math.round(modalCostToman * (1 + effectiveModalMargin / 100));
  } else {
    if (settings.defaultMarginPercent && settings.defaultMarginPercent > 0) {
      modalFinalToman = Math.round(modalCostToman * (1 + settings.defaultMarginPercent / 100));
    } else {
      modalFinalToman = modalPublicRetailToman;
    }
  }

  const modalProfitToman = Math.max(0, modalFinalToman - modalCostToman);
  const modalDiscountPercent =
    modalPublicRetailToman > modalFinalToman
      ? Math.round(((modalPublicRetailToman - modalFinalToman) / modalPublicRetailToman) * 100)
      : 0;

  const modalFormattedToman = formatPrice(modalFinalToman);
  const modalFormattedCostToman = formatPrice(modalCostToman);
  const modalFormattedPublicToman = formatPrice(modalPublicRetailToman);
  const modalFormattedProfitToman = formatPrice(modalProfitToman);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-admin-text dark:text-white">
            مدیریت کاتالوگ و محصولات
          </h1>
          <p className="text-xs text-admin-textMuted dark:text-slate-400 mt-1">
            کنترل وضعیت نمایش، انبار و موجودی، حاشیه سود و تنظیمات قیمت‌گذاری دستی محصولات
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs p-1.5 rounded-xl border border-admin-borderLight dark:border-slate-800 shadow-2xs">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
              کل: {products.length}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200/50 dark:border-emerald-800/40">
              فعال: {products.filter((p) => p.isActive).length}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 border border-rose-200/50 dark:border-rose-800/40">
              <AlertTriangle className="w-3 h-3" />
              ناموجود: {products.filter((p) => p.stockCount === 0 || !p.inStock).length}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1 border border-indigo-200/50 dark:border-indigo-800/40">
              <Lock className="w-3 h-3 text-indigo-500" />
              نیاز به اکانت: {products.filter((p) => p.requiresEmail || p.requiresPassword).length}
            </span>
          </div>

          <Link
            href="/admin/tags"
            className="group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/40 text-brand-primary dark:text-teal-300 text-xs font-bold hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-all duration-200 hover:shadow-xs active:scale-95"
          >
            <Tag className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-200" />
            <span>مدیریت برچسب‌ها</span>
          </Link>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-primary to-teal-700 hover:from-brand-primaryDark hover:to-teal-800 text-white text-xs font-bold shadow-md hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-200 active:scale-95"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
            <span>افزودن محصول جدید</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-admin-borderLight dark:border-slate-800 shadow-card hover:shadow-md transition-all duration-300 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="جستجو در نام انگلیسی، عنوان فارسی یا کد مرجع..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-admin-bg dark:bg-slate-800/80 border border-admin-borderLight dark:border-slate-700 text-xs rounded-xl py-2.5 pr-9 pl-4 outline-none text-slate-800 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:border-brand-primary dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 transition-all duration-200"
          />
          <Search className="w-4 h-4 text-neutral-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-admin-bg dark:bg-slate-800/80 p-1 rounded-xl border border-admin-borderLight dark:border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-200 active:scale-95 ${
              statusFilter === "all"
                ? "bg-white dark:bg-slate-700 text-brand-dark dark:text-white shadow-xs"
                : "text-neutral-500 dark:text-slate-400 hover:text-black dark:hover:text-white"
            }`}
          >
            همه
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("active");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-200 active:scale-95 ${
              statusFilter === "active"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-neutral-500 dark:text-slate-400 hover:text-black dark:hover:text-white"
            }`}
          >
            فقط فعال‌ها
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("inactive");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-200 active:scale-95 ${
              statusFilter === "inactive"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-neutral-500 dark:text-slate-400 hover:text-black dark:hover:text-white"
            }`}
          >
            غیرفعال‌ها
          </button>
        </div>

        {/* Stock Filter (موجودی انبار) */}
        <div className="flex items-center gap-1 bg-admin-bg dark:bg-slate-800 p-1 rounded-lg border border-admin-borderLight dark:border-slate-700 text-xs shrink-0">
          <button
            type="button"
            onClick={() => {
              setStockFilter("all");
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1.5 rounded-md font-bold transition-all ${
              stockFilter === "all"
                ? "bg-white dark:bg-slate-700 text-brand-dark dark:text-white shadow-xs"
                : "text-neutral-500 dark:text-slate-400 hover:text-black dark:hover:text-white"
            }`}
          >
            همه موجودی‌ها
          </button>
          <button
            type="button"
            onClick={() => {
              setStockFilter("out_of_stock");
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1.5 rounded-md font-bold transition-all flex items-center gap-1 ${
              stockFilter === "out_of_stock"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>فقط ناموجودها (۰)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setStockFilter("in_stock");
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1.5 rounded-md font-bold transition-all ${
              stockFilter === "in_stock"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            }`}
          >
            فقط موجودها
          </button>
        </div>

        {/* Category Select */}
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-xs rounded-lg py-2 px-3 outline-none text-neutral-700 dark:text-slate-200"
        >
          <option value="all">همه دسته‌بندی‌ها ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        {/* Requirement Filter (الزامات تحویل / اکانت و رمز) */}
        <select
          value={requirementFilter}
          onChange={(e) => {
            setRequirementFilter(e.target.value as any);
            setCurrentPage(1);
          }}
          className={`border text-xs rounded-lg py-2 px-3 outline-none font-medium transition-all ${
            requirementFilter !== "all"
              ? "border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50/70 dark:bg-indigo-950/50 shadow-2xs"
              : "bg-admin-bg dark:bg-slate-800 border-admin-borderLight dark:border-slate-700 text-neutral-700 dark:text-slate-200"
          }`}
        >
          <option value="all">همه الزامات تحویل ({products.length})</option>
          <option value="credentials">🔐 نیازمند ایمیل یا پسورد ({products.filter((p) => p.requiresEmail || p.requiresPassword).length})</option>
          <option value="email">📧 فقط نیازمند ایمیل ({products.filter((p) => p.requiresEmail).length})</option>
          <option value="password">🔑 فقط نیازمند پسورد ({products.filter((p) => p.requiresPassword).length})</option>
          <option value="link">🔗 فقط نیازمند لینک ({products.filter((p) => p.requiresLink).length})</option>
          <option value="instant">⚡ تحویل آنی / خودکار ({products.filter((p) => !p.requiresEmail && !p.requiresPassword && !p.requiresLink).length})</option>
        </select>

        {/* Sort Select */}
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as any);
            setCurrentPage(1);
          }}
          className="bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-xs rounded-lg py-2 px-3 outline-none text-neutral-700 dark:text-slate-200 font-medium"
        >
          <option value="default">مرتب‌سازی: پیش‌فرض</option>
          <option value="stock_asc">کمترین موجودی (ابتدا ناموجودها)</option>
          <option value="stock_desc">بیشترین موجودی</option>
          <option value="price_asc">ارزان‌ترین خرید تامین</option>
          <option value="price_desc">گران‌ترین خرید تامین</option>
          <option value="margin_desc">بالاترین حاشیه سود</option>
        </select>
      </div>

      {/* High Density Products Table */}
      <div className="bg-white dark:bg-slate-900 border border-admin-borderLight dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-admin-container/50 dark:bg-slate-800/80 border-b border-admin-borderLight dark:border-slate-800 text-xs font-bold text-admin-text dark:text-slate-200">
                <th className="py-3 px-4 w-16">کد مرجع</th>
                <th className="py-3 px-4">عنوان نمایشی و نام در API</th>
                <th className="py-3 px-4">دسته‌بندی</th>
                <th className="py-3 px-4 text-center">موجودی انبار</th>
                <th className="py-3 px-4">قیمت خرید (تامین)</th>
                <th className="py-3 px-4">قیمت عمومی بازار</th>
                <th className="py-3 px-4">قیمت فروش سایت و سود</th>
                <th className="py-3 px-4 text-center">وضعیت در سایت</th>
                <th className="py-3 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-borderLight dark:divide-slate-800 text-xs">
              {paginatedProducts.map((product) => {
                const price = calculateProductPrice(product);
                const category = categories.find((c) => c.id === product.categoryId);

                return (
                  <tr
                    key={product.id}
                    className={`transition-colors ${
                      product.stockCount === 0 || product.inStock === false
                        ? "bg-rose-50/60 dark:bg-rose-950/25 border-r-4 border-r-rose-500 hover:bg-rose-100/60 dark:hover:bg-rose-950/40"
                        : product.requiresEmail || product.requiresPassword
                        ? "bg-indigo-50/25 dark:bg-indigo-950/20 border-r-4 border-r-indigo-500 hover:bg-indigo-50/45 dark:hover:bg-indigo-950/35"
                        : "hover:bg-teal-50/20 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    {/* External ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500 dark:text-slate-400">
                      #{product.externalId}
                    </td>

                    {/* Titles & Image */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.customTitle}
                            className="w-10 h-10 rounded-lg object-cover border border-admin-borderLight dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-slate-800 text-neutral-400 dark:text-slate-500 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white line-clamp-1">
                            <span>{product.customTitle || product.name}</span>
                            {(product.requiresEmail || product.requiresPassword) && (
                              <span title="نیازمند اطلاعات ورود مشتری (ایمیل یا پسورد)" className="shrink-0">
                                <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400 dark:text-slate-500 font-mono line-clamp-1 mt-0.5">
                            {product.name}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {/* Requirement Distinction Badges */}
                            {product.requiresEmail && product.requiresPassword ? (
                              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-950/90 dark:to-purple-950/90 text-indigo-900 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-black shadow-xs">
                                <Lock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                <span>نیازمند ایمیل و پسورد</span>
                              </span>
                            ) : product.requiresEmail ? (
                              <span className="inline-flex items-center gap-1 bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                <Mail className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                                <span>نیازمند ایمیل</span>
                              </span>
                            ) : product.requiresPassword ? (
                              <span className="inline-flex items-center gap-1 bg-violet-50 dark:bg-violet-950/80 text-violet-800 dark:text-violet-200 border border-violet-300 dark:border-violet-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                <Key className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                                <span>نیازمند پسورد</span>
                              </span>
                            ) : product.requiresLink ? (
                              <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 px-1.5 py-0.5 rounded-md text-[10px] font-medium">
                                <span>🔗 نیازمند لینک</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-md text-[10px]">
                                <Zap className="w-2.5 h-2.5 text-amber-500" />
                                <span>تحویل آنی</span>
                              </span>
                            )}

                            {product.badge && (
                              <span className="text-admin-primary dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-1 py-0.2 rounded text-[10px] font-bold">
                                {product.badge}
                              </span>
                            )}
                            {product.pricingUnit === "per_1000" && (
                              <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-1 py-0.2 rounded text-[10px]">
                                تعرفه در ۱۰۰۰ عدد
                              </span>
                            )}
                            {product.isFeatured && (
                              <span className="text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 px-1 py-0.2 rounded text-[10px]">
                                ویژه
                              </span>
                            )}
                            {product.isFlashDeal && (
                              <span className="text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-1 py-0.2 rounded text-[10px]">
                                شگفت‌انگیز
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      {category ? (
                        <span className="inline-block bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 px-2 py-1 rounded text-[11px] font-semibold">
                          {category.title}
                        </span>
                      ) : (
                        <span className="text-neutral-400 dark:text-slate-500 italic">بدون دسته</span>
                      )}
                    </td>

                    {/* Stock Count (Red if 0) */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      {product.stockCount === 0 || product.inStock === false ? (
                        <span className="inline-flex items-center gap-1 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 px-2 py-0.5 rounded-lg text-xs font-bold shadow-xs">
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>ناموجود (۰)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-lg text-xs font-bold">
                          <span>{product.stockCount}</span>
                          <span className="text-[10px] text-neutral-400 dark:text-slate-400 font-sans">عدد</span>
                        </span>
                      )}
                    </td>

                    {/* Cost USD & Toman */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        ${(product.costPriceUsd ?? 0).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-neutral-400 dark:text-slate-500 font-sans">
                        {price.formattedCostToman} ت
                      </div>
                    </td>

                    {/* Retail USD & Toman */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-neutral-600 dark:text-slate-400">
                        ${(product.retailPriceUsd ?? product.costPriceUsd ?? 0).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-neutral-400 dark:text-slate-500 font-sans">
                        {price.formattedPublicRetailToman} ت
                      </div>
                    </td>

                    {/* Selling Toman & Profit */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1.5">
                        <span>{price.formattedToman}</span>
                        <span className="text-[10px] font-normal text-neutral-400 dark:text-slate-500 mr-0.5">تومان</span>
                        {price.isOnSale && (
                          <span className="text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 px-1.5 py-0.2 rounded font-bold">
                            حراج
                          </span>
                        )}
                      </div>
                      {price.isOnSale && (
                        <div className="text-[10px] text-neutral-400 dark:text-slate-500 line-through">
                          {price.formattedOriginalToman} ت
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold ${
                            price.isCustomMarginActive
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                              : "bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300"
                          }`}
                        >
                          {price.marginPercent}٪ سود
                        </span>
                        <span className="text-neutral-400 dark:text-slate-500 font-mono">
                          (+{formatPrice(price.profitToman)} ت)
                        </span>
                      </div>
                    </td>

                    {/* Active Status Switch */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleProductActive(product.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 hover:shadow-xs ${
                          product.isActive
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                            : "bg-neutral-100 dark:bg-slate-800 text-neutral-500 dark:text-slate-400 border border-neutral-200 dark:border-slate-700 hover:bg-neutral-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            product.isActive ? "bg-emerald-500 animate-pulse" : "bg-neutral-400 dark:bg-slate-500"
                          }`}
                        />
                        <span>{product.isActive ? "فعال در ویترین" : "غیرفعال"}</span>
                      </button>
                    </td>

                    {/* Operations */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-teal-800 dark:text-teal-300 border border-brand-border dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-2xs hover:shadow-xs hover:scale-105 active:scale-95"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>ویرایش</span>
                        </button>
                        {product.isActive && (
                          <Link
                            href={`/products/${product.id}`}
                            target="_blank"
                            className="p-1.5 text-neutral-400 hover:text-brand-primary dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                            title="مشاهده صفحه محصول در سایت"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-400 dark:text-slate-500">
                    هیچ محصولی با معیارهای جستجو یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredProducts.length}
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

      {/* Comprehensive Product Edit Modal (5 Tabs) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-admin-border dark:border-slate-800 max-w-3xl w-full p-6 space-y-5 animate-fadeIn my-8 text-neutral-800 dark:text-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-admin-borderLight dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-admin-primary dark:text-teal-400 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-admin-text dark:text-white">
                    {isCreatingProduct ? "افزودن محصول جدید به کاتالوگ" : `ویرایش جامع محصول #${editingProduct.externalId}`}
                  </h3>
                  <span className="text-xs text-neutral-400 dark:text-slate-500 font-mono">
                    {editingProduct.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pre-edit live preview info bar with Stock Count */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">کد مرجع:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">#{editingProduct.externalId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-bold">تعداد موجودی محصول:</span>
                <span className={`font-mono font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1 ${
                  editingProduct.stockCount === 0 || !editingProduct.inStock
                    ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-xs"
                    : "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                }`}>
                  {(editingProduct.stockCount === 0 || !editingProduct.inStock) && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                  <span>{editingProduct.inStock !== false && editingProduct.stockCount > 0 ? `${editingProduct.stockCount} عدد موجود` : "ناموجود (۰ عدد)"}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">وضعیت فعلی در سایت:</span>
                <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                  editingProduct.isActive
                    ? "bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300"
                    : "bg-neutral-200 dark:bg-slate-700 text-neutral-600 dark:text-slate-300"
                }`}>
                  {editingProduct.isActive ? "فعال در ویترین" : "غیرفعال"}
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-admin-borderLight dark:border-slate-800 pb-2 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
                  activeTab === "general"
                    ? "bg-admin-primary dark:bg-teal-600 text-white shadow-xs"
                    : "text-neutral-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800"
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>مشخصات عمومی</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("tags")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
                  activeTab === "tags"
                    ? "bg-admin-primary dark:bg-teal-600 text-white shadow-xs"
                    : "text-neutral-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800"
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>برچسب‌ها و تگ‌ها ({editTags.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("pricing")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
                  activeTab === "pricing"
                    ? "bg-admin-primary dark:bg-teal-600 text-white shadow-xs"
                    : "text-neutral-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800"
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>قیمت و تخفیف محصول</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("media")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
                  activeTab === "media"
                    ? "bg-admin-primary dark:bg-teal-600 text-white shadow-xs"
                    : "text-neutral-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>تصویر و کاور</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("requirements")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
                  activeTab === "requirements"
                    ? "bg-admin-primary dark:bg-teal-600 text-white shadow-xs"
                    : "text-neutral-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>الزامات سفارش و انبار</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("visibility")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
                  activeTab === "visibility"
                    ? "bg-admin-primary dark:bg-teal-600 text-white shadow-xs"
                    : "text-neutral-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>وضعیت و پروموشن</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5 text-xs">
              {/* TAB 1: GENERAL */}
              {activeTab === "general" && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block font-bold text-neutral-800 dark:text-slate-200 mb-1.5">
                      عنوان نمایشی در فروشگاه (فارسی):
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className={`w-full bg-admin-bg dark:bg-slate-800 border ${validationErrors.editTitle ? 'border-rose-500' : 'border-admin-borderLight dark:border-slate-700'} focus:border-admin-primary dark:focus:border-teal-400 rounded-lg py-2.5 px-3 text-xs outline-none font-bold text-neutral-900 dark:text-white`}
                      required
                    />
                    {validationErrors.editTitle && <p className="text-rose-500 text-[10px] mt-1 font-bold">{validationErrors.editTitle}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-neutral-800 dark:text-slate-200 mb-1.5">
                        دسته‌بندی در سایت:
                      </label>
                      <select
                        value={editCategoryId}
                        onChange={(e) => setEditCategoryId(e.target.value)}
                        className={`w-full bg-admin-bg dark:bg-slate-800 border ${validationErrors.editCategoryId ? 'border-rose-500' : 'border-admin-borderLight dark:border-slate-700'} focus:border-admin-primary dark:focus:border-teal-400 rounded-lg py-2.5 px-3 text-xs outline-none text-neutral-800 dark:text-slate-200`}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                      {validationErrors.editCategoryId && <p className="text-rose-500 text-[10px] mt-1 font-bold">{validationErrors.editCategoryId}</p>}
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-800 dark:text-slate-200 mb-1.5">
                        برچسب ویژه (Badge):
                      </label>
                      <input
                        type="text"
                        placeholder="مثلاً: پرفروش، تحویل آنی، بدون قطعی..."
                        value={editBadge}
                        onChange={(e) => setEditBadge(e.target.value)}
                        className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 focus:border-admin-primary dark:focus:border-teal-400 rounded-lg py-2.5 px-3 text-xs outline-none text-neutral-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-800 dark:text-slate-200 mb-1.5">
                      توضیحات جامع محصول (سئو و اطلاعات خریدار):
                    </label>
                    <textarea
                      rows={4}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="توضیحات کامل درباره این اکانت، پلن، مدت اعتبار و نکات مهم استفاده..."
                      className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 focus:border-admin-primary dark:focus:border-teal-400 rounded-lg py-2.5 px-3 text-xs outline-none text-neutral-800 dark:text-slate-200 leading-relaxed resize-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
                      <span>توضیحات اختصاصی محصول به فارسی (داخلی):</span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-normal">ثبت در دیتابیس (در ویترین فروشگاه نمایش داده نمی‌شود)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={editPersianDescription}
                      onChange={(e) => setEditPersianDescription(e.target.value)}
                      placeholder="متن کامل توضیحات فارسی برای یادداشت داخلی و آرشیو ادمین..."
                      className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 focus:border-admin-primary dark:focus:border-teal-400 rounded-lg py-2.5 px-3 text-xs outline-none text-neutral-800 dark:text-slate-200 leading-relaxed resize-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: PRICING & PROFIT & PRODUCT-SPECIFIC DISCOUNT */}
              {activeTab === "pricing" && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Cost Price USD */}
                    <div>
                      <label className="block font-bold text-neutral-800 dark:text-slate-200 mb-1.5">
                        قیمت خرید همکار (USD):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editCostPriceUsd}
                          onChange={(e) => setEditCostPriceUsd(Number(e.target.value))}
                          className={`w-full bg-admin-bg dark:bg-slate-800 border ${validationErrors.editCostPriceUsd ? 'border-rose-500' : 'border-admin-borderLight dark:border-slate-700'} focus:border-admin-primary dark:focus:border-teal-400 rounded-lg py-2.5 px-3 text-xs font-mono font-bold outline-none text-slate-800 dark:text-slate-100`}
                          required
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500 font-mono">
                          USD
                        </span>
                      </div>
                      {validationErrors.editCostPriceUsd && <p className="text-rose-500 text-[10px] mt-1 font-bold">{validationErrors.editCostPriceUsd}</p>}
                      <span className="text-[10px] text-neutral-400 dark:text-slate-500 mt-1 block">
                        قیمت تامین ما از irMarket
                      </span>
                    </div>

                    {/* Retail Price USD */}
                    <div>
                      <label className="block font-bold text-neutral-800 dark:text-slate-200 mb-1.5">
                        قیمت عمومی بازار (USD):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editRetailPriceUsd}
                          onChange={(e) => setEditRetailPriceUsd(Number(e.target.value))}
                          className={`w-full bg-admin-bg dark:bg-slate-800 border ${validationErrors.editRetailPriceUsd ? 'border-rose-500' : 'border-admin-borderLight dark:border-slate-700'} focus:border-admin-primary dark:focus:border-teal-400 rounded-lg py-2.5 px-3 text-xs font-mono font-bold outline-none text-slate-800 dark:text-slate-100`}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500 font-mono">
                          USD
                        </span>
                      </div>
                      {validationErrors.editRetailPriceUsd && <p className="text-rose-500 text-[10px] mt-1 font-bold">{validationErrors.editRetailPriceUsd}</p>}
                      <span className="text-[10px] text-neutral-400 dark:text-slate-500 mt-1 block">
                        نرخ مصرف‌کننده رسمی بازار
                      </span>
                    </div>

                    {/* Custom Margin Percent */}
                    <div>
                      <label className="block font-bold text-neutral-800 dark:text-slate-200 mb-1.5 flex justify-between">
                        <span>حاشیه سود اختصاصی:</span>
                        <span className="text-admin-primary dark:text-teal-400 font-mono font-bold">
                          %{editMargin}
                        </span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="200"
                          value={editMargin}
                          onChange={(e) => setEditMargin(Number(e.target.value))}
                          className={`w-full bg-admin-bg dark:bg-slate-800 border ${validationErrors.editMargin ? 'border-rose-500' : 'border-admin-borderLight dark:border-slate-700'} focus:border-admin-primary dark:focus:border-teal-400 rounded-lg py-2.5 px-3 text-xs font-mono font-bold outline-none text-slate-800 dark:text-slate-100`}
                          required
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500">
                          %
                        </span>
                      </div>
                      {validationErrors.editMargin && <p className="text-rose-500 text-[10px] mt-1 font-bold">{validationErrors.editMargin}</p>}
                      <span className="text-[10px] text-neutral-400 dark:text-slate-500 mt-1 block">
                        سود پیش‌فرض سراسری: %{settings.defaultMarginPercent}
                      </span>
                    </div>
                  </div>

                  {/* Product-Specific Direct Discount Section */}
                  <div className="p-4 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                      <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>تخفیف مستقیم روی این محصول (اختیاری):</span>
                    </div>
                    <p className="text-[11px] text-amber-800/80 dark:text-slate-300">
                      می‌توانید برای این محصول خاص درصد تخفیف موقت (مثلاً ۳۰٪) یا قیمت فروش مقطوع با تخفیف تعیین کنید تا در فروشگاه با برچسب حراج عرضه شود.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-neutral-800 dark:text-slate-200 mb-1">
                          درصد تخفیف مستقیم (%):
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="95"
                          placeholder="مثلاً: 30"
                          value={editDiscountPercent}
                          onChange={(e) => setEditDiscountPercent(e.target.value)}
                          className={`w-full bg-white dark:bg-slate-800 border ${validationErrors.editDiscountPercent ? 'border-rose-500' : 'border-amber-200 dark:border-slate-700'} focus:border-amber-500 rounded-lg py-2 px-3 text-xs font-mono outline-none text-slate-800 dark:text-slate-100`}
                        />
                        {validationErrors.editDiscountPercent && <p className="text-rose-500 text-[10px] mt-1 font-bold">{validationErrors.editDiscountPercent}</p>}
                      </div>
                      <div>
                        <label className="block font-semibold text-neutral-800 dark:text-slate-200 mb-1">
                          یا قیمت مقطوع با تخفیف (تومان):
                        </label>
                        <input
                          type="number"
                          step="1000"
                          placeholder="مثلاً: 250000"
                          value={editSalePriceToman}
                          onChange={(e) => setEditSalePriceToman(e.target.value)}
                          className={`w-full bg-white dark:bg-slate-800 border ${validationErrors.editSalePriceToman ? 'border-rose-500' : 'border-amber-200 dark:border-slate-700'} focus:border-amber-500 rounded-lg py-2 px-3 text-xs font-mono outline-none text-slate-800 dark:text-slate-100`}
                        />
                        {validationErrors.editSalePriceToman && <p className="text-rose-500 text-[10px] mt-1 font-bold">{validationErrors.editSalePriceToman}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Comprehensive Dual Pricing Live Preview */}
                  <div className="p-4 bg-teal-50/70 dark:bg-slate-800/90 border border-teal-200 dark:border-slate-700 rounded-xl space-y-4">
                    <div className="flex items-center justify-between text-xs text-teal-950 dark:text-teal-300 font-bold border-b border-teal-200/60 dark:border-slate-700 pb-2.5">
                      <span>پیش‌نمایش زنده قیمت و سود:</span>
                      <span className="font-mono text-[11px] text-teal-700 dark:text-teal-400">
                        نرخ تبدیل: {formatPrice(Math.round(settings.usdToRialRate / 10))} تومان / دلار
                      </span>
                    </div>

                    {/* 5 Metric Cards including Stock Count */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                      {/* Stock Count Preview */}
                      <div className={`p-3 rounded-lg border ${
                        editStockCount === 0 || !editInStock
                          ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800"
                          : "bg-white dark:bg-slate-900 border-neutral-200 dark:border-slate-800"
                      }`}>
                        <span className={`text-[10px] block ${
                          editStockCount === 0 || !editInStock
                            ? "text-rose-700 dark:text-rose-400 font-bold"
                            : "text-neutral-400 dark:text-slate-500"
                        }`}>
                          تعداد موجودی محصول:
                        </span>
                        <span className={`font-black text-sm mt-0.5 block font-mono ${
                          editStockCount === 0 || !editInStock
                            ? "text-rose-600 dark:text-rose-300"
                            : "text-slate-800 dark:text-slate-200"
                        }`}>
                          {editInStock && editStockCount > 0 ? `${editStockCount} عدد` : "ناموجود (۰)"}
                        </span>
                      </div>
                      {/* Cost */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-neutral-200 dark:border-slate-800">
                        <span className="text-[10px] text-neutral-400 dark:text-slate-500 block">قیمت خرید (تامین):</span>
                        <span className="font-black text-slate-700 dark:text-slate-200 text-sm mt-0.5 block font-mono">
                          {modalFormattedCostToman} <span className="text-[10px] font-sans font-normal">تومان</span>
                        </span>
                      </div>

                      {/* Public Retail */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-neutral-200 dark:border-slate-800">
                        <span className="text-[10px] text-neutral-400 dark:text-slate-500 block">قیمت عمومی بازار:</span>
                        <span className="font-black text-neutral-500 dark:text-slate-400 text-sm mt-0.5 block font-mono">
                          {modalFormattedPublicToman} <span className="text-[10px] font-sans font-normal">تومان</span>
                        </span>
                      </div>

                      {/* Selling Price */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-300 dark:border-emerald-800">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">قیمت فروش سایت:</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block font-mono">
                          {modalFormattedToman} <span className="text-[10px] font-sans font-normal">تومان</span>
                        </span>
                      </div>

                      {/* Profit */}
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-amber-300 dark:border-amber-800">
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block">سود ناخالص هر فروش:</span>
                        <span className="font-black text-amber-600 dark:text-amber-400 text-sm mt-0.5 block font-mono">
                          +{modalFormattedProfitToman} <span className="text-[10px] font-sans font-normal">تومان</span>
                        </span>
                      </div>
                    </div>

                    {modalDiscountPercent > 0 && (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <span>💡</span>
                        <span>قیمت فروش ما {modalDiscountPercent}٪ ارزان‌تر از نرخ رسمی بازار است و برای خریدار به عنوان تخفیف شگفت‌انگیز نمایش داده می‌شود.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: MEDIA & IMAGES */}
              {activeTab === "media" && (
                <div className="space-y-4 animate-fadeIn">
                  <ImageUploader
                    value={editImage}
                    onChange={setEditImage}
                    folder="products"
                    label="تصویر شاخص و کاور کاتالوگ محصول"
                    placeholderText="تصویر محصول را بکشید یا برای انتخاب فایل کلیک کنید"
                    maxSizeMB={5}
                  />

                  <div className="p-4 bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200 dark:border-slate-700 rounded-xl text-xs text-neutral-500 dark:text-slate-400 space-y-1">
                    <span className="font-bold text-neutral-800 dark:text-slate-200 block">نکات مهم تصویر محصول:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] leading-relaxed">
                      <li>تصاویر با نسبت ۱:۱ یا ۱۶:۹ با وضوح حداقل ۶۰۰×۶۰۰ پیکسل بهترین کیفیت نمایش را در کارت‌های کاتالوگ و صفحه محصول خواهند داشت.</li>
                      <li>فایل‌ها به صورت خودکار با پسوندهای PNG، JPG، WEBP روی سرور ذخیره و آدرس‌دهی می‌شوند.</li>
                      <li>در صورت تمایل می‌توانید تب «لینک مستقیم» را انتخاب کرده و آدرس عکس اینترنتی مورد نظر را وارد نمایید.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 4: REQUIREMENTS & INVENTORY */}
              {activeTab === "requirements" && (
                <div className="space-y-4 animate-fadeIn">
                  <span className="block font-bold text-neutral-800 dark:text-slate-200">
                    فیلدهای اجباری برای خریدار هنگام ثبت سفارش:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 p-3 bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 rounded-xl cursor-pointer hover:bg-teal-50/40 dark:hover:bg-slate-700/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={editRequiresEmail}
                        onChange={(e) => setEditRequiresEmail(e.target.checked)}
                        className="w-4 h-4 rounded text-admin-primary focus:ring-0"
                      />
                      <div>
                        <span className="font-bold text-neutral-800 dark:text-slate-200 block">الزام ورود ایمیل</span>
                        <span className="text-[10px] text-neutral-400 dark:text-slate-500">برای ارسال مشخصات اکانت یا اینوایت</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 rounded-xl cursor-pointer hover:bg-teal-50/40 dark:hover:bg-slate-700/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={editRequiresPassword}
                        onChange={(e) => setEditRequiresPassword(e.target.checked)}
                        className="w-4 h-4 rounded text-admin-primary focus:ring-0"
                      />
                      <div>
                        <span className="font-bold text-neutral-800 dark:text-slate-200 block">الزام ورود رمز عبور</span>
                        <span className="text-[10px] text-neutral-400 dark:text-slate-500">برای فعال‌سازی روی اکانت خود مشتری</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 rounded-xl cursor-pointer hover:bg-teal-50/40 dark:hover:bg-slate-700/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={editRequiresLink}
                        onChange={(e) => setEditRequiresLink(e.target.checked)}
                        className="w-4 h-4 rounded text-admin-primary focus:ring-0"
                      />
                      <div>
                        <span className="font-bold text-neutral-800 dark:text-slate-200 block">الزام لینک مقصد</span>
                        <span className="text-[10px] text-neutral-400 dark:text-slate-500">برای سرویس‌های فالوور، لایک یا ویو SMM</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 rounded-xl cursor-pointer hover:bg-teal-50/40 dark:hover:bg-slate-700/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={editRequiresComments}
                        onChange={(e) => setEditRequiresComments(e.target.checked)}
                        className="w-4 h-4 rounded text-admin-primary focus:ring-0"
                      />
                      <div>
                        <span className="font-bold text-neutral-800 dark:text-slate-200 block">الزام توضیحات / کامنت</span>
                        <span className="text-[10px] text-neutral-400 dark:text-slate-500">درخواست متن سفارشی خریدار</span>
                      </div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block font-bold text-neutral-800 dark:text-slate-200 mb-1.5">
                        واحد محاسبه قیمت:
                      </label>
                      <select
                        value={editPricingUnit}
                        onChange={(e) => setEditPricingUnit(e.target.value as any)}
                        className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg py-2.5 px-3 text-xs outline-none"
                      >
                        <option value="unit">تکی / هر عدد (Unit)</option>
                        <option value="per_1000">تعرفه در هر ۱۰۰۰ عدد (SMM)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-800 dark:text-slate-200 mb-1.5">
                        حداقل تعداد خرید:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editMinQty}
                        onChange={(e) => setEditMinQty(Number(e.target.value))}
                        className={`w-full bg-admin-bg dark:bg-slate-800 border ${validationErrors.editMinQty ? 'border-rose-500' : 'border-admin-borderLight dark:border-slate-700'} text-slate-800 dark:text-slate-200 rounded-lg py-2.5 px-3 text-xs outline-none font-mono`}
                      />
                      {validationErrors.editMinQty && <p className="text-rose-500 text-[10px] mt-1 font-bold">{validationErrors.editMinQty}</p>}
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-800 dark:text-slate-200 mb-1.5">
                        حداکثر تعداد خرید:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editMaxQty}
                        onChange={(e) => setEditMaxQty(Number(e.target.value))}
                        className={`w-full bg-admin-bg dark:bg-slate-800 border ${validationErrors.editMaxQty ? 'border-rose-500' : 'border-admin-borderLight dark:border-slate-700'} text-slate-800 dark:text-slate-200 rounded-lg py-2.5 px-3 text-xs outline-none font-mono`}
                      />
                      {validationErrors.editMaxQty && <p className="text-rose-500 text-[10px] mt-1 font-bold">{validationErrors.editMaxQty}</p>}
                    </div>
                  </div>

                  {/* Stock Count and In Stock adjustment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-admin-borderLight dark:border-slate-700">
                    <div>
                      <label className="block font-bold text-neutral-800 dark:text-slate-200 mb-1.5">
                        تعداد موجودی محصول در انبار:
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editStockCount}
                        onChange={(e) => setEditStockCount(Number(e.target.value))}
                        className={`w-full bg-admin-bg dark:bg-slate-800 border ${validationErrors.editStockCount ? 'border-rose-500' : 'border-admin-borderLight dark:border-slate-700'} text-slate-800 dark:text-slate-200 rounded-lg py-2.5 px-3 text-xs outline-none font-mono font-bold`}
                      />
                      {validationErrors.editStockCount && <p className="text-rose-500 text-[10px] mt-1 font-bold">{validationErrors.editStockCount}</p>}
                    </div>

                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editInStock}
                          onChange={(e) => setEditInStock(e.target.checked)}
                          className="w-4 h-4 rounded text-admin-primary focus:ring-0"
                        />
                        <span className="font-bold text-neutral-800 dark:text-slate-200 text-xs">
                          کالا موجود و قابل سفارش است (In Stock)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: VISIBILITY & PROMOTION */}
              {activeTab === "visibility" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="flex items-center gap-3 p-3.5 bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 rounded-xl cursor-pointer hover:bg-teal-50/40 dark:hover:bg-slate-700/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={editIsActive}
                        onChange={(e) => setEditIsActive(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                      />
                      <div>
                        <span className="font-bold text-neutral-800 dark:text-slate-200 block">فعال در سایت</span>
                        <span className="text-[10px] text-neutral-400 dark:text-slate-500">نمایش در کاتالوگ فروشگاه</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3.5 bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 rounded-xl cursor-pointer hover:bg-teal-50/40 dark:hover:bg-slate-700/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={editIsFeatured}
                        onChange={(e) => setEditIsFeatured(e.target.checked)}
                        className="w-4 h-4 rounded text-admin-primary focus:ring-0"
                      />
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        <div>
                          <span className="font-bold text-neutral-800 dark:text-slate-200 block">محصول ویژه</span>
                          <span className="text-[10px] text-neutral-400 dark:text-slate-500">نمایش در ردیف برگزیده‌ها</span>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3.5 bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 rounded-xl cursor-pointer hover:bg-teal-50/40 dark:hover:bg-slate-700/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={editIsFlashDeal}
                        onChange={(e) => setEditIsFlashDeal(e.target.checked)}
                        className="w-4 h-4 rounded text-red-600 focus:ring-0"
                      />
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-red-500" />
                        <div>
                          <span className="font-bold text-neutral-800 dark:text-slate-200 block">شگفت‌انگیز روز</span>
                          <span className="text-[10px] text-neutral-400 dark:text-slate-500">نمایش در باکس پیشنهاد داغ</span>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <label className="flex items-center gap-3 p-3.5 bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editInStock}
                        onChange={(e) => setEditInStock(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                      />
                      <div>
                        <span className="font-bold text-neutral-800 dark:text-slate-200 block">موجود در انبار</span>
                        <span className="text-[10px] text-neutral-400 dark:text-slate-500">امکان ثبت سفارش توسط کاربر</span>
                      </div>
                    </label>

                    <div>
                      <label className="block font-bold text-neutral-800 dark:text-slate-200 mb-1.5">
                        موجودی انبار (تعداد):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editStockCount}
                        onChange={(e) => setEditStockCount(Number(e.target.value))}
                        className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-neutral-800 dark:text-slate-200 rounded-lg py-2.5 px-3 text-xs outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}


              {/* TAB: TAGS MANAGEMENT */}
              {activeTab === "tags" && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Current Active Tags */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-neutral-800 dark:text-slate-200">
                        برچسب‌های متصل به این محصول ({editTags.length} تگ):
                      </label>
                      {editTags.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setEditTags([])}
                          className="text-[11px] text-rose-500 hover:underline"
                        >
                          پاک کردن همه برچسب‌ها
                        </button>
                      )}
                    </div>

                    <div className="min-h-[60px] p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 items-center">
                      {editTags.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">
                          هیچ برچسبی برای این محصول انتخاب نشده است. از کادر زیر برچسب اضافه کنید یا یک دسته پیشنهادی را انتخاب نمایید.
                        </span>
                      ) : (
                        editTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-brand-primary dark:text-teal-300 text-xs font-bold group shadow-2xs"
                          >
                            <Hash className="w-3 h-3 opacity-60" />
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="text-slate-400 hover:text-rose-500 transition-colors p-0.5"
                              title="حذف برچسب"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Add Tag Input */}
                  <div className="space-y-2">
                    <label className="font-bold text-neutral-800 dark:text-slate-200 block">
                      افزودن برچسب جدید (کلمه کلیدی):
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={tagInputText}
                          onChange={(e) => setTagInputText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                          placeholder="عنوان برچسب را بنویسید (برای چند مورد از کاما استفاده کنید)..."
                          className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-neutral-800 dark:text-slate-200 rounded-xl py-2.5 pr-10 pl-3 text-xs outline-none focus:border-brand-primary"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddTag()}
                        disabled={!tagInputText.trim()}
                        className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-teal-700 text-white font-bold text-xs transition-colors disabled:opacity-40"
                      >
                        + افزودن
                      </button>
                    </div>
                  </div>

                  {/* Preset Clusters Section */}
                  <div className="space-y-2.5 p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-brand-primary dark:text-teal-300 flex items-center gap-1.5">
                        <Layers className="w-4 h-4" />
                        <span>دسته‌های پیشنهادی برچسب (افزودن دسته جمعی تگ‌ها به محصول):</span>
                      </span>
                      <span className="text-[10px] text-slate-400">یک کلیک برای الحاق کل دسته</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {PRESET_CLUSTERS.map((cluster, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleAddPresetCluster(cluster.tags)}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-teal-100 dark:border-slate-700 hover:border-brand-primary dark:hover:border-teal-400 cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                        >
                          <div className="flex items-center gap-2 truncate pl-2">
                            <span className="text-base">{cluster.icon}</span>
                            <div>
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">
                                {cluster.title}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {cluster.tags.slice(0, 3).join(", ")}...
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] text-brand-primary dark:text-teal-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            + الحاق دسته
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Popular Existing Tags */}
                  {allExistingTags.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        تگ‌های موجود در سیستم (کلیک جهت افزودن سریع):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                        {allExistingTags.slice(0, 40).map((tag, idx) => {
                          const isSelected = editTags.includes(tag);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (isSelected) handleRemoveTag(tag);
                                else handleAddTag(tag);
                              }}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                                isSelected
                                  ? "bg-teal-600 text-white border-teal-600 font-bold"
                                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-primary"
                              }`}
                            >
                              <span>#{tag}</span>
                              {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 opacity-60" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-admin-borderLight dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 rounded-xl text-neutral-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800 font-semibold transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-admin-primary dark:bg-teal-600 hover:bg-admin-primaryDark dark:hover:bg-teal-700 text-white font-bold shadow-md transition-all disabled:opacity-70"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "در حال ذخیره..." : isCreatingProduct ? "ثبت و ایجاد محصول جدید" : "ذخیره تغییرات محصول"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
