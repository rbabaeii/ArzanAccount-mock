"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toPersianDateTime } from "@/lib/date";
import { formatNumber } from "@/lib/format";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  ShieldCheck,
  Eye,
  EyeOff,
  Key,
  Globe,
  FileText,
  Check,
  ExternalLink,
  HelpCircle,
  Activity,
  Sparkles,
  Inbox,
  Clock,
  ChevronRight,
  ShieldAlert,
  Search,
} from "lucide-react";

export default function AdminEmailSettingsPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"config" | "compose" | "preview" | "logs">("config");

  // Compose Custom Direct Email
  const [composeRecipientEmail, setComposeRecipientEmail] = useState("");
  const [composeRecipientName, setComposeRecipientName] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBadge, setComposeBadge] = useState("پیام اختصاصی مدیریت");
  const [composeMessage, setComposeMessage] = useState("");
  const [composeButtonText, setComposeButtonText] = useState("");
  const [composeButtonUrl, setComposeButtonUrl] = useState("");
  const [composeAdminSender, setComposeAdminSender] = useState("مدیریت و پشتیبانی ارزان اکانت");
  const [isSendingCustom, setIsSendingCustom] = useState(false);
  const [customSendResult, setCustomSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // SMTP Settings
  const [host, setHost] = useState("smtp.gmail.com");
  const [port, setPort] = useState(465);
  const [secure, setSecure] = useState(true);
  const [smtpUser, setSmtpUser] = useState("rezadalyagpt@gmail.com");
  const [smtpPass, setSmtpPass] = useState("xeuhxtofquloumhs");
  const [fromName, setFromName] = useState("فروشگاه من");
  const [fromEmail, setFromEmail] = useState("rezadalyagpt@gmail.com");
  const [replyTo, setReplyTo] = useState("rezadalyagpt@gmail.com");
  const [isEnabled, setIsEnabled] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Test Email
  const [testRecipient, setTestRecipient] = useState("rezadalyagpt@gmail.com");
  const [testTemplate, setTestTemplate] = useState("order_receipt");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Preview Variant
  const [previewVariant, setPreviewVariant] = useState<1 | 2 | 3>(2);

  // Stats & Logs
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    todayCount: 0,
    deliveryRate: 100,
    lastSentAt: null as string | null,
    lastStatus: "IDLE",
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [logStatus, setLogStatus] = useState("all");
  const [logSearch, setLogSearch] = useState("");
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Load Settings & Stats
  const loadData = useCallback(async () => {
    try {
      const [settingsRes, statsRes] = await Promise.all([
        api.getEmailSettings().catch(() => null),
        api.getEmailStats().catch(() => null),
      ]);

      if (settingsRes) {
        if (settingsRes.host) setHost(settingsRes.host);
        if (settingsRes.port) setPort(Number(settingsRes.port));
        if (settingsRes.secure !== undefined) setSecure(Boolean(settingsRes.secure));
        if (settingsRes.user) setSmtpUser(settingsRes.user);
        if (settingsRes.fromName) setFromName(settingsRes.fromName);
        if (settingsRes.fromEmail) setFromEmail(settingsRes.fromEmail);
        if (settingsRes.replyTo) setReplyTo(settingsRes.replyTo);
        if (settingsRes.isEnabled !== undefined) setIsEnabled(Boolean(settingsRes.isEnabled));
      }

      if (statsRes) {
        setStats(statsRes);
      }
    } catch (err) {
      console.error("Error loading email settings:", err);
    }
  }, []);

  // Load Logs
  const loadLogs = useCallback(async () => {
    try {
      setIsLoadingLogs(true);
      const res = await api.getEmailLogs({
        status: logStatus !== "all" ? logStatus : undefined,
        search: logSearch || undefined,
        limit: 50,
      });
      if (res && res.logs) {
        setLogs(res.logs);
      }
    } catch (err) {
      console.error("Error loading email logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [logStatus, logSearch]);

  useEffect(() => {
    loadData();
    loadLogs();
  }, [loadData, loadLogs]);

  const showNotification = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Quick Preset: Gmail
  const applyGmailPreset = () => {
    setHost("smtp.gmail.com");
    setPort(465);
    setSecure(true);
    setSmtpUser("rezadalyagpt@gmail.com");
    setFromEmail("rezadalyagpt@gmail.com");
    setReplyTo("rezadalyagpt@gmail.com");
    showNotification("success", "تنظیمات پیش‌فرض سرور امن Gmail SMTP بارگذاری شد.");
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateEmailSettings(
        {
          host,
          port: Number(port),
          secure,
          user: smtpUser,
          pass: smtpPass,
          fromName,
          fromEmail,
          replyTo,
          isEnabled,
        },
        user?.name || "مدیر ارشد"
      );
      showNotification("success", "تنظیمات سرور ایمیل با موفقیت در سیستم ذخیره و اعمال گردید.");
      loadData();
    } catch (err: any) {
      showNotification("error", err?.message || "خطا در ذخیره تنظیمات ایمیل.");
    } finally {
      setIsSaving(false);
    }
  };

  // Send Test Email
  const handleSendTest = async () => {
    if (!testRecipient.trim()) {
      showNotification("error", "لطفاً آدرس ایمیل گیرنده را وارد نمایید.");
      return;
    }
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await api.sendTestEmail(testRecipient.trim(), testTemplate);
      setTestResult({
        success: true,
        message: `ایمیل تست با موفقیت به ${testRecipient} ارسال شد! پیام‌رسانی سرور تایید گردید.`,
      });
      showNotification("success", "ایمیل با موفقیت تحویل داده شد!");
      loadLogs();
      loadData();
    } catch (err: any) {
      const errorMsg = err?.message || "ارسال ایمیل تستی ناموفق بود.";
      setTestResult({
        success: false,
        message: errorMsg,
      });
      showNotification("error", errorMsg);
      loadLogs();
      loadData();
    } finally {
      setIsSendingTest(false);
    }
  };

  // Send Custom Direct Email
  const handleSendCustomEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeRecipientEmail.trim() || !composeRecipientEmail.includes("@")) {
      showNotification("error", "لطفاً آدرس ایمیل معتبر برای گیرنده وارد نمایید.");
      return;
    }
    if (!composeSubject.trim()) {
      showNotification("error", "موضوع ایمیل نمی‌تواند خالی باشد.");
      return;
    }
    if (!composeMessage.trim()) {
      showNotification("error", "متن پیام ایمیل نمی‌تواند خالی باشد.");
      return;
    }

    setIsSendingCustom(true);
    setCustomSendResult(null);

    try {
      const res = await api.sendCustomEmail({
        recipientEmail: composeRecipientEmail.trim(),
        recipientName: composeRecipientName.trim() || undefined,
        subject: composeSubject.trim(),
        badge: composeBadge.trim() || undefined,
        message: composeMessage.trim(),
        buttonText: composeButtonText.trim() || undefined,
        buttonUrl: composeButtonUrl.trim() || undefined,
        adminSender: composeAdminSender.trim() || undefined,
      });

      if (res && res.success) {
        setCustomSendResult({ success: true, message: "ایمیل سفارشی با موفقیت به آدرس گیرنده ارسال گردید." });
        showNotification("success", "ایمیل سفارشی با موفقیت به گیرنده ارسال شد.");
        loadLogs();
        loadData();
      } else {
        const errorMsg = res?.message || res?.error || "ارسال ایمیل ناموفق بود.";
        setCustomSendResult({ success: false, message: errorMsg });
        showNotification("error", errorMsg);
        loadLogs();
        loadData();
      }
    } catch (error: any) {
      const errorMsg = error?.message || "خطای ارتباط با سرور در ارسال ایمیل.";
      setCustomSendResult({ success: false, message: errorMsg });
      showNotification("error", errorMsg);
      loadLogs();
      loadData();
    } finally {
      setIsSendingCustom(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-6 z-50 px-5 py-3 rounded-xl shadow-xl text-xs flex items-center gap-2 text-white animate-bounce ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-200 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-brand-primary dark:text-teal-300">
              <Mail className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-admin-text dark:text-white">
              تنظیمات سرور ایمیل (SMTP) و قالب‌ها
            </h1>
          </div>
          <p className="text-xs text-admin-textMuted dark:text-slate-400 mt-1">
            پیکربندی Gmail SMTP، قالب‌های اختصاصی پروژه Stitch، ارسال تست و لاگ‌های ارسالی به خریداران
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800 px-4 py-2 rounded-xl text-xs shadow-card">
          <span className="text-neutral-400">وضعیت اتصال:</span>
          <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Gmail SMTP متصل و فعال</span>
          </span>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-5 rounded-2xl border border-admin-borderLight dark:border-slate-800/80 shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-400/40 dark:hover:border-teal-400/30 hover:-translate-y-1.5 transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-teal-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          <span className="text-[11px] text-admin-textMuted dark:text-slate-400 font-medium block">
            کل ایمیل‌های پردازش‌شده
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-mono text-teal-600 dark:text-teal-400">
              {formatNumber(stats.total)}
            </span>
            <span className="text-xs text-neutral-400">فقره</span>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-5 rounded-2xl border border-admin-borderLight dark:border-slate-800/80 shadow-card hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-400/40 dark:hover:border-emerald-400/30 hover:-translate-y-1.5 transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          <span className="text-[11px] text-admin-textMuted dark:text-slate-400 font-medium block">
            تحویل موفقیت‌آمیز
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {formatNumber(stats.sent)}
            </span>
            <span className="text-xs text-emerald-600 font-bold font-mono">({stats.deliveryRate}%)</span>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-5 rounded-2xl border border-admin-borderLight dark:border-slate-800/80 shadow-card hover:shadow-xl hover:shadow-purple-500/5 hover:border-purple-400/40 dark:hover:border-purple-400/30 hover:-translate-y-1.5 transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          <span className="text-[11px] text-admin-textMuted dark:text-slate-400 font-medium block">
            ایمیل‌های ارسالی امروز
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
              {formatNumber(stats.todayCount)}
            </span>
            <span className="text-xs text-neutral-400">ایمیل</span>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-5 rounded-2xl border border-admin-borderLight dark:border-slate-800/80 shadow-card hover:shadow-xl hover:shadow-rose-500/5 hover:border-rose-400/40 dark:hover:border-rose-400/30 hover:-translate-y-1.5 transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-rose-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
          <span className="text-[11px] text-admin-textMuted dark:text-slate-400 font-medium block">
            خطا در ارسال
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-black font-mono ${stats.failed > 0 ? "text-red-600" : "text-neutral-400"}`}>
              {formatNumber(stats.failed)}
            </span>
            <span className="text-xs text-neutral-400">خطا</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-admin-borderLight dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 shrink-0 ${
            activeTab === "config"
              ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-admin-borderLight dark:border-slate-800"
          }`}
        >
          <Server className="w-4 h-4" />
          <span>پیکربندی SMTP و تست لایو</span>
        </button>

        <button
          onClick={() => setActiveTab("compose")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 shrink-0 ${
            activeTab === "compose"
              ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-admin-borderLight dark:border-slate-800"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>ارسال ایمیل اختصاصی به کاربران</span>
          <span className="bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-2xs">
            مستقیم
          </span>
        </button>

        <button
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 shrink-0 ${
            activeTab === "preview"
              ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-admin-borderLight dark:border-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>پیش‌نمایش قالب‌های Stitch</span>
          <span className="bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[10px] px-2 py-0.5 rounded-full font-mono shadow-2xs">
            ۳ واریانت
          </span>
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 shrink-0 ${
            activeTab === "logs"
              ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-admin-borderLight dark:border-slate-800"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>لاگ و تاریخچه ارسالی‌ها</span>
          <span className="bg-neutral-200 dark:bg-slate-800 text-neutral-700 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-mono shadow-2xs">
            {stats.total}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SMTP CONFIGURATION & LIVE TEST */}
      {/* ========================================================================= */}
      {activeTab === "config" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 cols: Config Form */}
          <div className="lg:col-span-7 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-6 shadow-card hover:shadow-lg transition-all duration-300 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-admin-borderLight dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-sm text-admin-text dark:text-white">مشخصات اتصال سرور SMTP</h3>
              </div>
              <button
                type="button"
                onClick={applyGmailPreset}
                className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800/60 transition-all duration-150 hover:scale-105 active:scale-95 shadow-2xs"
              >
                بارگذاری پیش‌فرض جیمیل (Gmail)
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5">
                    آدرس سرور میزبان (Host):
                  </label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 outline-none font-mono text-left dir-ltr focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    placeholder="smtp.gmail.com"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5">
                    پورت SMTP:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(Number(e.target.value))}
                      className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 outline-none font-mono text-left dir-ltr focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                      placeholder="465"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPort(465);
                        setSecure(true);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all duration-150 hover:scale-105 active:scale-95 ${
                        port === 465
                          ? "bg-teal-600 text-white border-teal-600 font-bold shadow-2xs"
                          : "bg-admin-bg dark:bg-slate-800 text-neutral-500 border-neutral-300 dark:border-slate-700 hover:border-teal-400"
                      }`}
                    >
                      465 SSL
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPort(587);
                        setSecure(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all duration-150 hover:scale-105 active:scale-95 ${
                        port === 587
                          ? "bg-teal-600 text-white border-teal-600 font-bold shadow-2xs"
                          : "bg-admin-bg dark:bg-slate-800 text-neutral-500 border-neutral-300 dark:border-slate-700 hover:border-teal-400"
                      }`}
                    >
                      587 TLS
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5">
                    نام کاربری / آدرس جیمیل (User):
                  </label>
                  <input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 outline-none font-mono text-left dir-ltr focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    placeholder="example@gmail.com"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5">
                    کلید دسترسی اپلیکیشن جیمیل (App Password):
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2 pr-3 pl-10 outline-none font-mono text-left dir-ltr focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                      placeholder="xeuhxtofquloumhs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-admin-borderLight dark:border-slate-800">
                <div>
                  <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5">
                    نام نمایشی فرستنده (MAIL_FROM Name):
                  </label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    placeholder="فروشگاه من"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5">
                    آدرس ایمیل فرستنده (MAIL_FROM Email):
                  </label>
                  <input
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 outline-none font-mono text-left dir-ltr focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    placeholder="rezadalyagpt@gmail.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5">
                    آدرس پاسخ (Reply-To):
                  </label>
                  <input
                    type="email"
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                    className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 outline-none font-mono text-left dir-ltr focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    placeholder="rezadalyagpt@gmail.com"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer py-2 group">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => setIsEnabled(e.target.checked)}
                      className="w-4 h-4 text-brand-primary rounded accent-teal-600 cursor-pointer transition-transform group-hover:scale-110"
                    />
                    <span className="font-semibold text-admin-text dark:text-slate-200 text-xs">
                      سرویس ارسال ایمیل در سراسر سایت فعال باشد
                    </span>
                  </label>
                </div>
              </div>

              {/* Anti-spam Advice Box */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-xl text-[11.5px] text-emerald-900 dark:text-emerald-300 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>استانداردهای ضد اسپم و تحویل به اینباکس (Inbox Deliverability):</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-emerald-800 dark:text-emerald-400 leading-relaxed pr-1">
                  <li>حذف کلیه هدرهای حساس و مشکوک فیلتر اسپم نظیر <code>X-Priority</code> و <code>X-Mailer</code> غیراستاندارد.</li>
                  <li>ارسال موازی نسخه متنی (Plain Text) در کنار HTML و فرمت‌بندی استاندارد RFC 2047 جهت عبور از فیلترهای ضد فیشینگ.</li>
                  <li>حذف کلیه آدرس‌های محلی <code>localhost</code> از متن ایمیل و جایگزینی با پروتکل امن HTTPS.</li>
                  <li><strong>نکته جی‌میل:</strong> در اولین ارسال‌ها به یک آدرس جدید، حتماً یک‌بار دکمه <em>«Report not spam / گزارش به عنوان غیراسپم»</em> را بزنید تا هوش مصنوعی گوگل این فرستنده را برای همیشه سفید (Whitelist) کند.</li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white py-3 rounded-xl font-bold text-xs shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 hover:scale-[1.01] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isSaving ? "در حال ذخیره‌سازی..." : "ذخیره و ثبت تنظیمات SMTP"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right 5 cols: Live Diagnostics & Test Email Tool */}
          <div className="lg:col-span-5 space-y-6">
            <div className="group relative overflow-hidden bg-gradient-to-br from-teal-900 to-slate-900 text-white p-6 rounded-2xl border border-teal-800 shadow-xl hover:shadow-2xl hover:shadow-teal-900/30 hover:-translate-y-1 transition-all duration-300 space-y-5">
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-teal-500/20 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="flex items-center gap-2.5 relative z-10">
                <div className="w-9 h-9 rounded-xl bg-teal-800 text-teal-200 flex items-center justify-center font-bold group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">ارسال و تست لایو ایمیل</h3>
                  <p className="text-[11px] text-teal-200 mt-0.5">تست در لحظه اتصال سرور با ارسال پیام واقعی</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs relative z-10">
                <div>
                  <label className="block text-teal-100 font-semibold mb-1">
                    ایمیل مقصد برای دریافت تست:
                  </label>
                  <input
                    type="email"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    className="w-full bg-black/30 border border-white/20 text-white rounded-xl py-2 px-3 outline-none font-mono text-left dir-ltr placeholder:text-neutral-400 focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition-all duration-200"
                    placeholder="your-email@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-teal-100 font-semibold mb-1">
                    انتخاب قالب برای تست:
                  </label>
                  <select
                    value={testTemplate}
                    onChange={(e) => setTestTemplate(e.target.value)}
                    className="w-full bg-black/30 border border-white/20 text-white rounded-xl py-2 px-3 outline-none text-xs focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition-all duration-200"
                  >
                    <option value="order_receipt" className="bg-slate-900">رسید و تحویل لایسنس (واریانت ۲ استیچ)</option>
                    <option value="order_invoice" className="bg-slate-900">تأییدیه فاکتور خرید (واریانت ۱ استیچ)</option>
                    <option value="notification" className="bg-slate-900">اطلاع‌رسانی عمومی (واریانت ۳ استیچ)</option>
                    <option value="test" className="bg-slate-900">تست دیاگنوستیک اتصال سرور</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={isSendingTest}
                  className="w-full bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 py-2.5 rounded-xl font-black text-xs shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {isSendingTest ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال ارسال به سرور Gmail...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>ارسال فوری ایمیل تست</span>
                    </>
                  )}
                </button>
              </div>

              {/* Test Result Message Box */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs border flex items-start gap-2.5 ${
                    testResult.success
                      ? "bg-emerald-950/70 border-emerald-700 text-emerald-200"
                      : "bg-red-950/70 border-red-700 text-red-200"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="leading-relaxed">
                    <strong>{testResult.success ? "موفقیت‌آمیز:" : "خطا:"}</strong>{" "}
                    {testResult.message}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Status Help */}
            <div className="bg-white dark:bg-slate-900 border border-admin-borderLight dark:border-slate-800 rounded-2xl p-5 text-xs space-y-2.5 text-neutral-600 dark:text-slate-300">
              <h4 className="font-bold text-admin-text dark:text-white flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-teal-600" />
                <span>راهنمای رمز برنامه جیمیل (App Password)</span>
              </h4>
              <p className="text-[11.5px] leading-relaxed">
                رمز عبور <strong>{smtpPass}</strong> یک کلید اختصاصی ۱۶ کاراکتری جیمیل است. نیازی به ورود با پسورد اصلی حساب کاربری گوگل نیست و این روش ۱۰۰٪ امن و مورد تایید گوگل است.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: COMPOSE & SEND CUSTOM EMAIL TO USERS */}
      {/* ========================================================================= */}
      {activeTab === "compose" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Side - 7 Cols */}
          <div className="lg:col-span-7 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-6 shadow-card hover:shadow-lg transition-all duration-300 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-admin-borderLight dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand-primary" />
                <div>
                  <h3 className="font-bold text-sm text-admin-text dark:text-white">ارسال ایمیل مستقیم با متن دلخواه به کاربران</h3>
                  <p className="text-[11px] text-admin-textMuted dark:text-slate-400 mt-0.5">
                    ارسال پیام رسمی، اطلاعیه، رفع اشکال یا پیشنهاد ویژه به هر کاربر با قالب واکنش‌گرای ارزان اکانت
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Template Presets */}
            <div>
              <label className="block font-semibold text-xs text-admin-text dark:text-slate-200 mb-2">
                الگوهای آماده برای متن پیام (پیش‌تنظیم):
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setComposeSubject("اطلاع‌رسانی مهم پیرامون حساب کاربری شما در ارزان اکانت");
                    setComposeBadge("اطلاعیه مهم حساب");
                    setComposeMessage("کاربر گرامی،\n\nاین پیام جهت اطلاع‌رسانی در خصوص وضعیت خدمات و حساب کاربری شما ارسال گردیده است. لطفاً جهت بررسی جزئیات به بخش پنل کاربری خود مراجعه فرمایید.\n\nدر صورت وجود هرگونه ابهام یا سوال، تیم پشتیبانی ارزان اکانت به صورت ۲۴ ساعته در خدمت شماست.");
                    setComposeButtonText("مشاهده پنل کاربری");
                    setComposeButtonUrl("https://arzanaccount.com/profile");
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 hover:text-brand-primary border border-slate-200 dark:border-slate-700 hover:border-teal-400 transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xs"
                >
                  📢 اطلاعیه حساب کاربری
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setComposeSubject("راهنمای فعال‌سازی و تحویل اطلاعات اشتراک");
                    setComposeBadge("اطلاعات تکمیلی اشتراک");
                    setComposeMessage("کاربر گرامی،\n\nپیرو سفارش شما در ارزان اکانت، اطلاعات تکمیلی و راهنمای راه‌اندازی اشتراک برای شما آماده گردیده است. خواهشمندیم قبل از استفاده، دستورالعمل مندرج در پنل کاربری را به دقت مطالعه فرمایید.\n\nتیم پشتیبانی ما تا تحویل کامل و فعال‌سازی موفقیت‌آمیز در کنار شما خواهد بود.");
                    setComposeButtonText("بررسی سفارش و لایسنس");
                    setComposeButtonUrl("https://arzanaccount.com/profile?tab=orders");
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 hover:text-brand-primary border border-slate-200 dark:border-slate-700 hover:border-teal-400 transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xs"
                >
                  🔑 راهنمای لایسنس و اشتراک
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setComposeSubject("هدیه ویژه و کد تخفیف اختصاصی برای شما - ارزان اکانت");
                    setComposeBadge("کد تخفیف اختصاصی");
                    setComposeMessage("کاربر عزیز و همراه همیشگی ارزان اکانت،\n\nبه پاس قدردانی از اعتماد شما، کد تخفیف ویژه خرید بعدی به حساب شما اختصاص داده شد:\n\nکد تخفیف: SPECIAL-2026\nدرصد تخفیف: ۲۰٪ تخفیف بدون سقف بر روی تمام لایسنس‌ها\nمهلت استفاده: تا ۷ روز آینده");
                    setComposeButtonText("خرید با تخفیف ویژه");
                    setComposeButtonUrl("https://arzanaccount.com");
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 hover:text-brand-primary border border-slate-200 dark:border-slate-700 hover:border-teal-400 transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xs"
                >
                  🎁 کد تخفیف و هدیه
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setComposeSubject("پاسخ پشتیبانی به پیام شما در ارزان اکانت");
                    setComposeBadge("پشتیبانی مشتریان");
                    setComposeMessage("کاربر گرامی،\n\nدرخواست پشتیبانی و تیکت ارسالی شما توسط کارشناسان فنی ارزان اکانت بررسی گردید و مشکل مورد نظر به طور کامل برطرف شد.\n\nدر صورتی که نیاز به پیگیری مجدد یا هرگونه راهنمایی بیشتر دارید، لطفاً با پشتیبانی تلگرام در ارتباط باشید.");
                    setComposeButtonText("ارتباط با پشتیبانی");
                    setComposeButtonUrl("https://t.me/ArzanAccount_Support");
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 hover:text-brand-primary border border-slate-200 dark:border-slate-700 hover:border-teal-400 transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xs"
                >
                  💬 پاسخ پشتیبانی
                </button>
              </div>
            </div>

            <form onSubmit={handleSendCustomEmail} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5">
                    آدرس ایمیل گیرنده (کاربر): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={composeRecipientEmail}
                    onChange={(e) => setComposeRecipientEmail(e.target.value)}
                    className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 outline-none font-mono text-left dir-ltr focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    placeholder="customer@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5">
                    نام یا لقب گیرنده (اختیاری):
                  </label>
                  <input
                    type="text"
                    value={composeRecipientName}
                    onChange={(e) => setComposeRecipientName(e.target.value)}
                    className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    placeholder="مثال: علی احمدی (یا خالی برای «کاربر گرامی»)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5">
                    موضوع ایمیل (Subject): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    placeholder="مثلاً: پیام اختصاصی از طرف مدیریت ارزان اکانت"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5">
                    بج سربرگ ایمیل:
                  </label>
                  <input
                    type="text"
                    value={composeBadge}
                    onChange={(e) => setComposeBadge(e.target.value)}
                    className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    placeholder="مثال: پیام اختصاصی مدیریت"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5">
                  متن پیام ایمیل (دلخواه و چندخطی): <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2.5 px-3 outline-none leading-relaxed resize-y font-sans focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                  placeholder="متن دلخواه خود را اینجا بنویسید... (پاراگراف‌ها و خطوط جدید دقیقاً در ایمیل نمایش داده می‌شوند)"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5">
                    عنوان دکمه اقدام (اختیاری):
                  </label>
                  <input
                    type="text"
                    value={composeButtonText}
                    onChange={(e) => setComposeButtonText(e.target.value)}
                    className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    placeholder="مثال: ورود به پنل کاربری"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5">
                    لینک دکمه اقدام (اختیاری):
                  </label>
                  <input
                    type="url"
                    value={composeButtonUrl}
                    onChange={(e) => setComposeButtonUrl(e.target.value)}
                    className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 outline-none font-mono text-left dir-ltr focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    placeholder="https://arzanaccount.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5">
                  عنوان امضا / ارسال‌کننده:
                </label>
                <input
                  type="text"
                  value={composeAdminSender}
                  onChange={(e) => setComposeAdminSender(e.target.value)}
                  className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                  placeholder="مثال: مدیریت و پشتیبانی ارزان اکانت"
                />
              </div>

              {/* Status Alert */}
              {customSendResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 transition-all duration-200 ${
                    customSendResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
                      : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200"
                  }`}
                >
                  {customSendResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  )}
                  <span>{customSendResult.message}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setComposeRecipientEmail("");
                    setComposeRecipientName("");
                    setComposeSubject("");
                    setComposeMessage("");
                    setComposeButtonText("");
                    setComposeButtonUrl("");
                    setCustomSendResult(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-admin-borderLight dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  پاک‌کردن فرم
                </button>
                <button
                  type="submit"
                  disabled={isSendingCustom}
                  className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md shadow-teal-500/20 disabled:opacity-50"
                >
                  <Send className={`w-4 h-4 ${isSendingCustom ? "animate-pulse" : ""}`} />
                  <span>{isSendingCustom ? "در حال ارسال ایمیل..." : "ارسال ایمیل به کاربر"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Side - 5 Cols */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-5 shadow-card hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-admin-borderLight dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span className="font-bold text-xs text-admin-text dark:text-white">پیش‌نمایش زنده ایمیل خروجی</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">HTML Email Mock</span>
              </div>

              {/* Email Card Container */}
              <div className="bg-slate-100/80 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="bg-white text-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-200 text-right text-xs">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-teal-900 to-teal-700 text-white p-4 text-center">
                    <div className="inline-block bg-white/20 text-teal-100 text-[10px] px-2 py-0.5 rounded-full font-bold mb-1">
                      {composeBadge || "پیام اختصاصی مدیریت"}
                    </div>
                    <div className="text-sm font-black tracking-tight">⚡ ارزان اکانت (Arzan Account)</div>
                    <div className="text-[10px] text-teal-200 mt-0.5">سامانه هوشمند اشتراک‌ها و لایسنس‌های قانونی</div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-3">
                    <div className="text-xs font-bold text-teal-950">
                      سلام {composeRecipientName || "کاربر گرامی"}،
                    </div>

                    {composeSubject && (
                      <div className="text-xs font-bold text-slate-800 pb-1 border-b border-slate-100">
                        موضوع: {composeSubject}
                      </div>
                    )}

                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[11px] text-slate-700 leading-relaxed whitespace-pre-line min-h-[80px]">
                      {composeMessage || "متن پیام در اینجا به صورت زنده نمایش داده خواهد شد..."}
                    </div>

                    {composeButtonText && (
                      <div className="text-center pt-1">
                        <span className="inline-block bg-teal-800 text-white text-[11px] font-bold px-4 py-1.5 rounded-lg shadow-xs">
                          {composeButtonText} ←
                        </span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-500">
                      با احترام،<br />
                      <strong className="text-slate-800">{composeAdminSender || "مدیریت ارزان اکانت"}</strong>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-slate-50 border-t border-slate-100 p-2.5 text-center text-[9.5px] text-slate-400">
                    پشتیبانی ۲۴ ساعته در تلگرام: @arzan_support
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIVE TEMPLATE PREVIEWS (STITCH VARIANTS) */}
      {/* ========================================================================= */}
      {activeTab === "preview" && (
        <div className="space-y-6">
          {/* Variant Selector */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-4 rounded-2xl border border-admin-borderLight dark:border-slate-800/80 shadow-card flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <span className="font-bold text-xs text-admin-text dark:text-white">
                قالب‌های طراحی شده در پروژه Stitch («قالب ایمیل ارزان اکانت»):
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewVariant(2)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
                  previewVariant === 2
                    ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20"
                    : "bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                واریانت ۲: رسید مدرن و تحویل لایسنس (اصلی)
              </button>
              <button
                onClick={() => setPreviewVariant(1)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
                  previewVariant === 1
                    ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20"
                    : "bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                واریانت ۱: کارت مینیمال فاکتور
              </button>
              <button
                onClick={() => setPreviewVariant(3)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 ${
                  previewVariant === 3
                    ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20"
                    : "bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                واریانت ۳: هدر برند و اطلاعیه
              </button>
            </div>
          </div>

          {/* Rendered Container Preview */}
          <div className="bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 rounded-2xl border border-admin-borderLight dark:border-slate-800 flex justify-center">
            {/* VARIANT 2 (Main Receipt) */}
            {previewVariant === 2 && (
              <div className="w-full max-w-[580px] bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-xs">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#004153] via-[#005a71] to-[#38bdf8]"></div>
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <span className="font-black text-sm text-[#005a71]">⚡ ارزان اکانت</span>
                    <span className="bg-teal-50 text-[#005a71] font-mono font-bold px-2 py-0.5 rounded-full text-[11px]">
                      #ARZ-89421
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-[#004153]">رسید پرداخت و تحویل لایسنس</h3>
                    <p className="text-slate-500 text-[11.5px] mt-1 leading-relaxed">
                      سلام علی عزیز، خرید شما با موفقیت تایید شد. دسترسی و لایسنس قانونی اکانت شما صادر شده و آماده بهره‌برداری است.
                    </p>
                  </div>

                  {/* Credentials Box */}
                  <div className="bg-[#f0f9fa] border border-[#bce6ef] rounded-xl p-4 space-y-2">
                    <span className="font-bold text-[#005a71] block">🔑 مشخصات اکانت و لایسنس تحویل‌شده:</span>
                    <div className="bg-white border border-[#c7e5ed] p-2.5 rounded-lg font-mono text-left dir-ltr font-bold text-[#004153] text-xs">
                      https://families.google.com/join/ARZ992
                    </div>
                    <div className="bg-white border border-[#c7e5ed] p-2.5 rounded-lg font-mono text-left dir-ltr font-bold text-[#004153] text-xs">
                      user: premium@arzanaccount.ir | pass: YT-Family-2026
                    </div>
                  </div>

                  {/* Order Specs */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-3 bg-slate-50 flex justify-between font-semibold border-b border-slate-200">
                      <span>یوتیوب پرمیوم اختصاصی ۳ ماهه</span>
                      <span className="font-mono text-[#005a71] font-bold">420,000 تومان</span>
                    </div>
                    <div className="p-3 bg-slate-100/50 flex justify-between font-bold text-xs">
                      <span>مبلغ کل:</span>
                      <span className="text-emerald-700 font-mono text-sm">420,000 تومان</span>
                    </div>
                  </div>

                  {/* 3 Quick Steps */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="font-bold text-[#005a71] block">۱. کپی اطلاعات</span>
                      <span className="text-slate-400">اطلاعات باکس</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="font-bold text-[#005a71] block">۲. ورود</span>
                      <span className="text-slate-400">تایید لینک</span>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      <span className="font-bold text-emerald-800 block">۳. لذت پرمیوم</span>
                      <span className="text-emerald-600">بدون قطعی</span>
                    </div>
                  </div>

                  <button className="w-full bg-[#005a71] text-white py-2.5 rounded-xl font-bold text-xs shadow-md">
                    مشاهده سفارش در پنل کاربری ←
                  </button>
                </div>
                <div className="bg-slate-50 p-4 text-center text-[10.5px] text-slate-400 border-t border-slate-100">
                  تمامی حقوق محفوظ است © ۱۴۰۳ ارزان اکانت (Arzan Account)
                </div>
              </div>
            )}

            {/* VARIANT 1 (Minimal Card) */}
            {previewVariant === 1 && (
              <div className="w-full max-w-[540px] bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-xs p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <strong className="text-base text-[#005a71]">⚡ ارزان اکانت</strong>
                  <span className="bg-blue-50 text-blue-700 font-mono font-bold px-2 py-0.5 rounded-full">#ARZ-89421</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold">تأییدیه ثبت فاکتور سفارش</h3>
                  <p className="text-slate-500 mt-1">سفارش شما با موفقیت ثبت گردید و در صف صدور قرار گرفت.</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border space-y-2">
                  <div className="flex justify-between">
                    <span>اشتراک ChatGPT Plus (۱ ماهه)</span>
                    <span className="font-mono font-bold text-[#005a71]">980,000 تومان</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold">
                    <span>مجموع:</span>
                    <span className="text-emerald-700 font-mono">980,000 تومان</span>
                  </div>
                </div>
                <button className="w-full bg-[#005a71] text-white py-2.5 rounded-xl font-bold">
                  مشاهده وضعیت سفارش در سایت
                </button>
              </div>
            )}

            {/* VARIANT 3 (Brand Header) */}
            {previewVariant === 3 && (
              <div className="w-full max-w-[560px] bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-xs">
                <div className="bg-[#005a71] text-white p-5 text-center">
                  <h3 className="text-base font-black">⚡ ارزان اکانت (Arzan Account)</h3>
                  <span className="text-[11px] text-teal-200 mt-0.5 block">اطلاعیه مهم سامانه و بروزرسانی اشتراک‌ها</span>
                </div>
                <div className="p-6 space-y-4">
                  <h4 className="font-bold text-sm text-[#004153]">تمدید خودکار اشتراک و تخفیف ویژه وفاداری</h4>
                  <p className="text-slate-600 leading-relaxed">
                    به پاس همراهی شما، کد تخفیف ۳۰ درصدی برای تمدید تمامی پکیج‌های هوش مصنوعی و اشتراک‌های استریمینگ در حساب شما شارژ شد.
                  </p>
                  <button className="bg-[#005a71] text-white px-5 py-2.5 rounded-xl font-bold">
                    مشاهده پیشنهادات شگفت‌انگیز ←
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SENT EMAILS AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeTab === "logs" && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition-all duration-300">
          {/* Filters Bar */}
          <div className="p-4 border-b border-admin-borderLight dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="جستجو در ایمیل گیرنده، موضوع یا قالب..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2 pr-9 pl-3 text-xs outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={logStatus}
                onChange={(e) => setLogStatus(e.target.value)}
                className="bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-xs rounded-xl py-2 px-3 outline-none text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="SENT">ارسال موفق (SENT)</option>
                <option value="FAILED">خطا در ارسال (FAILED)</option>
              </select>

              <button
                onClick={loadLogs}
                className="p-2 rounded-xl border border-admin-borderLight dark:border-slate-700 text-neutral-500 hover:text-brand-primary dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xs"
                title="تازه‌سازی لاگ‌ها"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingLogs ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-admin-container/50 dark:bg-slate-800/80 border-b border-admin-borderLight dark:border-slate-800 font-bold text-admin-text dark:text-slate-200">
                  <th className="py-3 px-4">گیرنده (To)</th>
                  <th className="py-3 px-4">موضوع ایمیل</th>
                  <th className="py-3 px-4">قالب ارسالی</th>
                  <th className="py-3 px-4 text-center">وضعیت تحویل</th>
                  <th className="py-3 px-4">زمان ارسال</th>
                  <th className="py-3 px-4">توضیحات خطا</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-borderLight dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition-colors duration-150 group">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200 dir-ltr text-left group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {log.to}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white max-w-xs truncate">
                      {log.subject}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {log.template}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {log.status === "SENT" ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ارسال موفق
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-full shadow-2xs">
                          <AlertCircle className="w-3 h-3 text-red-600" />
                          خطا
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-neutral-400 font-mono">
                      {toPersianDateTime(log.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-red-600 dark:text-red-400 font-mono max-w-xs truncate">
                      {log.errorMessage || "---"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {logs.length === 0 && !isLoadingLogs && (
            <div className="p-8 text-center text-xs text-neutral-400">
              هیچ لاگ ایمیلی با فیلترهای انتخابی یافت نشد.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
