"use client";

import React, { useState } from "react";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import { useStore } from "@/context/StoreContext";
import { formatPrice, formatNumber } from "@/lib/format";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Tag,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Lock,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AmbientGlow from "@/components/ui/AmbientGlow";
import Card3D from "@/components/ui/Card3D";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    calculateProductPrice,
    getMaxAllowedPurchase,
  } = useStore();

  const [couponCode, setCouponCode] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Subtotal calculation
  const subtotalToman = cart.reduce((acc, item) => {
    const p = calculateProductPrice(item.product);
    const itemTotal = p.isPerThousand
      ? Math.round((p.toman * item.quantity) / 1000)
      : p.toman * item.quantity;
    return acc + itemTotal;
  }, 0);

  // Discount calculation
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

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const res = applyCoupon(couponCode);
    setCouponFeedback(res);
  };

  const breadcrumbItems = [
    { name: "صفحه اصلی", url: "https://arzanaccount.ir" },
    { name: "سبد خرید", url: "https://arzanaccount.ir/cart" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors relative overflow-hidden">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Header />

      {/* Ambient Lighting Gradients */}
      <AmbientGlow variant="teal" className="-top-20 -right-20" />
      <AmbientGlow variant="amber" className="top-1/3 -left-32 opacity-30" />

      {/* Breadcrumb Bar */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-brand-border/70 dark:border-slate-800/80 py-3.5 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-brand-muted dark:text-slate-400">
          <Link href="/" className="hover:text-brand-primary dark:hover:text-teal-400 transition-colors">
            صفحه اصلی
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-brand-dark dark:text-white font-bold">سبد خرید</span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-32 sm:pb-20 relative z-10">
        {/* Header Title with 3D vibe */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-dark dark:text-white flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-teal-500/20">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span>سبد خرید شما</span>
              {cart.length > 0 && (
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                  {cart.length} محصول
                </span>
              )}
            </h1>
            <p className="text-xs text-brand-muted dark:text-slate-400 mt-1.5">
              اقلام انتخابی خود را بررسی کرده و برای پرداخت امن کارت‌به‌کارت اقدام فرمایید.
            </p>
          </div>

          {cart.length > 0 && (
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
            >
              <span>+ افزودن محصولات دیگر</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cart Items List (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="glass-panel rounded-3xl p-5 sm:p-7 shadow-card space-y-4 divide-y divide-brand-border/60 dark:divide-slate-800/80">
                {cart.map((item) => {
                  const price = calculateProductPrice(item.product);
                  const itemTotal = price.isPerThousand
                    ? Math.round((price.toman * item.quantity) / 1000)
                    : price.toman * item.quantity;
                  const maxAllowed = getMaxAllowedPurchase(item.product);
                  const isMaxReached = item.quantity >= maxAllowed;

                  return (
                    <div
                      key={item.product.id}
                      className="pt-5 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group/item hover:bg-teal-500/5 -mx-2 sm:-mx-3 p-3 rounded-2xl transition-all duration-200"
                    >
                      {/* Thumbnail & Info */}
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-slate-800 overflow-hidden shrink-0 border border-brand-border/80 dark:border-slate-700/80 shadow-sm group-hover/item:border-teal-400/50 transition-colors flex items-center justify-center relative">
                          {item.product.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.customTitle}
                              className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-slate-400 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                              <ShoppingBag className="w-5 h-5 text-slate-400 mb-1" />
                              <span>ارزان اکانت</span>
                            </div>
                          )}
                          {item.product.badge && (
                            <span className="absolute top-1.5 right-1.5 text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                              {item.product.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${item.product.id}`}
                            className="font-bold text-xs sm:text-sm text-brand-dark dark:text-white hover:text-brand-primary dark:hover:text-teal-400 transition-colors line-clamp-1"
                          >
                            {item.product.customTitle}
                          </Link>
                          <span className="text-[11px] text-brand-muted dark:text-slate-400 font-mono block mt-0.5 truncate">
                            {item.product.name}
                          </span>

                          <div className="flex flex-wrap items-center gap-2 mt-2 text-[10.5px]">
                            {item.product.requiresEmail ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-medium">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span>فعال‌سازی با ایمیل شما</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-medium">
                                <Zap className="w-3 h-3 text-emerald-500" />
                                <span>تحویل آنی و خودکار</span>
                              </span>
                            )}

                            {item.customerEmail && (
                              <span className="text-slate-600 dark:text-slate-400 font-mono">
                                ایمیل: {item.customerEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity, Price & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-brand-border/60 dark:border-slate-800/80">
                        {/* Stepper with comfortable touch targets */}
                        <div className="flex items-center border border-brand-border dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/80 p-1 shadow-inner">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(
                                item.product.id,
                                price.isPerThousand
                                  ? Math.max(500, item.quantity - 500)
                                  : Math.max(1, item.quantity - 1)
                              )
                            }
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white active:scale-90 transition-all cursor-pointer"
                            title="کاهش تعداد"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="w-10 text-center text-xs font-mono font-bold text-brand-dark dark:text-white select-none">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              updateCartQuantity(
                                item.product.id,
                                price.isPerThousand
                                  ? Math.min(maxAllowed, item.quantity + 500)
                                  : Math.min(maxAllowed, item.quantity + 1)
                              );
                            }}
                            disabled={isMaxReached}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                              isMaxReached
                                ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white active:scale-90"
                            }`}
                            title={isMaxReached ? `سقف مجاز خرید: ${maxAllowed} عدد` : "افزایش تعداد"}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Price Breakdown */}
                        <div className="text-left min-w-[110px]">
                          <span className="text-sm sm:text-base font-black text-brand-dark dark:text-white block font-mono">
                            {formatPrice(itemTotal)} <span className="text-[11px] font-sans font-normal text-slate-500">تومان</span>
                          </span>
                          {isMaxReached && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block mt-0.5">
                              (سقف سفارش: {formatNumber(maxAllowed)})
                            </span>
                          )}
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 active:scale-90 transition-all cursor-pointer"
                          title="حذف از سبد خرید"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Security & Guarantees Trust Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-brand-border/70 dark:border-slate-800/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block">گارانتی کامل اشتراک</span>
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400">تا آخرین روز دوره زمانی</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-brand-border/70 dark:border-slate-800/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block">تحویل و فعال‌سازی آنی</span>
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400">بلافاصله بعد از واریز</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-brand-border/70 dark:border-slate-800/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block">پرداخت امن کارت‌به‌کارت</span>
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400">بدون نیاز به رمز پویا</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary & Coupon (4 cols) */}
            <div className="lg:col-span-4 space-y-5 sticky top-28">
              {/* Coupon Form Card */}
              <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-card space-y-3">
                <label className="block text-xs font-bold text-brand-dark dark:text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-amber-500" />
                    <span>کد تخفیف دارید؟</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">تخفیف ویژه سفارش</span>
                </label>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>کد «{appliedCoupon.code}» فعال شد ({appliedCoupon.discountPercent}٪)</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="مثلاً: ARZAN20"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2.5 px-3.5 text-xs outline-none uppercase font-mono transition-all duration-200"
                    />
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-teal-500/20 shrink-0 cursor-pointer"
                    >
                      اعمال کد
                    </button>
                  </form>
                )}

                {couponFeedback && (
                  <p
                    className={`text-[11px] font-medium flex items-center gap-1.5 ${
                      couponFeedback.success ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                    }`}
                  >
                    {couponFeedback.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{couponFeedback.message}</span>
                  </p>
                )}
              </div>

              {/* Invoice Summary 3D Card */}
              <Card3D maxTilt={4} glareEffect={true} className="rounded-3xl shadow-xl">
                <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-brand-border/90 dark:border-slate-700/80 space-y-4">
                  <h3 className="font-bold text-sm text-brand-dark dark:text-white pb-3 border-b border-brand-border/60 dark:border-slate-800 flex items-center justify-between">
                    <span>خلاصه فاکتور سفارش</span>
                    <span className="text-[11px] font-mono text-slate-400">INVOICE</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between text-brand-muted dark:text-slate-400">
                      <span>مجموع اقلام:</span>
                      <span className="font-mono font-bold text-brand-dark dark:text-white text-sm">
                        {formatPrice(subtotalToman)} تومان
                      </span>
                    </div>

                    {discountToman > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" />
                          <span>تخفیف ویژه:</span>
                        </span>
                        <span className="font-mono font-bold">
                          - {formatPrice(discountToman)} تومان
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-brand-muted dark:text-slate-400">
                      <span>کارمزد انتقال و تحویل:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        رایگان
                      </span>
                    </div>

                    <div className="pt-4 border-t border-brand-border/60 dark:border-slate-800 flex justify-between items-baseline">
                      <span className="font-bold text-sm text-brand-dark dark:text-white">مبلغ نهایی پرداخت:</span>
                      <div className="text-left">
                        <span className="text-2xl font-black text-brand-dark dark:text-white font-mono tracking-tight">
                          {formatPrice(finalTotalToman)}
                        </span>
                        <span className="text-xs text-brand-muted dark:text-slate-400 font-bold mr-1">تومان</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 hover:scale-[1.02] active:scale-95 text-center mt-4"
                  >
                    <span>ادامه ثبت مشخصات و تسویه حساب</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Link>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-teal-800 dark:text-teal-300 bg-teal-500/10 border border-teal-500/20 p-3 rounded-xl">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />
                    <span>تحویل بلافاصله پس از پرداخت بانکی</span>
                  </div>
                </div>
              </Card3D>
            </div>
          </div>
        ) : (
          /* Empty Cart State */
          <div className="glass-panel border-dashed border-2 border-brand-border/80 dark:border-slate-800 rounded-3xl p-12 sm:p-20 text-center max-w-xl mx-auto shadow-card relative overflow-hidden">
            <AmbientGlow variant="mixed" className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
            <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-5 text-slate-400 shadow-inner">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-black text-brand-dark dark:text-white">
              سبد خرید شما در حال حاضر خالی است
            </h2>
            <p className="text-xs text-brand-muted dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
              شما هنوز هیچ اشتراک یا لایسنسی را به سبد خرید خود اضافه نکرده‌اید. با مراجعه به بخش محصولات، اشتراک مورد نیاز خود را با بهترین قیمت تهیه فرمایید.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white px-7 py-3.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-lg shadow-teal-500/25 hover:scale-105 active:scale-95"
              >
                <span>مشاهده محصولات و شروع خرید</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link
                href="/categories"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-brand-border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all"
              >
                <span>مرور دسته‌بندی‌ها</span>
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
