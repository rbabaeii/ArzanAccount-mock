import React from "react";
import Link from "next/link";
import { ShieldCheck, Zap, Headphones, RefreshCw, Lock, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800 mt-20 pb-20 sm:pb-0">
      {/* 4 Value Pillars */}
      <div className="border-b border-slate-800 bg-slate-950/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative overflow-hidden flex items-center gap-3.5 bg-slate-850/80 hover:bg-slate-800/90 p-4 rounded-2xl border border-slate-800 hover:border-teal-400/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300">
              <div className="absolute -top-8 -right-8 w-16 h-16 bg-teal-500/10 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="w-11 h-11 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-2xs">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white group-hover:text-teal-300 transition-colors">تحویل خودکار و آنی</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">صدور فوری لایسنس پس از ثبت سفارش</p>
              </div>
            </div>

            <div className="group relative overflow-hidden flex items-center gap-3.5 bg-slate-850/80 hover:bg-slate-800/90 p-4 rounded-2xl border border-slate-800 hover:border-amber-400/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300">
              <div className="absolute -top-8 -right-8 w-16 h-16 bg-amber-500/10 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors">تضمین سلامت اکانت</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">گارانتی کامل دوره بدون قفل یا تعلیق</p>
              </div>
            </div>

            <div className="group relative overflow-hidden flex items-center gap-3.5 bg-slate-850/80 hover:bg-slate-800/90 p-4 rounded-2xl border border-slate-800 hover:border-emerald-400/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
              <div className="absolute -top-8 -right-8 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-2xs">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white group-hover:text-emerald-300 transition-colors">کمترین نرخ ریالی در بازار</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">محاسبه بر پایه تخفیف‌های عمده ارزی</p>
              </div>
            </div>

            <div className="group relative overflow-hidden flex items-center gap-3.5 bg-slate-850/80 hover:bg-slate-800/90 p-4 rounded-2xl border border-slate-800 hover:border-cyan-400/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300">
              <div className="absolute -top-8 -right-8 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-2xs">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">پشتیبانی همیشگی</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">پاسخگویی در تلگرام در تمام ساعات شبانه‌روز</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Brand & Mission */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-500 text-slate-900 flex items-center justify-center font-black text-lg rounded-xl shadow-sm">
                ار
              </div>
              <span className="text-lg font-black text-white">ارزان اکانت (arzanAccount)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              مرجع معتبر و قانونی خرید انواع اکانت‌های هوش مصنوعی، ابزارهای تخصصی، اکانت‌های استریم فیلم و سریال و سرویس‌های شبکه‌های اجتماعی با تسویه ریالی و پشتیبانی پیوسته.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-teal-400">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>پروتکل امن رمزنگاری SSL و تسویه رسمی</span>
            </div>
            <div>
              <Link
                href="/admin"
                className="text-xs text-teal-400 underline font-medium hover:text-teal-300 transition-colors"
              >
                دسترسی سریع به پنل مدیریت سایت
              </Link>
            </div>
          </div>

          {/* Quick links */}
          <div className="lg:col-span-2">
            <h5 className="font-bold text-xs text-white uppercase tracking-wider mb-4 border-r-2 border-teal-500 pr-2">
              دسترسی سریع
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link href="/" className="hover:text-teal-400 transition-colors inline-block hover:-translate-x-1 transition-transform">صفحه نخست</Link></li>
              <li><Link href="/products" className="hover:text-teal-400 transition-colors inline-block hover:-translate-x-1 transition-transform">کاتالوگ تمام محصولات</Link></li>
              <li><Link href="/orders" className="hover:text-teal-400 transition-colors inline-block hover:-translate-x-1 transition-transform">پیگیری سفارش و لایسنس</Link></li>
              <li><Link href="/cart" className="hover:text-teal-400 transition-colors inline-block hover:-translate-x-1 transition-transform">سبد خرید</Link></li>
              <li><Link href="/admin" className="hover:text-teal-400 transition-colors inline-block hover:-translate-x-1 transition-transform">ورود مدیران</Link></li>
            </ul>
          </div>

          {/* Category links */}
          <div className="lg:col-span-3">
            <h5 className="font-bold text-xs text-white uppercase tracking-wider mb-4 border-r-2 border-teal-500 pr-2">
              دسته‌بندی‌های برگزیده
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link href="/category/ai" className="hover:text-teal-400 transition-colors inline-block hover:-translate-x-1 transition-transform">اکانت‌های هوش مصنوعی (ChatGPT, Gemini)</Link></li>
              <li><Link href="/category/streaming" className="hover:text-teal-400 transition-colors inline-block hover:-translate-x-1 transition-transform">فیلم و سریال (نتفلیکس و یوتیوب)</Link></li>
              <li><Link href="/category/music" className="hover:text-teal-400 transition-colors inline-block hover:-translate-x-1 transition-transform">اشتراک موسیقی (اسپاتیفای قانونی)</Link></li>
              <li><Link href="/category/social-media" className="hover:text-teal-400 transition-colors inline-block hover:-translate-x-1 transition-transform">تلگرام پرمیوم و خدمات شبکه‌های اجتماعی</Link></li>
              <li><Link href="/category/tools" className="hover:text-teal-400 transition-colors inline-block hover:-translate-x-1 transition-transform">ابزارهای دولوپر و گیت‌هاب کوپایلوت</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="lg:col-span-3 space-y-3">
            <h5 className="font-bold text-xs text-white uppercase tracking-wider mb-4 border-r-2 border-teal-500 pr-2">
              ارتباط با پشتیبانی
            </h5>
            <p className="text-xs text-slate-400 leading-relaxed">
              هرگونه سوال، راهنمایی پیش از خرید و یا پیگیری لایسنس‌های ارسالی:
            </p>
            <a
              href="https://t.me/arzan_support"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md shadow-teal-500/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>پشتیبانی تلگرام: @arzan_support</span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© ۱۴۰۳ تمامی حقوق این سامانه متعلق به «ارزان اکانت» می‌باشد.</p>
          <p className="text-[11px] font-mono text-slate-500">
            Powered by Next.js & NestJS Architecture
          </p>
        </div>
      </div>
    </footer>
  );
}
