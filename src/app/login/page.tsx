"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import {
  Phone,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  Lock,
  Mail,
  User,
  Gift,
  Sparkles,
} from "lucide-react";
import AmbientGlow from "@/components/ui/AmbientGlow";
import Card3D from "@/components/ui/Card3D";
import OtpInput from "@/components/auth/OtpInput";

const ADMIN_ACCOUNTS = [
  {
    phone: "09181111111",
    name: "رضا بابایی",
    roleTitle: "مدیر ارشد سامانه (Super Admin)",
    scope: "دسترسی نامحدود به تمامی بخش‌ها",
    border: "border-amber-400/60 dark:border-amber-600/50 hover:border-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-950/40 hover:bg-amber-500/15",
    text: "text-amber-950 dark:text-amber-300",
    subtext: "text-amber-700 dark:text-amber-400/80",
    badge: "bg-amber-200/90 dark:bg-amber-900 text-amber-900 dark:text-amber-200",
  },
  {
    phone: "09130000002",
    name: "محمد محمدی",
    roleTitle: "مدیر کاتالوگ و انبار",
    scope: "کنترل موجودی، ناموجودی‌ها و محصولات",
    border: "border-blue-400/60 dark:border-blue-600/50 hover:border-blue-400",
    bg: "bg-blue-500/10 dark:bg-blue-950/40 hover:bg-blue-500/15",
    text: "text-blue-950 dark:text-blue-300",
    subtext: "text-blue-700 dark:text-blue-400/80",
    badge: "bg-blue-200/90 dark:bg-blue-900 text-blue-900 dark:text-blue-200",
  },
  {
    phone: "09140000003",
    name: "زهرا احمدی",
    roleTitle: "مدیر مالی و عودت وجه",
    scope: "شارژ کیف پول، استرداد وجه و تراکنش‌ها",
    border: "border-emerald-400/60 dark:border-emerald-600/50 hover:border-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-950/40 hover:bg-emerald-500/15",
    text: "text-emerald-950 dark:text-emerald-300",
    subtext: "text-emerald-700 dark:text-emerald-400/80",
    badge: "bg-emerald-200/90 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200",
  },
  {
    phone: "09120000001",
    name: "علی صادقی",
    roleTitle: "مدیر پشتیبانی و سفارشات",
    scope: "بررسی سفارش‌های کاربران و تیکت‌ها",
    border: "border-purple-400/60 dark:border-purple-600/50 hover:border-purple-400",
    bg: "bg-purple-500/10 dark:bg-purple-950/40 hover:bg-purple-500/15",
    text: "text-purple-950 dark:text-purple-300",
    subtext: "text-purple-700 dark:text-purple-400/80",
    badge: "bg-purple-200/90 dark:bg-purple-900 text-purple-900 dark:text-purple-200",
  },
];

const USER_ACCOUNT = {
  phone: "09180000000",
  name: "کاربر عادی",
  roleTitle: "مشتری / خریدار فروشگاه",
  scope: "ثبت سفارش، سبد خرید و پیگیری تحویل",
  border: "border-teal-400/60 dark:border-teal-600/50 hover:border-teal-400",
  bg: "bg-teal-500/10 dark:bg-teal-950/40 hover:bg-teal-500/15",
  text: "text-brand-primary dark:text-teal-300",
  subtext: "text-teal-700 dark:text-teal-400/80",
  badge: "bg-teal-200/90 dark:bg-teal-900 text-teal-900 dark:text-teal-200",
};

function LoginContent() {
  const {
    sendOtp,
    sendEmailOtp,
    verifyOtp,
    loginWithPassword,
    isAuthenticated,
    user,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const referralParam = searchParams.get("ref") || searchParams.get("referral") || "";

  // Auth mode: ONLY "phone" (OTP) or "password"
  const [authMode, setAuthMode] = useState<"phone" | "password">("phone");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(referralParam);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (referralParam && !referralCode) {
      setReferralCode(referralParam);
    }
  }, [referralParam, referralCode]);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      if (
        (user.role === "SUPER_ADMIN" ||
          user.role === "CATALOG_MANAGER" ||
          user.role === "FINANCE_ADMIN" ||
          user.role === "SUPPORT_ADMIN") &&
        redirect === "/"
      ) {
        router.push("/admin");
      } else {
        router.push(redirect);
      }
    }
  }, [isAuthenticated, user, redirect, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleSendPhoneOtp = async (targetPhone?: string) => {
    const phoneNumber = (targetPhone || phone).trim();
    if (!phoneNumber || !/^09\d{9}$/.test(phoneNumber)) {
      setErrorMessage("شماره موبایل باید با ۰۹ شروع شده و ۱۱ رقم باشد (مانند 09180000000).");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const res = await sendOtp(phoneNumber);
    setIsLoading(false);

    if (res.success) {
      if (targetPhone) setPhone(targetPhone);
      setStep("otp");
      setCountdown(30);
      setSuccessMessage(res.message);
      setOtp("");
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleSendRegisteredEmailOtp = async () => {
    const phoneNumber = phone.trim();
    if (!phoneNumber) {
      setErrorMessage("شماره تلفن مشخص نیست.");
      return;
    }

    setErrorMessage(null);
    setIsSendingEmailOtp(true);

    try {
      const res = await sendEmailOtp(phoneNumber);
      if (res.success) {
        setSuccessMessage(res.message);
        setCountdown(30);
      } else {
        setErrorMessage(res.message || "خطا در ارسال کد به ایمیل.");
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || "برای این شماره، هیچ آدرس ایمیلی در حساب کاربری ثبت نشده است."
      );
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyOtp = async (otpToVerify?: string) => {
    const code = (otpToVerify || otp).trim();
    if (!code || code.length < 5) {
      setErrorMessage("کد تایید ۵ رقمی را کامل وارد نمایید.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const res = await verifyOtp(phone.trim(), code, referralCode.trim() || undefined);
    setIsLoading(false);

    if (res.success && res.user) {
      const loggedInUser = res.user;
      setSuccessMessage(`خوش آمدید ${loggedInUser.name || ""}! ورود با موفقیت انجام شد.`);
      setTimeout(() => {
        if (
          (loggedInUser.role === "SUPER_ADMIN" ||
            loggedInUser.role === "CATALOG_MANAGER" ||
            loggedInUser.role === "FINANCE_ADMIN" ||
            loggedInUser.role === "SUPPORT_ADMIN") &&
          redirect === "/"
        ) {
          router.push("/admin");
        } else {
          router.push(redirect);
        }
      }, 900);
    } else {
      setErrorMessage(res.message || "کد تایید نادرست است.");
    }
  };

  const handleLoginWithPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setErrorMessage("شماره موبایل را وارد نمایید.");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("رمز عبور را وارد نمایید.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const res = await loginWithPassword(cleanPhone, password, referralCode.trim() || undefined);
    setIsLoading(false);

    if (res.success && res.user) {
      const loggedInUser = res.user;
      setSuccessMessage(`خوش آمدید ${loggedInUser.name || ""}! ورود با موفقیت انجام شد.`);
      setTimeout(() => {
        if (
          (loggedInUser.role === "SUPER_ADMIN" ||
            loggedInUser.role === "CATALOG_MANAGER" ||
            loggedInUser.role === "FINANCE_ADMIN" ||
            loggedInUser.role === "SUPPORT_ADMIN") &&
          redirect === "/"
        ) {
          router.push("/admin");
        } else {
          router.push(redirect);
        }
      }, 900);
    } else {
      setErrorMessage(res.message || "رمز عبور وارد شده نامعتبر است.");
    }
  };

  return (
    <Card3D maxTilt={4} glareEffect={true} className="max-w-md w-full rounded-3xl shadow-2xl">
      <div className="glass-panel rounded-3xl overflow-hidden border border-brand-border/90 dark:border-slate-700/80">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-teal-950 via-brand-primary to-brand-primaryDark p-6 sm:p-7 text-white text-center relative z-10">
          <div className="w-13 h-13 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mx-auto mb-3 shadow-md">
            {authMode === "password" ? (
              <Lock className="w-6 h-6 text-amber-300" />
            ) : step === "input" ? (
              <Phone className="w-6 h-6 text-amber-300" />
            ) : (
              <KeyRound className="w-6 h-6 text-amber-300" />
            )}
          </div>

          <h1 className="text-xl font-black">
            {authMode === "password"
              ? "ورود با رمز عبور"
              : step === "input"
              ? "ورود و ثبت‌نام با کد یکبار مصرف (OTP)"
              : "تایید شماره موبایل با کد ۵ رقمی"}
          </h1>
          <p className="text-xs text-teal-100/90 mt-1.5 leading-relaxed">
            {authMode === "password"
              ? "شماره موبایل و رمز عبور حساب خود را وارد فرمایید"
              : step === "input"
              ? "کد تایید ۵ رقمی بلافاصله به شماره همراه شما پیامک خواهد شد"
              : `کد ۵ رقمی پیامک‌شده به شماره ${phone} را وارد نمایید`}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-brand-border/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 relative z-10">
          <button
            type="button"
            onClick={() => {
              setAuthMode("phone");
              setStep("input");
              setErrorMessage(null);
            }}
            className={`flex-1 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              authMode === "phone"
                ? "border-teal-500 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700"
            }`}
          >
            کد یکبار مصرف (OTP)
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("password");
              setStep("input");
              setErrorMessage(null);
            }}
            className={`flex-1 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              authMode === "password"
                ? "border-teal-500 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700"
            }`}
          >
            ورود با رمز عبور
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-7 space-y-5 text-xs text-slate-800 dark:text-slate-100 relative z-10">
          {errorMessage && (
            <div className="bg-rose-50/90 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 p-3.5 rounded-2xl flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center gap-2.5 animate-bounce">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: PHONE OTP */}
          {authMode === "phone" && (
            <>
              {step === "input" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-brand-dark dark:text-white mb-1.5">
                      شماره موبایل:
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="09180000000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        dir="ltr"
                        className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-2xl pr-4 pl-10 text-sm font-mono outline-none text-left text-slate-800 dark:text-slate-100 transition-all duration-200"
                      />
                      <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-brand-dark dark:text-white mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-amber-500" />
                        <span>کد معرف (اختیاری):</span>
                      </span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-normal">
                        جهت دریافت پاداش عضویت
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="مثلاً: ARZAN-1234"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        dir="ltr"
                        className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-2xl pr-4 pl-10 text-xs font-mono uppercase outline-none text-left text-slate-800 dark:text-slate-100 transition-all duration-200"
                      />
                      <Gift className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Quick Admin/Demo Selection */}
                  <div className="space-y-2.5 pt-3 border-t border-brand-border/60 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      <span>ورود سریع حساب‌های مدیران سامانه:</span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ADMIN_ACCOUNTS.map((acc) => (
                        <button
                          key={acc.phone}
                          type="button"
                          onClick={() => {
                            setPhone(acc.phone);
                            handleSendPhoneOtp(acc.phone);
                          }}
                          className={`p-2.5 rounded-xl border text-right transition-all duration-200 flex flex-col justify-between gap-1 shadow-xs hover:scale-[1.02] active:scale-95 cursor-pointer ${acc.border} ${acc.bg}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className={`font-bold text-[11px] ${acc.text} line-clamp-1`}>
                              {acc.name}
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${acc.badge}`}>
                              {acc.phone.slice(-4)}
                            </span>
                          </div>
                          <span className={`text-[10px] font-medium ${acc.subtext}`}>
                            {acc.roleTitle}
                          </span>
                          <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5">
                            <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200 dir-ltr text-left">
                              {acc.phone}
                            </span>
                            <span className="text-[9px] text-slate-500 dark:text-slate-400">
                              ورود ⚡
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Regular Customer Account */}
                    <button
                      type="button"
                      onClick={() => {
                        setPhone(USER_ACCOUNT.phone);
                        handleSendPhoneOtp(USER_ACCOUNT.phone);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-right transition-all duration-200 flex items-center justify-between gap-2 shadow-xs hover:scale-[1.02] active:scale-95 cursor-pointer ${USER_ACCOUNT.border} ${USER_ACCOUNT.bg}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-300 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className={`font-bold text-[11px] ${USER_ACCOUNT.text}`}>
                            {USER_ACCOUNT.name} ({USER_ACCOUNT.roleTitle})
                          </span>
                          <span className={`text-[10px] ${USER_ACCOUNT.subtext} block`}>
                            {USER_ACCOUNT.scope}
                          </span>
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200 dir-ltr block">
                          {USER_ACCOUNT.phone}
                        </span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400">
                          ورود ⚡
                        </span>
                      </div>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendPhoneOtp()}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 cursor-pointer text-xs sm:text-sm"
                  >
                    {isLoading ? (
                      <span>در حال ارسال پیامک...</span>
                    ) : (
                      <>
                        <span>دریافت کد تایید یکبار مصرف (OTP)</span>
                        <ArrowLeft className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <label className="block font-bold text-brand-dark dark:text-white text-xs sm:text-sm">
                      کد تایید ۵ رقمی پیامک‌شده:
                    </label>
                    <p className="text-[11px] text-slate-400">
                      کد را در کادرهای زیر تایپ یا Paste کنید:
                    </p>
                  </div>

                  {/* 5-Box Modern OTP Input */}
                  <OtpInput
                    value={otp}
                    onChange={(val) => setOtp(val)}
                    disabled={isLoading}
                    onComplete={(completeOtp) => handleVerifyOtp(completeOtp)}
                  />

                  {/* Optional Referral Code (New Users Only) */}
                  <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl space-y-1.5 text-right">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        کد معرف دوست یا اسپانسر:
                      </label>
                      <span className="text-[10px] text-teal-700 dark:text-teal-400 font-bold bg-teal-500/20 px-2 py-0.5 rounded-full">
                        اختیاری
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="مثلاً: ARZAN-1234"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      dir="ltr"
                      maxLength={20}
                      className="w-full bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-700 focus:border-teal-500 rounded-xl py-2 px-3 text-center font-mono font-bold text-xs uppercase outline-none text-slate-800 dark:text-slate-100 transition-all duration-200"
                    />
                  </div>

                  {/* Actions & Resend */}
                  <div className="space-y-2.5 pt-2 border-t border-brand-border/60 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11.5px]">
                      <button
                        type="button"
                        onClick={() => {
                          setStep("input");
                          setErrorMessage(null);
                          setSuccessMessage(null);
                          setOtp("");
                        }}
                        className="text-slate-500 dark:text-slate-400 hover:text-brand-dark dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>تغییر شماره ({phone})</span>
                      </button>

                      {countdown > 0 ? (
                        <span className="text-slate-400 dark:text-slate-500 font-mono">
                          ارسال مجدد ({countdown} ثانیه)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendPhoneOtp()}
                          className="text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>ارسال مجدد پیامک</span>
                        </button>
                      )}
                    </div>

                    {/* Fallback Option: Send to Registered Email */}
                    <div>
                      <button
                        type="button"
                        onClick={handleSendRegisteredEmailOtp}
                        disabled={isSendingEmailOtp}
                        className="w-full py-2.5 px-3 rounded-xl border border-sky-300/80 dark:border-sky-800/80 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/15 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <Mail className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                        <span>
                          {isSendingEmailOtp
                            ? "در حال ارسال به ایمیل حساب..."
                            : "کد را دریافت نکردید؟ ارسال به ایمیل ثبت‌شده در حساب"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={isLoading || otp.length < 5}
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
                  >
                    {isLoading ? (
                      <span>در حال تایید کد...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تایید و ورود به حساب کاربری</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* MODE 2: PASSWORD */}
          {authMode === "password" && (
            <form onSubmit={handleLoginWithPassword} className="space-y-4">
              <div>
                <label className="block font-bold text-brand-dark dark:text-white mb-1.5">
                  شماره موبایل:
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="09180000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    dir="ltr"
                    className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-2xl pr-4 pl-10 text-sm font-mono outline-none text-left text-slate-800 dark:text-slate-100 transition-all duration-200"
                  />
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-brand-dark dark:text-white mb-1.5">
                  رمز عبور حساب:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    dir="ltr"
                    className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-2xl pr-4 pl-10 text-sm font-mono outline-none text-left text-slate-800 dark:text-slate-100 transition-all duration-200"
                  />
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-brand-dark dark:text-white mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-amber-500" />
                    <span>کد معرف (اختیاری):</span>
                  </span>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-normal">
                    جهت دریافت پاداش
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="مثلاً: ARZAN-1234"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    dir="ltr"
                    className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-brand-border dark:border-slate-700 focus:border-teal-500 rounded-2xl pr-4 pl-10 text-xs font-mono uppercase outline-none text-left text-slate-800 dark:text-slate-100 transition-all duration-200"
                  />
                  <Gift className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
              >
                {isLoading ? (
                  <span>در حال بررسی رمز عبور...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ورود با رمز عبور</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </Card3D>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors relative overflow-hidden">
      <Header />
      <AmbientGlow variant="teal" className="-top-20 -right-20" />
      <AmbientGlow variant="mixed" className="bottom-10 -left-20 opacity-30" />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 pb-32 sm:pb-20 relative z-10">
        <Suspense
          fallback={
            <div className="p-8 text-center text-xs font-bold text-slate-400">
              در حال بارگذاری صفحه ورود...
            </div>
          }
        >
          <LoginContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
