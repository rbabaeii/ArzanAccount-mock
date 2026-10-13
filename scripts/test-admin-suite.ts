import { api } from "@/lib/api";
import { mockDb, getMockDb } from "@/lib/mockDb";

async function runTests() {
  console.log("==================================================");
  console.log("🚀 STARTING ARZAN ACCOUNT ADMIN PANEL TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: any, testName: string) {
    total++;
    if (Boolean(condition)) {
      passed++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      throw new Error(`Assertion failed for: ${testName}`);
    }
  }

  // 1. RBAC & Auth Roles
  console.log("\n--- Area 1: Layout & RBAC Roles ---");
  const otpRes = await api.sendOtp("09181111111");
  assert(otpRes.success && otpRes.code === "11111", "SUPER_ADMIN (09181111111) OTP verification response");

  const superAdminAuth = await api.verifyOtp("09181111111", "11111");
  assert(superAdminAuth.user?.role === "SUPER_ADMIN", "Super Admin logged in with role SUPER_ADMIN");

  const catalogAuth = await api.verifyOtp("09130000002", "11111");
  assert(catalogAuth.user?.role === "CATALOG_MANAGER", "Catalog Manager (09130000002) logged in with role CATALOG_MANAGER");

  const financeAuth = await api.verifyOtp("09140000003", "11111");
  assert(financeAuth.user?.role === "FINANCE_ADMIN", "Finance Admin (09140000003) logged in with role FINANCE_ADMIN");

  const supportAuth = await api.verifyOtp("09120000001", "11111");
  assert(supportAuth.user?.role === "SUPPORT_ADMIN", "Support Admin (09120000001) logged in with role SUPPORT_ADMIN");

  // 2. Dashboard & Stats
  console.log("\n--- Area 2: Dashboard & Currency Sync ---");
  const settings = await api.getSettings();
  assert(typeof settings.usdToRialRate === "number" && settings.usdToRialRate > 0, "System settings fetched with valid usdToRialRate");

  const syncRes = await api.syncCurrencyNow("مدیر ارشد");
  assert(syncRes.success && syncRes.usdToRialRate > 0, "Currency synced live with mock simulated API");

  // 3. Products & Inventory
  console.log("\n--- Area 3: Products & Inventory CRUD ---");
  const initialProds = await api.getProducts();
  const initialCount = initialProds.products.length;

  const newProd = await api.createProduct({
    name: "ChatGPT Plus Mock Test",
    customTitle: "اکانت آزمایشی چت جی‌پی‌تی پلاس",
    costPriceUsd: 15.0,
    retailPriceUsd: 20.0,
    stockCount: 45,
    inStock: true,
    categoryId: "cat-tools",
    tags: ["هوش مصنوعی", "چت جی‌پی‌تی"],
  }, "مدیر سیستم");
  assert(newProd && newProd.id && newProd.name === "ChatGPT Plus Mock Test", "Product created successfully");

  const updatedProd = await api.updateProduct(newProd.id, {
    stockCount: 99,
    customTitle: "اکانت آزمایشی چت جی‌پی‌تی پلاس (ویرایش شده)",
  }, "مدیر سیستم");
  assert(updatedProd?.stockCount === 99, "Product stock and title updated");

  const toggleRes = await api.toggleProductActive(newProd.id, "مدیر سیستم");
  assert(toggleRes?.isActive !== undefined, "Product active status toggled");

  const validateStockRes = await api.validateLiveStock(newProd.id, 10);
  assert(validateStockRes.valid && validateStockRes.stockCount === 99, "Live stock validated");

  const deleteProdRes = await api.deleteProduct(newProd.id, "مدیر سیستم");
  assert(deleteProdRes.success, "Product deleted successfully");

  // 4. Categories & Tags
  console.log("\n--- Area 4: Categories & Tags Management ---");
  const newCat = await api.createCategory({
    title: "سرویس‌های ابری آزمایشی",
    titleFa: "سرویس‌های ابری آزمایشی",
    slug: "cloud-test-" + Date.now(),
    description: "توضیحات دسته تست",
    icon: "Cloud",
  });
  assert(newCat && newCat.id && newCat.slug.startsWith("cloud-test"), "Category created successfully");

  const updatedCat = await api.updateCategory(newCat.id, { title: "سرویس‌های ابری بروز شده" });
  assert(updatedCat?.title === "سرویس‌های ابری بروز شده", "Category title updated");

  const deleteCatRes = await api.deleteCategory(newCat.id);
  assert(deleteCatRes.success, "Category deleted successfully");

  const testTagName = "تگ-تستی-" + Date.now();
  const newTagRes = await api.createTag({ tag: testTagName });
  assert(newTagRes.tag === testTagName, "Tag created successfully");

  const renameTagRes = await api.renameTag({ oldTag: testTagName, newTag: testTagName + "-ویرایش" });
  assert(renameTagRes.newTag === testTagName + "-ویرایش", "Tag renamed successfully");

  const deleteTagRes = await api.deleteTag(testTagName + "-ویرایش");
  assert(deleteTagRes.affectedCount >= 0, "Tag deleted successfully");

  // 5. Orders & License Delivery
  console.log("\n--- Area 5: Orders & License Delivery ---");
  const newOrder = await api.createBackendOrder({
    customerEmail: "user_test@example.com",
    customerPhone: "09189998877",
    totalPriceToman: 450000,
    totalPriceUsd: 6.25,
    paymentGateway: "cartbecart",
    items: [{ productId: "p-1", productTitle: "اکانت اسپاتیفای", quantity: 1, priceToman: 450000 }],
  });
  assert(newOrder && newOrder.id && newOrder.status === "processing", "Order created in processing status");

  const deliveredAccounts = ["ایمیل: spot@mock.com", "پسورد: Pass@123456", "لایسنس: ARZ-SPOT-998877"];
  const updatedOrder = await api.updateOrderStatus(newOrder.id, {
    status: "delivered",
    deliveredAccounts,
    adminName: "علی صادقی (پشتیبان)",
  }, "علی صادقی (پشتیبان)");
  assert(updatedOrder?.status === "delivered" && updatedOrder?.deliveredAccounts?.length === 3, "Order status updated to delivered with credentials");

  // 6. Refunds
  console.log("\n--- Area 6: Refund Requests & Processing ---");
  const refundReqOrder = await api.createBackendOrder({
    customerEmail: "refund_user@example.com",
    customerPhone: "09187776655",
    totalPriceToman: 300000,
    totalPriceUsd: 4.15,
    paymentGateway: "cartbecart",
    items: [{ productId: "p-2", productTitle: "اشتراک نتفلیکس", quantity: 1, priceToman: 300000 }],
  });
  const reqRefundRes = await api.requestRefund(refundReqOrder.id, "عدم انطباق با دستگاه", "6037991811223344", "IR120170000000112233445566");
  assert(reqRefundRes.success, "Refund requested successfully");

  const refundsList = await api.getRefundRequests();
  const targetRefund = refundsList.find((r: any) => r.id === refundReqOrder.id || r.orderNumber === refundReqOrder.orderNumber);
  assert(Boolean(targetRefund), "Refund request found in admin refund list");

  const processRefundRes = await api.processRefund({
    orderId: refundReqOrder.id,
    refundMethod: "bank_card",
    trackingCode: "TRK-BANK-998811",
    adminName: "زهرا احمدی (مدیر مالی)",
  });
  assert(processRefundRes.success && processRefundRes.order?.status === "refunded", "Refund processed with bank tracking code");

  // 7. Card-to-Card Payments
  console.log("\n--- Area 7: Card-to-Card (CartBeCart) Payments ---");
  const initPayment = await api.initiateCardPayment({
    orderNumber: "ARZ-PAY-1001",
    customerName: "کاربر تستی کارت",
    customerPhone: "09186665544",
    amountToman: 250000,
    paymentType: "ORDER",
  });
  assert(initPayment.success && Boolean(initPayment.paymentToken), "Card-to-card payment initiated with payment token");

  const receiptRes = await api.submitManualReceipt({
    paymentToken: initPayment.paymentToken,
    orderNumber: "ARZ-PAY-1001",
    trackingCode: "77665544",
    userCardNumber: "6037-9918-1234-5678",
    receiptUrl: "https://example.com/receipt.jpg",
  });
  assert(receiptRes.success, "Manual payment receipt submitted");

  const approvePaymentRes = await api.adminApproveCardPayment(initPayment.paymentToken, { adminNote: "واریزی تایید شد" });
  assert(approvePaymentRes.success && approvePaymentRes.payment?.status === "APPROVED", "Card payment approved by admin");

  const cbcSettings = await api.getCartBeCartSettings();
  assert(cbcSettings && Boolean(cbcSettings.fallbackCardNumber), "CartBeCart settings loaded");

  // 8. Users & Access Management
  console.log("\n--- Area 8: Users & Access Management ---");
  const testPhone = "0919" + Math.floor(1000000 + Math.random() * 9000000);
  const newUser = await api.createUser({
    name: "کاربر تستی پرسنل",
    phone: testPhone,
    email: "staff_test@example.com",
    role: "SUPPORT_ADMIN",
    status: "ACTIVE",
    walletBalanceToman: 50000,
  });
  assert(newUser && newUser.id && newUser.role === "SUPPORT_ADMIN", "New staff user created");

  const roleUpdateRes = await api.updateUserRole(newUser.id, "FINANCE_ADMIN", "مدیر ارشد");
  assert(roleUpdateRes?.role === "FINANCE_ADMIN", "User role changed to FINANCE_ADMIN");

  const statusUpdateRes = await api.updateUserStatus(newUser.id, "BLOCKED", "مدیر ارشد");
  assert(statusUpdateRes?.status === "BLOCKED", "User status changed to BLOCKED");

  const topUpRes = await api.topUpWallet(newUser.id, 100000);
  assert(topUpRes.success && topUpRes.newBalance === 150000, "User wallet topped up successfully");

  const deleteUserRes = await api.deleteUser(newUser.id, "مدیر ارشد");
  assert(deleteUserRes.success, "User deleted successfully");

  // 9. System Settings (Branding, Email, SMS)
  console.log("\n--- Area 9: System Settings (Branding, Email, SMS) ---");
  const updatedBrand = await api.updateBrandingSettings({
    siteName: "ارزان اکانت - نسخه تستی",
    sitePhone: "021-88889999",
  });
  assert(updatedBrand.siteName === "ارزان اکانت - نسخه تستی", "Branding settings updated");

  const emailTestRes = await api.sendTestEmail("test@example.com", "test");
  assert(emailTestRes.success, "Simulated test email sent");

  const emailStats = await api.getEmailStats();
  assert(emailStats.total > 0 && emailStats.deliveryRate === 100, "Email stats loaded");

  const smsTestRes = await api.sendTestSms({ to: "09181111111", bodyId: 1001 });
  assert(smsTestRes.success && Boolean(smsTestRes.recId), "Simulated test SMS sent with recId");

  const smsStats = await api.getSmsStats();
  assert(smsStats.total > 0, "SMS stats loaded");

  // 10. Discounts & Coupons
  console.log("\n--- Area 10: Discounts & Coupons ---");
  const testCouponCode = "DISC" + Math.floor(1000 + Math.random() * 9000);
  const newCoupon = await api.createCoupon({
    code: testCouponCode,
    discountPercent: 25,
    maxDiscountToman: 80000,
    minOrderToman: 150000,
    maxUsage: 50,
  });
  assert(newCoupon && newCoupon.code === testCouponCode, "Coupon created successfully");

  const validatedCoupon = await api.validateCoupon(testCouponCode);
  assert(validatedCoupon.success && validatedCoupon.discountPercent === 25, "Coupon validated");

  const deleteCouponRes = await api.deleteCoupon(newCoupon.id);
  assert(deleteCouponRes.success, "Coupon deleted successfully");

  // 11. Withdrawals
  console.log("\n--- Area 11: User Withdrawals ---");
  const testWithdrawalUser = await api.createUser({
    name: "کاربر تسویه حساب",
    phone: "09185554433",
    role: "USER",
    status: "ACTIVE",
    walletBalanceToman: 500000,
  });

  const wdReq = await api.requestWithdrawal(testWithdrawalUser.id, {
    amountToman: 200000,
    cardNumber: "6037991877889900",
    sheba: "IR880170000000778899001122",
    accountOwnerName: "کاربر تسویه حساب",
  });
  assert(wdReq.success, "Withdrawal requested by user");

  const withdrawalsList = await api.getAdminWithdrawals();
  const pendingWd = withdrawalsList.requests.find((w: any) => w.userId === testWithdrawalUser.id);
  assert(Boolean(pendingWd), "Pending withdrawal found in admin withdrawals list");

  const processWdRes = await api.processWithdrawal(pendingWd.id, {
    action: "APPROVE",
    bankTrackingCode: "BNK-TRK-123456",
    adminName: "زهرا احمدی (مدیر مالی)",
  });
  assert(processWdRes.success && processWdRes.request?.status === "APPROVED", "Withdrawal approved with bank tracking code");

  // 12. Logs & Admin Activities
  console.log("\n--- Area 12: Audit Logs & Admin Activities ---");
  const auditLogs = await api.getAuditLogs(10);
  assert(Array.isArray(auditLogs) && auditLogs.length > 0, "Audit logs recorded and retrieved");

  const activities = await api.getAdminActivities({ limit: 10 });
  assert(Array.isArray(activities.activities), "Admin activities retrieved");

  console.log("\n==================================================");
  console.log(`🎉 ALL TESTS COMPLETED: ${passed}/${total} PASSED!`);
  console.log("==================================================");
}

runTests().catch((e) => {
  console.error("FATAL ERROR IN TEST SUITE:", e);
  process.exit(1);
});
