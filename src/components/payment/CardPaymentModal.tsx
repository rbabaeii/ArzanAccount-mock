"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { formatPrice, formatNumber, toEnglishDigits } from "@/lib/format";
import { CARD_BIN_MAP, formatCardNumber } from "@/lib/iranian-banks";
import {
  X,
  CreditCard,
  Copy,
  Check,
  Clock,
  ExternalLink,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  ShieldCheck,
  HelpCircle,
  ArrowLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import JalaliDatePickerInput from "@/components/ui/JalaliDatePickerInput";
import ReceiptUploader from "@/components/payment/ReceiptUploader";

interface CardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amountToman: number;
  orderNumber?: string;
  orderId?: string;
  userId?: string;
  customerName?: string;
  customerPhone?: string;
  paymentType: "ORDER" | "WALLET_TOPUP";
  onSuccess: (result: any) => void;
}

export default function CardPaymentModal({
  isOpen,
  onClose,
  amountToman,
  orderNumber,
  orderId,
  userId,
  customerName,
  customerPhone,
  paymentType,
  onSuccess,
}: CardPaymentModalProps) {
  const [step, setStep] = useState<"AUTO" | "MANUAL" | "SUCCESS">("AUTO");
  const [isLoading, setIsLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Payment Initialization Data from Backend
  const [paymentData, setPaymentData] = useState<{
    id?: string;
    paymentToken: string;
    orderNumber: string;
    amountToman: number;
    amountRial: number;
    uniqueAmountRial: number;
    uniqueAmountToman: number;
    destCardNumber: string;
    destCardOwner: string;
    expiresAt?: string;
    paymentUrl?: string;
  } | null>(null);

  // Countdown Timer
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);

  // Manual Form States
  const [trackingCode, setTrackingCode] = useState("");
  const [userCardNumber, setUserCardNumber] = useState("");
  const [depositDate, setDepositDate] = useState("");
  const [depositHour, setDepositHour] = useState("");
  const [userNote, setUserNote] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulateInstantPayment = async () => {
    if (!paymentData?.paymentToken) return;
    setIsSimulating(true);
    try {
      const res = await api.simulateCardPaymentSuccess(paymentData.paymentToken);
      setSuccessMessage("پرداخت شما با موفقیت به صورت آنی تأیید گردید!");
      setStep("SUCCESS");
      setTimeout(() => {
        onSuccess(res?.payment || res);
      }, 1500);
    } catch (err: any) {
      console.error("Simulation error in modal:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Copied state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Success summary
  const [successMessage, setSuccessMessage] = useState("");

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Copy helper
  const handleCopy = (text: string, fieldName: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  // 1. Initialize Payment on Open
  useEffect(() => {
    if (!isOpen) {
      // Reset states
      setStep("AUTO");
      setPaymentData(null);
      setInitError(null);
      setTrackingCode("");
      setUserCardNumber("");
      setDepositDate("");
      setDepositHour("");
      setUserNote("");
      setReceiptUrl("");
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    let isMounted = true;
    const initiate = async () => {
      setIsLoading(true);
      setInitError(null);
      try {
        const callbackUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/payment/cartbecart/callback`
            : undefined;

        const res = await api.initiateCardPayment({
          amountToman,
          paymentType,
          orderNumber,
          orderId,
          userId,
          customerName,
          customerPhone,
          callbackUrl,
        });

        if (isMounted) {
          setPaymentData(res);
          if (res.expiresAt) {
            const diffSec = Math.max(
              0,
              Math.floor((new Date(res.expiresAt).getTime() - Date.now()) / 1000)
            );
            setSecondsRemaining(diffSec || 15 * 60);
          } else {
            setSecondsRemaining(15 * 60);
          }
        }
      } catch (err: any) {
        console.error("Failed to initiate CartBeCart payment:", err);
        if (isMounted) {
          setInitError(
            err?.message ||
              "خطا در ایجاد تراکنش کارت‌به‌کارت. می‌توانید فیش واریزی خود را به صورت دستی ثبت نمایید."
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initiate();

    return () => {
      isMounted = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, amountToman, orderNumber, orderId, userId, customerName, customerPhone, paymentType]);

  // 2. Countdown Timer Effect
  useEffect(() => {
    if (!isOpen || step !== "AUTO" || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, step, secondsRemaining]);

  // 3. Polling CartBeCart Status
  useEffect(() => {
    if (!isOpen || step !== "AUTO" || !paymentData?.paymentToken) return;

    const token = paymentData.paymentToken;

    const checkStatus = async () => {
      try {
        const res = await api.checkCardPaymentStatus(token);
        if (res && (res.status === "PAID" || res.status === "APPROVED" || res.isCompleted)) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setSuccessMessage("پرداخت شما با موفقیت به صورت آنی تأیید گردید!");
          setStep("SUCCESS");
          setTimeout(() => {
            onSuccess(res);
          }, 2500);
        } else if (res && (res.status === "MANUAL_REVIEW" || res.isNeedsReview)) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setSuccessMessage(
            "واریز شما شناسایی شده و در صف بررسی نهایی مدیریت قرار گرفت."
          );
          setStep("SUCCESS");
          setTimeout(() => {
            onSuccess({ ...res, isManualReview: true });
          }, 3000);
        } else if (res && res.status === "EXPIRED") {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setInitError(
            "مهلت پرداخت منقضی گردید. در صورتی که مبلغ را واریز کرده‌اید، لطفاً فیش واریزی خود را ثبت کنید."
          );
        }
      } catch (pollErr) {
        // Silent polling error, will retry on next interval
      }
    };

    // Initial check and 5s polling interval
    checkStatus();
    pollIntervalRef.current = setInterval(checkStatus, 5000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, step, paymentData?.paymentToken, onSuccess]);

  // Handle receipt image upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("لطفاً یک فایل تصویری (PNG, JPG, WEBP) معتبر انتخاب کنید.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("حجم فایل فیش نمی‌تواند بیش از ۵ مگابایت باشد.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await api.uploadFile(file, "receipts");
      if (res && res.url) {
        setReceiptUrl(res.url);
      } else {
        throw new Error("پاسخ سرور برای آپلود نامعتبر است.");
      }
    } catch (err: any) {
      console.error("Receipt upload error:", err);
      setUploadError(err?.message || "خطا در آپلود تصویر رسید. لطفاً مجدداً تلاش نمایید.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle manual submission
  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) {
      setManualError("کد پیگیری یا شماره ارجاع تراکنش بانکی الزامی است.");
      return;
    }

    setIsSubmittingManual(true);
    setManualError(null);

    try {
      const formattedDepositTime = [depositDate.trim(), depositHour.trim()].filter(Boolean).join(" - ");

      const res = await api.submitManualReceipt({
        paymentToken: paymentData?.paymentToken,
        amountToman: paymentData?.uniqueAmountToman || amountToman,
        paymentType,
        orderNumber: paymentData?.orderNumber || orderNumber,
        orderId,
        userId,
        trackingCode: toEnglishDigits(trackingCode.trim()),
        userCardNumber: userCardNumber ? toEnglishDigits(userCardNumber.trim()) : undefined,
        receiptUrl: receiptUrl || undefined,
        depositTime: formattedDepositTime || undefined,
        userNote: userNote.trim() || undefined,
      });

      setSuccessMessage(
        "اطلاعات فیش واریزی با موفقیت ثبت شد و در صف بررسی فوری مدیریت قرار گرفت."
      );
      setStep("SUCCESS");
      setTimeout(() => {
        onSuccess({ ...res, isManualReview: true });
      }, 3000);
    } catch (err: any) {
      console.error("Manual receipt submission failed:", err);
      setManualError(err?.message || "خطا در ثبت فیش واریزی. لطفاً دقایقی دیگر تلاش کنید.");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  if (!isOpen) return null;

  // Format timer into MM:SS
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Destination Card details
  const rawDestCard = paymentData?.destCardNumber || "6037998123456789";
  const formattedDestCard = formatCardNumber(rawDestCard);
  const cardBin = rawDestCard.replace(/\D/g, "").slice(0, 6);
  const detectedBankName = CARD_BIN_MAP[cardBin] || "بانک مبدا / شتاب";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        dir="rtl"
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <span>پرداخت کارت‌به‌کارت خودکار</span>
                <span className="text-[10px] bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold px-2 py-0.5 rounded-full border border-teal-500/20">
                  CartBeCart
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {paymentType === "ORDER"
                  ? `شماره سفارش: #${paymentData?.orderNumber || orderNumber || "جدید"}`
                  : "شارژ کیف پول کاربری"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {isLoading && (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-teal-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                در حال دریافت اطلاعات شماره کارت مقصد و شناسه پرداخت...
              </p>
            </div>
          )}

          {initError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-bold">{initError}</p>
                <button
                  type="button"
                  onClick={() => setStep("MANUAL")}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors"
                >
                  ثبت فیش به صورت دستی
                </button>
              </div>
            </div>
          )}

          {!isLoading && step === "AUTO" && paymentData && (
            <>
              {/* Countdown Banner */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                  <span className="font-medium text-[11px]">مهلت پرداخت و تطبیق پیامک:</span>
                </div>
                <span className="font-mono font-black text-sm text-amber-700 dark:text-amber-300 dir-ltr">
                  {formattedTime}
                </span>
              </div>

              {/* Exact Amount Notice */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 to-emerald-500/5 border border-teal-500/30 text-center space-y-2">
                <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300">
                  مبلغ دقیق و اختصاصی قابل واریز:
                </span>
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono dir-ltr select-all">
                      {formatNumber(paymentData.uniqueAmountRial || paymentData.amountRial)}
                    </span>
                    <span className="text-sm font-bold text-teal-700 dark:text-teal-300">ریال</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        String(paymentData.uniqueAmountRial || paymentData.amountRial),
                        "amountRial"
                      )
                    }
                    className="px-2.5 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    title="کپی مبلغ به ریال"
                  >
                    {copiedField === "amountRial" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                        <span className="text-[10px]">کپی شد!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">کپی مبلغ</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[11px] text-teal-900 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 p-2.5 rounded-xl border border-teal-200 dark:border-teal-800/60 leading-relaxed font-medium">
                  ⚠️ جهت تایید خودکار و آنی، لطفاً <strong>دقیقاً همین مبلغ فوق (به ریال)</strong> را بدون کم و کاست یا گرد کردن از اپلیکیشن همراه بانک خود انتقال دهید.
                </div>
              </div>

              {/* Destination Card Preview Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-800 to-teal-950 p-6 text-white shadow-xl border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    <span>{detectedBankName}</span>
                  </span>
                  <span className="text-[10px] tracking-widest text-slate-400 font-mono uppercase">
                    SHETAB
                  </span>
                </div>

                <div className="my-3">
                  <span className="text-[10px] text-slate-400 block mb-1">شماره کارت مقصد</span>
                  <div className="flex items-center justify-between gap-2">
                    <div
                      dir="ltr"
                      style={{ direction: "ltr" }}
                      className="font-mono text-lg sm:text-xl font-black text-amber-300 flex flex-row items-center gap-2 dir-ltr"
                    >
                      {formattedDestCard.split(" ").map((chunk, idx) => (
                        <span key={idx} dir="ltr" style={{ direction: "ltr" }} className="tracking-widest select-all">
                          {chunk}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(rawDestCard.replace(/\D/g, ""), "card")}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 text-white"
                    >
                      {copiedField === "card" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">کپی شد</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>کپی کارت</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">نام صاحب حساب</span>
                    <span className="font-bold text-slate-100">{paymentData.destCardOwner}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(paymentData.destCardOwner, "owner")}
                    className="text-[11px] text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedField === "owner" ? "کپی شد" : "کپی نام"}
                  </button>
                </div>
              </div>

              {/* Live Polling Status Radar */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-teal-500/20 text-teal-500 shrink-0">
                  <span className="absolute w-full h-full rounded-full bg-teal-500/30 animate-ping" />
                  <Zap className="w-4 h-4 relative" />
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-slate-900 dark:text-white">
                    در حال پایش آنی واریز بانکی...
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    به محض واریز کارت‌به‌کارت توسط شما، سیستم به صورت خودکار پیامک بانک را شناسایی کرده
                    و این صفحه تایید می‌شود.
                  </p>
                </div>
              </div>

              {/* Mock Instant Payment Approval Simulator */}
              <div className="p-3.5 rounded-2xl bg-amber-500/15 dark:bg-amber-950/40 border border-amber-400/80 dark:border-amber-600/70 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                  <span className="font-bold text-amber-950 dark:text-amber-200 text-[11px]">
                    آزمایش تایید فوری واریز (حالت ماک):
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={handleSimulateInstantPayment}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>در حال تایید...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 fill-slate-950" />
                      <span>تایید آنی ⚡</span>
                    </>
                  )}
                </button>
              </div>

              {/* Additional Actions & Fallback Switch */}
              <div className="space-y-2 pt-2">
                {paymentData.paymentUrl && (
                  <a
                    href={paymentData.paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span>مشاهده در درگاه میزبانی‌شده CartBeCart</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setStep("MANUAL")}
                  className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-200 hover:text-teal-700 dark:hover:text-teal-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-teal-300 dark:hover:border-teal-700"
                >
                  <FileText className="w-4 h-4" />
                  <span>ثبت دستی اطلاعات فیش واریزی</span>
                </button>
              </div>
            </>
          )}

          {/* Step: Manual Fallback Form */}
          {!isLoading && step === "MANUAL" && (
            <form onSubmit={handleSubmitManual} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep("AUTO")}
                  className="text-xs text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1 hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  <span>بازگشت به اطلاعات شماره کارت</span>
                </button>
                <span className="text-xs font-bold text-slate-500">ثبت اطلاعات فیش</span>
              </div>

              {manualError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium">
                  {manualError}
                </div>
              )}

              {/* Amount reminder */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">مبلغ واریزی:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {formatNumber(paymentData?.uniqueAmountRial || paymentData?.amountRial || amountToman * 10)} ریال
                  <span className="text-slate-400 font-normal text-[11px] mr-1.5">({formatNumber(amountToman)} تومان)</span>
                </span>
              </div>

              {/* Tracking Code (Required) */}
              <div className="space-y-1 text-xs">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  کد پیگیری / شماره ارجاع بانکی (موجود در رسید): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 984512 یا 14030712345"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 px-3 text-left font-mono dir-ltr outline-none text-xs"
                />
              </div>

              {/* Sender Card Number (Optional) */}
              <div className="space-y-1 text-xs">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  شماره کارت واریزکننده (۴ رقم آخر یا کامل):
                </label>
                <input
                  type="text"
                  placeholder="مثال: 6037... یا 4 رقم آخر"
                  value={userCardNumber}
                  onChange={(e) => setUserCardNumber(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 px-3 text-left font-mono dir-ltr outline-none text-xs"
                />
              </div>

              {/* Deposit Date & Time (Jalali) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 text-xs">
                  <label className="block font-bold text-slate-800 dark:text-slate-200">
                    تاریخ واریز فیش (تقویم شمسی):
                  </label>
                  <JalaliDatePickerInput
                    value={depositDate}
                    onChange={setDepositDate}
                    placeholder="انتخاب تاریخ واریز شمسی..."
                    maxDate="today"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="block font-bold text-slate-800 dark:text-slate-200">
                    ساعت واریز فیش:
                  </label>
                  <JalaliDatePickerInput
                    onlyTime={true}
                    value={depositHour}
                    onChange={setDepositHour}
                    placeholder="انتخاب یا درج ساعت (مثال: ۱۴:۳۰)..."
                  />
                </div>
              </div>

              {/* Receipt File Upload */}
              <div className="space-y-1 text-xs">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  تصویر فیش یا اسکرین‌شات رسید انتقال:
                </label>
                <ReceiptUploader
                  value={receiptUrl}
                  onChange={setReceiptUrl}
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                />
              </div>

              {/* User Note */}
              <div className="space-y-1 text-xs">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  توضیحات تکمیلی (اختیاری):
                </label>
                <textarea
                  rows={2}
                  placeholder="در صورتی که مبلغ با شماره دیگری واریز شده یا نکته خاصی هست..."
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2 px-3 outline-none text-xs resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmittingManual || isUploading}
                  className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingManual ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال ثبت فیش...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>ثبت و ارسال جهت بررسی فوری ادمین</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("AUTO")}
                  className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </form>
          )}

          {/* Step: Success Confirmation */}
          {step === "SUCCESS" && (
            <div className="py-10 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  عملیات با موفقیت انجام شد
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                  {successMessage || "پرداخت با موفقیت ثبت و تایید گردید."}
                </p>
              </div>

              <p className="text-[11px] text-slate-400">در حال انتقال به صفحه سفارش...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
