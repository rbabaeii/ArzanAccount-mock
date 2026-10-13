"use client";

import { formatPrice, formatNumber } from "@/lib/format";
import React, { useState, useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import {
  Coins,
  Save,
  CheckCircle2,
  Calculator,
  ArrowLeftRight,
  RefreshCw,
  Clock,
  Key,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  Activity,
  AlertCircle,
} from "lucide-react";

export default function CurrencySettingsPage() {
  const {
    settings,
    updateSettings,
    syncCurrencyNow,
    updateCurrencySyncConfig,
    refreshFromBackend,
  } = useStore();

  // Auto-refresh currency settings from backend every 10 seconds so live sync time & status auto-updates in real-time
  useEffect(() => {
    refreshFromBackend();
    const interval = setInterval(() => {
      refreshFromBackend();
    }, 10000);
    return () => clearInterval(interval);
  }, [refreshFromBackend]);

  // Manual rate & margin state
  const [usdToRial, setUsdToRial] = useState<number>(settings.usdToRialRate);
  const [margin, setMargin] = useState<number>(settings.defaultMarginPercent);
  const [toast, setToast] = useState(false);

  // BrsApi Sync Config State
  const [apiKey, setApiKey] = useState<string>(
    settings.currencyApiKey || "",
  );
  const [intervalMinutes, setIntervalMinutes] = useState<number>(
    settings.currencySyncIntervalMinutes || 15,
  );
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(
    settings.enableCurrencyAutoSync !== false,
  );

  // Sync actions state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [configToast, setConfigToast] = useState(false);

  // Keep manual inputs synced when store settings update
  useEffect(() => {
    setUsdToRial(settings.usdToRialRate);
    setMargin(settings.defaultMarginPercent);
    if (settings.currencyApiKey) setApiKey(settings.currencyApiKey);
    if (settings.currencySyncIntervalMinutes) {
      setIntervalMinutes(settings.currencySyncIntervalMinutes);
    }
    if (settings.enableCurrencyAutoSync !== undefined) {
      setAutoSyncEnabled(settings.enableCurrencyAutoSync);
    }
  }, [settings]);

  // Save manual rate & margin
  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      usdToRialRate: usdToRial,
      defaultMarginPercent: margin,
    });
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  // Immediate manual query from BrsApi
  const handleTriggerSyncNow = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncCurrencyNow();
      const updatedToman = res?.priceToman || Math.round(res?.usdToRialRate / 10);
      setUsdToRial(res?.usdToRialRate || settings.usdToRialRate);
      setSyncFeedback({
        type: "success",
        message: `استعلام موفق: قیمت جدید هر ۱ دلار برابر با ${formatPrice(updatedToman)} تومان شد و در کل سیستم اعمال گردید.`,
      });
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err: any) {
      setSyncFeedback({
        type: "error",
        message: err?.message || "خطا در برقراری ارتباط با وب‌سرویس BrsApi.",
      });
      setTimeout(() => setSyncFeedback(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Save BrsApi configuration (API key, interval, auto-sync toggle)
  const handleSaveSyncConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateCurrencySyncConfig({
        apiKey,
        intervalMinutes: Number(intervalMinutes),
        enableAutoSync: autoSyncEnabled,
      });
      setConfigToast(true);
      setTimeout(() => setConfigToast(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Convert to Toman for user-friendly display
  const tomanRate = Math.round(usdToRial / 10);
  const formattedTomanRate = formatPrice(tomanRate);

  // Live BrsApi metrics
  const livePriceToman =
    settings.lastCurrencyPriceToman || Math.round(settings.usdToRialRate / 10);
  const changePercent = settings.lastCurrencyChangePercent ?? 0;
  const isPositiveChange = changePercent >= 0;

  // Sample calculations for live preview
  const sampleUsdValues = [5.0, 10.0, 20.0];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-admin-text dark:text-white flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-500" />
            <span>مدیریت هوشمند نرخ ارز و وب‌سرویس دلار</span>
          </h1>
          <p className="text-xs text-admin-textMuted dark:text-slate-400 mt-1 leading-relaxed">
            استعلام خودکار و لحظه‌ای قیمت دلار از وب‌سرویس BrsApi، تنظیم دوره‌های به‌روزرسانی و محاسبه آنی قیمت محصولات
          </p>
        </div>

        <button
          type="button"
          onClick={handleTriggerSyncNow}
          disabled={isSyncing}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "در حال استعلام نرخ..." : "استعلام آنی نرخ دلار"}</span>
        </button>
      </div>

      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 border animate-fadeIn shadow-xs ${
            syncFeedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800"
          }`}
        >
          {syncFeedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{syncFeedback.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: LIVE BRSAPI INTEGRATION & AUTOMATION DASHBOARD CARD             */}
      {/* ========================================================================= */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-card hover:shadow-xl hover:border-teal-400/40 dark:hover:border-teal-400/30 transition-all duration-300 space-y-6">
        {/* Card Header & Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-admin-borderLight dark:border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800/60 shadow-2xs shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-admin-text dark:text-white">
                وضعیت اتصال به وب‌سرویس لحظه‌ای دلار (BrsApi)
              </h2>
              <span className="text-[11px] text-neutral-400 font-mono dir-ltr block mt-0.5">
                https://Api.BrsApi.ir/Market/Gold_Currency.php
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                autoSyncEnabled
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : "bg-neutral-100 dark:bg-slate-800 text-neutral-500 border-neutral-300 dark:border-slate-700"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  autoSyncEnabled ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"
                }`}
              />
              <span>
                {autoSyncEnabled
                  ? `استعلام خودکار فعال (هر ${intervalMinutes} دقیقه)`
                  : "استعلام خودکار غیرفعال"}
              </span>
            </span>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="group relative overflow-hidden p-4 bg-admin-bg dark:bg-slate-800/70 rounded-xl border border-admin-borderLight dark:border-slate-700 hover:border-teal-400/40 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-slate-400 block">
              آخرین نرخ اعلامی دلار (تومان)
            </span>
            <div className="text-xl font-black text-admin-text dark:text-white mt-1.5 flex items-baseline gap-1">
              <span>{formatPrice(livePriceToman)}</span>
              <span className="text-xs font-normal text-neutral-400">تومان</span>
            </div>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium block mt-1">
              دریافتی مستقیم از وب‌سرویس
            </span>
          </div>

          <div className="group relative overflow-hidden p-4 bg-admin-bg dark:bg-slate-800/70 rounded-xl border border-admin-borderLight dark:border-slate-700 hover:border-teal-400/40 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-slate-400 block">
              نرخ پایه اعمالی سیستم (ریال)
            </span>
            <div className="text-xl font-black font-mono text-teal-600 dark:text-teal-300 mt-1.5 flex items-baseline gap-1">
              <span>{formatPrice(settings.usdToRialRate)}</span>
              <span className="text-xs font-normal text-neutral-400 font-sans">ریال</span>
            </div>
            <span className="text-[10px] text-neutral-400 block mt-1">
              فرمول: قیمت تومان × ۱۰
            </span>
          </div>

          <div className="group relative overflow-hidden p-4 bg-admin-bg dark:bg-slate-800/70 rounded-xl border border-admin-borderLight dark:border-slate-700 hover:border-teal-400/40 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-slate-400 block">
              نوسان ۲۴ ساعته دلار
            </span>
            <div
              className={`text-xl font-black mt-1.5 flex items-center gap-1.5 ${
                isPositiveChange
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isPositiveChange ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              <span className="font-mono">
                {isPositiveChange ? "+" : ""}
                {changePercent}%
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 block mt-1">
              تغییر ارزش بر اساس مرجع صرافی
            </span>
          </div>

          <div className="group relative overflow-hidden p-4 bg-admin-bg dark:bg-slate-800/70 rounded-xl border border-admin-borderLight dark:border-slate-700 hover:border-teal-400/40 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-500 dark:text-slate-400 block">
                زمان آخرین استعلام موفق
              </span>
              <span className="flex items-center gap-1 text-[9px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded-md shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>همگام زنده</span>
              </span>
            </div>
            <div className="text-sm font-bold text-neutral-800 dark:text-slate-200 mt-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="line-clamp-1">{settings.lastCurrencySyncTime || "هم‌اکنون"}</span>
            </div>
            <span className="text-[10px] text-neutral-400 block mt-1.5">
              به‌روزرسانی خودکار هر ۱۰ ثانیه در این صفحه
            </span>
          </div>
        </div>

        {/* Sync Settings Form (API Key & Interval) */}
        <form onSubmit={handleSaveSyncConfig} className="pt-3 border-t border-admin-borderLight dark:border-slate-800 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* API Key Input */}
            <div className="md:col-span-6">
              <label className="block font-bold text-neutral-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>کلید اختصاصی وب‌سرویس BrsApi (API Key):</span>
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="کلید API سرویس استعلام ارز"
                className="w-full bg-admin-bg dark:bg-slate-800/90 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-3 text-xs font-mono outline-none dir-ltr text-left transition-all duration-200"
                required
              />
            </div>

            {/* Interval Input */}
            <div className="md:col-span-3">
              <label className="block font-bold text-neutral-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>دوره استعلام خودکار (دقیقه):</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-admin-bg dark:bg-slate-800/90 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2.5 px-3 text-xs font-mono font-bold outline-none transition-all duration-200"
                  required
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[11px]">
                  دقیقه
                </span>
              </div>
            </div>

            {/* Save Button */}
            <div className="md:col-span-3 flex items-center gap-2">
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold py-2.5 px-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-md flex items-center justify-center gap-2 text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>ذخیره تنظیمات وب‌سرویس</span>
              </button>
            </div>
          </div>

          {/* Toggle Auto Sync Checkbox */}
          <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-teal-600 cursor-pointer"
              />
              <span className="font-semibold text-neutral-700 dark:text-slate-200 text-xs">
                فعال‌سازی بررسی دوره‌ای و خودکار در پس‌زمینه سرور (پیش‌فرض هر {intervalMinutes} دقیقه)
              </span>
            </label>

            {configToast && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn shadow-2xs">
                <CheckCircle2 className="w-4 h-4" />
                تنظیمات کلید و زمان‌بندی وب‌سرویس با موفقیت ذخیره شد.
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: MANUAL OVERRIDE, MARGIN & LIVE PRICE CALCULATOR                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Manual Rate & Margin Form (7 cols) */}
        <div className="lg:col-span-7 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-6 shadow-card hover:shadow-lg transition-all duration-300 space-y-5">
          <h3 className="font-bold text-sm text-admin-text dark:text-white pb-3 border-b border-admin-borderLight dark:border-slate-800 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs">
              <Zap className="w-4 h-4" />
            </div>
            <span>تنظیمات دستی نرخ پایه ریالی و حاشیه سود سراسری</span>
          </h3>

          <form onSubmit={handleSaveManual} className="space-y-5 text-xs">
            {/* USD to Rial input */}
            <div>
              <label className="block font-bold text-neutral-800 dark:text-slate-100 mb-1.5">
                نرخ پایه هر ۱ دلار (ریال):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1000"
                  min="10000"
                  value={usdToRial}
                  onChange={(e) => setUsdToRial(Number(e.target.value))}
                  className="w-full bg-admin-bg dark:bg-slate-800/90 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-3 px-4 text-sm font-mono font-bold outline-none transition-all duration-200"
                  required
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
                  ریال
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 p-2.5 rounded-xl border border-teal-200 dark:border-teal-800/60 shadow-2xs">
                <ArrowLeftRight className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />
                <span>
                  معادل تومانی در سایت: <strong>{formattedTomanRate} تومان</strong> برای هر ۱ دلار
                </span>
              </div>
            </div>

            {/* Default Margin input */}
            <div>
              <label className="block font-bold text-neutral-800 dark:text-slate-100 mb-1.5 flex items-center justify-between">
                <span>حاشیه سود عمومی فروشگاه (Markup %):</span>
                <span className="text-teal-600 dark:text-teal-400 font-mono font-bold">%{margin}</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full bg-admin-bg dark:bg-slate-800/90 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-3 px-4 text-sm font-mono font-bold outline-none transition-all duration-200"
                  required
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
                  درصد (%)
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 mt-1 block">
                این حاشیه سود به تمامی قیمت‌های خرید دلاری افزوده شده و قیمت نهایی تومانی فروشگاه را تشکیل می‌دهد.
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره دستی و اعمال آنی روی قیمت محصولات</span>
            </button>

            {toast && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 border border-emerald-200 dark:border-emerald-800/60 animate-fadeIn shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>نرخ پایه و درصد سود با موفقیت ذخیره شدند و کاتالوگ فروشگاه به روز شد!</span>
              </div>
            )}
          </form>
        </div>

        {/* Live Interactive Preview Box (5 cols) */}
        <div className="lg:col-span-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-6 shadow-card hover:shadow-lg transition-all duration-300 space-y-4 sticky top-24">
          <div className="flex items-center gap-2 pb-3 border-b border-admin-borderLight dark:border-slate-800">
            <Calculator className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="font-bold text-sm text-admin-text dark:text-white">
              ماشین‌حساب پیش‌نمایش قیمت‌های زنده
            </h3>
          </div>

          <p className="text-xs text-neutral-500 dark:text-slate-400 leading-relaxed">
            محاسبه نمونه مبالغ با نرخ فعلی (<strong>{formattedTomanRate} تومان</strong>) و حاشیه سود <strong>{margin}%</strong>:
          </p>

          <div className="space-y-3 pt-2">
            {sampleUsdValues.map((val) => {
              const baseToman = (val * usdToRial) / 10;
              const finalToman = Math.round(baseToman * (1 + margin / 100));
              const formatted = formatPrice(finalToman);

              return (
                <div
                  key={val}
                  className="bg-admin-bg dark:bg-slate-800/80 hover:bg-teal-50/50 dark:hover:bg-slate-800 p-3.5 rounded-xl border border-admin-borderLight dark:border-slate-700 flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xs group"
                >
                  <div>
                    <span className="font-mono font-bold text-xs text-neutral-700 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      محصول ${val.toFixed(2)} دلاری
                    </span>
                    <span className="text-[10px] text-neutral-400 block mt-0.5 font-mono">
                      خرید خام: {formatPrice(Math.round(baseToman))} تومان
                    </span>
                  </div>

                  <div className="text-left">
                    <span className="font-black text-sm text-teal-600 dark:text-teal-400 font-mono">
                      {formatted}
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-slate-400 mr-1">تومان</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-neutral-50 dark:bg-slate-800/80 rounded-xl text-[11px] text-neutral-500 dark:text-slate-400 border border-neutral-200 dark:border-slate-700">
            💡 <strong>اتصال خودکار:</strong> هر زمان که وب‌سرویس BrsApi نرخ دلار را استعلام کند، قیمت تمامی اقلام ویترین فروشگاه بدون نیاز به تغییر دستی به‌روز خواهند شد.
          </div>
        </div>
      </div>
    </div>
  );
}
