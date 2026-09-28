export interface Category {
  id: string;
  title: string;
  slug: string;
  description?: string;
  icon: string;
  orderIndex: number;
}

export interface Product {
  id: string;
  externalId: number;
  name: string;
  customTitle: string;
  costPriceUsd: number;
  retailPriceUsd: number;
  pricingUnit: "unit" | "per_1000";
  minQty?: number;
  maxQty?: number;
  stockCount: number; // Stock level from irMarket
  inStock: boolean;
  rating: number; // For SEO & Social proof, e.g. 4.9
  reviewCount: number; // e.g. 128
  requiresEmail?: boolean;
  requiresPassword?: boolean;
  requiresLink?: boolean;
  requiresComments?: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isFlashDeal?: boolean;
  customMarginPercent?: number;
  categoryId: string;
  description: string;
  persianDescription?: string;
  badge?: string;
  image?: string;
  specs?: { label: string; value: string }[];
  salePriceToman?: number;
  discountPercent?: number;
  tags?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  customerEmail?: string;
  customerLink?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "ARZ-1049"
  externalOrderId?: number; // irMarket order_id
  createdAt: string;
  customerEmail: string;
  customerPhone?: string;
  customerLink?: string;
  items: {
    productId: string;
    productTitle: string;
    quantity: number;
    priceToman: number;
    priceUsd: number;
  }[];
  totalPriceToman: number;
  totalPriceUsd: number;
  status: "delivered" | "processing" | "pending" | "failed" | "cancelled" | "refund_requested" | "refunded";
  deliveredAccounts?: string[]; // e.g. ["user@domain.com:Pass123 (pin: 4421)"]
  paymentGateway: "zarinpal" | "nextpay" | "crypto" | "cartbecart";
  discountAppliedToman?: number;
  deliveryType?: string; // "link" | "credentials" | "account_activation"
  targetAccountEmail?: string;
  targetAccountPassword?: string;
  accountCredentials?: {
    index: number;
    email: string;
    password?: string;
    productTitle?: string;
  }[];
  isHybridOrder?: boolean;
  instantItemsCount?: number;
  activationItemsCount?: number;
  refundReason?: string;
  refundCardNumber?: string;
  refundIban?: string;
  refundAmountToman?: number;
  refundReceiptUrl?: string;
  refundTrackingCode?: string;
  refundMethod?: "bank_card" | "wallet";
  refundRejectionReason?: string;
  refundedAt?: string;
  refundedByAdminName?: string;
  approvedByAdminId?: string;
  approvedByAdminName?: string;
  approvedByAdminPhone?: string;
  approvedAt?: string;
}

export interface CouponTargetUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  maxDiscountToman: number;
  minOrderToman: number;
  expiresAt?: string; // Optional: empty/undefined means permanent (بدون انقضا / دائمی)
  usageCount: number;
  maxUsage: number;
  isActive: boolean;
  categoryId?: string;
  // User-specific coupon fields
  targetType?: "ALL" | "USER";
  targetUserIds?: string[]; // Array of allowed user IDs for this single coupon code
  targetUsers?: CouponTargetUser[]; // User details for popup modal display
  targetUserId?: string; // Backward compatibility for single user
  targetUserName?: string;
  targetUserPhone?: string;
  targetUserEmail?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  user: string;
  adminId?: string;
  adminName?: string;
  adminPhone?: string;
  timestamp?: string;
  createdAt?: string;
  type: string;
}

export interface SystemSettings {
  usdToRialRate: number; // e.g. 720,000 Rials (72,000 Tomans)
  defaultMarginPercent: number; // e.g. 15%
  lastSyncTime: string;
  walletBalanceUsd: number;
  irMarketApiKey: string;
  siteName: string;
  supportTelegram: string;
  supportPhone?: string;
  enableAutomaticSync: boolean;
  maxPurchaseRatioDenominator?: number; // e.g. 3 for 1/3 max quota
  purchaseRatioExemptionThreshold?: number; // e.g. 10 (when stock <= 10, fraction limit relaxes to full stock)
  orderCashbackPercent?: number; // e.g. 10%

  // BrsApi Currency Live Sync
  currencyApiKey?: string;
  currencySyncIntervalMinutes?: number;
  enableCurrencyAutoSync?: boolean;
  lastCurrencySyncTime?: string;
  lastCurrencyPriceToman?: number;
  lastCurrencyChangePercent?: number;

  // Visual Branding & Store Identity
  siteLogo?: string;
  siteLogoDark?: string;
  siteFavicon?: string;
  siteTagline?: string;
  siteDescription?: string;
  sitePhone?: string;
  siteEmail?: string;
  siteInstagram?: string;
  siteEnamad?: string;
}

