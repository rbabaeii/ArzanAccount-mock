"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  ShieldCheck,
  Zap,
  LayoutDashboard,
  PackageCheck,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  ChevronLeft,
  Shield,
  Wallet,
  Layers,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { LiveSearchDropdown } from "@/components/store/LiveSearchDropdown";
import { formatPrice, formatNumber } from "@/lib/format";

export default function Header() {
  const { categories, products, settings, cart } = useStore();
  
  const activeCategories = React.useMemo(() => {
    return categories.filter(cat => 
      products.some(p => p.categoryId === cat.id && p.isActive && p.inStock)
    );
  }, [categories, products]);
  const { user, isAuthenticated, isAdmin, openLoginModal, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = React.useRef(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Keep header visible if any menu/dropdown is open
      if (mobileMenuOpen || userDropdownOpen || categoryDropdownOpen) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (currentScrollY > 70) {
        setIsScrolled(true);
        // Scrolling down by more than 6px -> slide header up
        if (currentScrollY > lastScrollY.current + 6) {
          setIsVisible(false);
        }
        // Scrolling up by more than 6px -> smoothly slide header back in
        else if (currentScrollY < lastScrollY.current - 6) {
          setIsVisible(true);
        }
      } else {
        // Near top of page -> always show
        setIsScrolled(false);
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileMenuOpen, userDropdownOpen, categoryDropdownOpen]);

  const formattedUsdRate = formatPrice(
    Math.round(settings.usdToRialRate / 10)
  );

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "مدیر ارشد";
      case "CATALOG_MANAGER":
        return "مدیر کاتالوگ";
      case "FINANCE_ADMIN":
        return "مدیر مالی";
      case "SUPPORT_ADMIN":
        return "مدیر پشتیبانی";
      case "USER":
        return "خریدار";
      default:
        return "کاربر";
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-brand-border dark:border-slate-800 transition-all duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full pointer-events-none"
      } ${isScrolled ? "shadow-md shadow-slate-900/5 dark:shadow-black/20" : ""}`}
    >
      {/* Top Banner */}
      <div className="bg-brand-primaryDark dark:bg-slate-950 text-white text-xs py-1.5 sm:py-2 px-3 sm:px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-1.5 text-teal-100 text-[10px] sm:text-xs truncate">
            <Zap className="w-3 h-3 text-brand-accent shrink-0 animate-pulse" />
            <span className="truncate">تحویل آنلاین و قانونی کلیه اشتراک‌های دیجیتال</span>
          </div>

          <div className="flex items-center gap-3 text-teal-200 text-[10px] sm:text-[11px] shrink-0">
            <Link
              href="/orders"
              className="hover:text-white transition-colors flex items-center gap-1 text-teal-100"
            >
              <PackageCheck className="w-3.5 h-3.5 text-brand-accent" />
              <span className="hidden xs:inline sm:inline">پیگیری سفارش</span>
              <span className="inline xs:hidden sm:hidden">پیگیری</span>
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1 bg-amber-400 text-teal-950 px-2 py-0.5 rounded transition-colors font-bold shadow-xs text-[10px] sm:text-xs"
              >
                <LayoutDashboard className="w-3 h-3" />
                <span>پنل ادمین</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-1.5 sm:gap-8">
        {/* Logo & Mobile Menu Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-brand-dark dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-lg shrink-0"
            aria-label="باز کردن منو"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          <Link href="/" className="flex items-center gap-1.5 sm:gap-3 group shrink-0 min-w-0">
            {settings.siteLogo || settings.siteLogoDark ? (
              <div className="relative flex items-center shrink-0">
                {settings.siteLogo && (
                  <img
                    src={settings.siteLogo}
                    alt={settings.siteName || "ارزان اکانت"}
                    className={`h-8 sm:h-11 w-auto max-w-[110px] sm:max-w-[140px] object-contain ${
                      settings.siteLogoDark ? "dark:hidden" : ""
                    }`}
                  />
                )}
                {settings.siteLogoDark ? (
                  <img
                    src={settings.siteLogoDark}
                    alt={settings.siteName || "ارزان اکانت"}
                    className={`h-8 sm:h-11 w-auto max-w-[110px] sm:max-w-[140px] object-contain ${
                      settings.siteLogo ? "hidden dark:block" : ""
                    }`}
                  />
                ) : null}
              </div>
            ) : (
              <div className="w-8 h-8 sm:w-11 sm:h-11 bg-brand-primary text-white flex items-center justify-center font-black text-sm sm:text-xl rounded-xl shadow-sm group-hover:bg-brand-primaryDark transition-colors shrink-0">
                {settings.siteName ? settings.siteName.substring(0, 2) : "ار"}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-xs xs:text-sm sm:text-xl font-black tracking-tight text-brand-dark dark:text-white truncate max-w-[110px] xs:max-w-[150px] sm:max-w-none">
                {settings.siteName || "ارزان اکانت"}
              </span>
              <span className="text-[10px] sm:text-[11px] text-brand-muted dark:text-slate-400 font-medium hidden sm:block">
                {settings.siteTagline || "مرجع خرید مطمئن اشتراک‌های دیجیتال"}
              </span>
            </div>
          </Link>
        </div>

        {/* Live ElasticSearch Search Bar */}
        <div className="hidden md:flex flex-1 max-w-lg">
          <LiveSearchDropdown className="w-full" />
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-2 text-xs text-brand-muted dark:text-teal-200 bg-teal-50/70 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-800/60 px-3 py-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
            <span className="font-semibold text-teal-900 dark:text-teal-200">پرداخت امن و تحویل خودکار</span>
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggle className="shrink-0" />

          {/* Cart Icon & Badge */}
          <Link
            href="/cart"
            aria-label="سبد خرید"
            className="relative p-2 sm:p-2.5 text-brand-dark dark:text-slate-200 hover:text-brand-primary dark:hover:text-teal-300 hover:bg-brand-surfaceDim dark:hover:bg-slate-800 rounded-xl border border-brand-border dark:border-slate-700 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 sm:gap-2 shadow-2xs shrink-0"
          >
            <ShoppingBag className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-brand-primary dark:text-teal-400" />
            <span className="hidden sm:inline text-xs font-bold text-brand-dark dark:text-slate-200">سبد خرید</span>
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-accent text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                {totalCartCount}
              </span>
            )}
          </Link>

          {/* User Auth Dropdown / Login Button */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-brand-border dark:border-slate-700 hover:border-brand-primary dark:hover:border-teal-400 bg-white dark:bg-slate-800 hover:bg-brand-surfaceDim dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xs"
              >
                <div className="w-7 h-7 rounded-lg bg-brand-primary dark:bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name.slice(0, 1) : <User className="w-3.5 h-3.5" />}
                </div>
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-brand-dark dark:text-white max-w-[100px] truncate">
                    {user?.name || user?.phone}
                  </span>
                  <span className="text-[10px] font-semibold text-brand-accent">
                    {getRoleLabel(user?.role)}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-neutral-150 dark:border-slate-800 py-2 z-50 animate-fadeIn text-xs">
                    <div className="px-4 py-3 border-b border-neutral-100 dark:border-slate-800 bg-teal-50/40 dark:bg-slate-800/80">
                      <div className="font-bold text-brand-dark dark:text-white">{user?.name || "کاربر گرامی"}</div>
                      <div className="text-[11px] text-neutral-500 dark:text-slate-400 font-mono mt-0.5" dir="ltr">
                        {user?.phone}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                        <Shield className="w-3 h-3" />
                        <span>{getRoleLabel(user?.role)}</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-neutral-50 dark:hover:bg-slate-800 text-neutral-700 dark:text-slate-200 font-medium transition-colors"
                      >
                        <User className="w-4 h-4 text-brand-primary dark:text-teal-400" />
                        <span>پروفایل و مشخصات من</span>
                      </Link>

                      <Link
                        href="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-neutral-50 dark:hover:bg-slate-800 text-neutral-700 dark:text-slate-200 font-medium transition-colors"
                      >
                        <PackageCheck className="w-4 h-4 text-brand-primary dark:text-teal-400" />
                        <span>سفارش‌ها و لایسنس‌های من</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-bold transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>ورود به پنل مدیریت</span>
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-neutral-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-right transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>خروج از حساب کاربری</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl border border-brand-primary/30 dark:border-teal-600/40 bg-teal-50/60 dark:bg-teal-950/50 hover:bg-teal-100/70 dark:hover:bg-teal-900/60 text-brand-primary dark:text-teal-300 font-bold text-xs transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xs shrink-0"
            >
              <User className="w-4 h-4 text-brand-primary dark:text-teal-300 shrink-0" />
              <span className="hidden xs:inline">ورود / ثبت‌نام</span>
              <span className="inline xs:hidden">ورود</span>
            </button>
          )}
        </div>
      </div>

      {/* Categories Bar */}
      <nav className="bg-white dark:bg-slate-900/90 border-t border-brand-border dark:border-slate-800 px-2.5 sm:px-4 transition-colors relative z-30 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4 py-1.5 sm:py-2 text-xs font-semibold text-brand-muted dark:text-slate-400">
          {/* Categories Dropdown (Fixed, not scrolled) */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-300 font-bold hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-all border border-teal-200/60 dark:border-teal-800/60 shadow-2xs text-[11px] sm:text-xs"
            >
              <Layers className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
              <span>دسته‌بندی‌ها</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${categoryDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Flyout */}
            {categoryDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/20"
                  onClick={() => setCategoryDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm max-h-[70vh] sm:max-h-96 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-slate-800 p-2 z-50 animate-fadeIn divide-y divide-neutral-100 dark:divide-slate-800">
                  <div className="p-2.5 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white sticky top-0 bg-white dark:bg-slate-900 z-10 border-b border-neutral-100 dark:border-slate-800">
                    <span>همه دسته‌بندی‌ها ({activeCategories.length})</span>
                    <Link
                      href="/categories"
                      onClick={() => setCategoryDropdownOpen(false)}
                      className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>صفحه دسته‌ها</span>
                      <ChevronLeft className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="py-1.5 space-y-0.5">
                    {activeCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.slug}`}
                        onClick={() => setCategoryDropdownOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-teal-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        <span className="font-medium">{cat.title}</span>
                        <ChevronLeft className="w-3.5 h-3.5 text-neutral-300 dark:text-slate-600 shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Links Scroller (Separated from dropdown so it doesn't clip dropdown) */}
          <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar scrollbar-none py-0.5">
            <Link
              href="/products"
              className="hover:text-brand-primary dark:hover:text-teal-300 transition-colors flex items-center gap-1 font-bold text-brand-primary dark:text-teal-400 shrink-0 px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <span>کاتالوگ محصولات</span>
            </Link>

            <span className="text-neutral-300 dark:text-slate-700 hidden sm:inline">|</span>

            {/* Top Categories Direct Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {activeCategories.slice(0, 5).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50/80 dark:hover:bg-slate-800 px-2 sm:px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap text-neutral-600 dark:text-slate-300 text-xs font-medium shrink-0"
                >
                  {cat.title}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/categories"
            className="hidden md:flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline shrink-0 bg-teal-50/50 dark:bg-teal-950/40 px-2.5 py-1 rounded-lg"
          >
            <span>آرشیو دسته‌ها</span>
            <ChevronLeft className="w-3 h-3" />
          </Link>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-brand-border dark:border-slate-800 p-4 space-y-4 animate-fadeIn transition-colors">
          <div className="w-full">
            <LiveSearchDropdown
              className="w-full"
              placeholder="جستجو در محصولات..."
              onSelectProduct={() => setMobileMenuOpen(false)}
            />
          </div>

          <div className="space-y-1 pt-2 border-t border-neutral-100 dark:border-slate-800 text-xs font-medium">
            <div className="pb-2 mb-2 border-b border-neutral-100 dark:border-slate-800">
              <ThemeToggle showLabel className="w-full justify-between px-3 py-2" />
            </div>

            {isAuthenticated ? (
              <div className="p-2 mb-2 bg-teal-50 dark:bg-slate-800 rounded-xl border border-teal-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-brand-dark dark:text-white">{user?.name || user?.phone}</div>
                  <div className="text-[10px] text-brand-accent font-semibold">{getRoleLabel(user?.role)}</div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="text-rose-600 dark:text-rose-400 font-bold text-xs p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                >
                  خروج
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLoginModal();
                }}
                className="w-full text-right p-2.5 text-brand-primary dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/50 rounded-xl mb-2 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>ورود / ثبت‌نام در سایت</span>
              </button>
            )}

            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-2 text-brand-primary dark:text-teal-300 font-bold hover:bg-neutral-50 dark:hover:bg-slate-800 rounded"
            >
              کاتالوگ جامع محصولات
            </Link>
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-2 text-brand-dark dark:text-slate-200 hover:bg-neutral-50 dark:hover:bg-slate-800 rounded"
            >
              پروفایل و مشخصات کاربری
            </Link>
            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-2 text-brand-dark dark:text-slate-200 hover:bg-neutral-50 dark:hover:bg-slate-800 rounded"
            >
              رهگیری سفارش و مشاهده لایسنس
            </Link>
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-2 text-brand-dark dark:text-slate-200 hover:bg-neutral-50 dark:hover:bg-slate-800 rounded"
            >
              سبد خرید ({totalCartCount} آیتم)
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-2 text-brand-accent font-bold hover:bg-neutral-50 dark:hover:bg-slate-800 rounded"
              >
                ورود به پنل مدیریت
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
