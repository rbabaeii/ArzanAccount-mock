/**
 * Standalone Local API Client for arzanAccount
 * Fully backed by the in-memory & localStorage mockDb engine.
 * Zero dependency on external backend server.
 */

import { mockDb, getMockDb } from "./mockDb";

export const api = {
  // Settings
  getSettings: () => mockDb.getSettings(),

  updateBrandingSettings: (data: {
    siteLogo?: string;
    siteLogoDark?: string;
    siteFavicon?: string;
    siteName?: string;
    siteTagline?: string;
    siteDescription?: string;
    sitePhone?: string;
    siteEmail?: string;
    supportTelegram?: string;
    siteInstagram?: string;
    siteEnamad?: string;
    user?: string;
  }) => mockDb.updateSettings(data),

  // Categories
  getCategories: () => mockDb.getCategories(),

  createCategory: (data: { title: string; titleFa?: string; slug: string; description?: string; icon?: string }) =>
    mockDb.createCategory({
      title: data.titleFa || data.title,
      slug: data.slug,
      description: data.description || "",
      icon: data.icon || "Sparkles",
      orderIndex: 0,
    }),

  addCategory: (data: { title: string; titleFa?: string; slug: string; description?: string; icon?: string }) =>
    mockDb.createCategory({
      title: data.titleFa || data.title,
      slug: data.slug,
      description: data.description || "",
      icon: data.icon || "Sparkles",
      orderIndex: 0,
    }),

  updateCategory: (id: string, data: { title?: string; slug?: string; description?: string; icon?: string }) =>
    mockDb.updateCategory(id, data),

  deleteCategory: (id: string) => mockDb.deleteCategory(id),

  // Products
  getProducts: (params?: { categoryId?: string; search?: string; limit?: number; offset?: number }) =>
    mockDb.getProducts(params),

  getProductById: (id: string) => mockDb.getProductById(id),

  getLiveProduct: (id: string) => mockDb.getProductById(id),

  createProduct: (data: any, adminUser = "مدیر سیستم") => mockDb.createProduct(data, adminUser),

  updateProduct: (id: string, data: any, adminUser = "مدیر سیستم") =>
    mockDb.updateProduct(id, data, adminUser),

  deleteProduct: (id: string, adminUser = "مدیر سیستم") => mockDb.deleteProduct(id, adminUser),

  toggleProductActive: (id: string, adminUser = "مدیر سیستم") =>
    mockDb.toggleProductActive(id, adminUser),

  validateLiveStock: (productId: string, quantity: number) =>
    mockDb.validateLiveStock(productId, quantity),

  triggerSync: async (user?: string) => api.syncWithIrMarket(),

  updateCurrency: async (data: {
    usdToRialRate?: number;
    rate?: number;
    margin?: number;
    defaultMarginPercent?: number;
    maxPurchaseRatioDenominator?: number;
    purchaseRatioExemptionThreshold?: number;
    orderCashbackPercent?: number;
    user?: string;
  }) =>
    mockDb.updateSettings({
      usdToRialRate: data.usdToRialRate ?? data.rate,
      defaultMarginPercent: data.defaultMarginPercent ?? data.margin,
      maxPurchaseRatioDenominator: data.maxPurchaseRatioDenominator,
      purchaseRatioExemptionThreshold: data.purchaseRatioExemptionThreshold,
      orderCashbackPercent: data.orderCashbackPercent,
    }),

  // IrMarket & Currency Sync simulation
  syncWithIrMarket: async () => {
    const db = getMockDb();
    db.settings.lastSyncTime = new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date());
    return {
      success: true,
      syncedCount: db.products.length,
      timestamp: db.settings.lastSyncTime,
    };
  },

  syncCurrencyNow: async (user?: string) => {
    const db = getMockDb();
    const currentRate = db.settings.usdToRialRate || 720000;
    const delta = Math.floor((Math.random() - 0.5) * 6000);
    const newRate = Math.max(680000, currentRate + delta);
    db.settings.usdToRialRate = newRate;
    db.settings.lastCurrencyPriceToman = Math.round(newRate / 10);
    db.settings.lastCurrencySyncTime = new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date());
    return {
      success: true,
      priceToman: db.settings.lastCurrencyPriceToman,
      usdToRialRate: newRate,
      changePercent: Number(((delta / currentRate) * 100).toFixed(2)),
      timestamp: db.settings.lastCurrencySyncTime,
      syncTime: db.settings.lastCurrencySyncTime,
      settings: db.settings,
    };
  },

  updateCurrencySyncConfig: async (config: {
    apiKey?: string;
    intervalMinutes?: number;
    enableAutoSync?: boolean;
    user?: string;
  }) => {
    const updated = await mockDb.updateSettings({
      currencyApiKey: config.apiKey,
      currencySyncIntervalMinutes: config.intervalMinutes,
      enableCurrencyAutoSync: config.enableAutoSync,
    });
    return {
      success: true,
      settings: updated,
    };
  },

  // Audit Logs
  getAuditLogs: (limit = 40) => mockDb.getAuditLogs(limit),

  // Tag Management
  getAllTags: () => mockDb.getAllTags(),

  createTag: (data: { tag: string; productIds?: string[]; user?: string }) =>
    mockDb.createTag(data),

  renameTag: (data: { oldTag: string; newTag: string; user?: string }) =>
    mockDb.renameTag(data),

  deleteTag: (tag: string, user = "مدیر سیستم") => mockDb.deleteTag(tag),

  assignTag: (data: { tag: string; productIds: string[]; action?: "add" | "remove"; user?: string }) =>
    mockDb.assignTag(data),

  // User Management
  getUsers: (params?: { search?: string; role?: string; status?: string; limit?: number }) =>
    mockDb.getUsers(params),

  getUserStats: async () => {
    const res = await mockDb.getUsers();
    return res.stats;
  },

  createUser: (data: any) => mockDb.createUser(data),

  updateUserRole: (id: string, role: string, adminUser = "مدیر ارشد") =>
    mockDb.updateUserRole(id, role, adminUser),

  updateUserStatus: (id: string, status: string, adminUser = "مدیر ارشد") =>
    mockDb.updateUserStatus(id, status, adminUser),

  deleteUser: (id: string, adminUser = "مدیر ارشد") => mockDb.deleteUser(id, adminUser),

  getAdminActivities: (params?: {
    adminId?: string;
    type?: string;
    search?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }) => mockDb.getAdminActivities(params),

  getAdminActivitySummary: (adminId: string) => mockDb.getAdminActivitySummary(adminId),

  // Auth & OTP
  sendOtp: async (phone: string) => {
    const db = getMockDb();
    const user = db.users.find((u) => u.phone === phone);
    return {
      success: true,
      message: "کد تأیید با موفقیت ارسال شد (کد تستی: ۱۱۱۱۱)",
      code: "11111",
      user,
    };
  },

  verifyOtp: async (phone: string, code: string, referralCode?: string) => {
    if (code !== "11111") {
      throw new Error("کد تایید وارد شده نامعتبر است (کد تستی ۱۱۱۱۱ است).");
    }
    const db = getMockDb();
    let user = db.users.find((u) => u.phone === phone);
    if (!user) {
      user = await mockDb.createUser({
        name: "کاربر جدید",
        phone,
        role: "USER",
        status: "ACTIVE",
        walletBalanceToman: 0,
      });
    }
    const token = `mock-jwt-token-${user.id}-${Date.now()}`;
    return { accessToken: token, user };
  },

  sendDirectEmailOtp: async (email: string) => {
    return {
      success: true,
      message: "کد تأیید به ایمیل شما ارسال شد (کد تستی: ۱۱۱۱۱)",
      code: "11111",
      email,
    };
  },

  verifyEmailOtp: async (email: string, code: string, referralCode?: string) => {
    if (code !== "11111") {
      throw new Error("کد تایید وارد شده نامعتبر است.");
    }
    const db = getMockDb();
    let user = db.users.find((u) => u.email === email);
    if (!user) {
      user = await mockDb.createUser({
        name: email.split("@")[0],
        email,
        phone: "0918" + Math.floor(1000000 + Math.random() * 9000000),
        role: "USER",
        status: "ACTIVE",
        walletBalanceToman: 0,
      });
    }
    const token = `mock-jwt-token-${user.id}-${Date.now()}`;
    return { accessToken: token, user };
  },

  bindReferral: async (userId: string, referralCode: string) => {
    return {
      success: true,
      message: "کد معرف با موفقیت ثبت شد.",
      referredByCode: referralCode,
    };
  },

  getUserReferrals: async (userId: string) => {
    return {
      referralCode: "ARZAN-0000",
      cashbackPercent: 10,
      stats: {
        totalReferred: 8,
        activeBuyers: 5,
        totalOrdersCount: 14,
        totalEarnedToman: 180000,
        totalSpentByReferrals: 1800000,
      },
      referrals: [
        {
          id: "ref-1",
          name: "علی رضایی",
          phoneMasked: "0912***6789",
          emailMasked: "a***i@yahoo.com",
          joinedAt: "۱۴۰۶/۰۱/۱۰",
          ordersCount: 4,
          totalSpentToman: 520000,
          earnedFromUserToman: 52000,
        },
        {
          id: "ref-2",
          name: "سارا طاهری",
          phoneMasked: "0935***2233",
          emailMasked: "s***a@test.com",
          joinedAt: "۱۴۰۶/۰۲/۰۵",
          ordersCount: 2,
          totalSpentToman: 340000,
          earnedFromUserToman: 34000,
        },
        {
          id: "ref-3",
          name: "مهدی محمدپور",
          phoneMasked: "0919***5432",
          emailMasked: "m***i@gmail.com",
          joinedAt: "۱۴۰۶/۰۳/۱۴",
          ordersCount: 1,
          totalSpentToman: 200000,
          earnedFromUserToman: 20000,
        },
      ],
    };
  },

  getMe: async () => {
    if (typeof window === "undefined") return null;
    const cached = localStorage.getItem("arzan_cached_user");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    const db = getMockDb();
    return db.users[0] || null;
  },

  searchLive: (query: string, scope: "public" | "admin" | "all" = "public", limit = 10) =>
    mockDb.searchLive(query, scope, limit),

  searchByTag: (tag: string, limit = 20) => mockDb.searchByTag(tag, limit),

  getRelatedProducts: (productId: string, limit = 4) => mockDb.getRelatedProducts(productId, limit),

  uploadFile: (file: File, folder = "products") => mockDb.uploadFile(file, folder),

  // Email
  getEmailSettings: () => mockDb.getEmailSettings(),

  updateEmailSettings: (config: any, user = "مدیر ارشد") => mockDb.updateEmailSettings(config),

  sendTestEmail: (to: string, template = "test") => mockDb.sendTestEmail(to, template),

  getEmailStats: () => mockDb.getEmailStats(),

  getEmailLogs: (params?: any) => mockDb.getEmailLogs(params),

  // SMS
  getSmsSettings: () => mockDb.getSmsSettings(),

  updateSmsSettings: (config: any, user = "مدیر ارشد") => mockDb.updateSmsSettings(config),

  sendTestSms: (data: { to: string; bodyId: number; args?: (string | number)[] }) =>
    mockDb.sendTestSms(data),

  sendCouponSms: (data: { phone: string; code: string; discountPercent: number; customerName?: string }) =>
    mockDb.sendCouponSms(data),

  getSmsStats: () => mockDb.getSmsStats(),

  getSmsLogs: (params?: any) => mockDb.getSmsLogs(params),

  sendOrderReceiptEmail: async (orderData: any): Promise<{ success: boolean; message?: string; error?: string }> => ({
    success: true,
    message: "رسید سفارش با موفقیت به ایمیل مشتری ارسال شد.",
  }),

  sendCustomEmail: async (data: any): Promise<{ success: boolean; message?: string; error?: string }> => ({
    success: true,
    message: "ایمیل سفارشی با موفقیت به گیرنده ارسال گردید.",
  }),

  getUserProfile: (id: string) => mockDb.getUserById(id),

  updateUserProfile: (id: string, data: any) => mockDb.updateUserProfile(id, data),

  topUpWallet: (id: string, amountToman: number) => mockDb.topUpWallet(id, amountToman),

  convertPoints: (id: string, points: number) => mockDb.convertPoints(id, points),

  // Withdrawals
  requestWithdrawal: (
    userId: string,
    data: {
      amountToman: number;
      cardNumber?: string;
      sheba?: string;
      accountOwnerName?: string;
      userNote?: string;
    }
  ) => mockDb.requestWithdrawal(userId, data),

  getUserWithdrawals: async (userId: string) => {
    const res = await mockDb.getWithdrawals({ userId });
    return res.requests;
  },

  getAdminWithdrawals: (params?: any) => mockDb.getWithdrawals(params),

  processWithdrawal: (id: string, data: any) => mockDb.processWithdrawal(id, data),

  // Passwords
  sendEmailOtp: async (phone: string) => ({
    success: true,
    message: "کد تأیید به ایمیل حساب کاربری شما ارسال شد.",
    maskedEmail: "c***r@gmail.com",
    code: "11111",
  }),

  loginWithPassword: async (phone: string, password: string, referralCode?: string) => {
    const db = getMockDb();
    const user = db.users.find((u) => u.phone === phone);
    if (!user) {
      throw new Error("کاربری با این شماره یافت نشد.");
    }
    const token = `mock-token-${user.id}-${Date.now()}`;
    return { accessToken: token, user };
  },

  updatePassword: async (newPassword: string, currentPassword?: string) => ({
    success: true,
    message: "رمز عبور با موفقیت به‌روزرسانی شد.",
  }),

  // Orders & Refunds
  createBackendOrder: (dto: any) => mockDb.createOrder(dto),

  getBackendOrders: (params?: { status?: string; customerEmail?: string; limit?: number }) =>
    mockDb.getOrders(params),

  getOrderById: (id: string) => mockDb.getOrderById(id),

  getRefundRequests: (role = "SUPER_ADMIN") => mockDb.getRefundRequests(),

  processRefund: (dto: any, role = "SUPER_ADMIN") => mockDb.processRefund(dto),

  rejectRefund: (orderId: string, data: any, role = "SUPER_ADMIN") =>
    mockDb.rejectRefund(orderId, data),

  requestRefund: (orderId: string, refundReason: string, refundCardNumber?: string, refundIban?: string) =>
    mockDb.requestRefund(orderId, refundReason, refundCardNumber, refundIban),

  updateOrderStatus: (orderId: string, dataOrStatus: any, adminName = "مدیر سیستم", role = "SUPER_ADMIN") =>
    mockDb.updateOrderStatus(orderId, dataOrStatus, adminName),

  reindexSearch: async () => ({ success: true, count: 9 }),

  // Coupons
  getCoupons: () => mockDb.getCoupons(),

  getCouponById: (id: string) => mockDb.getCouponById(id),

  createCoupon: (data: any) => mockDb.createCoupon(data),

  updateCoupon: (id: string, data: any) => mockDb.updateCoupon(id, data),

  deleteCoupon: (id: string) => mockDb.deleteCoupon(id),

  validateCoupon: (code: string, userId?: string) => mockDb.validateCoupon(code, userId),

  // Card Payments (CartBeCart)
  initiateCardPayment: (data: any) => mockDb.initiateCardPayment(data),

  checkCardPaymentStatus: (paymentToken: string) => mockDb.checkCardPaymentStatus(paymentToken),

  submitManualReceipt: (data: any) => mockDb.submitManualReceipt(data),

  simulateCardPaymentSuccess: (paymentToken: string) =>
    mockDb.adminApproveCardPayment(paymentToken, { adminNote: "شبیه‌سازی تایید مستقیم پرداخت" }),

  getUserCardPayments: (userId: string, params?: any) =>
    mockDb.getCardPayments({ userId, ...params }),

  getAdminCardPayments: (params?: any) => mockDb.getCardPayments(params),

  adminApproveCardPayment: (id: string, data: { adminNote?: string }, adminUser?: any) =>
    mockDb.adminApproveCardPayment(id, data, adminUser),

  adminRejectCardPayment: (id: string, data: { reason: string }, adminUser?: any) =>
    mockDb.adminRejectCardPayment(id, data, adminUser),

  getCartBeCartSettings: (role = "SUPER_ADMIN") => mockDb.getCartBeCartSettings(),

  updateCartBeCartSettings: (data: any, role = "SUPER_ADMIN") =>
    mockDb.updateCartBeCartSettings(data),
};
