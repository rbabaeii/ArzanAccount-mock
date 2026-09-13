"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
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
  Printer,
  FileText,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { toPersianDateTime } from "@/lib/date";
import { CustomerRefundModal } from "@/components/store/CustomerRefundModal";
import { OrderInvoiceModal } from "@/components/admin/OrderInvoiceModal";
import CardPaymentModal from "@/components/payment/CardPaymentModal";
import { Order } from "@/types";
import AmbientGlow from "@/components/ui/AmbientGlow";
import Card3D from "@/components/ui/Card3D";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";
  const { orders } = useStore();

  const [query, setQuery] = useState(initialId);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [refundModalOrder, setRefundModalOrder] = useState<Order | null>(null);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<Order | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (initialId) setQuery(initialId);
  }, [initialId]);

  const searchedOrder = useMemo(() => {
    if (!query.trim()) return null;
    const cleanQuery = query.trim().toLowerCase();
    return orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === cleanQuery ||
        o.orderNumber.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanQuery.replace(/[^a-z0-9]/g, "") ||
        o.customerEmail.toLowerCase() === cleanQuery ||
        (o.customerPhone && o.customerPhone.includes(cleanQuery))
    );
  }, [orders, query]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const breadcrumbItems = [
    { name: "صفحه اصلی", url: "https://arzanaccount.ir" },
    { name: "پیگیری سفارشات", url: "https://arzanaccount.ir/orders" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors relative overflow-hidden">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Header />

      {/* Ambient Lighting Gradients */}
      <AmbientGlow variant="teal" className="-top-20 -right-20" />
      <AmbientGlow variant="purple" className="top-1/3 -left-32 opacity-20" />

      {/* Breadcrumb Bar */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-brand-border/70 dark:border-slate-800/80 py-3.5 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-brand-muted dark:text-slate-400">
          <Link href="/" className="hover:text-brand-primary dark:hover:text-teal-400 transition-colors">
            صفحه اصلی
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-brand-dark dark:text-white font-bold">رهگیری سفارش و مشخصات اکانت</span>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-32 sm:pb-20 space-y-8 relative z-10">
        {/* Search Order Bar Card */}
        <Card3D maxTilt={3} glareEffect={true} className="rounded-3xl shadow-xl max-w-2xl mx-auto">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 text-center border border-brand-border/90 dark:border-slate-700/80 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/15 text-brand-primary dark:text-teal-400 flex items-center justify-center mx-auto shadow-sm">
              <PackageCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-brand-dark dark:text-white">
                رهگیری سفارش و دریافت لایسنس
              </h1>
              <p className="text-xs text-brand-muted dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                شماره سفارش (مانند <span className="font-mono font-bold text-teal-600 dark:text-teal-400">#ARZ-1049</span>) یا شماره همراه/ایمیل خرید خود را وارد نمایید.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
              className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto pt-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="کد سفارش (ARZ-...) یا ایمیل..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-2xl pr-10 pl-4 text-xs font-mono outline-none placeholder:font-sans placeholder:text-neutral-400 dark:placeholder:text-slate-500 transition-all"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="h-12 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold px-6 rounded-2xl shadow-md hover:shadow-lg hover:shadow-teal-500/25 active:scale-95 transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>رهگیری</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </form>
          </div>
        </Card3D>

        {/* Found Order Card */}
        {searchedOrder ? (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-card border border-brand-border/90 dark:border-slate-700/80 space-y-6 animate-fadeIn">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-brand-border/60 dark:border-slate-800 gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xl font-black text-brand-dark dark:text-white font-mono">
                    #{searchedOrder.orderNumber}
                  </span>

                  {searchedOrder.status === "delivered" && (
                    <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>تحویل داده شده</span>
                    </span>
                  )}
                  {searchedOrder.status === "processing" && (
                    <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                      <span>در حال آماده‌سازی و پردازش</span>
                    </span>
                  )}
                  {searchedOrder.status === "refund_requested" && (
                    <span className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>درخواست عودت وجه در صف بررسی</span>
                    </span>
                  )}
                  {searchedOrder.status === "refunded" && (
                    <span className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-purple-500" />
                      <span>وجه سفارش مسترد گردید</span>
                    </span>
                  )}
                  {searchedOrder.status === "pending" && (
                    <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                      <CreditCard className="w-4 h-4 text-amber-500" />
                      <span>در انتظار پرداخت کارت‌به‌کارت</span>
                    </span>
                  )}
                  {searchedOrder.status === "failed" && (
                    <span className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      <span>ناموفق یا منقضی شده</span>
                    </span>
                  )}
                  {searchedOrder.status === "cancelled" && (
                    <span className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      <span>سفارش لغو شده</span>
                    </span>
                  )}
                </div>

                {searchedOrder.refundRejectionReason && (
                  <div className="mt-3 text-xs bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 text-rose-700 dark:text-rose-300">
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>عدم تایید عودت وجه توسط کارشناس مالی:</span>
                    </div>
                    <p className="opacity-90 leading-relaxed">{searchedOrder.refundRejectionReason}</p>
                  </div>
                )}

                <span className="text-xs text-brand-muted dark:text-slate-400 block mt-2">
                  ثبت شده در: {toPersianDateTime(searchedOrder.createdAt)} | خریدار: {searchedOrder.customerEmail}
                </span>
              </div>

              {/* Total and Action Buttons */}
              <div className="text-left flex flex-col sm:items-end gap-2.5">
                <div>
                  <span className="text-xs text-brand-muted dark:text-slate-400 block">مبلغ کل سفارش:</span>
                  <span className="text-xl sm:text-2xl font-black text-brand-dark dark:text-white font-mono">
                    {formatPrice(searchedOrder.totalPriceToman)} تومان
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Official Invoice Modal Trigger */}
                  <button
                    type="button"
                    onClick={() => setInvoiceModalOrder(searchedOrder)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                    title="چاپ فاکتور رسمی / PDF"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>فاکتور رسمی</span>
                  </button>

                  {searchedOrder.status === "pending" && (
                    <Link
                      href={`/payment/card/${searchedOrder.orderNumber}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>پرداخت کارت‌به‌کارت</span>
                    </Link>
                  )}

                  {(searchedOrder.status === "delivered" || searchedOrder.status === "processing") && (
                    <button
                      type="button"
                      onClick={() => setRefundModalOrder(searchedOrder)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>درخواست عودت وجه</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Delivered Credentials / License Box */}
            {searchedOrder.deliveredAccounts && searchedOrder.deliveredAccounts.length > 0 ? (
              <div className="bg-teal-500/10 border-2 border-teal-500/30 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-bold text-xs sm:text-sm">
                    <Key className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>مشخصات لایسنس و اطلاعات اکانت تحویل داده شده:</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full">
                    آماده استفاده
                  </span>
                </div>

                <div className="space-y-3">
                  {searchedOrder.deliveredAccounts.map((accountText, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-teal-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs"
                    >
                      <span className="font-mono text-slate-800 dark:text-white break-all select-all font-semibold leading-relaxed">
                        {accountText}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(accountText, idx)}
                        className="bg-teal-500/15 hover:bg-teal-500/25 text-teal-800 dark:text-teal-200 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer w-full sm:w-auto justify-center"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>کپی شد!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>کپی مشخصات</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-teal-800 dark:text-teal-300 leading-relaxed">
                  راهنما: اطلاعات لایسنس فوق را جهت ورود در نرم‌افزار مربوطه وارد فرمایید. در صورت هرگونه سوال، تیم پشتیبانی تلگرام آماده همراهی شماست.
                </p>
              </div>
            ) : searchedOrder.status === "processing" ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
                <Clock className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 animate-spin" />
                <div className="space-y-1">
                  <strong className="block font-bold">سفارش شما در صف پردازش خودکار سروری قرار دارد</strong>
                  <p className="text-[11.5px] leading-relaxed opacity-90">
                    لایسنس یا فعال‌سازی این سفارش حداکثر ظرف چند دقیقه آینده صادر خواهد شد. همچنین می‌توانید صفحه را رفرش فرمایید.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Items Breakdown */}
            <div>
              <h3 className="font-bold text-xs text-brand-dark dark:text-white mb-3">اقلام خریداری شده:</h3>
              <div className="divide-y divide-brand-border/60 dark:divide-slate-800 border border-brand-border/70 dark:border-slate-800 rounded-2xl overflow-hidden">
                {searchedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50/70 dark:bg-slate-850/60 text-slate-800 dark:text-slate-100 flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-bold text-brand-dark dark:text-white block">{item.productTitle}</span>
                      <span className="text-[11px] text-brand-muted dark:text-slate-400 mt-0.5 block">
                        تعداد: {item.quantity} عدد
                      </span>
                    </div>
                    <span className="font-mono font-bold text-brand-dark dark:text-white text-sm">
                      {formatPrice(item.priceToman * item.quantity)} تومان
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : orders.length > 0 ? (
          /* Recent Orders List with Status Tabs */
          <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-card border border-brand-border/90 dark:border-slate-700/80 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-border/60 dark:border-slate-800">
              <h2 className="font-bold text-sm sm:text-base text-brand-dark dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>آخرین سفارش‌های ثبت‌شده شما ({filteredOrders.length}):</span>
              </h2>

              {/* Status Filter Badges */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  همه ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("delivered")}
                  className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                    statusFilter === "delivered"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  تحویل شده
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                    statusFilter === "pending"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  در انتظار واریز
                </button>
              </div>
            </div>

            <div className="divide-y divide-brand-border/60 dark:divide-slate-800">
              {filteredOrders.slice(0, 8).map((o) => (
                <div
                  key={o.id}
                  onClick={() => setQuery(o.orderNumber)}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-teal-500/5 px-3 rounded-2xl transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                        #{o.orderNumber}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {toPersianDateTime(o.createdAt)}
                      </span>
                    </div>
                    <span className="text-xs text-brand-dark dark:text-white font-bold block mt-1">
                      {o.items[0]?.productTitle} {o.items.length > 1 && `(+${o.items.length - 1} مورد دیگر)`}
                    </span>
                  </div>

                  <div className="text-left flex items-center justify-between sm:justify-end gap-3">
                    <span className="text-sm font-mono font-black text-brand-dark dark:text-white">
                      {formatPrice(o.totalPriceToman)} تومان
                    </span>
                    <span className="text-[11px] bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 px-3 py-1 rounded-xl font-bold">
                      مشاهده لایسنس ➔
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-12 text-center text-xs text-brand-muted dark:text-slate-400 space-y-3 max-w-md mx-auto">
            <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="leading-relaxed">
              شماره سفارش یا ایمیل ثبت‌شده هنگام خرید را در کادر بالا وارد کرده و دکمه رهگیری را بزنید.
            </p>
          </div>
        )}

        {/* Customer Refund Modal */}
        <CustomerRefundModal
          isOpen={!!refundModalOrder}
          order={refundModalOrder}
          onClose={() => setRefundModalOrder(null)}
        />

        {/* Official Invoice Modal */}
        <OrderInvoiceModal
          order={invoiceModalOrder}
          onClose={() => setInvoiceModalOrder(null)}
        />

        {/* Card Payment Modal fallback */}
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
    <Suspense
      fallback={
        <div className="p-16 text-center text-xs text-slate-400">
          در حال بارگذاری صفحه رهگیری سفارشات...
        </div>
      }
    >
      <OrderTrackingContent />
    </Suspense>
  );
}
