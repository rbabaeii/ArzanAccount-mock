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
  ShieldCheck,
  FileText,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import AmbientGlow from "@/components/ui/AmbientGlow";
import Card3D from "@/components/ui/Card3D";

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
        // Server-side verification
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
    <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors relative overflow-hidden">
      <Header />

      {/* Ambient Lighting Gradients */}
      <AmbientGlow variant={isSuccess ? "teal" : isManualReview ? "amber" : "mixed"} className="-top-20 -right-20" />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 pb-32 sm:pb-20 flex flex-col items-center justify-center relative z-10">
        <Card3D maxTilt={4} glareEffect={true} className="w-full rounded-3xl shadow-2xl">
          <div className="glass-panel rounded-3xl p-6 sm:p-9 text-center space-y-6 border border-brand-border/90 dark:border-slate-700/80">
            {isLoading && (
              <div className="py-12 space-y-4">
                <RefreshCw className="w-10 h-10 text-teal-600 dark:text-teal-400 animate-spin mx-auto" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  در حال استعلام وضعیت تراکنش از سامانه کارت‌به‌کارت...
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  لطفاً چند لحظه شکیبا باشید تا پیامک بانکی تطبیق داده شود.
                </p>
              </div>
            )}

            {!isLoading && isSuccess && (
              <div className="space-y-5 animate-in zoom-in-95 duration-200">
                <div className="w-18 h-18 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>

                <div className="space-y-1.5">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    تراکنش بانکی موفق
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    پرداخت شما با موفقیت تأیید شد!
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {paymentResult?.paymentType === "WALLET_TOPUP"
                      ? "موجودی کیف پول حساب کاربری شما با موفقیت شارژ گردید."
                      : "سفارش شما با موفقیت تکمیل شد و لایسنس/سرویس در دسترس شماست."}
                  </p>
                </div>

                {/* Order / Payment summary */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-brand-border/70 dark:border-slate-700 text-xs space-y-2.5 text-right">
                  {paymentResult?.orderNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">شماره سفارش:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-white">
                        #{paymentResult.orderNumber}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">مبلغ واریزی:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                      {formatPrice(paymentResult?.amountToman || 0)} تومان
                    </span>
                  </div>
                  {paymentResult?.paidAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">زمان تایید بانکی:</span>
                      <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {new Date(paymentResult.paidAt).toLocaleTimeString("fa-IR")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  {paymentResult?.paymentType === "WALLET_TOPUP" ? (
                    <Link
                      href="/profile"
                      className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white py-4 px-6 rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>مشاهده موجودی در پروفایل کاربری</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/orders?id=${paymentResult?.orderNumber || ""}`}
                      className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white py-4 px-6 rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <FileText className="w-4 h-4" />
                      <span>مشاهده سفارش و دریافت اطلاعات اکانت</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {!isLoading && isManualReview && (
              <div className="space-y-5 animate-in zoom-in-95 duration-200">
                <div className="w-18 h-18 rounded-3xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-md">
                  <Clock className="w-10 h-10 animate-pulse" />
                </div>

                <div className="space-y-1.5">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    در انتظار تایید مالی
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    واریز در صف بررسی کارشناسان
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    اطلاعات واریزی شما با موفقیت دریافت شد و در صف بررسی سریع اپراتورهای مالی قرار گرفت. به محض تایید، لایسنس صادر خواهد شد.
                  </p>
                </div>

                {paymentResult?.orderNumber && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex justify-between items-center">
                    <span className="text-amber-800 dark:text-amber-300">شماره سفارش:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-white">
                      #{paymentResult.orderNumber}
                    </span>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    href={`/orders?id=${paymentResult?.orderNumber || ""}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white py-4 px-6 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <span>رهگیری و مشاهده وضعیت سفارش</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </Link>
                </div>
              </div>
            )}

            {!isLoading && !isSuccess && !isManualReview && (
              <div className="space-y-5">
                <div className="w-18 h-18 rounded-3xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-md">
                  <AlertCircle className="w-10 h-10" />
                </div>

                <div className="space-y-1.5">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                    عدم تایید تراکنش
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    تأیید پرداخت ناموفق یا در انتظار واریز
                  </h2>
                  <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
                    {errorMsg ||
                      "پیامک واریزی مطابق با این تراکنش شناسایی نشد یا مهلت پرداخت به اتمام رسیده است."}
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2.5">
                  {paymentResult?.orderNumber && (
                    <Link
                      href={`/payment/card/${paymentResult.orderNumber}`}
                      className="w-full inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white py-3.5 px-6 rounded-2xl font-bold text-xs shadow-md transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>تلاش مجدد یا ثبت فیش واریزی</span>
                    </Link>
                  )}
                  <Link
                    href="/"
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3.5 px-6 rounded-2xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    <span>بازگشت به صفحه اصلی</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Card3D>
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
