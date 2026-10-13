"use client";

import React, { useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { useAuth, UserRole } from "@/context/AuthContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { LiveSearchDropdown } from "@/components/store/LiveSearchDropdown";
import { formatPrice } from "@/lib/format";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Percent,
  FolderTree,
  Coins,
  Settings,
  Activity,
  Mail,
  BarChart3,
  ScrollText,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Wallet,
  Menu,
  X,
  CheckCircle2,
  Users,
  Shield,
  ShieldAlert,
  LogOut,
  User,
  Lock,
  ArrowRight,
  Undo2,
  Tag,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Smartphone,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { settings, isLoadingSync, syncWithIrMarket, orders } = useStore();
  const { user, isAuthenticated, isAdmin, isLoading: isAuthLoading, logout, openLoginModal, switchAdminRole } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [syncToast, setSyncToast] = useState(false);

  // Restore collapsed state from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("admin_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const handleSync = async () => {
    await syncWithIrMarket();
    setSyncToast(true);
    setTimeout(() => setSyncToast(false), 3500);
  };

  const pendingOrdersCount = orders.filter((o) => o.status === "processing").length;
  const pendingRefundsCount = orders.filter((o) => o.status === "refund_requested").length;

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "مدیر ارشد سامانه";
      case "CATALOG_MANAGER":
        return "مدیر کاتالوگ و انبار";
      case "FINANCE_ADMIN":
        return "مدیر مالی و تخفیف‌ها";
      case "SUPPORT_ADMIN":
        return "مدیر پشتیبانی و سفارشات";
      default:
        return "مدیر سیستم";
    }
  };

  const isItemVisible = (itemHref: string) => {
    if (itemHref === "/admin/admin-activities") return user?.role === "SUPER_ADMIN";
    if (itemHref === "/admin/orders/refunds") return user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_ADMIN";
    if (itemHref === "/admin/withdrawals") return user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_ADMIN";
    if (itemHref === "/admin/payments") return user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_ADMIN";
    if (itemHref === "/admin/settings/email") return user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_ADMIN";
    if (itemHref === "/admin/settings/sms") return user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_ADMIN";
    if (user?.role === "SUPER_ADMIN") return true;
    if (itemHref === "/admin") return true;
    if (user?.role === "CATALOG_MANAGER") {
      return ["/admin/products", "/admin/inventory", "/admin/categories", "/admin/tags"].includes(itemHref);
    }
    if (user?.role === "FINANCE_ADMIN") {
      return ["/admin/settings/currency", "/admin/discounts", "/admin/analytics", "/admin/orders/refunds", "/admin/withdrawals", "/admin/payments"].includes(itemHref);
    }
    if (user?.role === "SUPPORT_ADMIN") {
      return ["/admin/orders"].includes(itemHref);
    }
    return false;
  };

  const isCurrentRouteAllowed = () => {
    if (pathname.startsWith("/admin/admin-activities")) return user?.role === "SUPER_ADMIN";
    if (pathname.startsWith("/admin/orders/refunds")) return user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_ADMIN";
    if (pathname.startsWith("/admin/withdrawals")) return user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_ADMIN";
    if (pathname.startsWith("/admin/payments")) return user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_ADMIN";
    if (pathname.startsWith("/admin/settings/email")) return user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_ADMIN";
    if (pathname.startsWith("/admin/settings/sms")) return user?.role === "SUPER_ADMIN" || user?.role === "FINANCE_ADMIN";
    if (user?.role === "SUPER_ADMIN") return true;
    if (pathname === "/admin") return true;
    if (user?.role === "CATALOG_MANAGER") {
      return ["/admin/products", "/admin/inventory", "/admin/categories", "/admin/tags"].some((p) => pathname.startsWith(p));
    }
    if (user?.role === "FINANCE_ADMIN") {
      return ["/admin/settings/currency", "/admin/discounts", "/admin/analytics", "/admin/orders/refunds", "/admin/withdrawals", "/admin/payments"].some((p) => pathname.startsWith(p));
    }
    if (user?.role === "SUPPORT_ADMIN") {
      return ["/admin/orders"].some((p) => pathname.startsWith(p)) && !pathname.startsWith("/admin/orders/refunds");
    }
    return false;
  };

  const catalogNavGroups: NavGroup[] = [
    {
      groupTitle: "بخش‌های کلیدی و کاتالوگ",
      items: [
        {
          title: "مرکز فرماندهی (داشبورد)",
          href: "/admin",
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          title: "مدیریت کاتالوگ و محصولات",
          href: "/admin/products",
          icon: <Package className="w-4 h-4" />,
        },
        {
          title: "مدیریت سفارشات",
          href: "/admin/orders",
          badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} در انتظار` : undefined,
          badgeColor: "bg-amber-400 text-teal-950 font-bold",
          icon: <ShoppingCart className="w-4 h-4" />,
        },
        {
          title: "درخواست‌های عودت وجه",
          href: "/admin/orders/refunds",
          icon: <Undo2 className="w-4 h-4" />,
          badge: pendingRefundsCount > 0 ? `${pendingRefundsCount} در انتظار` : "شبا",
          badgeColor: pendingRefundsCount > 0 ? "bg-amber-400 text-teal-950 font-bold" : "bg-rose-500/90 text-white font-bold",
        },
        {
          title: "تسویه حساب و کیف پول",
          href: "/admin/withdrawals",
          icon: <Wallet className="w-4 h-4" />,
          badge: "تسویه",
          badgeColor: "bg-emerald-600/90 text-white font-bold",
        },
        {
          title: "پرداخت‌های کارت‌به‌کارت",
          href: "/admin/payments",
          icon: <CreditCard className="w-4 h-4" />,
          badge: "CartBeCart",
          badgeColor: "bg-teal-600/90 text-white font-bold",
        },
        {
          title: "انبار و کنترل موجودی",
          href: "/admin/inventory",
          icon: <Boxes className="w-4 h-4" />,
        },
        {
          title: "دسته‌بندی‌ها",
          href: "/admin/categories",
          icon: <FolderTree className="w-4 h-4" />,
        },
        {
          title: "مدیریت برچسب‌ها و تگ‌ها",
          href: "/admin/tags",
          icon: <Tag className="w-4 h-4" />,
          badge: "هوشمند",
          badgeColor: "bg-teal-700/80 text-teal-100 font-bold",
        },
      ].filter((item) => isItemVisible(item.href)),
    },
    {
      groupTitle: "عملیات، مدیریت و امنیت",
      items: [
        {
          title: "کاربران و مدیران (RBAC)",
          href: "/admin/users",
          icon: <Users className="w-4 h-4" />,
        },
        {
          title: "نظارت بر فعالیت مدیران",
          href: "/admin/admin-activities",
          icon: <Activity className="w-4 h-4" />,
          badge: "مدیر ارشد",
          badgeColor: "bg-purple-600/90 text-white font-bold",
        },
        {
          title: "تنظیمات ارز و قیمت‌گذاری",
          href: "/admin/settings/currency",
          icon: <Coins className="w-4 h-4" />,
        },
        {
          title: "تخفیف‌ها و کوپن‌ها",
          href: "/admin/discounts",
          icon: <Percent className="w-4 h-4" />,
        },
        {
          title: "گزارشات و هوش تجاری",
          href: "/admin/analytics",
          icon: <BarChart3 className="w-4 h-4" />,
        },
        {
          title: "لاگ فعالیت‌ها و ردپای سیستم",
          href: "/admin/logs",
          icon: <ScrollText className="w-4 h-4" />,
        },
        {
          title: "تنظیمات سرور ایمیل (SMTP)",
          href: "/admin/settings/email",
          icon: <Mail className="w-4 h-4" />,
        },
        {
          title: "تنظیمات و تاریخچه پیامک (SMS)",
          href: "/admin/settings/sms",
          icon: <Smartphone className="w-4 h-4" />,
          badge: "پترن زنده",
          badgeColor: "bg-teal-600/90 text-white font-bold",
        },
        {
          title: "تنظیمات عمومی سیستم",
          href: "/admin/settings",
          icon: <Settings className="w-4 h-4" />,
        },
      ].filter((item) => isItemVisible(item.href)),
    },
  ].filter((group) => group.items.length > 0);

  const formattedTomanRate = formatPrice(Math.round(settings.usdToRialRate / 10));

  const walletToman = formatPrice(
    Math.round((settings.walletBalanceUsd * settings.usdToRialRate) / 10)
  );

  // 1. Loading State
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-teal-200 text-xs font-bold animate-pulse">در حال اعتبارسنجی سطح دسترسی مدیر...</p>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-8 shadow-2xl text-white">
          <div className="w-16 h-16 bg-amber-400/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-400/30">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black mb-2">ورود به کنترل سنتر مدیریت</h1>
          <p className="text-xs text-teal-200/80 mb-6 leading-relaxed">
            دسترسی به کنترل سنتر نیازمند احراز هویت با شماره پرسنل یا مدیر سیستم است.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-xs text-right space-y-2">
            <div className="text-teal-300 font-bold">اطلاعات ورود تستی مدیران:</div>
            <div className="flex justify-between items-center text-[11px] text-teal-100">
              <span>مدیر کل سامانه:</span>
              <span className="font-mono font-bold bg-teal-900/60 px-2 py-0.5 rounded">09181111111</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-teal-100">
              <span>کد تأیید یکبارمصرف:</span>
              <span className="font-mono font-bold text-amber-300 bg-amber-900/40 px-2 py-0.5 rounded">11111</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={openLoginModal}
              className="w-full bg-brand-accent hover:bg-amber-500 text-teal-950 font-black text-xs py-3 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>ورود با شماره موبایل مدیریت</span>
            </button>

            <NextLink
              href="/"
              className="w-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به فروشگاه</span>
            </NextLink>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated but regular USER (403 Forbidden)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-md border border-rose-500/30 rounded-3xl p-8 shadow-2xl text-white">
          <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-rose-500/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black mb-2 text-rose-300">خطای دسترسی ۴۰۳</h1>
          <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
            شماره شما (<span className="font-mono font-bold text-white" dir="ltr">{user?.phone}</span>) به عنوان
            <span className="text-amber-300 font-bold px-1.5 py-0.5 mx-1 bg-amber-400/10 rounded">خریدار عادی</span>
            ثبت شده است و اجازه دسترسی به کنترل سنتر مدیران را ندارد.
          </p>

          <div className="p-3 bg-white/5 rounded-xl text-[11px] text-neutral-300 mb-6 border border-white/10 text-right">
            <span>برای ورود به پنل، با شماره مدیر ارشد </span>
            <strong className="text-amber-300 font-mono">09181111111</strong>
            <span> و کد تایید </span>
            <strong className="text-amber-300 font-mono">11111</strong>
            <span> وارد شوید.</span>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                logout();
                openLoginModal();
              }}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج و ورود مجدد با شماره مدیر</span>
            </button>

            <NextLink
              href="/"
              className="w-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-teal-300" />
              <span>بازگشت به ویترین فروشگاه</span>
            </NextLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-admin-bg dark:bg-slate-950 flex flex-col md:flex-row text-admin-text dark:text-slate-100 transition-colors">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-admin-primary dark:bg-slate-900 text-white p-4 flex items-center justify-between shadow-md border-b border-white/10 dark:border-slate-800">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 hover:bg-white/10 dark:hover:bg-slate-800 rounded-lg"
          aria-label="باز کردن منو"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <span className="font-black text-sm">کنترل سنتر ارزان اکانت</span>
        <div className="flex items-center gap-1.5">
          <select
            value={user?.role || "SUPER_ADMIN"}
            onChange={(e) => switchAdminRole(e.target.value as UserRole)}
            className="bg-white/10 text-white text-[10px] font-bold py-1 px-1.5 rounded-lg outline-none cursor-pointer max-w-[110px] truncate"
            title="سوییچ نقش‌های مدیر (RBAC)"
          >
            <option value="SUPER_ADMIN" className="bg-slate-900 text-white">مدیر ارشد</option>
            <option value="CATALOG_MANAGER" className="bg-slate-900 text-white">مدیر انبار</option>
            <option value="FINANCE_ADMIN" className="bg-slate-900 text-white">مدیر مالی</option>
            <option value="SUPPORT_ADMIN" className="bg-slate-900 text-white">مدیر پشتیبانی</option>
          </select>
          <ThemeToggle />
          <NextLink href="/" className="p-1.5 hover:bg-white/10 dark:hover:bg-slate-800 rounded-lg" title="فروشگاه">
            <ShoppingBag className="w-5 h-5" />
          </NextLink>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar (HypeStore Teal Horizon Theme) - Fixed full height, Collapsible on Desktop */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 h-screen bg-gradient-to-b from-teal-950 to-brand-primary text-white flex flex-col justify-between transition-all duration-300 shadow-2xl ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        } ${isCollapsed ? "w-72 md:w-20 p-3" : "w-72 p-5"}`}
      >
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none pr-1">
          {/* Logo & Brand & Collapse Toggle */}
          <div
            className={`flex items-center pb-4 border-b border-white/10 shrink-0 ${
              isCollapsed ? "justify-center md:flex-col gap-2" : "justify-between"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-brand-primary flex items-center justify-center font-black text-xl shadow-md shrink-0">
                ار
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <h2 className="font-black text-sm tracking-tight truncate">HypeStore Control Center</h2>
                  <span className="text-[10px] text-teal-300 font-medium truncate block">پنل مدیریت ارزان اکانت</span>
                </div>
              )}
            </div>

            {/* Desktop Collapse/Expand Toggle Button */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-teal-200 hover:text-white transition-all cursor-pointer shrink-0"
              title={isCollapsed ? "باز کردن منوی کناری" : "جمع کردن منوی کناری"}
              aria-label={isCollapsed ? "باز کردن منوی کناری" : "جمع کردن منوی کناری"}
            >
              {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 space-y-4 text-xs">
            {catalogNavGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {!isCollapsed ? (
                  <span className="text-[10px] font-bold text-teal-300/80 px-3 tracking-wider block mb-1.5 uppercase">
                    {group.groupTitle}
                  </span>
                ) : (
                  <div className="my-2 border-t border-white/10" />
                )}
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <NextLink
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      title={item.title}
                      className={`group flex items-center gap-2 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
                        isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
                      } ${
                        isActive
                          ? "bg-gradient-to-r from-teal-500/30 to-emerald-500/20 text-white shadow-sm border border-teal-400/40 font-bold backdrop-blur-xs"
                          : "text-teal-100 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? "justify-center" : ""}`}>
                        <span className="shrink-0 text-teal-300 group-hover:scale-110 transition-transform duration-200">
                          {item.icon}
                        </span>
                        {!isCollapsed && <span className="truncate text-xs">{item.title}</span>}
                      </div>
                      {!isCollapsed && item.badge && (
                        <span
                          className={`shrink-0 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-full font-sans leading-none shadow-xs transition-transform duration-200 group-hover:scale-105 ${
                            item.badgeColor || "bg-white/20 text-white"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isCollapsed && item.badge && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title={item.badge} />
                      )}
                    </NextLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Info & Current Admin Profile */}
        <div className="pt-4 border-t border-white/10 space-y-3 shrink-0">
          {/* Admin Profile Card */}
          <div
            className={`bg-white/10 rounded-xl border border-white/10 flex items-center ${
              isCollapsed ? "flex-col p-2 gap-2" : "justify-between p-3"
            }`}
          >
            <NextLink
              href="/profile"
              className="flex items-center gap-2.5 overflow-hidden hover:opacity-80 transition-opacity"
              title="پروفایل من"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-400 text-teal-950 font-black text-xs flex items-center justify-center shrink-0">
                {user?.name ? user.name.slice(0, 1) : <Shield className="w-4 h-4" />}
              </div>
              {!isCollapsed && (
                <div className="truncate text-right">
                  <div className="text-xs font-bold text-white truncate">{user?.name || user?.phone}</div>
                  <div className="text-[10px] text-teal-300 font-semibold">{getRoleBadge(user?.role)}</div>
                </div>
              )}
            </NextLink>
            <button
              onClick={logout}
              title="خروج از حساب مدیریت"
              className="p-1.5 text-teal-300 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* irMarket Balance Card */}
          {!isCollapsed ? (
            <div className="bg-white/10 p-3 rounded-xl border border-white/10">
              <div className="flex items-center justify-between text-[11px] text-teal-200">
                <span className="flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-brand-accent" />
                  موجودی irMarket
                </span>
                <span className="font-mono font-bold text-white">${settings.walletBalanceUsd}</span>
              </div>
              <span className="text-[10px] text-teal-300 block mt-1">
                معادل: {walletToman} تومان
              </span>
            </div>
          ) : (
            <div
              className="bg-white/10 p-2 rounded-xl border border-white/10 text-center"
              title={`موجودی irMarket: $${settings.walletBalanceUsd} (${walletToman} تومان)`}
            >
              <Wallet className="w-4 h-4 mx-auto text-brand-accent" />
            </div>
          )}

          {/* Storefront Link */}
          <NextLink
            href="/"
            title="مشاهده ویترین فروشگاه"
            className={`flex items-center justify-center gap-2 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors ${
              isCollapsed ? "px-1.5" : "px-3"
            }`}
          >
            {!isCollapsed && <span>مشاهده ویترین فروشگاه</span>}
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </NextLink>
        </div>
      </aside>

      {/* Desktop spacer for fixed sidebar width */}
      <div
        className={`hidden md:block shrink-0 transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-72"
        }`}
        aria-hidden="true"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="hidden md:flex h-16 bg-white dark:bg-slate-900 border-b border-admin-borderLight dark:border-slate-800 px-8 items-center justify-between sticky top-0 z-30 shadow-2xs transition-colors">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 bg-teal-50/70 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-800/60 px-3 py-1.5 rounded-lg">
              <span className="text-teal-800 dark:text-teal-300">نرخ پایه دلار:</span>
              <span className="font-bold text-brand-primary dark:text-teal-400 font-mono">{formattedTomanRate} تومان</span>
            </div>

            <div className="text-neutral-400 dark:text-slate-500 hidden xl:block">
              <span>آخرین همگام‌سازی کاتالوگ: {settings.lastSyncTime}</span>
            </div>
          </div>

          {/* Admin Live Search */}
          <div className="flex-1 max-w-sm mx-4">
            <LiveSearchDropdown
              scope="admin"
              placeholder="جستجوی سریع در کاتالوگ و تگ‌ها..."
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Quick RBAC Role Switcher */}
            <div className="flex items-center gap-1.5 bg-teal-50/80 dark:bg-slate-800 border border-teal-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <Shield className="w-3.5 h-3.5 text-brand-primary dark:text-teal-400 shrink-0" />
              <select
                value={user?.role || "SUPER_ADMIN"}
                onChange={(e) => switchAdminRole(e.target.value as UserRole)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer pr-1"
                title="سوییچ نقش‌های مدیر جهت تست دسترسی‌های RBAC"
              >
                <option value="SUPER_ADMIN" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                  مدیر ارشد (09181111111)
                </option>
                <option value="CATALOG_MANAGER" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                  مدیر کاتالوگ و انبار (09130000002)
                </option>
                <option value="FINANCE_ADMIN" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                  مدیر مالی و عودت وجه (09140000003)
                </option>
                <option value="SUPPORT_ADMIN" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                  مدیر پشتیبانی و سفارشات (09120000001)
                </option>
              </select>
            </div>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Sync Button */}
            <button
              onClick={handleSync}
              disabled={isLoadingSync}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md shadow-teal-500/20 disabled:opacity-70"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSync ? "animate-spin" : ""}`} />
              <span>{isLoadingSync ? "در حال استعلام از irMarket..." : "همگام‌سازی با API مرجع"}</span>
            </button>

            {/* Back to store */}
            <NextLink
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-slate-300 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-slate-700 px-3 py-2 rounded-xl transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 shadow-2xs"
            >
              <ShoppingBag className="w-4 h-4 text-neutral-500 dark:text-slate-400" />
              <span>مشاهده سایت</span>
            </NextLink>
          </div>
        </header>

        {/* Sync Toast */}
        {syncToast && (
          <div className="fixed bottom-6 left-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-xl text-xs flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>محصولات، آخرین قیمت‌های دلاری و موجودی از irMarket با موفقیت همگام شدند!</span>
          </div>
        )}

        {/* Page Body with Route Guard Check */}
        <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
          {isCurrentRouteAllowed() ? (
            children
          ) : (
            <div className="max-w-xl mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-neutral-200 dark:border-slate-800 shadow-sm text-center">
              <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-900/60">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-neutral-900 dark:text-white mb-2">محدودیت سطح دسترسی</h2>
              <p className="text-xs text-neutral-600 dark:text-slate-300 mb-6 leading-relaxed">
                سطح کاربری شما (<span className="font-bold text-teal-800 dark:text-teal-300">{getRoleBadge(user?.role)}</span>) اجازه دسترسی به این بخش را ندارد. این بخش تنها توسط مدیران با سطح دسترسی بالاتر قابل مشاهده است.
              </p>
              <NextLink
                href="/admin"
                className="inline-flex items-center gap-2 bg-brand-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-brand-primaryDark transition-all"
              >
                <span>بازگشت به داشبورد مدیریت</span>
              </NextLink>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
