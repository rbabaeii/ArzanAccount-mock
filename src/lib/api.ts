/**
 * API Client for arzanAccount NestJS Backend Gateway
 * Base URL defaults to http://localhost:4000/api/v1
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? "/api/v1" : "http://127.0.0.1:4000/api/v1");

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders: Record<string, string> = {};
  if (typeof FormData !== "undefined" && !(options.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  } else if (typeof FormData === "undefined") {
    defaultHeaders["Content-Type"] = "application/json";
  }

  // Attach JWT token from localStorage if present
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("arzan_auth_token");
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        ...defaultHeaders,
        ...(options.headers as Record<string, string>),
      },
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      let parsedMsg = "";
      try {
        const errJson = JSON.parse(errorBody);
        parsedMsg = Array.isArray(errJson.message)
          ? errJson.message.join("، ")
          : errJson.message || errJson.error;
      } catch {
        parsedMsg = errorBody;
      }
      throw new Error(parsedMsg || `خطای سرور [${response.status}]`);
    }

    const json: any = await response.json();
    if (json && json.data !== undefined) {
      return json.data;
    }
    return json;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error(
        "پاسخی از سرور در زمان مقرر دریافت نشد (اتمام مهلت ارتباط). لطفاً اتصال اینترنت خود را بررسی و مجدداً تلاش نمایید."
      );
    }
    throw err;
  }
}

export const api = {
  getSettings: () => request<any>("/settings"),

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
  }) =>
    request<any>("/settings/branding", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateCurrency: (params: {
    rate?: number;
    margin?: number;
    maxPurchaseRatioDenominator?: number;
    purchaseRatioExemptionThreshold?: number;
    orderCashbackPercent?: number;
    user?: string;
  }) =>
    request<any>("/settings/currency", {
      method: "PUT",
      body: JSON.stringify(params),
    }),

  syncCurrencyNow: (user = "مدیر سیستم (استعلام دستی)") =>
    request<any>("/settings/currency/sync-now", {
      method: "POST",
      body: JSON.stringify({ user }),
    }),

  updateCurrencySyncConfig: (config: {
    apiKey?: string;
    intervalMinutes?: number;
    enableAutoSync?: boolean;
    user?: string;
  }) =>
    request<any>("/settings/currency/sync-config", {
      method: "PUT",
      body: JSON.stringify(config),
    }),

  getCurrencySyncStatus: () =>
    request<any>("/settings/currency/sync-status"),

  getAuditLogs: (limit = 50) => request<any[]>(`/settings/logs?limit=${limit}`),

  // Catalog & Products
  getProducts: (params?: {
    isActive?: boolean;
    categoryId?: string;
    search?: string;
    isFlashDeal?: boolean;
    isFeatured?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.isActive !== undefined) query.set("isActive", String(params.isActive));
    if (params?.categoryId) query.set("categoryId", params.categoryId);
    if (params?.search) query.set("search", params.search);
    if (params?.isFlashDeal !== undefined) query.set("isFlashDeal", String(params.isFlashDeal));
    if (params?.isFeatured !== undefined) query.set("isFeatured", String(params.isFeatured));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));

    const qs = query.toString();
    return request<{ products: any[]; totalCount: number }>(`/catalog/products${qs ? `?${qs}` : ""}`);
  },

  getProductById: (id: string) => request<any>(`/catalog/products/${id}`),

  getLiveProduct: (id: string) => request<any>(`/catalog/products/${id}/live-sync`),

  validateLiveStock: (id: string, quantity = 1) =>
    request<{ valid: boolean; stockCount: number; inStock: boolean }>(
      `/catalog/products/${id}/validate-stock`,
      {
        method: "POST",
        body: JSON.stringify({ quantity }),
      }
    ),

  toggleProductActive: (id: string, user = "مدیر سیستم") =>
    request<any>(`/catalog/products/${id}/toggle-active`, {
      method: "PUT",
      body: JSON.stringify({ user }),
    }),

  updateProduct: (id: string, updates: any, user = "مدیر سیستم") =>
    request<any>(`/catalog/products/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...updates, user }),
    }),

  createProduct: (data: any, user = "مدیر سیستم") =>
    request<any>("/catalog/products", {
      method: "POST",
      body: JSON.stringify({ ...data, user }),
    }),

  // Tag Management
  getAllTags: () =>
    request<{ name: string; count: number; sampleProducts: { id: string; title: string }[] }[]>("/catalog/tags"),

  createTag: (data: { tag: string; productIds?: string[]; user?: string }) =>
    request<{ tag: string; affectedCount: number }>("/catalog/tags", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  renameTag: (data: { oldTag: string; newTag: string; user?: string }) =>
    request<{ oldTag: string; newTag: string; affectedCount: number }>("/catalog/tags/rename", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteTag: (tag: string, user = "مدیر سیستم") =>
    request<{ tag: string; affectedCount: number }>(`/catalog/tags/${encodeURIComponent(tag)}`, {
      method: "DELETE",
      body: JSON.stringify({ user }),
    }),

  assignTag: (data: { tag: string; productIds: string[]; action?: "add" | "remove"; user?: string }) =>
    request<{ tag: string; action: string; updatedCount: number }>("/catalog/tags/assign", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Categories
  getCategories: () => request<any[]>("/catalog/categories"),

  createCategory: (data: { title: string; titleFa?: string; slug: string; description?: string; icon?: string; orderIndex?: number }) =>
    request<any>("/catalog/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCategory: (id: string, data: { title?: string; titleFa?: string; slug?: string; description?: string; icon?: string; orderIndex?: number }) =>
    request<any>(`/catalog/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteCategory: (id: string) =>
    request<any>(`/catalog/categories/${id}`, {
      method: "DELETE",
    }),

  // irMarket Integration & Sync
  triggerSync: (triggeredBy = "مدیر سیستم (فرانت‌اند)") =>
    request<any>("/sync/irmarket", {
      method: "POST",
      body: JSON.stringify({ triggeredBy }),
    }),

  getWalletBalance: () => request<{ success: boolean; balance_usd: number }>("/irmarket/balance"),

  // Pricing
  getPricingRates: () => request<any>("/pricing/rates"),

  previewPricing: (params: { rate?: number; margin?: number; usdValues?: number[] }) => {
    const query = new URLSearchParams();
    if (params.rate) query.set("rate", String(params.rate));
    if (params.margin) query.set("margin", String(params.margin));
    if (params.usdValues) query.set("usdValues", params.usdValues.join(","));
    return request<any[]>(`/pricing/preview?${query.toString()}`);
  },

  // Users & RBAC
  getUsers: (params?: { role?: string; status?: string; search?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.role) query.set("role", params.role);
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));

    const qs = query.toString();
    return request<{ users: any[]; totalCount: number }>(`/users${qs ? `?${qs}` : ""}`);
  },

  getUserStats: () =>
    request<{
      totalUsers: number;
      activeUsers: number;
      totalAdmins: number;
      twoFactorCount: number;
    }>("/users/stats"),

  createUser: (data: any) =>
    request<any>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateUserRole: (id: string, role: string, adminUser = "مدیر ارشد") =>
    request<any>(`/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role, adminUser }),
    }),

  updateUserStatus: (id: string, status: string, adminUser = "مدیر ارشد") =>
    request<any>(`/users/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, adminUser }),
    }),

  deleteUser: (id: string, adminUser = "مدیر ارشد") =>
    request<any>(`/users/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ adminUser }),
    }),

  getAdminActivities: (params?: {
    adminId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sort?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.adminId) query.set("adminId", params.adminId);
    if (params?.type) query.set("type", params.type);
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    if (params?.search) query.set("search", params.search);
    if (params?.sort) query.set("sort", params.sort);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));

    const qs = query.toString();
    return request<{ activities: any[]; total: number }>(`/users/admin-activities${qs ? `?${qs}` : ""}`);
  },

  getAdminActivitySummary: (adminId: string) =>
    request<{ admin: any; stats: any }>(`/users/${adminId}/activity-summary`),

  // Auth & OTP
  sendOtp: (phone: string) =>
    request<{ success: boolean; message: string }>("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  verifyOtp: (phone: string, code: string, referralCode?: string) =>
    request<{ accessToken: string; user: any }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, code, referralCode }),
    }),

  sendDirectEmailOtp: (email: string) =>
    request<{ success: boolean; message: string; email: string }>("/auth/send-email-otp-direct", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyEmailOtp: (email: string, code: string, referralCode?: string) =>
    request<{ accessToken: string; user: any }>("/auth/verify-email-otp", {
      method: "POST",
      body: JSON.stringify({ email, code, referralCode }),
    }),

  bindReferral: (userId: string, referralCode: string) =>
    request<any>(`/users/${userId}/bind-referral`, {
      method: "POST",
      body: JSON.stringify({ referralCode }),
    }),

  getUserReferrals: (userId: string) =>
    request<{
      referralCode: string;
      cashbackPercent: number;
      stats: {
        totalReferred: number;
        activeBuyers: number;
        totalOrdersCount: number;
        totalEarnedToman: number;
        totalSpentByReferrals: number;
      };
      referrals: {
        id: string;
        name: string;
        phoneMasked: string;
        emailMasked: string;
        joinedAt: string;
        ordersCount: number;
        totalSpentToman: number;
        earnedFromUserToman: number;
      }[];
    }>(`/users/${userId}/referrals`),

  getMe: () => request<any>("/auth/me"),

  // Live ElasticSearch
  searchLive: (query: string, scope: "public" | "admin" | "all" = "public", limit = 10) =>
    request<{
      products: { item: any; score: number; highlights: string[] }[];
      categories: { item: any; score: number }[];
      orders: { item: any; score: number }[];
      users: { item: any; score: number }[];
      suggestions: string[];
      totalMatches: number;
      query: string;
      tookMs: number;
    }>(`/search/live?q=${encodeURIComponent(query)}&scope=${scope}&limit=${limit}`),

  searchByTag: (tag: string, limit = 20) =>
    request<any[]>(`/search/by-tag?tag=${encodeURIComponent(tag)}&limit=${limit}`),

  getRelatedProducts: (productId: string, limit = 4) =>
    request<any[]>(`/search/related/${productId}?limit=${limit}`),

  // Media / File Upload
  uploadFile: async (file: File, folder = "products"): Promise<{ success: boolean; url: string; filename: string; size: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = typeof window !== "undefined" ? localStorage.getItem("arzan_auth_token") : null;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/upload?folder=${folder}`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "خطا در آپلود فایل.");
    }
    return res.json();
  },

  // Email & SMTP Management
  getEmailSettings: () => request<any>("/email/settings"),

  updateEmailSettings: (config: any, user = "مدیر ارشد") =>
    request<any>("/email/settings", {
      method: "PUT",
      body: JSON.stringify({ config, user }),
    }),

  sendTestEmail: (to: string, template = "test") =>
    request<any>("/email/test", {
      method: "POST",
      body: JSON.stringify({ to, template }),
    }),

  getEmailStats: () => request<any>("/email/stats"),

  getEmailLogs: (params?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.status && params.status !== "all") q.set("status", params.status);
    if (params?.search) q.set("search", params.search);
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    const qs = q.toString();
    return request<{ logs: any[]; total: number }>(`/email/logs${qs ? `?${qs}` : ""}`);
  },

  sendOrderReceiptEmail: (orderData: any) =>
    request<any>("/email/send-order-receipt", {
      method: "POST",
      body: JSON.stringify(orderData),
    }),

  sendCustomEmail: (data: {
    recipientEmail: string;
    recipientName?: string;
    subject: string;
    message: string;
    badge?: string;
    buttonText?: string;
    buttonUrl?: string;
    adminSender?: string;
  }) =>
    request<any>("/email/send-custom", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getUserProfile: (id: string) => request<any>(`/users/${id}`),

  updateUserProfile: (id: string, data: any) =>
    request<any>(`/users/${id}/profile`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  topUpWallet: (id: string, amountToman: number) =>
    request<any>(`/users/${id}/topup-wallet`, {
      method: "POST",
      body: JSON.stringify({ amountToman }),
    }),

  convertPoints: (id: string, points: number) =>
    request<any>(`/users/${id}/convert-points`, {
      method: "POST",
      body: JSON.stringify({ points }),
    }),

  // Withdrawals & Settlement
  requestWithdrawal: (
    userId: string,
    data: {
      amountToman: number;
      cardNumber?: string;
      sheba?: string;
      accountOwnerName?: string;
      userNote?: string;
    }
  ) =>
    request<any>(`/users/${userId}/withdrawals`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getUserWithdrawals: (userId: string) =>
    request<any[]>(`/users/${userId}/withdrawals`),

  getAdminWithdrawals: (params?: {
    status?: string;
    userId?: string;
    search?: string;
    limit?: number;
    offset?: number;
    role?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.status && params.status !== "all") q.set("status", params.status);
    if (params?.userId) q.set("userId", params.userId);
    if (params?.search) q.set("search", params.search);
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    if (params?.role) q.set("role", params.role);
    const qs = q.toString();
    return request<{ requests: any[]; totalCount: number }>(`/users/admin/withdrawals-list${qs ? `?${qs}` : ""}`);
  },

  processWithdrawal: (
    id: string,
    data: {
      action: "APPROVE" | "REJECT";
      adminNote?: string;
      bankTrackingCode?: string;
      bankReceiptUrl?: string;
      adminName?: string;
      adminId?: string;
      role?: string;
    }
  ) =>
    request<any>(`/users/admin/withdrawals/${id}/process`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Auth & Passwords
  sendEmailOtp: (phone: string) =>
    request<{ success: boolean; message: string; maskedEmail: string }>("/auth/send-email-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  loginWithPassword: (phone: string, password: string, referralCode?: string) =>
    request<{ accessToken: string; user: any }>("/auth/login-password", {
      method: "POST",
      body: JSON.stringify({ phone, password, referralCode }),
    }),

  updatePassword: (newPassword: string, currentPassword?: string) =>
    request<{ success: boolean; message: string }>("/auth/update-password", {
      method: "POST",
      body: JSON.stringify({ newPassword, currentPassword }),
    }),

  // Orders & Refunds
  createBackendOrder: (dto: any) =>
    request<any>("/orders", {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  getBackendOrders: (params?: { status?: string; customerEmail?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.customerEmail) q.set("customerEmail", params.customerEmail);
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return request<{ orders: any[]; totalCount: number }>(`/orders${qs ? `?${qs}` : ""}`);
  },

  getOrderById: (id: string) => request<any>(`/orders/${id}`),

  getRefundRequests: (role = "SUPER_ADMIN") =>
    request<any[]>(`/orders/refund-requests?role=${role}`),

  processRefund: (dto: any, role = "SUPER_ADMIN") =>
    request<any>("/orders/process-refund", {
      method: "POST",
      body: JSON.stringify({ ...dto, role }),
    }),

  rejectRefund: (
    orderId: string,
    data: {
      rejectionReason: string;
      newStatus?: string;
      adminId?: string;
      adminName?: string;
    },
    role = "SUPER_ADMIN"
  ) =>
    request<any>(`/orders/${orderId}/reject-refund`, {
      method: "POST",
      body: JSON.stringify({ ...data, role }),
    }),

  requestRefund: (orderId: string, refundReason: string, refundCardNumber?: string, refundIban?: string) =>
    request<any>(`/orders/${orderId}/request-refund`, {
      method: "POST",
      body: JSON.stringify({ refundReason, refundCardNumber, refundIban }),
    }),

  updateOrderStatus: (
    orderId: string,
    dataOrStatus:
      | string
      | {
          status: string;
          adminName?: string;
          adminId?: string;
          adminPhone?: string;
          deliveredAccounts?: string[];
          role?: string;
          notes?: string;
        },
    adminName = "مدیر سیستم",
    role = "SUPER_ADMIN"
  ) => {
    let body: any;
    if (typeof dataOrStatus === "string") {
      body = { status: dataOrStatus, adminName, role };
    } else {
      body = {
        status: dataOrStatus.status,
        adminName: dataOrStatus.adminName || adminName,
        adminId: dataOrStatus.adminId,
        adminPhone: dataOrStatus.adminPhone,
        deliveredAccounts: dataOrStatus.deliveredAccounts,
        notes: dataOrStatus.notes,
        role: dataOrStatus.role || role,
      };
    }
    return request<any>(`/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  reindexSearch: () =>
    request<any>("/search/reindex", {
      method: "POST",
    }),

  // CartBeCart Card-to-Card Payment API
  // Validate coupon code
  validateCoupon: (code: string) =>
    request<any>("/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  initiateCardPayment: (data: {
    amountToman: number;
    paymentType: "ORDER" | "WALLET_TOPUP";
    orderNumber?: string;
    orderId?: string;
    userId?: string;
    customerName?: string;
    customerPhone?: string;
    callbackUrl?: string;
  }) =>
    request<any>("/cartbecart/initiate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  checkCardPaymentStatus: (paymentToken: string) =>
    request<any>(`/cartbecart/status/${paymentToken}`, {
      method: "GET",
    }),

  submitManualReceipt: (data: {
    paymentToken?: string;
    amountToman: number;
    paymentType?: "ORDER" | "WALLET_TOPUP";
    orderNumber?: string;
    orderId?: string;
    userId?: string;
    trackingCode: string;
    userCardNumber?: string;
    receiptUrl?: string;
    depositTime?: string;
    userNote?: string;
  }) =>
    request<any>("/cartbecart/submit-receipt", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  simulateCardPaymentSuccess: (paymentToken: string) =>
    request<any>(`/cartbecart/simulate-success/${paymentToken}`, {
      method: "POST",
    }),

  getUserCardPayments: (
    userId: string,
    params?: {
      status?: string;
      type?: string;
      page?: number;
      limit?: number;
    }
  ) => {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.type) query.append("type", params.type);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    return request<any>(`/cartbecart/user/${userId}?${query.toString()}`);
  },

  getAdminCardPayments: (params?: {
    status?: string;
    type?: string;
    userId?: string;
    search?: string;
    page?: number;
    limit?: number;
    role?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.type) query.append("type", params.type);
    if (params?.userId) query.append("userId", params.userId);
    if (params?.search) query.append("search", params.search);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.role) query.append("role", params.role);
    return request<any>(`/cartbecart/admin/payments?${query.toString()}`);
  },

  adminApproveCardPayment: (
    id: string,
    data: { adminNote?: string },
    adminUser?: { id?: string; name?: string; phone?: string; role?: string }
  ) =>
    request<any>(`/cartbecart/admin/approve/${id}`, {
      method: "POST",
      body: JSON.stringify({ ...data, adminUser }),
    }),

  adminRejectCardPayment: (
    id: string,
    data: { reason: string },
    adminUser?: { id?: string; name?: string; phone?: string; role?: string }
  ) =>
    request<any>(`/cartbecart/admin/reject/${id}`, {
      method: "POST",
      body: JSON.stringify({ ...data, adminUser }),
    }),

  getCartBeCartSettings: (role: string = "SUPER_ADMIN") =>
    request<any>(`/cartbecart/admin/settings?role=${role}`),

  updateCartBeCartSettings: (
    data: {
      apiKey?: string;
      fallbackCardNumber?: string;
      fallbackCardOwner?: string;
      fallbackBankName?: string;
      enabled?: boolean;
    },
    role: string = "SUPER_ADMIN"
  ) =>
    request<any>("/cartbecart/admin/settings", {
      method: "PUT",
      body: JSON.stringify({ ...data, role }),
    }),
};

