"use client";

import { formatPrice, formatNumber } from "@/lib/format";

import React, { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Order } from "@/types";
import {
  ShoppingCart,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  X,
  Send,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  Printer,
  Edit3,
  Save,
  RotateCcw,
  Ban,
  User,
  Mail,
  Phone,
  Link as LinkIcon,
  Key,
  Calendar,
  CreditCard,
  Layers,
  UserCheck,
  TrendingUp,
  DollarSign,
  BadgeCheck,
  ArrowRight,
  Lock,
} from "lucide-react";

import { toPersianDateTime } from "@/lib/date";
import Pagination from "@/components/ui/Pagination";
import { OrderInvoiceModal } from "@/components/admin/OrderInvoiceModal";

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus, settings } = useStore();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"all" | "my_approved">("all");
  const [myTimeRange, setMyTimeRange] = useState<"all" | "today" | "yesterday" | "7d" | "30d" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Editing credentials state inside modal
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [editCredentialsText, setEditCredentialsText] = useState("");
  const [saveToast, setSaveToast] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [emailToast, setEmailToast] = useState<string | null>(null);

  const handleResendEmail = async (order: Order) => {
    setIsResendingEmail(true);
    try {
      await api.sendOrderReceiptEmail({
        orderNumber: order.orderNumber,
        customerName: order.customerEmail.split("@")[0],
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        createdAt: toPersianDateTime(order.createdAt),
        items: order.items.map((it) => ({
          productTitle: it.productTitle,
          quantity: it.quantity,
          priceToman: it.priceToman,
          priceUsd: it.priceUsd,
        })),
        deliveredAccounts: order.deliveredAccounts,
        totalPriceToman: order.totalPriceToman,
        totalPriceUsd: order.totalPriceUsd,
      });
      setEmailToast(`ایمیل رسید و لایسنس با موفقیت به ${order.customerEmail} ارسال شد!`);
      setTimeout(() => setEmailToast(null), 3500);
    } catch (err: any) {
      setEmailToast(err?.message || "خطا در ارسال ایمیل.");
      setTimeout(() => setEmailToast(null), 3500);
    } finally {
      setIsResendingEmail(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      (o.customerPhone && o.customerPhone.includes(search));

    const matchesStatus = statusFilter === "all" ? true : o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter for current admin's approved orders
  const myApprovedOrders = orders.filter((o) => {
    // Check if approved by this admin (or in demo mode, if delivered and matches or admin has support/super role)
    const isApprovedByMe =
      o.approvedByAdminId === user?.id ||
      (user?.name && o.approvedByAdminName && o.approvedByAdminName.toLowerCase().includes(user.name.toLowerCase())) ||
      (o.status === "delivered" && (user?.role === "SUPPORT_ADMIN" || user?.role === "SUPER_ADMIN") && !o.approvedByAdminId);

    if (!isApprovedByMe) return false;

    // Time filter
    const targetDate = new Date(o.approvedAt || o.createdAt);
    const now = new Date();

    if (myTimeRange === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (targetDate < start) return false;
    } else if (myTimeRange === "yesterday") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (targetDate < start || targetDate >= end) return false;
    } else if (myTimeRange === "7d") {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (targetDate < start) return false;
    } else if (myTimeRange === "30d") {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (targetDate < start) return false;
    } else if (myTimeRange === "custom") {
      if (customStartDate && targetDate < new Date(customStartDate)) return false;
      if (customEndDate && targetDate > new Date(customEndDate + "T23:59:59")) return false;
    }

    if (search) {
      const q = search.toLowerCase();
      const matches =
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        (o.customerPhone && o.customerPhone.includes(q)) ||
        o.items.some((it) => it.productTitle.toLowerCase().includes(q));
      if (!matches) return false;
    }

    return true;
  });

  const myTotalToman = myApprovedOrders.reduce((acc, o) => acc + (o.totalPriceToman || 0), 0);
  const myTotalUsd = myApprovedOrders.reduce((acc, o) => acc + (o.totalPriceUsd || 0), 0);
  const myDeliveredLicensesCount = myApprovedOrders.reduce((acc, o) => acc + (o.deliveredAccounts?.length || 0), 0);

  const currentDisplayOrders = activeTab === "my_approved" ? myApprovedOrders : filteredOrders;
  const totalPages = Math.ceil(currentDisplayOrders.length / itemsPerPage);
  const paginatedOrders = currentDisplayOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsEditingCredentials(false);
    setEditCredentialsText(order.deliveredAccounts?.join("\n") || "");
  };

  const handleSaveCredentials = () => {
    if (!selectedOrder) return;
    const accounts = editCredentialsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const adminInfo = {
      id: user?.id,
      name: user?.name,
      phone: user?.phone,
      role: user?.role || "SUPER_ADMIN",
    };

    updateOrderStatus(selectedOrder.id, selectedOrder.status, accounts, adminInfo);
    setSelectedOrder({
      ...selectedOrder,
      deliveredAccounts: accounts,
      approvedByAdminId: user?.id,
      approvedByAdminName: user?.name,
      approvedAt: new Date().toISOString(),
    });
    setIsEditingCredentials(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleStatusChange = (status: Order["status"]) => {
    if (!selectedOrder) return;
    const adminInfo = {
      id: user?.id,
      name: user?.name,
      phone: user?.phone,
      role: user?.role || "SUPER_ADMIN",
    };
    updateOrderStatus(selectedOrder.id, status, undefined, adminInfo);
    setSelectedOrder({
      ...selectedOrder,
      status,
      approvedByAdminId: user?.id,
      approvedByAdminName: user?.name,
      approvedAt: new Date().toISOString(),
    });
  };

  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const processingCount = orders.filter((o) => o.status === "processing").length;
  const failedCount = orders.filter((o) => o.status === "failed" || o.status === "cancelled").length;



  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-xl text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>مشخصات لایسنس با موفقیت ذخیره و به‌روزرسانی شد!</span>
        </div>
      )}
      {emailToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-teal-800 text-white px-5 py-3 rounded-xl shadow-xl text-xs flex items-center gap-2 animate-bounce">
          <Mail className="w-4 h-4 text-teal-200 shrink-0" />
          <span>{emailToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-admin-text dark:text-white">مدیریت جامع سفارشات</h1>
          <p className="text-xs text-admin-textMuted dark:text-slate-400 mt-1">
            مشاهده جزییات خرید، کدهای رهگیری irMarket، گردش کار پردازش و مدیریت لایسنس‌های تحویل‌شده
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs p-1.5 rounded-2xl border border-admin-borderLight dark:border-slate-800 shadow-2xs">
          <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
            کل سفارشات: <strong className="font-mono text-black dark:text-white mr-1">{orders.length}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200/50 dark:border-emerald-800/40">
            موفق: {deliveredCount}
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold border border-amber-200/50 dark:border-amber-800/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            در انتظار: {processingCount}
          </span>
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-admin-borderLight dark:border-slate-800 pb-3">
        <button
          onClick={() => {
            setActiveTab("all");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 ${
            activeTab === "all"
              ? "bg-gradient-to-r from-brand-primary to-teal-700 text-white shadow-md shadow-teal-500/20"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-admin-borderLight dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>همه سفارشات سیستم</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
            activeTab === "all" ? "bg-white/20 text-white" : "bg-neutral-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}>
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("my_approved");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 ${
            activeTab === "my_approved"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-admin-borderLight dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700"
          }`}
        >
          <BadgeCheck className="w-4 h-4" />
          <span>آمار و سفارشات تایید شده من</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
            activeTab === "my_approved" ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
          }`}>
            {myApprovedOrders.length}
          </span>
        </button>
      </div>

      {/* Personal Statistics Dashboard for Orders Admin */}
      {activeTab === "my_approved" && (
        <div className="space-y-4">
          {/* Admin Info Banner */}
          <div className="bg-gradient-to-r from-purple-900/90 to-indigo-900/90 text-white p-5 rounded-2xl border border-purple-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-800/80 text-purple-200">
                  <UserCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black">
                    کارنامه و آمار تایید سفارشات {user?.name || "مدیر سفارشات"}
                  </h3>
                  <p className="text-xs text-purple-200 mt-0.5">
                    فهرست کلیه سفارشاتی که توسط این حساب بررسی، تایید و لایسنس آن‌ها صادر و تحویل داده شده است.
                  </p>
                </div>
              </div>
            </div>

            {/* Time Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-black/20 backdrop-blur-md p-1.5 rounded-xl border border-white/10 text-xs">
              {[
                { id: "all", label: "همه زمان‌ها" },
                { id: "today", label: "امروز" },
                { id: "yesterday", label: "دیروز" },
                { id: "7d", label: "۷ روز اخیر" },
                { id: "30d", label: "۳۰ روز اخیر" },
                { id: "custom", label: "بازه دلخواه" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setMyTimeRange(pill.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    myTimeRange === pill.id
                      ? "bg-purple-600 text-white shadow-xs font-bold"
                      : "text-purple-200 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Inputs if custom is selected */}
          {myTimeRange === "custom" && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 flex flex-wrap items-center gap-4 text-xs">
              <span className="font-bold text-purple-900 dark:text-purple-300">انتخاب بازه تاریخی دقیق:</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">از تاریخ:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">تا تاریخ:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs outline-none"
                />
              </div>
            </div>
          )}

          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-admin-borderLight dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] text-admin-textMuted dark:text-slate-400 block font-medium">
                سفارشات تایید شده توسط من
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                  {formatNumber(myApprovedOrders.length)}
                </span>
                <span className="text-xs text-neutral-400">سفارش</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-admin-borderLight dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] text-admin-textMuted dark:text-slate-400 block font-medium">
                مجموع فروش تایید شده (تومان)
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {formatPrice(myTotalToman)}
                </span>
                <span className="text-xs text-neutral-400">تومان</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-admin-borderLight dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] text-admin-textMuted dark:text-slate-400 block font-medium">
                مجموع فروش دلاری ($)
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                  ${myTotalUsd.toFixed(2)}
                </span>
                <span className="text-xs text-neutral-400">USD</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-admin-borderLight dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] text-admin-textMuted dark:text-slate-400 block font-medium">
                اکانت و لایسنس تحویل داده شده
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {formatNumber(myDeliveredLicensesCount)}
                </span>
                <span className="text-xs text-neutral-400">اکانت</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-admin-borderLight dark:border-slate-800 shadow-card flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="جستجو با کد سفارش (ARZ-XXXX)، ایمیل یا شماره موبایل خریدار..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-brand-primary dark:focus:border-teal-400 rounded-xl py-2.5 pr-9 pl-3 text-xs outline-none"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-1 bg-admin-bg dark:bg-slate-800 p-1 rounded-xl border border-admin-borderLight dark:border-slate-700 text-xs overflow-x-auto">
          <button
            onClick={() => {
              setStatusFilter("all");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
              statusFilter === "all" ? "bg-white dark:bg-slate-700 text-brand-primary dark:text-teal-300 shadow-xs font-bold" : "text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:text-white dark:hover:text-white"
            }`}
          >
            <span>همه</span>
            <span className="text-[10px] bg-neutral-200 px-1.5 py-0.2 rounded-full font-mono">{orders.length}</span>
          </button>
          <button
            onClick={() => {
              setStatusFilter("delivered");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
              statusFilter === "delivered" ? "bg-emerald-600 text-white shadow-xs font-bold" : "text-neutral-500 hover:text-neutral-900 dark:text-white"
            }`}
          >
            <span>تحویل‌شده</span>
            <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 rounded-full font-mono">{deliveredCount}</span>
          </button>
          <button
            onClick={() => {
              setStatusFilter("processing");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
              statusFilter === "processing" ? "bg-amber-500 text-white shadow-xs font-bold" : "text-neutral-500 hover:text-neutral-900 dark:text-white"
            }`}
          >
            <span>در حال پردازش</span>
            <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.2 rounded-full font-mono">{processingCount}</span>
          </button>
          <button
            onClick={() => {
              setStatusFilter("failed");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1.5 ${
              statusFilter === "failed" ? "bg-red-600 text-white shadow-xs font-bold" : "text-neutral-500 hover:text-neutral-900 dark:text-white"
            }`}
          >
            <span>ناموفق / لغو</span>
            <span className="text-[10px] bg-red-700 text-white px-1.5 py-0.2 rounded-full font-mono">{failedCount}</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 border border-admin-borderLight dark:border-slate-800 rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-admin-container/50 dark:bg-slate-800/80 border-b border-admin-borderLight dark:border-slate-800 text-xs font-bold text-admin-text dark:text-slate-200">
                <th className="py-3.5 px-4">کد سفارش</th>
                <th className="py-3.5 px-4">خریدار</th>
                <th className="py-3.5 px-4">اشتراک خریداری‌شده</th>
                <th className="py-3.5 px-4">مبلغ پرداختی</th>
                <th className="py-3.5 px-4">درگاه</th>
                <th className="py-3.5 px-4">وضعیت</th>
                <th className="py-3.5 px-4 text-center">گردش کار و جزییات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-borderLight dark:divide-slate-800">
              {paginatedOrders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => openOrderDetails(order)}
                  className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-brand-primary">
                    #{order.orderNumber}
                    <span className="block text-[10px] text-neutral-400 font-sans font-normal">
                      {toPersianDateTime(order.createdAt)}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-admin-text dark:text-slate-200 block">{order.customerEmail}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">{order.customerPhone || "---"}</span>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <span className="font-bold text-admin-text dark:text-white block line-clamp-1">
                      {order.items[0]?.productTitle}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      تعداد: {order.items[0]?.quantity} عدد
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold font-mono text-admin-text dark:text-white block">
                      {formatPrice(order.totalPriceToman)} تومان
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      ${order.totalPriceUsd.toFixed(2)} USD
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-[11px] bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                      {order.paymentGateway === "cartbecart"
                        ? "کارت‌به‌کارت"
                        : order.paymentGateway === "zarinpal"
                        ? "زرین‌پال"
                        : order.paymentGateway === "nextpay"
                        ? "نکست‌پی"
                        : "تتر TRC20"}
                    </span>
                  </td>

                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-1">
                      <select
                        value={order.status}
                        onChange={(e) => {
                          const adminInfo = { id: user?.id, name: user?.name, phone: user?.phone, role: user?.role || "SUPER_ADMIN" };
                          updateOrderStatus(order.id, e.target.value as Order["status"], undefined, adminInfo);
                        }}
                        className={`text-xs font-bold py-1 px-2.5 rounded-lg border outline-none cursor-pointer ${
                          order.status === "delivered"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : order.status === "processing"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : order.status === "refund_requested" || order.status === "cancelled"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : order.status === "refunded"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        <option value="delivered">تحویل شده</option>
                        <option value="processing">در حال پردازش</option>
                        <option value="cancelled">لغو شده (ناموفق)</option>
                        <option value="refund_requested">درخواست عودت وجه</option>
                        <option value="refunded">عودت داده شده</option>
                        <option value="failed">ناموفق / خطا</option>
                      </select>
                      {order.refundReason && (
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/60 line-clamp-1">
                          دلیل لغو: {order.refundReason}
                        </div>
                      )}
                      {order.approvedByAdminName && (
                        <div className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>تایید: {order.approvedByAdminName}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openOrderDetails(order)}
                        className="px-2.5 py-1.5 text-brand-primary dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-xl border border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600 transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xs inline-flex items-center gap-1.5 font-bold text-[11px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>مشاهده کامل</span>
                      </button>
                      <button
                        onClick={() => setInvoiceOrder(order)}
                        className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xs inline-flex items-center gap-1.5 font-bold text-[11px]"
                        title="صدور و چاپ فاکتور رسمی"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>فاکتور</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {currentDisplayOrders.length === 0 && (
          <div className="p-8 text-center text-xs text-neutral-400">
            سفارشی با معیارهای فیلتر یافت نشد.
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={currentDisplayOrders.length}
        itemsPerPage={itemsPerPage}
        itemName="سفارش"
        onPageChange={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onItemsPerPageChange={(limit) => {
          setItemsPerPage(limit);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 15, 30, 50]}
      />

      {/* ========================================================================= */}
      {/* ADVANCED ORDER DETAILS & WORKFLOW MODAL (HypeStore Stitch Screen Synchronized) */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-neutral-200 dark:border-slate-800 max-w-5xl w-full my-auto overflow-hidden animate-fadeIn flex flex-col max-h-[92vh]">
            
            {/* Modal Top Bar */}
            <div className="bg-neutral-50/80 dark:bg-slate-900/90 px-6 py-4 border-b border-neutral-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold font-mono text-sm shadow-sm">
                  ARZ
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-black text-base text-slate-900 dark:text-white">
                      سفارش #{selectedOrder.orderNumber}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        selectedOrder.status === "delivered"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-800/80"
                          : selectedOrder.status === "processing"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 dark:border dark:border-amber-800/80 animate-pulse"
                          : "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 dark:border dark:border-red-800/80"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          selectedOrder.status === "delivered"
                            ? "bg-emerald-600 dark:bg-emerald-400"
                            : selectedOrder.status === "processing"
                            ? "bg-amber-600 dark:bg-amber-400"
                            : "bg-red-600 dark:bg-red-400"
                        }`}
                      ></span>
                      <span>
                        {selectedOrder.status === "delivered"
                          ? "تحویل موفق و صادر شده"
                          : selectedOrder.status === "processing"
                          ? "در حال پردازش در سرور و API"
                          : "خطا در صدور یا لغو شده"}
                      </span>
                    </span>
                    <span className="text-[11px] bg-teal-50 dark:bg-teal-950/60 text-brand-primary dark:text-teal-300 border border-teal-200 dark:border-teal-800/70 px-2 py-0.5 rounded-md font-mono">
                      irMarket: {selectedOrder.externalOrderId ? `#${selectedOrder.externalOrderId}` : "شبیه‌سازی ماک امن"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 dark:text-slate-500" />
                      <span>{toPersianDateTime(selectedOrder.createdAt)}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-neutral-400 dark:text-slate-500" />
                      <span>
                        درگاه{" "}
                        {selectedOrder.paymentGateway === "cartbecart"
                          ? "کارت‌به‌کارت (CartBeCart)"
                          : selectedOrder.paymentGateway === "zarinpal"
                          ? "زرین‌پال"
                          : "نکست‌پی"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => handleResendEmail(selectedOrder)}
                  disabled={isResendingEmail}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-xs font-semibold transition-colors disabled:opacity-50"
                  title="ارسال مجدد رسید و لایسنس به ایمیل خریدار"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{isResendingEmail ? "در حال ارسال..." : "ارسال مجدد ایمیل"}</span>
                </button>
                <button
                  onClick={() => setInvoiceOrder(selectedOrder)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                  title="مشاهده و چاپ فاکتور رسمی"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>چاپ فاکتور</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 text-neutral-400 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">

              {/* Admin Approval & Verification Banner */}
              {selectedOrder.approvedByAdminName && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-purple-950 dark:text-purple-100 flex items-center gap-2">
                        <span>بررسی و تایید شده توسط مدیر:</span>
                        <span className="bg-purple-200 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 px-2 py-0.5 rounded-md font-mono text-[11px]">
                          {selectedOrder.approvedByAdminName}
                        </span>
                        {selectedOrder.approvedByAdminPhone && (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                            ({selectedOrder.approvedByAdminPhone})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                        مسئولیت بررسی درگاه، صدور لایسنس و تحویل اطلاعات اشتراک به خریدار بر عهده این مدیر ثبت گردیده است.
                      </p>
                    </div>
                  </div>
                  {selectedOrder.approvedAt && (
                    <div className="text-left sm:text-right shrink-0 bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-purple-200/60 dark:border-purple-800/40">
                      <span className="text-[10px] text-neutral-400 block">زمان دقیق ثبت تایید:</span>
                      <span className="text-xs font-mono font-bold text-purple-800 dark:text-purple-300">
                        {toPersianDateTime(selectedOrder.approvedAt)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 1. Interactive Workflow Stepper (Lifecycle) */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-neutral-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-5 bg-brand-primary rounded-full"></span>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">گردش کار و چرخه پردازش سفارش</h3>
                  </div>
                  <span className="text-[11px] bg-teal-50 dark:bg-teal-950/60 text-brand-primary dark:text-teal-300 px-2 py-0.5 rounded-md font-medium border border-teal-200 dark:border-teal-800/70">
                    {selectedOrder.status === "delivered" ? "چرخه ۱۰۰٪ تکمیل شده" : "در حال اجرای فرآیند خودکار"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
                  {/* Step 1: Payment */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-emerald-950 dark:text-emerald-200">۱. ثبت و پرداخت ریالی</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5">تایید شتاب بانکی</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 font-semibold">موفق</span>
                    </div>
                  </div>

                  {/* Step 2: Validation */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-emerald-950 dark:text-emerald-200">۲. اعتبارسنجی شرایط</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5">تطبیق ایمیل و شروط</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 font-semibold">تایید پارامترها</span>
                    </div>
                  </div>

                  {/* Step 3: irMarket API Call */}
                  <div
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      selectedOrder.status === "delivered"
                        ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60"
                        : selectedOrder.status === "processing"
                        ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 ring-2 ring-amber-300/40 dark:ring-amber-800/40"
                        : "bg-red-50/70 dark:bg-red-950/40 border-red-200 dark:border-red-800/60"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs text-white ${
                        selectedOrder.status === "delivered"
                          ? "bg-emerald-600"
                          : selectedOrder.status === "processing"
                          ? "bg-amber-500 animate-pulse"
                          : "bg-red-600"
                      }`}
                    >
                      {selectedOrder.status === "delivered" ? (
                        <Check className="w-4 h-4" />
                      ) : selectedOrder.status === "processing" ? (
                        <RotateCcw className="w-4 h-4 animate-spin" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">۳. اتصال به irMarket API</span>
                      <span className="text-[10px] text-neutral-500 dark:text-slate-400 mt-0.5">
                        {selectedOrder.externalOrderId ? `سفارش #${selectedOrder.externalOrderId}` : "شبیه‌ساز Mock"}
                      </span>
                      <span
                        className={`text-[10px] font-mono mt-1 font-semibold ${
                          selectedOrder.status === "delivered"
                            ? "text-emerald-700 dark:text-emerald-300"
                            : selectedOrder.status === "processing"
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-red-700 dark:text-red-300"
                        }`}
                      >
                        {selectedOrder.status === "delivered" ? "پاسخ موفق دریافت شد" : selectedOrder.status === "processing" ? "در صف تبادل API" : "خطای تأمین‌کننده"}
                      </span>
                    </div>
                  </div>

                  {/* Step 4: License Issuance */}
                  <div
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      selectedOrder.status === "delivered"
                        ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60"
                        : "bg-neutral-50 dark:bg-slate-800/60 border-neutral-200 dark:border-slate-700 opacity-80"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs text-white ${
                        selectedOrder.status === "delivered" ? "bg-emerald-600" : "bg-neutral-400"
                      }`}
                    >
                      <Key className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">۴. صدور و تحویل اکانت</span>
                      <span className="text-[10px] text-neutral-500 dark:text-slate-400 mt-0.5">ارسال ایمیل/پیامک</span>
                      <span
                        className={`text-[10px] font-mono mt-1 font-semibold ${
                          selectedOrder.status === "delivered" ? "text-emerald-700 dark:text-emerald-300" : "text-neutral-500 dark:text-slate-400"
                        }`}
                      >
                        {selectedOrder.status === "delivered" ? "تحویل به خریدار" : "در انتظار صدور"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Split Layout: 8 cols items + credentials, 4 cols customer & actions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left 8 Cols */}
                <div className="lg:col-span-8 space-y-6">

                  {/* Ordered Items Card */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-neutral-200 dark:border-slate-800 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-brand-primary dark:text-teal-400" />
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">اقلام و اشتراک‌های خریداری‌شده</h4>
                      </div>
                      <span className="text-[11px] text-neutral-500 dark:text-slate-400">
                        {selectedOrder.items.length} آیتم
                      </span>
                    </div>

                    <div className="space-y-3">
                      {selectedOrder.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-neutral-50/80 dark:bg-slate-800/80 p-3.5 rounded-xl border border-neutral-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-brand-primary dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-200 dark:border-teal-800/60">
                              {idx + 1}
                            </div>
                            <div>
                              <span className="font-bold text-xs text-slate-900 dark:text-white block">{item.productTitle}</span>
                              <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-slate-400 mt-1">
                                <span>تعداد: <strong className="font-mono text-slate-900 dark:text-white">{item.quantity}</strong></span>
                                <span>•</span>
                                <span className="font-mono">${item.priceUsd.toFixed(2)} USD</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="font-mono font-bold text-xs text-brand-primary dark:text-teal-400 block">
                              {formatPrice(item.priceToman)} تومان
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Multi-Account Credentials List (From N Quantities) */}
                    {selectedOrder.accountCredentials && selectedOrder.accountCredentials.length > 0 && (
                      <div className="bg-purple-50/60 dark:bg-purple-950/30 p-4 rounded-xl border border-purple-200 dark:border-purple-800/60 space-y-3 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            <span>اکانت‌های ارسالی خریدار جهت فعال‌سازی ({selectedOrder.accountCredentials.length} مورد):</span>
                          </span>
                          <span className="text-[10px] text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded font-mono">
                            Multi-Account Info
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {selectedOrder.accountCredentials.map((acc, accIdx) => (
                            <div
                              key={accIdx}
                              className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-purple-200/80 dark:border-purple-800/50 space-y-1.5 text-xs"
                            >
                              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-slate-800 pb-1">
                                <span className="font-bold text-purple-900 dark:text-purple-300 text-[11px]">
                                  اکانت شماره {acc.index || accIdx + 1}
                                </span>
                                {acc.productTitle && (
                                  <span className="text-[10px] text-neutral-500 dark:text-slate-400 truncate max-w-[130px]">
                                    {acc.productTitle}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-1 text-[11px]">
                                <span className="text-neutral-500 dark:text-slate-400">ایمیل:</span>
                                <span className="font-mono text-slate-900 dark:text-slate-100 font-semibold dir-ltr select-all">
                                  {acc.email}
                                </span>
                              </div>
                              {acc.password && (
                                <div className="flex items-center justify-between gap-1 text-[11px]">
                                  <span className="text-neutral-500 dark:text-slate-400">رمز عبور:</span>
                                  <span className="font-mono text-amber-700 dark:text-amber-300 font-semibold dir-ltr select-all bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/50">
                                    {acc.password}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Single Customer Inputs (Link, Email, Notes) */}
                    {(!selectedOrder.accountCredentials || selectedOrder.accountCredentials.length === 0) &&
                      (selectedOrder.customerLink || selectedOrder.customerEmail || selectedOrder.targetAccountEmail) && (
                      <div className="bg-teal-50/60 dark:bg-slate-800/80 p-3.5 rounded-xl border border-teal-200 dark:border-slate-700 text-xs space-y-2 mt-2">
                        <span className="font-bold text-[11px] text-teal-950 dark:text-teal-300 block">فیلدهای تکمیلی ارسالی خریدار:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          {(selectedOrder.targetAccountEmail || selectedOrder.customerEmail) && (
                            <div className="flex items-center gap-2 text-neutral-700 dark:text-slate-300">
                              <Mail className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                              <span>ایمیل مقصد:</span>
                              <span className="font-mono font-semibold text-slate-900 dark:text-white dir-ltr select-all">
                                {selectedOrder.targetAccountEmail || selectedOrder.customerEmail}
                              </span>
                            </div>
                          )}
                          {selectedOrder.targetAccountPassword && (
                            <div className="flex items-center gap-2 text-neutral-700 dark:text-slate-300">
                              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span>رمز عبور اکانت:</span>
                              <span className="font-mono font-semibold text-amber-800 dark:text-amber-300 dir-ltr select-all bg-amber-50 dark:bg-amber-950/50 px-1 rounded">
                                {selectedOrder.targetAccountPassword}
                              </span>
                            </div>
                          )}
                          {selectedOrder.customerLink && (
                            <div className="flex items-center gap-2 text-neutral-700 dark:text-slate-300">
                              <LinkIcon className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                              <span>لینک کانال/پیج:</span>
                              <a
                                href={selectedOrder.customerLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-primary dark:text-teal-300 underline truncate font-mono"
                              >
                                {selectedOrder.customerLink}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delivered Credentials Box */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-neutral-200 dark:border-slate-800 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-brand-primary dark:text-teal-400" />
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">مشخصات اکانت و لایسنس تحویل‌شده به خریدار</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditingCredentials ? (
                          <button
                            onClick={handleSaveCredentials}
                            className="flex items-center gap-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg font-bold shadow-xs transition-colors"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>ذخیره تغییرات</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setIsEditingCredentials(true)}
                            className="flex items-center gap-1 text-[11px] text-brand-primary dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800 transition-colors font-semibold"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>ویرایش / ثبت دستی</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditingCredentials ? (
                      <div className="space-y-2">
                        <label className="text-[11px] text-neutral-600 dark:text-slate-300 font-medium block">
                          هر خط نمایانگر یک اکانت یا لایسنس است (فرمت پیشنهادی: Username:Password یا LicenseKey):
                        </label>
                        <textarea
                          rows={4}
                          value={editCredentialsText}
                          onChange={(e) => setEditCredentialsText(e.target.value)}
                          className="w-full font-mono text-xs p-3 rounded-xl border border-neutral-200 dark:border-slate-700 focus:border-brand-primary dark:focus:border-teal-400 bg-neutral-50 dark:bg-slate-800 outline-none dir-ltr text-left text-slate-800 dark:text-slate-100"
                          placeholder="user@domain.com : Pass1234&#10;KEY-XXXX-YYYY-ZZZZ"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {selectedOrder.deliveredAccounts && selectedOrder.deliveredAccounts.length > 0 ? (
                          selectedOrder.deliveredAccounts.map((acc, i) => (
                            <div
                              key={i}
                              className="bg-teal-50/70 dark:bg-slate-800 p-3.5 rounded-xl border border-teal-200 dark:border-slate-700 flex items-center justify-between gap-3"
                            >
                              <div className="font-mono text-xs text-slate-900 dark:text-white font-semibold select-all break-all dir-ltr text-left">
                                {acc}
                              </div>
                              <button
                                onClick={() => handleCopy(acc, i)}
                                className="p-2 text-brand-primary hover:bg-white dark:hover:bg-slate-700 rounded-lg border border-teal-200 dark:border-slate-700 dark:text-teal-300 shrink-0 transition-all"
                                title="کپی مشخصات اکانت"
                              >
                                {copiedIndex === i ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-slate-800/50 border border-dashed border-neutral-200 dark:border-slate-700 text-center text-xs text-neutral-500 dark:text-slate-400">
                            <span>هنوز لایسنسی برای این سفارش صادر نشده است. می‌توانید از دکمه «ویرایش / ثبت دستی» برای ثبت لایسنس استفاده کنید.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mock Purchase Guard Notice */}
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200">
                      <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>
                        <strong>محافظ ماک ایمن (Mock Guard):</strong> سیستم در حالت آزمایشی ایمن کار می‌کند تا موجودی کیف پول irMarket شما (${settings.walletBalanceUsd}) کسر نگردد.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right 4 Cols: Customer Profile & Quick Actions */}
                <div className="lg:col-span-4 space-y-6">

                  {/* Customer Information Card */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-neutral-200 dark:border-slate-800 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-brand-primary dark:text-teal-400" />
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">مشخصات خریدار</h4>
                      </div>
                      <span className="text-[10px] bg-teal-100 dark:bg-teal-900/60 text-brand-primary dark:text-teal-300 px-2 py-0.5 rounded-full font-bold">
                        خریدار فروشگاه
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-2.5 bg-neutral-50/80 dark:bg-slate-800 rounded-xl border border-neutral-100 dark:border-slate-700/60">
                      <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        {selectedOrder.customerEmail ? selectedOrder.customerEmail.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 dark:text-white block truncate select-all">
                          {selectedOrder.customerEmail}
                        </span>
                        <span className="text-[10px] text-neutral-500 dark:text-slate-400 font-mono">
                          {selectedOrder.customerPhone || "شماره ثبت نشده"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-[11px] pt-1">
                      <div className="flex justify-between items-center text-neutral-600 dark:text-slate-400">
                        <span>روش پرداخت:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {selectedOrder.paymentGateway === "cartbecart"
                            ? "کارت‌به‌کارت (CartBeCart)"
                            : selectedOrder.paymentGateway === "zarinpal"
                            ? "زرین‌پال (شتاب)"
                            : "نکست‌پی"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-neutral-600 dark:text-slate-400">
                        <span>وضعیت دسترسی:</span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">تایید شده و فعال</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-neutral-200 dark:border-slate-800 shadow-2xs space-y-3">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white pb-2 border-b border-neutral-200 dark:border-slate-800">
                      خلاصه مالی و فاکتور
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-neutral-600 dark:text-slate-400">
                        <span>مبلغ اقلام (USD):</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">${selectedOrder.totalPriceUsd.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-600 dark:text-slate-400">
                        <span>نرخ مبنای محاسبه:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatPrice(Math.round(settings.usdToRialRate / 10))} تومان
                        </span>
                      </div>
                      {selectedOrder.discountAppliedToman ? (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                          <span>تخفیف کوپن:</span>
                          <span className="font-mono">
                            -{formatNumber(selectedOrder.discountAppliedToman)} تومان
                          </span>
                        </div>
                      ) : null}
                      <div className="pt-2 border-t border-neutral-200 dark:border-slate-800 flex justify-between items-center font-bold">
                        <span className="text-slate-900 dark:text-white">مبلغ نهایی دریافتی:</span>
                        <span className="text-brand-primary dark:text-teal-400 text-sm font-mono">
                          {formatPrice(selectedOrder.totalPriceToman)} تومان
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Admin Actions */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-neutral-200 dark:border-slate-800 shadow-2xs space-y-3">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white pb-2 border-b border-neutral-200 dark:border-slate-800">
                      اقدام سریع و تغییر وضعیت
                    </h4>

                    <div className="space-y-2">
                      <button
                        onClick={() => handleStatusChange("delivered")}
                        disabled={selectedOrder.status === "delivered"}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          selectedOrder.status === "delivered"
                            ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 cursor-default"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تغییر به تحویل‌شده (تکمیل)</span>
                      </button>

                      <button
                        onClick={() => handleStatusChange("processing")}
                        disabled={selectedOrder.status === "processing"}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          selectedOrder.status === "processing"
                            ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 cursor-default"
                            : "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                        }`}
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>تغییر به در حال پردازش</span>
                      </button>

                      <button
                        onClick={() => handleStatusChange("failed")}
                        disabled={selectedOrder.status === "failed"}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          selectedOrder.status === "failed"
                            ? "bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 cursor-default"
                            : "bg-red-600 hover:bg-red-700 text-white shadow-xs"
                        }`}
                      >
                        <Ban className="w-4 h-4" />
                        <span>لغو سفارش و عودت وجه</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-neutral-50/80 dark:bg-slate-900 px-6 py-3 border-t border-neutral-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-neutral-500 dark:text-slate-400">
                سیستم اتوماسیون ارزان اکانت • همگام با پنل HypeStore Control Center
              </span>
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold px-6 py-2 rounded-xl transition-colors shadow-xs"
              >
                بستن
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Official Iranian Printable Invoice Modal */}
      {invoiceOrder && (
        <OrderInvoiceModal
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
