"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, ShoppingBag, PackageCheck, User } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { formatNumber } from "@/lib/format";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cart } = useStore();
  const { isAuthenticated, openLoginModal } = useAuth();

  // Hide on admin routes or when inside full checkout payment flow
  if (pathname.startsWith("/admin") || pathname.startsWith("/payment/card")) {
    return null;
  }

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    {
      label: "خانه",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "دسته‌ها",
      href: "/categories",
      icon: Layers,
      isActive: pathname.startsWith("/category") || pathname === "/categories",
    },
    {
      label: "سبد خرید",
      href: "/cart",
      icon: ShoppingBag,
      isActive: pathname === "/cart",
      badge: totalCartCount > 0 ? totalCartCount : null,
    },
    {
      label: "سفارش‌ها",
      href: "/orders",
      icon: PackageCheck,
      isActive: pathname === "/orders",
    },
    {
      label: "حساب من",
      href: isAuthenticated ? "/profile" : "#",
      icon: User,
      isActive: pathname === "/profile",
      onClick: !isAuthenticated ? openLoginModal : undefined,
    },
  ];

  return (
    <nav
      aria-label="منوی دسترسی سریع موبایل"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-lg shadow-black/5 dark:shadow-black/30 backdrop-blur-lg pb-safe"
    >
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const content = (
            <div className="flex flex-col items-center justify-center w-full h-full py-1 text-center transition-all duration-200 active:scale-95">
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    item.isActive
                      ? "text-teal-600 dark:text-teal-400 scale-110"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                />
                {item.badge !== null && (
                  <span className="absolute -top-1.5 -right-2.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse">
                    {formatNumber(item.badge)}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] mt-1 font-medium truncate ${
                  item.isActive
                    ? "text-teal-700 dark:text-teal-300 font-bold"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {item.label}
              </span>
              {item.isActive && (
                <div
                  aria-hidden="true"
                  className="w-4 h-0.5 mt-0.5 rounded-full bg-teal-600 dark:bg-teal-400"
                />
              )}
            </div>
          );

          if (item.onClick) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="flex items-center justify-center touch-manipulation focus:outline-none"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-center touch-manipulation focus:outline-none"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
