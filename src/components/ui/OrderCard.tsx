"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PackageCheck,
  Package,
  Copy,
  Check,
  Clock,
  AlertCircle,
  CheckCircle2,
  Key,
  Undo2,
  CreditCard,
  Printer,
  FileText,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Order } from "@/types";
import { formatPrice } from "@/lib/format";
import { toPersianDateTime } from "@/lib/date";

interface OrderCardProps {
  order: Order;
  onInvoiceClick?: (order: Order) => void;
  onRefundClick?: (order: Order) => void;
  className?: string;
}

export default function OrderCard({
  order,
  onInvoiceClick,
  onRefundClick,
  className = "",
}: OrderCardProps) {
  const [copiedKeyIndex, setCopiedKeyIndex] = useState<number | null>(null);

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "delivered":
        return {
          label: "تحویل موفق لایسنس",
          color: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
        };
      case "processing":
        return {
          label: "در حال پردازش خودکار",
          color: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
          icon: <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />,
        };
      case "pending":
        return {
          label: "در انتظار واریز کارت‌به‌کارت",
          color: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30",
          icon: <CreditCard className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />,
        };
      case "refund_requested":
        return {
          label: "درخواست عودت در صف بررسی",
          color: "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30",
          icon: <Undo2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />,
        };
      case "refunded":
        return {
          label: "مبلغ عودت داده شد",
          color: "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30",
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
        };
      default:
        return {
          label: "نامشخص",
          color: "bg-slate-500/15 text-slate-800 dark:text-slate-300 border-slate-500/30",
          icon: <Package className="w-3.5 h-3.5" />,
        };
    }
  };

  const statusInfo = getStatusBadge(order.status);

  // Parse delivered accounts if JSON string or array
  const parsedAccounts: string[] = React.useMemo(() => {
    if (!order.deliveredAccounts) return [];
    if (Array.isArray(order.deliveredAccounts)) return order.deliveredAccounts;
    if (typeof order.deliveredAccounts === "string") {
      try {
        const parsed = JSON.parse(order.deliveredAccounts);
        return Array.isArray(parsed) ? parsed : [order.deliveredAccounts];
      } catch {
        return [order.deliveredAccounts];
      }
    }
    return [];
  }, [order.deliveredAccounts]);

  const handleCopyAccount = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyIndex(idx);
    setTimeout(() => setCopiedKeyIndex(null), 2500);
  };

  return (
    <div
      className={`glass-panel rounded-3xl p-5 sm:p-6 border border-brand-border/80 dark:border-slate-800 shadow-card hover:shadow-xl hover:border-teal-500/30 transition-all duration-300 space-y-5 ${className}`}
    >
      {/* Top Header: Order Number, Date, Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-border/60 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shrink-0">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm text-brand-dark dark:text-white">
                #{order.orderNumber}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.color}`}
              >
                {statusInfo.icon}
                <span>{statusInfo.label}</span>
              </span>
            </div>
            <span className="text-[11px] text-brand-muted dark:text-slate-400 mt-0.5 block">
              ثبت شده در: {toPersianDateTime(order.createdAt)}
            </span>
          </div>
        </div>

        <div className="text-left">
          <span className="text-[11px] text-brand-muted dark:text-slate-400 block">مبلغ کل سفارش:</span>
          <span className="text-base sm:text-lg font-black font-mono text-brand-dark dark:text-white">
            {formatPrice(order.totalPriceToman)} تومان
          </span>
        </div>
      </div>

      {/* Delivered Licenses / Credentials Box */}
      {parsedAccounts.length > 0 && (
        <div className="rounded-2xl bg-teal-500/10 border border-teal-500/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>مشخصات لایسنس و اکانت تحویلی:</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
              آماده استفاده
            </span>
          </div>

          <div className="space-y-2">
            {parsedAccounts.map((acc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-500/20 text-xs font-mono text-slate-800 dark:text-slate-200 shadow-xs"
              >
                <span className="truncate select-all">{acc}</span>
                <button
                  type="button"
                  onClick={() => handleCopyAccount(acc, idx)}
                  className="p-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-700 dark:text-teal-300 transition-colors shrink-0 cursor-pointer"
                  title="کپی متن لایسنس"
                >
                  {copiedKeyIndex === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {onInvoiceClick && (
            <button
              type="button"
              onClick={() => onInvoiceClick(order)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>فاکتور رسمی</span>
            </button>
          )}

          {(order.status === "delivered" || order.status === "processing") && onRefundClick && (
            <button
              type="button"
              onClick={() => onRefundClick(order)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>درخواست عودت وجه</span>
            </button>
          )}
        </div>

        {order.status === "pending" && (
          <Link
            href={`/payment/card/${order.orderNumber}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>پرداخت کارت‌به‌کارت</span>
          </Link>
        )}
      </div>
    </div>
  );
}
