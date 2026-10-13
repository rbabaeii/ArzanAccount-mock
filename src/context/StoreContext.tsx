"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Category, Product, SystemSettings, Order, Coupon, AuditLog, CartItem } from "@/types";
import {
  initialCategories,
  initialProducts,
  initialSettings,
  initialOrders,
  initialCoupons,
  initialAuditLogs,
} from "@/data/mockData";
import { api } from "@/lib/api";
import { formatPrice, formatNumber, toEnglishDigits } from "@/lib/format";
import { isCouponExpired } from "@/lib/date";

export interface CalculatedPrice {
  rial: number;
  toman: number;
  formattedToman: string;
  usdPrice: number;
  costToman: number;
  formattedCostToman: string;
  retailPriceUsd: number;
  publicRetailToman: number;
  formattedPublicRetailToman: string;
  profitToman: number;
  discountPercent: number;
  marginPercent: number;
  isCustomMarginActive: boolean;
  isPerThousand: boolean;
  isOnSale: boolean;
  originalToman: number;
  formattedOriginalToman: string;
}

interface StoreContextType {
  products: Product[];
  categories: Category[];
  settings: SystemSettings;
  orders: Order[];
  coupons: Coupon[];
  auditLogs: AuditLog[];
  cart: CartItem[];
  appliedCoupon: Coupon | null;
  activeProducts: Product[];
  isLoadingSync: boolean;
  isLoadingInitial: boolean;
  isBackendConnected: boolean;

  // Actions
  createProduct: (product: Partial<Product>, adminInfo?: any) => Promise<Product | undefined>;
  toggleProductActive: (id: string, adminInfo?: any) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>, adminInfo?: any) => Promise<void>;
  deleteProduct: (id: string, adminInfo?: any) => Promise<void>;
  addCategory: (category: Omit<Category, "id">) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateSettings: (updates: Partial<SystemSettings>) => Promise<void>;
  calculateProductPrice: (product: Product) => CalculatedPrice;
  syncWithIrMarket: () => Promise<void>;
  refreshFromBackend: () => Promise<void>;
  syncCurrencyNow: () => Promise<any>;
  updateCurrencySyncConfig: (config: {
    apiKey?: string;
    intervalMinutes?: number;
    enableAutoSync?: boolean;
  }) => Promise<any>;

  // Cart Actions
  addToCart: (product: Product, quantity?: number, email?: string, link?: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (
    code: string,
    userContext?: { id?: string; phone?: string; email?: string } | null,
    cartSubtotal?: number
  ) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;

  createOrder: (orderData: Omit<Order, "id" | "orderNumber" | "createdAt"> & { orderNumber?: string; id?: string }) => Order;
  updateOrderStatus: (
    orderId: string,
    status: Order["status"],
    accounts?: string[],
    adminInfo?: { id?: string; name?: string; phone?: string; role?: string }
  ) => Promise<void> | void;
  addAdminAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void;
  getMaxAllowedPurchase: (product: Product) => number;
  addCoupon: (coupon: Omit<Coupon, "id">) => Promise<void> | void;
  addCoupons: (coupons: Omit<Coupon, "id">[]) => Promise<void> | void;
  updateCoupon: (couponId: string, updates: Partial<Coupon>) => Promise<void> | void;
  toggleCoupon: (couponId: string) => Promise<void> | void;
  deleteCoupon: (couponId: string) => Promise<void> | void;
  requestRefund: (orderId: string, reason: string, cardNumber?: string, sheba?: string) => Promise<{ success: boolean; message: string }>;
  processRefundOrder: (orderId: string, refundMethod: "bank_card" | "wallet", trackingCode?: string, receiptUrl?: string, adminName?: string) => void;
  rejectRefundOrder: (orderId: string, rejectionReason: string, newStatus?: Order["status"]) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

function mapBackendProduct(bp: any): Product {
  return {
    id: bp.id,
    externalId: bp.externalId,
    name: bp.name,
    customTitle: bp.customTitle || bp.nameFa || bp.name,
    costPriceUsd: bp.costPriceUsd,
    retailPriceUsd: bp.retailPriceUsd ?? bp.costPriceUsd,
    priceToman: bp.priceToman || bp.calculatedPrice?.finalToman,
    calculatedPrice: bp.calculatedPrice,
    pricingUnit: bp.pricingUnit === "per_1000" ? "per_1000" : "unit",
    minQty: bp.minQty ?? 1,
    maxQty: bp.maxQty ?? 1,
    stockCount: bp.stockCount ?? 100,
    inStock: bp.inStock !== false,
    rating: bp.rating ?? 4.9,
    reviewCount: bp.reviewCount ?? 18,
    requiresEmail: bp.requiresEmail ?? false,
    requiresLink: bp.requiresLink ?? false,
    requiresComments: bp.requiresComments ?? false,
    isActive: bp.isActive ?? false,
    isFeatured: bp.isFeatured ?? false,
    isFlashDeal: bp.isFlashDeal ?? false,
    customMarginPercent: bp.customMarginPercent ?? undefined,
    categoryId: bp.categoryId || "cat-other",
    description: bp.description || "سرویس اورجینال با تحویل خودکار و گارانتی کامل",
    persianDescription: bp.persianDescription || undefined,
    salePriceToman: bp.salePriceToman,
    discountPercent: bp.discountPercent,
    tags: bp.tags
      ? Array.isArray(bp.tags)
        ? bp.tags
        : typeof bp.tags === "string" && bp.tags.startsWith("[")
        ? (() => { try { return JSON.parse(bp.tags); } catch { return []; } })()
        : typeof bp.tags === "string"
        ? bp.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : []
      : [],
    badge: bp.isFlashDeal ? "تخفیف ویژه" : bp.isFeatured ? "ویژه" : undefined,
    image:
      bp.image ||
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    specs: bp.rawDetails ? [] : undefined,
  };
}

function mapBackendCategory(bc: any): Category {
  return {
    id: bc.id,
    title: bc.titleFa || bc.title,
    slug: bc.slug,
    description: bc.description || "",
    icon: bc.icon || "Sparkles",
    orderIndex: bc.orderIndex ?? 0,
  };
}

function mapBackendOrder(bo: any): Order {
  let deliveredAccounts: string[] = [];
  if (Array.isArray(bo.deliveredAccounts)) {
    deliveredAccounts = bo.deliveredAccounts;
  } else if (typeof bo.deliveredAccounts === "string") {
    try {
      if (bo.deliveredAccounts.startsWith("[")) {
        deliveredAccounts = JSON.parse(bo.deliveredAccounts);
      } else if (bo.deliveredAccounts.trim()) {
        deliveredAccounts = [bo.deliveredAccounts];
      }
    } catch {
      deliveredAccounts = [bo.deliveredAccounts];
    }
  }

  let rawItems: any = bo.items;
  if (typeof rawItems === "string") {
    try {
      rawItems = JSON.parse(rawItems);
    } catch {
      rawItems = [];
    }
  }
  if (Array.isArray(rawItems)) {
    rawItems = rawItems.flat().filter(Boolean);
  } else {
    rawItems = [];
  }

  let parsedItems = rawItems.filter((it: any) => it && typeof it === "object" && !Array.isArray(it));

  if (parsedItems.length === 0) {
    let fallbackTitle = "محصول دیجیتال";
    if (deliveredAccounts && deliveredAccounts.length > 0) {
      const match = deliveredAccounts[0].match(/\(([^)]+)\)/);
      if (match && match[1]) {
        fallbackTitle = match[1].replace(/#\d+/g, "").trim();
      }
    }
    parsedItems = [
      {
        productId: "prod-item",
        productTitle: fallbackTitle,
        quantity: 1,
        priceToman: bo.totalPriceToman || 0,
        priceUsd: bo.totalPriceUsd || 0,
      },
    ];
  } else {
    parsedItems = parsedItems.map((it: any) => {
      const qty = Number(it.quantity) || 1;
      let priceToman = Number(it.priceToman) || 0;
      let priceUsd = Number(it.priceUsd) || 0;
      if (priceToman === 0 && bo.totalPriceToman && parsedItems.length === 1) {
        priceToman = Math.round(bo.totalPriceToman / qty);
      }
      if (priceUsd === 0 && bo.totalPriceUsd && parsedItems.length === 1) {
        priceUsd = Number((bo.totalPriceUsd / qty).toFixed(2));
      }
      return {
        productId: it.productId || "prod-item",
        productTitle: it.productTitle || "محصول دیجیتال",
        quantity: qty,
        priceToman,
        priceUsd,
      };
    });
  }

  return {
    id: bo.id,
    orderNumber: bo.orderNumber,
    externalOrderId: bo.externalOrderId || undefined,
    createdAt: bo.createdAt
      ? new Date(bo.createdAt).toISOString()
      : new Date().toISOString(),
    customerEmail: bo.customerEmail,
    customerPhone: bo.customerPhone || undefined,
    customerLink: bo.customerLink || undefined,
    totalPriceToman: bo.totalPriceToman,
    totalPriceUsd: bo.totalPriceUsd || 0,
    status: (bo.status as any) || "processing",
    deliveredAccounts,
    paymentGateway: bo.paymentGateway || bo.gateway || "cartbecart",
    approvedByAdminId: bo.approvedByAdminId || undefined,
    approvedByAdminName: bo.approvedByAdminName || undefined,
    approvedByAdminPhone: bo.approvedByAdminPhone || undefined,
    approvedAt: bo.approvedAt
      ? toEnglishDigits(
          new Intl.DateTimeFormat("fa-IR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date(bo.approvedAt))
        )
      : undefined,
    refundReason: bo.refundReason || undefined,
    refundCardNumber: bo.refundCardNumber || undefined,
    refundIban: bo.refundIban || undefined,
    refundAmountToman: bo.refundAmountToman ?? bo.refundAmount ?? undefined,
    refundReceiptUrl: bo.refundReceiptUrl || undefined,
    refundTrackingCode: bo.refundTrackingCode || bo.refundTrackingNumber || undefined,
    refundMethod: (bo.refundMethod as any) || undefined,
    refundRejectionReason: bo.refundRejectionReason || undefined,
    refundedByAdminName: bo.refundedByAdminName || undefined,
    refundedAt: bo.refundedAt || bo.refundDate
      ? toEnglishDigits(
          new Intl.DateTimeFormat("fa-IR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date(bo.refundedAt || bo.refundDate))
        )
      : undefined,
    items: parsedItems,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isLoadingSync, setIsLoadingSync] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Helper to load live data from NestJS backend
  const refreshFromBackend = useCallback(async () => {
    try {
      const [backendSettings, backendCategories, backendProductsData, backendLogs, backendCoupons] =
        await Promise.all([
          api.getSettings().catch((e) => {
            console.warn("Failed to fetch settings from backend", e);
            return null;
          }),
          api.getCategories().catch((e) => {
            console.warn("Failed to fetch categories from backend", e);
            return null;
          }),
          api.getProducts({ limit: 5000 }).catch((e) => {
            console.warn("Failed to fetch products from backend", e);
            return null;
          }),
          api.getAuditLogs(40).catch((e) => {
            console.warn("Failed to fetch logs from backend", e);
            return null;
          }),
          api.getCoupons().catch(() => null),
        ]);

      if (backendSettings) {
        setSettings((prev) => {
          const next = {
            ...prev,
            usdToRialRate: backendSettings.usdToRialRate ?? prev.usdToRialRate,
            defaultMarginPercent: backendSettings.defaultMarginPercent ?? prev.defaultMarginPercent,
            walletBalanceUsd: backendSettings.walletBalanceUsd ?? prev.walletBalanceUsd,
            lastSyncTime: backendSettings.lastSyncTime || prev.lastSyncTime,
            siteName: backendSettings.siteName || prev.siteName,
            supportTelegram: backendSettings.supportTelegram || prev.supportTelegram,
            maxPurchaseRatioDenominator:
              backendSettings.maxPurchaseRatioDenominator !== undefined && backendSettings.maxPurchaseRatioDenominator !== null
                ? Number(backendSettings.maxPurchaseRatioDenominator)
                : (prev.maxPurchaseRatioDenominator ?? 3),
            purchaseRatioExemptionThreshold:
              backendSettings.purchaseRatioExemptionThreshold !== undefined && backendSettings.purchaseRatioExemptionThreshold !== null
                ? Number(backendSettings.purchaseRatioExemptionThreshold)
                : (prev.purchaseRatioExemptionThreshold ?? 10),
            currencyApiKey: backendSettings.currencyApiKey || prev.currencyApiKey,
            currencySyncIntervalMinutes: backendSettings.currencySyncIntervalMinutes ?? prev.currencySyncIntervalMinutes,
            enableCurrencyAutoSync: backendSettings.enableCurrencyAutoSync ?? prev.enableCurrencyAutoSync,
            lastCurrencySyncTime: backendSettings.lastCurrencySyncTime || prev.lastCurrencySyncTime,
            lastCurrencyPriceToman: backendSettings.lastCurrencyPriceToman ?? prev.lastCurrencyPriceToman,
            lastCurrencyChangePercent: backendSettings.lastCurrencyChangePercent ?? prev.lastCurrencyChangePercent,
            orderCashbackPercent:
              backendSettings.orderCashbackPercent !== undefined && backendSettings.orderCashbackPercent !== null
                ? Number(backendSettings.orderCashbackPercent)
                : (prev.orderCashbackPercent ?? 10),
            siteLogo: backendSettings.siteLogo ?? prev.siteLogo,
            siteLogoDark: backendSettings.siteLogoDark ?? prev.siteLogoDark,
            siteFavicon: backendSettings.siteFavicon ?? prev.siteFavicon,
            siteTagline: backendSettings.siteTagline || prev.siteTagline,
            siteDescription: backendSettings.siteDescription || prev.siteDescription,
            sitePhone: backendSettings.sitePhone || prev.sitePhone,
            siteEmail: backendSettings.siteEmail || prev.siteEmail,
            siteInstagram: backendSettings.siteInstagram || prev.siteInstagram,
            siteEnamad: backendSettings.siteEnamad ?? prev.siteEnamad,
          };
          try {
            localStorage.setItem("arzan_settings_v2", JSON.stringify(next));
          } catch (e) {
            console.warn(e);
          }
          return next;
        });
        setIsBackendConnected(true);
      }

      if (backendCategories && backendCategories.length > 0) {
        setCategories(backendCategories.map(mapBackendCategory));
      }

      if (backendProductsData && backendProductsData.products?.length > 0) {
        setProducts(backendProductsData.products.map(mapBackendProduct));
      }

      if (backendLogs && Array.isArray(backendLogs)) {
        setAuditLogs(
          backendLogs.map((log: any) => ({
            id: log.id,
            action: log.action,
            details: log.details,
            user: log.user,
            timestamp: toEnglishDigits(
              new Intl.DateTimeFormat("fa-IR", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(log.createdAt))
            ),
            type: (log.type as any) || "sync",
          }))
        );
      }

      // Fetch live real database orders (No mock data)
      const backendOrdersData = await api.getBackendOrders({ limit: 100 }).catch((e) => {
        console.warn("Failed to fetch orders from backend", e);
        return null;
      });

      if (backendOrdersData && Array.isArray(backendOrdersData.orders)) {
        const mappedOrders = backendOrdersData.orders.map(mapBackendOrder);
        setOrders(mappedOrders);
        try {
          localStorage.setItem("arzan_orders_v2", JSON.stringify(mappedOrders));
        } catch (e) {
          console.warn(e);
        }
      }

      if (backendCoupons && Array.isArray(backendCoupons)) {
        const mappedCoupons: Coupon[] = backendCoupons.map((c: any) => {
          let allowedUsers: any[] = [];
          if (c.allowedUserIds) {
            try {
              allowedUsers = typeof c.allowedUserIds === 'string' ? JSON.parse(c.allowedUserIds) : c.allowedUserIds;
            } catch {
              allowedUsers = [c.allowedUserIds];
            }
          }
          return {
            id: c.id,
            code: c.code,
            discountPercent: c.discountPercent,
            maxDiscountToman: c.maxDiscountToman || 0,
            minOrderToman: c.minOrderToman || 0,
            expiresAt: c.expiresAt || "",
            usageCount: c.usageCount || 0,
            maxUsage: c.maxUsage || 0,
            isActive: c.isActive !== false,
            targetType: allowedUsers.length > 0 ? ("USER" as const) : ("ALL" as const),
            targetUserIds: allowedUsers.map((u: any) => (typeof u === 'string' ? u : u.id)).filter(Boolean),
            targetUsers: allowedUsers.filter((u: any) => typeof u === 'object'),
          };
        });
        setCoupons(mappedCoupons);
        try {
          localStorage.setItem("arzan_coupons_v2", JSON.stringify(mappedCoupons));
        } catch (e) {
          console.warn(e);
        }
      }
    } catch (err) {
      console.warn("Could not connect to NestJS backend, falling back to local state", err);
      setIsBackendConnected(false);
    } finally {
      setIsLoadingInitial(false);
    }
  }, []);

  // Initial fetch and localStorage restore
  useEffect(() => {
    // Restore cart & orders from localStorage
    try {
      const so = localStorage.getItem("arzan_orders_v2");
      const scoup = localStorage.getItem("arzan_coupons_v2");
      const scart = localStorage.getItem("arzan_cart_v2");
      const ssettings = localStorage.getItem("arzan_settings_v2");

      if (so) setOrders(JSON.parse(so));
      if (scoup) setCoupons(JSON.parse(scoup));
      if (scart) setCart(JSON.parse(scart));
      if (ssettings) setSettings((prev) => ({ ...prev, ...JSON.parse(ssettings) }));
    } catch (e) {
      console.warn("Could not restore localStorage", e);
    }

    // Connect to backend
    refreshFromBackend();

    const handleMockDbSync = () => {
      refreshFromBackend();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("arzan_mock_db_sync", handleMockDbSync);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("arzan_mock_db_sync", handleMockDbSync);
      }
    };
  }, [refreshFromBackend]);

  // Cart save helper
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem("arzan_cart_v2", JSON.stringify(newCart));
    } catch (e) {
      console.warn(e);
    }
  };

  const saveOrders = (newO: Order[]) => {
    setOrders(newO);
    try {
      localStorage.setItem("arzan_orders_v2", JSON.stringify(newO));
    } catch (e) {
      console.warn(e);
    }
  };

  const saveCoupons = (newC: Coupon[]) => {
    setCoupons(newC);
    try {
      localStorage.setItem("arzan_coupons_v2", JSON.stringify(newC));
    } catch (e) {
      console.warn(e);
    }
  };

  // Toggle Product Active (Storefront visibility)
  const toggleProductActive = async (id: string, adminInfo?: any) => {
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );

    try {
      let activeAdmin = adminInfo;
      if (!activeAdmin && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("arzan_auth_user");
          if (stored) activeAdmin = JSON.parse(stored);
        } catch {}
      }

      await api.toggleProductActive(id, activeAdmin);
      // Refresh audit logs
      const logs = await api.getAuditLogs(30);
      if (Array.isArray(logs)) {
        setAuditLogs(
          logs.map((log: any) => ({
            id: log.id,
            action: log.action,
            details: log.details,
            user: log.user,
            adminId: log.adminId,
            adminName: log.adminName,
            adminPhone: log.adminPhone,
            timestamp: toEnglishDigits(
              new Intl.DateTimeFormat("fa-IR", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(log.createdAt))
            ),
            type: (log.type as any) || "product",
          }))
        );
      }
    } catch (error) {
      console.error("Error toggling product active status on backend:", error);
      // Revert if error
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
      );
    }
  };

  // Create new Product
  const createProduct = async (productData: Partial<Product>, adminInfo?: any) => {
    try {
      let activeAdmin = adminInfo;
      if (!activeAdmin && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("arzan_auth_user");
          if (stored) activeAdmin = JSON.parse(stored);
        } catch {}
      }

      const created = await api.createProduct(productData, activeAdmin);
      if (created) {
        const mapped = mapBackendProduct(created);
        setProducts((prev) => [mapped, ...prev]);
        const logs = await api.getAuditLogs(30);
        if (Array.isArray(logs)) {
          setAuditLogs(
            logs.map((log: any) => ({
              id: log.id,
              action: log.action,
              details: log.details,
              user: log.user,
              adminId: log.adminId,
              adminName: log.adminName,
              adminPhone: log.adminPhone,
              timestamp: toEnglishDigits(
                new Intl.DateTimeFormat("fa-IR", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(log.createdAt))
              ),
              type: (log.type as any) || "product",
            }))
          );
        }
        return mapped;
      }
    } catch (error) {
      console.error("Error creating product on backend:", error);
      throw error;
    }
  };

  // Update Product details (Title, Margin, Category)
  const updateProduct = async (id: string, updates: Partial<Product>, adminInfo?: any) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    try {
      let activeAdmin = adminInfo;
      if (!activeAdmin && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("arzan_auth_user");
          if (stored) activeAdmin = JSON.parse(stored);
        } catch {}
      }

      await api.updateProduct(id, updates, activeAdmin);
      const logs = await api.getAuditLogs(30);
      if (Array.isArray(logs)) {
        setAuditLogs(
          logs.map((log: any) => ({
            id: log.id,
            action: log.action,
            details: log.details,
            user: log.user,
            adminId: log.adminId,
            adminName: log.adminName,
            adminPhone: log.adminPhone,
            timestamp: toEnglishDigits(
              new Intl.DateTimeFormat("fa-IR", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(log.createdAt))
            ),
            type: (log.type as any) || "product",
          }))
        );
      }
    } catch (error) {
      console.error("Error updating product on backend:", error);
    }
  };

  // Delete Product
  const deleteProduct = async (id: string, adminInfo?: any) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      let activeAdmin = adminInfo;
      if (!activeAdmin && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("arzan_auth_user");
          if (stored) activeAdmin = JSON.parse(stored);
        } catch {}
      }

      await api.deleteProduct(id, activeAdmin?.name || "مدیر سیستم");
      const logs = await api.getAuditLogs(30);
      if (Array.isArray(logs)) {
        setAuditLogs(
          logs.map((log: any) => ({
            id: log.id,
            action: log.action,
            details: log.details,
            user: log.user,
            adminId: log.adminId,
            adminName: log.adminName,
            adminPhone: log.adminPhone,
            timestamp: toEnglishDigits(
              new Intl.DateTimeFormat("fa-IR", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(log.createdAt))
            ),
            type: (log.type as any) || "product",
          }))
        );
      }
    } catch (error) {
      console.error("Error deleting product on backend:", error);
    }
  };

  // Add Category
  const addCategory = async (category: Omit<Category, "id">) => {
    try {
      const created = await api.createCategory({
        title: category.title,
        titleFa: category.title,
        slug: category.slug,
        description: category.description,
      });
      if (created) {
        setCategories((prev) => [...prev, mapBackendCategory(created)]);
      }
    } catch (error) {
      console.error("Error adding category on backend:", error);
      // Local fallback
      const localCat: Category = {
        ...category,
        id: `cat-${Date.now()}`,
      };
      setCategories((prev) => [...prev, localCat]);
    }
  };

  // Delete Category
  const deleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    try {
      await api.deleteCategory(id);
    } catch (error) {
      console.error("Error deleting category on backend:", error);
    }
  };

  // Update Category
  const updateCategory = async (id: string, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    try {
      await api.updateCategory(id, updates);
    } catch (error) {
      console.error("Error updating category on backend:", error);
    }
  };

  // Update Settings (USD Rate & Margin)
  const updateSettings = async (updates: Partial<SystemSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem("arzan_settings_v2", JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    try {
      if (
        updates.usdToRialRate !== undefined ||
        updates.defaultMarginPercent !== undefined ||
        updates.maxPurchaseRatioDenominator !== undefined ||
        updates.purchaseRatioExemptionThreshold !== undefined ||
        updates.orderCashbackPercent !== undefined
      ) {
        await api.updateCurrency({
          rate: updates.usdToRialRate,
          margin: updates.defaultMarginPercent,
          maxPurchaseRatioDenominator: updates.maxPurchaseRatioDenominator,
          purchaseRatioExemptionThreshold: updates.purchaseRatioExemptionThreshold,
          orderCashbackPercent: updates.orderCashbackPercent,
          user: "مدیر سیستم (پنل ادمین)",
        });
        // Refresh logs & products with new calculations
        refreshFromBackend();
      }

      if (
        updates.siteLogo !== undefined ||
        updates.siteLogoDark !== undefined ||
        updates.siteFavicon !== undefined ||
        updates.siteName !== undefined ||
        updates.siteTagline !== undefined ||
        updates.siteDescription !== undefined ||
        updates.sitePhone !== undefined ||
        updates.siteEmail !== undefined ||
        updates.supportTelegram !== undefined ||
        updates.siteInstagram !== undefined ||
        updates.siteEnamad !== undefined
      ) {
        await api.updateBrandingSettings({
          siteLogo: updates.siteLogo,
          siteLogoDark: updates.siteLogoDark,
          siteFavicon: updates.siteFavicon,
          siteName: updates.siteName,
          siteTagline: updates.siteTagline,
          siteDescription: updates.siteDescription,
          sitePhone: updates.sitePhone,
          siteEmail: updates.siteEmail,
          supportTelegram: updates.supportTelegram,
          siteInstagram: updates.siteInstagram,
          siteEnamad: updates.siteEnamad,
          user: "مدیر سیستم (پنل تنظیمات)",
        });
      }
    } catch (error) {
      console.error("Error updating settings on backend:", error);
    }
  };

  // Immediate manual currency sync from BrsApi
  const syncCurrencyNow = async () => {
    try {
      const res = await api.syncCurrencyNow("مدیر سیستم (استعلام دستی از پنل)");
      if (res && res.settings) {
        setSettings((prev) => ({ ...prev, ...res.settings }));
      } else if (res && res.usdToRialRate) {
        setSettings((prev) => ({
          ...prev,
          usdToRialRate: res.usdToRialRate,
          lastCurrencyPriceToman: res.priceToman,
          lastCurrencySyncTime: res.syncTime,
          lastCurrencyChangePercent: res.changePercent,
        }));
      }
      await refreshFromBackend();
      return res;
    } catch (err) {
      console.error("Failed to sync currency now:", err);
      throw err;
    }
  };

  // Update BrsApi currency sync configurations (interval, apiKey, enableAutoSync)
  const updateCurrencySyncConfig = async (config: {
    apiKey?: string;
    intervalMinutes?: number;
    enableAutoSync?: boolean;
  }) => {
    try {
      const res = await api.updateCurrencySyncConfig({
        ...config,
        user: "مدیر سیستم (پنل تنظیمات ارز)",
      });
      if (res && res.settings) {
        setSettings((prev) => ({ ...prev, ...res.settings }));
      }
      return res;
    } catch (err) {
      console.error("Failed to update currency sync config:", err);
      throw err;
    }
  };

  // Dynamic live price calculation formula with dual pricing:
  // costToman = (costPriceUsd * usdToRialRate) / 10
  // publicRetailToman = (retailPriceUsd * usdToRialRate) / 10
  // finalToman = margin active ? cost * (1 + margin) : publicRetail
  const calculateProductPrice = (product: Product): CalculatedPrice => {
    // If backend provided pre-calculated price and costPriceUsd is omitted (public customer mode)
    const backendFinalToman = (product as any).priceToman || (product as any).calculatedPrice?.finalToman;
    if (backendFinalToman && (!product.costPriceUsd || product.costPriceUsd <= 0)) {
      const finalToman = Number(backendFinalToman);
      const calculatedRegularToman = finalToman;
      const hasSalePrice = Boolean(
        product.salePriceToman &&
        product.salePriceToman > 0 &&
        product.salePriceToman < calculatedRegularToman
      );
      const hasSalePercent = Boolean(
        product.discountPercent &&
        product.discountPercent > 0 &&
        product.discountPercent < 100
      );
      const hasSale = hasSalePrice || hasSalePercent;

      let actualFinalToman = finalToman;
      if (hasSalePrice) {
        actualFinalToman = product.salePriceToman!;
      } else if (hasSalePercent) {
        actualFinalToman = Math.round(calculatedRegularToman * (1 - product.discountPercent! / 100));
      }

      const discountPercent = hasSalePercent
        ? Math.round(product.discountPercent!)
        : hasSalePrice
        ? Math.round(((calculatedRegularToman - actualFinalToman) / calculatedRegularToman) * 100)
        : (product.discountPercent || 0);

      return {
        rial: actualFinalToman * 10,
        toman: actualFinalToman,
        formattedToman: formatPrice(actualFinalToman),
        usdPrice: 0,
        costToman: 0,
        formattedCostToman: "۰",
        retailPriceUsd: 0,
        publicRetailToman: actualFinalToman,
        formattedPublicRetailToman: formatPrice(actualFinalToman),
        profitToman: 0,
        discountPercent,
        marginPercent: 0,
        isCustomMarginActive: false,
        isPerThousand: product.pricingUnit === "per_1000",
        isOnSale: hasSale,
        originalToman: calculatedRegularToman,
        formattedOriginalToman: formatPrice(calculatedRegularToman),
      };
    }

    const isCustomMarginActive =
      product.customMarginPercent !== null &&
      product.customMarginPercent !== undefined &&
      product.customMarginPercent > 0;

    const margin = isCustomMarginActive
      ? product.customMarginPercent!
      : (settings.defaultMarginPercent || 0);

    const costToman = Math.round(((product.costPriceUsd || 0) * settings.usdToRialRate) / 10);
    const retailPriceUsd = product.retailPriceUsd && product.retailPriceUsd > 0
      ? product.retailPriceUsd
      : (product.costPriceUsd || 0);
    const publicRetailToman = Math.round((retailPriceUsd * settings.usdToRialRate) / 10);

    let finalToman = 0;
    if (isCustomMarginActive || !product.retailPriceUsd || product.retailPriceUsd <= 0) {
      finalToman = Math.round(costToman * (1 + margin / 100));
    } else {
      if (settings.defaultMarginPercent && settings.defaultMarginPercent > 0) {
        finalToman = Math.round(costToman * (1 + settings.defaultMarginPercent / 100));
      } else {
        finalToman = publicRetailToman;
      }
    }

    const calculatedRegularToman = finalToman;
    const hasSalePrice = Boolean(
      product.salePriceToman &&
      product.salePriceToman > 0 &&
      product.salePriceToman < calculatedRegularToman
    );

    const hasSalePercent = Boolean(
      product.discountPercent &&
      product.discountPercent > 0 &&
      product.discountPercent < 100
    );

    const hasSale = hasSalePrice || hasSalePercent;

    if (hasSalePrice) {
      finalToman = product.salePriceToman!;
    } else if (hasSalePercent) {
      finalToman = Math.round(calculatedRegularToman * (1 - product.discountPercent! / 100));
    }

    const finalRial = finalToman * 10;
    const profitToman = Math.max(0, finalToman - costToman);
    const discountPercent = hasSalePercent
      ? Math.round(product.discountPercent!)
      : hasSalePrice
      ? Math.round(((calculatedRegularToman - finalToman) / calculatedRegularToman) * 100)
      : publicRetailToman > finalToman
      ? Math.round(((publicRetailToman - finalToman) / publicRetailToman) * 100)
      : 0;

    return {
      rial: finalRial,
      toman: finalToman,
      formattedToman: formatPrice(finalToman),
      usdPrice: product.costPriceUsd || 0,
      costToman,
      formattedCostToman: formatPrice(costToman),
      retailPriceUsd: product.retailPriceUsd || 0,
      publicRetailToman,
      formattedPublicRetailToman: formatPrice(publicRetailToman),
      profitToman,
      discountPercent,
      marginPercent: margin,
      isCustomMarginActive,
      isPerThousand: product.pricingUnit === "per_1000",
      isOnSale: hasSale,
      originalToman: calculatedRegularToman,
      formattedOriginalToman: formatPrice(calculatedRegularToman),
    };
  };

  // Dynamic stock limit and purchase ratio calculation (Priority 4)
  const getMaxAllowedPurchase = useCallback((product: Product): number => {
    const stock = product.stockCount !== null && product.stockCount !== undefined ? product.stockCount : 100;
    if (stock <= 0 || product.inStock === false) return 0;

    const denom = settings.maxPurchaseRatioDenominator && settings.maxPurchaseRatioDenominator > 0
      ? settings.maxPurchaseRatioDenominator
      : 3;
    const threshold = settings.purchaseRatioExemptionThreshold !== undefined
      ? settings.purchaseRatioExemptionThreshold
      : 10;

    // If stock is less than or equal to threshold (e.g. 10), allow purchasing all remaining stock
    if (stock <= threshold) {
      return stock;
    }
    // Otherwise, fraction of total stock: floor(stock / denom)
    return Math.min(stock, Math.max(1, Math.floor(stock / denom)));
  }, [settings.maxPurchaseRatioDenominator, settings.purchaseRatioExemptionThreshold]);

  // Cart operations
  const addToCart = (product: Product, quantity = 1, email?: string, link?: string) => {
    const maxAllowed = getMaxAllowedPurchase(product);
    if (maxAllowed <= 0) return;

    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    let updatedCart: CartItem[] = [];

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      const targetQty = Math.min(maxAllowed, currentQty + quantity);
      updatedCart = cart.map((item, idx) =>
        idx === existingIndex
          ? {
              ...item,
              quantity: targetQty,
              customerEmail: email || item.customerEmail,
              customerLink: link || item.customerLink,
            }
          : item
      );
    } else {
      const targetQty = Math.min(maxAllowed, Math.max(1, quantity));
      updatedCart = [...cart, { product, quantity: targetQty, customerEmail: email, customerLink: link }];
    }
    saveCart(updatedCart);
  };

  const removeFromCart = (productId: string) => {
    saveCart(cart.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const cartItem = cart.find((item) => item.product.id === productId);
    const product = products.find((p) => p.id === productId) || cartItem?.product;
    const maxAllowed = product ? getMaxAllowedPurchase(product) : quantity;
    const finalQuantity = Math.min(quantity, maxAllowed);

    saveCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity: finalQuantity } : item
      )
    );
  };

  const clearCart = () => {
    saveCart([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = async (
    code: string,
    userContext?: { id?: string; phone?: string; email?: string } | null,
    cartSubtotal?: number
  ) => {
    const cleanCode = code.trim().toUpperCase();

    // 1) بررسی لوکال: کوپن‌های ذخیره‌شده (چه عمومی و چه کاربر محور)
    const localCoupon = coupons.find((c) => c.code === cleanCode);
    if (localCoupon) {
      if (!localCoupon.isActive) {
        return { success: false, message: "این کد تخفیف غیرفعال شده است." };
      }
      if (localCoupon.maxUsage && localCoupon.usageCount >= localCoupon.maxUsage) {
        return { success: false, message: "ظرفیت استفاده از این کد تخفیف به پایان رسیده است." };
      }
      if (localCoupon.expiresAt && isCouponExpired(localCoupon.expiresAt)) {
        return { success: false, message: "مهلت استفاده از این کد تخفیف به پایان رسیده است." };
      }
      if (cartSubtotal !== undefined && localCoupon.minOrderToman && cartSubtotal < localCoupon.minOrderToman) {
        return {
          success: false,
          message: `حداقل مبلغ سفارش برای اعمال این کد تخفیف ${formatPrice(localCoupon.minOrderToman)} تومان است.`,
        };
      }

      // بررسی اعتبار کد کاربر محور (اختصاصی)
      if (
        localCoupon.targetType === "USER" ||
        localCoupon.targetUserId ||
        (localCoupon.targetUserIds && localCoupon.targetUserIds.length > 0)
      ) {
        if (!userContext || !userContext.id) {
          return {
            success: false,
            message: "این کد تخفیف اختصاصی است. لطفاً ابتدا وارد حساب کاربری خود شوید.",
          };
        }
        const matchesUser =
          (localCoupon.targetUserIds && localCoupon.targetUserIds.includes(userContext.id)) ||
          (localCoupon.targetUsers &&
            localCoupon.targetUsers.some(
              (u) =>
                u.id === userContext.id ||
                (u.phone && userContext.phone && u.phone === userContext.phone) ||
                (u.email && userContext.email && u.email.toLowerCase() === userContext.email.toLowerCase())
            )) ||
          (localCoupon.targetUserId && localCoupon.targetUserId === userContext.id) ||
          (localCoupon.targetUserPhone && userContext.phone && localCoupon.targetUserPhone === userContext.phone) ||
          (localCoupon.targetUserEmail &&
            userContext.email &&
            localCoupon.targetUserEmail.toLowerCase() === userContext.email.toLowerCase());

        if (!matchesUser) {
          return {
            success: false,
            message: "این کد تخفیف اختصاصی است و برای حساب کاربری شما صادر نشده است.",
          };
        }
      }

      setAppliedCoupon(localCoupon);
      return { success: true, message: `کد تخفیف %${localCoupon.discountPercent} با موفقیت اعمال شد.` };
    }

    // 2) در غیر این صورت، استعلام از بک‌اند
    try {
      const res = await api.validateCoupon(cleanCode, userContext?.id);
      if (res && res.success && res.coupon) {
        if (res.coupon.expiresAt && isCouponExpired(res.coupon.expiresAt)) {
          return { success: false, message: "مهلت استفاده از این کد تخفیف به پایان رسیده است." };
        }
        if (cartSubtotal !== undefined && res.coupon.minOrderToman && cartSubtotal < res.coupon.minOrderToman) {
          return {
            success: false,
            message: `حداقل مبلغ سفارش برای اعمال این کد تخفیف ${formatPrice(res.coupon.minOrderToman)} تومان است.`,
          };
        }
        setAppliedCoupon(res.coupon);
        return { success: true, message: `کد تخفیف %${res.coupon.discountPercent} با موفقیت اعمال شد.` };
      }
      return { success: false, message: res?.message || "کد تخفیف نامعتبر است." };
    } catch (err: any) {
      console.error("Coupon validation error:", err);
      return { success: false, message: err?.message || "خطا در اعتبارسنجی کد تخفیف." };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Orders
  const createOrder = (
    orderData: Omit<Order, "id" | "orderNumber" | "createdAt"> & { id?: string; orderNumber?: string }
  ): Order => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      ...orderData,
      id: orderData.id || `ord-${Date.now()}`,
      orderNumber: orderData.orderNumber || `ARZ-${randomSuffix}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newOrder, ...orders];
    saveOrders(updated);
    clearCart();

    // Persist real order to NestJS backend database ONLY if not already persisted by checkout
    if (!orderData.orderNumber) {
      api
        .createBackendOrder({
          orderNumber: newOrder.orderNumber,
          customerEmail: newOrder.customerEmail,
          customerPhone: newOrder.customerPhone,
          customerLink: newOrder.customerLink,
          totalPriceToman: newOrder.totalPriceToman,
          totalPriceUsd: newOrder.totalPriceUsd,
          paymentGateway: newOrder.paymentGateway,
          gateway: newOrder.paymentGateway,
          couponCode: (newOrder as any).couponCode,
          deliveryType: newOrder.deliveryType || "link",
          targetAccountEmail: newOrder.targetAccountEmail,
          targetAccountPassword: newOrder.targetAccountPassword,
          isHybridOrder: newOrder.isHybridOrder,
          items: newOrder.items.map((it) => ({
            productId: it.productId,
            productTitle: it.productTitle,
            quantity: it.quantity,
            priceToman: it.priceToman,
            priceUsd: it.priceUsd,
          })),
        })
        .then((created) => {
          if (created && created.id) {
            setOrders((prev) =>
              prev.map((o) =>
                o.orderNumber === newOrder.orderNumber ? { ...o, id: created.id } : o
              )
            );
          }
        })
        .catch((err) => {
          console.warn("Backend order save notice:", err);
        });
    }

    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action: `ثبت سفارش جدید #${newOrder.orderNumber}`,
      details: `سفارش به مبلغ ${formatPrice(newOrder.totalPriceToman)} تومان ثبت شد.`,
      user: newOrder.customerEmail,
      timestamp: "هم‌اکنون",
      type: "order",
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    return newOrder;
  };

  const updateOrderStatus = async (
    orderId: string,
    status: Order["status"],
    accounts?: string[],
    adminInfo?: { id?: string; name?: string; phone?: string; role?: string }
  ) => {
    // 1. Optimistically update local state & localStorage
    const updated = orders.map((o) => {
      if (o.id === orderId || o.orderNumber === orderId) {
        const isNowDelivered = status === "delivered" && o.status !== "delivered";
        return {
          ...o,
          status,
          deliveredAccounts: accounts || o.deliveredAccounts,
          approvedByAdminId: adminInfo?.id || o.approvedByAdminId,
          approvedByAdminName: adminInfo?.name || o.approvedByAdminName,
          approvedByAdminPhone: adminInfo?.phone || o.approvedByAdminPhone,
          approvedAt: isNowDelivered ? new Date().toISOString() : o.approvedAt,
        };
      }
      return o;
    });
    saveOrders(updated);

    const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);

    // 2. Persist to Backend API / PostgreSQL Database
    const backendTargetId = order?.id || order?.orderNumber || orderId;
    let effectiveRole = adminInfo?.role || "SUPER_ADMIN";
    if (!adminInfo?.role && typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("arzan_cached_user");
        if (cached) {
          const u = JSON.parse(cached);
          if (u.role) effectiveRole = u.role;
        }
      } catch {}
    }

    try {
      await api.updateOrderStatus(backendTargetId, {
        status,
        adminName: adminInfo?.name || "مدیر سیستم",
        adminId: adminInfo?.id,
        adminPhone: adminInfo?.phone,
        deliveredAccounts: accounts || order?.deliveredAccounts,
        role: effectiveRole,
      });
    } catch (err) {
      console.warn("Backend updateOrderStatus notice for", backendTargetId, err);
      if (order?.orderNumber && order.orderNumber !== backendTargetId) {
        try {
          await api.updateOrderStatus(order.orderNumber, {
            status,
            adminName: adminInfo?.name || "مدیر سیستم",
            adminId: adminInfo?.id,
            adminPhone: adminInfo?.phone,
            deliveredAccounts: accounts || order?.deliveredAccounts,
            role: effectiveRole,
          });
        } catch {}
      }
    }

    // 3. Automatically send order delivery email with credentials
    if (order && (status === "delivered" || (accounts && accounts.length > 0))) {
      api.sendOrderReceiptEmail({
        orderNumber: order.orderNumber,
        customerName: order.customerEmail.split("@")[0],
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        createdAt: toEnglishDigits(new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(new Date())),
        items: order.items.map((it) => ({
          productTitle: it.productTitle,
          quantity: it.quantity,
          priceToman: it.priceToman,
          priceUsd: it.priceUsd,
        })),
        deliveredAccounts: accounts || order.deliveredAccounts,
        totalPriceToman: order.totalPriceToman,
        totalPriceUsd: order.totalPriceUsd,
      }).catch((err) => console.warn("Could not dispatch receipt email:", err));
    }

    // 4. Audit Log
    if (order && adminInfo?.name) {
      const isDelivered = status === "delivered";
      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        action: isDelivered ? `تایید و تحویل سفارش #${order.orderNumber}` : `تغییر وضعیت سفارش #${order.orderNumber}`,
        details: `سفارش #${order.orderNumber} به مبلغ ${formatPrice(order.totalPriceToman)} تومان توسط ${adminInfo.name} ${isDelivered ? "تایید و صادر شد" : `به ${status} تغییر یافت`}.`,
        user: adminInfo.name,
        adminId: adminInfo.id,
        adminName: adminInfo.name,
        adminPhone: adminInfo.phone,
        timestamp: "هم‌اکنون",
        createdAt: new Date().toISOString(),
        type: isDelivered ? "order_delivery" : "order",
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    }
  };

  const requestRefund = async (
    orderId: string,
    reason: string,
    cardNumber?: string,
    sheba?: string
  ): Promise<{ success: boolean; message: string }> => {
    const targetOrder = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    const backendTargetId = targetOrder?.orderNumber || orderId;

    try {
      await api.requestRefund(backendTargetId, reason, cardNumber, sheba);
    } catch (err) {
      console.warn("Backend requestRefund notice:", err);
      if (targetOrder?.id && targetOrder.id !== backendTargetId) {
        try {
          await api.requestRefund(targetOrder.id, reason, cardNumber, sheba);
        } catch {}
      }
    }

    const updated = orders.map((o) =>
      o.id === orderId || o.orderNumber === orderId
        ? {
            ...o,
            status: "refund_requested" as const,
            refundReason: reason,
            refundCardNumber: cardNumber,
            refundIban: sheba,
            refundRejectionReason: undefined,
          }
        : o
    );
    saveOrders(updated);
    return { success: true, message: "درخواست عودت وجه با موفقیت ثبت گردید و در صف بررسی مالی قرار گرفت." };
  };

  const processRefundOrder = (
    orderId: string,
    refundMethod: "bank_card" | "wallet",
    trackingCode?: string,
    receiptUrl?: string,
    adminName?: string
  ) => {
    const updated = orders.map((o) =>
      o.id === orderId || o.orderNumber === orderId
        ? {
            ...o,
            status: "refunded" as const,
            refundMethod,
            refundTrackingCode: trackingCode,
            refundReceiptUrl: receiptUrl,
            refundedAt: new Date().toISOString(),
            refundedByAdminName: adminName,
          }
        : o
    );
    saveOrders(updated);
  };

  const rejectRefundOrder = (
    orderId: string,
    rejectionReason: string,
    newStatus: Order["status"] = "delivered"
  ) => {
    const updated = orders.map((o) =>
      o.id === orderId || o.orderNumber === orderId
        ? {
            ...o,
            status: newStatus,
            refundRejectionReason: rejectionReason,
          }
        : o
    );
    saveOrders(updated);
  };

  const addAdminAuditLog = (log: Omit<AuditLog, "id" | "timestamp">) => {
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: "هم‌اکنون",
      createdAt: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const addCoupon = async (coupon: Omit<Coupon, "id">) => {
    try {
      const allowed =
        coupon.targetType === "USER"
          ? coupon.targetUsers && coupon.targetUsers.length > 0
            ? coupon.targetUsers
            : coupon.targetUserIds
          : undefined;

      const res = await api.createCoupon({
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        maxDiscountToman: coupon.maxDiscountToman,
        minOrderToman: coupon.minOrderToman,
        expiresAt: coupon.expiresAt || undefined,
        maxUsage: coupon.maxUsage,
        isActive: coupon.isActive,
        allowedUserIds: allowed,
      });

      if (res && res.id) {
        const newC: Coupon = {
          ...coupon,
          id: res.id,
          usageCount: res.usageCount ?? 0,
        };
        saveCoupons([newC, ...coupons]);
        return;
      }
    } catch (err) {
      console.warn("Could not save coupon to backend, saving locally", err);
    }

    const newC: Coupon = {
      ...coupon,
      id: `coup-${Date.now()}`,
    };
    saveCoupons([...coupons, newC]);
  };

  const addCoupons = async (newCouponsList: Omit<Coupon, "id">[]) => {
    for (const c of newCouponsList) {
      await addCoupon(c);
    }
  };

  const updateCoupon = async (couponId: string, updates: Partial<Coupon>) => {
    try {
      const allowed =
        updates.targetType === "USER"
          ? updates.targetUsers && updates.targetUsers.length > 0
            ? updates.targetUsers
            : updates.targetUserIds
          : updates.targetUserIds;

      await api.updateCoupon(couponId, {
        discountPercent: updates.discountPercent,
        maxDiscountToman: updates.maxDiscountToman,
        minOrderToman: updates.minOrderToman,
        expiresAt: updates.expiresAt,
        maxUsage: updates.maxUsage,
        isActive: updates.isActive,
        allowedUserIds: allowed,
      });
    } catch (err) {
      console.warn("Could not update coupon on backend", err);
    }

    const updated = coupons.map((c) => (c.id === couponId ? { ...c, ...updates } : c));
    saveCoupons(updated);
    if (appliedCoupon?.id === couponId) {
      setAppliedCoupon({ ...appliedCoupon, ...updates });
    }
  };

  const toggleCoupon = async (couponId: string) => {
    const target = coupons.find((c) => c.id === couponId);
    if (target) {
      try {
        await api.updateCoupon(couponId, { isActive: !target.isActive });
      } catch (err) {
        console.warn("Could not toggle coupon on backend", err);
      }
    }
    const updated = coupons.map((c) => (c.id === couponId ? { ...c, isActive: !c.isActive } : c));
    saveCoupons(updated);
  };

  const deleteCoupon = async (couponId: string) => {
    try {
      await api.deleteCoupon(couponId);
    } catch (err) {
      console.warn("Could not delete coupon on backend", err);
    }
    const updated = coupons.filter((c) => c.id !== couponId);
    saveCoupons(updated);
    if (appliedCoupon?.id === couponId) {
      setAppliedCoupon(null);
    }
  };

  // irMarket live sync triggered from Admin UI
  const syncWithIrMarket = async () => {
    setIsLoadingSync(true);
    try {
      await api.triggerSync("مدیر سیستم (داشبورد ادمین)");
      await refreshFromBackend();
    } catch (error) {
      console.error("Error triggering irMarket sync:", error);
    } finally {
      setIsLoadingSync(false);
    }
  };

  const activeProducts = products.filter((p) => p.isActive);

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        settings,
        orders,
        coupons,
        auditLogs,
        cart,
        appliedCoupon,
        activeProducts,
        isLoadingSync,
        isLoadingInitial,
        isBackendConnected,
        createProduct,
        toggleProductActive,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        updateSettings,
        calculateProductPrice,
        syncWithIrMarket,
        refreshFromBackend,
        syncCurrencyNow,
        updateCurrencySyncConfig,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        createOrder,
        updateOrderStatus,
        addAdminAuditLog,
        getMaxAllowedPurchase,
        addCoupon,
        addCoupons,
        updateCoupon,
        toggleCoupon,
        deleteCoupon,
        requestRefund,
        processRefundOrder,
        rejectRefundOrder,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
