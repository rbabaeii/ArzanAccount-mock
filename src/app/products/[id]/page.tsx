"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import ProductCard from "@/components/store/ProductCard";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import Card3D from "@/components/ui/Card3D";
import AmbientGlow from "@/components/ui/AmbientGlow";
import { useStore } from "@/context/StoreContext";
import { api } from "@/lib/api";
import { formatPrice, formatNumber } from "@/lib/format";
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Clock,
  Mail,
  Link as LinkIcon,
  Layers,
  Star,
  ShoppingBag,
  RefreshCw,
  AlertTriangle,
  Tag,
  FileText,
  BookOpen,
  Check,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { products, categories, calculateProductPrice, addToCart, getMaxAllowedPurchase } = useStore();

  const productId = params?.id as string;
  const initialProduct = products.find((p) => p.id === productId);

  const [currentProduct, setCurrentProduct] = useState(initialProduct);
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [liveSyncMessage, setLiveSyncMessage] = useState<string | null>(null);
  const [apiRelated, setApiRelated] = useState<any[] | null>(null);

  // Tabs state: "specs" | "guide"
  const [activeTab, setActiveTab] = useState<"specs" | "guide">("specs");

  useEffect(() => {
    if (!productId) return;
    let isMounted = true;
    setIsSyncingLive(true);
    api
      .getLiveProduct(productId)
      .then((liveData) => {
        if (isMounted && liveData) {
          let safeTags: string[] = [];
          if (Array.isArray(liveData.tags)) {
            safeTags = liveData.tags;
          } else if (typeof (liveData.tags as any) === "string") {
            try {
              const rawStr = liveData.tags as unknown as string;
              safeTags = rawStr.startsWith("[")
                ? JSON.parse(rawStr)
                : rawStr.split(",").map((t: string) => t.trim()).filter(Boolean);
            } catch {
              safeTags = [];
            }
          } else if (initialProduct?.tags) {
            safeTags = Array.isArray(initialProduct.tags) ? initialProduct.tags : [];
          }

          setCurrentProduct((prev) => ({
            ...(prev || initialProduct),
            ...liveData,
            tags: safeTags,
          }));
          setLiveSyncMessage(
            liveData.inStock
              ? `موجودی زنده تأمین‌کننده: ${liveData.stockCount !== null ? formatNumber(liveData.stockCount) + " عدد موجود" : "موجود در انبار"}`
              : "ناموجود در انبار تأمین‌کننده"
          );
        }
      })
      .catch((err) => {
        console.warn("Live sync error with irMarket:", err);
      })
      .finally(() => {
        if (isMounted) setIsSyncingLive(false);
      });

    // Fetch related products from backend tag-matching algorithm
    api
      .getRelatedProducts(productId, 4)
      .then((res) => {
        if (isMounted && res && Array.isArray(res) && res.length > 0) {
          setApiRelated(res);
        }
      })
      .catch((err) => {
        console.warn("Related products fetch error:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [productId, initialProduct]);

  const product = currentProduct || initialProduct;

  useEffect(() => {
    if (product?.customTitle) {
      document.title = `خرید ${product.customTitle} | ارزان اکانت`;
    }
  }, [product?.customTitle]);

  const productTags: string[] = useMemo(() => {
    if (!product || !product.tags) return [];
    if (Array.isArray(product.tags)) return product.tags;
    if (typeof product.tags === "string") {
      try {
        const parsed = JSON.parse(product.tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return (product.tags as string).split(",").map((t) => t.trim()).filter(Boolean);
      }
    }
    return [];
  }, [product]);

  const [quantity, setQuantity] = useState<number>(
    product?.pricingUnit === "per_1000" ? (product?.minQty || 1000) : 1
  );
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerLink, setCustomerLink] = useState("");
  const [addedToast, setAddedToast] = useState(false);

  const relatedProducts = useMemo(() => {
    let list: any[] = [];
    if (apiRelated && apiRelated.length > 0) {
      list = apiRelated;
    } else if (product) {
      list = products
        .filter((p) => p.id !== product.id && p.isActive)
        .map((p) => {
          let score = 0;
          if (p.categoryId === product.categoryId) score += 20;
          const pTags = Array.isArray(p.tags) ? p.tags : [];
          if (pTags.length > 0 && productTags.length > 0) {
            const common = pTags.filter((t) => productTags.includes(t));
            score += common.length * 40;
          }
          return { product: p, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((item) => item.product);
    }

    return list
      .filter((p) => p && p.inStock && (p.stockCount === undefined || p.stockCount > 0))
      .slice(0, 4);
  }, [apiRelated, product, products, productTags]);

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-brand-dark dark:text-slate-100">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-xl font-bold text-brand-dark dark:text-white">محصول مورد نظر یافت نشد!</h2>
          <p className="text-xs text-brand-muted dark:text-slate-400 mt-2">
            ممکن است این محصول غیرفعال شده یا آدرس وارد شده نادرست باشد.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>مشاهده کاتالوگ محصولات</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);
  const price = calculateProductPrice(product);
  const maxAllowed = product ? getMaxAllowedPurchase(product) : 100;

  const totalPriceToman = price.isPerThousand
    ? Math.round((price.toman * quantity) / 1000)
    : price.toman * quantity;

  const formattedTotalPrice = formatPrice(totalPriceToman);

  const handleAddToCart = () => {
    if (!product.inStock) return;
    addToCart(product, quantity, customerEmail, customerLink);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const handleBuyNow = () => {
    if (!product.inStock) return;
    addToCart(product, quantity, customerEmail, customerLink);
    router.push("/cart");
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-surfaceDim dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors relative overflow-x-hidden">
      {/* Dynamic Background Ambient Glows */}
      <AmbientGlow variant="mixed" className="-top-24 -right-24 pointer-events-none" />
      <AmbientGlow variant="teal" className="top-1/2 -left-32 pointer-events-none" />

      {/* Google SEO Structured Data */}
      <ProductJsonLd
        name={product.customTitle}
        description={product.description}
        image={product.image || "https://arzanaccount.ir/logo.png"}
        sku={product.id}
        priceRial={price.rial}
        priceToman={price.toman}
        ratingValue={product.rating}
        reviewCount={product.reviewCount}
        inStock={product.inStock}
        category={category ? category.title : "اشتراک دیجیتال"}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "صفحه اصلی", url: "https://arzanaccount.ir" },
          {
            name: category?.title || "کاتالوگ محصولات",
            url: category
              ? `https://arzanaccount.ir/category/${category.slug}`
              : "https://arzanaccount.ir/products",
          },
          { name: product.customTitle, url: `https://arzanaccount.ir/products/${product.id}` },
        ]}
      />

      <Header />

      {/* Breadcrumb Navigation Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-brand-border/80 dark:border-slate-800/80 py-3.5 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-brand-muted dark:text-slate-400">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 truncate max-w-2xl">
            <Link href="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors shrink-0">
              صفحه اصلی
            </Link>
            <span>/</span>
            {category ? (
              <>
                <Link href={`/category/${category.slug}`} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors shrink-0">
                  {category.title}
                </Link>
                <span>/</span>
              </>
            ) : (
              <>
                <Link href="/products" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors shrink-0">
                  کاتالوگ
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-brand-dark dark:text-white font-semibold truncate">
              {product.customTitle}
            </span>
          </nav>

          <Link
            href="/products"
            className="text-teal-600 dark:text-teal-400 hover:underline shrink-0 text-xs font-semibold flex items-center gap-1"
          >
            <span>بازگشت به فروشگاه</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>
      </div>

      {/* Main PDP Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10 pb-36 sm:pb-24 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Main Visual & Info Column (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            <div className="glass-panel p-5 sm:p-7 rounded-3xl border border-brand-border/80 dark:border-slate-800/80 shadow-card hover:shadow-3d transition-all duration-300 relative overflow-hidden">
              {/* Dynamic 3D Card Image Showcase */}
              <div className="relative mb-6">
                <Card3D maxTilt={7} glareEffect={true} className="rounded-2xl overflow-hidden border border-brand-border/80 dark:border-slate-800">
                  <div className="aspect-[16/10] w-full bg-brand-surfaceDim dark:bg-slate-800 relative overflow-hidden group">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.customTitle}
                        className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 font-mono text-xs">
                        بدون تصویر
                      </div>
                    )}

                    {/* Image Top Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-start pointer-events-none z-10">
                      {!product.inStock ? (
                        <span className="text-[10px] font-black bg-slate-950/90 text-white px-2.5 py-1 rounded-lg border border-white/20 shadow-md">
                          ناموجود در انبار
                        </span>
                      ) : (
                        <>
                          {product.badge && (
                            <span className="text-[10px] font-bold bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-2.5 py-1 rounded-lg shadow-md">
                              {product.badge}
                            </span>
                          )}
                          {price.isOnSale && (
                            <span className="text-[10px] font-black bg-rose-600 text-white px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 animate-pulse">
                              <Zap className="w-3 h-3" />
                              حراج ویژه
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Instant delivery indicator overlay */}
                    <div className="absolute bottom-3 right-3 pointer-events-none z-10">
                      <span className="text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1 shadow-sm">
                        <Zap className="w-3 h-3 text-amber-400" />
                        تحویل فوری کمتر از ۱۰ دقیقه
                      </span>
                    </div>
                  </div>
                </Card3D>
              </div>

              {/* Title, SKU & Rating Breakdown */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-xs text-brand-muted dark:text-slate-400">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md font-mono text-[11px] border border-slate-200 dark:border-slate-700">
                      کد مرجع: #{product.externalId}
                    </span>
                    <span className="font-mono text-neutral-300 dark:text-slate-700">|</span>
                    <span className="font-mono text-[11px] truncate max-w-[150px] sm:max-w-xs">{product.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{product.rating ?? 4.9} از ۵</span>
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-brand-dark dark:text-white leading-snug mt-1">
                  {product.customTitle}
                </h1>

                {/* Product Tags */}
                {productTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
                    <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                      <Tag className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                      تگ‌ها:
                    </span>
                    {productTags.map((tag: string, idx: number) => (
                      <Link
                        key={idx}
                        href={`/products?search=${encodeURIComponent(tag)}`}
                        className="inline-flex items-center gap-1 text-[11px] bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-300 font-medium px-2.5 py-0.5 rounded-lg border border-teal-200/70 dark:border-teal-800/70 transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xs"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* 3D Trust Badges Strip */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-brand-border/80 dark:border-slate-800/80">
                <div className="group/pillar bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 hover:border-teal-400/50 hover:shadow-md transition-all duration-300">
                  <span className="text-[10.5px] text-teal-700 dark:text-teal-400 block font-semibold">تحویل خودکار</span>
                  <span className="text-xs font-bold text-brand-dark dark:text-slate-200 mt-1 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500 group-hover/pillar:scale-110 transition-transform" />
                    صدور آنلاین و فوری
                  </span>
                </div>

                <div className="group/pillar bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 hover:border-teal-400/50 hover:shadow-md transition-all duration-300">
                  <span className="text-[10.5px] text-emerald-700 dark:text-emerald-400 block font-semibold">گارانتی تعویض</span>
                  <span className="text-xs font-bold text-brand-dark dark:text-slate-200 mt-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 group-hover/pillar:scale-110 transition-transform" />
                    ضمانت کامل دوره
                  </span>
                </div>

                <div className="group/pillar bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 hover:border-teal-400/50 hover:shadow-md transition-all duration-300">
                  <span className="text-[10.5px] text-teal-700 dark:text-teal-400 block font-semibold">پشتیبانی تلگرام</span>
                  <span className="text-xs font-bold text-brand-dark dark:text-slate-200 mt-1 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-teal-600 group-hover/pillar:scale-110 transition-transform" />
                    پاسخگویی سریع روزانه
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Tabs System (Specs, Guide, Reviews) */}
            <div className="glass-panel rounded-3xl border border-brand-border/80 dark:border-slate-800/80 shadow-card overflow-hidden">
              {/* Tab Header Navigation */}
              <div className="flex items-center border-b border-brand-border/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 px-2 sm:px-4 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("specs")}
                  className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === "specs"
                      ? "border-teal-500 text-teal-600 dark:text-teal-400 bg-white/80 dark:bg-slate-800/80 rounded-t-xl shadow-2xs"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>توضیحات و مشخصات</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("guide")}
                  className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === "guide"
                      ? "border-teal-500 text-teal-600 dark:text-teal-400 bg-white/80 dark:bg-slate-800/80 rounded-t-xl shadow-2xs"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>راهنما و شرایط تحویل</span>
                </button>
              </div>

              {/* Tab Content Body */}
              <div className="p-5 sm:p-7">
                {/* Tab 1: Specs & Overview */}
                {activeTab === "specs" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-brand-dark dark:text-white mb-2.5">
                        قابلیت‌ها و توضیحات کامل اشتراک:
                      </h3>
                      <p className="text-xs sm:text-sm text-brand-muted dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {product.description}
                      </p>
                    </div>

                    {product.specs && product.specs.length > 0 && (
                      <div className="pt-5 border-t border-brand-border/60 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-brand-dark dark:text-white mb-3">
                          مشخصات فنی و شرایط لایسنس:
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          {product.specs.map((s, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between"
                            >
                              <span className="text-brand-muted dark:text-slate-400">{s.label}:</span>
                              <span className="font-bold text-brand-dark dark:text-white">{s.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Guide & Activation Rules */}
                {activeTab === "guide" && (
                  <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-brand-muted dark:text-slate-300">
                    <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/80 flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-xs text-teal-900 dark:text-teal-200">
                          نحوه دریافت لایسنس پس از پرداخت:
                        </h4>
                        <p className="text-xs text-teal-800 dark:text-teal-300 mt-1">
                          بلافاصله بعد از نهایی شدن پرداخت در درگاه بانکی یا سیستم کارت‌به‌کارت هوشمند، اطلاعات لاگین و راهنمای ورود در صفحه پیگیری سفارش برای شما نمایش داده شده و به شماره همراه و ایمیل ثبت‌شده نیز پیامک و ارسال خواهد شد.
                        </p>
                      </div>
                    </div>

                    <h4 className="font-bold text-xs text-brand-dark dark:text-white pt-2">
                      شرایط گارانتی و نکات مهم:
                    </h4>
                    <ul className="list-disc pr-5 space-y-2 text-xs">
                      <li>کلیه اشتراک‌های ارائه‌شده کاملاً قانونی و اورجینال بوده و دارای گارانتی تعویض در تمام طول مدت اعتبار هستند.</li>
                      <li>در صورت نیاز به ورود ایمیل کاربری، لطفاً ایمیل معتبر و در دسترس خود را وارد نمایید.</li>
                      <li>جهت حفظ گارانتی، از تغییر پسورد و مشخصات اصلی اکانت‌های اشتراکی خودداری فرمایید.</li>
                      <li>پشتیبانی تخصصی ارزان اکانت در تمامی روزهای هفته از طریق تلگرام آماده رفع مشکلات احتمالی کاربران گرامی می‌باشد.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Buy Box Column (5 cols) */}
          <div className="lg:col-span-5 sticky top-28 space-y-6">
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-brand-border/80 dark:border-slate-800/80 shadow-card hover:shadow-3d transition-all duration-300 space-y-6 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Pricing Header */}
              <div className="pb-5 border-b border-brand-border/80 dark:border-slate-800/80">
                {price.isOnSale && price.formattedOriginalToman ? (
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-neutral-400 dark:text-slate-500 line-through font-mono">
                      {formatPrice((price.originalToman || 0) * (price.isPerThousand ? Math.round(quantity / 1000) : quantity))} تومان
                    </span>
                    <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full shadow-2xs">
                      حراج ویژه
                    </span>
                  </div>
                ) : price.discountPercent > 0 ? (
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-neutral-400 dark:text-slate-500 line-through font-mono">
                      {formatPrice(price.publicRetailToman * (price.isPerThousand ? Math.round(quantity / 1000) : quantity))} تومان
                    </span>
                    <span className="text-[10px] bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 font-bold px-2 py-0.5 rounded-full">
                      %{price.discountPercent} تخفیف ویژه
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-brand-muted dark:text-slate-400 block font-medium">
                    مبلغ قابل پرداخت:
                  </span>
                )}

                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-3xl sm:text-4xl font-black tracking-tight ${
                    price.isOnSale ? "text-rose-600 dark:text-rose-400" : "text-brand-dark dark:text-white"
                  }`}>
                    {formattedTotalPrice}
                  </span>
                  <span className="text-sm font-bold text-brand-muted dark:text-slate-400">تومان</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-brand-muted dark:text-slate-400 mt-2">
                  <span>وضعیت تحویل اکانت:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    آنلاین و آنی
                  </span>
                </div>

                {/* Live Stock Synchronization Badge */}
                <div className="mt-3.5 p-2.5 rounded-xl border text-[11px] flex items-center justify-between gap-2 transition-all bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 truncate">
                    <RefreshCw className={`w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 ${isSyncingLive ? "animate-spin" : ""}`} />
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                      {isSyncingLive
                        ? "در حال استعلام لحظه‌ای موجودی..."
                        : liveSyncMessage || (product.inStock ? "موجود در انبار تامین‌کننده" : "ناموجود در انبار")}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    product.inStock
                      ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400"
                      : "bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-400"
                  }`}>
                    {product.inStock ? "موجود" : "ناموجود"}
                  </span>
                </div>

                {!product.inStock && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>در حال حاضر این کالا ناموجود است و امکان ثبت سفارش آن وجود ندارد.</span>
                  </div>
                )}
              </div>

              {/* Dynamic Inputs according to product requirements */}
              <div className="space-y-4 text-xs">
                {product.requiresEmail && (
                  <div>
                    <label className="block font-semibold text-brand-dark dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>ایمیل شما جهت ارسال یا فعال‌سازی:</span>
                    </label>
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-brand-surfaceDim dark:bg-slate-800 border border-brand-border dark:border-slate-700 text-brand-dark dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2.5 px-3 outline-none dir-ltr text-left font-mono transition-all"
                    />
                    <span className="text-[10px] text-neutral-400 dark:text-slate-500 mt-1 block">
                      مشخصات لایسنس یا دعوتنامه اختصاصی به این ایمیل ارسال خواهد شد.
                    </span>
                  </div>
                )}

                {product.requiresLink && (
                  <div>
                    <label className="block font-semibold text-brand-dark dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>لینک کانال، پیج یا پست هدف:</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://t.me/your_target"
                      value={customerLink}
                      onChange={(e) => setCustomerLink(e.target.value)}
                      className="w-full bg-brand-surfaceDim dark:bg-slate-800 border border-brand-border dark:border-slate-700 text-brand-dark dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2.5 px-3 outline-none dir-ltr text-left font-mono transition-all"
                    />
                  </div>
                )}

                {/* Quantity Selector (shown only if in stock) */}
                {product.inStock && (
                  price.isPerThousand ? (
                    <div>
                      <label className="block font-semibold text-brand-dark dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span>تعداد درخواستی (حداقل {product.minQty || 500}):</span>
                      </label>
                      <input
                        type="number"
                        step="500"
                        min={product.minQty || 500}
                        max={product.maxQty || 100000}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full bg-brand-surfaceDim dark:bg-slate-800 border border-brand-border dark:border-slate-700 text-brand-dark dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl py-2.5 px-3 outline-none font-mono font-bold transition-all"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-brand-dark dark:text-slate-200 block">تعداد سفارش:</span>
                          <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                            حداکثر سقف خرید: <strong className="font-mono text-teal-600 dark:text-teal-400">{maxAllowed}</strong> عدد
                          </span>
                        </div>
                        <div className="flex items-center border border-brand-border dark:border-slate-700 rounded-xl bg-brand-surfaceDim dark:bg-slate-800 overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="px-3.5 py-2 text-sm font-bold text-brand-muted dark:text-slate-300 hover:bg-neutral-200 dark:hover:bg-slate-700 active:scale-90 transition-all cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-4 py-2 font-mono font-bold text-brand-dark dark:text-white select-none">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(Math.min(maxAllowed, quantity + 1))}
                            disabled={quantity >= maxAllowed}
                            className={`px-3.5 py-2 text-sm font-bold transition-all ${
                              quantity >= maxAllowed
                                ? "text-neutral-300 dark:text-slate-600 cursor-not-allowed"
                                : "text-brand-muted dark:text-slate-300 hover:bg-neutral-200 dark:hover:bg-slate-700 active:scale-90 cursor-pointer"
                            }`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Toast Feedback */}
              {addedToast && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs flex items-center gap-2 animate-bounce">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">محصول با موفقیت به سبد خرید اضافه شد!</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleBuyNow}
                  disabled={!product.inStock}
                  className={`w-full font-black text-sm py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                    product.inStock
                      ? "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/20 hover:shadow-lg hover:scale-[1.02] active:scale-95 cursor-pointer"
                      : "bg-neutral-300 dark:bg-slate-800 text-neutral-500 dark:text-slate-500 cursor-not-allowed opacity-60"
                  }`}
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>{product.inStock ? "خرید فوری و تسویه حساب" : "این محصول ناموجود است"}</span>
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`w-full font-bold text-xs py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                    product.inStock
                      ? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md hover:shadow-lg hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-95 cursor-pointer"
                      : "bg-neutral-200 dark:bg-slate-800 text-neutral-400 dark:text-slate-600 cursor-not-allowed opacity-50"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{product.inStock ? "افزودن به سبد خرید" : "امکان افزودن وجود ندارد"}</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <span className="text-[11px] text-brand-muted dark:text-slate-400">
                  تحویل آنی مشخصات ورود به محض تکمیل موفقیت‌آمیز تراکنش
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Showcase */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-brand-border/80 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg sm:text-2xl font-black text-brand-dark dark:text-white">
                  سایر اشتراک‌های پیشنهادی و مکمل
                </h2>
                <p className="text-xs text-brand-muted dark:text-slate-400 mt-1">
                  سرویس‌های محبوب و پرطرفدار هم‌رده با این محصول
                </p>
              </div>

              <Link
                href="/products"
                className="text-teal-600 dark:text-teal-400 hover:underline text-xs font-semibold flex items-center gap-1"
              >
                <span>مشاهده بیشتر</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
              {relatedProducts.map((rp) => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky Mobile Purchase Bar (sits above MobileBottomNav on mobile and flush at bottom on tablet) */}
      <div className="lg:hidden fixed bottom-16 sm:bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-4 py-2.5 sm:py-3 shadow-2xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] text-slate-400 block">قیمت نهایی:</span>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black text-teal-600 dark:text-teal-400 font-mono truncate">
              {formattedTotalPrice}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">تومان</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {product.inStock ? (
            <>
              <button
                type="button"
                onClick={handleAddToCart}
                title="افزودن به سبد"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 border border-slate-200 dark:border-slate-700 active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>خرید فوری</span>
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl font-bold">
              ناموجود
            </span>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
