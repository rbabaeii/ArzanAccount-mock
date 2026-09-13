"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatPrice, formatNumber } from "@/lib/format";
import { CARD_BIN_MAP, formatCardNumber } from "@/lib/iranian-banks";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Settings,
  ShieldCheck,
  AlertCircle,
  X,
  Check,
  Copy,
  ExternalLink,
  Wallet,
  ShoppingBag,
  FileText,
  Sliders,
  Sparkles,
} from "lucide-react";

export default function AdminPaymentsPage() {
  const { user: currentAdmin } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [modalAction, setModalAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Receipt image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsData, setSettingsData] = useState<{
    apiKey: string;
    hasApiKey: boolean;
    enabled: boolean;
    fallbackCardNumber: string;
    fallbackCardOwner: string;
    fallbackBankName: string;
  }>({
    apiKey: "",
    hasApiKey: false,
    enabled: true,
    fallbackCardNumber: "",
    fallbackCardOwner: "",
    fallbackBankName: "",
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const copyToClipboard = (text: string, label: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      showToast("success", `${label} کپی شد: ${text}`);
    }
  };

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminCardPayments({
        status: statusFilter,
        type: typeFilter,
        search: searchTerm,
        role: currentAdmin?.role || "SUPER_ADMIN",
      });
      if (res && res.items) {
        setPayments(res.items);
        setTotalCount(res.total || res.items.length);
      }
    } catch (err: any) {
      console.error("Failed to fetch card payments:", err);
      showToast("error", err?.message || "خطا در دریافت لیست پرداخت‌های کارت‌به‌کارت.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter, searchTerm, currentAdmin?.role]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      const res = await api.getCartBeCartSettings(currentAdmin?.role || "SUPER_ADMIN");
      if (res) {
        setSettingsData({
          ...res,
          apiKey: "", // Do not prefill masked key in the input box
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch CartBeCart settings:", err);
    }
  };

  const handleOpenSettings = () => {
    fetchSettings();
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const cleanApiKey =
        settingsData.apiKey && !settingsData.apiKey.includes("...")
          ? settingsData.apiKey.trim()
          : undefined;

      await api.updateCartBeCartSettings(
        {
          apiKey: cleanApiKey,
          fallbackCardNumber: settingsData.fallbackCardNumber,
          fallbackCardOwner: settingsData.fallbackCardOwner,
          fallbackBankName: settingsData.fallbackBankName,
          enabled: settingsData.enabled,
        },
        currentAdmin?.role || "SUPER_ADMIN"
      );
      showToast("success", "تنظیمات درگاه کارت‌به‌کارت CartBeCart با موفقیت ذخیره شد.");
      setIsSettingsOpen(false);
    } catch (err: any) {
      showToast("error", err?.message || "خطا در ذخیره تنظیمات.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle Approve
  const handleApprove = async () => {
    if (!selectedPayment) return;
    setIsProcessing(true);
    try {
      await api.adminApproveCardPayment(
        selectedPayment.id,
        { adminNote },
        {
          id: currentAdmin?.id,
          name: currentAdmin?.name || "مدیر مالی",
          phone: currentAdmin?.phone,
          role: currentAdmin?.role || "SUPER_ADMIN",
        }
      );
      showToast("success", `تراکنش #${selectedPayment.orderNumber} با موفقیت تأیید شد.`);
      setSelectedPayment(null);
      setModalAction(null);
      setAdminNote("");
      fetchPayments();
    } catch (err: any) {
      showToast("error", err?.message || "خطا در تأیید تراکنش.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!selectedPayment) return;
    if (!rejectReason.trim()) {
      showToast("error", "علت رد تراکنش الزامی است.");
      return;
    }
    setIsProcessing(true);
    try {
      await api.adminRejectCardPayment(
        selectedPayment.id,
        { reason: rejectReason.trim() },
        {
          id: currentAdmin?.id,
          name: currentAdmin?.name || "مدیر مالی",
          phone: currentAdmin?.phone,
          role: currentAdmin?.role || "SUPER_ADMIN",
        }
      );
      showToast("success", `تراکنش #${selectedPayment.orderNumber} رد شد.`);
      setSelectedPayment(null);
      setModalAction(null);
      setRejectReason("");
      fetchPayments();
    } catch (err: any) {
      showToast("error", err?.message || "خطا در رد تراکنش.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Stats calculation
  const pendingReviewCount = payments.filter((p) => p.status === "MANUAL_REVIEW").length;
  const autoVerifiedCount = payments.filter((p) => p.status === "PAID").length;
  const approvedCount = payments.filter((p) => p.status === "APPROVED").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "MANUAL_REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>در انتظار بررسی دستی</span>
          </span>
        );
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تأیید خودکار آنی (CartBeCart)</span>
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>تأیید شده توسط ادمین</span>
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>در انتظار واریز کاربر</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>رد شده</span>
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border border-neutral-500/30">
            <span>منقضی شده</span>
          </span>
        );
      default:
        return <span className="text-xs font-mono">{status}</span>;
    }
  };

  return (
    <div dir="rtl" className="space-y-6 pb-16">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 left-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <span>مدیریت پرداخت‌های کارت‌به‌کارت</span>
            <span className="text-xs bg-teal-500/15 text-teal-600 dark:text-teal-400 font-mono px-2 py-0.5 rounded-full border border-teal-500/30">
              CartBeCart + Fallback
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            بررسی تراکنش‌های خودکار، تأیید فیش‌های واریز دستی کاربران و تنظیمات اتصال وب‌سرویس
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenSettings}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Settings className="w-4 h-4 text-teal-500" />
            <span>تنظیمات درگاه</span>
          </button>

          <button
            type="button"
            onClick={fetchPayments}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>بروزرسانی</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block mb-1">
              در انتظار بررسی دستی
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {pendingReviewCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              تأیید شده آنی (خودکار)
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {autoVerifiedCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              تأیید شده دستی (ادمین)
            </span>
            <span className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono">
              {approvedCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              کل تراکنش‌ها
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totalCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="جستجو با شماره سفارش، کد رهگیری یا کارت..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 pr-9 pl-3 text-xs outline-none focus:border-teal-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Payment Type Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 whitespace-nowrap">نوع تراکنش:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl py-2 px-3 text-xs outline-none"
            >
              <option value="all">همه انواع</option>
              <option value="ORDER">پرداخت سفارش (ORDER)</option>
              <option value="WALLET_TOPUP">شارژ کیف پول (WALLET)</option>
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 dark:border-slate-800/60 pt-3">
          {[
            { id: "all", label: "همه تراکنش‌ها" },
            { id: "MANUAL_REVIEW", label: "در انتظار بررسی دستی", badge: pendingReviewCount },
            { id: "PAID", label: "تأیید خودکار آنی" },
            { id: "APPROVED", label: "تأیید شده ادمین" },
            { id: "PENDING", label: "در انتظار واریز" },
            { id: "REJECTED", label: "رد شده" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full text-[10px]">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table / List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-card overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-teal-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">در حال بارگذاری تراکنش‌ها...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <CreditCard className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              هیچ تراکنشی با فیلترهای انتخابی یافت نشد.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 font-bold">شناسه / مرجع</th>
                  <th className="py-3.5 px-4 font-bold">نوع</th>
                  <th className="py-3.5 px-4 font-bold">مبلغ (تومان)</th>
                  <th className="py-3.5 px-4 font-bold">ارقام اعشاری / ریال</th>
                  <th className="py-3.5 px-4 font-bold">اطلاعات واریز / کد رهگیری</th>
                  <th className="py-3.5 px-4 font-bold">فیش پیوست</th>
                  <th className="py-3.5 px-4 font-bold">وضعیت</th>
                  <th className="py-3.5 px-4 font-bold">تاریخ</th>
                  <th className="py-3.5 px-4 font-bold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Reference / Order Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span>#{p.orderNumber}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(p.orderNumber, "شماره سفارش")}
                          className="text-slate-400 hover:text-teal-500"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        توکن: {p.paymentToken}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-4">
                      {p.paymentType === "WALLET_TOPUP" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold text-[11px]">
                          <Wallet className="w-3 h-3" />
                          <span>شارژ کیف پول</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                          <ShoppingBag className="w-3 h-3" />
                          <span>سفارش محصول</span>
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900 dark:text-white">
                      {formatNumber(p.amountToman)} تومان
                    </td>

                    {/* Unique Amount */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-teal-700 dark:text-teal-300">
                      {p.uniqueAmountRial ? (
                        <div>
                          <span>{formatNumber(p.uniqueAmountRial)} ریال</span>
                          <span className="block text-[10px] text-slate-400 font-normal">
                            (رند: {formatNumber(Math.ceil(p.uniqueAmountRial / 10))} ت)
                          </span>
                        </div>
                      ) : (
                        <span>{formatNumber(p.amountRial)} ریال</span>
                      )}
                    </td>

                    {/* Tracking Code & User Card */}
                    <td className="py-3.5 px-4 space-y-0.5">
                      {p.trackingCode ? (
                        <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-mono font-bold">
                          <span>کد: {p.trackingCode}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.trackingCode, "کد رهگیری")}
                            className="text-slate-400 hover:text-teal-500"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">ثبت نشده (پایش خودکار)</span>
                      )}

                      {p.userCardNumber && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          کارت مبدا: {p.userCardNumber}
                        </div>
                      )}
                      {p.userNote && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 line-clamp-1">
                          یادداشت: {p.userNote}
                        </p>
                      )}
                    </td>

                    {/* Receipt Image */}
                    <td className="py-3.5 px-4">
                      {p.receiptUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImage(p.receiptUrl)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 hover:scale-105 transition-all text-[11px] font-bold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>مشاهده رسید</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">بدون تصویر</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getStatusBadge(p.status)}</td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Intl.DateTimeFormat("fa-IR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(p.createdAt))}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {(p.status === "MANUAL_REVIEW" || p.status === "PENDING") && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPayment(p);
                                setModalAction("APPROVE");
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>تأیید</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPayment(p);
                                setModalAction("REJECT");
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all active:scale-95"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>رد</span>
                            </button>
                          </>
                        )}

                        {p.status === "APPROVED" && (
                          <span className="text-[10px] text-teal-600 dark:text-teal-400">
                            توسط {p.reviewedByAdminName || "ادمین"}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: APPROVE CONFIRMATION */}
      {modalAction === "APPROVE" && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold text-sm">تأیید پرداخت کارت‌به‌کارت</h3>
              </div>
              <button
                onClick={() => setModalAction(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <p className="font-bold">
                آیا از تأیید پرداخت تراکنش #{selectedPayment.orderNumber} به مبلغ{" "}
                {formatNumber(selectedPayment.amountToman)} تومان اطمینان دارید؟
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                {selectedPayment.paymentType === "WALLET_TOPUP"
                  ? "مبلغ فوق مستقیماً به موجودی کیف پول کاربر اضافه خواهد شد."
                  : "سفارش مشتری به وضعیت پرداخت‌شده تغییر کرده و فرآیند صدور اکانت آغاز می‌شود."}
              </p>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                یادداشت حسابداری (اختیاری):
              </label>
              <input
                type="text"
                placeholder="مثال: استعلام از همراه بانک شد و واریزی صحیح است"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>تأیید نهایی و اعمال</span>
              </button>
              <button
                type="button"
                onClick={() => setModalAction(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT CONFIRMATION */}
      {modalAction === "REJECT" && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <XCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm">رد پرداخت کارت‌به‌کارت</h3>
              </div>
              <button
                onClick={() => setModalAction(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                علت رد درخواست: <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="علت رد را وارد کنید (مثال: عدم واریز به حساب، فیش مخدوش، کد پیگیری نامعتبر)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs outline-none resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleReject}
                disabled={isProcessing || !rejectReason.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                <span>رد پرداخت</span>
              </button>
              <button
                type="button"
                onClick={() => setModalAction(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RECEIPT IMAGE PREVIEW */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl p-2"
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 left-4 z-10 w-9 h-9 rounded-xl bg-slate-950/70 text-white flex items-center justify-center hover:bg-slate-950 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Receipt Preview"
              className="max-h-[82vh] w-auto mx-auto object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* MODAL 4: CARTBECART SETTINGS */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <Settings className="w-5 h-5" />
                <h3 className="font-bold text-sm">تنظیمات درگاه کارت‌به‌کارت (CartBeCart)</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="font-bold text-slate-800 dark:text-white block">
                    فعال بودن درگاه کارت‌به‌کارت
                  </span>
                  <span className="text-[11px] text-slate-400">
                    نمایش گزینه کارت‌به‌کارت در صفحه پرداخت و شارژ کیف پول
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settingsData.enabled}
                  onChange={(e) =>
                    setSettingsData((prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                  className="w-5 h-5 accent-teal-600 rounded cursor-pointer"
                />
              </div>

              {/* API Key */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  کلید وب‌سرویس CartBeCart (API Key):
                </label>
                <input
                  type="password"
                  placeholder={
                    settingsData.hasApiKey
                      ? "کلید تنظیم شده است (برای تغییر، مقدار جدید را وارد کنید)"
                      : "کلید API خود از پنل CartBeCart را وارد نمایید"
                  }
                  value={settingsData.apiKey}
                  onChange={(e) =>
                    setSettingsData((prev) => ({ ...prev, apiKey: e.target.value }))
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs outline-none font-mono dir-ltr"
                />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  از داشبورد اختصاصی در{" "}
                  <a
                    href="https://cartbecart.com/dashboard/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-500 underline"
                  >
                    cartbecart.com
                  </a>{" "}
                  قابل دریافت است.
                </p>
              </div>

              {/* Fallback Card Number */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  شماره کارت مقصد پشتیبان (Fallback Card):
                </label>
                <input
                  type="text"
                  placeholder="6037998123456789"
                  value={settingsData.fallbackCardNumber}
                  onChange={(e) =>
                    setSettingsData((prev) => ({ ...prev, fallbackCardNumber: e.target.value }))
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs outline-none font-mono dir-ltr"
                />
                <p className="text-[10px] text-slate-400">
                  در صورت بروز اختلال در وب‌سرویس یا عدم تنظیم API Key، این کارت به کاربر نمایش داده
                  می‌شود.
                </p>
              </div>

              {/* Fallback Card Owner */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  نام صاحب حساب پشتیبان:
                </label>
                <input
                  type="text"
                  placeholder="نام و نام خانوادگی صاحب کارت"
                  value={settingsData.fallbackCardOwner}
                  onChange={(e) =>
                    setSettingsData((prev) => ({ ...prev, fallbackCardOwner: e.target.value }))
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs outline-none"
                />
              </div>

              {/* Fallback Bank Name */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  نام بانک مقصد:
                </label>
                <input
                  type="text"
                  placeholder="بانک ملی ایران"
                  value={settingsData.fallbackBankName}
                  onChange={(e) =>
                    setSettingsData((prev) => ({ ...prev, fallbackBankName: e.target.value }))
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingSettings ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>ذخیره تنظیمات</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  بستن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
