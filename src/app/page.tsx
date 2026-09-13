"use client";

import React, { useState } from "react";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import ProductCard from "@/components/store/ProductCard";
import { OrganizationJsonLd, WebSiteJsonLd, FaqJsonLd } from "@/components/seo/JsonLd";
import Card3D from "@/components/ui/Card3D";
import AmbientGlow from "@/components/ui/AmbientGlow";
import { useStore } from "@/context/StoreContext";
import {
  Sparkles,
  ArrowLeft,
  Bot,
  Film,
  Headphones,
  Share2,
  HelpCircle,
  Flame,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Tag,
  Gift,
  Wallet,
  Users,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  Zap,
  Lock,
} from "lucide-react";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";
import { formatNumber, formatPrice } from "@/lib/format";

const homeFaqItems = [
  {
    question: "اکانت‌ها چگونه تحویل داده می‌شوند؟",
    answer:
      "بلافاصله پس از پرداخت، مشخصات اکانت یا لینک دعوت به ایمیل شما ارسال شده و در صفحه «پیگیری سفارش» سایت نیز با کد پیگیری قابل مشاهده است.",
  },
  {
    question: "آیا اشتراک‌ها دارای گارانتی هستند؟",
    answer:
      "بله، تمامی اکانت‌های ما دارای ضمانت کامل در تمام طول مدت اشتراک هستند. در صورت بروز هرگونه مشکل فنی، اکانت جایگزین فوراً تحویل داده خواهد شد.",
  },
  {
    question: "نحوه محاسبه قیمت‌ها در ارزان اکانت چگونه است؟",
    answer:
      "قیمت‌ها بر پایه نرخ روز ارز رسمی با اعمال تخفیف‌های عمده شرکتی محاسبه شده تا خریدار همواره ارزان‌ترین قیمت بازار را دریافت کند.",
  },
];

export default function HomePage() {
  const { activeProducts, categories, calculateProductPrice, settings } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [productSearch, setProductSearch] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "price_asc" | "price_desc" | "rating" | "on_sale">("popular");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const formattedUsdRate = formatPrice(Math.round(settings.usdToRialRate / 10));

  // Mobile initial page size detection (fewer items per page on mobile as requested)
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setPageSize(6);
    }
  }, []);

  const flashDeals = activeProducts.filter((p) => p.isFlashDeal);

  const filteredProducts = activeProducts
    .filter((p) => {
      const matchCat = selectedCategory === "all" || p.categoryId === selectedCategory;
      const matchSearch =
        !productSearch.trim() ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.customTitle.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(productSearch.toLowerCase());
      const matchStock = !inStockOnly || p.inStock;
      const price = calculateProductPrice(p);
      const matchSale = sortBy !== "on_sale" || Boolean(price.isOnSale || p.isFlashDeal);
      return matchCat && matchSearch && matchStock && matchSale;
    })
    .sort((a, b) => {
      // 1. In-stock priority: products with available stock MUST appear first
      const stockA = (a.inStock && (a.stockCount === undefined || a.stockCount > 0)) ? 1 : 0;
      const stockB = (b.inStock && (b.stockCount === undefined || b.stockCount > 0)) ? 1 : 0;
      if (stockA !== stockB) {
        return stockB - stockA; // in-stock (1) first, out-of-stock (0) last
      }

      // 2. Secondary user-selected sorting
      const priceA = calculateProductPrice(a).toman;
      const priceB = calculateProductPrice(b).toman;
      if (sortBy === "price_asc") return priceA - priceB;
      if (sortBy === "price_desc") return priceB - priceA;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "newest") return b.externalId - a.externalId;
      if (sortBy === "on_sale") return (b.isFlashDeal ? 1 : 0) - (a.isFlashDeal ? 1 : 0);
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || b.reviewCount - a.reviewCount;
    });

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Bot":
        return <Bot className="w-4 h-4" />;
      case "Film":
        return <Film className="w-4 h-4" />;
      case "Headphones":
        return <Headphones className="w-4 h-4" />;
      case "Share2":
        return <Share2 className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  // Count active products per category and sort descending
  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    count: activeProducts.filter((p) => p.categoryId === cat.id).length,
  }));

  const sortedCategories = [...categoriesWithCount].sort((a, b) => b.count - a.count);

  // Top 5 categories with highest product count
  const top5Categories = sortedCategories.slice(0, 5);
  const otherCategories = sortedCategories.slice(5);

  return (
    <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* SEO Structured Data for Google */}
      <OrganizationJsonLd
        name="ارزان اکانت"
        url="https://arzanaccount.ir"
        logo="https://arzanaccount.ir/logo.png"
        description="خرید آنلاین و ارزان انواع اکانت و اشتراک هوش مصنوعی، فیلم و سریال و شبکه‌های اجتماعی با تحویل آنی"
      />
      <WebSiteJsonLd
        name="ارزان اکانت"
        url="https://arzanaccount.ir"
        potentialActionUrl="https://arzanaccount.ir/products"
      />
      <FaqJsonLd items={homeFaqItems} />

      <Header />

      {/* Hero Section (3D & Hyperrealism + Ambient Glow) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-950 via-brand-primaryDark to-brand-primary text-white py-16 sm:py-24">
        {/* Ambient Glow Orbs */}
        <AmbientGlow variant="teal" className="-top-32 -left-32 opacity-30" />
        <AmbientGlow variant="amber" className="-bottom-20 -right-20 opacity-20" />

        {/* Background Decorative Mesh */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left/Main Column: Headings & CTA */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-teal-200 text-xs font-semibold border border-white/15">
                <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
                <span>پلتفرم تخصصی اشتراک‌های بین‌المللی ارزان اکانت</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.2] text-white">
                اشتراک قانونی انواع سرویس‌های جهانی با <span className="text-brand-accent">کمترین نرخ ریالی</span>
              </h1>

              <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed font-normal max-w-2xl">
                خرید اشتراک قانونی و پرمیوم انواع اکانت‌های هوش مصنوعی (ChatGPT Plus، Gemini Pro)، فیلم و سریال، موزیک، تلگرام پرمیوم و خدمات شبکه‌های اجتماعی با گارانتی کامل و تحویل فوری.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#catalog-section"
                  className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm px-7 py-3.5 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-amber-500/20 hover:scale-105"
                >
                  <span>مشاهده محصولات و خرید آنی</span>
                  <ArrowLeft className="w-4 h-4" />
                </a>

                <Link
                  href="/orders"
                  className="bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl transition-all duration-200 border border-white/15 flex items-center gap-2 hover:scale-105"
                >
                  <span>رهگیری سفارش و لایسنس</span>
                </Link>
              </div>
            </div>

            {/* Right Column: 3D Luxury Feature Card */}
            <div className="hidden lg:block lg:col-span-5">
              <Card3D maxTilt={7} glareEffect={true} className="glass-card rounded-3xl p-6 border border-white/20 shadow-2xl bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/15">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-teal-400/20 text-teal-300 flex items-center justify-center font-bold shadow-xs">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white">ارزان اکانت اکسپرس</h3>
                        <span className="text-[10px] text-teal-200">تحویل خودکار لایسنس دیجیتال</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                      فعال ۲۴/۷
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-teal-100/90">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>تحویل آنی زیر ۲ دقیقه در پنل کاربری</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>گارانتی کامل و بی‌قیدوشرط تا پایان اشتراک</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <Lock className="w-4 h-4 text-teal-300 shrink-0" />
                      <span>پرداخت امن کارت‌به‌کارت با تایید آنی</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-teal-200 border-t border-white/10">
                    <span>نرخ مرجع محاسبه</span>
                    <span className="font-mono font-bold text-amber-300">{formattedUsdRate} تومان</span>
                  </div>
                </div>
              </Card3D>
            </div>
          </div>
        </div>
      </section>

      {/* Live Performance & Trust Strip (3D Perspective Cards) */}
      <section className="bg-white dark:bg-slate-900 border-b border-brand-border dark:border-slate-800 py-6 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
            <Card3D maxTilt={5} glareEffect={true} className="glass-card rounded-2xl p-4 border border-brand-border/60 dark:border-slate-800 shadow-2xs hover:shadow-3d">
              <span className="text-xl sm:text-2xl font-black text-brand-primary dark:text-teal-400 font-mono">+14,500</span>
              <p className="text-[11px] text-brand-muted dark:text-slate-400 mt-1 font-medium">سفارش موفق تحویل‌شده</p>
            </Card3D>
            <Card3D maxTilt={5} glareEffect={true} className="glass-card rounded-2xl p-4 border border-brand-border/60 dark:border-slate-800 shadow-2xs hover:shadow-3d">
              <span className="text-xl sm:text-2xl font-black text-brand-primary dark:text-teal-400 font-mono">۲ دقیقه</span>
              <p className="text-[11px] text-brand-muted dark:text-slate-400 mt-1 font-medium">میانگین زمان صدور لایسنس</p>
            </Card3D>
            <Card3D maxTilt={5} glareEffect={true} className="glass-card rounded-2xl p-4 border border-brand-border/60 dark:border-slate-800 shadow-2xs hover:shadow-3d">
              <span className="text-xl sm:text-2xl font-black text-brand-primary dark:text-teal-400 font-mono">99.4%</span>
              <p className="text-[11px] text-brand-muted dark:text-slate-400 mt-1 font-medium">رضایت خریداران و دولوپرها</p>
            </Card3D>
            <Card3D maxTilt={5} glareEffect={true} className="glass-card rounded-2xl p-4 border border-brand-border/60 dark:border-slate-800 shadow-2xs hover:shadow-3d">
              <span className="text-xl sm:text-2xl font-black text-brand-primary dark:text-teal-400 font-mono">24/7</span>
              <p className="text-[11px] text-brand-muted dark:text-slate-400 mt-1 font-medium">پشتیبانی تلگرام و آنلاین</p>
            </Card3D>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* REFERRAL & CASHBACK HERO BANNER (طرح دعوت از دوستان و پاداش کش‌بک)         */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#003847] via-[#004e63] to-[#005a71] border border-teal-500/30 p-6 sm:p-8 shadow-xl hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-300 text-white">
          {/* Ambient Glows */}
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-teal-400/20 blur-3xl pointer-events-none group-hover:scale-125 transition-all duration-500" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none group-hover:scale-125 transition-all duration-500" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-lg shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Gift className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-300/40 text-amber-300 px-3 py-1 rounded-full text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>طرح دعوت از دوستان و پاداش کش‌بک نقدی</span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                  دوستانت رو دعوت کن، تا <span className="text-amber-300 font-mono">%{settings.orderCashbackPercent || 10}</span> از هر خریدشون کش‌بک بگیر!
                </h2>
                <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed max-w-2xl">
                  کد معرف اختصاصی خودت رو با دوستان به اشتراک بذار. به ازای هر خرید موفقی که دوستانت انجام دهند، %{settings.orderCashbackPercent || 10} از مبلغ فاکتور به عنوان اعتبار پاداش کش‌بک مستقیماً به کیف پول شما واریز خواهد شد تا در خریدهای بعدی از آن استفاده کنید.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3 shrink-0 w-full sm:w-auto">
              <Link
                href="/profile"
                className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span>دریافت کد معرف اختصاصی من</span>
              </Link>
              <Link
                href="/profile"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4 text-teal-300" />
                <span>مشاهده کیف پول و پاداش‌ها</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Flash Deals Banner Section */}
      {flashDeals.length > 0 && (
        <section className="bg-amber-500/10 dark:bg-amber-500/5 border-y border-amber-500/20 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-accent text-white flex items-center justify-center shadow-xs">
                  <Flame className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-brand-dark dark:text-white flex items-center gap-2">
                    <span>پیشنهادات شگفت‌انگیز و تخفیف‌دار امروز</span>
                    <span className="text-xs font-normal text-brand-accent bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                      تحویل آنی
                    </span>
                  </h2>
                  <p className="text-xs text-brand-muted dark:text-slate-400 mt-0.5">
                    تخفیف‌های ویژه بر روی محبوب‌ترین اشتراک‌های هوش مصنوعی و کاربردی
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-brand-accent bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 px-3 py-1.5 rounded-lg self-start sm:self-auto">
                فرصت محدود تا پایان تخفیف
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
              {flashDeals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Navigation Cards (Top 5 Categories + View All Archive) */}
      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-brand-dark dark:text-white">دسته‌بندی‌های تخصصی</h2>
            <p className="text-xs text-brand-muted dark:text-slate-400 mt-1">
              پرمخاطب‌ترین شاخه‌های اشتراک‌های دیجیتال با بیشترین تنوع محصولی
            </p>
          </div>
          <Link
            href="/categories"
            className="text-xs font-bold text-brand-primary dark:text-teal-300 hover:text-brand-primaryDark flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 hover:border-brand-primary dark:hover:border-teal-500 px-3.5 py-2 rounded-xl transition-all shadow-2xs"
          >
            <span>مشاهده همه دسته‌بندی‌ها ({categories.length} دسته)</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {top5Categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-brand-border dark:border-slate-800 hover:border-teal-400/40 dark:hover:border-teal-400/30 p-4 rounded-2xl shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center"
            >
              <div className="absolute -top-8 -right-8 w-16 h-16 bg-teal-500/10 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-slate-800 text-brand-primary dark:text-teal-400 group-hover:bg-gradient-to-r group-hover:from-teal-600 group-hover:to-emerald-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 flex items-center justify-center mb-3 shadow-2xs">
                {getCategoryIcon(cat.icon)}
              </div>
              <h3 className="font-bold text-xs text-brand-dark dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                {cat.title}
              </h3>
              <span className="text-[10px] text-brand-muted dark:text-slate-400 mt-1 font-mono">
                {cat.count} اشتراک فعال
              </span>
            </Link>
          ))}

          {/* 6th Card: Link to /categories */}
          <Link
            href="/categories"
            className="group relative overflow-hidden bg-gradient-to-br from-brand-primary to-teal-950 text-white p-4 rounded-2xl shadow-card hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-center text-center border border-teal-800 dark:border-teal-900"
          >
            <div className="absolute -top-8 -right-8 w-16 h-16 bg-teal-400/20 rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            <div className="w-12 h-12 rounded-xl bg-white/10 text-brand-accent group-hover:bg-white group-hover:text-brand-primary group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 flex items-center justify-center mb-3 shadow-2xs">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold text-xs text-white">
              همه دسته‌بندی‌ها
            </h3>
            <span className="text-[10px] text-teal-200 mt-1 font-mono">
              +{categories.length > 5 ? categories.length - 5 : 0} دسته دیگر
            </span>
          </Link>
        </div>
      </section>

      {/* Main Catalog & Filter Section */}
      <main id="catalog-section" className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold text-brand-accent uppercase tracking-widest">
              کاتالوگ فروشگاه
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-brand-dark dark:text-white mt-1">
              تمامی اشتراک‌های قابل سفارش
            </h2>
            <p className="text-xs text-brand-muted dark:text-slate-400 mt-1">
              با قیمت‌های محاسبه‌شده زنده بر اساس آخرین نرخ ارزی
            </p>
          </div>

          <div className="text-xs font-semibold text-brand-muted dark:text-slate-400 bg-white dark:bg-slate-900 border border-brand-border dark:border-slate-800 px-3 py-1.5 rounded-lg self-start sm:self-auto">
            {filteredProducts.length} محصول آماده خرید
          </div>
        </div>

        {/* Filter Chips (Top 5 categories + compact other categories selector) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          <button
            onClick={() => {
              setSelectedCategory("all");
              setCurrentPage(1);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap flex items-center gap-2 shadow-2xs ${
              selectedCategory === "all"
                ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20"
                : "bg-white dark:bg-slate-900 text-brand-dark dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 border border-brand-border dark:border-slate-800"
            }`}
          >
            <span>همه اشتراک‌ها</span>
            <span className="text-[10px] bg-white/20 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono">
              {activeProducts.length}
            </span>
          </button>

          {top5Categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap flex items-center gap-2 shadow-2xs ${
                  isSelected
                    ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold shadow-md shadow-teal-500/20"
                    : "bg-white dark:bg-slate-900 text-brand-dark dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800 border border-brand-border dark:border-slate-800"
                }`}
              >
                {getCategoryIcon(cat.icon)}
                <span>{cat.title}</span>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono">
                  {cat.count}
                </span>
              </button>
            );
          })}

          {/* If user selected a category not in top 5, render its active chip */}
          {selectedCategory !== "all" && !top5Categories.some((c) => c.id === selectedCategory) && (
            (() => {
              const currentCat = sortedCategories.find((c) => c.id === selectedCategory);
              return currentCat ? (
                <button
                  key={currentCat.id}
                  onClick={() => {
                    setSelectedCategory(currentCat.id);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20"
                >
                  {getCategoryIcon(currentCat.icon)}
                  <span>{currentCat.title}</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
                    {currentCat.count}
                  </span>
                </button>
              ) : null;
            })()
          )}

          {/* Compact Dropdown / Link for Other Categories */}
          {otherCategories.length > 0 && (
            <div className="relative inline-flex items-center">
              <select
                value={top5Categories.some((c) => c.id === selectedCategory) ? "" : selectedCategory === "all" ? "" : selectedCategory}
                onChange={(e) => {
                  if (e.target.value === "all_categories_link") {
                    window.location.href = "/categories";
                  } else if (e.target.value) {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-neutral-600 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-800 border border-brand-border dark:border-slate-800 outline-none cursor-pointer transition-all whitespace-nowrap"
              >
                <option value="">سایر دسته‌ها ({otherCategories.length})...</option>
                {otherCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.count})
                  </option>
                ))}
                <option value="all_categories_link">
                  ➔ مشاهده آرشیو کامل همه دسته‌ها
                </option>
              </select>
            </div>
          )}
        </div>

        {/* Search, Sort, and In-Stock Toolbar */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-brand-border dark:border-slate-800 rounded-2xl p-4 mb-8 shadow-card hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="جستجو در نام و توضیحات این اشتراک‌ها..."
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-brand-border dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-xs outline-none text-slate-800 dark:text-slate-100 placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
            />
            <Search className="w-4 h-4 text-neutral-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
            {productSearch && (
              <button
                onClick={() => {
                  setProductSearch("");
                  setCurrentPage(1);
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-neutral-200 dark:bg-slate-700 hover:bg-neutral-300 dark:hover:bg-slate-600 text-neutral-600 dark:text-slate-300 rounded px-1.5 py-0.5 transition-colors"
              >
                پاک کردن
              </button>
            )}
          </div>

          {/* Sort Pills & In-Stock Switch */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-brand-border dark:border-slate-700/60 overflow-x-auto scrollbar-none">
              <button
                onClick={() => {
                  setSortBy("popular");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap ${
                  sortBy === "popular"
                    ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-2xs font-bold"
                    : "text-neutral-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                محبوب‌ترین
              </button>
              <button
                onClick={() => {
                  setSortBy("newest");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap ${
                  sortBy === "newest"
                    ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-2xs font-bold"
                    : "text-neutral-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                جدیدترین
              </button>
              <button
                onClick={() => {
                  setSortBy("price_asc");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap ${
                  sortBy === "price_asc"
                    ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-2xs font-bold"
                    : "text-neutral-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                ارزان‌ترین
              </button>
              <button
                onClick={() => {
                  setSortBy("price_desc");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap ${
                  sortBy === "price_desc"
                    ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-2xs font-bold"
                    : "text-neutral-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                گران‌ترین
              </button>
              <button
                onClick={() => {
                  setSortBy("rating");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap ${
                  sortBy === "rating"
                    ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-2xs font-bold"
                    : "text-neutral-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                امتیاز بالا
              </button>
              <button
                onClick={() => {
                  setSortBy("on_sale");
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap flex items-center gap-1 ${
                  sortBy === "on_sale"
                    ? "bg-amber-500 text-slate-950 font-black shadow-2xs"
                    : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                }`}
              >
                <Tag className="w-3 h-3" />
                <span>حراج و تخفیف‌دار</span>
              </button>
            </div>

            {/* In-Stock Toggle */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 cursor-pointer text-slate-700 dark:text-slate-300 font-medium select-none group transition-all duration-200 hover:border-teal-400">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-3.5 h-3.5 accent-teal-600 rounded transition-transform group-hover:scale-110"
              />
              <span className="text-[11px] group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">فقط کالاهای موجود</span>
            </label>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredProducts.length}
              itemsPerPage={pageSize}
              itemName="محصول"
              pageSizeOptions={[6, 12, 24, 48]}
              onItemsPerPageChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              onPageChange={(p) => {
                setCurrentPage(p);
                const el = document.getElementById("catalog-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="border-t border-brand-border dark:border-slate-800 pt-6"
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-neutral-300 dark:border-slate-800 rounded-2xl p-12 text-center my-8 shadow-card">
            <p className="text-sm font-semibold text-neutral-600 dark:text-slate-300">
              هیچ محصولی مطابق با فیلتر انتخاب شده یافت نشد.
            </p>
            <p className="text-xs text-neutral-400 dark:text-slate-500 mt-2">
              می‌توانید فیلترهای دیگر را انتخاب کرده یا تمامی محصولات کاتالوگ را مشاهده فرمایید.
            </p>
            <button
              onClick={() => setSelectedCategory("all")}
              className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all duration-200 shadow-md shadow-teal-500/20 inline-block"
            >
              مشاهده تمامی محصولات
            </button>
          </div>
        )}
      </main>

      {/* FAQ Section */}
      <section className="bg-white dark:bg-slate-900 border-t border-brand-border dark:border-slate-800 py-14 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-black text-brand-dark dark:text-white">پرسش‌های پرتکرار مشتریان</h2>
            <p className="text-xs text-brand-muted dark:text-slate-400 mt-1">پاسخ به رایج‌ترین سوالات شما پیش از خرید اشتراک</p>
          </div>

          <div className="space-y-3">
            {homeFaqItems.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={faq.question}
                  className="group relative overflow-hidden glass-card rounded-2xl border border-brand-border dark:border-slate-800 transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between p-5 text-right font-bold text-xs sm:text-sm text-brand-dark dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition-colors focus:outline-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-brand-primary dark:text-teal-400 shrink-0" />
                      <span>{faq.question}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-300 shrink-0 ${
                        isOpen ? "rotate-180 text-teal-600 dark:text-teal-400" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 text-xs text-brand-muted dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 animate-fadeIn">
                      <p className="pt-3 pr-6">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
