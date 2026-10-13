"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { api } from "@/lib/api";
import { AuditLog } from "@/types";
import { toPersianDateTime, toPersianDate, parseOrderDate } from "@/lib/date";
import JalaliDatePickerInput from "@/components/ui/JalaliDatePickerInput";
import {
  Activity,
  Calendar,
  Filter,
  Search,
  User,
  ShieldCheck,
  ShieldAlert,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Download,
  RefreshCw,
  ShoppingCart,
  Package,
  FolderTree,
  Coins,
  Lock,
  Tag,
  FileText,
  SlidersHorizontal,
  ChevronLeft,
  Eye,
  RotateCcw,
} from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import Link from "next/link";

interface AdminUser {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

function AdminActivitiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAdminId = searchParams.get("adminId") || "all";

  const { user: currentUser } = useAuth();
  const { auditLogs } = useStore();

  const [selectedAdminId, setSelectedAdminId] = useState<string>(initialAdminId);
  const [selectedType, setSelectedType] = useState<string>("all");

  const [admins, setAdmins] = useState<AdminUser[]>([
    { id: "mock-super-admin", name: "رضا بابایی (مدیر ارشد سامانه)", role: "SUPER_ADMIN", phone: "09181111111" },
    { id: "mock-support-admin", name: "علی صادقی (پشتیبان سفارشات)", role: "SUPPORT_ADMIN", phone: "09120000001" },
    { id: "mock-catalog-admin", name: "محمد محمدی (مدیر کاتالوگ)", role: "CATALOG_MANAGER", phone: "09130000002" },
    { id: "mock-finance-admin", name: "زهرا احمدی (مدیر مالی)", role: "FINANCE_ADMIN", phone: "09140000003" },
  ]);

  type ActivityTimeRange = "all" | "today" | "yesterday" | "7days" | "30days" | "90days" | "custom";
  const [timeRange, setTimeRange] = useState<ActivityTimeRange>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [search, setSearch] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [loading, setLoading] = useState(false);
  const [apiActivities, setApiActivities] = useState<AuditLog[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Sync with URL query parameter
  useEffect(() => {
    const qAdmin = searchParams.get("adminId");
    if (qAdmin && qAdmin !== selectedAdminId) {
      setSelectedAdminId(qAdmin);
    }
  }, [searchParams, selectedAdminId]);

  // Load real admins list from backend
  useEffect(() => {
    api.getUsers({ limit: 100 })
      .then((res) => {
        if (res?.users) {
          const staff = res.users.filter((u: any) => u.role !== "USER");
          if (staff.length > 0) {
            setAdmins(staff);
          }
        }
      })
      .catch((err) => console.warn("Could not fetch admins from API:", err));
  }, []);

  // Fetch activities from API with local fallback
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getAdminActivities({
      adminId: selectedAdminId === "all" ? undefined : selectedAdminId,
      type: selectedType === "all" ? undefined : selectedType,
      search: search || undefined,
      sort: sortOrder,
      limit: 100,
    })
      .then((res) => {
        if (isMounted && res?.activities) {
          setApiActivities(res.activities);
        }
      })
      .catch(() => {
        // Fallback to local auditLogs in StoreContext
        if (isMounted) {
          setApiActivities([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedAdminId, selectedType, search, sortOrder]);

  // Merge API activities or StoreContext audit logs
  const combinedActivities = useMemo(() => {
    const baseList = apiActivities.length > 0 ? apiActivities : auditLogs;

    return baseList.filter((log) => {
      // 1. Admin filter
      if (selectedAdminId !== "all") {
        const selectedAdmin = admins.find((a) => a.id === selectedAdminId);
        const matchesId = log.adminId === selectedAdminId;
        const matchesName = selectedAdmin && log.user?.includes(selectedAdmin.name);
        const matchesPhone = selectedAdmin?.phone && log.user?.includes(selectedAdmin.phone);
        if (!matchesId && !matchesName && !matchesPhone) return false;
      }

      // 2. Type filter
      if (selectedType !== "all") {
        if (selectedType === "order" && !log.type.includes("order")) return false;
        if (selectedType === "product" && !log.type.includes("product")) return false;
        if (selectedType === "category" && !log.type.includes("category")) return false;
        if (selectedType === "rate" && !log.type.includes("rate")) return false;
        if (selectedType === "coupon" && !log.type.includes("coupon")) return false;
        if (selectedType === "security" && !log.type.includes("security")) return false;
        if (selectedType === "sync" && !log.type.includes("sync")) return false;
      }

      // 3. Time range filter
      if (timeRange !== "all") {
        const logDate = parseOrderDate(log.createdAt || log.timestamp);
        const now = new Date();

        if (timeRange === "today") {
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          if (logDate < todayStart) return false;
        } else if (timeRange === "yesterday") {
          const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
          const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          if (logDate < yesterdayStart || logDate >= yesterdayEnd) return false;
        } else if (timeRange === "7days") {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (logDate < sevenDaysAgo) return false;
        } else if (timeRange === "30days") {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (logDate < thirtyDaysAgo) return false;
        } else if (timeRange === "90days") {
          const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          if (logDate < ninetyDaysAgo) return false;
        } else if (timeRange === "custom") {
          if (customStartDate) {
            const s = parseOrderDate(customStartDate);
            s.setHours(0, 0, 0, 0);
            if (logDate < s) return false;
          }
          if (customEndDate) {
            const e = parseOrderDate(customEndDate);
            e.setHours(23, 59, 59, 999);
            if (logDate > e) return false;
          }
        }
      }

      // 4. Search text
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesAction = log.action?.toLowerCase().includes(q);
        const matchesDetails = log.details?.toLowerCase().includes(q);
        const matchesUser = log.user?.toLowerCase().includes(q);
        if (!matchesAction && !matchesDetails && !matchesUser) return false;
      }

      return true;
    }).sort((a, b) => {
      const timeA = parseOrderDate(a.createdAt || a.timestamp).getTime();
      const timeB = parseOrderDate(b.createdAt || b.timestamp).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });
  }, [apiActivities, auditLogs, selectedAdminId, selectedType, timeRange, customStartDate, customEndDate, search, sortOrder, admins]);

  // Active admin info
  const currentAdmin = admins.find((a) => a.id === selectedAdminId);

  // Statistics calculation for KPI cards
  const stats = useMemo(() => {
    const total = combinedActivities.length;
    const ordersCount = combinedActivities.filter((l) => l.type.includes("order")).length;
    const catalogCount = combinedActivities.filter((l) => l.type.includes("product") || l.type.includes("category")).length;
    const rateCount = combinedActivities.filter((l) => l.type.includes("rate") || l.type.includes("coupon")).length;
    return { total, ordersCount, catalogCount, rateCount };
  }, [combinedActivities]);

  // Paginated list
  const totalPages = Math.ceil(combinedActivities.length / itemsPerPage);
  const paginatedActivities = combinedActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export to JSON
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(combinedActivities, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `admin-activities-${selectedAdminId}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getActivityBadge = (type: string) => {
    if (type.includes("order")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <ShoppingCart className="w-3 h-3" />
          <span>تایید و سفارشات</span>
        </span>
      );
    }
    if (type.includes("product")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
          <Package className="w-3 h-3" />
          <span>محصولات و انبار</span>
        </span>
      );
    }
    if (type.includes("category")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
          <FolderTree className="w-3 h-3" />
          <span>دسته‌بندی‌ها</span>
        </span>
      );
    }
    if (type.includes("rate")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          <Coins className="w-3 h-3" />
          <span>نرخ ارز و سود</span>
        </span>
      );
    }
    if (type.includes("coupon")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          <Tag className="w-3 h-3" />
          <span>تخفیف‌ها</span>
        </span>
      );
    }
    if (type.includes("security") || type.includes("user")) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
          <Lock className="w-3 h-3" />
          <span>امنیت و نقش‌ها</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <Activity className="w-3 h-3" />
        <span>عملیات سیستمی</span>
      </span>
    );
  };

  // Guard: ONLY SUPER_ADMIN allowed
  if (currentUser?.role !== "SUPER_ADMIN") {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-2xl shadow-xl text-center space-y-4">
        <div className="w-14 h-14 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          دسترسی غیرمجاز - منطقه حفاظت‌شده مدیر ارشد (Super Admin)
        </h2>
        <p className="text-xs text-neutral-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
          این بخش منحصراً برای نظارت عالیه و حسابرسی امنیتی مدیر ارشد سامانه در نظر گرفته شده است.
          شما مجوز مشاهده گزارش فعالیت‌های تفکیکی سایر مدیران را ندارید.
        </p>
        <div className="pt-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 bg-brand-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-brand-primaryDark transition-all"
          >
            <span>بازگشت به داشبورد اصلی</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-primary dark:text-teal-400 font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>ویژه مدیر ارشد (Super Admin Audit)</span>
          </div>
          <h1 className="text-2xl font-black text-admin-text dark:text-white">
            نظارت بر فعالیت‌ها و کارنامه مدیران
          </h1>
          <p className="text-xs text-admin-textMuted dark:text-slate-400 mt-1">
            ردیابی دقیق و تفکیکی کلیه تغییرات، تایید سفارشات و دسترسی‌های پرسنل با امکان فیلتر بازه زمانی
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800 text-xs font-bold text-admin-text dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 hover:border-teal-400/40 transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>خروجی لاگ‌ها (JSON)</span>
          </button>

          <Link
            href="/admin/users"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <User className="w-3.5 h-3.5" />
            <span>مدیریت کاربران و کادر</span>
          </Link>
        </div>
      </div>

      {/* Selected Admin Profile Card */}
      {currentAdmin && (
        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-5 rounded-2xl border border-admin-borderLight dark:border-slate-800/80 shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-400/40 dark:hover:border-teal-400/30 hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-lg border border-teal-200 dark:border-teal-800 shadow-2xs group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              {currentAdmin.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {currentAdmin.name}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {currentAdmin.role}
                </span>
              </div>
              <div className="text-xs text-neutral-400 dark:text-slate-400 mt-1 flex items-center gap-3 flex-wrap font-mono">
                {currentAdmin.phone && <span>شماره تماس: {currentAdmin.phone}</span>}
                {currentAdmin.email && <span>ایمیل: {currentAdmin.email}</span>}
                <span>شناسه کاربری: {currentAdmin.id}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-neutral-500 dark:text-slate-400 flex items-center gap-2 border-t md:border-t-0 md:border-r border-admin-borderLight dark:border-slate-800 pt-3 md:pt-0 md:pr-6">
            <Clock className="w-4 h-4 text-teal-500 animate-pulse" />
            <span>در حال بررسی فعالیت‌های این ادمین از ابتدای همکاری تا کنون</span>
          </div>
        </div>
      )}

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-5 rounded-2xl border border-admin-borderLight dark:border-slate-800/80 shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-400/40 dark:hover:border-teal-400/30 hover:-translate-y-1.5 transition-all duration-300 flex items-center gap-3.5">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-teal-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-2xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 dark:text-slate-400 font-semibold">تعداد کل فعالیت‌ها</span>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {stats.total}
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-5 rounded-2xl border border-admin-borderLight dark:border-slate-800/80 shadow-card hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-400/40 dark:hover:border-emerald-400/30 hover:-translate-y-1.5 transition-all duration-300 flex items-center gap-3.5">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-2xs">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 dark:text-slate-400 font-semibold">سفارشات تایید / بررسی‌شده</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {stats.ordersCount}
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-5 rounded-2xl border border-admin-borderLight dark:border-slate-800/80 shadow-card hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-400/40 dark:hover:border-indigo-400/30 hover:-translate-y-1.5 transition-all duration-300 flex items-center gap-3.5">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-2xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 dark:text-slate-400 font-semibold">تغییرات کاتالوگ و محصولات</span>
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
              {stats.catalogCount}
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-5 rounded-2xl border border-admin-borderLight dark:border-slate-800/80 shadow-card hover:shadow-xl hover:shadow-amber-500/5 hover:border-amber-400/40 dark:hover:border-amber-400/30 hover:-translate-y-1.5 transition-all duration-300 flex items-center gap-3.5">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-2xs">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 dark:text-slate-400 font-semibold">تنظیمات ارزی و تخفیف‌ها</span>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
              {stats.rateCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-4 rounded-2xl border border-admin-borderLight dark:border-slate-800 shadow-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Admin Selector */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-slate-300 mb-1">
              انتخاب ادمین:
            </label>
            <select
              value={selectedAdminId}
              onChange={(e) => {
                setSelectedAdminId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-admin-bg dark:bg-slate-800/90 border border-admin-borderLight dark:border-slate-700 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none transition-all duration-200"
            >
              <option value="all">همه مدیران و پرسنل ({admins.length} نفر)</option>
              {admins.map((adm) => (
                <option key={adm.id} value={adm.id}>
                  {adm.name} ({adm.role})
                </option>
              ))}
            </select>
          </div>

          {/* Activity Type Selector */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-slate-300 mb-1">
              نوع فعالیت:
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-admin-bg dark:bg-slate-800/90 border border-admin-borderLight dark:border-slate-700 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white outline-none transition-all duration-200"
            >
              <option value="all">همه دسته‌ها</option>
              <option value="order">تایید و تحویل سفارشات</option>
              <option value="product">محصولات و انبار</option>
              <option value="category">دسته‌بندی‌ها</option>
              <option value="rate">نرخ ارز و قیمت‌گذاری</option>
              <option value="coupon">تخفیف‌ها و کوپن‌ها</option>
              <option value="security">امنیت و نقش‌ها</option>
              <option value="sync">همگام‌سازی کاتالوگ</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="md:col-span-5">
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-slate-300 mb-1">
              جستجو در جزئیات فعالیت:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="جستجو در شرح عملیات، شماره سفارش، نام محصول..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-admin-bg dark:bg-slate-800/90 border border-admin-borderLight dark:border-slate-700 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-xl pr-9 pl-4 py-2 text-xs text-slate-800 dark:text-white outline-none placeholder:text-neutral-400 transition-all duration-200"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Time Ranges & Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-admin-borderLight dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-neutral-400 dark:text-slate-400 ml-1 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>بازه زمانی:</span>
            </span>

            {[
              { id: "all", label: "همه زمان‌ها" },
              { id: "today", label: "امروز" },
              { id: "yesterday", label: "دیروز" },
              { id: "7days", label: "۷ روز گذشته" },
              { id: "30days", label: "۳۰ روز اخیر (ماه)" },
              { id: "90days", label: "۳ ماه اخیر" },
              { id: "custom", label: "بازه دلخواه 📅" },
            ].map((p) => {
              const isActive = timeRange === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setTimeRange(p.id as any);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs"
                      : "bg-admin-bg dark:bg-slate-800 text-neutral-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="flex items-center gap-1.5 bg-admin-bg dark:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:scale-105 active:scale-95 transition-all duration-200"
              title="تغییر ترتیب زمانی"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{sortOrder === "desc" ? "جدیدترین ابتدا" : "قدیمی‌ترین ابتدا"}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Custom Jalali Date Range */}
        {timeRange === "custom" && (
          <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-teal-900 dark:text-teal-300">تعیین دقیق بازه تاریخی شمسی:</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400">از تاریخ:</span>
                <div className="w-36">
                  <JalaliDatePickerInput
                    value={customStartDate}
                    onChange={(v) => {
                      setCustomStartDate(v);
                      setCurrentPage(1);
                    }}
                    placeholder="مثلا ۱۴۰۵/۰۷/۰۱"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400">تا تاریخ:</span>
                <div className="w-36">
                  <JalaliDatePickerInput
                    value={customEndDate}
                    onChange={(v) => {
                      setCustomEndDate(v);
                      setCurrentPage(1);
                    }}
                    placeholder="مثلا ۱۴۰۵/۰۷/۰۶"
                  />
                </div>
              </div>
            </div>

            {(customStartDate || customEndDate) && (
              <button
                onClick={() => {
                  setCustomStartDate("");
                  setCustomEndDate("");
                  setCurrentPage(1);
                }}
                className="text-[11px] text-teal-700 dark:text-teal-300 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 font-medium cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                پاک کردن تاریخ‌ها
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Activity Table */}
      <div className="bg-white dark:bg-slate-900 border border-admin-borderLight dark:border-slate-800 rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="min-w-[850px] w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-admin-bg dark:bg-slate-800/80 border-b border-admin-borderLight dark:border-slate-800 font-bold text-admin-text dark:text-slate-200">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">زمان ثبت (شمسی)</th>
                <th className="py-3.5 px-4">ادمین مجری</th>
                <th className="py-3.5 px-4">دسته‌بندی عملیات</th>
                <th className="py-3.5 px-4">عنوان اقدام</th>
                <th className="py-3.5 px-4 max-w-md">شرح و جزئیات دقیق</th>
                <th className="py-3.5 px-4 text-center">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-borderLight dark:divide-slate-800">
              {paginatedActivities.map((log, index) => (
                <tr
                  key={log.id || index}
                  className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition-colors duration-150"
                >
                  <td className="py-3.5 px-4 text-center text-neutral-400 font-mono text-[11px]">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-600 dark:text-slate-300 whitespace-nowrap">
                    {log.createdAt ? toPersianDateTime(log.createdAt) : log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-bold text-slate-900 dark:text-white block hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                      {log.adminName || log.user}
                    </span>
                    {log.adminPhone && (
                      <span className="text-[10px] text-neutral-400 font-mono block">
                        {log.adminPhone}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getActivityBadge(log.type)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-slate-300 leading-relaxed max-w-md">
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>ثبت در سیستم</span>
                    </span>
                  </td>
                </tr>
              ))}

              {paginatedActivities.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-neutral-400 dark:text-slate-500 text-xs">
                    {loading ? "در حال دریافت گزارش فعالیت‌ها..." : "هیچ فعالیتی با فیلترهای انتخابی در این بازه زمانی یافت نشد."}
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
        totalItems={combinedActivities.length}
        itemsPerPage={itemsPerPage}
        itemName="فعالیت"
        onPageChange={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onItemsPerPageChange={(limit) => {
          setItemsPerPage(limit);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 15, 30, 50, 100]}
      />
    </div>
  );
}

export default function AdminActivitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-neutral-400 animate-pulse">
          در حال بارگذاری گزارش فعالیت‌های مدیران...
        </div>
      }
    >
      <AdminActivitiesContent />
    </Suspense>
  );
}
