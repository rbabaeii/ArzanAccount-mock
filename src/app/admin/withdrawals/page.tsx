"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/format";
import { validateIranianCardNumber, validateIranianSheba, formatCardNumber, formatSheba } from "@/lib/iranian-banks";
import {
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  CreditCard,
  User,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  FileText,
  X,
  Check,
  Copy,
  ExternalLink,
  Users,
} from "lucide-react";
import { parseOrderDate, toPersianDate } from "@/lib/date";
import { JalaliDatePickerInput } from "@/components/ui/JalaliDatePickerInput";

type TimeRangeType = "all" | "today" | "yesterday" | "7d" | "30d" | "90d" | "custom";

export default function AdminWithdrawalsPage() {
  const { user: currentAdmin } = useAuth();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [userIdFilter, setUserIdFilter] = useState<string>("");
  const [userFilterName, setUserFilterName] = useState<string>("");
  const [timeRange, setTimeRange] = useState<TimeRangeType>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals for processing
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [modalAction, setModalAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [bankTrackingCode, setBankTrackingCode] = useState("");
  const [bankReceiptUrl, setBankReceiptUrl] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      showToast("success", `${label} با موفقیت کپی شد: ${text}`);
    }
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchWithdrawals = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminWithdrawals({
        status: statusFilter !== "all" ? statusFilter : undefined,
        userId: userIdFilter || undefined,
        role: currentAdmin?.role || "SUPER_ADMIN",
      });
      if (res && Array.isArray(res.requests)) {
        setWithdrawals(res.requests);
      }
    } catch (err: any) {
      console.error("Failed to load admin withdrawals:", err);
      showToast("error", err?.message || "خطا در دریافت لیست درخواست‌های تسویه.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, userIdFilter, currentAdmin?.role]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleOpenProcessModal = (req: any, action: "APPROVE" | "REJECT") => {
    setSelectedReq(req);
    setModalAction(action);
    setBankTrackingCode("");
    setBankReceiptUrl("");
    setAdminNote("");
  };

  const handleCloseModal = () => {
    setSelectedReq(null);
    setModalAction(null);
    setBankTrackingCode("");
    setAdminNote("");
  };

  const handleSubmitProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !modalAction) return;

    if (modalAction === "APPROVE" && !bankTrackingCode.trim()) {
      showToast("error", "لطفاً کد رهگیری انتقال بانکی را وارد نمایید.");
      return;
    }

    if (modalAction === "REJECT" && !adminNote.trim()) {
      showToast("error", "لطفاً دلیل رد درخواست تسویه را جهت اطلاع کاربر ثبت نمایید.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await api.processWithdrawal(selectedReq.id, {
        action: modalAction,
        bankTrackingCode: bankTrackingCode.trim() || undefined,
        bankReceiptUrl: bankReceiptUrl.trim() || undefined,
        adminNote: adminNote.trim() || undefined,
        adminName: currentAdmin?.name || "مدیر مالی",
        adminId: currentAdmin?.id,
        role: currentAdmin?.role || "SUPER_ADMIN",
      });

      showToast("success", res?.message || (modalAction === "APPROVE" ? "درخواست تسویه تایید شد." : "درخواست تسویه رد شد."));
      handleCloseModal();
      fetchWithdrawals();
    } catch (err: any) {
      showToast("error", err?.message || "خطا در پردازش درخواست.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Date filtering logic
  const isDateInRange = (dateInput?: string | Date | null) => {
    if (timeRange === "all") return true;
    const targetDate = parseOrderDate(dateInput);
    const now = new Date();

    if (timeRange === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      return targetDate >= start;
    }
    if (timeRange === "yesterday") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      return targetDate >= start && targetDate < end;
    }
    if (timeRange === "7d") {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return targetDate >= start;
    }
    if (timeRange === "30d") {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return targetDate >= start;
    }
    if (timeRange === "90d") {
      const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return targetDate >= start;
    }
    if (timeRange === "custom") {
      if (customStartDate) {
        const s = parseOrderDate(customStartDate);
        s.setHours(0, 0, 0, 0);
        if (targetDate < s) return false;
      }
      if (customEndDate) {
        const e = parseOrderDate(customEndDate);
        e.setHours(23, 59, 59, 999);
        if (targetDate > e) return false;
      }
      return true;
    }
    return true;
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "today":
        return `امروز (${toPersianDate(new Date())})`;
      case "yesterday": {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return `دیروز (${toPersianDate(y)})`;
      }
      case "7d":
        return "۷ روز اخیر";
      case "30d":
        return "۳۰ روز اخیر";
      case "90d":
        return "۳ ماه اخیر";
      case "custom":
        return `بازه شمسی ${customStartDate || "ابتدا"} تا ${customEndDate || "اکنون"}`;
      default:
        return "همه زمان‌ها";
    }
  };

  const timeRangePresets = [
    { id: "all", label: "همه زمان‌ها" },
    { id: "today", label: "امروز" },
    { id: "yesterday", label: "دیروز" },
    { id: "7d", label: "۷ روز اخیر" },
    { id: "30d", label: "۳۰ روز اخیر" },
    { id: "90d", label: "۳ ماه اخیر" },
    { id: "custom", label: "بازه انتخابی تقویم" },
  ] as const;

  // Filter withdrawals by time range first
  const scopedWithdrawals = withdrawals.filter((w) => isDateInRange(w.createdAt));

  // Filter by search
  const filteredWithdrawals = scopedWithdrawals.filter((w) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchName = w.user?.name && w.user.name.toLowerCase().includes(term);
    const matchPhone = w.user?.phone && w.user.phone.includes(term);
    const matchSheba = w.sheba && w.sheba.toLowerCase().includes(term);
    const matchCard = w.cardNumber && w.cardNumber.includes(term);
    return matchName || matchPhone || matchSheba || matchCard;
  });

  const totalCount = scopedWithdrawals.length;
  const pendingCount = scopedWithdrawals.filter((w) => w.status === "PENDING").length;
  const approvedCount = scopedWithdrawals.filter((w) => w.status === "APPROVED").length;
  const rejectedCount = scopedWithdrawals.filter((w) => w.status === "REJECTED").length;
  const approvedTotalToman = scopedWithdrawals
    .filter((w) => w.status === "APPROVED")
    .reduce((sum, w) => sum + (w.amountToman || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold transition-all animate-slideDown ${
            toast.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-600/30"
              : "bg-rose-600 text-white shadow-rose-600/30"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-admin-text dark:text-white flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-brand-primary dark:text-teal-400" />
            <span>مدیریت درخواست‌های تسویه حساب و کیف پول</span>
          </h1>
          <p className="text-xs text-admin-textMuted dark:text-slate-400 mt-1">
            بررسی و واریز مبالغ تسویه کاربران با نظارت بر تفکیک واریزی‌های مستقیم و بونوس‌های خرید کش‌بک
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/payments"
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-admin-borderLight dark:border-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <CreditCard className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>مدیریت واریزی‌ها (کارت‌به‌کارت)</span>
          </Link>

          <button
            onClick={fetchWithdrawals}
            disabled={isLoading}
            className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-primary/90 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>به‌روزرسانی لحظه‌ای</span>
          </button>
        </div>
      </div>

      {/* Time Range Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-admin-borderLight dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>تفکیک بازه زمانی:</span>
            </span>
            <span className="text-xs font-bold text-brand-primary dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-200/50 dark:border-teal-800/50">
              {getTimeRangeLabel()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
            {timeRangePresets.map((pill) => {
              const isActive = timeRange === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setTimeRange(pill.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-brand-primary text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60"
                  }`}
                >
                  {pill.id === "yesterday" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Jalali Date Picker */}
        {timeRange === "custom" && (
          <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 rounded-xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                انتخاب بازه دقیق تقویم شمسی:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400">از تاریخ:</span>
                <div className="w-40">
                  <JalaliDatePickerInput
                    value={customStartDate}
                    onChange={setCustomStartDate}
                    placeholder="۱۴۰۳/۰۱/۰۱"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-400">تا تاریخ:</span>
                <div className="w-40">
                  <JalaliDatePickerInput
                    value={customEndDate}
                    onChange={setCustomEndDate}
                    placeholder="امروز"
                  />
                </div>
              </div>
            </div>

            {(customStartDate || customEndDate) && (
              <button
                onClick={() => {
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <X className="w-3.5 h-3.5" />
                <span>پاکسازی بازه</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-5 shadow-card hover:shadow-xl hover:shadow-amber-500/5 hover:border-amber-400/40 dark:hover:border-amber-400/30 hover:-translate-y-1.5 transition-all duration-300 flex items-center gap-4">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative z-10">
            <Clock className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">در انتظار بررسی</span>
            <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5 tracking-tight flex items-center gap-1.5">
              <span>{pendingCount} مورد</span>
              {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-5 shadow-card hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-400/40 dark:hover:border-emerald-400/30 hover:-translate-y-1.5 transition-all duration-300 flex items-center gap-4">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative z-10">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">واریز شده</span>
            <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 tracking-tight">
              {approvedCount} مورد
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-5 shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-400/40 dark:hover:border-teal-400/30 hover:-translate-y-1.5 transition-all duration-300 flex items-center gap-4">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-brand-primary dark:text-teal-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative z-10">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">مجموع مبالغ تسویه شده</span>
            <div className="text-lg font-black font-mono text-brand-primary dark:text-teal-300 mt-0.5 tracking-tight">
              {formatPrice(approvedTotalToman)} تومان
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-5 shadow-card hover:shadow-xl hover:shadow-rose-500/5 hover:border-rose-400/40 dark:hover:border-rose-400/30 hover:-translate-y-1.5 transition-all duration-300 flex items-center gap-4">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative z-10">
            <XCircle className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">رد شده</span>
            <div className="text-xl font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5 tracking-tight">
              {rejectedCount} مورد
            </div>
          </div>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 text-xs text-teal-950 dark:text-teal-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-brand-primary dark:text-teal-400" />
        <div className="space-y-1">
          <span className="font-bold">قانون کنترل سقف برداشت واریزی نقدی:</span>
          <p className="leading-relaxed opacity-90">
            کاربران تنها مجاز به برداشت مبالغی هستند که به عنوان <b>واریز مستقیم نقدی (Direct Deposit)</b> در حساب دارند.
            اعتبارات <b>کش‌بک (Cashback Bonus)</b> صرفاً برای خرید محصولات و اشتراک‌های سایت قابل استفاده بوده و نباید تسویه ریالی شوند. سیستم به صورت خودکار سقف مجاز را اعتبارسنجی می‌کند.
          </p>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white dark:bg-slate-900 border border-admin-borderLight dark:border-slate-800 rounded-2xl p-4 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: "همه درخواست‌ها", count: totalCount },
            { id: "PENDING", label: "در انتظار بررسی", count: pendingCount, color: "text-amber-600" },
            { id: "APPROVED", label: "واریز شده", count: approvedCount, color: "text-emerald-600" },
            { id: "REJECTED", label: "رد شده", count: rejectedCount, color: "text-rose-600" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-brand-primary text-white shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 hover:text-black dark:hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  statusFilter === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap md:flex-nowrap">
          {/* Active User Filter Badge */}
          {userIdFilter && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-medium animate-in fade-in duration-200">
              <Users className="w-3.5 h-3.5 text-brand-primary dark:text-teal-400" />
              <span>فیلتر کاربر: <b>{userFilterName || userIdFilter}</b></span>
              <button
                type="button"
                onClick={() => {
                  setUserIdFilter("");
                  setUserFilterName("");
                }}
                className="p-0.5 hover:bg-teal-200 dark:hover:bg-teal-900 rounded-full transition-colors mr-1 cursor-pointer"
                title="حذف فیلتر کاربر"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Search */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی نام، تلفن، شبا یا کارت..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 pl-8 text-xs text-slate-800 dark:text-slate-100 outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-admin-borderLight dark:border-slate-800 rounded-2xl shadow-card overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-brand-primary" />
            <span>در حال بارگذاری لیست درخواست‌های تسویه...</span>
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="py-20 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <Clock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold">هیچ درخواستی با این مشخصات یافت نشد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[850px] w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-admin-borderLight dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                  <th className="py-3.5 pr-4">شناسه و تاریخ</th>
                  <th className="py-3.5">کاربر متقاضی</th>
                  <th className="py-3.5">مبلغ درخواستی</th>
                  <th className="py-3.5">تفکیک کیف پول کاربر</th>
                  <th className="py-3.5">مشخصات حساب مقصد</th>
                  <th className="py-3.5">وضعیت</th>
                  <th className="py-3.5 pl-4 text-left">عملیات مالی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredWithdrawals.map((req) => {
                  const directDeposit = req.user?.directDepositBalance ?? 0;
                  const cashbackBonus = req.user?.cashbackBonusBalance ?? 0;
                  const totalWallet = req.user?.walletBalanceToman ?? 0;
                  const isExceedingDirect = req.amountToman > directDeposit;

                  const detectedBank = req.bankName || (req.sheba ? validateIranianSheba(req.sheba).bankName : (req.cardNumber ? validateIranianCardNumber(req.cardNumber).bankName : null));
                  const cleanSheba = req.sheba ? req.sheba.replace(/[\s-]/g, '').toUpperCase() : '';
                  const cleanCard = req.cardNumber ? req.cardNumber.replace(/\D/g, '') : '';

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {/* ID & Date */}
                      <td className="py-4 pr-4">
                        <span className="font-mono text-slate-600 dark:text-slate-300 font-bold block">
                          #{req.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5 block font-mono">
                          {toPersianDate(req.createdAt)}
                        </span>
                      </td>

                      {/* User Info */}
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-slate-800 text-brand-primary dark:text-teal-400 flex items-center justify-center font-bold">
                            {req.user?.name ? req.user.name.slice(0, 1) : "ک"}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {req.user?.name || "کاربر ناشناس"}
                              </span>
                              {req.user?.id && (
                                <button
                                  type="button"
                                  title="فیلتر درخواست‌های این کاربر"
                                  onClick={() => {
                                    setUserIdFilter(req.user.id);
                                    setUserFilterName(req.user.name || req.user.phone || req.user.id);
                                  }}
                                  className="p-0.5 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded text-slate-400 hover:text-brand-primary dark:hover:text-teal-400 transition-colors cursor-pointer"
                                >
                                  <Filter className="w-3 h-3" />
                                </button>
                              )}
                              {req.user?.id && (
                                <Link
                                  href={`/admin/payments?search=${encodeURIComponent(req.user.phone || req.user.name || req.user.id)}`}
                                  title="مشاهده واریزی‌های کارت‌به‌کارت این کاربر"
                                  className="p-0.5 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                            <span className="font-mono text-[11px] text-slate-400 dir-ltr text-right block">
                              {req.user?.phone || req.user?.email || "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Requested Amount */}
                      <td className="py-4">
                        <div className="font-black font-mono text-sm text-slate-900 dark:text-white">
                          {formatPrice(req.amountToman)} تومان
                        </div>
                        {isExceedingDirect ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-1">
                            <ShieldAlert className="w-3 h-3" />
                            <span>فراتر از واریز مستقیم!</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>سقف مجاز تایید شده</span>
                          </span>
                        )}
                      </td>

                      {/* Wallet Breakdown Details */}
                      <td className="py-4">
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500">واریز مستقیم:</span>
                            <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              {formatPrice(directDeposit)} ت
                            </strong>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500">بونوس کش‌بک:</span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                              {formatPrice(cashbackBonus)} ت
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">موجودی کل والت:</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                              {formatPrice(totalWallet)} ت
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Destination Bank Account */}
                      <td className="py-4">
                        <div className="space-y-1">
                          {detectedBank && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800/60 mb-0.5">
                              <CreditCard className="w-3 h-3" />
                              <span>{detectedBank}</span>
                            </div>
                          )}
                          {req.sheba && (
                            <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 dir-ltr text-left">
                              <span>{req.sheba}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(cleanSheba, "شماره شبا")}
                                className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 p-0.5 transition-colors cursor-pointer"
                                title="کپی شماره شبا جهت پایا/ساتنا"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {req.cardNumber && (
                            <div className="flex items-center gap-1 font-mono text-xs text-slate-700 dark:text-slate-300 dir-ltr text-left">
                              <span>{formatCardNumber(req.cardNumber)}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(cleanCard, "شماره کارت")}
                                className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 p-0.5 transition-colors cursor-pointer"
                                title="کپی شماره کارت ۱۶ رقمی"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {req.accountOwnerName && (
                            <span className="text-[10px] text-slate-500 block font-medium">
                              به نام: {req.accountOwnerName}
                            </span>
                          )}
                          {req.userNote && (
                            <span className="text-[10px] text-slate-400 italic block mt-0.5">
                              یادداشت کاربر: {req.userNote}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4">
                        {req.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>در انتظار بررسی</span>
                          </span>
                        )}
                        {req.status === "APPROVED" && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-full text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>واریز شد</span>
                            </span>
                            {req.bankTrackingCode && (
                              <div className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                                <span>پیگیری: {req.bankTrackingCode}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(req.bankTrackingCode, "کد رهگیری")}
                                  className="text-emerald-600 hover:text-emerald-800 p-0.5 cursor-pointer"
                                  title="کپی کد رهگیری"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            {req.bankReceiptUrl && (
                              <a
                                href={req.bankReceiptUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 hover:underline"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>مشاهده رسید</span>
                              </a>
                            )}
                          </div>
                        )}
                        {req.status === "REJECTED" && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 px-2.5 py-1 rounded-full text-[10px] font-bold">
                              <XCircle className="w-3 h-3" />
                              <span>رد شده (وجه عودت یافت)</span>
                            </span>
                            {req.adminNote && (
                              <div className="text-[10px] text-rose-600 dark:text-rose-400 max-w-xs leading-relaxed">
                                {req.adminNote}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-4 text-left">
                        {req.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenProcessModal(req, "APPROVE")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>تایید واریز</span>
                            </button>
                            <button
                              onClick={() => handleOpenProcessModal(req, "REJECT")}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>رد</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">پردازش شده</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PROCESS MODAL (APPROVE / REJECT)                                          */}
      {/* ========================================================================= */}
      {selectedReq && modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-admin-borderLight dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {modalAction === "APPROVE" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">تایید و ثبت واریز تسویه</h3>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">رد درخواست تسویه</h3>
                  </>
                )}
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProcess} className="space-y-4 text-xs">
              {/* Summary Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">کاربر:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedReq.user?.name} ({selectedReq.user?.phone})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">مبلغ درخواستی:</span>
                  <strong className="font-mono text-sm font-black text-brand-primary dark:text-teal-400">
                    {formatPrice(selectedReq.amountToman)} تومان
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">بانک مقصد:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedReq.bankName || (selectedReq.sheba ? validateIranianSheba(selectedReq.sheba).bankName : (selectedReq.cardNumber ? validateIranianCardNumber(selectedReq.cardNumber).bankName : "بانک شتاب"))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">شماره شبا / کارت:</span>
                  <div className="flex items-center gap-1 font-mono dir-ltr">
                    <span>{selectedReq.sheba || selectedReq.cardNumber || "—"}</span>
                    {(selectedReq.sheba || selectedReq.cardNumber) && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedReq.sheba?.replace(/[\s-]/g, '') || selectedReq.cardNumber?.replace(/\D/g, ''), "حساب مقصد")}
                        className="text-teal-600 hover:text-teal-700 p-0.5 cursor-pointer"
                        title="کپی"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                {selectedReq.accountOwnerName && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">صاحب حساب:</span>
                    <span>{selectedReq.accountOwnerName}</span>
                  </div>
                )}
              </div>

              {modalAction === "APPROVE" ? (
                <>
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                    با تایید این درخواست، وضعیت تسویه نهایی شده و ایمیل رسمی حاوی کد رهگیری بانکی برای کاربر ارسال می‌شود.
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      کد رهگیری / شماره ارجاع بانکی (الزامی):
                    </label>
                    <input
                      type="text"
                      value={bankTrackingCode}
                      onChange={(e) => setBankTrackingCode(e.target.value)}
                      placeholder="مثلاً PAYA-9482017462 یا شماره ارجاع پایا"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2.5 px-3 font-mono text-left dir-ltr font-bold outline-none"
                      required
                    />
                    <span className="text-[10px] text-neutral-400 mt-1 block">
                      این کد در رسید مشتری و سامانه رهگیری بانک مرکزی نمایش داده خواهد شد.
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      لینک رسید یا تصویر فیش واریزی (اختیاری):
                    </label>
                    <input
                      type="url"
                      value={bankReceiptUrl}
                      onChange={(e) => setBankReceiptUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 font-mono text-left dir-ltr outline-none text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      یادداشت اختیاری مدیر:
                    </label>
                    <input
                      type="text"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="پیام یا توضیح تکمیلی در صورت نیاز..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-[11px] text-rose-800 dark:text-rose-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>عودت آنی وجه به کیف پول کاربر</span>
                    </div>
                    <p className="leading-relaxed opacity-95">
                      با ثبت رد این درخواست، مبلغ <b>{formatPrice(selectedReq.amountToman)} تومان</b> به صورت خودکار و اتمیک به موجودی قابل تسویه و کیف پول کاربر بازگردانده شده و ایمیل رسمی دلیل رد برای کاربر ارسال می‌گردد.
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      علت رد درخواست (الزامی - جهت نمایش و ایمیل به کاربر):
                    </label>
                    <textarea
                      rows={3}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="لطفاً علت رد درخواست را بنویسید (مثلاً: عدم تطابق شماره شبا با نام دارنده حساب، درخواست خارج از سقف مجاز، مسدودی حساب مقصد و...)"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 outline-none"
                      required
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${
                    modalAction === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{modalAction === "APPROVE" ? "تایید و ثبت نهایی واریز" : "ثبت رد و عودت وجه"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
