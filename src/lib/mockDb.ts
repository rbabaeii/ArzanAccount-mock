"use client";

import { Category, Product, SystemSettings, Order, Coupon, AuditLog } from "@/types";
import {
  initialCategories,
  initialProducts,
  initialOrders,
  initialCoupons,
  initialAuditLogs,
  initialSettings,
  initialMockUsers,
  initialMockCardPayments,
  initialMockWithdrawals,
  initialMockTags,
  initialMockAdminActivities,
  initialMockEmailSettings,
  initialMockEmailLogs,
  initialMockSmsSettings,
  initialMockSmsLogs,
} from "@/data/mockData";

export interface MockDatabase {
  settings: SystemSettings;
  categories: Category[];
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  auditLogs: AuditLog[];
  users: any[];
  cardPayments: any[];
  withdrawals: any[];
  tags: any[];
  adminActivities: any[];
  emailSettings: any;
  emailLogs: any[];
  smsSettings: any;
  smsLogs: any[];
  cartBeCartSettings: any;
}

const STORAGE_KEY = "arzan_mock_db_v1";

function getDefaultDatabase(): MockDatabase {
  return {
    settings: { ...initialSettings },
    categories: [...initialCategories],
    products: [...initialProducts],
    orders: [...initialOrders],
    coupons: [...initialCoupons],
    auditLogs: [...initialAuditLogs],
    users: [...initialMockUsers],
    cardPayments: [...initialMockCardPayments],
    withdrawals: [...initialMockWithdrawals],
    tags: [...initialMockTags],
    adminActivities: [...initialMockAdminActivities],
    emailSettings: { ...initialMockEmailSettings },
    emailLogs: [...initialMockEmailLogs],
    smsSettings: { ...initialMockSmsSettings },
    smsLogs: [...initialMockSmsLogs],
    cartBeCartSettings: {
      apiKey: "cbc_mock_live_key_9988",
      fallbackCardNumber: "6037-9918-4455-6677",
      fallbackCardOwner: "رضا بابایی (ارزان اکانت)",
      fallbackBankName: "بانک ملی ایران",
      enabled: true,
    },
  };
}

let memoryDb: MockDatabase = getDefaultDatabase();

export function getMockDb(): MockDatabase {
  if (typeof window === "undefined") {
    return memoryDb;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const def = getDefaultDatabase();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(def));
      memoryDb = def;
      return def;
    }
    const parsed = JSON.parse(raw);
    memoryDb = parsed;
    return parsed;
  } catch (e) {
    console.warn("Failed to load mock DB from localStorage, using memory", e);
    return memoryDb;
  }
}

export function saveMockDb(db: MockDatabase) {
  memoryDb = db;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      window.dispatchEvent(new CustomEvent("arzan_mock_db_sync", { detail: db }));
    } catch (e) {
      console.warn("Failed to save mock DB to localStorage", e);
    }
  }
}

// Helper to delay simulation
function delay(ms = 60): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockDb = {
  // Settings
  async getSettings() {
    await delay();
    return getMockDb().settings;
  },

  async updateSettings(updates: Partial<SystemSettings>) {
    await delay();
    const db = getMockDb();
    db.settings = { ...db.settings, ...updates };
    saveMockDb(db);
    return db.settings;
  },

  // Categories
  async getCategories() {
    await delay();
    return getMockDb().categories;
  },

  async createCategory(cat: Omit<Category, "id">) {
    await delay();
    const db = getMockDb();
    const newCat: Category = {
      ...cat,
      id: "cat-" + Date.now().toString(36),
    };
    db.categories.push(newCat);
    saveMockDb(db);
    return newCat;
  },

  async updateCategory(id: string, updates: Partial<Category>) {
    await delay();
    const db = getMockDb();
    db.categories = db.categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
    saveMockDb(db);
    return db.categories.find((c) => c.id === id);
  },

  async deleteCategory(id: string) {
    await delay();
    const db = getMockDb();
    db.categories = db.categories.filter((c) => c.id !== id);
    saveMockDb(db);
    return { success: true };
  },

  // Products
  async getProducts(params?: { search?: string; categoryId?: string; inStock?: boolean; limit?: number }) {
    await delay();
    const db = getMockDb();
    let prods = [...db.products];
    if (params?.categoryId && params.categoryId !== "all") {
      prods = prods.filter((p) => p.categoryId === params.categoryId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      prods = prods.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.customTitle?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (params?.limit) {
      prods = prods.slice(0, params.limit);
    }
    return { products: prods, total: prods.length };
  },

  async getProductById(id: string) {
    await delay();
    const db = getMockDb();
    return db.products.find((p) => p.id === id || String(p.externalId) === id) || null;
  },

  async createProduct(data: Partial<Product>, adminUser = "مدیر سیستم") {
    await delay();
    const db = getMockDb();
    const newProduct: Product = {
      id: "prod-" + Date.now().toString(36),
      externalId: Math.floor(1000 + Math.random() * 9000),
      name: data.name || "محصول جدید",
      customTitle: data.customTitle || data.name || "محصول جدید",
      costPriceUsd: data.costPriceUsd ?? 5.0,
      retailPriceUsd: data.retailPriceUsd ?? 7.0,
      pricingUnit: data.pricingUnit || "unit",
      stockCount: data.stockCount ?? 50,
      inStock: data.inStock ?? true,
      rating: data.rating ?? 5.0,
      reviewCount: data.reviewCount ?? 1,
      requiresEmail: data.requiresEmail ?? false,
      isActive: data.isActive ?? true,
      isFeatured: data.isFeatured ?? false,
      isFlashDeal: data.isFlashDeal ?? false,
      customMarginPercent: data.customMarginPercent ?? 15,
      categoryId: data.categoryId || "cat-tools",
      description: data.description || "توضیحات پیش‌فرض محصول جدید",
      image:
        data.image ||
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      tags: data.tags || [],
      specs: data.specs || [],
    };
    db.products.unshift(newProduct);

    // Add audit log
    db.auditLogs.unshift({
      id: "log-" + Date.now(),
      action: "ایجاد محصول جدید",
      details: `محصول ${newProduct.customTitle} توسط ${adminUser} ایجاد شد.`,
      user: adminUser,
      timestamp: "هم‌اکنون",
      createdAt: new Date().toISOString(),
      type: "product_create",
    });

    saveMockDb(db);
    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>, adminUser = "مدیر سیستم") {
    await delay();
    const db = getMockDb();
    db.products = db.products.map((p) => (p.id === id ? { ...p, ...updates } : p));

    db.auditLogs.unshift({
      id: "log-" + Date.now(),
      action: "ویرایش محصول",
      details: `محصول ${id} توسط ${adminUser} به‌روزرسانی شد.`,
      user: adminUser,
      timestamp: "هم‌اکنون",
      createdAt: new Date().toISOString(),
      type: "product_update",
    });

    saveMockDb(db);
    return db.products.find((p) => p.id === id);
  },

  async toggleProductActive(id: string, adminUser = "مدیر سیستم") {
    await delay();
    const db = getMockDb();
    const target = db.products.find((p) => p.id === id);
    if (target) {
      target.isActive = !target.isActive;
      db.auditLogs.unshift({
        id: "log-" + Date.now(),
        action: target.isActive ? "فعال‌سازی محصول" : "غیرفعال‌سازی محصول",
        details: `وضعیت محصول ${target.customTitle} تغییر یافت.`,
        user: adminUser,
        timestamp: "هم‌اکنون",
        createdAt: new Date().toISOString(),
        type: "product_toggle",
      });
      saveMockDb(db);
    }
    return target;
  },

  async deleteProduct(id: string, adminUser = "مدیر سیستم") {
    await delay();
    const db = getMockDb();
    db.products = db.products.filter((p) => p.id !== id);
    saveMockDb(db);
    return { success: true };
  },

  async validateLiveStock(productId: string, quantity: number) {
    await delay();
    const db = getMockDb();
    const product = db.products.find((p) => p.id === productId || String(p.externalId) === productId);
    if (!product) {
      return { valid: false, inStock: false, message: "محصول یافت نشد." };
    }
    const inStock = product.inStock !== false && product.stockCount >= quantity;
    return {
      valid: inStock,
      inStock,
      stockCount: product.stockCount,
      productTitle: product.customTitle,
    };
  },

  // Orders
  async getOrders(params?: { status?: string; customerEmail?: string; limit?: number }) {
    await delay();
    const db = getMockDb();
    let orders = [...db.orders];
    if (params?.status && params.status !== "all") {
      orders = orders.filter((o) => o.status === params.status);
    }
    if (params?.customerEmail) {
      orders = orders.filter((o) => o.customerEmail === params.customerEmail);
    }
    if (params?.limit) {
      orders = orders.slice(0, params.limit);
    }
    return { orders, totalCount: orders.length };
  },

  async getOrderById(id: string) {
    await delay();
    const db = getMockDb();
    return db.orders.find((o) => o.id === id || o.orderNumber === id) || null;
  },

  async createOrder(orderData: any) {
    await delay();
    const db = getMockDb();
    const orderNumber = "ARZ-" + Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      id: "order-" + Date.now().toString(36),
      orderNumber,
      createdAt: new Date().toISOString(),
      customerEmail: orderData.customerEmail || "customer@gmail.com",
      customerPhone: orderData.customerPhone || "09180000000",
      customerLink: orderData.customerLink,
      items: orderData.items || [],
      totalPriceToman: orderData.totalPriceToman || 0,
      totalPriceUsd: orderData.totalPriceUsd || 0,
      status: "processing",
      paymentGateway: orderData.paymentGateway || "cartbecart",
      discountAppliedToman: orderData.discountAppliedToman,
      deliveryType: orderData.deliveryType,
    };
    db.orders.unshift(newOrder);

    // If customer has a wallet and used it, update wallet balance
    if (orderData.paymentGateway === "wallet") {
      const user = db.users.find((u) => u.phone === newOrder.customerPhone || u.email === newOrder.customerEmail);
      if (user && user.walletBalanceToman >= newOrder.totalPriceToman) {
        user.walletBalanceToman -= newOrder.totalPriceToman;
      }
    }

    db.auditLogs.unshift({
      id: "log-" + Date.now(),
      action: "ثبت سفارش جدید",
      details: `سفارش #${orderNumber} به مبلغ ${newOrder.totalPriceToman.toLocaleString()} تومان ثبت شد.`,
      user: newOrder.customerPhone || newOrder.customerEmail,
      timestamp: "هم‌اکنون",
      createdAt: new Date().toISOString(),
      type: "order_create",
    });

    saveMockDb(db);
    return newOrder;
  },

  async updateOrderStatus(orderId: string, statusOrData: any, adminName = "مدیر سیستم") {
    await delay();
    const db = getMockDb();
    const order = db.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (order) {
      const newStatus = typeof statusOrData === "string" ? statusOrData : statusOrData.status;
      order.status = newStatus;
      if (typeof statusOrData === "object") {
        if (statusOrData.deliveredAccounts) {
          order.deliveredAccounts = statusOrData.deliveredAccounts;
        }
        if (statusOrData.adminName) {
          order.approvedByAdminName = statusOrData.adminName;
        }
      }
      if (newStatus === "delivered" || newStatus === "approved") {
        order.approvedAt = new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
        order.approvedByAdminName = adminName;
      }

      db.auditLogs.unshift({
        id: "log-" + Date.now(),
        action: `تغییر وضعیت سفارش #${order.orderNumber} به ${newStatus}`,
        details: `سفارش #${order.orderNumber} توسط ${adminName} به روز شد.`,
        user: adminName,
        timestamp: "هم‌اکنون",
        createdAt: new Date().toISOString(),
        type: "order_status",
      });

      saveMockDb(db);
    }
    return order;
  },

  async requestRefund(orderId: string, refundReason: string, refundCardNumber?: string, refundIban?: string) {
    await delay();
    const db = getMockDb();
    const order = db.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) {
      throw new Error("سفارش یافت نشد.");
    }
    order.status = "refund_requested";
    order.refundReason = refundReason;
    order.refundCardNumber = refundCardNumber;
    order.refundIban = refundIban;
    order.refundAmountToman = order.totalPriceToman;

    saveMockDb(db);
    return { success: true, message: "درخواست استرداد وجه با موفقیت ثبت شد و در صف بررسی مدیران مالی قرار گرفت." };
  },

  async getRefundRequests() {
    await delay();
    const db = getMockDb();
    return db.orders.filter((o) => o.status === "refund_requested");
  },

  async processRefund(dto: {
    orderId: string;
    refundMethod: "bank_card" | "wallet";
    trackingCode?: string;
    receiptUrl?: string;
    adminName?: string;
  }) {
    await delay();
    const db = getMockDb();
    const order = db.orders.find((o) => o.id === dto.orderId || o.orderNumber === dto.orderId);
    if (order) {
      order.status = "refunded";
      order.refundMethod = dto.refundMethod;
      order.refundTrackingCode = dto.trackingCode || "TRK-" + Math.floor(100000 + Math.random() * 900000);
      order.refundReceiptUrl = dto.receiptUrl;
      order.refundedByAdminName = dto.adminName || "مدیر مالی";
      order.refundedAt = new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(new Date());

      // If method is wallet, increase user wallet balance
      if (dto.refundMethod === "wallet") {
        const user = db.users.find((u) => u.phone === order.customerPhone || u.email === order.customerEmail);
        if (user) {
          user.walletBalanceToman = (user.walletBalanceToman || 0) + (order.refundAmountToman || order.totalPriceToman);
        }
      }

      db.auditLogs.unshift({
        id: "log-" + Date.now(),
        action: `استرداد وجه سفارش #${order.orderNumber}`,
        details: `مبلغ ${(order.refundAmountToman || order.totalPriceToman).toLocaleString()} تومان از طریق ${dto.refundMethod === "wallet" ? "کیف پول" : "کارت بانکی"} بازگردانده شد.`,
        user: dto.adminName || "مدیر مالی",
        timestamp: "هم‌اکنون",
        createdAt: new Date().toISOString(),
        type: "refund_processed",
      });

      saveMockDb(db);
    }
    return { success: true, order };
  },

  async rejectRefund(orderId: string, data: { rejectionReason: string; newStatus?: string; adminName?: string }) {
    await delay();
    const db = getMockDb();
    const order = db.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (order) {
      order.status = (data.newStatus as any) || "delivered";
      order.refundRejectionReason = data.rejectionReason;
      db.auditLogs.unshift({
        id: "log-" + Date.now(),
        action: `رد درخواست استرداد سفارش #${order.orderNumber}`,
        details: `علت: ${data.rejectionReason}`,
        user: data.adminName || "مدیر سیستم",
        timestamp: "هم‌اکنون",
        createdAt: new Date().toISOString(),
        type: "refund_rejected",
      });
      saveMockDb(db);
    }
    return { success: true, order };
  },

  // Coupons
  async getCoupons() {
    await delay();
    return getMockDb().coupons;
  },

  async getCouponById(id: string) {
    await delay();
    return getMockDb().coupons.find((c) => c.id === id || c.code === id) || null;
  },

  async createCoupon(data: any) {
    await delay();
    const db = getMockDb();
    const newCoupon: Coupon = {
      id: "coup-" + Date.now().toString(36),
      code: data.code.toUpperCase(),
      discountPercent: data.discountPercent,
      maxDiscountToman: data.maxDiscountToman || 100000,
      minOrderToman: data.minOrderToman || 0,
      expiresAt: data.expiresAt,
      maxUsage: data.maxUsage || 100,
      usageCount: 0,
      isActive: data.isActive !== false,
      targetType: data.targetType || "ALL",
      targetUserIds: data.allowedUserIds || [],
    };
    db.coupons.unshift(newCoupon);
    saveMockDb(db);
    return newCoupon;
  },

  async updateCoupon(id: string, updates: Partial<Coupon>) {
    await delay();
    const db = getMockDb();
    db.coupons = db.coupons.map((c) => (c.id === id ? { ...c, ...updates } : c));
    saveMockDb(db);
    return db.coupons.find((c) => c.id === id);
  },

  async deleteCoupon(id: string) {
    await delay();
    const db = getMockDb();
    db.coupons = db.coupons.filter((c) => c.id !== id);
    saveMockDb(db);
    return { success: true };
  },

  async validateCoupon(code: string, userId?: string) {
    await delay();
    const db = getMockDb();
    const coupon = db.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
    if (!coupon) {
      throw new Error("کد تخفیف معتبر نیست یا منقضی شده است.");
    }
    if (coupon.usageCount >= coupon.maxUsage) {
      throw new Error("سقف استفاده از این کد تخفیف به پایان رسیده است.");
    }
    if (coupon.targetType === "USER" && coupon.targetUserIds?.length && userId) {
      if (!coupon.targetUserIds.includes(userId)) {
        throw new Error("این کد تخفیف مختص کاربر دیگری صادر شده است.");
      }
    }
    return {
      success: true,
      valid: true,
      message: "کد تخفیف معتبر است.",
      coupon,
      ...coupon,
    };
  },

  // Users & Auth
  async getUsers(params?: { search?: string; role?: string; status?: string; limit?: number }) {
    await delay();
    const db = getMockDb();
    let users = [...db.users];
    if (params?.role && params.role !== "all") {
      users = users.filter((u) => u.role === params.role);
    }
    if (params?.status && params.status !== "all") {
      users = users.filter((u) => u.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.phone?.includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }
    return {
      users,
      totalCount: users.length,
      stats: {
        totalUsers: db.users.length,
        activeUsers: db.users.filter((u) => u.status === "ACTIVE").length,
        totalAdmins: db.users.filter((u) => u.role !== "USER").length,
        twoFactorCount: db.users.filter((u) => u.isTwoFactorEnabled).length,
      },
    };
  },

  async getUserById(id: string) {
    await delay();
    const db = getMockDb();
    return db.users.find((u) => u.id === id || u.phone === id) || null;
  },

  async createUser(data: any) {
    await delay();
    const db = getMockDb();
    const newUser = {
      id: "user-" + Date.now().toString(36),
      name: data.name,
      phone: data.phone,
      email: data.email,
      role: data.role || "USER",
      status: data.status || "ACTIVE",
      walletBalanceToman: data.walletBalanceToman || 0,
      directDepositBalance: data.walletBalanceToman || 0,
      isTwoFactorEnabled: Boolean(data.isTwoFactorEnabled),
      createdAt: new Intl.DateTimeFormat("fa-IR", { dateStyle: "short" }).format(new Date()),
    };
    db.users.unshift(newUser);
    saveMockDb(db);
    return newUser;
  },

  async updateUserRole(id: string, role: string, adminUser = "مدیر ارشد") {
    await delay();
    const db = getMockDb();
    const user = db.users.find((u) => u.id === id);
    if (user) {
      user.role = role;
      db.auditLogs.unshift({
        id: "log-" + Date.now(),
        action: `تغییر سطح دسترسی کاربر ${user.name}`,
        details: `نقش کاربر به ${role} تغییر یافت توسط ${adminUser}`,
        user: adminUser,
        timestamp: "هم‌اکنون",
        createdAt: new Date().toISOString(),
        type: "user_role",
      });
      saveMockDb(db);
    }
    return user;
  },

  async updateUserStatus(id: string, status: string, adminUser = "مدیر ارشد") {
    await delay();
    const db = getMockDb();
    const user = db.users.find((u) => u.id === id);
    if (user) {
      user.status = status;
      db.auditLogs.unshift({
        id: "log-" + Date.now(),
        action: `تغییر وضعیت کاربر ${user.name}`,
        details: `وضعیت به ${status} تغییر یافت توسط ${adminUser}`,
        user: adminUser,
        timestamp: "هم‌اکنون",
        createdAt: new Date().toISOString(),
        type: "user_status",
      });
      saveMockDb(db);
    }
    return user;
  },

  async deleteUser(id: string, adminUser = "مدیر ارشد") {
    await delay();
    const db = getMockDb();
    db.users = db.users.filter((u) => u.id !== id);
    saveMockDb(db);
    return { success: true };
  },

  async updateUserProfile(id: string, updates: any) {
    await delay();
    const db = getMockDb();
    const user = db.users.find((u) => u.id === id || u.phone === id);
    if (user) {
      Object.assign(user, updates);
      saveMockDb(db);
      return user;
    }
    return null;
  },

  async topUpWallet(id: string, amountToman: number) {
    await delay();
    const db = getMockDb();
    const user = db.users.find((u) => u.id === id || u.phone === id);
    if (user) {
      user.walletBalanceToman = (user.walletBalanceToman || 0) + amountToman;
      user.directDepositBalance = (user.directDepositBalance || 0) + amountToman;
      saveMockDb(db);
      return {
        success: true,
        newBalance: user.walletBalanceToman,
        walletBalanceToman: user.walletBalanceToman,
        directDepositBalance: user.directDepositBalance,
      };
    }
    return { success: false, newBalance: 0, walletBalanceToman: 0, directDepositBalance: 0 };
  },

  async convertPoints(id: string, points: number) {
    await delay();
    const db = getMockDb();
    const user = db.users.find((u) => u.id === id || u.phone === id);
    if (user && (user.clubPoints || 0) >= points) {
      user.clubPoints -= points;
      const discountToman = points * 1000;
      const couponCode = "CLUB-" + Math.floor(1000 + Math.random() * 9000);
      const coupon: Coupon = {
        id: "coup-" + Date.now().toString(36),
        code: couponCode,
        discountPercent: 15,
        maxDiscountToman: discountToman,
        minOrderToman: discountToman * 2,
        usageCount: 0,
        maxUsage: 1,
        isActive: true,
        targetType: "USER",
        targetUserIds: [user.id],
      };
      db.coupons.unshift(coupon);
      saveMockDb(db);
      return { success: true, coupon, user };
    }
    throw new Error("امتیاز باشگاه مشتریان ناکافی است.");
  },

  // Card Payments (CartBeCart)
  async getCardPayments(params?: any) {
    await delay();
    const db = getMockDb();
    let payments = [...db.cardPayments];
    if (params?.status && params.status !== "all") {
      payments = payments.filter((p) => p.status === params.status);
    }
    if (params?.type && params.type !== "all") {
      payments = payments.filter((p) => p.paymentType === params.type);
    }
    if (params?.userId) {
      payments = payments.filter((p) => p.userId === params.userId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      payments = payments.filter(
        (p) =>
          p.orderNumber?.toLowerCase().includes(q) ||
          p.trackingCode?.toLowerCase().includes(q) ||
          p.customerName?.toLowerCase().includes(q) ||
          p.customerPhone?.includes(q)
      );
    }
    return { payments, items: payments, total: payments.length, totalCount: payments.length };
  },

  async initiateCardPayment(data: any) {
    await delay();
    const db = getMockDb();
    const paymentToken = "pay-tok-" + Date.now().toString(36);
    const newPayment = {
      id: "pay-" + Date.now().toString(36),
      paymentToken,
      orderNumber: data.orderNumber || "ARZ-" + Math.floor(1000 + Math.random() * 9000),
      orderId: data.orderId,
      userId: data.userId || "mock-regular-user",
      customerName: data.customerName || "کاربر عادی",
      customerPhone: data.customerPhone || "09180000000",
      amountToman: data.amountToman,
      paymentType: data.paymentType || "ORDER",
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    db.cardPayments.unshift(newPayment);
    saveMockDb(db);
    const amountToman = Number(data.amountToman) || 100000;
    const amountRial = amountToman * 10;
    const destCardNumber = db.cartBeCartSettings?.fallbackCardNumber || "6037-9918-4455-6677";
    const destCardOwner = db.cartBeCartSettings?.fallbackCardOwner || "رضا بابایی (ارزان اکانت)";
    return {
      success: true,
      id: newPayment.id,
      paymentToken,
      orderNumber: newPayment.orderNumber,
      amountToman,
      amountRial,
      uniqueAmountRial: amountRial,
      uniqueAmountToman: amountToman,
      destCardNumber,
      destCardOwner,
      cardNumber: destCardNumber,
      cardOwner: destCardOwner,
      bankName: db.cartBeCartSettings?.fallbackBankName || "بانک ملی ایران",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: "PENDING",
    };
  },

  async checkCardPaymentStatus(paymentToken: string) {
    await delay();
    const db = getMockDb();
    const payment = db.cardPayments.find((p) => p.paymentToken === paymentToken);
    return payment || { status: "PENDING" };
  },

  async submitManualReceipt(data: any) {
    await delay();
    const db = getMockDb();
    let payment = db.cardPayments.find((p) => p.paymentToken === data.paymentToken || p.orderNumber === data.orderNumber);
    if (!payment) {
      payment = {
        id: "pay-" + Date.now().toString(36),
        paymentToken: data.paymentToken || "pay-tok-" + Date.now().toString(36),
        orderNumber: data.orderNumber,
        orderId: data.orderId,
        userId: data.userId || "mock-regular-user",
        amountToman: data.amountToman,
        paymentType: data.paymentType || "ORDER",
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };
      db.cardPayments.unshift(payment);
    }
    payment.trackingCode = data.trackingCode;
    payment.userCardNumber = data.userCardNumber;
    payment.receiptUrl = data.receiptUrl || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80";
    payment.depositTime = data.depositTime || new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
    payment.userNote = data.userNote;

    saveMockDb(db);
    return {
      success: true,
      message: "فیش واریزی با موفقیت ثبت شد.",
      paymentToken: payment.paymentToken,
      payment,
    };
  },

  async adminApproveCardPayment(id: string, data: { adminNote?: string }, adminUser?: any) {
    await delay();
    const db = getMockDb();
    const payment = db.cardPayments.find((p) => p.id === id || p.paymentToken === id);
    if (payment) {
      payment.status = "APPROVED";
      payment.adminNote = data.adminNote;
      payment.approvedBy = adminUser?.name || "مدیر مالی";

      // If associated with order, auto-approve the order
      if (payment.orderNumber) {
        const order = db.orders.find((o) => o.orderNumber === payment.orderNumber);
        if (order && (order.status === "processing" || order.status === "pending")) {
          order.status = "delivered";
          order.approvedAt = new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
          order.approvedByAdminName = adminUser?.name || "مدیر مالی";

          const accounts: string[] = [];
          if (Array.isArray(order.items) && order.items.length > 0) {
            order.items.forEach((item: any) => {
              const qty = item.quantity || 1;
              for (let q = 1; q <= Math.min(qty, 5); q++) {
                accounts.push(
                  `${item.productTitle || "سرویس دیجیتال"}: لایسنس اختصاصی ARZ-LIC-${Math.floor(100000 + Math.random() * 900000)} | رمز یکبار مصرف: arz_${Math.random().toString(36).substring(2, 7)}`
                );
              }
            });
          }
          if (accounts.length === 0) {
            accounts.push(
              "اکانت اختصاصی تحویل داده شد:",
              `سرویس: ${order.items?.[0]?.productTitle || "محصول دیجیتال"}`,
              "لایسنس: ARZ-LIC-" + Math.floor(100000 + Math.random() * 900000)
            );
          }
          order.deliveredAccounts = accounts;
        }
      }

      // If wallet topup, increase user wallet
      if (payment.paymentType === "WALLET_TOPUP") {
        const user = db.users.find((u) => u.id === payment.userId || u.phone === payment.customerPhone);
        if (user) {
          user.walletBalanceToman = (user.walletBalanceToman || 0) + payment.amountToman;
        }
      }

      saveMockDb(db);
    }
    return { success: true, payment };
  },

  async adminRejectCardPayment(id: string, data: { reason: string }, adminUser?: any) {
    await delay();
    const db = getMockDb();
    const payment = db.cardPayments.find((p) => p.id === id || p.paymentToken === id);
    if (payment) {
      payment.status = "REJECTED";
      payment.rejectionReason = data.reason;
      payment.rejectedBy = adminUser?.name || "مدیر مالی";
      saveMockDb(db);
    }
    return { success: true, payment };
  },

  async getCartBeCartSettings() {
    await delay();
    return getMockDb().cartBeCartSettings;
  },

  async updateCartBeCartSettings(data: any) {
    await delay();
    const db = getMockDb();
    db.cartBeCartSettings = { ...db.cartBeCartSettings, ...data };
    saveMockDb(db);
    return db.cartBeCartSettings;
  },

  // Withdrawals
  async getWithdrawals(params?: any) {
    await delay();
    const db = getMockDb();
    let requests = [...db.withdrawals];
    if (params?.status && params.status !== "all") {
      requests = requests.filter((r) => r.status === params.status);
    }
    if (params?.userId) {
      requests = requests.filter((r) => r.userId === params.userId);
    }
    return { requests, totalCount: requests.length };
  },

  async requestWithdrawal(userId: string, data: any) {
    await delay();
    const db = getMockDb();
    const user = db.users.find((u) => u.id === userId || u.phone === userId);
    if (!user || user.walletBalanceToman < data.amountToman) {
      throw new Error("موجودی کیف پول برای این درخواست تسویه کافی نیست.");
    }
    user.walletBalanceToman -= data.amountToman;
    const newReq = {
      id: "wd-" + Date.now().toString(36),
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      amountToman: data.amountToman,
      cardNumber: data.cardNumber,
      sheba: data.sheba,
      accountOwnerName: data.accountOwnerName || user.name,
      status: "PENDING",
      userNote: data.userNote,
      createdAt: new Date().toISOString(),
    };
    db.withdrawals.unshift(newReq);
    saveMockDb(db);
    return { success: true, message: "درخواست تسویه با موفقیت ثبت شد." };
  },

  async processWithdrawal(id: string, data: any) {
    await delay();
    const db = getMockDb();
    const req = db.withdrawals.find((w) => w.id === id);
    if (req) {
      req.status = data.action === "APPROVE" ? "APPROVED" : "REJECTED";
      req.adminNote = data.adminNote;
      req.bankTrackingCode = data.bankTrackingCode;
      req.bankReceiptUrl = data.bankReceiptUrl;
      req.adminName = data.adminName || "مدیر مالی";

      // If rejected, refund balance back to user
      if (data.action === "REJECT") {
        const user = db.users.find((u) => u.id === req.userId);
        if (user) {
          user.walletBalanceToman += req.amountToman;
        }
      }

      saveMockDb(db);
    }
    return {
      success: true,
      request: req,
      message: data.action === "APPROVE" ? "درخواست تسویه با موفقیت تایید شد." : "درخواست تسویه رد شد.",
    };
  },

  // Tags
  async getAllTags() {
    await delay();
    return getMockDb().tags;
  },

  async createTag(data: { tag: string; productIds?: string[]; user?: string }) {
    await delay();
    const db = getMockDb();
    const existing = db.tags.find((t) => t.name.toLowerCase() === data.tag.toLowerCase());
    if (!existing) {
      db.tags.unshift({
        name: data.tag,
        count: data.productIds?.length || 0,
        sampleProducts: [],
      });
      saveMockDb(db);
    }
    return { tag: data.tag, affectedCount: 1 };
  },

  async renameTag(data: { oldTag: string; newTag: string; user?: string }) {
    await delay();
    const db = getMockDb();
    const target = db.tags.find((t) => t.name === data.oldTag);
    if (target) {
      target.name = data.newTag;
      saveMockDb(db);
    }
    return { oldTag: data.oldTag, newTag: data.newTag, affectedCount: 1 };
  },

  async deleteTag(tag: string) {
    await delay();
    const db = getMockDb();
    db.tags = db.tags.filter((t) => t.name !== tag);
    saveMockDb(db);
    return { tag, affectedCount: 1 };
  },

  async assignTag(data: { tag: string; productIds: string[]; action?: "add" | "remove" }) {
    await delay();
    const db = getMockDb();
    const tag = db.tags.find((t) => t.name === data.tag);
    if (tag) {
      tag.count = Math.max(0, tag.count + (data.action === "remove" ? -1 : 1) * (data.productIds?.length || 1));
      saveMockDb(db);
    }
    return { tag: data.tag, action: data.action || "add", updatedCount: data.productIds.length };
  },

  // Email
  async getEmailSettings() {
    await delay();
    return getMockDb().emailSettings;
  },

  async updateEmailSettings(config: any) {
    await delay();
    const db = getMockDb();
    db.emailSettings = { ...db.emailSettings, ...config };
    saveMockDb(db);
    return db.emailSettings;
  },

  async sendTestEmail(to: string, template = "test") {
    await delay();
    const db = getMockDb();
    const log = {
      id: "elog-" + Date.now(),
      recipient: to,
      subject: `ایمیل آزمایشی الگو (${template})`,
      status: "DELIVERED",
      template,
      sentAt: new Date().toISOString(),
    };
    db.emailLogs.unshift(log);
    saveMockDb(db);
    return { success: true, message: `ایمیل تستی با موفقیت به آدرس ${to} ارسال شد.` };
  },

  async getEmailStats() {
    await delay();
    const db = getMockDb();
    const total = db.emailLogs.length + 30;
    const sent = total;
    const failed = 0;
    return {
      total,
      sent,
      failed,
      todayCount: Math.min(12, total),
      deliveryRate: 100,
      lastSentAt: db.emailLogs[0]?.sentAt || "هم‌اکنون",
      lastStatus: "CONNECTED",
    };
  },

  async getEmailLogs(params?: any) {
    await delay();
    const db = getMockDb();
    return { logs: db.emailLogs, total: db.emailLogs.length };
  },

  // SMS
  async getSmsSettings() {
    await delay();
    return getMockDb().smsSettings;
  },

  async updateSmsSettings(config: any) {
    await delay();
    const db = getMockDb();
    db.smsSettings = { ...db.smsSettings, ...config };
    saveMockDb(db);
    return db.smsSettings;
  },

  async sendTestSms(data: { to: string; bodyId: number; args?: any[] }): Promise<{
    success: boolean;
    message: string;
    recId?: string;
    errorMessage?: string;
  }> {
    await delay();
    const db = getMockDb();
    const log = {
      id: "slog-" + Date.now(),
      phone: data.to,
      message: `پیامک تستی به پترن ${data.bodyId} با موفقیت شبیه‌سازی شد.`,
      status: "DELIVERED",
      template: String(data.bodyId),
      sentAt: new Date().toISOString(),
    };
    db.smsLogs.unshift(log);
    saveMockDb(db);
    return {
      success: true,
      message: `پیامک تستی به شماره ${data.to} ارسال شد.`,
      recId: "KAV-" + Math.floor(100000 + Math.random() * 900000),
    };
  },

  async sendCouponSms(data: { phone: string; code: string; discountPercent: number; customerName?: string }) {
    await delay();
    const db = getMockDb();
    const log = {
      id: "slog-" + Date.now(),
      phone: data.phone,
      message: `کد تخفیف ${data.code} به میزان ${data.discountPercent}% برای ${data.customerName || "شما"} ارسال شد.`,
      status: "DELIVERED",
      template: "coupon",
      sentAt: new Date().toISOString(),
    };
    db.smsLogs.unshift(log);
    saveMockDb(db);
    return { success: true, message: "پیامک کوپن تخفیف با موفقیت ارسال شد." };
  },

  async getSmsStats() {
    await delay();
    const db = getMockDb();
    const total = db.smsLogs.length + 420;
    return {
      total,
      sent: total,
      failed: 0,
      todayCount: 24,
      deliveryRate: 100,
      lastSentAt: db.smsLogs[0]?.sentAt || null,
      lastStatus: "CONNECTED",
    };
  },

  async getSmsLogs(params?: any) {
    await delay();
    const db = getMockDb();
    return { items: db.smsLogs, total: db.smsLogs.length, limit: 20, offset: 0 };
  },

  // Activities & Logs
  async getAdminActivities(params?: {
    adminId?: string;
    type?: string;
    search?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }) {
    await delay();
    const db = getMockDb();
    let acts = [...db.adminActivities];
    if (params?.adminId && params.adminId !== "all") {
      acts = acts.filter((a) => a.adminId === params.adminId);
    }
    if (params?.type && params.type !== "all") {
      acts = acts.filter((a) => a.action === params.type || (a as any).type === params.type);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      acts = acts.filter(
        (a) =>
          a.adminName?.toLowerCase().includes(q) ||
          a.details?.toLowerCase().includes(q) ||
          a.target?.toLowerCase().includes(q)
      );
    }
    if (params?.limit) {
      acts = acts.slice(0, params.limit);
    }
    return { activities: acts, total: acts.length };
  },

  async getAdminActivitySummary(adminId: string) {
    await delay();
    const db = getMockDb();
    const acts = db.adminActivities.filter((a) => a.adminId === adminId);
    return {
      totalActions: acts.length,
      lastAction: acts[0]?.createdAt || new Date().toISOString(),
    };
  },

  async getAuditLogs(limit = 40) {
    await delay();
    const db = getMockDb();
    return db.auditLogs.slice(0, limit);
  },

  // Search
  async searchLive(query: string, scope: "public" | "admin" | "all" = "public", limit = 10) {
    await delay();
    const db = getMockDb();
    const q = query.toLowerCase().trim();
    if (!q) {
      return {
        products: [],
        categories: [],
        suggestions: [],
        totalMatches: 0,
        tookMs: 1,
      };
    }
    const matchedProds = db.products.filter((p) => {
      if (scope === "public" && !p.isActive) return false;
      return (
        p.name.toLowerCase().includes(q) ||
        p.customTitle?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }).slice(0, limit);

    const matchedCats = db.categories.filter((c) =>
      c.title.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    ).slice(0, 3);

    return {
      products: matchedProds.map((item) => ({ item, score: 1, highlights: [] })),
      categories: matchedCats.map((item) => ({ item, score: 1 })),
      suggestions: [q + " ارزان", q + " فوری"],
      totalMatches: matchedProds.length + matchedCats.length,
      tookMs: 5,
    };
  },

  async searchByTag(tag: string, limit = 20) {
    await delay();
    const db = getMockDb();
    const t = tag.toLowerCase().trim();
    return db.products.filter((p) => p.isActive && p.tags?.some((tagItem) => tagItem.toLowerCase().includes(t))).slice(0, limit);
  },

  async getRelatedProducts(productId: string, limit = 4) {
    await delay();
    const db = getMockDb();
    const current = db.products.find((p) => p.id === productId);
    return db.products
      .filter((p) => p.id !== productId && p.isActive && (!current || p.categoryId === current.categoryId))
      .slice(0, limit);
  },

  // Media / File Upload simulation
  async uploadFile(file: File, folder = "products") {
    await delay();
    // Return a realistic image data or url
    return {
      success: true,
      url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
      filename: file.name,
      size: file.size,
    };
  },
};
