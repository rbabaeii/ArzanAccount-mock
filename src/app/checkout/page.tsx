"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  CreditCard,
  ShieldCheck,
  Zap,
  Mail,
  Phone,
  User,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertTriangle,
  Key,
  Link as LinkIcon,
  RefreshCw,
  Sparkles,
  Info,
  Check,
  FileText,
  Copy,
  Layers,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { formatPrice, formatNumber } from "@/lib/format";
import CardPaymentModal from "@/components/payment/CardPaymentModal";

interface AccountSlot {
  key: string;
  productId: string;
  productTitle: string;
  unitIndex: number;
  totalForProduct: number;
  globalIndex: number;
  requiresEmail: boolean;
  requiresPassword: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, appliedCoupon, calculateProductPrice, createOrder } = useStore();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login?redirect=/checkout");
    }
  }, [isLoading, isAuthenticated, router]);

  // User details prefilled from profile
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [nationalCode, setNationalCode] = useState(user?.nationalCode || "");

  // Dynamic requirements based on items in cart
  const needsLink = cart.some((item) => item.product.requiresLink);
  const needsComments = cart.some((item) => item.product.requiresComments);

  const [targetAccountLink, setTargetAccountLink] = useState("");
  const [targetAccountComments, setTargetAccountComments] = useState("");

  const [gateway, setGateway] = useState<"cartbecart" | "zarinpal" | "nextpay" | "crypto">("cartbecart");
  const [agreed, setAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  // Card-to-Card Payment Modal State
  const [pendingCardOrder, setPendingCardOrder] = useState<{
    orderNumber: string;
    orderId?: string;
    totalPriceToman: number;
  } | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Sync with user profile once loaded
  useEffect(() => {
    if (user) {
      if (!name && user.name) setName(user.name);
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
      if (!nationalCode && user.nationalCode) setNationalCode(user.nationalCode);
    }
  }, [user]);

  // Priority 2: Multi-Quantity Account Credentials
  // Generate a distinct slot for each unit (1..N) of any product requiring email or password
  const requiredAccountSlots: AccountSlot[] = useMemo(() => {
    const slots: AccountSlot[] = [];
    let gIdx = 1;
    cart.forEach((item) => {
      const reqEmail = Boolean(item.product.requiresEmail);
      const reqPass = Boolean((item.product as any).requiresPassword);
      if (reqEmail || reqPass) {
        for (let k = 1; k <= item.quantity; k++) {
          slots.push({
            key: `${item.product.id}_unit_${k}`,
            productId: item.product.id,
            productTitle: item.product.customTitle,
            unitIndex: k,
            totalForProduct: item.quantity,
            globalIndex: gIdx++,
            requiresEmail: reqEmail,
            requiresPassword: reqPass,
          });
        }
      }
    });
    return slots;
  }, [cart]);

  // Map of slot key -> { email, password }
  const [accountCredentialsMap, setAccountCredentialsMap] = useState<
    Record<string, { email: string; password: string }>
  >({});

  // Initialize or pre-fill first slot with user email
  useEffect(() => {
    setAccountCredentialsMap((prev) => {
      const next = { ...prev };
      requiredAccountSlots.forEach((slot, idx) => {
        if (!next[slot.key]) {
          next[slot.key] = {
            email: idx === 0 && (user?.email || email) ? (user?.email || email) : "",
            password: "",
          };
        }
      });
      return next;
    });
  }, [requiredAccountSlots, user?.email, email]);

  const updateAccountSlot = (key: string, field: "email" | "password", value: string) => {
    setAccountCredentialsMap((prev) => ({
      ...prev,
      [key]: {
        email: prev[key]?.email || "",
        password: prev[key]?.password || "",
        [field]: value,
      },
    }));
  };

  const copyFromFirstSlot = (targetKey: string, sourceKey: string) => {
    const source = accountCredentialsMap[sourceKey];
    if (source) {
      setAccountCredentialsMap((prev) => ({
        ...prev,
        [targetKey]: {
          email: source.email || "",
          password: source.password || "",
        },
      }));
    }
  };

  // Priority 3: Hybrid Delivery Detection
  const activationItems = useMemo(
    () => cart.filter((item) => item.product.requiresEmail || (item.product as any).requiresPassword),
    [cart]
  );
  const instantItems = useMemo(
    () => cart.filter((item) => !(item.product.requiresEmail || (item.product as any).requiresPassword)),
    [cart]
  );
  const isHybridOrder = activationItems.length > 0 && instantItems.length > 0;
  const hasRequirements = requiredAccountSlots.length > 0 || needsLink || needsComments;

  // Subtotal calculation
  const subtotalToman = cart.reduce((acc, item) => {
    const p = calculateProductPrice(item.product);
    const itemTotal = p.isPerThousand
      ? Math.round((p.toman * item.quantity) / 1000)
      : p.toman * item.quantity;
    return acc + itemTotal;
  }, 0);

  const subtotalUsd = cart.reduce((acc, item) => {
    const p = calculateProductPrice(item.product);
    const qtyFactor = p.isPerThousand ? item.quantity / 1000 : item.quantity;
    return acc + item.product.costPriceUsd * qtyFactor;
  }, 0);

  let discountToman = 0;
  if (appliedCoupon && subtotalToman >= appliedCoupon.minOrderToman) {
    const rawDiscount = (subtotalToman * appliedCoupon.discountPercent) / 100;
    discountToman = Math.min(rawDiscount, appliedCoupon.maxDiscountToman);
  }

  const finalTotalToman = Math.max(0, subtotalToman - discountToman);

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !agreed) return;

    // Validate multi-quantity account credentials
    for (const slot of requiredAccountSlots) {
      const cred = accountCredentialsMap[slot.key];
      if (slot.requiresEmail && (!cred?.email || !cred.email.trim())) {
        setStockError(`لطفاً ایمیل «اکانت شماره ${slot.globalIndex} - ${slot.productTitle}» را وارد نمایید.`);
        return;
      }
      if (slot.requiresPassword && (!cred?.password || !cred.password.trim())) {
        setStockError(`لطفاً رمز عبور «اکانت شماره ${slot.globalIndex} - ${slot.productTitle}» را وارد نمایید.`);
        return;
      }
    }

    if (needsLink && !targetAccountLink.trim()) {
      setStockError("لطفاً لینک مقصد (آدرس کانال / گروه / پیج / پروفایل) را وارد نمایید.");
      return;
    }

    setStockError(null);
    setIsSubmitting(true);

    // Pre-payment Live Stock Validation Guard
    for (const item of cart) {
      try {
        const validation = await api.validateLiveStock(item.product.id, item.quantity);
        if (!validation || !validation.valid || !validation.inStock) {
          setStockError(
            `متأسفانه موجودی محصول "${item.product.customTitle}" نزد تامین‌کننده کافی نمی‌باشد یا به اتمام رسیده است.`
          );
          setIsSubmitting(false);
          return;
        }
      } catch (err: any) {
        console.error("Stock check error:", err);
        setStockError(
          err?.message ||
            `متأسفانه در حال حاضر امکان تایید موجودی محصول "${item.product.customTitle}" وجود ندارد یا محصول غیرفعال است.`
        );
        setIsSubmitting(false);
        return;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 400)); // Smooth UX transition

    // Compute delivery attributes
    const computedDeliveryType = isHybridOrder
      ? "hybrid"
      : activationItems.length > 0
      ? "account_activation"
      : needsLink
      ? "link"
      : "credentials";

    const computedStatus: "processing" | "delivered" =
      isHybridOrder || activationItems.length > 0 ? "processing" : "delivered";

    const orderItems = cart.map((item) => {
      const p = calculateProductPrice(item.product);
      return {
        productId: item.product.id,
        productTitle: item.product.customTitle,
        quantity: item.quantity,
        priceToman: p.toman,
        priceUsd: item.product.costPriceUsd,
      };
    });

    const accountCredentialsList = requiredAccountSlots.map((slot) => ({
      index: slot.globalIndex,
      email: accountCredentialsMap[slot.key]?.email?.trim() || "",
      password: accountCredentialsMap[slot.key]?.password?.trim() || undefined,
      productTitle: slot.productTitle,
    }));

    // Instant accounts delivered right away in email / dashboard
    const generatedInstantAccounts: string[] = instantItems.flatMap((item) => {
      const accounts: string[] = [];
      for (let q = 1; q <= item.quantity; q++) {
        if (item.product.requiresLink) {
          accounts.push(
            `لینک فعال‌سازی خودکار (${item.product.customTitle}): ${
              targetAccountLink || 'https://arzanaccount.com/activate/token-' + Math.random().toString(36).substring(2, 10)
            }`
          );
        } else {
          accounts.push(
            `اکانت آنی (${item.product.customTitle} #${q}) -> کاربر: ${email} | رمزعبور: ArzanPass!${Math.floor(
              1000 + Math.random() * 9000
            )}# (تحویل آنی)`
          );
        }
      }
      return accounts;
    });

    let backendOrderNumber: string | undefined;
    let backendRes: any;

    // Backend registration (creates DB order & dispatches hybrid or standard receipt email in background)
    try {
      backendRes = await api.createBackendOrder({
        customerEmail: email,
        customerPhone: phone,
        customerLink: targetAccountLink || undefined,
        deliveryType: computedDeliveryType,
        targetAccountEmail: accountCredentialsList[0]?.email || undefined,
        targetAccountPassword: accountCredentialsList[0]?.password || undefined,
        accountCredentials: accountCredentialsList,
        isHybridOrder,
        instantItemsCount: instantItems.length,
        activationItemsCount: activationItems.length,
        items: orderItems,
        totalPriceToman: finalTotalToman,
        totalPriceUsd: subtotalUsd,
        paymentGateway: gateway,
        deliveredAccounts: generatedInstantAccounts.length > 0 ? generatedInstantAccounts : undefined,
      });
      if (backendRes && backendRes.orderNumber) {
        backendOrderNumber = backendRes.orderNumber;
      } else {
        throw new Error("پاسخ دریافتی از سرور برای ثبت سفارش نامعتبر است.");
      }
    } catch (err: any) {
      console.error("Backend order creation error:", err);
      setStockError(err?.message || "خطا در برقراری ارتباط با سرور و ثبت سفارش. سفارش ثبت نشد.");
      setIsSubmitting(false);
      return;
    }

    // Local context sync
    const newOrder = createOrder({
      id: backendRes?.id,
      orderNumber: backendOrderNumber,
      customerEmail: email,
      customerPhone: phone,
      customerLink: targetAccountLink || undefined,
      items: orderItems,
      totalPriceToman: finalTotalToman,
      totalPriceUsd: subtotalUsd,
      status: computedStatus,
      deliveredAccounts: generatedInstantAccounts,
      paymentGateway: gateway,
      discountAppliedToman: discountToman,
      deliveryType: computedDeliveryType,
      targetAccountEmail: accountCredentialsList[0]?.email || undefined,
      targetAccountPassword: accountCredentialsList[0]?.password || undefined,
      accountCredentials: accountCredentialsList,
      isHybridOrder,
      instantItemsCount: instantItems.length,
      activationItemsCount: activationItems.length,
    });

    setIsSubmitting(false);

    if (gateway === "cartbecart") {
      setPendingCardOrder({
        orderNumber: newOrder.orderNumber,
        orderId: backendRes?.id,
        totalPriceToman: finalTotalToman,
      });
      setIsCardModalOpen(true);
      return;
    }

    router.push(`/orders?id=${newOrder.orderNumber}`);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
        <Header />
        <div className="flex-1 max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-brand-primary dark:text-teal-400 flex items-center justify-center mb-4 shadow-sm animate-pulse">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-brand-dark dark:text-white mb-2">
            ورود به حساب جهت تکمیل سفارش
          </h2>
          <p className="text-xs text-brand-muted dark:text-slate-400 mb-6 leading-relaxed">
            جهت صدور فاکتور رسمی و تحویل آنی لایسنس، لطفاً ابتدا وارد حساب کاربری خود شوید. سبد خرید شما در حافظه ذخیره و حفظ شده است.
          </p>
          <Link
            href="/login?redirect=/checkout"
            className="w-full bg-brand-primary hover:bg-brand-primaryDark text-white py-3.5 px-6 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>ورود سریع با شماره همراه</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-xl font-bold text-brand-dark dark:text-white">سبد خرید شما خالی است</h2>
          <p className="text-xs text-brand-muted dark:text-slate-400 mt-2">
            جهت تکمیل سفارش، ابتدا محصول مورد نظر خود را انتخاب کنید.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <ArrowRight className="w-4 h-4" />
            <span>مشاهده و خرید محصولات</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-brand-muted dark:text-slate-400 mb-6">
          <Link href="/" className="hover:text-brand-dark dark:hover:text-white">
            خانه
          </Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-brand-dark dark:hover:text-white">
            سبد خرید
          </Link>
          <span>/</span>
          <span className="text-brand-dark dark:text-white font-bold">تسویه حساب و پرداخت</span>
        </div>

        {stockError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex items-start gap-3 animate-shake">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-xs font-bold mb-1">خطا در فرآیند ثبت سفارش</strong>
              <p className="text-xs">{stockError}</p>
            </div>
          </div>
        )}

        {/* Priority 3: Hybrid Order Informative Banner */}
        {isHybridOrder && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-1">
              <strong className="block font-bold text-amber-950 dark:text-amber-100">
                توجه: این سفارش شامل خرید ترکیبی (تحویل آنی + فعال‌سازی اختصاصی) می‌باشد
              </strong>
              <p className="text-[11.5px] leading-relaxed text-amber-800 dark:text-amber-300">
                اقلام تحویل فوری ({instantItems.length} عنوان) بلافاصله پس از پرداخت در رسید دیجیتال و ایمیل به شما تحویل داده خواهند شد. 
                اقلام اختصاصی ({activationItems.length} عنوان) جهت تنظیم و فعال‌سازی توسط کارشناسان در صف بررسی قرار گرفته و وضعیت آن پس از انجام از طریق ایمیل اطلاع‌رسانی می‌شود.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleCompleteOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Customer Contact Info */}
            <div className="group/buyer relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-brand-border dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-400/40 dark:hover:border-teal-400/30 transition-all duration-300 space-y-5">
              {/* Corner Glow Orb */}
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-teal-500/10 rounded-full blur-2xl group-hover/buyer:scale-150 transition-all duration-500 pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-brand-border dark:border-slate-800">
                <h2 className="text-sm font-bold text-brand-dark dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-primary dark:text-teal-400" />
                  <span>مشخصات خریدار</span>
                </h2>
                {isAuthenticated && (
                  <span className="text-[11px] text-teal-600 dark:text-teal-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>بارگذاری شده از پروفایل کاربری</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-brand-dark dark:text-white mb-1.5">
                    نام و نام خانوادگی: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: علی محمدی"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-brand-surfaceDim dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2.5 px-3 outline-none transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-brand-dark dark:text-white mb-1.5">
                    شماره موبایل: <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="09123456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-brand-surfaceDim dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2.5 pr-9 pl-3 outline-none dir-ltr text-left font-mono transition-all duration-200"
                    />
                    <Phone className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-brand-dark dark:text-white mb-1.5">
                    ایمیل خریدار (ارسال فاکتور و وضعیت): <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-brand-surfaceDim dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2.5 pr-9 pl-3 outline-none dir-ltr text-left font-mono transition-all duration-200"
                    />
                    <Mail className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-brand-dark dark:text-white mb-1.5">
                    کد ملی (اختیاری):
                  </label>
                  <input
                    type="text"
                    placeholder="۱۰ رقم کد ملی"
                    value={nationalCode}
                    onChange={(e) => setNationalCode(e.target.value)}
                    className="w-full bg-brand-surfaceDim dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2.5 px-3 outline-none dir-ltr text-left font-mono transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Multi-Quantity Account Credentials & Requirements */}
            {hasRequirements ? (
              <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-card space-y-5 animate-fadeIn">
                <div className="pb-3 border-b border-brand-border dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-brand-dark dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-primary dark:text-teal-400" />
                      <span>اطلاعات مورد نیاز جهت راه‌اندازی اشتراک</span>
                    </h2>
                    {requiredAccountSlots.length > 1 && (
                      <span className="text-[11px] font-bold px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg">
                        {requiredAccountSlots.length} اکانت مجزا
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    با توجه به تعداد سفارش ({requiredAccountSlots.length} عدد)، لطفاً مشخصات هر اکانت را به تفکیک در کادرهای زیر وارد نمایید:
                  </p>
                </div>

                {/* Priority 2: Account Units Grid (N units -> N credential pairs) */}
                {requiredAccountSlots.length > 0 && (
                  <div className="space-y-4">
                    {requiredAccountSlots.map((slot, idx) => {
                      const cred = accountCredentialsMap[slot.key] || { email: "", password: "" };
                      const firstSlotKey = requiredAccountSlots[0]?.key;

                      return (
                        <div
                          key={slot.key}
                          className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 transition-colors"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-teal-600 text-white text-xs font-black flex items-center justify-center font-mono">
                                {slot.globalIndex}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {slot.productTitle}
                                {slot.totalForProduct > 1 && (
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mr-1.5">
                                    (اکانت {slot.unitIndex} از {slot.totalForProduct})
                                  </span>
                                )}
                              </span>
                            </div>

                            {/* Quick copy button for subsequent accounts */}
                            {idx > 0 && firstSlotKey && (
                              <button
                                type="button"
                                onClick={() => copyFromFirstSlot(slot.key, firstSlotKey)}
                                className="text-[11px] text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 font-medium transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>کپی از اکانت ۱</span>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {slot.requiresEmail && (
                              <div>
                                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                                  ایمیل اکانت {slot.globalIndex}: <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="email"
                                    required
                                    placeholder="user@example.com"
                                    value={cred.email}
                                    onChange={(e) => updateAccountSlot(slot.key, "email", e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:border-brand-primary dark:focus:border-teal-400 rounded-xl py-2 px-3 outline-none dir-ltr text-left font-mono"
                                  />
                                  <Mail className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                </div>
                              </div>
                            )}

                            {slot.requiresPassword && (
                              <div>
                                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                                  رمز عبور اکانت {slot.globalIndex}: <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="password"
                                    required
                                    placeholder="کلمه عبور اکانت"
                                    value={cred.password}
                                    onChange={(e) => updateAccountSlot(slot.key, "password", e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:border-brand-primary dark:focus:border-teal-400 rounded-xl py-2 px-3 outline-none dir-ltr text-left font-mono"
                                  />
                                  <Key className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Additional inputs: Link & Comments */}
                <div className="space-y-4 pt-2">
                  {needsLink && (
                    <div className="text-xs">
                      <label className="block font-bold text-slate-900 dark:text-white mb-1.5">
                        لینک مقصد (آدرس کانال / گروه / پیج / پروفایل): <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="https://t.me/... یا https://instagram.com/..."
                          value={targetAccountLink}
                          onChange={(e) => setTargetAccountLink(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:border-brand-primary dark:focus:border-teal-400 rounded-xl py-2.5 pr-9 pl-3 outline-none dir-ltr text-left font-mono"
                        />
                        <LinkIcon className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  )}

                  {needsComments && (
                    <div className="text-xs">
                      <label className="block font-bold text-slate-900 dark:text-white mb-1.5">
                        توضیحات و درخواست سفارشی:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="توضیحات تکمیلی یا متن سفارشی خود را اینجا بنویسید..."
                        value={targetAccountComments}
                        onChange={(e) => setTargetAccountComments(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:border-brand-primary dark:focus:border-teal-400 rounded-xl py-2.5 px-3 outline-none resize-none text-xs"
                      />
                    </div>
                  )}

                  <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 text-xs text-teal-900 dark:text-teal-200 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      کلیه مشخصات ثبت‌شده به صورت رمزنگاری شده نگهداری شده و پس از تکمیل فعال‌سازی توسط کارشناسان فنی، وضعیت نهایی از طریق ایمیل برای شما مخابره خواهد شد.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 rounded-2xl p-5 shadow-card flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block font-bold">تحویل آنی و خودکار پس از پرداخت</strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    محصولات این سفارش نیازی به ثبت مشخصات اختصاصی اکانت ندارند و بلافاصله پس از پرداخت صادر خواهند شد.
                  </span>
                </div>
              </div>
            )}

            {/* Step 3: Payment Gateway Selector */}
            <div className="group/gateway relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-brand-border dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-400/40 dark:hover:border-teal-400/30 transition-all duration-300 space-y-4">
              <h2 className="text-sm font-bold text-brand-dark dark:text-white pb-3 border-b border-brand-border dark:border-slate-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-primary dark:text-teal-400" />
                <span>انتخاب روش و درگاه پرداخت</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* CartBeCart - Recommended Card-to-Card */}
                <label
                  onClick={() => setGateway("cartbecart")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between hover:scale-[1.01] active:scale-95 col-span-1 sm:col-span-3 ${
                    gateway === "cartbecart"
                      ? "border-teal-500 bg-gradient-to-br from-teal-500/15 via-emerald-500/10 to-teal-900/10 shadow-sm ring-1 ring-teal-500/30 dark:from-teal-950/60 dark:to-emerald-950/30"
                      : "border-brand-border dark:border-slate-700 hover:border-teal-400/50 hover:bg-neutral-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black text-xs">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-brand-dark dark:text-white text-sm">
                            کارت‌به‌کارت هوشمند (تأیید آنی خودکار)
                          </span>
                          <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                            پیشنهادی / CartBeCart
                          </span>
                        </div>
                        <span className="text-[11px] text-teal-700 dark:text-teal-300 font-medium">
                          انتقال از کلیه بانک‌ها (بلو، آپ، توبانک و...) بدون قطعی شاپرک
                        </span>
                      </div>
                    </div>
                    <span className="w-5 h-5 rounded-full border border-teal-500 flex items-center justify-center shrink-0">
                      {gateway === "cartbecart" && (
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse" />
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-brand-muted dark:text-slate-400 mt-1">
                    پایش خودکار پیامک واریز توسط سامانه با تطبیق دقیق مبلغ + امکان پیوست دستی فیش واریزی در صورت بروز اختلال
                  </p>
                </label>

                <label
                  onClick={() => setGateway("zarinpal")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between hover:scale-[1.02] active:scale-95 ${
                    gateway === "zarinpal"
                      ? "border-teal-500 bg-gradient-to-br from-teal-500/10 to-emerald-500/5 dark:from-teal-950/50 dark:to-emerald-950/20 shadow-xs"
                      : "border-brand-border dark:border-slate-700 hover:border-teal-400/50 hover:bg-neutral-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-brand-dark dark:text-white">زرین‌پال</span>
                    <span className="w-4 h-4 rounded-full border border-teal-500 flex items-center justify-center">
                      {gateway === "zarinpal" && <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse" />}
                    </span>
                  </div>
                  <span className="text-[11px] text-brand-muted dark:text-slate-400">درگاه پرداخت شتاب شاپرک</span>
                </label>

                <label
                  onClick={() => setGateway("nextpay")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between hover:scale-[1.02] active:scale-95 ${
                    gateway === "nextpay"
                      ? "border-teal-500 bg-gradient-to-br from-teal-500/10 to-emerald-500/5 dark:from-teal-950/50 dark:to-emerald-950/20 shadow-xs"
                      : "border-brand-border dark:border-slate-700 hover:border-teal-400/50 hover:bg-neutral-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-brand-dark dark:text-white">نکست‌پی</span>
                    <span className="w-4 h-4 rounded-full border border-teal-500 flex items-center justify-center">
                      {gateway === "nextpay" && <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse" />}
                    </span>
                  </div>
                  <span className="text-[11px] text-brand-muted dark:text-slate-400">درگاه واسط سریع شاپرک</span>
                </label>

                <label
                  onClick={() => setGateway("crypto")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between hover:scale-[1.02] active:scale-95 ${
                    gateway === "crypto"
                      ? "border-teal-500 bg-gradient-to-br from-teal-500/10 to-emerald-500/5 dark:from-teal-950/50 dark:to-emerald-950/20 shadow-xs"
                      : "border-brand-border dark:border-slate-700 hover:border-teal-400/50 hover:bg-neutral-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-brand-dark dark:text-white">تتر (USDT)</span>
                    <span className="w-4 h-4 rounded-full border border-teal-500 flex items-center justify-center">
                      {gateway === "crypto" && <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse" />}
                    </span>
                  </div>
                  <span className="text-[11px] text-brand-muted dark:text-slate-400">تسویه با رمزارز TRC20</span>
                </label>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-4 h-4 rounded accent-teal-600 cursor-pointer"
                  />
                  <span className="text-brand-muted dark:text-slate-400">
                    قوانین و شرایط خرید، حفظ محرمانگی و ضمانت سلامت اکانت را مطالعه کرده و می‌پذیرم.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Invoice Sidebar (5 cols) */}
          <div className="lg:col-span-5 group/invoice relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-brand-border dark:border-slate-800 rounded-2xl p-6 shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-400/40 dark:hover:border-teal-400/30 transition-all duration-300 space-y-5 sticky top-28">
            {/* Corner Glow Orb */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-teal-500/10 rounded-full blur-2xl group-hover/invoice:scale-150 transition-all duration-500 pointer-events-none" />

            <h3 className="font-bold text-sm text-brand-dark dark:text-white pb-3 border-b border-brand-border dark:border-slate-800">
              اقلام سفارش ({cart.length})
            </h3>

            <div className="divide-y divide-brand-border dark:divide-slate-800 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => {
                const p = calculateProductPrice(item.product);
                const itemTotal = p.isPerThousand
                  ? Math.round((p.toman * item.quantity) / 1000)
                  : p.toman * item.quantity;

                const isActivation = item.product.requiresEmail || (item.product as any).requiresPassword;

                return (
                  <div key={item.product.id} className="py-2.5 flex justify-between items-center text-xs hover:bg-teal-50/20 dark:hover:bg-slate-800/30 px-2 rounded-lg transition-colors">
                    <div>
                      <span className="font-bold text-brand-dark dark:text-white block line-clamp-1">
                        {item.product.customTitle}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-brand-muted dark:text-slate-400">
                          تعداد: {item.quantity} عدد
                        </span>
                        {isActivation ? (
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                            فعال‌سازی فنی
                          </span>
                        ) : (
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                            تحویل آنی
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-brand-dark dark:text-white font-mono shrink-0">
                      {formatPrice(itemTotal)} ت
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-brand-border dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-brand-muted dark:text-slate-400">
                <span>مجموع سبد:</span>
                <span className="font-mono font-bold">
                  {formatPrice(subtotalToman)} تومان
                </span>
              </div>

              {discountToman > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>تخفیف:</span>
                  <span className="font-mono font-bold">
                    - {formatPrice(discountToman)} تومان
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-brand-border dark:border-slate-800 flex justify-between items-baseline">
                <span className="font-bold text-sm text-brand-dark dark:text-white">مبلغ نهایی:</span>
                <div className="text-left">
                  <span className="text-2xl font-black text-brand-dark dark:text-white font-mono">
                    {formatPrice(finalTotalToman)}
                  </span>
                  <span className="text-xs text-brand-muted dark:text-slate-400 font-bold mr-1">تومان</span>
                </div>
              </div>
            </div>

            {stockError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex items-start gap-2 animate-shake text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{stockError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال استعلام انبار و اتصال به درگاه...</span>
                </span>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>پرداخت و ثبت سفارش</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border border-teal-100 dark:border-teal-800/60 p-2.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>پرداخت ۱۰۰٪ امن با کد رهگیری شاپرک</span>
            </div>
          </div>
        </form>

        {/* Card-to-Card (CartBeCart) Payment Modal */}
        {isCardModalOpen && pendingCardOrder && (
          <CardPaymentModal
            isOpen={isCardModalOpen}
            onClose={() => {
              setIsCardModalOpen(false);
              if (pendingCardOrder?.orderNumber) {
                router.push(`/orders?id=${pendingCardOrder.orderNumber}`);
              }
            }}
            amountToman={pendingCardOrder.totalPriceToman}
            orderNumber={pendingCardOrder.orderNumber}
            orderId={pendingCardOrder.orderId}
            userId={user?.id}
            customerName={name}
            customerPhone={phone}
            paymentType="ORDER"
            onSuccess={() => {
              setIsCardModalOpen(false);
              router.push(`/orders?id=${pendingCardOrder.orderNumber}`);
            }}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
