"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import { api } from "@/lib/api";
import { formatPrice, formatNumber, toEnglishDigits } from "@/lib/format";
import { CARD_BIN_MAP, formatCardNumber } from "@/lib/iranian-banks";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import {
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
  ArrowRight,
  Sparkles,
  ShoppingBag,
  User,
  Phone,
  Mail,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Radio,
} from "lucide-react";
import AmbientGlow from "@/components/ui/AmbientGlow";
import Card3D from "@/components/ui/Card3D";
import AnimatedStepper from "@/components/ui/AnimatedStepper";
import GlowOverlay from "@/components/ui/GlowOverlay";
import JalaliDatePickerInput from "@/components/ui/JalaliDatePickerInput";
import ReceiptUploader from "@/components/payment/ReceiptUploader";

export default function CardPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { calculateProductPrice } = useStore();

  const orderNumber = typeof params?.orderNumber === "string" ? params.orderNumber : "";

  // Page-level States
  const [order, setOrder] = useState<any | null>(null);
  const [isOrderLoading, setIsOrderLoading] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Payment Initialization State
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
    status?: string;
  } | null>(null);

  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentInitError, setPaymentInitError] = useState<string | null>(null);

  // Active Tab: 'AUTO' (Default Card-to-Card) vs 'MANUAL' (Fallback Receipt)
  const [activeTab, setActiveTab] = useState<"AUTO" | "MANUAL">("AUTO");

  // Payment Outcome
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PAID" | "MANUAL_REVIEW" | "FAILED">("PENDING");
  const [successInfo, setSuccessInfo] = useState<any | null>(null);

  // Countdown Timer
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);

  // Copy Feedback State
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Order Details from Backend
  useEffect(() => {
    if (!orderNumber) {
      setIsOrderLoading(false);
      setOrderError("شماره سفارش نامعتبر است.");
      return;
    }

    let isMounted = true;
    const fetchOrder = async () => {
      setIsOrderLoading(true);
      setOrderError(null);
      try {
        const data = await api.getOrderById(orderNumber);
        if (!isMounted) return;

        if (!data) {
          throw new Error(`سفارش با شماره #${orderNumber} یافت نشد.`);
        }

        setOrder(data);

        // If order is already completed or paid
        if (data.status === "completed" || data.status === "delivered") {
          setPaymentStatus("PAID");
          setSuccessInfo(data);
        }
      } catch (err: any) {
        console.error("Fetch order error:", err);
        if (isMounted) {
          setOrderError(err?.message || "خطا در دریافت اطلاعات سفارش از سرور.");
        }
      } finally {
        if (isMounted) setIsOrderLoading(false);
      }
    };

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [orderNumber]);

  // 2. Initiate CartBeCart Payment once Order is Loaded
  const initiatePayment = useCallback(async () => {
    if (!order || paymentStatus === "PAID") return;

    setIsPaymentLoading(true);
    setPaymentInitError(null);
    try {
      const callbackUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/payment/cartbecart/callback`
          : undefined;

      const res = await api.initiateCardPayment({
        amountToman: order.totalPriceToman,
        paymentType: "ORDER",
        orderNumber: order.orderNumber,
        orderId: order.id,
        userId: user?.id,
        customerName: order.customerEmail || user?.name || "مشتری گرامی",
        customerPhone: order.customerPhone || user?.phone,
        callbackUrl,
      });

      setPaymentData(res);
      setPaymentStatus("PENDING");
      if (res.expiresAt) {
        const diffSec = Math.max(
          0,
          Math.floor((new Date(res.expiresAt).getTime() - Date.now()) / 1000)
        );
        setSecondsRemaining(diffSec > 0 ? diffSec : 15 * 60);
      } else {
        setSecondsRemaining(15 * 60);
      }
    } catch (err: any) {
      console.error("CartBeCart initiation error:", err);
      setPaymentInitError(
        err?.message ||
          "خطا در ایجاد تراکنش کارت‌به‌کارت. می‌توانید فیش واریزی خود را به صورت دستی ثبت فرمایید."
      );
    } finally {
      setIsPaymentLoading(false);
    }
  }, [order, paymentStatus, user?.id, user?.name, user?.phone]);

  useEffect(() => {
    initiatePayment();
  }, [initiatePayment]);

  // 3. Countdown Timer Tick
  useEffect(() => {
    if (paymentStatus === "PAID" || paymentStatus === "FAILED" || secondsRemaining <= 0) return;

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
  }, [paymentStatus, secondsRemaining]);

  // 4. Real-time Status Polling
  useEffect(() => {
    if (
      !paymentData?.paymentToken ||
      paymentStatus === "PAID" ||
      paymentStatus === "FAILED" ||
      secondsRemaining <= 0
    ) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await api.checkCardPaymentStatus(paymentData.paymentToken);
        if (res?.status === "PAID" || res?.status === "APPROVED" || res?.isCompleted) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setPaymentStatus("PAID");
          setSuccessInfo(res);
          // Refetch order to get updated license/delivered accounts
          try {
            const freshOrder = await api.getOrderById(orderNumber);
            if (freshOrder) setOrder(freshOrder);
          } catch {
            // silent
          }
        } else if (res?.status === "MANUAL_REVIEW") {
          setPaymentStatus("MANUAL_REVIEW");
        } else if (res?.status === "EXPIRED" || res?.status === "FAILED") {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setPaymentStatus("FAILED");
        }
      } catch {
        // Silent polling error, will retry on next interval
      }
    };

    // Immediate check + interval every 3.5 seconds
    checkStatus();
    pollIntervalRef.current = setInterval(checkStatus, 3500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [paymentData?.paymentToken, paymentStatus, secondsRemaining, orderNumber]);

  // Copy helper
  const handleCopy = (text: string, fieldName: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  // Receipt upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("لطفاً یک فایل تصویری معتبر (JPG, PNG, WEBP) انتخاب نمایید.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("حجم تصویر نباید بیشتر از ۵ مگابایت باشد.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await api.uploadFile(file, "receipts");
      if (res && res.url) {
        setReceiptUrl(res.url);
      } else {
        throw new Error("پاسخ سرور برای آپلود فایل نامعتبر است.");
      }
    } catch (err: any) {
      console.error("Receipt upload error:", err);
      setUploadError(err?.message || "خطا در آپلود تصویر رسید.");
    } finally {
      setIsUploading(false);
    }
  };

  // Submit manual receipt
  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) {
      setManualError("کد پیگیری یا شماره ارجاع بانکی (RRN) الزامی است.");
      return;
    }

    setIsSubmittingManual(true);
    setManualError(null);
    setManualSuccessMsg(null);

    try {
      const formattedDepositTime = [depositDate.trim(), depositHour.trim()].filter(Boolean).join(" - ");

      const res = await api.submitManualReceipt({
        paymentToken: paymentData?.paymentToken,
        amountToman: paymentData?.uniqueAmountToman || order?.totalPriceToman || 0,
        paymentType: "ORDER",
        orderNumber: order?.orderNumber,
        orderId: order?.id,
        userId: user?.id,
        trackingCode: trackingCode.trim(),
        userCardNumber: userCardNumber.trim() || undefined,
        depositTime: formattedDepositTime || undefined,
        receiptUrl: receiptUrl || undefined,
        userNote: userNote.trim() || undefined,
      });

      if (res?.paymentToken || res?.payment?.paymentToken) {
        setPaymentData((prev: any) => ({
          ...prev,
          paymentToken: res.paymentToken || res.payment?.paymentToken,
        }));
      }

      setPaymentStatus("MANUAL_REVIEW");
      setManualSuccessMsg(
        res?.message ||
          "اطلاعات فیش واریزی با موفقیت ثبت شد و برای تایید فوری در صف بررسی کارشناسان مالی قرار گرفت."
      );
    } catch (err: any) {
      console.error("Manual receipt submission error:", err);
      setManualError(err?.message || "خطا در ثبت فیش. لطفاً دوباره تلاش نمایید.");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // Format countdown
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Destination Card Bank recognition
  const rawDestCard = paymentData?.destCardNumber || "6037998123456789";
  const cardBin = rawDestCard.replace(/\D/g, "").substring(0, 6);
  const detectedBankName = CARD_BIN_MAP[cardBin] || "بانک عضو شبکه شتاب";
  const formattedDestCard = formatCardNumber(rawDestCard);

  // Delivery type calculations
  const isHybrid = order?.isHybridOrder;
  const isAccountActivation =
    order?.deliveryType === "account_activation" ||
    order?.activationItemsCount > 0;

  // Order Items
  const orderItems = useMemo(() => {
    if (!order?.items) return [];
    if (typeof order.items === "string") {
      try {
        return JSON.parse(order.items);
      } catch {
        return [];
      }
    }
    return Array.isArray(order.items) ? order.items : [];
  }, [order?.items]);

  // Delivered Accounts (if completed)
  const deliveredAccounts = useMemo(() => {
    if (!order?.deliveredAccounts) return [];
    if (typeof order.deliveredAccounts === "string") {
      try {
        return JSON.parse(order.deliveredAccounts);
      } catch {
        return [order.deliveredAccounts];
      }
    }
    return Array.isArray(order.deliveredAccounts) ? order.deliveredAccounts : [];
  }, [order?.deliveredAccounts]);

  return (
    <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors relative overflow-hidden">
      <Header />

      {/* Ambient Lighting Gradients */}
      <AmbientGlow variant="teal" className="-top-20 -right-20" />
      <AmbientGlow variant="amber" className="top-1/3 -left-28 opacity-25" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-12 pb-32 sm:pb-20 relative z-10">
        {/* Step Progress Stepper */}
        <AnimatedStepper currentStep={paymentStatus === "PAID" ? 4 : 3} className="mb-8 sm:mb-10" />

        {/* Order Loading State */}
        {isOrderLoading && (
          <div className="py-24 text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-teal-500 animate-spin mx-auto" />
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              در حال فراخوانی مشخصات سفارش #{orderNumber}...
            </h2>
            <p className="text-xs text-slate-400">لطفاً چند لحظه شکیبا باشید.</p>
          </div>
        )}

        {/* Order Error State */}
        {!isOrderLoading && orderError && (
          <div className="max-w-lg mx-auto p-6 rounded-3xl glass-panel text-center space-y-4 border border-rose-200 dark:border-rose-900/60 shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">سفارش یافت نشد</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {orderError}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href="/cart"
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all"
              >
                بازگشت به سبد خرید
              </Link>
              <Link
                href="/"
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all"
              >
                صفحه اصلی فروشگاه
              </Link>
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        {!isOrderLoading && order && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Right Column: Payment Actions & Card UI (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Payment Completed State */}
              {paymentStatus === "PAID" && (
                <div className="glass-panel border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-card space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-10 h-10 animate-bounce" />
                  </div>

                  <div className="text-center space-y-2">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      پرداخت کارت‌به‌کارت با موفقیت تأیید شد
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      سفارش شما با موفقیت تکمیل گردید!
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                      تراکنش واریزی شما با شماره پیگیری بانکی در سیستم ثبت و فاکتور پرداخت صادر شد.
                    </p>
                  </div>

                  {/* License / Delivery Box */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>اطلاعات تحویل و دسترسی به سفارش</span>
                      </span>
                      <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-bold">
                        #{order.orderNumber}
                      </span>
                    </div>

                    {deliveredAccounts.length > 0 ? (
                      <div className="space-y-2">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                          لایسنس‌ها و اطلاعات اکانت‌های صادره:
                        </span>
                        {deliveredAccounts.map((acc: string, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-500/30 text-xs font-mono text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2 shadow-xs"
                          >
                            <span className="truncate">{acc}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(acc, `acc_${idx}`)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-teal-600 transition-colors shrink-0 cursor-pointer"
                              title="کپی متن"
                            >
                              {copiedField === `acc_${idx}` ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : isAccountActivation ? (
                      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                        این سفارش نیازمند <strong>فعال‌سازی فنی توسط کارشناسان</strong> است. سفارش شما در صف پردازش قرار گرفت و به زودی از طریق پیامک و ایمیل اطلاع‌رسانی خواهد شد.
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                        اطلاعات تحویل و لینک فعال‌سازی به آدرس ایمیل شما ارسال شد. همچنین می‌توانید در صفحه پیگیری سفارشات آن را مشاهده نمایید.
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link
                      href={`/orders?id=${order.orderNumber}`}
                      className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs py-3.5 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>مشاهده فاکتور کامل و پیگیری</span>
                    </Link>
                    <Link
                      href="/"
                      className="px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all text-center"
                    >
                      بازگشت به فروشگاه
                    </Link>
                  </div>
                </div>
              )}

              {/* Payment Under Manual Review State */}
              {paymentStatus === "MANUAL_REVIEW" && (
                <div className="glass-panel border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-card space-y-5 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
                    <Clock className="w-10 h-10 animate-spin" />
                  </div>

                  <div className="text-center space-y-2">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      فیش واریزی در صف بررسی مالی
                    </span>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      اطلاعات پرداخت با موفقیت ثبت شد
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                      {manualSuccessMsg ||
                        "فیش و کد پیگیری شما برای اپراتورهای مالی ارسال گردید. به محض تطبیق واریز، اکانت صادر و به ایمیل شما ارسال خواهد شد."}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>زمان بررسی و تایید: معمولاً بین ۵ الی ۱۵ دقیقه</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                      وضعیت سفارش به صورت زنده تغییر خواهد کرد و نیازی به تماس تلفنی با پشتیبانی نیست.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-center gap-3">
                    <Link
                      href={`/orders?id=${order.orderNumber}`}
                      className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>پیگیری وضعیت سفارش</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Payment Failed or Expired State */}
              {paymentStatus === "FAILED" && (
                <div className="glass-panel border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 shadow-card space-y-5 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-3xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
                    <AlertCircle className="w-10 h-10" />
                  </div>

                  <div className="text-center space-y-2">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                      مهلت واریز به اتمام رسید یا تراکنش منقضی شد
                    </span>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      انقضای تراکنش پرداخت
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                      مهلت ۱۵ دقیقه‌ای واریز و تطبیق پیامک برای این تراکنش به پایان رسیده است. در صورت تمایل می‌توانید شماره کارت و مهلت جدید دریافت نمایید یا فیش واریزی خود را به صورت دستی ثبت فرمایید.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => initiatePayment()}
                      className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>دریافت مجدد شماره کارت و مهلت جدید</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("MANUAL");
                        setPaymentStatus("PENDING");
                      }}
                      className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>ثبت دستی فیش واریزی</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Pending Payment Box (Card-to-Card Details) */}
              {paymentStatus === "PENDING" && (
                <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
                  {/* Header & Tabs */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-brand-border/60 dark:border-slate-800">
                    <div>
                      <h1 className="text-lg font-black text-brand-dark dark:text-white flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        <span>پرداخت کارت‌به‌کارت هوشمند</span>
                      </h1>
                      <p className="text-xs text-brand-muted dark:text-slate-400 mt-1">
                        انتقال وجه از کلیه بانک‌های عضو شتاب با پایش خودکار پیامک بانک
                      </p>
                    </div>

                    {/* Tab switch */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl text-xs font-bold shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveTab("AUTO")}
                        className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                          activeTab === "AUTO"
                            ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                        }`}
                      >
                        واریز خودکار
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("MANUAL")}
                        className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                          activeTab === "MANUAL"
                            ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                        }`}
                      >
                        ثبت دستی فیش
                      </button>
                    </div>
                  </div>

                  {/* Payment Loading Indicator */}
                  {isPaymentLoading && (
                    <div className="py-12 text-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-teal-500 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        در حال اتصال به سامانه کارت‌به‌کارت و دریافت شماره کارت فعال...
                      </p>
                    </div>
                  )}

                  {/* Payment Error */}
                  {paymentInitError && (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="font-bold">{paymentInitError}</p>
                        <button
                          type="button"
                          onClick={() => setActiveTab("MANUAL")}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          ثبت مشخصات فیش واریزی دستی
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AUTO Tab Content */}
                  {!isPaymentLoading && activeTab === "AUTO" && paymentData && (
                    <div className="space-y-6">
                      {/* Countdown Banner */}
                      <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                          <span className="font-medium text-[11.5px]">مهلت واریز و تطبیق پیامک:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm sm:text-base text-amber-700 dark:text-amber-300 dir-ltr">
                            {formattedTime}
                          </span>
                          {secondsRemaining <= 0 && (
                            <span className="text-[10px] text-rose-600 font-bold">منقضی شده</span>
                          )}
                        </div>
                      </div>

                      {/* Exact Amount Highlight Box */}
                      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500/15 via-emerald-500/10 to-teal-900/10 dark:from-teal-950/60 dark:via-emerald-950/30 dark:to-slate-900 border border-teal-500/30 p-5 text-center space-y-3 shadow-sm">
                        <span className="text-xs font-bold text-teal-800 dark:text-teal-200 block">
                          مبلغ دقیق و اختصاصی قابل واریز (تومان):
                        </span>

                        <div className="flex items-center justify-center gap-3">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl sm:text-4xl font-black text-brand-dark dark:text-white font-mono tracking-tight dir-ltr">
                              {formatNumber(paymentData.uniqueAmountToman)}
                            </span>
                            <span className="text-sm font-bold text-teal-700 dark:text-teal-300">تومان</span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(String(paymentData.uniqueAmountToman), "amountToman")
                            }
                            className="p-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-700 dark:text-teal-300 transition-colors cursor-pointer"
                            title="کپی مبلغ به تومان"
                          >
                            {copiedField === "amountToman" ? (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                <Check className="w-3.5 h-3.5" />
                                <span>کپی شد</span>
                              </span>
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 dir-ltr">
                          معادل {formatNumber(paymentData.uniqueAmountRial)} ریال
                        </div>

                        {/* Crucial Instructions Banner */}
                        <div className="text-right text-[11.5px] text-teal-950 dark:text-teal-200 bg-teal-50/80 dark:bg-teal-950/80 p-3.5 rounded-2xl border border-teal-200/80 dark:border-teal-800/80 leading-relaxed font-medium space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>نکته حیاتی جهت تایید خودکار و آنی:</span>
                          </div>
                          <p>
                            لطفاً <strong>دقیقاً همین مبلغ فوق (شامل ارقام انتهایی)</strong> را بدون گرد کردن به شماره کارت زیر انتقال دهید. سامانه هوشمند با تطبیق دقیق مبلغ واریزی، سفارش شما را بدون معطلی فعال می‌نماید.
                          </p>
                        </div>
                      </div>

                      {/* Luxury 3D Iranian Bank Card Mockup with Ambient Glow */}
                      <GlowOverlay variant="teal" intensity="normal" className="w-full">
                        <Card3D maxTilt={6} glareEffect={true} className="rounded-3xl shadow-2xl">
                          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-slate-950 via-slate-900 to-teal-950 p-6 sm:p-7 text-white border border-slate-800">
                            {/* Shimmer / Glow effects */}
                            <div className="absolute -right-16 -top-16 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

                            {/* Card Top: Bank & Chip */}
                            <div className="flex items-center justify-between relative z-10 mb-6">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                                  <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-white block">
                                    {detectedBankName}
                                  </span>
                                  <span className="text-[9.5px] text-teal-300/80">شبکه تبادل اطلاعات بانکی (شتاب)</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-300 to-amber-500 shadow-inner flex items-center justify-center opacity-90">
                                  <div className="w-7 h-5 border border-amber-800/40 rounded-sm grid grid-cols-2 gap-0.5 opacity-60" />
                                </div>
                                <span className="text-xs tracking-widest text-slate-400 font-mono font-bold">
                                  SHETAB
                                </span>
                              </div>
                            </div>

                            {/* Card Number & 1-Click Copy */}
                            <div className="my-6 relative z-10 space-y-2">
                              <span className="text-[10.5px] text-slate-400 block font-medium">
                                شماره کارت ۱۶ رقمی مقصد جهت واریز
                              </span>

                              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-sm">
                                <div
                                  dir="ltr"
                                  style={{ direction: "ltr" }}
                                  className="font-mono text-lg sm:text-2xl font-black text-amber-300 select-all flex flex-row items-center gap-2 sm:gap-3.5 dir-ltr"
                                >
                                  {formattedDestCard.split(" ").map((chunk, idx) => (
                                    <span key={idx} dir="ltr" style={{ direction: "ltr" }} className="tracking-widest select-all">
                                      {chunk}
                                    </span>
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleCopy(rawDestCard.replace(/\D/g, ""), "cardNum")}
                                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 shrink-0 cursor-pointer"
                                >
                                  {copiedField === "cardNum" ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                      <span>کپی شد!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>کپی شماره کارت</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Card Bottom: Owner Name */}
                            <div className="flex items-end justify-between relative z-10 pt-2 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-400 block mb-0.5">صاحب حساب مقصد</span>
                                <span className="font-bold text-white tracking-wide text-sm flex items-center gap-1.5">
                                  <span>{paymentData.destCardOwner || "رضا بابایی - ارزان اکانت"}</span>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                                </span>
                              </div>

                              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                تایید شده شاپرک
                              </span>
                            </div>
                          </div>
                        </Card3D>
                      </GlowOverlay>

                      {/* Live Auto-Polling Radar Banner */}
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-800 dark:text-teal-300">
                        <div className="flex items-center gap-3">
                          <div className="relative flex items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-teal-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
                          </div>
                          <div>
                            <span className="font-bold block">سامانه در حال پایش لحظه‌ای واریز است...</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              پس از واریز، صفحه به صورت خودکار تغییر وضعیت داده و لایسنس صادر می‌شود.
                            </span>
                          </div>
                        </div>

                        <RefreshCw className="w-4 h-4 animate-spin text-teal-600 dark:text-teal-400 shrink-0" />
                      </div>

                      {/* Manual Fallback Quick Link */}
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab("MANUAL")}
                          className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <HelpCircle className="w-4 h-4" />
                          <span>پیامک بانکی دیر ارسال شده یا مشکلی در انتقال پیش آمد؟ ثبت دستی فیش</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MANUAL Tab Content (Fallback Receipt Submission) */}
                  {activeTab === "MANUAL" && (
                    <form onSubmit={handleSubmitManual} className="space-y-4">
                      <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-900 dark:text-teal-200 leading-relaxed">
                        در صورتی که مبلغ را واریز نموده‌اید اما سیستم خودکار تایید نکرده است، مشخصات یا تصویر فیش بانکی خود را ثبت فرمایید تا کارشناسان مالی در اسرع وقت سفارش شما را تایید نمایند.
                      </div>

                      {manualError && (
                        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{manualError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                            کد پیگیری یا شماره ارجاع بانکی (RRN) *
                          </label>
                          <input
                            type="text"
                            required
                            value={trackingCode}
                            onChange={(e) => setTrackingCode(e.target.value)}
                            placeholder="مثال: 948271038"
                            className="w-full h-11 px-3.5 rounded-xl border border-brand-border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-left focus:border-teal-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                            ۴ رقم آخر کارت واریزکننده (اختیاری)
                          </label>
                          <input
                            type="text"
                            maxLength={16}
                            value={userCardNumber}
                            onChange={(e) => setUserCardNumber(e.target.value)}
                            placeholder="مثال: 4521"
                            className="w-full h-11 px-3.5 rounded-xl border border-brand-border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-left focus:border-teal-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                            تاریخ واریز فیش (تقویم شمسی)
                          </label>
                          <JalaliDatePickerInput
                            value={depositDate}
                            onChange={setDepositDate}
                            placeholder="انتخاب تاریخ واریز شمسی..."
                            maxDate="today"
                            className="h-11"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                            ساعت واریز فیش (ساعت : دقیقه)
                          </label>
                          <JalaliDatePickerInput
                            onlyTime={true}
                            value={depositHour}
                            onChange={setDepositHour}
                            placeholder="انتخاب یا درج ساعت (مثال: ۱۴:۳۰)..."
                            className="h-11"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                            تصویر فیش یا اسکرین‌شات واریز
                          </label>
                          <ReceiptUploader
                            value={receiptUrl}
                            onChange={setReceiptUrl}
                            isUploading={isUploading}
                            setIsUploading={setIsUploading}
                          />
                        </div>
                      </div>

                      <div className="text-xs">
                        <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                          توضیحات تکمیلی (اختیاری)
                        </label>
                        <textarea
                          rows={2}
                          value={userNote}
                          onChange={(e) => setUserNote(e.target.value)}
                          placeholder="اگر نکته خاصی در مورد واریز وجود دارد اینجا بنویسید..."
                          className="w-full p-3 rounded-xl border border-brand-border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-teal-500 outline-none resize-none text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setActiveTab("AUTO")}
                          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                        >
                          بازگشت به مشخصات کارت
                        </button>

                        <button
                          type="submit"
                          disabled={isSubmittingManual || isUploading}
                          className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmittingManual ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>در حال ثبت...</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4" />
                              <span>ثبت فیش جهت بررسی مالی</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Left Column: Order Invoice & Breakdown Sidebar (5 cols) */}
            <div className="lg:col-span-5 space-y-5 sticky top-28">
              <Card3D maxTilt={3} glareEffect={true} className="rounded-3xl shadow-xl">
                <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-brand-border/90 dark:border-slate-700/80 space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-brand-border/60 dark:border-slate-800">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-mono">ORDER SUMMARY</span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        فاکتور سفارش #{order.orderNumber}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                        order.status === "completed" || order.status === "delivered" || paymentStatus === "PAID"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 animate-pulse"
                      }`}
                    >
                      {order.status === "completed" || order.status === "delivered" || paymentStatus === "PAID"
                        ? "پرداخت شده"
                        : "در انتظار واریز"}
                    </span>
                  </div>

                  {/* Customer Snapshot */}
                  <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl">
                    {order.customerEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="font-mono">{order.customerEmail}</span>
                      </div>
                    )}
                    {order.customerPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="font-mono">{order.customerPhone}</span>
                      </div>
                    )}
                    {order.customerLink && (
                      <div className="flex items-center gap-2 text-[11px] truncate">
                        <ExternalLink className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{order.customerLink}</span>
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                      اقلام سبد خرید ({orderItems.length})
                    </span>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-52 overflow-y-auto pr-1 text-xs">
                      {orderItems.map((it: any, i: number) => (
                        <div key={i} className="py-2.5 flex items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block line-clamp-1">
                              {it.productTitle || it.title || "محصول دیجیتال"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              تعداد: {it.quantity} عدد
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
                            {formatPrice(it.priceToman * it.quantity)} ت
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total Calculations */}
                  <div className="pt-3 border-t border-brand-border/60 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>مبلغ کل سفارش:</span>
                      <span className="font-mono font-bold">
                        {formatPrice(order.totalPriceToman)} تومان
                      </span>
                    </div>

                    {order.discountAppliedToman > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>تخفیف اعمال شده:</span>
                        <span className="font-mono font-bold">
                          - {formatPrice(order.discountAppliedToman)} تومان
                        </span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-brand-border/60 dark:border-slate-800 flex justify-between items-baseline">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">مبلغ نهایی:</span>
                      <div className="text-left">
                        <span className="text-2xl font-black text-brand-dark dark:text-white font-mono">
                          {formatPrice(paymentData?.uniqueAmountToman || order.totalPriceToman)}
                        </span>
                        <span className="text-xs text-brand-muted dark:text-slate-400 font-bold mr-1">
                          تومان
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Guarantees & Security */}
                  <div className="space-y-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>تضمین ۱۰۰٪ اصالت و فعال‌سازی فوری لایسنس</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>پشتیبانی آنلاین و تلگرام در کلیه ساعات شبانه‌روز</span>
                    </div>
                  </div>
                </div>
              </Card3D>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
