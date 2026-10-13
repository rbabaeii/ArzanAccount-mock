"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toPersianDateTime } from "@/lib/date";
import { formatNumber } from "@/lib/format";
import {
  Smartphone,
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
  HelpCircle,
  Clock,
  Search,
  Hash,
  Layers,
  ArrowUpDown,
  Filter,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function AdminSmsSettingsPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"config" | "test" | "logs">("config");

  // SMS Configuration state
  const [baseUrl, setBaseUrl] = useState("https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber");
  const [apiKey, setApiKey] = useState("5bf81d90-6683-45ee-ad78-afc1e55ac7d0");
  const [username, setUsername] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);

  // Pattern IDs
  const [patternOtp, setPatternOtp] = useState<number | string>("");
  const [patternOrderCreated, setPatternOrderCreated] = useState<number | string>("");
  const [patternOrderCompleted, setPatternOrderCompleted] = useState<number | string>("");
  const [patternOrderRefunded, setPatternOrderRefunded] = useState<number | string>("");
  const [patternWithdrawalApproved, setPatternWithdrawalApproved] = useState<number | string>("");
  const [patternWalletTopup, setPatternWalletTopup] = useState<number | string>("");

  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Test SMS State
  const [testRecipient, setTestRecipient] = useState("");
  const [testBodyId, setTestBodyId] = useState<number | string>("");
  const [testArgs, setTestArgs] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; recId?: string } | null>(null);

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
  const [totalLogs, setTotalLogs] = useState(0);
  const [logStatus, setLogStatus] = useState("all");
  const [logTemplate, setLogTemplate] = useState("all");
  const [logSearch, setLogSearch] = useState("");
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 15;

  // Load Settings & Stats
  const loadData = useCallback(async () => {
    try {
      const [settingsRes, statsRes] = await Promise.all([
        api.getSmsSettings().catch(() => null),
        api.getSmsStats().catch(() => null),
      ]);

      if (settingsRes) {
        if (settingsRes.baseUrl) setBaseUrl(settingsRes.baseUrl);
        if (settingsRes.apiKey) setApiKey(settingsRes.apiKey);
        if (settingsRes.username !== undefined) setUsername(settingsRes.username);
        if (settingsRes.isEnabled !== undefined) setIsEnabled(Boolean(settingsRes.isEnabled));
        if (settingsRes.patternOtp) setPatternOtp(settingsRes.patternOtp);
        if (settingsRes.patternOrderCreated) setPatternOrderCreated(settingsRes.patternOrderCreated);
        if (settingsRes.patternOrderCompleted) setPatternOrderCompleted(settingsRes.patternOrderCompleted);
        if (settingsRes.patternOrderRefunded) setPatternOrderRefunded(settingsRes.patternOrderRefunded);
        if (settingsRes.patternWithdrawalApproved) setPatternWithdrawalApproved(settingsRes.patternWithdrawalApproved);
        if (settingsRes.patternWalletTopup) setPatternWalletTopup(settingsRes.patternWalletTopup);
      }

      if (statsRes) {
        setStats({
          total: statsRes.total || 0,
          sent: statsRes.sent || 0,
          failed: statsRes.failed || 0,
          todayCount: statsRes.todayCount || 0,
          deliveryRate: statsRes.deliveryRate !== undefined ? statsRes.deliveryRate : 100,
          lastSentAt: statsRes.lastSentAt || null,
          lastStatus: statsRes.lastStatus || "IDLE",
        });
      }
    } catch (err) {
      console.error("Failed to load SMS data", err);
    }
  }, []);

  // Fetch paginated SMS logs
  const fetchLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const res = await api.getSmsLogs({
        status: logStatus !== "all" ? logStatus : undefined,
        template: logTemplate !== "all" ? logTemplate : undefined,
        search: logSearch.trim() || undefined,
        limit: pageSize,
        offset: page * pageSize,
      });
      if (res) {
        setLogs(res.items || []);
        setTotalLogs(res.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch SMS logs", err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [logStatus, logTemplate, logSearch, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
    }
  }, [activeTab, fetchLogs]);

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToast(null);

    try {
      await api.updateSmsSettings(
        {
          baseUrl,
          apiKey,
          username,
          isEnabled,
          patternOtp: Number(patternOtp) || 0,
          patternOrderCreated: Number(patternOrderCreated) || 0,
          patternOrderCompleted: Number(patternOrderCompleted) || 0,
          patternOrderRefunded: Number(patternOrderRefunded) || 0,
          patternWithdrawalApproved: Number(patternWithdrawalApproved) || 0,
          patternWalletTopup: Number(patternWalletTopup) || 0,
        },
        user?.name || "مدیر سیستم",
      );

      setToast({ type: "success", message: "تنظیمات وب‌سرویس پیامک با موفقیت ذخیره شد." });
      await loadData();
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.message || "خطا در ذخیره‌سازی تنظیمات پیامک.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Send Test SMS
  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient || !testBodyId) {
      setTestResult({ success: false, message: "شماره موبایل و کد الگو الزامی است." });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const parsedArgs = testArgs
        ? testArgs.split(";").map((s) => s.trim())
        : ["تست", "12345"];

      const res = await api.sendTestSms({
        to: testRecipient,
        bodyId: Number(testBodyId),
        args: parsedArgs,
      });

      if (res && res.success) {
        setTestResult({
          success: true,
          message: `پیامک تستی با موفقیت ارسال شد. شناسه پیگیری: ${res.recId || "نامشخص"}`,
          recId: res.recId,
        });
      } else {
        setTestResult({
          success: false,
          message: res?.errorMessage || "ارسال پیامک با خطا مواجه شد.",
        });
      }
      loadData();
      if (activeTab === "logs") fetchLogs();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "خطای ارتباط با سرور پیامک.",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>مدیریت وب‌سرویس پیامک (SMS Gateway)</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-medium">
                  خط خدماتی اشتراکی
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                پیکربندی وب‌سرویس Payamak-Panel، مدیریت کدهای الگو، ارسال پیامک آزمایشی و مشاهده لاگ‌های تحویل
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            loadData();
            if (activeTab === "logs") fetchLogs();
          }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>بروزرسانی وضعیت</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">کل پیامک‌های ارسالی</div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
            {formatNumber(stats.total)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">تمام رویدادهای ثبت‌شده</div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تحویل موفق (Sent)</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatNumber(stats.sent)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">کد تایید سامانه دریافت شد</div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>خطا در ارسال (Failed)</span>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatNumber(stats.failed)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">بررسی علت در جدول لاگ‌ها</div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>ارسال‌های امروز</span>
          </div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">
            {formatNumber(stats.todayCount)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">از ساعت ۰۰:۰۰ بامداد</div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm col-span-2 lg:col-span-1">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">نرخ موفقیت تحویل</div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">
            {stats.deliveryRate}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.deliveryRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === "config"
              ? "border-teal-600 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Server className="w-4 h-4" />
          <span>تنظیمات وب‌سرویس و الگوها</span>
        </button>

        <button
          onClick={() => setActiveTab("test")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === "test"
              ? "border-teal-600 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Send className="w-4 h-4" />
          <span>ارسال تست پیامک</span>
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === "logs"
              ? "border-teal-600 text-teal-600 dark:text-teal-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>تاریخچه پیام‌های ارسالی ({totalLogs})</span>
        </button>
      </div>

      {/* Toast Message */}
      {toast && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-xs opacity-70 hover:opacity-100">
            بستن
          </button>
        </div>
      )}

      {/* TAB 1: Configuration & Patterns */}
      {activeTab === "config" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Gateway Credentials (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>مشخصات اتصال به وب‌سرویس REST</span>
                </h3>

                {/* Enable toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {isEnabled ? "سرویس پیامک فعال است" : "سرویس پیامک غیرفعال است"}
                  </span>
                  <div
                    onClick={() => setIsEnabled(!isEnabled)}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                      isEnabled ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out ${
                        isEnabled ? "translate-x-0" : "-translate-x-5"
                      }`}
                    />
                  </div>
                </label>
              </div>

              {/* Base URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>آدرس اندپوینت وب‌سرویس ارسال اشتراکی (Base URL):</span>
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500 transition-colors"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  پیش‌فرض رسمی: https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber
                </p>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>کلید اختصاصی وب‌سرویس (API Key):</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    dir="ltr"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500 transition-colors pl-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  طبق مستندات وب‌سرویس، کلید API به جای رمز عبور اعتبارسنجی می‌شود.
                </p>
              </div>

              {/* Username (optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  نام کاربری در سامانه پیامک (اختیاری):
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="در صورت الزام پنل وارد شود"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              {/* Information Notice */}
              <div className="p-4 rounded-xl bg-teal-50/80 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/40 text-xs text-teal-800 dark:text-teal-200 leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" />
                <div>
                  <span className="font-bold">نکته بسیار مهم خط خدماتی اشتراکی:</span> در این روش، پیامک‌ها حتی به شماره‌هایی که دریافت پیامک تبلیغاتی را مسدود کرده‌اند (بلک‌لیست) با سرعت بالا تحویل داده می‌شوند. برای استفاده باید متون پیش‌فرض (الگو) را در پنل پیامک ثبت و کد آن (bodyId) را در فیلدهای روبرو وارد نمایید.
                </div>
              </div>
            </div>

            {/* Pattern IDs Configuration (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Hash className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>کدهای الگوی پیامک (BodyId)</span>
              </h3>

              {/* OTP Pattern */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  کد الگوی تایید یکبارمصرف (OTP):
                </label>
                <input
                  type="number"
                  dir="ltr"
                  placeholder="مثلاً: 123456"
                  value={patternOtp}
                  onChange={(e) => setPatternOtp(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">متغیر ارسالی: کد ۵ رقمی</p>
              </div>

              {/* Order Created */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  کد الگوی ثبت سفارش جدید:
                </label>
                <input
                  type="number"
                  dir="ltr"
                  placeholder="مثلاً: 123457"
                  value={patternOrderCreated}
                  onChange={(e) => setPatternOrderCreated(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">متغیرها: نام مشتری، شماره سفارش، مبلغ تومان</p>
              </div>

              {/* Order Completed */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  کد الگوی تکمیل و تحویل سفارش:
                </label>
                <input
                  type="number"
                  dir="ltr"
                  placeholder="مثلاً: 123458"
                  value={patternOrderCompleted}
                  onChange={(e) => setPatternOrderCompleted(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">متغیرها: شماره سفارش، مشخصات اکانت یا لینک</p>
              </div>

              {/* Order Refunded */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  کد الگوی تسویه عودت وجه:
                </label>
                <input
                  type="number"
                  dir="ltr"
                  placeholder="مثلاً: 123459"
                  value={patternOrderRefunded}
                  onChange={(e) => setPatternOrderRefunded(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">متغیرها: شماره سفارش، مبلغ عودتی، کد رهگیری</p>
              </div>

              {/* Withdrawal Approved */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  کد الگوی تایید تسویه حساب بانکی:
                </label>
                <input
                  type="number"
                  dir="ltr"
                  placeholder="مثلاً: 123460"
                  value={patternWithdrawalApproved}
                  onChange={(e) => setPatternWithdrawalApproved(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">متغیرها: مبلغ تسویه، کد پیگیری پایا/ساتنا</p>
              </div>

              {/* Wallet Top-up */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  کد الگوی شارژ موفق کیف پول:
                </label>
                <input
                  type="number"
                  dir="ltr"
                  placeholder="مثلاً: 123461"
                  value={patternWalletTopup}
                  onChange={(e) => setPatternWalletTopup(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">متغیرها: مبلغ شارژ شده</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>ذخیره کلیه تنظیمات وب‌سرویس پیامک</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Live Test SMS */}
      {activeTab === "test" && (
        <div className="max-w-2xl bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Send className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>ارسال پیامک آزمایشی و تست صحت الگو</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              جهت اطمینان از اعتبار API Key و تایید شدن الگو در سامانه پیامک، یک پیامک آزمایشی ارسال نمایید.
            </p>
          </div>

          <form onSubmit={handleSendTest} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                شماره موبایل گیرنده (فرمت ایران):
              </label>
              <input
                type="text"
                dir="ltr"
                placeholder="مثلاً: 09123456789"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                کد متن پیش‌فرض تاییدشده (BodyId):
              </label>
              <input
                type="number"
                dir="ltr"
                placeholder="کد الگو در پنل پیامک"
                value={testBodyId}
                onChange={(e) => setTestBodyId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                متغیرهای الگو (جداشده با نقطه ویرگول ;):
              </label>
              <input
                type="text"
                placeholder="مثال برای الگوی ۲ متغیره: ارزان اکانت;12345"
                value={testArgs}
                onChange={(e) => setTestArgs(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                دقیقاً مطابق ترتیب متغیرهای تعریف شده در متن پیش‌فرض پنل پیامک وارد شود.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSendingTest}
              className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>ارسال آنی پیامک تستی</span>
            </button>
          </form>

          {testResult && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold flex items-start gap-2.5 ${
                testResult.success
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{testResult.message}</p>
                {testResult.recId && (
                  <p className="text-[11px] font-mono mt-1 opacity-80">
                    کد رکورد اختصاصی پیامک: {testResult.recId}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SMS History & Logs */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="جستجو در شماره، متن یا پیگیری..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-teal-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={logStatus}
                onChange={(e) => {
                  setLogStatus(e.target.value);
                  setPage(0);
                }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="sent">تحویل موفق (SENT)</option>
                <option value="failed">ناموفق (FAILED)</option>
              </select>

              {/* Template Filter */}
              <select
                value={logTemplate}
                onChange={(e) => {
                  setLogTemplate(e.target.value);
                  setPage(0);
                }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="all">همه قالب‌ها</option>
                <option value="otp">کد تایید (OTP)</option>
                <option value="order_created">ثبت سفارش</option>
                <option value="order_completed">تحویل سفارش</option>
                <option value="order_refunded">عودت وجه</option>
                <option value="withdrawal_approved">تسویه حساب</option>
                <option value="wallet_topup">شارژ کیف پول</option>
                <option value="test">آزمایشی (Test)</option>
              </select>
            </div>

            <button
              onClick={fetchLogs}
              disabled={isLoadingLogs}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? "animate-spin" : ""}`} />
              <span>بازخوانی</span>
            </button>
          </div>

          {/* Logs Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[700px] w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                    <th className="py-3 px-4 font-bold">شماره گیرنده</th>
                    <th className="py-3 px-4 font-bold">رویداد / قالب</th>
                    <th className="py-3 px-4 font-bold">کد الگو</th>
                    <th className="py-3 px-4 font-bold">وضعیت</th>
                    <th className="py-3 px-4 font-bold">شناسه پیگیری (recId)</th>
                    <th className="py-3 px-4 font-bold">متغیرهای ارسالی</th>
                    <th className="py-3 px-4 font-bold">تاریخ و ساعت</th>
                    <th className="py-3 px-4 font-bold">پیام سامانه / خطا</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                  {isLoadingLogs ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                          <span>در حال دریافت لاگ‌های پیامک از پایگاه داده...</span>
                        </div>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        پیامکی با مشخصات جستجو شده یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-100 dir-ltr text-right">
                          {log.to}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px]">
                            {log.template || "سفارشی"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {log.bodyId || "—"}
                        </td>
                        <td className="py-3 px-4">
                          {log.status === "SENT" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>موفق</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                              <AlertCircle className="w-3 h-3" />
                              <span>ناموفق</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300 dir-ltr text-right">
                          {log.recId || "—"}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-[11px] text-slate-600 dark:text-slate-400">
                          {log.text}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                          {toPersianDateTime(log.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-[11px]">
                          {log.errorMessage ? (
                            <span className="text-rose-600 dark:text-rose-400 font-medium">
                              {log.errorMessage}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              تایید تحویل به اپراتور
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalLogs > pageSize && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500">
                  نمایش {page * pageSize + 1} تا {Math.min((page + 1) * pageSize, totalLogs)} از {totalLogs} پیامک
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
                  >
                    صفحه قبل
                  </button>
                  <button
                    disabled={(page + 1) * pageSize >= totalLogs}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
                  >
                    صفحه بعد
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
