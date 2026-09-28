"use client";

import { formatPrice, formatNumber } from "@/lib/format";
import React, { useState, useEffect, useRef } from "react";
import { useStore } from "@/context/StoreContext";
import { api } from "@/lib/api";
import {
  Settings,
  Coins,
  Key,
  Globe,
  Save,
  CheckCircle2,
  Calculator,
  ArrowLeftRight,
  ShieldCheck,
  Headphones,
  Upload,
  Image as ImageIcon,
  Trash2,
  Sun,
  Moon,
  Sparkles,
  AlertCircle,
  Phone,
  Mail,
  Send,
  Loader2,
  Layers,
  ExternalLink,
  Eye,
} from "lucide-react";
import { z } from "zod";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function AdminGeneralSettingsPage() {
  const { settings, updateSettings } = useStore();

  // Active Tab: "visual" | "financial" | "quotas" | "irmarket"
  const [activeTab, setActiveTab] = useState<"visual" | "financial" | "quotas" | "irmarket">("visual");

  // Financial & Quota Settings
  const [usdRate, setUsdRate] = useState<number>(settings.usdToRialRate || 720000);
  const [margin, setMargin] = useState<number>(settings.defaultMarginPercent !== undefined ? settings.defaultMarginPercent : 15);
  const [apiKey, setApiKey] = useState<string>(settings.irMarketApiKey || "");
  const [autoSync, setAutoSync] = useState<boolean>(settings.enableAutomaticSync ?? true);
  const [maxRatioDenominator, setMaxRatioDenominator] = useState<number>(
    settings.maxPurchaseRatioDenominator || 3
  );
  const [ratioThreshold, setRatioThreshold] = useState<number>(
    settings.purchaseRatioExemptionThreshold !== undefined
      ? settings.purchaseRatioExemptionThreshold
      : 10
  );
  const [cashbackPercent, setCashbackPercent] = useState<number>(
    settings.orderCashbackPercent !== undefined ? settings.orderCashbackPercent : 10
  );

  // Visual Branding & Identity
  const [siteLogo, setSiteLogo] = useState<string>(settings.siteLogo || "");
  const [siteLogoDark, setSiteLogoDark] = useState<string>(settings.siteLogoDark || "");
  const [siteFavicon, setSiteFavicon] = useState<string>(settings.siteFavicon || "");
  const [siteName, setSiteName] = useState<string>(settings.siteName || "ارزان اکانت (arzanAccount)");
  const [siteTagline, setSiteTagline] = useState<string>(
    settings.siteTagline || "مرجع تخصصی خرید انواع اکانت و اشتراک‌های بین‌المللی با تحویل فوری"
  );
  const [siteDescription, setSiteDescription] = useState<string>(
    settings.siteDescription || "خرید اشتراک پریمیوم اسپاتیفای، چت جی پی تی، نتفلیکس، اپل موزیک و سرویس‌های هوش مصنوعی با کمترین قیمت و ضمانت رسمی."
  );
  const [sitePhone, setSitePhone] = useState<string>(settings.sitePhone || "۰۲۱-۸۸۸۸۴۳۲۱");
  const [siteEmail, setSiteEmail] = useState<string>(settings.siteEmail || "support@arzanaccount.com");
  const [supportTelegram, setSupportTelegram] = useState<string>(settings.supportTelegram || "@arzan_support");
  const [siteInstagram, setSiteInstagram] = useState<string>(settings.siteInstagram || "arzanaccount_official");
  const [siteEnamad, setSiteEnamad] = useState<string>(settings.siteEnamad || "");

  // Upload States
  const [uploadingTarget, setUploadingTarget] = useState<"logo" | "logoDark" | "favicon" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRefLogo = useRef<HTMLInputElement>(null);
  const fileInputRefLogoDark = useRef<HTMLInputElement>(null);
  const fileInputRefFavicon = useRef<HTMLInputElement>(null);

  // Sync inputs whenever settings load or update
  useEffect(() => {
    if (settings.usdToRialRate) setUsdRate(settings.usdToRialRate);
    if (settings.defaultMarginPercent !== undefined) setMargin(settings.defaultMarginPercent);
    if (settings.irMarketApiKey) setApiKey(settings.irMarketApiKey);
    if (settings.enableAutomaticSync !== undefined) setAutoSync(settings.enableAutomaticSync);
    if (settings.maxPurchaseRatioDenominator) setMaxRatioDenominator(settings.maxPurchaseRatioDenominator);
    if (settings.purchaseRatioExemptionThreshold !== undefined) setRatioThreshold(settings.purchaseRatioExemptionThreshold);
    if (settings.orderCashbackPercent !== undefined) setCashbackPercent(settings.orderCashbackPercent);

    if (settings.siteLogo !== undefined) setSiteLogo(settings.siteLogo || "");
    if (settings.siteLogoDark !== undefined) setSiteLogoDark(settings.siteLogoDark || "");
    if (settings.siteFavicon !== undefined) setSiteFavicon(settings.siteFavicon || "");
    if (settings.siteName) setSiteName(settings.siteName);
    if (settings.siteTagline !== undefined) setSiteTagline(settings.siteTagline || "");
    if (settings.siteDescription !== undefined) setSiteDescription(settings.siteDescription || "");
    if (settings.sitePhone !== undefined) setSitePhone(settings.sitePhone || "");
    if (settings.siteEmail !== undefined) setSiteEmail(settings.siteEmail || "");
    if (settings.supportTelegram) setSupportTelegram(settings.supportTelegram);
    if (settings.siteInstagram !== undefined) setSiteInstagram(settings.siteInstagram || "");
    if (settings.siteEnamad !== undefined) setSiteEnamad(settings.siteEnamad || "");
  }, [settings]);

  // Handle image upload to backend
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "logo" | "logoDark" | "favicon") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("تنها فایل‌های تصویری مجاز هستند.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("حجم فایل نباید بیشتر از ۵ مگابایت باشد.");
      return;
    }

    setUploadingTarget(target);
    setUploadError(null);

    try {
      const res = await api.uploadFile(file, "branding");
      if (res && res.url) {
        if (target === "logo") setSiteLogo(res.url);
        if (target === "logoDark") setSiteLogoDark(res.url);
        if (target === "favicon") setSiteFavicon(res.url);
      }
    } catch (err: any) {
      setUploadError(err?.message || "خطا در آپلود تصویر برندینگ.");
    } finally {
      setUploadingTarget(null);
      if (e.target) e.target.value = "";
    }
  };

  const settingsSchema = z.object({
    usdRate: z.number().min(10000, "نرخ دلار نمی‌تواند کمتر از ۱۰,۰۰۰ ریال باشد"),
    margin: z.number().min(0, "حاشیه سود نمی‌تواند منفی باشد").max(1000, "حاشیه سود نامعتبر است"),
    maxRatioDenominator: z.number().min(1, "مخرج کسر باید بزرگتر از صفر باشد"),
    ratioThreshold: z.number().min(0, "آستانه استثنا نمی‌تواند منفی باشد"),
    cashbackPercent: z.number().min(0).max(100, "درصد کش‌بک باید بین ۰ تا ۱۰۰ باشد"),
    siteName: z.string().min(2, "نام تجاری باید حداقل ۲ کاراکتر باشد"),
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const val = settingsSchema.safeParse({
      usdRate, margin, maxRatioDenominator, ratioThreshold, cashbackPercent, siteName
    });

    if (!val.success) {
      setUploadError(val.error.issues[0].message);
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings({
        usdToRialRate: usdRate,
        defaultMarginPercent: margin,
        irMarketApiKey: apiKey,
        enableAutomaticSync: autoSync,
        maxPurchaseRatioDenominator: maxRatioDenominator,
        purchaseRatioExemptionThreshold: ratioThreshold,
        orderCashbackPercent: cashbackPercent,
        siteLogo,
        siteLogoDark,
        siteFavicon,
        siteName,
        siteTagline,
        siteDescription,
        sitePhone,
        siteEmail,
        supportTelegram,
        siteInstagram,
        siteEnamad,
      });
      setToast(true);
      setTimeout(() => setToast(false), 3500);
    } catch (err: any) {
      setUploadError(err?.message || "خطا در ذخیره تنظیمات.");
    } finally {
      setIsSaving(false);
    }
  };

  const tomanRate = Math.round(usdRate / 10);
  const formattedTomanRate = formatPrice(tomanRate);
  const sampleUsd = [5.0, 10.0, 20.0];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-brand-primary dark:text-teal-300 shadow-2xs">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-admin-text dark:text-white">
                پیکربندی هویت بصری و تنظیمات جامع فروشگاه
              </h1>
              <p className="text-xs text-admin-textMuted dark:text-slate-400 mt-0.5">
                مدیریت نشان تجاری (لوگو)، فاوآیکون، تم‌های تاریک و روشن، نرخ برابری ارز و سهمیه انبار
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800 px-4 py-2.5 rounded-2xl text-xs shadow-card">
          <span className="text-neutral-400">وضعیت هماهنگی:</span>
          <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>پیکربندی هماهنگ و متصل</span>
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-admin-borderLight dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("visual")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
            activeTab === "visual"
              ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
              : "bg-white/80 dark:bg-slate-900/80 text-admin-textMuted dark:text-slate-400 hover:text-admin-text dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>هویت بصری، لوگو و برندینگ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("financial")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
            activeTab === "financial"
              ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
              : "bg-white/80 dark:bg-slate-900/80 text-admin-textMuted dark:text-slate-400 hover:text-admin-text dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>نرخ ارز، مارک‌آپ و کش‌بک</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("quotas")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
            activeTab === "quotas"
              ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
              : "bg-white/80 dark:bg-slate-900/80 text-admin-textMuted dark:text-slate-400 hover:text-admin-text dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>سهمیه موجودی و سقف سفارش</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("irmarket")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
            activeTab === "irmarket"
              ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
              : "bg-white/80 dark:bg-slate-900/80 text-admin-textMuted dark:text-slate-400 hover:text-admin-text dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>وب‌سرویس irMarket</span>
        </button>
      </div>

      {uploadError && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold px-2 py-0.5"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Settings Body (7 cols) */}
          <div className="lg:col-span-7 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
            
            {/* TAB 1: Visual Branding & Logo Upload */}
            {activeTab === "visual" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-admin-borderLight dark:border-slate-800">
                  <h3 className="font-bold text-sm text-admin-text dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>آپلود لوگو و نمادهای بصری برند</span>
                  </h3>
                  <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                    فرمت‌های مجاز: PNG, SVG, WEBP, JPEG (حداکثر ۵ مگابایت)
                  </span>
                </div>

                {/* 3 Upload Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* 1. Main Logo (Light) */}
                  <div className="border border-admin-borderLight dark:border-slate-800 rounded-2xl p-4 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                          <span>لوگوی اصلی (حالت روز)</span>
                        </span>
                        {siteLogo && (
                          <button
                            type="button"
                            onClick={() => setSiteLogo("")}
                            className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                            title="حذف لوگو"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Preview Box */}
                      <div className="h-28 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center p-2 relative overflow-hidden group">
                        {siteLogo ? (
                          <img
                            src={siteLogo}
                            alt="Logo Light"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-slate-400 flex flex-col items-center">
                            <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                            <span className="text-[10px]">لوگو تنظیم نشده</span>
                          </div>
                        )}

                        {uploadingTarget === "logo" && (
                          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={fileInputRefLogo}
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => handleUpload(e, "logo")}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefLogo.current?.click()}
                        disabled={uploadingTarget === "logo"}
                        className="w-full bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 border border-teal-200 dark:border-teal-800/60"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>انتخاب فایل لوگو</span>
                      </button>

                      <input
                        type="text"
                        value={siteLogo}
                        onChange={(e) => setSiteLogo(e.target.value)}
                        placeholder="یا لینک مستقیم تصویر..."
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] font-mono dir-ltr text-left text-slate-700 dark:text-slate-300 outline-none"
                      />
                    </div>
                  </div>

                  {/* 2. Dark Mode Logo */}
                  <div className="border border-admin-borderLight dark:border-slate-800 rounded-2xl p-4 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                          <Moon className="w-3.5 h-3.5 text-indigo-400" />
                          <span>لوگوی دارک‌مود (شب)</span>
                        </span>
                        {siteLogoDark && (
                          <button
                            type="button"
                            onClick={() => setSiteLogoDark("")}
                            className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                            title="حذف لوگوی دارک"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Preview Box with Dark Background */}
                      <div className="h-28 rounded-xl border border-dashed border-slate-700 bg-slate-950 flex items-center justify-center p-2 relative overflow-hidden group shadow-inner">
                        {siteLogoDark ? (
                          <img
                            src={siteLogoDark}
                            alt="Logo Dark"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-slate-500 flex flex-col items-center">
                            <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                            <span className="text-[10px]">استفاده از لوگوی پیش‌فرض</span>
                          </div>
                        )}

                        {uploadingTarget === "logoDark" && (
                          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={fileInputRefLogoDark}
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => handleUpload(e, "logoDark")}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefLogoDark.current?.click()}
                        disabled={uploadingTarget === "logoDark"}
                        className="w-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>انتخاب فایل دارک‌مود</span>
                      </button>

                      <input
                        type="text"
                        value={siteLogoDark}
                        onChange={(e) => setSiteLogoDark(e.target.value)}
                        placeholder="یا لینک مستقیم تصویر..."
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] font-mono dir-ltr text-left text-slate-700 dark:text-slate-300 outline-none"
                      />
                    </div>
                  </div>

                  {/* 3. Favicon */}
                  <div className="border border-admin-borderLight dark:border-slate-800 rounded-2xl p-4 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-teal-500" />
                          <span>فاوآیکون (Favicon)</span>
                        </span>
                        {siteFavicon && (
                          <button
                            type="button"
                            onClick={() => setSiteFavicon("")}
                            className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                            title="حذف فاوآیکون"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Favicon Browser Tab Simulation */}
                      <div className="h-28 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col items-center justify-center p-2 relative overflow-hidden group">
                        <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 max-w-full shadow-2xs">
                          {siteFavicon ? (
                            <img
                              src={siteFavicon}
                              alt="Favicon"
                              className="w-5 h-5 rounded-xs object-contain shrink-0"
                            />
                          ) : (
                            <span className="w-4 h-4 rounded-xs bg-teal-500 text-white text-[9px] flex items-center justify-center font-bold">
                              ار
                            </span>
                          )}
                          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                            {siteName.split(" ")[0] || "فروشگاه"}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-2">پیش‌نمایش تب مرورگر</span>

                        {uploadingTarget === "favicon" && (
                          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={fileInputRefFavicon}
                        accept="image/png,image/x-icon,image/svg+xml"
                        className="hidden"
                        onChange={(e) => handleUpload(e, "favicon")}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefFavicon.current?.click()}
                        disabled={uploadingTarget === "favicon"}
                        className="w-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>انتخاب فایل فاوآیکون</span>
                      </button>

                      <input
                        type="text"
                        value={siteFavicon}
                        onChange={(e) => setSiteFavicon(e.target.value)}
                        placeholder="یا لینک مستقیم فاوآیکون..."
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] font-mono dir-ltr text-left text-slate-700 dark:text-slate-300 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Identity & Metadata Inputs */}
                <div className="space-y-4 pt-4 border-t border-admin-borderLight dark:border-slate-800">
                  <h4 className="font-bold text-xs text-admin-text dark:text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>اطلاعات هویتی و متادیتای سئو پلتفرم</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1">
                        نام تجاری فروشگاه:
                      </label>
                      <input
                        type="text"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2 px-3 outline-none transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1">
                        شعار و عنوان فرعی برند:
                      </label>
                      <input
                        type="text"
                        value={siteTagline}
                        onChange={(e) => setSiteTagline(e.target.value)}
                        className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2 px-3 outline-none transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1">
                      توضیحات کوتاه معرفی و متای سئو (Meta Description):
                    </label>
                    <textarea
                      rows={2}
                      value={siteDescription}
                      onChange={(e) => setSiteDescription(e.target.value)}
                      className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2 px-3 outline-none transition-all duration-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span>شماره تماس پشتیبانی:</span>
                      </label>
                      <input
                        type="text"
                        value={sitePhone}
                        onChange={(e) => setSitePhone(e.target.value)}
                        className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2 px-3 outline-none dir-ltr text-left font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span>ایمیل رسمی و سازمانی:</span>
                      </label>
                      <input
                        type="email"
                        value={siteEmail}
                        onChange={(e) => setSiteEmail(e.target.value)}
                        className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2 px-3 outline-none dir-ltr text-left font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span>آیدی تلگرام پشتیبانی:</span>
                      </label>
                      <input
                        type="text"
                        value={supportTelegram}
                        onChange={(e) => setSupportTelegram(e.target.value)}
                        className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2 px-3 outline-none dir-ltr text-left font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1 flex items-center gap-1.5">
                        <InstagramIcon className="w-3.5 h-3.5 text-pink-500" />
                        <span>شناسه اینستاگرام:</span>
                      </label>
                      <input
                        type="text"
                        value={siteInstagram}
                        onChange={(e) => setSiteInstagram(e.target.value)}
                        className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2 px-3 outline-none dir-ltr text-left font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1">
                      کد نماد اعتماد الکترونیکی (اینماد):
                    </label>
                    <input
                      type="text"
                      value={siteEnamad}
                      onChange={(e) => setSiteEnamad(e.target.value)}
                      placeholder="کد اینماد یا شناسه نماد اعتماد..."
                      className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2 px-3 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Financial & Currency */}
            {activeTab === "financial" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-admin-borderLight dark:border-slate-800">
                  <h3 className="font-bold text-sm text-admin-text dark:text-white flex items-center gap-2">
                    <Coins className="w-4 h-4 text-brand-primary dark:text-teal-400" />
                    <span>تنظیمات نرخ تبدیل، مارک‌آپ و پاداش کش‌بک</span>
                  </h3>
                </div>

                <div>
                  <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5">
                    نرخ برابری هر ۱ دلار به ریال:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1000"
                      min="10000"
                      value={usdRate}
                      onChange={(e) => setUsdRate(Number(e.target.value))}
                      className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2.5 px-3 text-sm font-mono font-bold outline-none transition-all duration-200"
                      required
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
                      ریال
                    </span>
                  </div>
                  <div className="mt-2 text-xs bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-teal-900 dark:text-teal-300 p-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 hover:border-teal-300 dark:hover:border-teal-700">
                    <ArrowLeftRight className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>
                      معادل ریالی در ویترین: <strong className="font-mono text-teal-700 dark:text-teal-300">{formattedTomanRate} تومان</strong>
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5 flex justify-between">
                    <span>حاشیه سود عمومی (Markup %):</span>
                    <span className="font-mono font-bold text-brand-primary dark:text-teal-400">%{margin}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2.5 px-3 text-sm font-mono font-bold outline-none transition-all duration-200"
                    required
                  />
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 block">
                    این درصد به عنوان حاشیه سود پیش‌فرض بر روی قیمت تمام‌شده ارزی کالاها اعمال می‌شود.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5 flex justify-between">
                    <span>درصد هدیه کش‌بک سفارشات (Cashback %):</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">%{cashbackPercent}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={cashbackPercent}
                    onChange={(e) => setCashbackPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2.5 px-3 text-sm font-mono font-bold outline-none transition-all duration-200"
                    required
                  />
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 block leading-relaxed">
                    پس از <strong>تکمیل نهایی و تحویل سفارش</strong> توسط ادمین، این درصد از فاکتور خرید زیرمجموعه به عنوان پاداش به کیف پول معرف ایشان واریز می‌شود.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 3: Stock Quota & Purchase Limits */}
            {activeTab === "quotas" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-admin-borderLight dark:border-slate-800">
                  <h3 className="font-bold text-sm text-admin-text dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-brand-primary dark:text-teal-400" />
                    <span>سقف مجاز خرید و کنترل سهمیه موجودی (Stock Quota)</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5 flex justify-between">
                      <span>مخرج کسر سقف خرید از موجودی (۱/D):</span>
                      <span className="font-mono font-bold text-teal-600 dark:text-teal-400">۱/{maxRatioDenominator} کل موجودی</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={maxRatioDenominator}
                      onChange={(e) => setMaxRatioDenominator(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2.5 px-3 text-sm font-mono font-bold outline-none transition-all duration-200"
                      required
                    />
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 block leading-relaxed">
                      مثال: با وارد کردن عدد ۳، کاربر حداکثر ۱/۳ موجودی کل کالا را می‌تواند در هر سفارش خریداری کند.
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5 flex justify-between">
                      <span>آستانه استثنا و آزادی خرید کامل:</span>
                      <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{ratioThreshold} عدد</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={ratioThreshold}
                      onChange={(e) => setRatioThreshold(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2.5 px-3 text-sm font-mono font-bold outline-none transition-all duration-200"
                      required
                    />
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 block leading-relaxed">
                      اگر موجودی کالا کمتر یا مساوی این عدد شود، محدودیت برداشته شده و کاربر می‌تواند کل موجودی را بخرد.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-xl text-xs text-teal-900 dark:text-teal-200 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>پیش‌نمایش فرمول سهمیه با مقادیر جاری:</span>
                  </div>
                  <div className="text-[11px] leading-relaxed text-teal-800 dark:text-teal-300">
                    • اگر موجودی محصول ۱۰ عدد باشد (موجودی &le; {ratioThreshold}): کاربر مجاز به سفارش تا سقف <strong>۱۰</strong> عدد است.
                    <br />
                    • اگر موجودی محصول ۳۰ عدد باشد (موجودی &gt; {ratioThreshold}): سقف خرید مجاز برابر با <strong>{Math.floor(30 / maxRatioDenominator)}</strong> عدد خواهد بود.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: irMarket API Gateway */}
            {activeTab === "irmarket" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-admin-borderLight dark:border-slate-800">
                  <h3 className="font-bold text-sm text-admin-text dark:text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-brand-primary dark:text-teal-400" />
                    <span>اتصال به سرور توزیع‌کننده irMarket</span>
                  </h3>
                </div>

                <div>
                  <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1.5">
                    کلید دسترسی خریدار (X-API-Key):
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-admin-bg dark:bg-slate-800 border border-admin-borderLight dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2.5 px-3 text-xs font-mono outline-none dir-ltr text-left transition-all duration-200"
                    required
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    این کلید برای استعلام لایسنس‌ها، موجودی والت و دریافت نرخ‌های لحظه‌ای به وب‌سرویس مرجع فرستاده می‌شود.
                  </span>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer group py-1">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => setAutoSync(e.target.checked)}
                      className="w-4 h-4 rounded accent-teal-600 cursor-pointer transition-transform group-hover:scale-110"
                    />
                    <span className="font-semibold text-admin-text dark:text-slate-200 transition-colors group-hover:text-teal-600 dark:group-hover:text-teal-400">
                      فعال‌سازی همگام‌سازی خودکار کاتالوگ و قیمت‌ها در پس‌زمینه
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 border-t border-admin-borderLight dark:border-slate-800">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 hover:scale-[1.01] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال ذخیره‌سازی...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>ذخیره کلیه تنظیمات سیستم و هویت بصری</span>
                  </>
                )}
              </button>
            </div>

            {toast && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs flex items-center gap-2 animate-bounce shadow-md">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>تنظیمات جدید با موفقیت ذخیره شد و در کلیه صفحات و متادیتای سایت اعمال گردید!</span>
              </div>
            )}
          </div>

          {/* Right Column: Dynamic Preview Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-6 sticky top-28">
            {activeTab === "visual" ? (
              /* Live Visual Brand Preview */
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-6 shadow-card space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-admin-borderLight dark:border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-brand-primary dark:text-teal-400 flex items-center justify-center">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-admin-text dark:text-white">
                      پیش‌نمایش زنده هویت بصری
                    </h3>
                    <p className="text-[10.5px] text-admin-textMuted dark:text-slate-400">
                      نحوه نمایش لوگو، نام و فاوآیکون در ویترین
                    </p>
                  </div>
                </div>

                {/* 1. Browser Tab Mock */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    نمایش در تب مرورگر کاربران:
                  </span>
                  <div className="bg-slate-200 dark:bg-slate-950 p-2 rounded-xl border border-slate-300 dark:border-slate-800">
                    <div className="bg-white dark:bg-slate-900 rounded-lg px-3 py-1.5 flex items-center gap-2 max-w-[220px] shadow-2xs">
                      {siteFavicon ? (
                        <img src={siteFavicon} alt="Favicon" className="w-4 h-4 rounded-xs object-contain shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-xs bg-teal-500 text-white text-[9px] flex items-center justify-center font-bold">
                          ار
                        </div>
                      )}
                      <span className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                        {siteName || "ارزان اکانت"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Light Header Mock */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    هدر سایت در حالت روز (Light Mode):
                  </span>
                  <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3 shadow-xs">
                    {siteLogo ? (
                      <img src={siteLogo} alt="Logo" className="h-9 w-auto max-w-[120px] object-contain" />
                    ) : (
                      <div className="w-9 h-9 bg-teal-600 text-white flex items-center justify-center font-black rounded-xl text-sm">
                        ار
                      </div>
                    )}
                    <div className="truncate">
                      <div className="font-black text-slate-900 text-sm truncate">{siteName}</div>
                      <div className="text-[10px] text-slate-500 truncate">{siteTagline}</div>
                    </div>
                  </div>
                </div>

                {/* 3. Dark Header Mock */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    هدر سایت در حالت شب (Dark Mode):
                  </span>
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-950 flex items-center gap-3 shadow-inner">
                    {siteLogoDark || siteLogo ? (
                      <img
                        src={siteLogoDark || siteLogo}
                        alt="Logo Dark"
                        className="h-9 w-auto max-w-[120px] object-contain"
                      />
                    ) : (
                      <div className="w-9 h-9 bg-teal-500 text-slate-950 flex items-center justify-center font-black rounded-xl text-sm">
                        ار
                      </div>
                    )}
                    <div className="truncate">
                      <div className="font-black text-white text-sm truncate">{siteName}</div>
                      <div className="text-[10px] text-slate-400 truncate">{siteTagline}</div>
                    </div>
                  </div>
                </div>

                {/* 4. Contact Info Summary */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] space-y-1.5 text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">تلفن پشتیبانی:</span>
                    <span className="font-mono font-bold">{sitePhone || "تنظیم نشده"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">ایمیل:</span>
                    <span className="font-mono">{siteEmail || "تنظیم نشده"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">تلگرام:</span>
                    <span className="font-mono text-teal-600 dark:text-teal-400">{supportTelegram}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Live Price Calculation Preview */
              <div className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-6 shadow-card hover:shadow-xl transition-all duration-300 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-admin-borderLight dark:border-slate-800 relative z-10">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-brand-primary dark:text-teal-400 flex items-center justify-center">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-admin-text dark:text-white">
                    پیش‌نمایش زنده اثر نرخ جدید
                  </h3>
                </div>

                <p className="text-xs text-admin-textMuted dark:text-slate-400 leading-relaxed relative z-10">
                  با تغییر نرخ برابری یا درصد سود، قیمت نهایی ریالی فروشگاه به این شکل محاسبه می‌شود:
                </p>

                <div className="space-y-3 pt-2 relative z-10">
                  {sampleUsd.map((usd) => {
                    const baseToman = (usd * usdRate) / 10;
                    const finalToman = Math.round(baseToman * (1 + margin / 100));

                    return (
                      <div
                        key={usd}
                        className="bg-admin-bg/80 dark:bg-slate-800/80 hover:bg-teal-50/50 dark:hover:bg-slate-800/90 p-3.5 rounded-xl border border-admin-borderLight dark:border-slate-700/80 flex items-center justify-between transition-all duration-200 shadow-2xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-xs text-admin-text dark:text-white">
                            سرویس ${usd.toFixed(2)} دلاری
                          </span>
                          <span className="text-[10px] text-neutral-400 block mt-0.5">
                            خرید خام: {formatPrice(Math.round(baseToman))} ت
                          </span>
                        </div>

                        <div className="text-left">
                          <span className="font-black text-sm text-brand-primary dark:text-teal-400 font-mono">
                            {formatPrice(finalToman)}
                          </span>
                          <span className="text-[11px] text-brand-muted dark:text-slate-400 mr-1 font-semibold">تومان</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
