"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Tag,
  Plus,
  CheckCircle2,
  Layers,
  Users,
  Sparkles,
  Search,
  Check,
  Trash2,
  Copy,
  RefreshCw,
  UserCheck,
  Clock,
  Infinity as InfinityIcon,
  X,
  Mail,
  Phone,
  Send,
  ExternalLink,
  Shield,
  AlertCircle,
  Edit3,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import JalaliDatePickerInput from "@/components/ui/JalaliDatePickerInput";
import { formatPrice, formatNumber } from "@/lib/format";
import { generateCouponCodeFromPattern, isCouponExpired } from "@/lib/date";
import { api } from "@/lib/api";
import { Coupon, CouponTargetUser } from "@/types";

interface UserItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  status: string;
  walletBalanceToman?: number;
}

const DEFAULT_FALLBACK_USERS: UserItem[] = [
  { id: "usr-1", name: "رضا بابایی", phone: "09121234567", email: "reza@example.com", role: "SUPER_ADMIN", status: "ACTIVE", walletBalanceToman: 500000 },
  { id: "usr-2", name: "محمد محمدی", phone: "09351112233", email: "mohammad@example.com", role: "USER", status: "ACTIVE", walletBalanceToman: 150000 },
  { id: "usr-3", name: "سارا حسینی", phone: "09198887766", email: "sara@example.com", role: "USER", status: "ACTIVE", walletBalanceToman: 280000 },
  { id: "usr-4", name: "علی صادقی", phone: "09120000001", email: "ali@example.com", role: "SUPPORT_ADMIN", status: "ACTIVE", walletBalanceToman: 90000 },
  { id: "usr-5", name: "زهرا کریمی", phone: "09365554433", email: "zahra@example.com", role: "USER", status: "ACTIVE", walletBalanceToman: 0 },
];

export default function AdminDiscountsPage() {
  const { coupons, addCoupon, updateCoupon, toggleCoupon, deleteCoupon, categories } = useStore();

  // Unified Form States
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [codeType, setCodeType] = useState<"MANUAL" | "PATTERN">("PATTERN");
  const [code, setCode] = useState("");
  const [codePattern, setCodePattern] = useState("ARZAN-*****");
  const [previewSample, setPreviewSample] = useState("");

  const [discountPercent, setDiscountPercent] = useState(20);
  const [maxDiscountToman, setMaxDiscountToman] = useState(100000);
  const [minOrderToman, setMinOrderToman] = useState(200000);
  const [maxUsage, setMaxUsage] = useState(100);

  // Expiration Date (Optional / Permanent)
  const [isPermanent, setIsPermanent] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Target Audience: ALL vs SPECIFIC USERS
  const [audienceType, setAudienceType] = useState<"ALL" | "SPECIFIC_USERS">("ALL");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [users, setUsers] = useState<UserItem[]>(DEFAULT_FALLBACK_USERS);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  // Notifications toggle
  const [notifyBySms, setNotifyBySms] = useState(true);
  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feedbacks
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Table Search and Modal
  const [tableSearch, setTableSearch] = useState("");
  const [selectedCouponForModal, setSelectedCouponForModal] = useState<Coupon | null>(null);
  const [modalUserSearch, setModalUserSearch] = useState("");
  const [isResendingNotification, setIsResendingNotification] = useState(false);

  // Refresh pattern sample preview
  useEffect(() => {
    setPreviewSample(generateCouponCodeFromPattern(codePattern));
  }, [codePattern]);

  // Fetch real users from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadUsers() {
      try {
        const res = await api.getUsers({ limit: 100 });
        if (isMounted && res?.users && res.users.length > 0) {
          setUsers(res.users);
        }
      } catch (err) {
        console.warn("Could not fetch backend users for discount selection, using local users.", err);
      }
    }
    loadUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter users based on search and role
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = userRoleFilter === "all" || u.role === userRoleFilter;
      const query = userSearch.trim().toLowerCase();
      const matchSearch =
        !query ||
        (u.name && u.name.toLowerCase().includes(query)) ||
        (u.phone && u.phone.includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query));
      return matchRole && matchSearch;
    });
  }, [users, userSearch, userRoleFilter]);

  // Toggle user selection
  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredUsers.map((u) => u.id);
    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
  };

  const handleDeselectAll = () => {
    setSelectedUserIds([]);
  };

  // Start editing an existing coupon
  const handleStartEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCodeType("MANUAL");
    setCode(coupon.code);
    setDiscountPercent(coupon.discountPercent);
    setMaxDiscountToman(coupon.maxDiscountToman);
    setMinOrderToman(coupon.minOrderToman || 0);
    setMaxUsage(coupon.maxUsage || 100);

    if (coupon.expiresAt && coupon.expiresAt.trim() !== "") {
      setIsPermanent(false);
      setExpiresAt(coupon.expiresAt);
    } else {
      setIsPermanent(true);
      setExpiresAt("");
    }

    setCategoryId(coupon.categoryId || "");

    const isSpecific =
      coupon.targetType === "USER" ||
      (coupon.targetUserIds && coupon.targetUserIds.length > 0) ||
      (coupon.targetUsers && coupon.targetUsers.length > 0) ||
      Boolean(coupon.targetUserId);

    if (isSpecific) {
      setAudienceType("SPECIFIC_USERS");
      const uids =
        coupon.targetUserIds && coupon.targetUserIds.length > 0
          ? coupon.targetUserIds
          : coupon.targetUsers && coupon.targetUsers.length > 0
          ? coupon.targetUsers.map((u) => u.id)
          : coupon.targetUserId
          ? [coupon.targetUserId]
          : [];
      setSelectedUserIds(uids);
    } else {
      setAudienceType("ALL");
      setSelectedUserIds([]);
    }

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingCoupon(null);
    setCodeType("PATTERN");
    setCode("");
    setCodePattern("ARZAN-*****");
    setDiscountPercent(20);
    setMaxDiscountToman(100000);
    setMinOrderToman(200000);
    setMaxUsage(100);
    setIsPermanent(false);
    setExpiresAt("");
    setCategoryId("");
    setAudienceType("ALL");
    setSelectedUserIds([]);
  };

  // Helper to send SMS & Email notifications to users (Non-blocking)
  const notifyUsersOfCoupon = async (
    targetUsersList: CouponTargetUser[],
    couponCodeStr: string,
    percent: number
  ) => {
    let emailCount = 0;
    let smsCount = 0;

    for (const targetUser of targetUsersList) {
      // 1) Send Email Notification if email is available
      if (notifyByEmail && targetUser.email && targetUser.email.includes("@")) {
        try {
          await api.sendCustomEmail({
            recipientEmail: targetUser.email,
            recipientName: targetUser.name,
            subject: `کد تخفیف اختصاصی شما در ارزان اکانت: ${couponCodeStr}`,
            message: `سلام ${targetUser.name || "کاربر گرامی"} عزیز،\n\nیک کد تخفیف اختصاصی با %${percent} تخفیف ویژه به حساب کاربری شما اختصاص داده شد.\n\nکد تخفیف: ${couponCodeStr}\n${
              isPermanent || !expiresAt ? "اعتبار: دائمی (بدون محدودیت زمانی)" : `مهلت استفاده: تا تاریخ ${expiresAt}`
            }\n\nجهت استفاده، این کد را در سبد خرید وارد نمایید.`,
            badge: `تخفیف %${percent} اختصاصی`,
            buttonText: "ورود به سبد خرید و استفاده",
            buttonUrl: "https://arzanaccount.ir/cart",
            adminSender: "مدیریت ارزان اکانت",
          });
          emailCount++;
        } catch (e) {
          console.warn(`Failed to send email to ${targetUser.email}`, e);
        }
      }

      // 2) Send SMS Notification if phone is available
      if (notifyBySms && targetUser.phone) {
        try {
          await api.sendCouponSms({
            phone: targetUser.phone,
            code: couponCodeStr,
            discountPercent: percent,
            customerName: targetUser.name,
          });
          smsCount++;
        } catch (e) {
          console.warn(`Failed to send SMS to ${targetUser.phone}`, e);
        }
      }
    }

    return { emailCount, smsCount };
  };

  // Submit Unified Form (Create or Edit)
  const handleSubmitCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine final coupon code
    let finalCode = "";
    if (codeType === "MANUAL") {
      finalCode = code.trim().toUpperCase();
      if (!finalCode) {
        alert("لطفاً متن کد تخفیف را وارد نمایید.");
        return;
      }
    } else {
      finalCode = generateCouponCodeFromPattern(codePattern);
    }

    // Expiry date is optional; if isPermanent is true, empty string
    const finalExpiresAt = isPermanent ? "" : expiresAt.trim();

    if (audienceType === "SPECIFIC_USERS" && selectedUserIds.length === 0) {
      alert("لطفاً حداقل یک کاربر را برای کد تخفیف اختصاصی انتخاب نمایید.");
      return;
    }

    setIsSubmitting(true);

    try {
      const isSpecific = audienceType === "SPECIFIC_USERS" && selectedUserIds.length > 0;
      const selectedUsersData: CouponTargetUser[] = isSpecific
        ? users
            .filter((u) => selectedUserIds.includes(u.id))
            .map((u) => ({
              id: u.id,
              name: u.name || "کاربر گرامی",
              phone: u.phone,
              email: u.email,
              role: u.role,
            }))
        : [];

      if (editingCoupon) {
        // 1. UPDATE EXISTING COUPON FIRST
        updateCoupon(editingCoupon.id, {
          code: finalCode,
          discountPercent,
          maxDiscountToman,
          minOrderToman,
          maxUsage: isSpecific ? selectedUsersData.length : maxUsage,
          expiresAt: finalExpiresAt,
          categoryId: categoryId ? categoryId : undefined,
          targetType: isSpecific ? "USER" : "ALL",
          targetUserIds: isSpecific ? selectedUserIds : undefined,
          targetUsers: isSpecific ? selectedUsersData : undefined,
        });

        // Reset edit mode
        handleCancelEdit();

        // 2. DISPATCH NOTIFICATIONS SECOND (Safe & Non-blocking)
        let notifyMsg = "";
        if (isSpecific && (notifyBySms || notifyByEmail)) {
          try {
            const { emailCount, smsCount } = await notifyUsersOfCoupon(
              selectedUsersData,
              finalCode,
              discountPercent
            );
            notifyMsg = ` (ارسال ${smsCount} پیامک و ${emailCount} ایمیل)`;
          } catch (notifyErr: any) {
            console.warn("Notification error during edit:", notifyErr);
            notifyMsg = ` (اما در ارسال خودکار پیامک/ایمیل خطا رخ داد)`;
          }
        }

        setToastMessage(`تغییرات کد تخفیف "${finalCode}" با موفقیت ذخیره گردید${notifyMsg}.`);
        setTimeout(() => setToastMessage(null), 4500);
      } else {
        // 1. CREATE NEW COUPON FIRST
        const newCoupon: Omit<Coupon, "id"> = {
          code: finalCode,
          discountPercent,
          maxDiscountToman,
          minOrderToman,
          maxUsage: isSpecific ? selectedUsersData.length : maxUsage,
          usageCount: 0,
          expiresAt: finalExpiresAt,
          isActive: true,
          categoryId: categoryId ? categoryId : undefined,
          targetType: isSpecific ? "USER" : "ALL",
          targetUserIds: isSpecific ? selectedUserIds : undefined,
          targetUsers: isSpecific ? selectedUsersData : undefined,
        };

        // Add to store (saved to localStorage)
        addCoupon(newCoupon);

        // Reset form immediately
        setCode("");
        setSelectedUserIds([]);

        // 2. DISPATCH NOTIFICATIONS SECOND (Safe & Non-blocking)
        let notifyMsg = "";
        if (isSpecific && (notifyBySms || notifyByEmail)) {
          try {
            const { emailCount, smsCount } = await notifyUsersOfCoupon(
              selectedUsersData,
              finalCode,
              discountPercent
            );
            notifyMsg = ` (ارسال ${smsCount} پیامک و ${emailCount} ایمیل)`;
          } catch (notifyErr: any) {
            console.warn("Notification error during creation:", notifyErr);
            notifyMsg = ` (اما در ارسال خودکار پیامک/ایمیل خطا رخ داد)`;
          }
        }

        setToastMessage(`کد تخفیف "${finalCode}" با موفقیت ایجاد و فعال گردید${notifyMsg}.`);
        setTimeout(() => setToastMessage(null), 4500);
      }
    } catch (err: any) {
      alert(err?.message || "خطا در پردازش کد تخفیف.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (codeStr: string) => {
    navigator.clipboard.writeText(codeStr);
    setCopiedCode(codeStr);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Resend notifications from popup modal
  const handleResendFromModal = async () => {
    if (!selectedCouponForModal) return;
    const targets =
      selectedCouponForModal.targetUsers ||
      (selectedCouponForModal.targetUserId
        ? [
            {
              id: selectedCouponForModal.targetUserId,
              name: selectedCouponForModal.targetUserName || "کاربر",
              phone: selectedCouponForModal.targetUserPhone,
              email: selectedCouponForModal.targetUserEmail,
            },
          ]
        : []);

    if (targets.length === 0) {
      alert("کاربری برای این کد تخفیف ثبت نشده است.");
      return;
    }

    setIsResendingNotification(true);
    try {
      const { emailCount, smsCount } = await notifyUsersOfCoupon(
        targets,
        selectedCouponForModal.code,
        selectedCouponForModal.discountPercent
      );
      alert(`اطلاع‌رسانی مجدد با موفقیت انجام شد: ${smsCount} پیامک و ${emailCount} ایمیل ارسال گردید.`);
    } catch (e: any) {
      alert("خطا در ارسال مجدد اطلاع‌رسانی: " + e?.message);
    } finally {
      setIsResendingNotification(false);
    }
  };

  // Filter coupons in table
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      if (tableSearch.trim()) {
        const q = tableSearch.trim().toLowerCase();
        const codeMatch = c.code.toLowerCase().includes(q);
        const userMatch =
          c.targetUsers?.some(
            (u) =>
              (u.name && u.name.toLowerCase().includes(q)) ||
              (u.phone && u.phone.includes(q)) ||
              (u.email && u.email.toLowerCase().includes(q))
          ) ||
          c.targetUserName?.toLowerCase().includes(q) ||
          c.targetUserPhone?.includes(q);
        return codeMatch || userMatch;
      }
      return true;
    });
  }, [coupons, tableSearch]);

  // Modal users list
  const modalUsersList = useMemo(() => {
    if (!selectedCouponForModal) return [];
    const baseList: CouponTargetUser[] =
      selectedCouponForModal.targetUsers ||
      (selectedCouponForModal.targetUserId
        ? [
            {
              id: selectedCouponForModal.targetUserId,
              name: selectedCouponForModal.targetUserName || "کاربر گرامی",
              phone: selectedCouponForModal.targetUserPhone,
              email: selectedCouponForModal.targetUserEmail,
            },
          ]
        : []);

    if (!modalUserSearch.trim()) return baseList;
    const q = modalUserSearch.trim().toLowerCase();
    return baseList.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [selectedCouponForModal, modalUserSearch]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-admin-text dark:text-white flex items-center gap-2">
          <Tag className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          <span>مدیریت کدهای تخفیف و جشنواره‌ها</span>
        </h1>
        <p className="text-xs text-admin-textMuted dark:text-slate-400 mt-1">
          تعریف کدهای تخفیف عمومی یا کاربر محور با اطلاع‌رسانی خودکار پیامک/ایمیل، تاریخ انقضای اختیاری و نمایش لیست کاربران در پاپ‌آپ
        </p>
      </div>

      {/* Main Grid: Left Unified Form (5 cols) - Right Coupons List (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Creation Box (5 cols) */}
        <div className="lg:col-span-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-6 shadow-card hover:shadow-xl hover:border-teal-400/40 dark:hover:border-teal-400/30 transition-all duration-300 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-admin-borderLight dark:border-slate-800">
            <h3 className="font-bold text-sm text-admin-text dark:text-white flex items-center gap-2">
              {editingCoupon ? (
                <>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <span>
                    ویرایش کد تخفیف:{" "}
                    <span className="font-mono text-amber-700 dark:text-amber-300">
                      {editingCoupon.code}
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-2xs">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span>ایجاد و صدور کد تخفیف جدید</span>
                </>
              )}
            </h3>
            {editingCoupon ? (
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                در حال ویرایش
              </span>
            ) : (
              <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/80 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                فرم یکپارچه
              </span>
            )}
          </div>

          <form onSubmit={handleSubmitCoupon} className="space-y-4 text-xs">
            {/* Code Generation Type Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-admin-text dark:text-slate-200">
                  متن یا الگوی کد تخفیف:
                </label>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCodeType("PATTERN")}
                    className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      codeType === "PATTERN"
                        ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    تولید خودکار با الگو
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeType("MANUAL")}
                    className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      codeType === "MANUAL"
                        ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    دستی و دلخواه
                  </button>
                </div>
              </div>

              {codeType === "PATTERN" ? (
                <div>
                  <input
                    type="text"
                    placeholder="مثال: ARZAN-***** یا VIP-****"
                    value={codePattern}
                    onChange={(e) => setCodePattern(e.target.value.toUpperCase())}
                    className="w-full bg-admin-bg dark:bg-slate-800/90 border border-purple-200 dark:border-purple-800/60 focus:border-purple-500 rounded-xl py-2 px-3 outline-none font-mono font-bold uppercase dir-ltr text-left text-purple-900 dark:text-purple-200 transition-all"
                    required
                  />
                  {/* Live Preview Badge */}
                  <div className="mt-1.5 p-2 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/60 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span className="text-[11px] text-purple-800 dark:text-purple-300">پیش‌نمایش کد:</span>
                      <span className="font-mono font-black text-xs text-purple-900 dark:text-purple-100 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800 shadow-2xs">
                        {previewSample || "ARZAN-XXXXX"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewSample(generateCouponCodeFromPattern(codePattern))}
                      className="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-200/50 rounded-lg transition-colors cursor-pointer"
                      title="نمونه دیگر"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="مثلاً: SUMMER50 یا WELCOME"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-admin-bg dark:bg-slate-800/90 border border-admin-borderLight dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 px-3 outline-none font-mono font-bold uppercase dir-ltr text-left text-slate-800 dark:text-slate-100 transition-all"
                  required
                />
              )}
            </div>

            {/* Target Audience Switch */}
            <div className="space-y-2 pt-2 border-t border-admin-borderLight dark:border-slate-800">
              <label className="block font-semibold text-admin-text dark:text-slate-200">
                مخاطبان کد تخفیف:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAudienceType("ALL")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    audienceType === "ALL"
                      ? "bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>همه کاربران (عمومی)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudienceType("SPECIFIC_USERS")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    audienceType === "SPECIFIC_USERS"
                      ? "bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300 shadow-2xs"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>کاربران خاص ({selectedUserIds.length})</span>
                </button>
              </div>

              {/* If Specific Users: Show User Picker */}
              {audienceType === "SPECIFIC_USERS" && (
                <div className="p-3 bg-purple-50/40 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-xl space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-purple-900 dark:text-purple-200">
                      انتخاب کاربران مجاز به استفاده از این کد:
                    </span>
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full">
                      {selectedUserIds.length} نفر انتخاب‌شده
                    </span>
                  </div>

                  {/* Filter and Search Bar for Users */}
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="جستجو نام، شماره یا ایمیل..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 pr-8 pl-2 text-[11px] outline-none"
                      />
                    </div>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-2 text-[11px] outline-none"
                    >
                      <option value="all">همه</option>
                      <option value="USER">مشتریان</option>
                      <option value="SUPER_ADMIN">مدیران</option>
                    </select>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span>نمایش {filteredUsers.length} کاربر</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllFiltered}
                        className="text-purple-600 dark:text-purple-400 hover:underline font-semibold cursor-pointer"
                      >
                        انتخاب همه
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="text-rose-500 hover:underline font-semibold cursor-pointer"
                      >
                        لغو همه
                      </button>
                    </div>
                  </div>

                  {/* Scrollable list */}
                  <div className="max-h-40 overflow-y-auto divide-y divide-purple-100 dark:divide-slate-800 border border-purple-200/80 dark:border-purple-800/60 rounded-xl bg-white dark:bg-slate-900 p-1 space-y-0.5">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-4 text-slate-400 text-xs">
                        کاربری یافت نشد.
                      </div>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelected = selectedUserIds.includes(u.id);
                        return (
                          <div
                            key={u.id}
                            onClick={() => handleToggleUser(u.id)}
                            className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-purple-100/70 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                                  isSelected
                                    ? "bg-purple-600 border-purple-600 text-white"
                                    : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {u.name || "کاربر"}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {u.phone || u.email}
                              </span>
                            </div>
                            {u.role === "SUPER_ADMIN" && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.2 rounded font-mono">
                                مدیر
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Notification Checkboxes */}
                  <div className="flex items-center gap-4 pt-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyBySms}
                        onChange={(e) => setNotifyBySms(e.target.checked)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>ارسال خودکار پیامک به کاربران</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyByEmail}
                        onChange={(e) => setNotifyByEmail(e.target.checked)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>ارسال خودکار ایمیل به کاربران</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Percent and Max Discount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1">
                  درصد تخفیف:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="95"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full bg-admin-bg dark:bg-slate-800/90 border border-admin-borderLight dark:border-slate-700 focus:border-teal-500 rounded-xl py-2 px-3 outline-none font-mono text-slate-800 dark:text-slate-100 transition-all"
                    required
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono">٪</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1">
                  سقف تخفیف (تومان):
                </label>
                <input
                  type="number"
                  step="10000"
                  value={maxDiscountToman}
                  onChange={(e) => setMaxDiscountToman(Number(e.target.value))}
                  className="w-full bg-admin-bg dark:bg-slate-800/90 border border-admin-borderLight dark:border-slate-700 focus:border-teal-500 rounded-xl py-2 px-3 outline-none font-mono text-slate-800 dark:text-slate-100 transition-all"
                  required
                />
              </div>
            </div>

            {/* Min Order and Max Usage */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1">
                  حداقل سبد خرید (تومان):
                </label>
                <input
                  type="number"
                  step="10000"
                  value={minOrderToman}
                  onChange={(e) => setMinOrderToman(Number(e.target.value))}
                  className="w-full bg-admin-bg dark:bg-slate-800/90 border border-admin-borderLight dark:border-slate-700 focus:border-teal-500 rounded-xl py-2 px-3 outline-none font-mono text-slate-800 dark:text-slate-100 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1">
                  ظرفیت استفاده:
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxUsage}
                  onChange={(e) => setMaxUsage(Number(e.target.value))}
                  className="w-full bg-admin-bg dark:bg-slate-800/90 border border-admin-borderLight dark:border-slate-700 focus:border-teal-500 rounded-xl py-2 px-3 outline-none font-mono text-slate-800 dark:text-slate-100 transition-all"
                  required
                />
              </div>
            </div>

            {/* Expiration Date (Optional / Permanent) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-admin-text dark:text-slate-200">
                  تاریخ انقضا (اختیاری):
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-teal-700 dark:text-teal-400 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPermanent}
                    onChange={(e) => {
                      setIsPermanent(e.target.checked);
                      if (e.target.checked) setExpiresAt("");
                    }}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>کد دائمی و بدون انقضا</span>
                </label>
              </div>

              {!isPermanent ? (
                <JalaliDatePickerInput
                  value={expiresAt}
                  onChange={setExpiresAt}
                  minDate="today"
                  placeholder="انتخاب تاریخ شمسی جلالی (در صورت خالی ماندن = دائمی)..."
                />
              ) : (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <InfinityIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-bold">این کد تخفیف بدون تاریخ انقضا و همیشگی خواهد بود.</span>
                </div>
              )}
            </div>

            {/* Target Category */}
            <div>
              <label className="block font-semibold text-admin-text dark:text-slate-200 mb-1">
                محدود به دسته‌بندی خاص (اختیاری):
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-admin-bg dark:bg-slate-800/90 border border-admin-borderLight dark:border-slate-700 focus:border-teal-500 rounded-xl py-2 px-3 outline-none text-slate-800 dark:text-slate-100 font-sans transition-all"
              >
                <option value="">همه دسته‌بندی‌ها (بدون محدودیت)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title} ({cat.slug})
                  </option>
                ))}
              </select>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  editingCoupon
                    ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-500/20"
                    : audienceType === "SPECIFIC_USERS"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20"
                    : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-500/20"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>
                      {editingCoupon ? "در حال ذخیره تغییرات..." : "در حال صدور و ارسال اطلاعیه‌ها..."}
                    </span>
                  </>
                ) : editingCoupon ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ذخیره تغییرات کد تخفیف</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>
                      {audienceType === "SPECIFIC_USERS"
                        ? `صدور کد اختصاصی برای ${selectedUserIds.length} کاربر`
                        : "ثبت و انتشار کد تخفیف عمومی"}
                    </span>
                  </>
                )}
              </button>

              {editingCoupon && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="انصراف از ویرایش"
                >
                  <X className="w-4 h-4" />
                  <span>انصراف</span>
                </button>
              )}
            </div>
          </form>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fadeIn border border-emerald-200 dark:border-emerald-800 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}
        </div>

        {/* Coupons List (7 cols) */}
        <div className="lg:col-span-7 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-admin-borderLight dark:border-slate-800/80 rounded-2xl p-6 shadow-card hover:shadow-lg transition-all duration-300 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-admin-borderLight dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-admin-text dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>کدهای تخفیف تعریف‌شده ({coupons.length})</span>
              </h3>
              <span className="text-[11px] text-neutral-400 dark:text-slate-500">
                یک بار نمایش به ازای هر کد به همراه پاپ‌آپ کاربران مجاز
              </span>
            </div>

            {/* Search coupons */}
            <div className="relative sm:w-60">
              <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="جستجو کد یا نام کاربر..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 pr-9 pl-3 text-xs outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Coupons Table List */}
          <div className="divide-y divide-admin-borderLight dark:divide-slate-800 max-h-[620px] overflow-y-auto pr-1">
            {filteredCoupons.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                کد تخفیفی با این مشخصات یافت نشد.
              </div>
            ) : (
              filteredCoupons.map((c) => {
                const matchedCategory = c.categoryId ? categories.find((cat) => cat.id === c.categoryId) : null;
                const isExpired = c.expiresAt ? isCouponExpired(c.expiresAt) : false;
                const isPermanentCoupon = !c.expiresAt || c.expiresAt.trim() === "";

                // User-specific detection
                const isUserSpecific =
                  c.targetType === "USER" ||
                  (c.targetUserIds && c.targetUserIds.length > 0) ||
                  (c.targetUsers && c.targetUsers.length > 0) ||
                  Boolean(c.targetUserId);

                const usersCount =
                  c.targetUsers?.length ||
                  c.targetUserIds?.length ||
                  (c.targetUserId ? 1 : 0);

                return (
                  <div
                    key={c.id}
                    className="py-3.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Coupon Code Pill */}
                        <div className="flex items-center gap-1.5 font-mono font-black text-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-lg shadow-2xs">
                          <span>{c.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(c.code)}
                            className="text-slate-400 hover:text-teal-600 transition-colors cursor-pointer"
                            title="کپی کد"
                          >
                            {copiedCode === c.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Discount Percent */}
                        <span className="font-bold text-brand-dark dark:text-white">
                          %{c.discountPercent} تخفیف
                        </span>

                        {/* User-Specific Badge with Modal Trigger */}
                        {isUserSpecific ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCouponForModal(c);
                              setModalUserSearch("");
                            }}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/80 transition-colors shadow-2xs cursor-pointer"
                            title="مشاهده لیست کاربران این کد"
                          >
                            <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            <span>
                              کاربران مجاز ({usersCount} نفر)
                            </span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-2xs">
                            عمومی (همه)
                          </span>
                        )}

                        {/* Active / Expired Badge */}
                        {isExpired ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            منقضی‌شده
                          </span>
                        ) : c.isActive ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            فعال
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-slate-800 text-neutral-500 dark:text-slate-400 border border-neutral-200 dark:border-slate-700">
                            غیرفعال
                          </span>
                        )}

                        {/* Category Badge */}
                        {matchedCategory && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1 shadow-2xs">
                            <Layers className="w-3 h-3" />
                            <span>{matchedCategory.title}</span>
                          </span>
                        )}
                      </div>

                      {/* Detail Metrics */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-admin-textMuted dark:text-slate-400 font-mono">
                        <span>سقف: {formatNumber(c.maxDiscountToman)} ت</span>
                        <span>•</span>
                        <span>حداقل سفارش: {formatPrice(c.minOrderToman)} ت</span>
                        <span>•</span>
                        {isPermanentCoupon ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-sans font-bold flex items-center gap-1">
                            <InfinityIcon className="w-3.5 h-3.5" />
                            دائمی (بدون انقضا)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            انقضا: {c.expiresAt}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions and Usage */}
                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                      <div className="text-left text-[11px]">
                        <span className="font-mono font-bold text-brand-dark dark:text-white block">
                          {formatNumber(c.usageCount)} / {formatNumber(c.maxUsage)}
                        </span>
                        <span className="text-[10px] text-neutral-400 dark:text-slate-500">بار استفاده</span>
                      </div>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(c)}
                        className={`p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                          editingCoupon?.id === c.id
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500 shadow-2xs"
                            : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                        }`}
                        title="ویرایش کد تخفیف"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCoupon(c.id)}
                        className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs border transition-all duration-150 active:scale-95 shadow-2xs cursor-pointer ${
                          c.isActive
                            ? "border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            : "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        }`}
                      >
                        {c.isActive ? "غیرفعال" : "فعال‌سازی"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`آیا از حذف کد تخفیف "${c.code}" اطمینان دارید؟`)) {
                            deleteCoupon(c.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="حذف کد تخفیف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ===================== POPUP MODAL: USERS LIST FOR COUPON ===================== */}
      {selectedCouponForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>کاربران مجاز برای کد:</span>
                    <span className="font-mono font-black text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800">
                      {selectedCouponForModal.code}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    تخفیف %{selectedCouponForModal.discountPercent} • سقف {formatNumber(selectedCouponForModal.maxDiscountToman)} تومان •{" "}
                    {!selectedCouponForModal.expiresAt ? "دائمی" : `انقضا: ${selectedCouponForModal.expiresAt}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCouponForModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="جستجوی کاربر در لیست این کد تخفیف..."
                value={modalUserSearch}
                onChange={(e) => setModalUserSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pr-9 pl-3 text-xs outline-none focus:border-purple-500"
              />
            </div>

            {/* Users List Container */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 space-y-1 bg-slate-50/50 dark:bg-slate-900/50">
              {modalUsersList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  کاربری در لیست یافت نشد.
                </div>
              ) : (
                modalUsersList.map((targetUser, idx) => (
                  <div
                    key={targetUser.id || idx}
                    className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-xs shrink-0">
                        {targetUser.name ? targetUser.name.charAt(0) : "U"}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{targetUser.name || "کاربر بدون نام"}</span>
                          {targetUser.role === "SUPER_ADMIN" && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.2 rounded font-mono">
                              مدیر
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-0.5">
                          {targetUser.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {targetUser.phone}
                            </span>
                          )}
                          {targetUser.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {targetUser.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full shrink-0">
                      مجاز به استفاده
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500">
                مجموع: <b className="text-slate-800 dark:text-slate-200">{modalUsersList.length}</b> کاربر مجاز
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResendFromModal}
                  disabled={isResendingNotification}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/20 disabled:opacity-50"
                >
                  {isResendingNotification ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>ارسال مجدد پیامک و ایمیل</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCouponForModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
