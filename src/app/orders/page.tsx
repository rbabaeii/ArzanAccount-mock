"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import { useStore } from "@/context/StoreContext";
import { formatPrice, formatNumber } from "@/lib/format";
import {
  PackageCheck,
  Package,
  Search,
  Copy,
  Check,
  Clock,
  AlertCircle,
  CheckCircle2,
  Key,
  Undo2,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { toPersianDateTime } from "@/lib/date";
import { CustomerRefundModal } from "@/components/store/CustomerRefundModal";
import CardPaymentModal from "@/components/payment/CardPaymentModal";
import { Order } from "@/types";

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";
  const { orders } = useStore();

  const [query, setQuery] = useState(initialId);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [refundModalOrder, setRefundModalOrder] = useState<Order | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (initialId) setQuery(initialId);
  }, [initialId]);

  const searchedOrder = orders.find(
    (o) =>
      o.orderNumber.toLowerCase() === query.trim().toLowerCase() ||
      o.customerEmail.toLowerCase() === query.trim().toLowerCase()
  );

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border-b border-brand-border dark:border-slate-800 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-brand-muted dark:text-slate-400">
          <Link href="/" className="hover:text-brand-primary">
            صفحه اصلی
          </Link>
          <span>/</span>
          <span className="text-brand-dark dark:text-white font-bold">رهگیری سفارش و مشخصات اکانت</span>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Search Order Bar */}
        <div className="group/search relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-brand-border dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-400/40 dark:hover:border-teal-400/30 transition-all duration-300 text-center max-w-2xl mx-auto">
          {/* Corner Glow Orb */}
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-teal-500/10 rounded-full blur-2xl group-hover/search:scale-150 transition-all duration-500 pointer-events-none" />

          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-slate-800 text-brand-primary dark:text-teal-400 flex items-center justify-center mx-auto mb-3 shadow-xs group-hover/search:rotate-6 group-hover/search:scale-110 transition-all duration-300">
            <PackageCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-dark dark:text-white">
            رهگیری سفارش و مشاهده لایسنس
          </h1>
          <p className="text-xs text-brand-muted dark:text-slate-400 mt-1 max-w-md mx-auto">
            شماره سفارش (مثلاً <span className="font-mono font-bold text-brand-dark dark:text-white">ARZ-1049</span>) یا ایمیل ثبت‌شده هنگام خرید را وارد کنید.
          </p>

          <div className="mt-6 flex gap-2 max-w-md mx-auto relative z-10">
            <input
              type="text"
              placeholder="کد سفارش یا ایمیل..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-brand-surfaceDim dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2.5 px-4 text-xs outline-none font-mono placeholder:text-neutral-400 dark:placeholder:text-slate-500 transition-all duration-200"
            />
            <button
              onClick={() => {}}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 cursor-pointer"
            >
              جستجو
            </button>
          </div>
        </div>

        {/* Found Order Card */}
        {searchedOrder ? (
          <div className="group/order relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-brand-border dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-400/40 dark:hover:border-teal-400/30 transition-all duration-300 space-y-6">
            {/* Corner Glow Orb */}
            <div className="absolute -top-14 -right-14 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl group-hover/order:scale-150 transition-all duration-500 pointer-events-none" />

            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-brand-border dark:border-slate-800 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-brand-dark dark:text-white font-mono">
                    #{searchedOrder.orderNumber}
                  </span>
                  {searchedOrder.status === "delivered" && (
                    <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      تحویل داده شده
                    </span>
                  )}
                  {searchedOrder.status === "processing" && (
                    <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      در حال پردازش در سرور
                    </span>
                  )}
                  {searchedOrder.status === "refund_requested" && (
                    <span className="bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs">
                      <Clock className="w-3.5 h-3.5" />
                      درخواست استرداد وجه ثبت شده (در دست بررسی مالی)
                    </span>
                  )}
                  {searchedOrder.status === "refunded" && (
                    <span className="bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      وجه سفارش مسترد گردید
                    </span>
                  )}
                  {searchedOrder.status === "failed" && (
                    <span className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/80 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs">
                      <AlertCircle className="w-3.5 h-3.5" />
                      خطا در انجام
                    </span>
                  )}
                  {searchedOrder.status === "pending" && (
                    <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs">
                      <CreditCard className="w-3.5 h-3.5 animate-pulse" />
                      در انتظار پرداخت کارت‌به‌کارت
                    </span>
                  )}
                  {searchedOrder.status === "cancelled" && (
                    <span className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs">
                      <AlertCircle className="w-3.5 h-3.5" />
                      سفارش لغو شده
                    </span>
                  )}
                </div>
                {searchedOrder.refundRejectionReason && (
                  <div className="mt-2 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-2.5 text-rose-700 dark:text-rose-300">
                    <div className="font-bold flex items-center gap-1 mb-0.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>عدم تایید درخواست عودت وجه توسط کارشناس:</span>
                    </div>
                    <p className="opacity-90">{searchedOrder.refundRejectionReason}</p>
                  </div>
                )}
                <span className="text-xs text-brand-muted dark:text-slate-400 block mt-1">
                  ثبت شده در: {toPersianDateTime(searchedOrder.createdAt)} | ایمیل خریدار: {searchedOrder.customerEmail}
                </span>
              </div>

              <div className="text-left flex flex-col sm:items-end gap-2">
                <div>
                  <span className="text-xs text-brand-muted dark:text-slate-400 block">مبلغ کل سفارش:</span>
                  <span className="text-xl font-black text-brand-dark dark:text-white font-mono">
                    {formatPrice(searchedOrder.totalPriceToman)} تومان
                  </span>
                </div>

                {searchedOrder.status === "pending" && searchedOrder.paymentGateway === "cartbecart" && (
                  <button
                    type="button"
                    onClick={() => setIsCardModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>تکمیل پرداخت / ثبت فیش</span>
                  </button>
                )}

                {(searchedOrder.status === "delivered" || searchedOrder.status === "processing") && (
                  <button
                    type="button"
                    onClick={() => setRefundModalOrder(searchedOrder)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 hover:scale-105 active:scale-95 text-xs font-bold transition-all duration-200 shadow-2xs cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>درخواست عودت وجه</span>
                  </button>
                )}
              </div>
            </div>

            {/* Delivered Credentials Box */}
            {searchedOrder.deliveredAccounts && searchedOrder.deliveredAccounts.length > 0 ? (
              <div className="bg-teal-50/60 dark:bg-slate-800/80 border border-teal-200 dark:border-slate-700 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-teal-900 dark:text-teal-300 font-bold text-xs">
                  <Key className="w-4 h-4 text-brand-primary dark:text-teal-400" />
                  <span>مشخصات لایسنس و اطلاعات اکانت تحویل داده شده:</span>
                </div>

                <div className="space-y-2.5">
                  {searchedOrder.deliveredAccounts.map((accountText, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-800 p-3.5 rounded-lg border border-teal-100 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="font-mono text-slate-800 dark:text-white break-all select-all font-semibold">
                        {accountText}
                      </span>
                      <button
                        onClick={() => handleCopy(accountText, idx)}
                        className="bg-teal-100 dark:bg-slate-700 hover:bg-teal-200 dark:hover:bg-slate-600 text-teal-900 dark:text-teal-200 text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1 shrink-0 transition-colors"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span>کپی شد!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>کپی</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-teal-800 dark:text-slate-400 leading-relaxed">
                  نکته: جهت فعال‌سازی اکانت، اطلاعات فوق را در نرم‌افزار مربوطه وارد فرمایید. در صورت هرگونه سوال با پشتیبانی تلگرام در ارتباط باشید.
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/70 rounded-xl p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <p className="leading-relaxed">
                  سفارش شما در صف پردازش سروری قرار دارد (معمولاً برای خدمات فالوور و ممبر تلگرام چند دقیقه زمان می‌برد).
                </p>
              </div>
            )}

            {/* Items in order */}
            <div>
              <h3 className="font-bold text-xs text-brand-dark dark:text-white mb-3">اقلام سفارش:</h3>
              <div className="divide-y divide-brand-border dark:divide-slate-800 border border-brand-border dark:border-slate-800 rounded-xl overflow-hidden">
                {searchedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-brand-surfaceDim dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-brand-dark dark:text-white">{item.productTitle}</span>
                      <span className="text-[11px] text-brand-muted dark:text-slate-400 block mt-0.5">
                        تعداد: {item.quantity} عدد
                      </span>
                    </div>
                    <span className="font-mono font-bold text-brand-dark dark:text-white">
                      {formatPrice(item.priceToman * item.quantity)} تومان
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : orders.length > 0 ? (
          /* Recent Orders */
          <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-4">
            <h3 className="font-bold text-xs text-brand-dark dark:text-white pb-3 border-b border-brand-border dark:border-slate-800">
              آخرین سفارش‌های ثبت‌شده شما:
            </h3>

            <div className="divide-y divide-brand-border dark:divide-slate-800">
              {orders.slice(0, 5).map((o) => (
                <div
                  key={o.id}
                  onClick={() => setQuery(o.orderNumber)}
                  className="py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-50 dark:hover:bg-slate-800 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <span className="font-mono font-bold text-brand-primary dark:text-teal-400">
                      #{o.orderNumber}
                    </span>
                    <span className="text-[11px] text-brand-muted dark:text-slate-400 block">
                      {o.items[0]?.productTitle} ({o.customerEmail})
                    </span>
                  </div>

                  <div className="text-left flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-brand-dark dark:text-white">
                      {formatPrice(o.totalPriceToman)} ت
                    </span>
                    <span className="text-[10px] bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80 px-2 py-0.5 rounded font-semibold">
                      مشاهده جزییات
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-2xl p-8 shadow-card text-center text-xs text-brand-muted dark:text-slate-400 space-y-2">
            <Package className="w-8 h-8 mx-auto text-brand-muted/50 mb-2" />
            <p>شماره سفارش یا ایمیل خرید خود را در کادر بالا وارد کرده و دکمه پیگیری را بزنید.</p>
          </div>
        )}

        <CustomerRefundModal
          isOpen={!!refundModalOrder}
          order={refundModalOrder}
          onClose={() => setRefundModalOrder(null)}
        />

        {isCardModalOpen && searchedOrder && (
          <CardPaymentModal
            isOpen={isCardModalOpen}
            onClose={() => setIsCardModalOpen(false)}
            amountToman={searchedOrder.totalPriceToman}
            orderNumber={searchedOrder.orderNumber}
            orderId={searchedOrder.id}
            customerName={searchedOrder.customerEmail}
            customerPhone={searchedOrder.customerPhone || undefined}
            paymentType="ORDER"
            onSuccess={() => {
              setIsCardModalOpen(false);
              window.location.reload();
            }}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-neutral-400">در حال بارگذاری صفحه سفارشات...</div>}>
      <OrderTrackingContent />
    </Suspense>
  );
}

