"use client";

import React, { useState } from "react";
import { Order } from "@/types";
import { formatNumber, formatPrice, numberToPersianWords } from "@/lib/format";
import { toPersianDateTime } from "@/lib/date";
import {
  Printer,
  X,
  FileText,
  Calendar,
  Layers,
  CheckCircle2,
  Receipt,
  Building2,
  User,
  Key,
} from "lucide-react";

interface OrdersReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  timeRangeLabel: string;
  statusFilterLabel: string;
  adminName?: string;
}

export const OrdersReportPrintModal: React.FC<OrdersReportPrintModalProps> = ({
  isOpen,
  onClose,
  orders,
  timeRangeLabel,
  statusFilterLabel,
  adminName = "مدیریت ارزان اکانت",
}) => {
  const [viewMode, setViewMode] = useState<"detailed" | "summary" | "both">("detailed");

  if (!isOpen) return null;

  const extractTitleFromDelivered = (raw?: string) => {
    if (!raw) return null;
    const match = raw.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      return match[1].replace(/#\d+/g, "").trim();
    }
    return null;
  };

  const normalizeOrder = (order: Order) => {
    const rawItems = order.items && order.items.length > 0 ? order.items : [];
    let items = rawItems.map((it) => {
      const qty = Number(it.quantity) || 1;
      let priceToman = Number(it.priceToman) || 0;
      let priceUsd = Number(it.priceUsd) || 0;
      if (priceToman === 0 && order.totalPriceToman && rawItems.length === 1) {
        priceToman = Math.round(order.totalPriceToman / qty);
      }
      if (priceUsd === 0 && order.totalPriceUsd && rawItems.length === 1) {
        priceUsd = Number((order.totalPriceUsd / qty).toFixed(2));
      }
      const title =
        it.productTitle && it.productTitle !== "محصول دیجیتال"
          ? it.productTitle
          : extractTitleFromDelivered(order.deliveredAccounts?.[0]) || "محصول دیجیتال اورجینال";

      return {
        ...it,
        quantity: qty,
        priceToman,
        priceUsd,
        productTitle: title,
      };
    });

    if (items.length === 0) {
      const fallbackTitle =
        extractTitleFromDelivered(order.deliveredAccounts?.[0]) || "محصول دیجیتال اورجینال";
      items = [
        {
          productId: "prod-item",
          productTitle: fallbackTitle,
          quantity: 1,
          priceToman: order.totalPriceToman || 0,
          priceUsd: order.totalPriceUsd || 0,
        },
      ];
    }

    const subtotal = items.reduce((sum, it) => sum + it.priceToman * it.quantity, 0);
    const discount = order.discountAppliedToman || 0;
    const finalTotal = order.totalPriceToman || subtotal - discount;

    return {
      ...order,
      items,
      subtotal,
      discount,
      finalTotal,
      totalWords: numberToPersianWords(finalTotal),
    };
  };

  const normalizedOrders = orders.map(normalizeOrder);

  const totalToman = normalizedOrders.reduce((sum, o) => sum + (o.finalTotal || 0), 0);
  const totalUsd = normalizedOrders.reduce((sum, o) => sum + (o.totalPriceUsd || 0), 0);
  const deliveredCount = normalizedOrders.filter((o) => o.status === "delivered").length;

  const reportId = `REP-${Date.now().toString().slice(-8)}`;
  const nowPersian = toPersianDateTime(new Date().toISOString());

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "delivered":
        return "تحویل شده (موفق)";
      case "processing":
        return "در حال پردازش";
      case "pending":
        return "در انتظار پرداخت";
      case "refund_requested":
        return "درخواست عودت وجه";
      case "refunded":
        return "عودت داده شده";
      case "cancelled":
        return "لغو شده";
      case "failed":
        return "ناموفق";
      default:
        return status;
    }
  };

  const getStatusBadgeStyle = (status: Order["status"]) => {
    switch (status) {
      case "delivered":
        return "background-color: #dcfce7; color: #166534; border: 1px solid #86efac;";
      case "processing":
        return "background-color: #fef3c7; color: #92400e; border: 1px solid #fcd34d;";
      case "pending":
        return "background-color: #dbeafe; color: #1e40af; border: 1px solid #93c5fd;";
      case "refunded":
      case "refund_requested":
        return "background-color: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe;";
      default:
        return "background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;";
    }
  };

  const getGatewayText = (gw: string) => {
    switch (gw) {
      case "cartbecart":
        return "کارت‌به‌کارت";
      case "zarinpal":
        return "زرین‌پال";
      case "nextpay":
        return "نکست‌پی";
      case "crypto":
        return "ارز دیجیتال";
      default:
        return gw || "کارت‌به‌کارت";
    }
  };

  // Generate HTML representation of each invoice
  const buildInvoiceHtml = (o: ReturnType<typeof normalizeOrder>, idx: number) => {
    const itemsRows = o.items
      .map(
        (it, i) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 7px 8px; text-align: center; font-family: monospace; color: #64748b;">${i + 1}</td>
          <td style="padding: 7px 8px; font-weight: bold; color: #0f172a;">${it.productTitle}</td>
          <td style="padding: 7px 8px; text-align: center; font-family: monospace;">${it.quantity}</td>
          <td style="padding: 7px 8px; text-align: left; font-family: monospace;">${formatPrice(it.priceToman)}</td>
          <td style="padding: 7px 8px; text-align: left; font-family: monospace; font-weight: bold; color: #0f172a;">${formatPrice(it.priceToman * it.quantity)}</td>
        </tr>
      `
      )
      .join("");

    const deliveredHtml =
      o.deliveredAccounts && o.deliveredAccounts.length > 0
        ? `
        <div style="margin-top: 10px; margin-bottom: 10px; padding: 10px; background-color: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px;">
          <div style="font-weight: bold; font-size: 11px; color: #0f766e; margin-bottom: 6px; border-bottom: 1px solid #ccfbf1; padding-bottom: 4px;">
            🔑 مشخصات اکانت و لایسنس‌های تحویل شده (محرمانه):
          </div>
          <div style="font-family: monospace; font-size: 10px; direction: ltr; text-align: left; color: #134e4a;">
            ${o.deliveredAccounts
              .map(
                (acc, aIdx) => `
              <div style="padding: 5px 8px; background: #ffffff; border: 1px solid #ccfbf1; border-radius: 6px; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold;">${acc}</span>
                <span style="background: #f0fdfa; color: #0f766e; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-family: tahoma, sans-serif;">لایسنس #${aIdx + 1}</span>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `
        : "";

    return `
      <div class="invoice-page">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 44px; height: 44px; background-color: #0f766e; color: #ffffff; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-family: monospace; font-size: 18px;">
              ARZ
            </div>
            <div>
              <div style="font-size: 16px; font-weight: 900; color: #020617; letter-spacing: -0.5px;">صورتحساب رسمی فروش کالا و خدمات الکترونیکی</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">فروشگاه آنلاین ارزان اکانت (arzanAccount) • سامانه تحویل اشتراک‌های دیجیتال</div>
            </div>
          </div>
          <div style="text-align: left; font-size: 10px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 12px; background: #f8fafc; min-width: 170px;">
            <div style="display: flex; justify-content: space-between; gap: 8px; margin-bottom: 3px;">
              <span style="color: #64748b;">شماره فاکتور:</span>
              <strong style="font-family: monospace; color: #020617; font-size: 12px;">#${o.orderNumber}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 8px; margin-bottom: 3px;">
              <span style="color: #64748b;">تاریخ ثبت:</span>
              <span style="font-family: monospace;">${toPersianDateTime(o.createdAt)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 8px; align-items: center;">
              <span style="color: #64748b;">وضعیت:</span>
              <span style="font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; ${getStatusBadgeStyle(o.status)}">${getStatusText(o.status)}</span>
            </div>
          </div>
        </div>

        <!-- Parties (Seller & Buyer) -->
        <div style="display: flex; gap: 10px; margin-bottom: 12px;">
          <!-- Seller -->
          <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; background-color: #f8fafc; font-size: 10px;">
            <div style="font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
              🏢 مشخصات فروشنده (عرضه‌کننده):
            </div>
            <div style="display: flex; margin-bottom: 3px;"><span style="color: #64748b; width: 65px;">نام فروشگاه:</span><strong>ارزان اکانت (arzanAccount)</strong></div>
            <div style="display: flex; margin-bottom: 3px;"><span style="color: #64748b; width: 65px;">نوع خدمات:</span><span>اشتراک‌های هوش مصنوعی و سرویس‌های دیجیتال</span></div>
            <div style="display: flex;"><span style="color: #64748b; width: 65px;">پشتیبانی:</span><span style="font-family: monospace;">support@arzanaccount.ir</span></div>
          </div>

          <!-- Buyer -->
          <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; background-color: #f8fafc; font-size: 10px;">
            <div style="font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
              👤 مشخصات خریدار (مشتری):
            </div>
            <div style="display: flex; margin-bottom: 3px;"><span style="color: #64748b; width: 65px;">شناسه / ایمیل:</span><strong style="font-family: monospace; word-break: break-all;">${o.customerEmail}</strong></div>
            <div style="display: flex; margin-bottom: 3px;"><span style="color: #64748b; width: 65px;">شماره تماس:</span><span style="font-family: monospace;">${o.customerPhone || "ثبت نشده"}</span></div>
            <div style="display: flex;"><span style="color: #64748b; width: 65px;">لینک اختصاصی:</span><span style="font-family: monospace; font-size: 9px; color: #475569;">${o.customerLink || "-"}</span></div>
          </div>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; color: #334155; font-weight: bold;">
              <th style="padding: 7px 6px; width: 35px; text-align: center;">#</th>
              <th style="padding: 7px 8px; text-align: right;">شرح کالا یا خدمات دیجیتال خریداری شده</th>
              <th style="padding: 7px 6px; width: 45px; text-align: center;">تعداد</th>
              <th style="padding: 7px 8px; width: 110px; text-align: left;">مبلغ واحد (تومان)</th>
              <th style="padding: 7px 8px; width: 120px; text-align: left;">جمع کل (تومان)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8fafc; border-top: 1px solid #cbd5e1; font-weight: bold;">
              <td colspan="4" style="padding: 6px 10px; text-align: left; color: #475569;">مجموع مبلغ اقلام:</td>
              <td style="padding: 6px 10px; text-align: left; font-family: monospace;">${formatPrice(o.subtotal)} تومان</td>
            </tr>
            ${
              o.discount > 0
                ? `
              <tr style="background-color: #f0fdf4; color: #166534; font-weight: bold; border-top: 1px solid #bbf7d0;">
                <td colspan="4" style="padding: 5px 10px; text-align: left;">تخفیف اعمال شده (کوپن):</td>
                <td style="padding: 5px 10px; text-align: left; font-family: monospace;">-${formatPrice(o.discount)} تومان</td>
              </tr>
            `
                : ""
            }
            <tr style="background-color: #f1f5f9; font-size: 11px; font-weight: 900; border-top: 2px solid #0f172a; color: #020617;">
              <td colspan="4" style="padding: 8px 10px; text-align: left;">مبلغ نهایی قابل پرداخت:</td>
              <td style="padding: 8px 10px; text-align: left; font-family: monospace; color: #0f766e; font-size: 13px;">${formatPrice(o.finalTotal)} تومان</td>
            </tr>
          </tfoot>
        </table>

        <!-- Credentials Box -->
        ${deliveredHtml}

        <!-- Financial Summary in Words & Gateway -->
        <div style="display: flex; gap: 10px; margin-bottom: 16px;">
          <div style="flex: 2; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; background: #f8fafc; font-size: 10px;">
            <span style="color: #64748b;">مبلغ نهایی به حروف:</span>
            <div style="font-weight: bold; font-size: 11px; color: #0f172a; margin-top: 2px;">
              ${o.totalWords} تومان
            </div>
          </div>
          <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; background: #f8fafc; font-size: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="color: #64748b; font-size: 9px; display: block;">شیوه پرداخت:</span>
              <strong style="color: #0f172a;">${getGatewayText(o.paymentGateway)}</strong>
            </div>
            <div style="text-align: left; font-family: monospace;">
              <span style="color: #64748b; font-size: 9px; display: block;">معادل ارزی:</span>
              <strong style="color: #1d4ed8;">$${o.totalPriceUsd.toFixed(2)} USD</strong>
            </div>
          </div>
        </div>

        <!-- Signatures & Verification (AT THE BOTTOM OF PAGE) -->
        <div style="border-top: 1px solid #cbd5e1; padding-top: 10px; margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; font-size: 9px; color: #64748b;">
          <div style="max-width: 250px;">
            <strong style="color: #0f172a; display: block; margin-bottom: 2px; font-size: 10px;">ضمانت و استناد فاکتور:</strong>
            <p style="margin: 0; line-height: 1.4;">
              این صورتحساب الکترونیکی به منزله سند رسمی تحویل اشتراک قانونی بوده و تا پایان دوره مشمول گارانتی و پشتیبانی فروشگاه ارزان اکانت می‌باشد.
            </p>
          </div>

          <div style="display: flex; gap: 20px; align-items: center;">
            <div style="text-align: center;">
              <span style="display: block; margin-bottom: 4px; font-size: 9px;">امضا و تایید خریدار</span>
              <div style="width: 100px; height: 42px; border: 1px dashed #94a3b8; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #94a3b8;">
                محل امضا
              </div>
            </div>

            <div style="text-align: center;">
              <span style="display: block; margin-bottom: 4px; font-size: 9px;">مهر رسمی ارزان اکانت</span>
              <div style="width: 100px; height: 42px; border: 1px solid #0f766e; background: #f0fdfa; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #0f766e; font-weight: bold; font-size: 9px; line-height: 1.2;">
                <span>فروشگاه ارزان اکانت</span>
                <span style="font-size: 8px; color: #0d9488;">صدور و تسویه قطعی</span>
              </div>
            </div>
          </div>
        </div>

        <div style="margin-top: 8px; text-align: center; font-size: 9px; color: #94a3b8; font-family: monospace;">
          فاکتور ${idx + 1} از ${normalizedOrders.length} • شماره سفارش: #${o.orderNumber}
        </div>
      </div>
    `;
  };

  // Generate HTML for Summary Table page
  const buildSummaryHtml = () => {
    const summaryRows = normalizedOrders
      .map(
        (o, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 6px 4px; text-align: center; font-family: monospace; color: #64748b;">${idx + 1}</td>
          <td style="padding: 6px 6px; font-family: monospace; font-weight: bold; color: #020617;">#${o.orderNumber}</td>
          <td style="padding: 6px 6px; font-size: 9px; color: #475569; white-space: nowrap;">${toPersianDateTime(o.createdAt)}</td>
          <td style="padding: 6px 6px; font-size: 10px; font-family: monospace; word-break: break-all;">${o.customerEmail}</td>
          <td style="padding: 6px 6px; font-size: 10px;">${o.items.map((it) => `<div>• <strong>${it.productTitle}</strong> (${it.quantity} عدد)</div>`).join("")}</td>
          <td style="padding: 6px 4px; text-align: center; font-size: 9px;">${getGatewayText(o.paymentGateway)}</td>
          <td style="padding: 6px 6px; text-align: left; font-family: monospace; font-weight: bold; color: #0f172a; white-space: nowrap;">${formatPrice(o.finalTotal)}</td>
          <td style="padding: 6px 4px; text-align: center;"><span style="font-size: 8px; font-weight: bold; padding: 2px 5px; border-radius: 4px; ${getStatusBadgeStyle(o.status)}">${getStatusText(o.status)}</span></td>
        </tr>
      `
      )
      .join("");

    return `
      <div class="summary-page">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 44px; height: 44px; background-color: #0f766e; color: #ffffff; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-family: monospace; font-size: 18px;">
              ARZ
            </div>
            <div>
              <div style="font-size: 16px; font-weight: 900; color: #020617; letter-spacing: -0.5px;">گزارش جامع و آماری عملکرد سفارشات</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">فروشگاه آنلاین ارزان اکانت (arzanAccount) • سامانه تحویل هوشمند اشتراک‌ها</div>
            </div>
          </div>
          <div style="text-align: left; font-size: 10px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 12px; background: #f8fafc; min-width: 170px;">
            <div style="display: flex; justify-content: space-between; gap: 8px; margin-bottom: 3px;">
              <span style="color: #64748b;">شناسه سند:</span>
              <strong style="font-family: monospace; color: #020617;">${reportId}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 8px; margin-bottom: 3px;">
              <span style="color: #64748b;">تاریخ صدور:</span>
              <span style="font-family: monospace;">${nowPersian}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 8px;">
              <span style="color: #64748b;">صادرکننده:</span>
              <strong>${adminName}</strong>
            </div>
          </div>
        </div>

        <!-- Scope Banner -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; font-size: 11px;">
          <div>
            بازه زمانی گزارش: <strong style="color: #0f766e;">${timeRangeLabel}</strong> | فیلتر وضعیت: <strong style="color: #0f766e;">${statusFilterLabel}</strong>
          </div>
          <div style="background: #0f172a; color: #ffffff; padding: 2px 8px; border-radius: 6px; font-weight: bold; font-family: monospace; font-size: 10px;">
            تعداد رکوردها: ${formatNumber(normalizedOrders.length)} سفارش
          </div>
        </div>

        <!-- KPI Cards -->
        <div style="display: flex; gap: 8px; margin-bottom: 14px;">
          <div style="flex: 1; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 8px; padding: 8px 10px;">
            <span style="font-size: 10px; color: #64748b; display: block;">کل سفارشات</span>
            <strong style="font-size: 16px; font-family: monospace; color: #0f172a;">${formatNumber(normalizedOrders.length)} <span style="font-size: 10px; font-weight: normal; color: #64748b;">سفارش</span></strong>
          </div>
          <div style="flex: 1.5; border: 1px solid #bbf7d0; background: #f0fdf4; border-radius: 8px; padding: 8px 10px;">
            <span style="font-size: 10px; color: #166534; display: block;">مجموع فروش (تومان)</span>
            <strong style="font-size: 16px; font-family: monospace; color: #15803d;">${formatPrice(totalToman)} <span style="font-size: 10px; font-weight: normal; color: #166534;">تومان</span></strong>
          </div>
          <div style="flex: 1.2; border: 1px solid #bfdbfe; background: #eff6ff; border-radius: 8px; padding: 8px 10px;">
            <span style="font-size: 10px; color: #1e40af; display: block;">مجموع دلاری</span>
            <strong style="font-size: 16px; font-family: monospace; color: #1d4ed8;">$${totalUsd.toFixed(2)} <span style="font-size: 10px; font-weight: normal; color: #1e40af;">USD</span></strong>
          </div>
          <div style="flex: 1; border: 1px solid #e9d5ff; background: #faf5ff; border-radius: 8px; padding: 8px 10px;">
            <span style="font-size: 10px; color: #6b21a8; display: block;">موفق / تحویل‌شده</span>
            <strong style="font-size: 16px; font-family: monospace; color: #7e22ce;">${formatNumber(deliveredCount)} <span style="font-size: 9px; font-weight: normal; color: #6b21a8;">(${normalizedOrders.length > 0 ? Math.round((deliveredCount / normalizedOrders.length) * 100) : 0}%)</span></strong>
          </div>
        </div>

        <!-- Summary Table (Engineered to fit A4 100% without horizontal overflow) -->
        <table style="width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 10px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 14px;">
          <thead>
            <tr style="background: #f1f5f9; color: #334155; font-weight: bold; border-bottom: 1px solid #cbd5e1;">
              <th style="width: 25px; padding: 7px 2px; text-align: center;">#</th>
              <th style="width: 75px; padding: 7px 4px; text-align: right;">کد سفارش</th>
              <th style="width: 90px; padding: 7px 4px; text-align: right;">تاریخ ثبت</th>
              <th style="width: 130px; padding: 7px 4px; text-align: right;">مشخصات خریدار</th>
              <th style="padding: 7px 4px; text-align: right;">شرح کالا و اقلام</th>
              <th style="width: 65px; padding: 7px 2px; text-align: center;">درگاه</th>
              <th style="width: 90px; padding: 7px 6px; text-align: left;">مبلغ (تومان)</th>
              <th style="width: 70px; padding: 7px 2px; text-align: center;">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            ${summaryRows}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: bold; border-top: 2px solid #0f172a;">
              <td colspan="6" style="padding: 8px 10px; text-align: left; font-size: 11px;">جمع کل مبالغ سفارشات در این گزارش:</td>
              <td style="padding: 8px 6px; text-align: left; font-family: monospace; font-size: 12px; color: #0f766e;">${formatPrice(totalToman)}</td>
              <td style="padding: 8px 4px; text-align: center; font-size: 10px; color: #64748b;">${formatNumber(normalizedOrders.length)} سفارش</td>
            </tr>
          </tfoot>
        </table>

        <!-- Amount in Words -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; margin-bottom: 16px; font-size: 11px; display: flex; justify-content: space-between;">
          <span>مبلغ کل فروش به حروف: <strong style="color: #0f172a;">${numberToPersianWords(totalToman)} تومان</strong></span>
          <span style="font-family: monospace; color: #1d4ed8;">معادل دلاری کل: $${totalUsd.toFixed(2)} USD</span>
        </div>

        <!-- Signatures (BOTTOM) -->
        <div style="border-top: 1px solid #cbd5e1; padding-top: 10px; margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; font-size: 9px; color: #64748b;">
          <div style="max-width: 320px;">
            <strong style="color: #0f172a; display: block; margin-bottom: 2px; font-size: 10px;">استناد و گواهی گزارش:</strong>
            <p style="margin: 0; line-height: 1.4;">
              اطلاعات این گزارش به صورت خودکار از پایگاه داده مرکزی استخراج گردیده و برای رسیدگی‌های مالیاتی، حسابداری و نظارتی معتبر است.
            </p>
          </div>

          <div style="display: flex; gap: 20px; align-items: center;">
            <div style="text-align: center;">
              <span style="display: block; margin-bottom: 4px; font-size: 9px;">امضا و تایید مدیر مالی</span>
              <div style="width: 110px; height: 44px; border: 1px dashed #94a3b8; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #94a3b8;">
                محل امضا
              </div>
            </div>

            <div style="text-align: center;">
              <span style="display: block; margin-bottom: 4px; font-size: 9px;">مهر رسمی ارزان اکانت</span>
              <div style="width: 110px; height: 44px; border: 1px solid #0f766e; background: #f0fdfa; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #0f766e; font-weight: bold; font-size: 9px; line-height: 1.2;">
                <span>فروشگاه ارزان اکانت</span>
                <span style="font-size: 8px; color: #0d9488;">اتوماسیون مالی تایید شد</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // Build the complete standalone document HTML
  const generateFullHtml = () => {
    let bodyContent = "";
    if (viewMode === "summary") {
      bodyContent = buildSummaryHtml();
    } else if (viewMode === "detailed") {
      bodyContent = normalizedOrders.map(buildInvoiceHtml).join("");
    } else {
      // Both: Summary first, then page break, then all detailed invoices
      bodyContent = buildSummaryHtml() + normalizedOrders.map(buildInvoiceHtml).join("");
    }

    return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاکتورهای ارزان اکانت</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm 10mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Vazirmatn", "Shabnam", Tahoma, sans-serif;
      font-size: 11px;
      line-height: 1.4;
    }
    .invoice-page {
      width: 100%;
      min-height: 270mm;
      max-height: 275mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      padding: 6mm 0;
      box-sizing: border-box;
    }
    .invoice-page:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
    .summary-page {
      width: 100%;
      min-height: 270mm;
      max-height: 275mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      padding: 6mm 0;
      box-sizing: border-box;
    }
    .summary-page:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
  };

  // Robust printing via isolated iframe
  const handlePrint = () => {
    const fullHtml = generateFullHtml();

    // Create a hidden iframe
    const existingIframe = document.getElementById("print-engine-frame");
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = "print-engine-frame";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(fullHtml);
    doc.close();

    // Trigger print once rendered
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Iframe print error:", e);
        window.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 3000);
      }
    }, 450);
  };

  return (
    <div
      id="printable-report-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6"
    >
      {/* Top Floating Control Bar - Excluded from Print */}
      <div className="no-print fixed top-4 inset-x-4 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/95 border border-slate-700/80 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">پیش‌نمایش و چاپ فاکتورهای رسمی</span>
              <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded-full font-mono">
                {formatNumber(orders.length)} سفارش
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              بازه: <strong className="text-white">{timeRangeLabel}</strong> | وضعیت:{" "}
              <strong className="text-white">{statusFilterLabel}</strong>
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
          <button
            onClick={() => setViewMode("detailed")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "detailed"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>فاکتورهای تفصیلی هر سفارش ({formatNumber(orders.length)})</span>
          </button>
          <button
            onClick={() => setViewMode("summary")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "summary"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>جدول خلاصه عملکرد</span>
          </button>
          <button
            onClick={() => setViewMode("both")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "both"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>پکیج کامل (خلاصه + فاکتورها)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-teal-900/30 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>
              {viewMode === "detailed"
                ? `چاپ فاکتورهای تفصیلی (${formatNumber(orders.length)} صفحه)`
                : viewMode === "summary"
                ? "چاپ جدول خلاصه عملکرد"
                : `چاپ پکیج کامل (${formatNumber(orders.length + 1)} صفحه)`}
            </span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* On-Screen Preview Container */}
      <div
        id="preview-orders-report"
        dir="rtl"
        className="mt-20 sm:mt-16 mb-8 w-full max-w-4xl font-sans space-y-8"
        style={{ colorScheme: "light" }}
      >
        {/* VIEW 1: SUMMARY TABLE PREVIEW */}
        {(viewMode === "summary" || viewMode === "both") && (
          <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-2xl p-6 sm:p-10 relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center font-black font-mono text-xl shadow-md">
                  ARZ
                </div>
                <div>
                  <h1 className="font-black text-xl text-slate-950 tracking-tight">
                    گزارش جامع و آماری عملکرد سفارشات
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    فروشگاه آنلاین ارزان اکانت (arzanAccount) • سامانه هوشمند توزیع اشتراک‌های دیجیتال
                  </p>
                </div>
              </div>

              <div className="text-left font-mono text-xs text-slate-700 space-y-1 self-end sm:self-auto bg-slate-50 border border-slate-200 p-3 rounded-xl min-w-56">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400 font-sans">شناسه سند:</span>
                  <span className="font-bold text-slate-900">{reportId}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400 font-sans">تاریخ صدور:</span>
                  <span>{nowPersian}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400 font-sans">صادرکننده:</span>
                  <span className="font-sans font-bold text-teal-800">{adminName}</span>
                </div>
              </div>
            </div>

            {/* Scope Banner */}
            <div className="my-5 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-700" />
                  <span>آمار عملکرد سفارشات سامانه در بازه انتخابی</span>
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    بازه زمانی: <strong className="text-slate-900">{timeRangeLabel}</strong>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-slate-400" />
                    فیلتر وضعیت: <strong className="text-slate-900">{statusFilterLabel}</strong>
                  </span>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-mono font-bold self-end md:self-auto">
                تعداد رکورد: {formatNumber(normalizedOrders.length)}
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-medium block">کل سفارشات در گزارش</span>
                <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">
                  {formatNumber(normalizedOrders.length)}{" "}
                  <span className="text-xs font-sans font-normal text-slate-400">سفارش</span>
                </span>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <span className="text-[11px] text-emerald-800 font-medium block">مجموع فروش (تومان)</span>
                <span className="text-xl font-black font-mono text-emerald-700 mt-1 block">
                  {formatPrice(totalToman)}{" "}
                  <span className="text-xs font-sans font-normal text-slate-400">تومان</span>
                </span>
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                <span className="text-[11px] text-blue-800 font-medium block">مجموع فروش دلاری</span>
                <span className="text-xl font-black font-mono text-blue-700 mt-1 block">
                  ${totalUsd.toFixed(2)} <span className="text-xs font-sans font-normal text-slate-400">USD</span>
                </span>
              </div>

              <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl">
                <span className="text-[11px] text-purple-800 font-medium block">موفق / تحویل شده</span>
                <span className="text-xl font-black font-mono text-purple-700 mt-1 block">
                  {formatNumber(deliveredCount)}{" "}
                  <span className="text-xs font-sans font-normal text-slate-400">
                    ({normalizedOrders.length > 0 ? Math.round((deliveredCount / normalizedOrders.length) * 100) : 0}%)
                  </span>
                </span>
              </div>
            </div>

            {/* Summary Table */}
            <div className="overflow-x-auto border border-slate-300 rounded-xl mb-6">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">کد سفارش</th>
                    <th className="py-2.5 px-3">تاریخ و ساعت ثبت</th>
                    <th className="py-2.5 px-3">مشخصات خریدار</th>
                    <th className="py-2.5 px-3">شرح سفارش و اقلام</th>
                    <th className="py-2.5 px-3">درگاه</th>
                    <th className="py-2.5 px-3 text-left">مبلغ (تومان)</th>
                    <th className="py-2.5 px-3 text-center">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {normalizedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        هیچ سفارشی مطابق معیارهای انتخابی برای این بازه یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    normalizedOrders.map((o, idx) => (
                      <tr key={o.id || o.orderNumber} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-semibold">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          #{o.orderNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap text-[11px]">
                          {toPersianDateTime(o.createdAt)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800 block text-[11px]">
                            {o.customerEmail}
                          </span>
                          {o.customerPhone && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {o.customerPhone}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 max-w-xs">
                          {o.items.map((it, i) => (
                            <div key={i} className="text-[11px] text-slate-700">
                              <span className="font-bold">• {it.productTitle}</span>
                              <span className="text-slate-400 text-[10px] mr-1">
                                ({it.quantity} عدد)
                              </span>
                            </div>
                          ))}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-slate-600">
                          {getGatewayText(o.paymentGateway)}
                        </td>
                        <td className="py-2.5 px-3 text-left font-mono font-bold text-slate-900 whitespace-nowrap text-xs">
                          {formatPrice(o.finalTotal)}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: o.status === "delivered" ? "#dcfce7" : "#fef3c7",
                              color: o.status === "delivered" ? "#166534" : "#92400e",
                            }}
                          >
                            {getStatusText(o.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {normalizedOrders.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                      <td colSpan={6} className="py-3 px-4 text-left text-slate-800 font-bold">
                        جمع کل مبالغ سفارشات این گزارش:
                      </td>
                      <td className="py-3 px-3 text-left font-mono text-sm text-emerald-800">
                        {formatPrice(totalToman)} تومان
                      </td>
                      <td className="py-3 px-3 text-center text-xs text-slate-500">
                        {formatNumber(normalizedOrders.length)} سفارش
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Amount in Words */}
            {normalizedOrders.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 mb-6 flex items-center justify-between">
                <span className="font-semibold text-slate-600">
                  مبلغ کل به حروف:{" "}
                  <strong className="text-slate-950 font-bold">
                    {numberToPersianWords(totalToman)} تومان
                  </strong>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  معادل دلاری تقریبی: ${totalUsd.toFixed(2)} USD
                </span>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: DETAILED INVOICE PREVIEWS */}
        {(viewMode === "detailed" || viewMode === "both") && (
          <div className="space-y-8">
            {normalizedOrders.length === 0 ? (
              <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-2xl p-12 text-center text-slate-400 text-sm">
                هیچ سفارشی در این بازه برای صدور فاکتور تفصیلی یافت نشد.
              </div>
            ) : (
              normalizedOrders.map((order, orderIdx) => (
                <div
                  key={order.id || order.orderNumber || orderIdx}
                  className="bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-2xl p-6 sm:p-10 relative overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center font-black font-mono text-xl shadow-md">
                        ARZ
                      </div>
                      <div>
                        <h1 className="font-black text-lg sm:text-xl text-slate-950 tracking-tight">
                          صورتحساب رسمی فروش کالا و خدمات الکترونیکی
                        </h1>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          فروشگاه آنلاین ارزان اکانت • سامانه اتوماسیون اشتراک‌های دیجیتال
                        </p>
                      </div>
                    </div>

                    <div className="text-left font-mono text-xs text-slate-700 space-y-1 self-end sm:self-auto bg-slate-50 border border-slate-200 p-3 rounded-xl min-w-56">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400 font-sans">شماره فاکتور:</span>
                        <span className="font-bold text-slate-950">#{order.orderNumber}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400 font-sans">تاریخ و ساعت ثبت:</span>
                        <span>{toPersianDateTime(order.createdAt)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400 font-sans">وضعیت:</span>
                        <span
                          className="font-sans font-bold px-2 py-0.5 rounded text-[10px]"
                          style={{
                            backgroundColor: order.status === "delivered" ? "#dcfce7" : "#fef3c7",
                            color: order.status === "delivered" ? "#166534" : "#92400e",
                          }}
                        >
                          {getStatusText(order.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Parties (Seller & Buyer) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
                    {/* Seller */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="font-bold text-slate-800 pb-2 border-b border-slate-200 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-teal-700" />
                        <span>مشخصات فروشنده (عرضه‌کننده):</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-slate-600">
                        <span className="text-slate-400">نام فروشگاه:</span>
                        <span className="col-span-2 font-bold text-slate-900">ارزان اکانت (arzanAccount)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-slate-600">
                        <span className="text-slate-400">نوع فعالیت:</span>
                        <span className="col-span-2">ارائه اشتراک هوش مصنوعی و سرویس‌های دیجیتال</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-slate-600">
                        <span className="text-slate-400">پشتیبانی:</span>
                        <span className="col-span-2 font-mono">support@arzanaccount.ir</span>
                      </div>
                    </div>

                    {/* Buyer */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="font-bold text-slate-800 pb-2 border-b border-slate-200 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-teal-700" />
                        <span>مشخصات خریدار (مشتری):</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-slate-600">
                        <span className="text-slate-400">شناسه / ایمیل:</span>
                        <span className="col-span-2 font-bold text-slate-900 break-all">
                          {order.customerEmail}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-slate-600">
                        <span className="text-slate-400">شماره موبایل:</span>
                        <span className="col-span-2 font-mono text-slate-900">
                          {order.customerPhone || "ثبت نشده"}
                        </span>
                      </div>
                      {order.customerLink && (
                        <div className="grid grid-cols-3 gap-1 text-slate-600">
                          <span className="text-slate-400">لینک اختصاصی:</span>
                          <span className="col-span-2 font-mono text-slate-700 break-all text-[11px]">
                            {order.customerLink}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden mb-5">
                    <table className="w-full text-right text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3">شرح خدمات / اشتراک خریداری‌شده</th>
                          <th className="py-2.5 px-3 text-center">تعداد</th>
                          <th className="py-2.5 px-3 text-left">مبلغ واحد (تومان)</th>
                          <th className="py-2.5 px-3 text-left">جمع کل (تومان)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {order.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3 text-center font-mono text-slate-400 font-semibold">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-900 block text-xs">
                                {item.productTitle}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-xs">
                              {formatNumber(item.quantity)}
                            </td>
                            <td className="py-3 px-3 text-left font-mono text-slate-800">
                              {formatPrice(item.priceToman)}
                            </td>
                            <td className="py-3 px-3 text-left font-mono font-bold text-slate-900">
                              {formatPrice(item.priceToman * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 font-bold border-t border-slate-300">
                          <td colSpan={4} className="py-2.5 px-4 text-left text-slate-700">
                            مجموع مبالغ اقلام:
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono text-slate-900">
                            {formatPrice(order.subtotal)} تومان
                          </td>
                        </tr>
                        {order.discount > 0 && (
                          <tr className="bg-emerald-50/50 text-emerald-800 font-bold border-t border-emerald-100">
                            <td colSpan={4} className="py-2 px-4 text-left">
                              تخفیف اعمال شده (کوپن):
                            </td>
                            <td className="py-2 px-3 text-left font-mono">
                              -{formatPrice(order.discount)} تومان
                            </td>
                          </tr>
                        )}
                        <tr className="bg-slate-100 font-black border-t-2 border-slate-400 text-sm">
                          <td colSpan={4} className="py-3 px-4 text-left text-slate-900">
                            مبلغ نهایی قابل پرداخت:
                          </td>
                          <td className="py-3 px-3 text-left font-mono text-emerald-800">
                            {formatPrice(order.finalTotal)} تومان
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Delivered Credentials Box */}
                  {order.deliveredAccounts && order.deliveredAccounts.length > 0 && (
                    <div className="mb-5 p-4 bg-teal-50/80 border border-teal-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2 font-bold text-xs text-teal-900 pb-2 border-b border-teal-200">
                        <Key className="w-4 h-4 text-teal-700" />
                        <span>اطلاعات اکانت و لایسنس‌های تحویل داده شده:</span>
                      </div>
                      <div className="space-y-1.5 font-mono text-xs text-slate-800 dir-ltr text-left">
                        {order.deliveredAccounts.map((acc, accIdx) => (
                          <div
                            key={accIdx}
                            className="p-2 bg-white/90 border border-teal-100 rounded-lg flex items-center justify-between"
                          >
                            <span className="font-bold">{acc}</span>
                            <span className="text-[10px] font-sans text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded">
                              لایسنس #{accIdx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Financial Summary & Payment Method */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                      <span className="text-slate-400 block">مبلغ به حروف:</span>
                      <strong className="text-slate-950 font-bold block text-sm">
                        {order.totalWords} تومان
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block">درگاه و شیوه پرداخت:</span>
                        <strong className="text-slate-900 font-bold mt-0.5 block">
                          {getGatewayText(order.paymentGateway)}
                        </strong>
                      </div>
                      <div className="text-left font-mono">
                        <span className="text-slate-400 block text-[10px]">معادل ارزی تقریبی:</span>
                        <span className="text-blue-700 font-bold text-xs">
                          ${order.totalPriceUsd.toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Signatures AT BOTTOM */}
                  <div className="pt-6 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800">ضمانت و استناد فاکتور:</p>
                      <p className="text-[11px] text-slate-600 max-w-md">
                        این فاکتور الکترونیکی به منزله سند رسمی تحویل کالا و فعالسازی لایسنس می‌باشد و مشمول پشتیبانی و گارانتی کارکرد فروشگاه ارزان اکانت است.
                      </p>
                    </div>

                    <div className="flex items-center gap-8 self-end sm:self-auto">
                      <div className="text-center">
                        <span className="block text-[11px] text-slate-400 mb-1">امضا و تایید مشتری</span>
                        <div className="w-28 h-12 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                          محل امضا
                        </div>
                      </div>

                      <div className="text-center">
                        <span className="block text-[11px] text-slate-400 mb-1">مهر رسمی ارزان اکانت</span>
                        <div className="w-28 h-12 border border-teal-400 bg-teal-50/60 rounded-lg flex flex-col items-center justify-center text-[9px] text-teal-800 font-bold p-1">
                          <span>فروشگاه ارزان اکانت</span>
                          <span className="text-[8px] text-teal-600">صدور و تسویه قطعی</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview Footer */}
                  <div className="no-print mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>
                      فاکتور {orderIdx + 1} از {normalizedOrders.length}
                    </span>
                    <span>#{order.orderNumber}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersReportPrintModal;
