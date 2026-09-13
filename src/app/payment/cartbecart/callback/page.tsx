"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

function CartBeCartCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentToken = searchParams.get("payment_token") || searchParams.get("token") || "";
  const remoteStatus = searchParams.get("status") || "";

  const [isLoading, setIsLoading] = useState(true);
  const [paymentResult, setPaymentResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentToken) {
      setIsLoading(false);
      setErrorMsg("شناسه پرداخت نامعتبر یا یافت نشد.");
      return;
    }

    let isMounted = true;
    const verifyPayment = async () => {
      try {
        // Server-side verification (never rely purely on client browser redirect param)
        const res = await api.checkCardPaymentStatus(paymentToken);
        if (isMounted) {
          setPaymentResult(res);
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        if (isMounted) {
          setErrorMsg(err?.message || "خطا در استعلام وضعیت پرداخت از سرور.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    verifyPayment();

    return () => {
      isMounted = false;
    };
  }, [paymentToken]);

  const isSuccess =
    paymentResult?.status === "PAID" ||
    paymentResult?.status === "APPROVED" ||
    paymentResult?.isCompleted;

  const isManualReview =
    paymentResult?.status === "MANUAL_REVIEW" || paymentResult?.isNeedsReview;

  return (
    <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Header />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <div className="w-full bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-card text-center space-y-6">
          {isLoading && (
            <div className="py-12 space-y-4">
              <RefreshCw className="w-10 h-10 text-teal-600 dark:text-teal-400 animate-spin mx-auto" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                در حال استعلام وضعیت تراکنش از سامانه کارت‌به‌کارت...
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                لطفاً چند لحظه صبر نمایید تا پیامک بانکی تطبیق داده شود.
              </p>
            </div>
          )}

          {!isLoading && isSuccess && (
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  پرداخت شما با موفقیت تأیید شد!
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {paymentResult?.paymentType === "WALLET_TOPUP"
                    ? "موجودی کیف پول شما با موفقیت شارژ گردید."
                    : "سفارش شما تأیید گردید و لایسنس/سرویس در دسترس شماست."}
                </p>
              </div>

              {/* Order / Payment summary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2 text-right">
                {paymentResult?.orderNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">شماره ارجاع / سفارش:</span>
                    <span className="font-mono font-bold">{paymentResult.orderNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">مبلغ واریزی:</span>
                  <span className="font-bold text-emerald-600">
                    {formatPrice(paymentResult?.amountToman || 0)} تومان
                  </span>
                </div>
                {paymentResult?.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">زمان تایید بانکی:</span>
                    <span className="font-mono text-[11px]">
                      {new Date(paymentResult.paidAt).toLocaleTimeString("fa-IR")}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                {paymentResult?.paymentType === "WALLET_TOPUP" ? (
                  <Link
                    href="/profile"
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3.5 px-6 rounded-xl font-bold text-xs shadow-md hover:opacity-90 transition-all"
                  >
                    <span>مشاهده موجودی کیف پول</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </Link>
                ) : (
                  <Link
                    href={`/orders?id=${paymentResult?.orderNumber || ""}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3.5 px-6 rounded-xl font-bold text-xs shadow-md hover:opacity-90 transition-all"
                  >
                    <span>مشاهده سفارش و دریافت اطلاعات اکانت</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {!isLoading && isManualReview && (
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
                <Clock className="w-10 h-10 animate-pulse" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  واریز در انتظار تایید مدیریت
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  اطلاعات واریزی شما دریافت گردید و به دلیل نیاز به تایید تکمیلی در صف بررسی کارشناسان
                  مالی قرار گرفت. به محض تایید، سفارش تکمیل خواهد شد.
                </p>
              </div>

              {paymentResult?.orderNumber && (
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs flex justify-between">
                  <span className="text-amber-800 dark:text-amber-300">شماره سفارش:</span>
                  <span className="font-mono font-bold">{paymentResult.orderNumber}</span>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href={`/orders?id=${paymentResult?.orderNumber || ""}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 text-white py-3.5 px-6 rounded-xl font-bold text-xs hover:bg-slate-700 transition-all"
                >
                  <span>رهگیری و مشاهده وضعیت سفارش</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>
          )}

          {!isLoading && !isSuccess && !isManualReview && (
            <div className="space-y-5">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  تأیید پرداخت ناموفق یا در انتظار واریز
                </h2>
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  {errorMsg ||
                    "پیامک واریزی مطابق با این تراکنش شناسایی نشد یا مهلت پرداخت به اتمام رسیده است."}
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                {paymentResult?.orderNumber && (
                  <Link
                    href={`/orders?id=${paymentResult.orderNumber}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-teal-600 text-white py-3 px-6 rounded-xl font-bold text-xs shadow-sm hover:bg-teal-700 transition-all"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>تلاش مجدد و ثبت فیش واریزی</span>
                  </Link>
                )}
                <Link
                  href="/"
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 px-6 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <span>بازگشت به صفحه اصلی</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CartBeCartCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-xs text-slate-400">
          در حال بارگذاری صفحه بازگشت از پرداخت...
        </div>
      }
    >
      <CartBeCartCallbackContent />
    </Suspense>
  );
}
