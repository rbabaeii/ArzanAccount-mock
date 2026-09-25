"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  X,
  Phone,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  RotateCcw,
  ShieldCheck,
  User,
  Gift,
  Sparkles,
} from "lucide-react";
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

export default function LoginModal() {
  const {
    isLoginModalOpen,
    closeLoginModal,
    sendOtp,
    sendEmailOtp,
    verifyOtp,
    loginWithPassword,
  } = useAuth();
  const router = useRouter();

  // Auth mode: ONLY "phone" (OTP) or "password"
  const [authMode, setAuthMode] = useState<"phone" | "password">("phone");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [displayedOtp, setDisplayedOtp] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isLoginModalOpen) return null;

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
      setDisplayedOtp(res.code || "11111");
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
        setDisplayedOtp(res.code || "11111");
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
        setSuccessMessage(null);
        closeLoginModal();
        if (
          loggedInUser.role === "SUPER_ADMIN" ||
          loggedInUser.role === "CATALOG_MANAGER" ||
          loggedInUser.role === "FINANCE_ADMIN" ||
          loggedInUser.role === "SUPPORT_ADMIN"
        ) {
          router.push("/admin");
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

    const res = await loginWithPassword(cleanPhone, password);
    setIsLoading(false);

    if (res.success && res.user) {
      const loggedInUser = res.user;
      setSuccessMessage(`خوش آمدید ${loggedInUser.name || ""}! ورود با موفقیت انجام شد.`);
      setTimeout(() => {
        setSuccessMessage(null);
        closeLoginModal();
        if (
          loggedInUser.role === "SUPER_ADMIN" ||
          loggedInUser.role === "CATALOG_MANAGER" ||
          loggedInUser.role === "FINANCE_ADMIN" ||
          loggedInUser.role === "SUPPORT_ADMIN"
        ) {
          router.push("/admin");
        }
      }, 900);
    } else {
      setErrorMessage(res.message || "رمز عبور وارد شده نامعتبر است.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel relative overflow-hidden rounded-3xl shadow-2xl border border-brand-border/90 dark:border-slate-700/80 max-w-md w-full animate-scaleUp">
        {/* Corner Glow */}
        <div className="absolute -top-14 -right-14 w-36 h-36 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-950 via-brand-primary to-brand-primaryDark p-5 sm:p-6 text-white flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-xs">
              {authMode === "password" ? (
                <Lock className="w-5 h-5 text-amber-300" />
              ) : step === "input" ? (
                <Phone className="w-5 h-5 text-amber-300" />
              ) : (
                <KeyRound className="w-5 h-5 text-amber-300" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {authMode === "password"
                  ? "ورود با رمز عبور"
                  : step === "input"
                  ? "ورود و ثبت‌نام با پیامک OTP"
                  : "تایید شماره موبایل"}
              </h3>
              <p className="text-[11px] text-teal-100/80">
                {authMode === "password"
                  ? "ورود سریع با رمز عبور شخصی"
                  : step === "input"
                  ? "ورود سریع بدون نیاز به حفظ رمز"
                  : `کد پیامک‌شده به ${phone}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeLoginModal}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-brand-border/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 relative z-10 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMode("phone");
              setStep("input");
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 transition-all border-b-2 cursor-pointer ${
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
            className={`flex-1 py-3 transition-all border-b-2 cursor-pointer ${
              authMode === "password"
                ? "border-teal-500 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700"
            }`}
          >
            ورود با رمز عبور
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs text-slate-800 dark:text-slate-100 max-h-[75vh] overflow-y-auto relative z-10">
          {errorMessage && (
            <div className="bg-rose-50/90 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 p-3 rounded-xl flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: OTP */}
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
                        className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-brand-border dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-2xl pr-4 pl-10 text-sm font-mono outline-none text-left text-slate-800 dark:text-slate-100 transition-all"
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
                        className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-brand-border dark:border-slate-700 focus:border-teal-500 rounded-2xl pr-4 pl-10 text-xs font-mono uppercase outline-none text-left text-slate-800 dark:text-slate-100 transition-all"
                      />
                      <Gift className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Quick Select Admin / Customer */}
                  <div className="space-y-2 pt-2 border-t border-brand-border/60 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                      <span>ورود تستی و مدیران:</span>
                    </span>

                    <div className="grid grid-cols-2 gap-1.5">
                      {ADMIN_ACCOUNTS.map((acc) => (
                        <button
                          key={acc.phone}
                          type="button"
                          onClick={() => {
                            setPhone(acc.phone);
                            handleSendPhoneOtp(acc.phone);
                          }}
                          className={`p-2 rounded-xl border text-right transition-all flex flex-col justify-between gap-0.5 shadow-2xs hover:scale-[1.01] active:scale-95 cursor-pointer ${acc.border} ${acc.bg}`}
                        >
                          <span className={`font-bold text-[10.5px] ${acc.text} truncate`}>
                            {acc.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400 dir-ltr text-left">
                            {acc.phone}
                          </span>
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPhone(USER_ACCOUNT.phone);
                        handleSendPhoneOtp(USER_ACCOUNT.phone);
                      }}
                      className={`w-full p-2 rounded-xl border text-right transition-all flex items-center justify-between gap-2 shadow-2xs hover:scale-[1.01] active:scale-95 cursor-pointer ${USER_ACCOUNT.border} ${USER_ACCOUNT.bg}`}
                    >
                      <span className={`font-bold text-[10.5px] ${USER_ACCOUNT.text}`}>
                        {USER_ACCOUNT.name} ({USER_ACCOUNT.roleTitle})
                      </span>
                      <span className="font-mono text-[10.5px] text-slate-600 dark:text-slate-400 dir-ltr">
                        {USER_ACCOUNT.phone}
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendPhoneOtp()}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
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
                  {/* Temporary Dev OTP Display Banner */}
                  <div className="p-3 bg-amber-500/15 dark:bg-amber-500/20 border-2 border-dashed border-amber-500/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5 text-amber-900 dark:text-amber-200 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-amber-800 dark:text-amber-200 block">کد تایید ورود (محیط تست):</span>
                        <span className="font-mono text-base font-extrabold tracking-widest text-amber-950 dark:text-amber-300">
                          {displayedOtp || "11111"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const code = displayedOtp || "11111";
                        setOtp(code);
                        handleVerifyOtp(code);
                      }}
                      className="w-full sm:w-auto px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap"
                    >
                      جایگذاری و ورود ⚡
                    </button>
                  </div>

                  <div className="text-center space-y-1">
                    <label className="block font-bold text-brand-dark dark:text-white text-xs">
                      کد تایید ۵ رقمی پیامک‌شده:
                    </label>
                  </div>

                  {/* 5-Box Modern OTP Input */}
                  <OtpInput
                    value={otp}
                    onChange={(val) => setOtp(val)}
                    disabled={isLoading}
                    onComplete={(completeOtp) => handleVerifyOtp(completeOtp)}
                  />

                  {/* Actions & Resend */}
                  <div className="space-y-2 pt-1 border-t border-brand-border/60 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px]">
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
                          className="text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>ارسال مجدد پیامک</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={handleSendRegisteredEmailOtp}
                        disabled={isSendingEmailOtp}
                        className="w-full py-2 px-3 rounded-xl border border-sky-300/80 dark:border-sky-800/80 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/15 text-[11.5px] font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                        <span>ارسال به ایمیل ثبت‌شده حساب</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={isLoading || otp.length < 5}
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
                  >
                    {isLoading ? (
                      <span>در حال تایید...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تایید و ورود به حساب</span>
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
                    className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-brand-border dark:border-slate-700 focus:border-teal-500 rounded-2xl pr-4 pl-10 text-sm font-mono outline-none text-left text-slate-800 dark:text-slate-100 transition-all"
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
                    className="w-full h-12 bg-slate-50 dark:bg-slate-800 border border-brand-border dark:border-slate-700 focus:border-teal-500 rounded-2xl pr-4 pl-10 text-sm font-mono outline-none text-left text-slate-800 dark:text-slate-100 transition-all"
                  />
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
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
    </div>
  );
}
