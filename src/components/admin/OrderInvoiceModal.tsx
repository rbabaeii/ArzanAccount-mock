"use client";

import React, { useRef } from "react";
import { Order } from "@/types";
import { formatNumber, formatPrice, numberToPersianWords } from "@/lib/format";
import { toPersianDateTime } from "@/lib/date";
import {
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Mail,
  Phone,
  FileText,
  Building2,
  User,
  Info,
  QrCode,
} from "lucide-react";

interface OrderInvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const subtotal = order.items.reduce((sum, item) => sum + item.priceToman * item.quantity, 0);
  const discount = order.discountAppliedToman || 0;
  const finalTotal = order.totalPriceToman || (subtotal - discount);
  const totalWords = numberToPersianWords(finalTotal);

  return (
    <div
      id="printable-invoice-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6"
    >
      {/* Top Floating Control Bar - Excluded from Print */}
      <div className="no-print fixed top-4 inset-x-4 max-w-4xl mx-auto flex items-center justify-between gap-3 bg-slate-900/90 border border-slate-700/80 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold">پیش‌نمایش و صدور فاکتور رسمی</span>
            <span className="text-xs text-slate-400 mr-2">سفارش {order.orderNumber}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-teal-900/30"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ فاکتور / ذخیره PDF</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Invoice Paper Document */}
      <div
        id="invoice-paper"
        dir="rtl"
        className="mt-16 sm:mt-14 mb-8 bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-2xl w-full max-w-4xl p-6 sm:p-10 font-sans relative overflow-hidden"
        style={{
          colorScheme: "light",
          backgroundColor: "#ffffff",
          color: "#0f172a",
        }}
      >
        {/* Print Stylesheet Injection */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-invoice-modal, #printable-invoice-modal * {
              visibility: visible !important;
            }
            #printable-invoice-modal {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              min-height: 100% !important;
              background: #ffffff !important;
              z-index: 999999 !important;
              padding: 0 !important;
              margin: 0 !important;
              overflow: visible !important;
            }
            #invoice-paper {
              position: static !important;
              box-shadow: none !important;
              border: 1px solid #cbd5e1 !important;
              border-radius: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 12mm 14mm !important;
              background-color: #ffffff !important;
              color: #0f172a !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}} />

        {/* 1. Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b-2 border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-black text-2xl shadow-md">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  ارزان اکانت
                </h1>
                <span className="text-xs bg-slate-100 border border-slate-300 text-slate-700 px-2 py-0.5 rounded font-mono">
                  arzanaccount.com
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                سامانه هوشمند توزیع و فعال‌سازی فوری اشتراک‌های قانونی دیجیتال
              </p>
            </div>
          </div>

          <div className="text-left bg-slate-50 border border-slate-200 rounded-xl p-3 min-w-[210px] space-y-1.5 self-stretch sm:self-auto">
            <div className="flex items-center justify-between text-xs gap-3">
              <span className="text-slate-500">شماره فاکتور:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{order.orderNumber}</span>
            </div>
            <div className="flex items-center justify-between text-xs gap-3">
              <span className="text-slate-500">تاریخ صدور:</span>
              <span className="font-mono text-slate-800">{toPersianDateTime(order.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between text-xs gap-3">
              <span className="text-slate-500">وضعیت سند:</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                <span>پرداخت و تسویه شده</span>
              </span>
            </div>
          </div>
        </div>

        {/* 2. Official Document Title */}
        <div className="my-5 text-center">
          <span className="inline-block bg-slate-900 text-white text-xs sm:text-sm font-extrabold px-6 py-1.5 rounded-lg tracking-wide uppercase">
            صورت‌حساب فروش کالا و خدمات (فاکتور رسمی)
          </span>
        </div>

        {/* 3. Seller & Buyer Details Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Seller Card */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/70">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 pb-2 border-b border-slate-200 mb-3">
              <Building2 className="w-4 h-4 text-teal-700" />
              <span>مشخصات فروشنده (ارائه‌دهنده خدمت)</span>
            </div>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">نام شخص حقوقی:</span>
                <span className="font-semibold text-slate-900">سامانه خدمات اینترنتی ارزان اکانت</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">آدرس وبگاه:</span>
                <span className="font-mono text-slate-900">https://arzanaccount.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">پشتیبانی تلگرام:</span>
                <span className="font-mono text-slate-900">@arzan_support</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">درگاه پرداخت:</span>
                <span className="font-semibold text-slate-900">
                  {order.paymentGateway === "cartbecart"
                    ? "کارت‌به‌کارت (CartBeCart)"
                    : order.paymentGateway === "zarinpal"
                    ? "شاپرک / زرین‌پال"
                    : order.paymentGateway === "nextpay"
                    ? "شاپرک / نکست‌پی"
                    : "ارز دیجیتال (تتر)"}
                </span>
              </div>
            </div>
          </div>

          {/* Buyer Card */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/70">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 pb-2 border-b border-slate-200 mb-3">
              <User className="w-4 h-4 text-teal-700" />
              <span>مشخصات خریدار (مشتری)</span>
            </div>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">آدرس ایمیل:</span>
                <span className="font-mono font-semibold text-slate-900">{order.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">شماره تلفن همراه:</span>
                <span className="font-mono text-slate-900">{order.customerPhone || "ثبت نشده"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">شناسه لینک تحویل:</span>
                <span className="font-mono text-slate-900 truncate max-w-[200px]" title={order.customerLink}>
                  {order.customerLink || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">شناسه یکتای سفارش:</span>
                <span className="font-mono text-slate-800 text-[11px]">{order.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Products & Services Table */}
        <div className="mb-6 overflow-hidden rounded-xl border border-slate-300">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                <th className="py-2.5 px-3 w-12 text-center">ردیف</th>
                <th className="py-2.5 px-4">شرح کالا یا خدمات</th>
                <th className="py-2.5 px-3 w-16 text-center">تعداد</th>
                <th className="py-2.5 px-4 w-28 text-left">مبلغ واحد (تومان)</th>
                <th className="py-2.5 px-4 w-24 text-left">تخفیف</th>
                <th className="py-2.5 px-4 w-32 text-left">مبلغ کل (تومان)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items.map((item, idx) => {
                const itemTotal = item.priceToman * item.quantity;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{item.productTitle}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">شناسه: {item.productId}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                      {formatNumber(item.quantity)}
                    </td>
                    <td className="py-3 px-4 text-left font-mono font-semibold text-slate-800">
                      {formatPrice(item.priceToman)}
                    </td>
                    <td className="py-3 px-4 text-left font-mono text-slate-500">۰</td>
                    <td className="py-3 px-4 text-left font-mono font-bold text-slate-900">
                      {formatPrice(itemTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 5. Summary & Words */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Words and Legal Notice */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-600 mb-1">مبلغ کل پرداختی به حروف:</div>
              <div className="text-sm font-extrabold text-teal-900 bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs">
                {totalWords ? `${totalWords} تومان` : `${formatPrice(finalTotal)} تومان`}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-700">توضیحات:</span> این فاکتور الکترونیکی معتبر بوده و نیازی به امضای فیزیکی ندارد. تمامی لایسنس‌ها و اکانت‌های مربوط به این سفارش با ضمانت سلامت و اورجینال بودن به کاربر تحویل گردیده است.
            </div>
          </div>

          {/* Financial Calculation Summary Table */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>مجموع بهای ناخالص اقلام:</span>
              <span className="font-mono font-semibold text-slate-900">{formatPrice(subtotal)} تومان</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>تخفیف اعمال شده:</span>
              <span className="font-mono text-rose-600">
                {discount > 0 ? `- ${formatPrice(discount)} تومان` : "۰ تومان"}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>مالیات بر ارزش افزوده (VAT):</span>
              <span className="font-mono text-slate-500">۰ تومان (معاف)</span>
            </div>
            <div className="pt-2 border-t-2 border-slate-800 flex justify-between items-center text-sm font-black text-slate-950">
              <span>مبلغ نهایی پرداخت شده:</span>
              <span className="font-mono text-base text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-lg">
                {formatPrice(finalTotal)} تومان
              </span>
            </div>
          </div>
        </div>

        {/* 6. Admin Verification Stamp & Digital Security Seal */}
        <div className="pt-4 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Approval Signoff */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>تایید شده توسط مدیریت:</span>
                <span className="text-teal-900 font-semibold underline decoration-teal-500">
                  {order.approvedByAdminName || "مدیریت ارشد ارزان اکانت"}
                </span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                شناسه پیگیری سیستمی: {order.orderNumber} • کد رهگیری شاپرک
              </div>
            </div>
          </div>

          {/* Official Digital Stamp Graphic */}
          <div className="flex items-center gap-4">
            <div className="border-2 border-dashed border-teal-700/60 rounded-xl p-2.5 text-center bg-teal-50/40 text-teal-900 rotate-[-2deg] shadow-2xs">
              <div className="text-[10px] font-black uppercase tracking-wider text-teal-800">
                ★ گواهی اصالت و تحویل ★
              </div>
              <div className="text-xs font-black my-0.5 text-teal-950">
                ارزان اکانت
              </div>
              <div className="text-[9px] text-teal-700 font-mono">
                صادر شد • {order.orderNumber}
              </div>
            </div>
          </div>
        </div>

        {/* 7. Document Footer */}
        <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10.5px] text-slate-500 flex items-center justify-between">
          <span>سامانه هوشمند فروش و توزیع اشتراک‌های قانونی ارزان اکانت</span>
          <span className="font-mono">arzanaccount.com</span>
        </div>
      </div>
    </div>
  );
};
