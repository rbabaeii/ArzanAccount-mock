"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  ArrowLeft,
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
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { formatPrice, formatNumber, toEnglishDigits } from "@/lib/format";
import AmbientGlow from "@/components/ui/AmbientGlow";
import Card3D from "@/components/ui/Card3D";
import AnimatedStepper from "@/components/ui/AnimatedStepper";
import { checkoutFormSchema, getAccountCredentialSchema } from "@/validations/checkout.schema";

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

  const [gateway] = useState<"cartbecart">("cartbecart");
  const [agreed, setAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  // Sync with user profile once loaded
  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name || "");
      setEmail((prev) => prev || user.email || "");
      setPhone((prev) => prev || user.phone || "");
      setNationalCode((prev) => prev || user.nationalCode || "");
    }
  }, [user]);

  // Multi-Quantity Account Credentials
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

  // Hybrid Delivery Detection
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
  if (appliedCoupon) {
    let eligibleSubtotal = subtotalToman;
    if (appliedCoupon.categoryId && appliedCoupon.categoryId !== "all") {
      eligibleSubtotal = cart
        .filter((item) => item.product.categoryId === appliedCoupon.categoryId)
        .reduce((acc, item) => {
          const p = calculateProductPrice(item.product);
          const itemTotal = p.isPerThousand
            ? Math.round((p.toman * item.quantity) / 1000)
            : p.toman * item.quantity;
          return acc + itemTotal;
        }, 0);
    }

    if (eligibleSubtotal >= appliedCoupon.minOrderToman) {
      const rawDiscount = (eligibleSubtotal * appliedCoupon.discountPercent) / 100;
      discountToman = Math.min(rawDiscount, appliedCoupon.maxDiscountToman);
    }
  }

  const finalTotalToman = Math.max(0, subtotalToman - discountToman);

  const handleCompleteOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const formData = {
      name: name,
      phone: toEnglishDigits(phone),
      email: email,
      nationalCode: nationalCode,
      targetAccountLink: targetAccountLink,
      targetAccountComments: targetAccountComments,
      agreed: agreed,
    };

    const parsed = checkoutFormSchema.safeParse(formData);
    if (!parsed.success) {
      setStockError(parsed.error.issues[0].message);
      return;
    }

    const cleanName = parsed.data.name;
    const cleanEmail = parsed.data.email;
    const cleanPhone = parsed.data.phone;
    const cleanNationalCode = parsed.data.nationalCode;
    const cleanTargetAccountLink = parsed.data.targetAccountLink;
    const cleanTargetAccountComments = parsed.data.targetAccountComments;

    const validatedCredentials: Array<{ index: number; email: string; password?: string; productTitle: string }> = [];

    // Validate multi-quantity account credentials
    for (const slot of requiredAccountSlots) {
      const cred = accountCredentialsMap[slot.key];
      
      if (slot.requiresEmail || slot.requiresPassword) {
        const schema = getAccountCredentialSchema(slot.requiresEmail, slot.requiresPassword);
        const parsedCred = schema.safeParse({ email: cred?.email, password: cred?.password });
        
        if (!parsedCred.success) {
            const errorMsg = parsedCred.error.issues[0].message;
            setStockError(`خطا در «اکانت شماره ${slot.globalIndex} - ${slot.productTitle}»: ${errorMsg}`);
            return;
        }

        validatedCredentials.push({
          index: slot.globalIndex,
          email: parsedCred.data.email || "",
          password: parsedCred.data.password,
          productTitle: slot.productTitle,
        });
      }
    }

    if (needsLink && (!cleanTargetAccountLink || !cleanTargetAccountLink.trim())) {
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

    const accountCredentialsList = validatedCredentials;

    // Instant accounts delivered right away in email / dashboard
    const generatedInstantAccounts: string[] = instantItems.flatMap((item) => {
      const accounts: string[] = [];
      for (let q = 1; q <= item.quantity; q++) {
        if (item.product.requiresLink) {
          accounts.push(
            `لینک فعال‌سازی خودکار (${item.product.customTitle}): ${
              cleanTargetAccountLink || 'https://arzanaccount.com/activate/token-' + Math.random().toString(36).substring(2, 10)
            }`
          );
        } else {
          accounts.push(
            `اکانت آنی (${item.product.customTitle} #${q}) -> کاربر: ${cleanEmail} | رمزعبور: ArzanPass!${Math.floor(
              1000 + Math.random() * 9000
            )}# (تحویل آنی)`
          );
        }
      }
      return accounts;
    });

    let backendOrderNumber: string | undefined;
    let backendRes: any;

    // Backend registration
    try {
      backendRes = await api.createBackendOrder({
        customerEmail: cleanEmail,
        customerPhone: cleanPhone,
        customerLink: cleanTargetAccountLink || undefined,
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
        couponCode: appliedCoupon?.code || undefined,
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
      customerEmail: cleanEmail,
      customerPhone: cleanPhone,
      customerLink: cleanTargetAccountLink || undefined,
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

    // Redirect directly to the dedicated Card-to-Card payment page
    router.push(`/payment/card/${newOrder.orderNumber}`);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors relative overflow-hidden">
        <Header />
        <AmbientGlow variant="teal" className="top-1/4 -right-20" />
        <div className="flex-1 max-w-md mx-auto px-4 py-24 text-center flex flex-col items-center justify-center relative z-10">
          <div className="w-18 h-18 rounded-3xl bg-teal-500/15 text-brand-primary dark:text-teal-400 flex items-center justify-center mb-5 shadow-lg shadow-teal-500/10">
            <Lock className="w-9 h-9" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-brand-dark dark:text-white mb-2">
            ورود به حساب جهت تکمیل سفارش
          </h2>
          <p className="text-xs text-brand-muted dark:text-slate-400 mb-8 leading-relaxed">
            جهت صدور فاکتور رسمی و تحویل آنی لایسنس، لطفاً ابتدا وارد حساب کاربری خود شوید. سبد خرید شما در حافظه ذخیره و حفظ شده است.
          </p>
          <Link
            href="/login?redirect=/checkout"
            className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white py-4 px-6 rounded-2xl font-bold text-xs sm:text-sm shadow-xl shadow-teal-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
          >
            <span>ورود سریع با شماره همراه</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors relative overflow-hidden">
        <Header />
        <AmbientGlow variant="mixed" className="top-1/3 left-1/4" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
          <div className="w-18 h-18 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400 shadow-inner">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-bold text-brand-dark dark:text-white">سبد خرید شما خالی است</h2>
          <p className="text-xs text-brand-muted dark:text-slate-400 mt-2">
            جهت تکمیل سفارش، ابتدا محصول مورد نظر خود را انتخاب کنید.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-lg shadow-teal-500/20 hover:scale-105 transition-all"
          >
            <span>مشاهده و خرید محصولات</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors relative overflow-hidden">
      <Header />

      {/* Ambient Lighting Gradients */}
      <AmbientGlow variant="teal" className="-top-20 -right-20" />
      <AmbientGlow variant="purple" className="top-1/2 -left-28 opacity-25" />

      {/* Breadcrumb Bar */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-brand-border/70 dark:border-slate-800/80 py-3.5 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-brand-muted dark:text-slate-400">
          <Link href="/" className="hover:text-brand-primary dark:hover:text-teal-400 transition-colors">
            صفحه اصلی
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <Link href="/cart" className="hover:text-brand-primary dark:hover:text-teal-400 transition-colors">
            سبد خرید
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-brand-dark dark:text-white font-bold">تسویه حساب و پرداخت</span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-32 sm:pb-20 relative z-10">
        {/* Stepper Progress Indicator */}
        <AnimatedStepper currentStep={2} className="mb-10" />

        {/* Stock or Submission Error Alert */}
        {stockError && (
          <div className="mb-8 p-5 rounded-3xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex items-start gap-3.5 shadow-sm animate-shake">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-xs sm:text-sm font-bold mb-1">خطا در فرآیند استعلام موجودی یا ثبت سفارش</strong>
              <p className="text-xs leading-relaxed">{stockError}</p>
            </div>
          </div>
        )}

        {/* Hybrid Order Informative Banner */}
        {isHybridOrder && (
          <div className="mb-8 p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-1">
              <strong className="block font-bold text-amber-950 dark:text-amber-100 text-sm">
                سفارش ترکیبی (شامل اقلام تحویل فوری + اقلام نیازمند فعال‌سازی اختصاصی)
              </strong>
              <p className="text-[11.5px] leading-relaxed text-amber-800/90 dark:text-amber-300">
                اقلام تحویل فوری ({instantItems.length} عنوان) بلافاصله پس از تایید واریز صادر خواهند شد. اقلام نیازمند فعال‌سازی ({activationItems.length} عنوان) جهت تنظیم فنی توسط کارشناسان در صف قرار گرفته و وضعیت نهایی از طریق پیامک و ایمیل اطلاع‌رسانی می‌شود.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleCompleteOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form Fields (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Customer Contact Info */}
            <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-card space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-brand-border/60 dark:border-slate-800">
                <h2 className="text-sm sm:text-base font-bold text-brand-dark dark:text-white flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span>اطلاعات و مشخصات خریدار</span>
                </h2>
                {isAuthenticated && (
                  <span className="text-[11px] text-teal-600 dark:text-teal-400 flex items-center gap-1 font-semibold bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>همگام با حساب کاربری شما</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-brand-dark dark:text-white mb-1.5">
                    نام و نام خانوادگی: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: علی محمدی"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-2xl px-4 outline-none transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-brand-dark dark:text-white mb-1.5">
                    شماره موبایل: <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="09123456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-2xl pr-10 pl-4 outline-none dir-ltr text-left font-mono transition-all duration-200"
                    />
                    <Phone className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-brand-dark dark:text-white mb-1.5">
                    ایمیل خریدار (ارسال فاکتور و لایسنس): <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-2xl pr-10 pl-4 outline-none dir-ltr text-left font-mono transition-all duration-200"
                    />
                    <Mail className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-brand-dark dark:text-white mb-1.5">
                    کد ملی (اختیاری جهت فاکتور رسمی):
                  </label>
                  <input
                    type="text"
                    placeholder="۱۰ رقم کد ملی"
                    value={nationalCode}
                    onChange={(e) => setNationalCode(e.target.value)}
                    className="w-full h-12 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-2xl px-4 outline-none dir-ltr text-left font-mono transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Multi-Quantity Account Credentials & Dynamic Requirements */}
            {hasRequirements ? (
              <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-card space-y-5">
                <div className="pb-3 border-b border-brand-border/60 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm sm:text-base font-bold text-brand-dark dark:text-white flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span>مشخصات اختصاصی فعال‌سازی اشتراک</span>
                    </h2>
                    {requiredAccountSlots.length > 1 && (
                      <span className="text-[11px] font-bold px-3 py-1 bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 rounded-xl">
                        {requiredAccountSlots.length} اکانت مجزا
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-1.5">
                    جهت راه‌اندازی اشتراک روی حساب کاربری شما، لطفاً مشخصات هر اکانت را به تفکیک تکمیل نمایید:
                  </p>
                </div>

                {/* Account Units Grid */}
                {requiredAccountSlots.length > 0 && (
                  <div className="space-y-4">
                    {requiredAccountSlots.map((slot, idx) => {
                      const cred = accountCredentialsMap[slot.key] || { email: "", password: "" };
                      const firstSlotKey = requiredAccountSlots[0]?.key;

                      return (
                        <div
                          key={slot.key}
                          className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-850 border border-brand-border/80 dark:border-slate-750 space-y-3.5"
                        >
                          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 dark:border-slate-700/80">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white text-xs font-black flex items-center justify-center font-mono shadow-xs">
                                {slot.globalIndex}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                {slot.productTitle}
                                {slot.totalForProduct > 1 && (
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mr-2">
                                    (اکانت {slot.unitIndex} از {slot.totalForProduct})
                                  </span>
                                )}
                              </span>
                            </div>

                            {/* Quick copy button */}
                            {idx > 0 && firstSlotKey && (
                              <button
                                type="button"
                                onClick={() => copyFromFirstSlot(slot.key, firstSlotKey)}
                                className="text-[11px] text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1 font-semibold px-2.5 py-1 rounded-lg hover:bg-teal-500/10 transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>کپی مشخصات از اکانت ۱</span>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                            {slot.requiresEmail && (
                              <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                  ایمیل اکانت {slot.globalIndex}: <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="email"
                                    required
                                    placeholder="user@example.com"
                                    value={cred.email}
                                    onChange={(e) => updateAccountSlot(slot.key, "email", e.target.value)}
                                    className="w-full h-11 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-brand-border dark:border-slate-700 focus:border-teal-500 rounded-xl px-3.5 pr-9 outline-none dir-ltr text-left font-mono"
                                  />
                                  <Mail className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                </div>
                              </div>
                            )}

                            {slot.requiresPassword && (
                              <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                                  رمز عبور اکانت {slot.globalIndex}: <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="password"
                                    required
                                    placeholder="کلمه عبور اختصاصی"
                                    value={cred.password}
                                    onChange={(e) => updateAccountSlot(slot.key, "password", e.target.value)}
                                    className="w-full h-11 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-brand-border dark:border-slate-700 focus:border-teal-500 rounded-xl px-3.5 pr-9 outline-none dir-ltr text-left font-mono"
                                  />
                                  <Key className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
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
                        لینک مقصد (کانال / گروه / پیج / پروفایل): <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="https://t.me/... یا https://instagram.com/..."
                          value={targetAccountLink}
                          onChange={(e) => setTargetAccountLink(e.target.value)}
                          className="w-full h-12 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-brand-border dark:border-slate-700 focus:border-teal-500 rounded-2xl pr-10 pl-4 outline-none dir-ltr text-left font-mono"
                        />
                        <LinkIcon className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  )}

                  {needsComments && (
                    <div className="text-xs">
                      <label className="block font-bold text-slate-900 dark:text-white mb-1.5">
                        توضیحات و نیازمندی‌های سفارشی:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="در صورت داشتن یادداشت یا متن سفارشی اینجا وارد فرمایید..."
                        value={targetAccountComments}
                        onChange={(e) => setTargetAccountComments(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-brand-border dark:border-slate-700 focus:border-teal-500 rounded-2xl p-3.5 outline-none resize-none text-xs leading-relaxed"
                      />
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-900 dark:text-teal-200 flex items-start gap-3">
                    <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      کلیه مشخصات ثبت‌شده به صورت رمزنگاری شده در سرور محافظت می‌شوند و پس از تکمیل فعال‌سازی، رسید رسمی به ایمیل شما ارسال خواهد شد.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-5 shadow-card flex items-center gap-3.5 text-xs text-emerald-800 dark:text-emerald-300">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block font-bold text-sm">تحویل فوری و خودکار پس از پرداخت</strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    محصولات این سفارش نیازی به ثبت ایمیل یا پسورد اختصاصی ندارند و بلافاصله پس از پرداخت صادر خواهند شد.
                  </span>
                </div>
              </div>
            )}

            {/* Step 3: Payment Gateway Selector (Exclusive CartBeCart) */}
            <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-brand-border/60 dark:border-slate-800">
                <h2 className="text-sm sm:text-base font-bold text-brand-dark dark:text-white flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span>روش پرداخت سفارش</span>
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>تایید خودکار و آنی</span>
                </span>
              </div>

              {/* Exclusive CartBeCart Card */}
              <div className="p-5 rounded-2xl border-2 border-teal-500/50 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-teal-950/20 dark:from-teal-950/60 dark:via-emerald-950/30 dark:to-slate-900 shadow-md space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/25 shrink-0">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-brand-dark dark:text-white text-sm sm:text-base">
                          کارت‌به‌کارت هوشمند شتابی (سامانه CartBeCart)
                        </span>
                        <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                          فعال و اتوماتیک
                        </span>
                      </div>
                      <span className="text-xs text-teal-700 dark:text-teal-300 font-medium block mt-1">
                        واریز مستقیم و آنی از کلیه اپلیکیشن‌ها (بلو، آپ، همراه بانک‌ها) بدون نیاز به رمز پویا
                      </span>
                    </div>
                  </div>
                  <span className="w-6 h-6 rounded-full border-2 border-teal-500 bg-teal-500/20 flex items-center justify-center shrink-0 mt-1">
                    <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-300 stroke-[3]" />
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 text-[11px] text-slate-600 dark:text-slate-300 border-t border-teal-500/20">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>تطبیق و تایید آنی پیامک بانک</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>پشتیبانی از کلیه کارت‌های بانکی</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>امکان پیوست تصویر رسید در صورت نیاز</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-4 h-4 rounded accent-teal-600 cursor-pointer"
                  />
                  <span className="text-brand-muted dark:text-slate-400">
                    قوانین و شرایط خرید، حفظ محرمانگی و ضمانت سلامت اکانت ارزان اکانت را مطالعه کرده و می‌پذیرم.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Invoice Summary Sidebar (5 cols) */}
          <div className="lg:col-span-5 space-y-5 sticky top-28">
            <Card3D maxTilt={3} glareEffect={true} className="rounded-3xl shadow-xl">
              <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-brand-border/90 dark:border-slate-700/80 space-y-5">
                <h3 className="font-bold text-sm text-brand-dark dark:text-white pb-3 border-b border-brand-border/60 dark:border-slate-800 flex items-center justify-between">
                  <span>اقلام سفارش ({cart.length})</span>
                  <span className="text-[11px] font-mono text-slate-400">CHECKOUT</span>
                </h3>

                <div className="divide-y divide-brand-border/60 dark:divide-slate-800 max-h-64 overflow-y-auto pr-1">
                  {cart.map((item) => {
                    const p = calculateProductPrice(item.product);
                    const itemTotal = p.isPerThousand
                      ? Math.round((p.toman * item.quantity) / 1000)
                      : p.toman * item.quantity;

                    const isActivation = item.product.requiresEmail || (item.product as any).requiresPassword;

                    return (
                      <div key={item.product.id} className="py-3 flex justify-between items-center text-xs hover:bg-teal-500/5 px-2 rounded-xl transition-colors">
                        <div>
                          <span className="font-bold text-brand-dark dark:text-white block line-clamp-1">
                            {item.product.customTitle}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10.5px] text-brand-muted dark:text-slate-400">
                              تعداد: {item.quantity} عدد
                            </span>
                            {isActivation ? (
                              <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/30">
                                فعال‌سازی فنی
                              </span>
                            ) : (
                              <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30">
                                تحویل آنی
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-brand-dark dark:text-white font-mono shrink-0 text-sm">
                          {formatPrice(itemTotal)} ت
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-brand-border/60 dark:border-slate-800 space-y-2.5 text-xs">
                  <div className="flex justify-between text-brand-muted dark:text-slate-400">
                    <span>مجموع سبد:</span>
                    <span className="font-mono font-bold text-brand-dark dark:text-white">
                      {formatPrice(subtotalToman)} تومان
                    </span>
                  </div>

                  {discountToman > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                      <span>تخفیف ویژه:</span>
                      <span className="font-mono font-bold">
                        - {formatPrice(discountToman)} تومان
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-brand-border/60 dark:border-slate-800 flex justify-between items-baseline">
                    <span className="font-bold text-sm text-brand-dark dark:text-white">مبلغ نهایی پرداخت:</span>
                    <div className="text-left">
                      <span className="text-2xl font-black text-brand-dark dark:text-white font-mono tracking-tight">
                        {formatPrice(finalTotalToman)}
                      </span>
                      <span className="text-xs text-brand-muted dark:text-slate-400 font-bold mr-1">تومان</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !agreed}
                  className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/35 hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2 text-xs">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال استعلام لحظه‌ای انبار و صدور فاکتور...</span>
                    </span>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>استعلام موجودی و رفتن به پرداخت کارت‌به‌کارت ➔</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-teal-800 dark:text-teal-300 bg-teal-500/10 border border-teal-500/20 p-3 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>پرداخت امن شتابی با پایش خودکار پیامک بانک CartBeCart</span>
                </div>
              </div>
            </Card3D>
          </div>
        </form>
      </main>

      {/* Sticky Mobile Checkout Bar (sits above MobileBottomNav on mobile) */}
      <div className="lg:hidden fixed bottom-16 sm:bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-4 py-2.5 sm:py-3 shadow-2xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] text-slate-400 block">مبلغ نهایی پرداخت:</span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-black text-brand-dark dark:text-white font-mono truncate">
              {formatPrice(finalTotalToman)}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">تومان</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleCompleteOrder()}
          disabled={isSubmitting || !agreed}
          className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>استعلام انبار...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-3.5 h-3.5" />
              <span>پرداخت کارت‌به‌کارت ➔</span>
            </>
          )}
        </button>
      </div>

      <Footer />
    </div>
  );
}
