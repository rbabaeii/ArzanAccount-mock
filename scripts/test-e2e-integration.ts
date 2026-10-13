import { api } from "@/lib/api";
import { mockDb, getMockDb } from "@/lib/mockDb";

async function runE2EIntegrationTests() {
  console.log("======================================================================");
  console.log("🌟 RUNNING END-TO-END STOREFRONT <-> ADMIN INTEROPERABILITY TEST SUITE");
  console.log("======================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: any, testName: string) {
    total++;
    if (Boolean(condition)) {
      passed++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // --- Step 1: Customer Auth & Storefront Catalog Browsing ---
  console.log("\n--- Step 1: Customer Authentication & Storefront Browsing ---");
  const customerAuth = await api.verifyOtp("09180000000", "11111");
  assert(customerAuth.user && customerAuth.user.role === "USER", "Customer authenticated as regular user");

  const catalog = await api.getProducts({ limit: 10 });
  assert(catalog.products.length > 0, `Storefront catalog loaded ${catalog.products.length} products`);
  const testProduct = catalog.products[0];

  const stockCheck = await api.validateLiveStock(testProduct.id, 1);
  assert(stockCheck.valid && stockCheck.inStock, `Stock validated for product: ${testProduct.customTitle}`);

  const couponCheck = await api.validateCoupon("ARZAN20", customerAuth.user.id);
  assert(couponCheck.valid && couponCheck.discountPercent === 20, "Coupon ARZAN20 validated with 20% discount");

  // --- Step 2: Placing Order via Checkout ---
  console.log("\n--- Step 2: Storefront Order Placement ---");
  const placedOrder = await api.createBackendOrder({
    customerEmail: "customer@gmail.com",
    customerPhone: "09180000000",
    totalPriceToman: 850000,
    totalPriceUsd: 11.8,
    paymentGateway: "cartbecart",
    items: [
      {
        productId: testProduct.id,
        productTitle: testProduct.customTitle,
        quantity: 1,
        priceToman: 850000,
        priceUsd: 11.8,
      },
    ],
  });
  assert(placedOrder && placedOrder.orderNumber.startsWith("ARZ-"), `Order created successfully: #${placedOrder.orderNumber}`);

  // --- Step 3: Card-to-Card Receipt Submission ---
  console.log("\n--- Step 3: Payment & Receipt Submission ---");
  const initPayment = await api.initiateCardPayment({
    orderNumber: placedOrder.orderNumber,
    orderId: placedOrder.id,
    userId: customerAuth.user.id,
    amountToman: 850000,
  });
  assert(initPayment.success && initPayment.paymentToken, "Payment initiated with token");

  const submitReceipt = await api.submitManualReceipt({
    paymentToken: initPayment.paymentToken,
    orderNumber: placedOrder.orderNumber,
    orderId: placedOrder.id,
    userId: customerAuth.user.id,
    amountToman: 850000,
    trackingCode: "SHETAB-998877",
    userCardNumber: "6037-9911-2233-4455",
    userNote: "واریز از همراه بانک با موفقیت انجام شد",
  });
  assert(submitReceipt.success, "Payment receipt submitted by customer");

  // --- Step 4: Admin Panel Verification & Approval ---
  console.log("\n--- Step 4: Admin Panel Payment & Order Fulfillment ---");
  const adminPayments = await api.getAdminCardPayments({ search: placedOrder.orderNumber });
  assert(adminPayments.payments.length > 0, "Admin sees submitted payment in payments table");

  const approvePayRes = await api.adminApproveCardPayment(
    initPayment.paymentToken,
    { adminNote: "رسید تایید و تراکنش شتاب تطبیق داده شد." },
    { name: "زهرا احمدی (مدیر مالی)", role: "FINANCE_ADMIN" }
  );
  assert(approvePayRes.success && approvePayRes.payment.status === "APPROVED", "Admin approved payment");

  // Check order status was updated
  const orderAfterPayment = await api.getOrderById(placedOrder.id);
  assert(
    orderAfterPayment?.status === "delivered" || (orderAfterPayment?.status as string) === "approved",
    `Order status automatically updated to: ${orderAfterPayment?.status}`
  );

  // Deliver custom license credentials
  const deliveryRes = await api.updateOrderStatus(
    placedOrder.id,
    {
      status: "delivered",
      deliveredAccounts: [
        "سرویس فعال شده:",
        `لایسنس اختصاصی: ARZ-LIC-${Date.now()}`,
        "ایمیل فعالسازی: customer@gmail.com",
      ],
      adminName: "علی صادقی (مدیر پشتیبانی)",
    },
    "علی صادقی (مدیر پشتیبانی)",
    "SUPPORT_ADMIN"
  );
  assert(deliveryRes?.deliveredAccounts?.length === 3, "Credentials delivered to customer order");

  // --- Step 5: Customer Orders Page Verification & Refund Request ---
  console.log("\n--- Step 5: Customer Receives Credentials & Requests Refund ---");
  const customerOrderView = await api.getOrderById(placedOrder.id);
  assert(
    customerOrderView && customerOrderView.deliveredAccounts && customerOrderView.deliveredAccounts.length > 0,
    "Customer can view delivered credentials in /orders"
  );

  const refundReqRes = await api.requestRefund(
    placedOrder.id,
    "عدم نیاز به سرویس",
    "6037991122334455",
    "IR120170000000112233445566"
  );
  assert(refundReqRes.success, "Customer submitted refund request");

  const orderInRefundState = await api.getOrderById(placedOrder.id);
  assert(orderInRefundState?.status === "refund_requested", "Order status changed to refund_requested");

  // --- Step 6: Admin Panel Refund Processing to Wallet ---
  console.log("\n--- Step 6: Admin Approves Refund to Customer Wallet ---");
  const refundQueue = await api.getRefundRequests();
  assert(refundQueue.some((o: any) => o.id === placedOrder.id), "Refund request visible in /admin/orders/refunds queue");

  const userBeforeRefund = await api.getUserProfile(customerAuth.user.id);
  const walletBefore = userBeforeRefund?.walletBalanceToman || 0;

  const refundProcessRes = await api.processRefund({
    orderId: placedOrder.id,
    refundMethod: "wallet",
    adminName: "زهرا احمدی (مدیر مالی)",
  });
  assert(refundProcessRes.success, "Admin processed refund to user wallet");

  const userAfterRefund = await api.getUserProfile(customerAuth.user.id);
  const expectedWallet = walletBefore + 850000;
  assert(
    userAfterRefund?.walletBalanceToman === expectedWallet,
    `Customer wallet credited: from ${walletBefore.toLocaleString()} to ${userAfterRefund?.walletBalanceToman.toLocaleString()} Tomans`
  );

  // --- Step 7: Live Search & Tags Integration ---
  console.log("\n--- Step 7: Live Search & Tag Indexing ---");
  const searchRes = await api.searchLive("chatgpt", "public", 5);
  assert(searchRes.totalMatches >= 0 && Array.isArray(searchRes.products), "Live search returned formatted response");

  console.log("\n======================================================================");
  console.log(`🎉 ALL ${passed}/${total} E2E STOREFRONT <-> ADMIN INTEGRATION TESTS PASSED!`);
  console.log("======================================================================\n");
}

runE2EIntegrationTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
