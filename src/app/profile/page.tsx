"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import AmbientGlow from "@/components/ui/AmbientGlow";
import { useAuth, BankCardItem, AddressItem } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import {
  User,
  Shield,
  ShieldCheck,
  CreditCard,
  MapPin,
  PackageCheck,
  Wallet,
  Sparkles,
  Camera,
  Edit3,
  CheckCircle2,
  Copy,
  Plus,
  Trash2,
  Lock,
  Smartphone,
  Laptop,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ArrowRight,
  Gift,
  Key,
  BadgeCheck,
  AlertCircle,
  Clock,
  LogOut,
  Sliders,
  Undo2,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Users,
} from "lucide-react";
import { Order } from "@/types";
import { CustomerRefundModal } from "@/components/store/CustomerRefundModal";
import { api } from "@/lib/api";
import { validateIranianCardNumber, validateIranianSheba, formatCardNumber, formatSheba } from "@/lib/iranian-banks";
import CardPaymentModal from "@/components/payment/CardPaymentModal";

type ProfileTab = "personal" | "wallet" | "referrals" | "cards" | "addresses" | "orders" | "password";

export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    openLoginModal,
    updateProfile,
    updatePassword,
    refreshUser,
    topUpWallet,
    requestWithdrawal,
    bindReferral,
    logout,
  } = useAuth();
  const { orders } = useStore();

  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [refundModalOrder, setRefundModalOrder] = useState<Order | null>(null);

  // Edit Personal Details State
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    name: "",
    email: "",
    nationalCode: "",
    birthDate: "",
    jobTitle: "",
  });

  // Inviter Binding State
  const [inviterInput, setInviterInput] = useState("");
  const [isBindingInviter, setIsBindingInviter] = useState(false);

  // Top Up Wallet Modal State
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(250000);
  const [topUpMethod, setTopUpMethod] = useState<"cartbecart" | "direct">("cartbecart");
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [isCardPaymentModalOpen, setIsCardPaymentModalOpen] = useState(false);

  // Withdrawal Request Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amountToman: "",
    cardNumber: "",
    sheba: "",
    accountOwnerName: "",
    userNote: "",
  });
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);

  // Referral Network State
  const [referralNetwork, setReferralNetwork] = useState<{
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
  } | null>(null);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);
  const [referralSearch, setReferralSearch] = useState("");

  const fetchReferralNetwork = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingReferrals(true);
    try {
      const res = await api.getUserReferrals(user.id);
      if (res) {
        setReferralNetwork(res);
      }
    } catch (err) {
      console.error("Failed to load referral network:", err);
    } finally {
      setIsLoadingReferrals(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === "referrals" && user?.id) {
      fetchReferralNetwork();
    }
  }, [activeTab, user?.id, fetchReferralNetwork]);

  // Add Bank Card Modal State
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [cardForm, setCardForm] = useState({
    bankName: "بانک سامان",
    cardNumber: "",
    sheba: "",
    ownerName: "",
  });

  // Add Address Modal State
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    title: "منزل",
    receiverName: "",
    receiverPhone: "",
    province: "تهران",
    city: "تهران",
    fullAddress: "",
    postalCode: "",
  });

  // Password Management state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Sync user data to local forms
  useEffect(() => {
    if (user) {
      setPersonalForm({
        name: user.name || "",
        email: user.email || "",
        nationalCode: user.nationalCode || "0019284756",
        birthDate: user.birthDate || "1372/06/15",
        jobTitle: user.jobTitle || "توسعه‌دهنده نرم‌افزار / فریلنسر",
      });
    }
  }, [user]);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, label: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(label);
      showToast("success", `${label} با موفقیت کپی شد!`);
      setTimeout(() => setCopiedText(null), 2500);
    }
  };

  // Parse Bank Cards from JSON or default list
  const getBankCards = (): BankCardItem[] => {
    if (user?.bankCardsJson) {
      try {
        const parsed = JSON.parse(user.bankCardsJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [
      {
        id: "card-1",
        bankName: "بانک سامان",
        cardNumber: "6219 8610 9412 8841",
        sheba: "IR820560086180001234567001",
        ownerName: user?.name || "علیرضا تهرانی",
        isDefault: true,
      },
      {
        id: "card-2",
        bankName: "بلو بانک (سامان)",
        cardNumber: "5022 2910 7481 3320",
        sheba: "IR540560000000009876543001",
        ownerName: user?.name || "علیرضا تهرانی",
        isDefault: false,
      },
      {
        id: "card-3",
        bankName: "بانک ملت",
        cardNumber: "6104 3378 1904 5519",
        sheba: "IR120120000000004561237001",
        ownerName: user?.name || "علیرضا تهرانی",
        isDefault: false,
      },
    ];
  };

  // Parse Addresses from JSON or default list
  const getAddresses = (): AddressItem[] => {
    if (user?.addressesJson) {
      try {
        const parsed = JSON.parse(user.addressesJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [
      {
        id: "addr-1",
        title: "دفتر کار و شرکت",
        receiverName: user?.name || "علیرضا تهرانی",
        receiverPhone: user?.phone || "09181111111",
        province: "تهران",
        city: "تهران",
        fullAddress: "بلوار نلسون ماندلا (جردن)، خیابان گل‌آذین، پلاک 24، طبقه 6، واحد 18",
        postalCode: "1917714852",
        isDefault: true,
      },
      {
        id: "addr-2",
        title: "منزل مسکونی",
        receiverName: user?.name || "علیرضا تهرانی",
        receiverPhone: user?.phone || "09181111111",
        province: "تهران",
        city: "تهران",
        fullAddress: "سعادت‌آباد، خیابان علامه طباطبایی شمالی، نبش کوچه هجدهم، پلاک 5",
        postalCode: "1997854120",
        isDefault: false,
      },
    ];
  };

  const [bankCards, setBankCards] = useState<BankCardItem[]>(getBankCards());
  const [addresses, setAddresses] = useState<AddressItem[]>(getAddresses());

  // Save Personal Form
  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPersonal(true);
    try {
      await updateProfile({
        name: personalForm.name.trim(),
        email: personalForm.email.trim() || undefined,
        nationalCode: personalForm.nationalCode.trim(),
        birthDate: personalForm.birthDate.trim(),
        jobTitle: personalForm.jobTitle.trim(),
      });
      setIsEditingPersonal(false);
      showToast("success", "اطلاعات هویتی با موفقیت ذخیره و به‌روزرسانی شد.");
    } catch (err: any) {
      showToast("error", err?.message || "خطا در ذخیره اطلاعات.");
    } finally {
      setIsSavingPersonal(false);
    }
  };

  // Bind Inviter Referral Code
  const handleBindInviter = async () => {
    if (!inviterInput.trim()) return;
    setIsBindingInviter(true);
    const res = await bindReferral(inviterInput.trim());
    setIsBindingInviter(false);
    if (res.success) {
      showToast("success", res.message);
      setInviterInput("");
    } else {
      showToast("error", res.message);
    }
  };

  // Handle Add Bank Card
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardForm.cardNumber || !cardForm.sheba) {
      showToast("error", "لطفاً شماره کارت و شماره شبا را وارد کنید.");
      return;
    }
    const newCard: BankCardItem = {
      id: `card-${Date.now()}`,
      bankName: cardForm.bankName,
      cardNumber: cardForm.cardNumber,
      sheba: cardForm.sheba.toUpperCase().startsWith("IR") ? cardForm.sheba.toUpperCase() : `IR${cardForm.sheba.toUpperCase()}`,
      ownerName: cardForm.ownerName.trim() || (user?.name || "مالک کارت"),
      isDefault: bankCards.length === 0,
    };
    const updated = [newCard, ...bankCards];
    setBankCards(updated);
    await updateProfile({ bankCardsJson: JSON.stringify(updated) });
    setIsAddCardOpen(false);
    setCardForm({ bankName: "بانک سامان", cardNumber: "", sheba: "", ownerName: "" });
    showToast("success", "کارت بانکی جدید با موفقیت اضافه شد.");
  };

  const handleSetDefaultCard = async (cardId: string) => {
    const updated = bankCards.map((c) => ({ ...c, isDefault: c.id === cardId }));
    setBankCards(updated);
    await updateProfile({ bankCardsJson: JSON.stringify(updated) });
    showToast("success", "کارت پیش‌فرض عودت وجه تغییر یافت.");
  };

  const handleDeleteCard = async (cardId: string) => {
    const updated = bankCards.filter((c) => c.id !== cardId);
    setBankCards(updated);
    await updateProfile({ bankCardsJson: JSON.stringify(updated) });
    showToast("success", "کارت بانکی با موفقیت حذف گردید.");
  };

  // Handle Add Address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.fullAddress) {
      showToast("error", "لطفاً نشانی کامل پستی را وارد کنید.");
      return;
    }
    const newAddress: AddressItem = {
      id: `addr-${Date.now()}`,
      title: addressForm.title,
      receiverName: addressForm.receiverName || (user?.name || "گیرنده"),
      receiverPhone: addressForm.receiverPhone || (user?.phone || ""),
      province: addressForm.province,
      city: addressForm.city,
      fullAddress: addressForm.fullAddress,
      postalCode: addressForm.postalCode || "1987654321",
      isDefault: addresses.length === 0,
    };
    const updated = [newAddress, ...addresses];
    setAddresses(updated);
    await updateProfile({ addressesJson: JSON.stringify(updated) });
    setIsAddAddressOpen(false);
    setAddressForm({
      title: "منزل",
      receiverName: "",
      receiverPhone: "",
      province: "تهران",
      city: "تهران",
      fullAddress: "",
      postalCode: "",
    });
    showToast("success", "آدرس پستی جدید ثبت شد.");
  };

  const handleDeleteAddress = async (addressId: string) => {
    const updated = addresses.filter((a) => a.id !== addressId);
    setAddresses(updated);
    await updateProfile({ addressesJson: JSON.stringify(updated) });
    showToast("success", "آدرس پستی حذف شد.");
  };

  // Handle Top Up Wallet
  const handleExecuteTopUp = async () => {
    if (topUpMethod === "cartbecart") {
      setIsTopUpOpen(false);
      setIsCardPaymentModalOpen(true);
      return;
    }

    setIsTopUpLoading(true);
    try {
      const res = await topUpWallet(topUpAmount);
      setIsTopUpOpen(false);
      showToast("success", `کیف پول با مبلغ ${new Intl.NumberFormat("en-US").format(topUpAmount)} تومان با موفقیت شارژ گردید!`);
    } catch (err: any) {
      showToast("error", err?.message || "خطا در شارژ کیف پول.");
    } finally {
      setIsTopUpLoading(false);
    }
  };

  // Fetch user withdrawals
  const fetchWithdrawals = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingWithdrawals(true);
    try {
      const list = await api.getUserWithdrawals(user.id);
      if (Array.isArray(list)) {
        setWithdrawals(list);
      }
    } catch (err) {
      console.error("Failed to load withdrawals:", err);
    } finally {
      setIsLoadingWithdrawals(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchWithdrawals();
    }
  }, [user?.id, fetchWithdrawals]);

  const hasPendingWithdrawal = withdrawals.some((w) => w.status === "PENDING");
  const pendingWithdrawal = withdrawals.find((w) => w.status === "PENDING");

  // Real-time validations for withdraw modal
  const cardValidation = withdrawForm.cardNumber.trim() ? validateIranianCardNumber(withdrawForm.cardNumber) : null;
  const shebaValidation = withdrawForm.sheba.trim() ? validateIranianSheba(withdrawForm.sheba) : null;

  // Handle Withdrawal Submit
  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawForm.amountToman);
    const directMax = user?.directDepositBalance ?? 0;

    if (isNaN(amount) || amount <= 0) {
      showToast("error", "لطفاً مبلغ معتبری جهت تسویه حساب وارد فرمایید.");
      return;
    }
    if (amount < 50000) {
      showToast("error", "حداقل مبلغ مجاز جهت تسویه حساب ۵۰,۰۰۰ تومان می‌باشد.");
      return;
    }
    if (amount > directMax) {
      showToast("error", `حداکثر مبلغ قابل برداشت شما ${new Intl.NumberFormat("en-US").format(directMax)} تومان است.`);
      return;
    }
    if (amount > 50000000) {
      showToast("error", "حداکثر سقف مجاز برای هر درخواست تسویه ۵۰,۰۰۰,۰۰۰ تومان می‌باشد.");
      return;
    }
    if (hasPendingWithdrawal) {
      showToast("error", "شما یک درخواست تسویه در حال بررسی دارید. تا زمان تعیین تکلیف آن امکان ثبت درخواست جدید نیست.");
      return;
    }
    if (!withdrawForm.sheba && !withdrawForm.cardNumber) {
      showToast("error", "لطفاً شماره شبا یا شماره کارت معتبر را جهت واریز وارد فرمایید.");
      return;
    }
    if (withdrawForm.sheba.trim()) {
      const sVal = validateIranianSheba(withdrawForm.sheba);
      if (!sVal.isValid) {
        showToast("error", sVal.error || "شماره شبا وارد شده نامعتبر است.");
        return;
      }
    }
    if (withdrawForm.cardNumber.trim()) {
      const cVal = validateIranianCardNumber(withdrawForm.cardNumber);
      if (!cVal.isValid) {
        showToast("error", cVal.error || "شماره کارت وارد شده نامعتبر است.");
        return;
      }
    }

    setIsSubmittingWithdraw(true);
    try {
      const res = await requestWithdrawal({
        amountToman: amount,
        cardNumber: withdrawForm.cardNumber.trim() || undefined,
        sheba: withdrawForm.sheba.trim() ? (withdrawForm.sheba.trim().toUpperCase().startsWith("IR") ? withdrawForm.sheba.trim().toUpperCase() : `IR${withdrawForm.sheba.trim().toUpperCase()}`) : undefined,
        accountOwnerName: withdrawForm.accountOwnerName.trim() || user?.name || undefined,
        userNote: withdrawForm.userNote.trim() || undefined,
      });
      showToast("success", res.message || "درخواست تسویه با موفقیت ثبت شد و مبلغ از کیف پول کسر گردید.");
      setIsWithdrawModalOpen(false);
      setWithdrawForm({
        amountToman: "",
        cardNumber: "",
        sheba: "",
        accountOwnerName: "",
        userNote: "",
      });
      fetchWithdrawals();
    } catch (err: any) {
      showToast("error", err?.message || "خطا در ثبت درخواست تسویه.");
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  // Handle Save Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.newPassword) {
      showToast("error", "رمز عبور جدید را وارد فرمایید.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast("error", "رمز عبور جدید باید حداقل دارای ۶ کاراکتر باشد.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("error", "تکرار رمز عبور جدید با رمز وارد شده مطابقت ندارد.");
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await updatePassword(
        passwordForm.newPassword,
        passwordForm.currentPassword || undefined
      );
      showToast("success", res.message || "رمز عبور با موفقیت ثبت و ذخیره شد.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      showToast("error", err?.message || "خطا در تنظیم رمز عبور.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Filter user orders
  const userOrders = orders.filter((o) => {
    if (!user) return false;
    const matchPhone = user.phone && o.customerPhone && o.customerPhone.includes(user.phone.slice(-8));
    const matchEmail = user.email && o.customerEmail && o.customerEmail.toLowerCase() === user.email.toLowerCase();
    return matchPhone || matchEmail;
  });

  // If not authenticated, show guest prompt
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4 pb-32 sm:pb-8">
          <div className="group relative overflow-hidden max-w-md w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-brand-border dark:border-slate-800 rounded-3xl p-8 text-center shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-400/40 dark:hover:border-teal-400/30 transition-all duration-300 space-y-6">
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-teal-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            <div className="w-16 h-16 bg-teal-50 dark:bg-teal-950/60 text-brand-primary dark:text-teal-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <User className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-black text-brand-dark dark:text-white">ورود به پروفایل کاربری</h1>
              <p className="text-xs text-neutral-500 dark:text-slate-400 leading-relaxed">
                جهت دسترسی به مشخصات، مدیریت کیف پول، مشاهده لایسنس‌ها و تنظیمات امنیتی، ابتدا وارد حساب کاربری خود شوید.
              </p>
            </div>

            <button
              onClick={openLoginModal}
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-3.5 px-6 rounded-2xl text-xs shadow-md hover:shadow-lg hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>ورود سریع با شماره همراه (OTP)</span>
            </button>

            <div className="pt-2 border-t border-neutral-100 dark:border-slate-800 text-[11px] text-neutral-400">
              ارزان اکانت • پشتیبانی ۲۴ ساعته و تحویل خودکار
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Visual card gradient helper
  const getCardGradient = (bank: string) => {
    if (bank.includes("سامان") || bank.includes("بلو")) {
      return "from-sky-700 via-blue-800 to-indigo-900 text-white";
    }
    if (bank.includes("ملت")) {
      return "from-rose-700 via-red-800 to-rose-950 text-white";
    }
    if (bank.includes("پاسارگاد")) {
      return "from-emerald-700 via-teal-800 to-slate-900 text-white";
    }
    return "from-slate-700 via-slate-800 to-slate-900 text-white";
  };

  const walletFormatted = new Intl.NumberFormat("en-US").format(user.walletBalanceToman || 0);
  const customerId = `CID-${user.id.slice(-5).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-[#faf8ff] dark:bg-[#0b131e] text-[#131b2e] dark:text-slate-100 flex flex-col justify-between font-sans relative overflow-hidden">
      <Header />
      <AmbientGlow variant="teal" className="-top-20 -right-20" />
      <AmbientGlow variant="amber" className="top-1/3 -left-32 opacity-20" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-20 space-y-8 relative z-10">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold transition-all animate-slideDown ${
              toastMessage.type === "success"
                ? "bg-emerald-600 text-white shadow-emerald-600/30"
                : "bg-rose-600 text-white shadow-rose-600/30"
            }`}
          >
            {toastMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* HERO BANNER: AMBIENT HORIZON GRADIENT & USER SUMMARY (Stitch Screen 1)   */}
        {/* ========================================================================= */}
        <section className="group relative rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-[#e2edf1] dark:border-slate-800 shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-400/30 transition-all duration-300 overflow-hidden">
          {/* Ambient Horizon Top Gradient */}
          <div className="h-28 sm:h-44 w-full bg-gradient-to-r from-[#004153] via-[#005a71] to-[#21667d] relative overflow-hidden">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#b9eaff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="absolute -top-12 -left-12 w-56 h-56 rounded-full bg-sky-400/20 blur-2xl"></div>
            <div className="absolute -bottom-8 right-16 w-44 h-44 rounded-full bg-teal-300/15 blur-xl"></div>
          </div>

          <div className="px-4 sm:px-8 pb-6 sm:pb-8 pt-0">
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-5 sm:gap-6 -mt-12 sm:-mt-20 relative z-10">
              {/* User Avatar & Identity Details */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3.5 sm:gap-5">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl bg-white dark:bg-slate-800 p-1 sm:p-1.5 bg-gradient-to-tr from-[#004153] to-[#81d1f0]">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-xl sm:rounded-2xl" />
                    ) : (
                      <div className="w-full h-full bg-teal-50 dark:bg-slate-800 flex items-center justify-center text-brand-primary dark:text-teal-400 font-black text-2xl sm:text-3xl rounded-xl sm:rounded-2xl">
                        {user.name ? user.name.slice(0, 1) : "ک"}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => showToast("success", "قابلیت انتخاب تصویر به‌زودی فعال می‌شود.")}
                    className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#005a71] text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                    title="تغییر عکس نمایه"
                  >
                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>

                <div className="flex flex-col space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                      {user.name || "کاربر گرامی"}
                    </h1>
                    {/* Platinum VIP Badge */}
                    <div className="flex items-center gap-1 bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800/80 text-brand-primary dark:text-teal-300 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold shadow-xs hover:scale-105 transition-transform duration-200 cursor-default">
                      <BadgeCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-primary dark:text-teal-400 shrink-0" />
                      <span>سطح پلاتینیوم (VIP)</span>
                    </div>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] sm:text-xs px-2 py-0.5 rounded-lg font-mono font-bold">
                      {customerId}
                    </span>
                  </div>

                  {/* Chips: Phone, Email, Location */}
                  <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1 font-mono text-left dir-ltr">
                      <Smartphone className="w-3 h-3 text-brand-primary dark:text-teal-400 shrink-0" />
                      <span>{user.phone}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                      <span className="truncate max-w-[180px] sm:max-w-none">{user.email || "ایمیل ثبت نشده"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-brand-primary dark:text-teal-400 shrink-0" />
                      <span>تهران، ایران</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Balances & Actions (Mobile-First Card) */}
              <div className="w-full lg:w-auto flex flex-col gap-2.5 mt-1 lg:mt-0">
                <div className="bg-teal-50/80 dark:bg-slate-800/90 border border-teal-100 dark:border-slate-700 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-primary/10 dark:bg-teal-400/10 text-brand-primary dark:text-teal-400 flex items-center justify-center shrink-0">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">موجودی کیف پول</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base sm:text-lg font-black font-mono text-brand-primary dark:text-teal-300">
                            {walletFormatted}
                          </span>
                          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">تومان</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setIsTopUpOpen(true)}
                        className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs hover:shadow-md hover:shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>شارژ</span>
                      </button>
                      <button
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs hover:shadow-md hover:shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>تسویه</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-teal-100/80 dark:border-slate-700/80 text-[10px] sm:text-[11px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                        برداشت: {new Intl.NumberFormat("en-US").format(user.directDepositBalance || 0)} ت
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-bold">
                        کش‌بک: {new Intl.NumberFormat("en-US").format(user.cashbackBonusBalance || 0)} ت
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab("personal");
                        setIsEditingPersonal(true);
                      }}
                      className="flex items-center gap-1 font-bold text-brand-primary dark:text-teal-400 hover:text-teal-600 dark:hover:text-teal-300 hover:scale-105 active:scale-95 transition-all duration-200 px-1 py-0.5 shrink-0 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>ویرایش نمایه</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* INTERACTIVE NAVIGATION TABS                                              */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 no-scrollbar scrollbar-none snap-x snap-mandatory">
          <button
            onClick={() => setActiveTab("personal")}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold transition-all duration-200 shrink-0 snap-start hover:scale-105 active:scale-95 cursor-pointer ${
              activeTab === "personal"
                ? "bg-gradient-to-r from-teal-700 to-[#005a71] text-white shadow-md shadow-teal-700/25"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-[#e2edf1] dark:border-slate-800"
            }`}
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="sm:hidden">اطلاعات فردی</span>
            <span className="hidden sm:inline">اطلاعات فردی و هویتی</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("wallet");
              fetchWithdrawals();
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold transition-all duration-200 shrink-0 snap-start hover:scale-105 active:scale-95 cursor-pointer ${
              activeTab === "wallet"
                ? "bg-gradient-to-r from-teal-700 to-[#005a71] text-white shadow-md shadow-teal-700/25"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-[#e2edf1] dark:border-slate-800"
            }`}
          >
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="sm:hidden">کیف پول</span>
            <span className="hidden sm:inline">کیف پول و تسویه حساب</span>
            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
              جدید
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("referrals");
              fetchReferralNetwork();
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold transition-all duration-200 shrink-0 snap-start hover:scale-105 active:scale-95 cursor-pointer ${
              activeTab === "referrals"
                ? "bg-gradient-to-r from-teal-700 to-[#005a71] text-white shadow-md shadow-teal-700/25"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-[#e2edf1] dark:border-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="sm:hidden">زیرمجموعه‌ها</span>
            <span className="hidden sm:inline">شبکه و زیرمجموعه‌ها</span>
            {referralNetwork && referralNetwork.stats.totalReferred > 0 ? (
              <span className="bg-teal-100 dark:bg-teal-950/80 text-brand-primary dark:text-teal-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                {referralNetwork.stats.totalReferred}
              </span>
            ) : (
              <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                ۱۰٪ سود
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("cards")}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold transition-all duration-200 shrink-0 snap-start hover:scale-105 active:scale-95 cursor-pointer ${
              activeTab === "cards"
                ? "bg-gradient-to-r from-teal-700 to-[#005a71] text-white shadow-md shadow-teal-700/25"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-[#e2edf1] dark:border-slate-800"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="sm:hidden">کارت‌های بانکی</span>
            <span className="hidden sm:inline">کارت‌ها و حساب‌های بانکی</span>
            <span className="bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {bankCards.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("addresses")}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold transition-all duration-200 shrink-0 snap-start hover:scale-105 active:scale-95 cursor-pointer ${
              activeTab === "addresses"
                ? "bg-gradient-to-r from-teal-700 to-[#005a71] text-white shadow-md shadow-teal-700/25"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-[#e2edf1] dark:border-slate-800"
            }`}
          >
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>آدرس‌ها</span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {addresses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold transition-all duration-200 shrink-0 snap-start hover:scale-105 active:scale-95 cursor-pointer ${
              activeTab === "orders"
                ? "bg-gradient-to-r from-teal-700 to-[#005a71] text-white shadow-md shadow-teal-700/25"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-[#e2edf1] dark:border-slate-800"
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="sm:hidden">سفارش‌ها</span>
            <span className="hidden sm:inline">سفارش‌ها و اشتراک‌ها</span>
            {userOrders.length > 0 && (
              <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                {userOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("password")}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold transition-all duration-200 shrink-0 snap-start hover:scale-105 active:scale-95 cursor-pointer ${
              activeTab === "password"
                ? "bg-gradient-to-r from-teal-700 to-[#005a71] text-white shadow-md shadow-teal-700/25"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-[#e2edf1] dark:border-slate-800"
            }`}
          >
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="sm:hidden">رمز عبور</span>
            <span className="hidden sm:inline">رمز عبور و امنیت ورود</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PERSONAL INFORMATION                                              */}
        {/* ========================================================================= */}
        {activeTab === "personal" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Personal Details Form / Grid */}
            <div className="group relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-[#e2edf1] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-400/40 dark:hover:border-teal-400/30 transition-all duration-300 space-y-6">
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-teal-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">مشخصات فردی و حساب</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">اطلاعات کاربری ثبت شده جهت صدور فاکتور رسمی و لایسنس</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingPersonal(!isEditingPersonal)}
                  className="flex items-center gap-1.5 text-xs font-bold text-brand-primary dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50 px-3.5 py-2 rounded-xl border border-teal-200 dark:border-teal-800 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingPersonal ? "انصراف از ویرایش" : "ویرایش مشخصات"}</span>
                </button>
              </div>

              <form onSubmit={handleSavePersonal} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                  {/* Name */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      نام و نام خانوادگی:
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingPersonal}
                      value={personalForm.name}
                      onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:opacity-75 text-slate-800 dark:text-slate-100 rounded-xl py-2.5 px-3.5 outline-none font-medium transition-all duration-200"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      شماره تلفن همراه (احراز شده):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        value={user.phone}
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl py-2.5 px-3.5 outline-none font-mono text-left dir-ltr cursor-not-allowed"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>تایید شده</span>
                      </span>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      آدرس پست الکترونیکی (ایمیل دریافت لایسنس):
                    </label>
                    <input
                      type="email"
                      disabled={!isEditingPersonal}
                      value={personalForm.email}
                      onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:opacity-75 text-slate-800 dark:text-slate-100 rounded-xl py-2.5 px-3.5 outline-none font-mono text-left dir-ltr transition-all duration-200"
                      placeholder="example@gmail.com"
                    />
                  </div>

                  {/* National Code */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      کد ملی هوشمند:
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingPersonal}
                      value={personalForm.nationalCode}
                      onChange={(e) => setPersonalForm({ ...personalForm, nationalCode: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 disabled:opacity-75 text-slate-800 dark:text-slate-100 rounded-xl py-2.5 px-3.5 outline-none font-mono text-left dir-ltr transition-colors"
                      placeholder="0012345678"
                    />
                  </div>

                  {/* Birth Date */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      تاریخ تولد (شمسی):
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingPersonal}
                      value={personalForm.birthDate}
                      onChange={(e) => setPersonalForm({ ...personalForm, birthDate: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 disabled:opacity-75 text-slate-800 dark:text-slate-100 rounded-xl py-2.5 px-3.5 outline-none font-mono text-left dir-ltr transition-colors"
                      placeholder="1370/01/01"
                    />
                  </div>

                  {/* Job Title / Role */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      شغل و حوزه فعالیت:
                    </label>
                    <input
                      type="text"
                      disabled={!isEditingPersonal}
                      value={personalForm.jobTitle}
                      onChange={(e) => setPersonalForm({ ...personalForm, jobTitle: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 disabled:opacity-75 text-slate-800 dark:text-slate-100 rounded-xl py-2.5 px-3.5 outline-none font-medium transition-colors"
                      placeholder="مهندس نرم‌افزار، طراح، مدیر مارکتینگ..."
                    />
                  </div>
                </div>

                {/* Referral Code & Network Hub */}
                <div className="space-y-3">
                  <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/50 dark:bg-slate-800/60 border border-teal-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-brand-primary dark:text-teal-400 flex items-center justify-center shrink-0">
                        <Gift className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">کد معرف اختصاصی شما (۱۰٪ سود نقدی خریدها):</span>
                          <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            فعال
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                          این کد را با دوستانتان به اشتراک بگذارید؛ با هر خرید موفق آن‌ها در سایت، ۱۰٪ مبلغ سفارش مستقیماً به عنوان کش‌بک نقدی به کیف پول شما واریز می‌شود.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                      <span className="bg-white dark:bg-slate-900 border border-teal-200 dark:border-slate-700 px-3.5 py-2 rounded-xl font-mono font-black text-brand-primary dark:text-teal-300 text-sm tracking-wider">
                        {user.referralCode || `ARZAN-${user.id.slice(-4).toUpperCase()}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(user.referralCode || `ARZAN-${user.id.slice(-4).toUpperCase()}`, "کد معرف اختصاصی")}
                        className="bg-brand-primary hover:bg-teal-700 text-white p-2.5 rounded-xl hover:scale-110 active:scale-90 transition-all duration-200 cursor-pointer"
                        title="کپی کد معرف"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("referrals");
                          fetchReferralNetwork();
                        }}
                        className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>مشاهده زیرمجموعه‌ها</span>
                      </button>
                    </div>
                  </div>

                  {/* Inviter Info (Readonly Badge if registered with inviter) */}
                  {user.referredByCode && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Users className="w-4 h-4 text-emerald-500" />
                        <span>معرف شما:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          {user.referredByCode}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full font-bold">
                        ثبت‌شده در شبکه دوستان
                      </span>
                    </div>
                  )}
                </div>

                {isEditingPersonal && (
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEditingPersonal(false)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingPersonal}
                      className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingPersonal ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>ذخیره تغییرات</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: WALLET, CASHBACK & SETTLEMENTS                                     */}
        {/* ========================================================================= */}
        {activeTab === "wallet" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Cards: 3-Way Wallet Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Total Purchasing Balance */}
              <div className="group relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-[#e2edf1] dark:border-slate-800 rounded-3xl p-6 shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:-translate-y-1.5 hover:border-teal-400/40 dark:hover:border-teal-400/30 transition-all duration-300 space-y-4">
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-teal-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-brand-primary dark:text-teal-400 flex items-center justify-center">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <span className="bg-teal-100 dark:bg-teal-950/80 text-brand-primary dark:text-teal-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    موجودی کل خرید
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">موجودی کل قابل استفاده</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                      {walletFormatted}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">تومان</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  قابل استفاده جهت ثبت آنی سفارش کلیه محصولات و اکانت‌های پریمیوم سایت بدون نیاز به درگاه بانکی.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTopUpOpen(true)}
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm hover:shadow-md hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزایش موجودی (شارژ حساب)</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Direct Cash Deposit (Withdrawable) */}
              <div className="group relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-emerald-200 dark:border-emerald-800/60 rounded-3xl p-6 shadow-card hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1.5 hover:border-emerald-400/50 transition-all duration-300 space-y-4">
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ArrowDownLeft className="w-6 h-6" />
                  </div>
                  <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    قابل برداشت نقدی
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">واریز مستقیم نقدی (قابل تسویه)</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {new Intl.NumberFormat("en-US").format(user.directDepositBalance || 0)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">تومان</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  مبالغی که مستقیماً توسط شما شارژ شده و در هر زمان امکان ثبت درخواست تسویه و واریز به شبا یا کارت بانکی را دارید.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsWithdrawModalOpen(true)}
                    disabled={(user.directDepositBalance || 0) <= 0}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm hover:shadow-md hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>ثبت درخواست تسویه و برداشت</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Cashback & Referral Bonus */}
              <div className="group relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-indigo-200 dark:border-indigo-800/60 rounded-3xl p-6 shadow-card hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1.5 hover:border-indigo-400/50 transition-all duration-300 space-y-4">
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Gift className="w-6 h-6" />
                  </div>
                  <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    هدیه کش‌بک خرید
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">بونوس کش‌بک و معرفی دوستان</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                      {new Intl.NumberFormat("en-US").format(user.cashbackBonusBalance || 0)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">تومان</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  هدیه نقدی کش‌بک حاصل از سفارشات و دعوت دوستان. این مبلغ صرفاً برای خرید محصولات سایت فعال بوده و غیرقابل برداشت است.
                </p>
                <div className="pt-2">
                  <Link
                    href="/products"
                    className="w-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 py-2.5 rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>خرید با موجودی هدیه</span>
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Rules & Transparency Notice */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1">
                <span className="font-bold">قوانین تفکیک کیف پول و تسویه حساب نقدی:</span>
                <p className="leading-relaxed opacity-90">
                  جهت شفافیت کامل مالی و ارائه بالاترین میزان هدایا، موجودی کیف پول به دو بخش تفکیک شده است:
                  <b> ۱. واریز مستقیم نقدی: </b> مبالغی که از کارت خود شارژ کرده‌اید و هر زمان بخواهید قابل تسویه به شماره شبای شماست.
                  <b> ۲. هدیه کش‌بک و معرف: </b> پاداش‌های درصدی سفارشات که به عنوان اعتبار خرید به شما هدیه داده می‌شود و منحصراً برای خرید اشتراک‌ها و اکانت‌ها در سایت قابل استفاده است.
                </p>
              </div>
            </div>

            {/* Withdrawal Requests History */}
            <div className="group relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-[#e2edf1] dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-400/30 transition-all duration-300 space-y-5 sm:space-y-6">
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-teal-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>درخواست‌های تسویه حساب و برداشت وجه</span>
                    {hasPendingWithdrawal && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3 h-3" />
                        <span>۱ درخواست در حال بررسی</span>
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    لیست کامل درخواست‌های واریز وجه به شماره شبا و پیگیری وضعیت تسویه با نظارت سیستم بانکی
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={fetchWithdrawals}
                    disabled={isLoadingWithdrawals}
                    className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-110 active:scale-90 transition-all duration-200 cursor-pointer"
                    title="به‌روزرسانی لیست"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingWithdrawals ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWithdrawModalOpen(true)}
                    disabled={(user.directDepositBalance || 0) < 50000 || hasPendingWithdrawal}
                    title={
                      hasPendingWithdrawal
                        ? "شما یک درخواست تسویه در حال بررسی دارید"
                        : (user.directDepositBalance || 0) < 50000
                        ? "حداقل موجودی قابل تسویه ۵۰,۰۰۰ تومان می‌باشد"
                        : "ثبت درخواست تسویه جدید"
                    }
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs hover:shadow-md hover:shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>درخواست تسویه جدید</span>
                  </button>
                </div>
              </div>

              {hasPendingWithdrawal && (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
                  <Clock className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div className="space-y-1">
                    <span className="font-bold">درخواست تسویه در صف بررسی واحد مالی:</span>
                    <p className="leading-relaxed opacity-90">
                      درخواست شما به مبلغ <b>{new Intl.NumberFormat("en-US").format(pendingWithdrawal?.amountToman || 0)} تومان</b> در حال پردازش می‌باشد. به دلیل الزامات سامانه تسویه بانکی، ثبت درخواست جدید پس از تعیین تکلیف این درخواست امکان‌پذیر خواهد بود.
                    </p>
                  </div>
                </div>
              )}

              {isLoadingWithdrawals ? (
                <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال دریافت اطلاعات درخواست‌ها...</span>
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-medium">تاکنون درخواست تسویه‌ای ثبت نکرده‌اید.</p>
                  <p className="text-[11px]">واریزی‌های مستقیم نقدی شما در هر زمان (حداقل ۵۰,۰۰۰ تومان) قابل ثبت جهت انتقال به حساب بانکی می‌باشند.</p>
                </div>
              ) : (
                <>
                  {/* Mobile Cards View (sm:hidden) */}
                  <div className="block md:hidden space-y-3">
                    {withdrawals.map((req) => {
                      const detectedBank = req.bankName || (req.sheba ? validateIranianSheba(req.sheba).bankName : (req.cardNumber ? validateIranianCardNumber(req.cardNumber).bankName : null));
                      return (
                        <div
                          key={req.id}
                          className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-[11px] text-slate-500 font-bold">
                              #{req.id.slice(-6).toUpperCase()}
                            </span>
                            <div>
                              {req.status === "PENDING" && (
                                <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <Clock className="w-3 h-3" />
                                  <span>در انتظار بررسی و واریز</span>
                                </span>
                              )}
                              {req.status === "APPROVED" && (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>واریز شد (موفق)</span>
                                </span>
                              )}
                              {req.status === "REJECTED" && (
                                <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <X className="w-3 h-3" />
                                  <span>رد شد (وجه عودت یافت)</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">مبلغ تسویه:</span>
                            <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                              {new Intl.NumberFormat("en-US").format(req.amountToman)} تومان
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-600 dark:text-slate-300 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                            {detectedBank && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">بانک مقصد:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                  <CreditCard className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                                  <span>{detectedBank}</span>
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">مقصد واریز:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-left dir-ltr font-medium text-[11px]">
                                  {req.sheba || req.cardNumber || "—"}
                                </span>
                                {(req.sheba || req.cardNumber) && (
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(req.sheba || req.cardNumber, "شماره شبا / کارت")}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    title="کپی شماره حساب"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            {req.accountOwnerName && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">صاحب حساب:</span>
                                <span className="font-medium">{req.accountOwnerName}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">تاریخ ثبت:</span>
                              <span>{new Date(req.createdAt).toLocaleDateString("fa-IR")}</span>
                            </div>
                          </div>

                          {/* Tracking & Notes */}
                          {req.bankTrackingCode && (
                            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300">
                              <span className="font-semibold">
                                کد پیگیری: <span className="font-mono font-bold">{req.bankTrackingCode}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(req.bankTrackingCode, "کد رهگیری")}
                                className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded text-emerald-700 dark:text-emerald-300"
                                title="کپی کد رهگیری"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {req.status === "REJECTED" && (
                            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-[11px] space-y-1">
                              <div className="text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>مبلغ به کیف پول و موجودی مستقیم شما عودت داده شد</span>
                              </div>
                              {req.adminNote && (
                                <p className="text-slate-600 dark:text-slate-300 text-[10px] leading-relaxed">
                                  علت رد: {req.adminNote}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table (hidden md:block) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold">
                          <th className="pb-3 pr-2">شناسه</th>
                          <th className="pb-3">مبلغ تسویه</th>
                          <th className="pb-3">بانک و حساب مقصد</th>
                          <th className="pb-3">تاریخ ثبت</th>
                          <th className="pb-3">وضعیت</th>
                          <th className="pb-3 pl-2">پیگیری / توضیحات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {withdrawals.map((req) => {
                          const detectedBank = req.bankName || (req.sheba ? validateIranianSheba(req.sheba).bankName : (req.cardNumber ? validateIranianCardNumber(req.cardNumber).bankName : null));
                          return (
                            <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="py-3.5 pr-2 font-mono text-[11px] text-slate-500">
                                #{req.id.slice(-6).toUpperCase()}
                              </td>
                              <td className="py-3.5 font-bold font-mono text-slate-900 dark:text-white">
                                {new Intl.NumberFormat("en-US").format(req.amountToman)} تومان
                              </td>
                              <td className="py-3.5 text-slate-700 dark:text-slate-300">
                                {detectedBank && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800/60 mb-1">
                                    <CreditCard className="w-3 h-3" />
                                    <span>{detectedBank}</span>
                                  </span>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono dir-ltr text-left text-[11px]">
                                    {req.sheba || req.cardNumber || "—"}
                                  </span>
                                  {(req.sheba || req.cardNumber) && (
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(req.sheba || req.cardNumber, "شماره حساب")}
                                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                                      title="کپی شماره حساب"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                {req.accountOwnerName && (
                                  <span className="text-[10px] text-slate-400 block">{req.accountOwnerName}</span>
                                )}
                              </td>
                              <td className="py-3.5 text-slate-500 text-[11px]">
                                {new Date(req.createdAt).toLocaleDateString("fa-IR")}
                              </td>
                              <td className="py-3.5">
                                {req.status === "PENDING" && (
                                  <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                    <Clock className="w-3 h-3" />
                                    <span>در انتظار بررسی</span>
                                  </span>
                                )}
                                {req.status === "APPROVED" && (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>واریز شد</span>
                                  </span>
                                )}
                                {req.status === "REJECTED" && (
                                  <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                    <X className="w-3 h-3" />
                                    <span>رد شد</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 pl-2">
                                {req.bankTrackingCode && (
                                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold font-mono text-[11px]">
                                    <span>کد پیگیری: {req.bankTrackingCode}</span>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(req.bankTrackingCode, "کد رهگیری")}
                                      className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded text-emerald-700 dark:text-emerald-400"
                                      title="کپی کد رهگیری"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                                {req.status === "REJECTED" && (
                                  <div className="text-[10px] text-rose-600 dark:text-rose-400 max-w-xs leading-relaxed">
                                    {req.adminNote ? req.adminNote : "درخواست رد و وجه به کیف پول عودت داده شد."}
                                  </div>
                                )}
                                {!req.bankTrackingCode && req.status !== "REJECTED" && (
                                  <span className="text-slate-400 text-[11px]">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB: REFERRAL NETWORK & SUB-ACCOUNTS DASHBOARD                            */}
        {/* ========================================================================= */}
        {activeTab === "referrals" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Hero Banner: Invitation Link & Code */}
            <div className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-[#004d61] to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-500/20">
              <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>طرح مشارکت و درآمدزایی اختصاصی ارزون‌حساب</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                      شبکه معرفین و زیرمجموعه‌ها
                    </h2>
                    <p className="text-xs sm:text-sm text-teal-100/80 max-w-2xl leading-relaxed">
                      با اشتراک‌گذاری کد یا لینک اختصاصی خود با دوستان و همکاران، با هر خرید موفق آن‌ها <span className="font-bold text-amber-300">۱۰٪ از مبلغ کل خرید</span> به عنوان کمیسیون نقدی به کیف پول شما واریز می‌شود. این سود مستقیماً قابل برداشت بانکی است.
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={fetchReferralNetwork}
                    disabled={isLoadingReferrals}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-xs border border-white/15 transition-all duration-200 cursor-pointer self-end md:self-auto shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReferrals ? "animate-spin" : ""}`} />
                    <span>بروزرسانی آمار</span>
                  </button>
                </div>

                {/* Referral Code & Share Link Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Card A: Referral Code */}
                  <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-teal-500/30 flex flex-col justify-between gap-3">
                    <div>
                      <span className="text-[11px] text-teal-200 block font-medium">کد معرف اختصاصی شما:</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">دوستان شما می‌توانند هنگام ثبت نام در بخش کد پیامکی این کد را وارد کنند.</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 bg-slate-950/80 border border-teal-500/40 rounded-xl p-2.5">
                      <span className="font-mono text-base sm:text-lg font-black tracking-wider text-teal-300 px-2">
                        {user.referralCode || `ARZAN-${user.id.slice(-4).toUpperCase()}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(user.referralCode || `ARZAN-${user.id.slice(-4).toUpperCase()}`, "کد معرف")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>کپی کد</span>
                      </button>
                    </div>
                  </div>

                  {/* Card B: Direct Share Link */}
                  <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-teal-500/30 flex flex-col justify-between gap-3">
                    <div>
                      <span className="text-[11px] text-teal-200 block font-medium">لینک دعوت مستقیم:</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">با کلیک روی این لینک، کد معرف به صورت هوشمند برای ثبت نام کاربر اعمال می‌شود.</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 bg-slate-950/80 border border-teal-500/40 rounded-xl p-2.5">
                      <span className="font-mono text-xs text-slate-300 truncate dir-ltr text-left px-2 select-all">
                        {typeof window !== "undefined" ? `${window.location.origin}/login?ref=${user.referralCode || `ARZAN-${user.id.slice(-4).toUpperCase()}`}` : `https://arzanaccount.com/login?ref=${user.referralCode || `ARZAN-${user.id.slice(-4).toUpperCase()}`}`}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const link = typeof window !== "undefined" ? `${window.location.origin}/login?ref=${user.referralCode || `ARZAN-${user.id.slice(-4).toUpperCase()}`}` : `https://arzanaccount.com/login?ref=${user.referralCode || `ARZAN-${user.id.slice(-4).toUpperCase()}`}`;
                            copyToClipboard(link, "لینک دعوت");
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>کپی لینک</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Metric Bento Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {/* Card 1: Total Referred */}
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-[#e2edf1] dark:border-slate-800 rounded-3xl p-5 shadow-card hover:shadow-lg transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-brand-primary dark:text-teal-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-brand-primary dark:text-teal-300">
                    کل شبکه
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">کل دوستان دعوت‌شده</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                      {referralNetwork?.stats ? new Intl.NumberFormat("fa-IR").format(referralNetwork.stats.totalReferred) : "۰"}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">نفر</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Active Buyers */}
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-[#e2edf1] dark:border-slate-800 rounded-3xl p-5 shadow-card hover:shadow-lg transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">
                    فعال
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">خریداران فعال</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                      {referralNetwork?.stats ? new Intl.NumberFormat("fa-IR").format(referralNetwork.stats.activeBuyers) : "۰"}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">نفر</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Total Orders */}
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-[#e2edf1] dark:border-slate-800 rounded-3xl p-5 shadow-card hover:shadow-lg transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                    سفارش‌ها
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">تعداد خرید‌های شبکه</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                      {referralNetwork?.stats ? new Intl.NumberFormat("fa-IR").format(referralNetwork.stats.totalOrdersCount) : "۰"}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">خرید</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Total Earned Toman */}
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-emerald-200 dark:border-emerald-800/60 rounded-3xl p-5 shadow-card hover:shadow-lg transition-all space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                    کمیسیون نقدی
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">مجموع درآمد شما</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {referralNetwork?.stats ? new Intl.NumberFormat("fa-IR").format(referralNetwork.stats.totalEarnedToman) : "۰"}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">تومان</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Referrals Detailed List / Table */}
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-[#e2edf1] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-primary dark:text-teal-400" />
                    <span>لیست زیرمجموعه‌ها و محاسبه سود هر کاربر</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    جزئیات ثبت‌نام و درآمد اختصاصی تعلق گرفته به شما از خرید هر یک از افراد دعوت‌شده
                  </p>
                </div>

                {/* Search in referrals */}
                {referralNetwork && referralNetwork.referrals.length > 0 && (
                  <div className="w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="جستجو در زیرمجموعه‌ها..."
                      value={referralSearch}
                      onChange={(e) => setReferralSearch(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-teal-500"
                    />
                  </div>
                )}
              </div>

              {isLoadingReferrals ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">در حال بارگذاری لیست زیرمجموعه‌ها و محاسبه کمیسیون‌ها...</p>
                </div>
              ) : !referralNetwork || referralNetwork.referrals.length === 0 ? (
                /* Empty state */
                <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950/60 text-brand-primary dark:text-teal-400 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-800/50">
                    <Users className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">هنوز زیرمجموعه‌ای ثبت نشده است</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      لینک اختصاصی خود را در گروه‌ها، کانال‌ها یا برای دوستانتان ارسال کنید. با اولین خرید هر فرد، ۱۰٪ سود مستقیماً به حساب شما اضافه می‌شود.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const link = typeof window !== "undefined" ? `${window.location.origin}/login?ref=${user.referralCode || `ARZAN-${user.id.slice(-4).toUpperCase()}`}` : `https://arzanaccount.com/login?ref=${user.referralCode || `ARZAN-${user.id.slice(-4).toUpperCase()}`}`;
                      copyToClipboard(link, "لینک اختصاصی دعوت");
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>کپی لینک دعوت دوستان</span>
                  </button>
                </div>
              ) : (
                /* Referrals Table */
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold">
                        <th className="pb-3 pr-2">کاربر زیرمجموعه</th>
                        <th className="pb-3 px-3">شماره تماس / ایمیل</th>
                        <th className="pb-3 px-3">تاریخ پیوستن</th>
                        <th className="pb-3 px-3 text-center">تعداد خرید</th>
                        <th className="pb-3 px-3 text-left">مجموع خرید کاربر</th>
                        <th className="pb-3 pl-2 text-left">درآمد شما (۱۰٪ سود)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {referralNetwork.referrals
                        .filter((ref) => {
                          if (!referralSearch.trim()) return true;
                          const q = referralSearch.trim().toLowerCase();
                          return (
                            ref.name.toLowerCase().includes(q) ||
                            ref.phoneMasked.toLowerCase().includes(q) ||
                            ref.emailMasked.toLowerCase().includes(q)
                          );
                        })
                        .map((ref) => (
                          <tr key={ref.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-4 pr-2 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-brand-primary dark:text-teal-400 flex items-center justify-center font-black text-xs shrink-0">
                                {ref.name.slice(0, 1) || "ک"}
                              </div>
                              <span>{ref.name}</span>
                            </td>
                            <td className="py-4 px-3 font-mono text-slate-600 dark:text-slate-300 dir-ltr text-right">
                              <div>{ref.phoneMasked}</div>
                              {ref.emailMasked !== "بدون ایمیل" && (
                                <div className="text-[10px] text-slate-400">{ref.emailMasked}</div>
                              )}
                            </td>
                            <td className="py-4 px-3 text-slate-500 dark:text-slate-400">
                              {new Date(ref.joinedAt).toLocaleDateString("fa-IR")}
                            </td>
                            <td className="py-4 px-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                                ref.ordersCount > 0
                                  ? "bg-teal-100 dark:bg-teal-950/80 text-brand-primary dark:text-teal-300"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                              }`}>
                                {ref.ordersCount} سفارش
                              </span>
                            </td>
                            <td className="py-4 px-3 text-left font-mono font-bold text-slate-800 dark:text-slate-200">
                              {new Intl.NumberFormat("fa-IR").format(ref.totalSpentToman)} تومان
                            </td>
                            <td className="py-4 pl-2 text-left">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-mono font-bold ${
                                ref.earnedFromUserToman > 0
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                              }`}>
                                {ref.earnedFromUserToman > 0 ? "+" : ""}
                                {new Intl.NumberFormat("fa-IR").format(ref.earnedFromUserToman)} تومان
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: BANK CARDS & SHEBA (Stitch Screen 1 & Screen 2)                    */}
        {/* ========================================================================= */}
        {activeTab === "cards" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">کارت‌ها و حساب‌های بانکی شتاب</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  حساب‌های متصل جهت عودت وجه تضمین بازگشت وجه، شارژ کیف پول و تسویه خودکار
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCardOpen(true)}
                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن کارت بانکی جدید</span>
              </button>
            </div>

            {/* Visual Bank Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {bankCards.map((card) => (
                <div
                  key={card.id}
                  className={`relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg bg-gradient-to-br ${getCardGradient(card.bankName)} flex flex-col justify-between min-h-[13.5rem] sm:h-56 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-900/30 transition-all duration-300`}
                >
                  {/* Top Bar: Bank Logo & Default Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white/80 shrink-0" />
                      <span className="font-bold text-xs sm:text-sm tracking-tight truncate">{card.bankName}</span>
                    </div>
                    {card.isDefault ? (
                      <span className="bg-white/20 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 sm:px-2.5 rounded-full border border-white/30 shrink-0">
                        پیش‌فرض عودت وجه
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefaultCard(card.id)}
                        className="text-[9px] sm:text-[10px] text-white/70 hover:text-white bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded-full transition-colors shrink-0"
                      >
                        انتخاب به عنوان پیش‌فرض
                      </button>
                    )}
                  </div>

                  {/* EMV Chip & Card Number */}
                  <div className="space-y-2.5 sm:space-y-3 my-auto py-2">
                    <div className="w-9 h-6 sm:w-10 sm:h-7 rounded-md bg-amber-300/80 border border-amber-400/90 flex items-center justify-center">
                      <div className="w-5 h-3.5 sm:w-6 sm:h-4 border border-amber-500/50 rounded-xs"></div>
                    </div>
                    <div
                      onClick={() => copyToClipboard(card.cardNumber.replace(/\s/g, ""), "شماره کارت")}
                      className="text-sm sm:text-lg font-mono font-bold tracking-wider sm:tracking-widest text-left dir-ltr cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-between sm:justify-start gap-2"
                      title="کلیک جهت کپی"
                    >
                      <span className="truncate">{card.cardNumber}</span>
                      <Copy className="w-3.5 h-3.5 opacity-60 shrink-0" />
                    </div>
                  </div>

                  {/* Bottom: Sheba & Owner */}
                  <div className="flex items-end justify-between text-xs pt-2 border-t border-white/15 gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] sm:text-[10px] text-white/70">دارنده حساب:</div>
                      <div className="font-bold truncate text-[11px] sm:text-xs">{card.ownerName}</div>
                    </div>
                    <div className="text-left dir-ltr shrink-0">
                      <div className="text-[9px] text-white/70 font-sans">شماره شبا:</div>
                      <div
                        onClick={() => copyToClipboard(card.sheba, "شماره شبا")}
                        className="font-mono text-[10px] sm:text-[11px] font-bold cursor-pointer hover:opacity-80"
                        title="کلیک جهت کپی شبا"
                      >
                        {card.sheba.slice(0, 10)}...{card.sheba.slice(-4)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="text-white/60 hover:text-rose-300 transition-colors p-1 shrink-0"
                      title="حذف کارت"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ADDRESSES BOOK                                                     */}
        {/* ========================================================================= */}
        {activeTab === "addresses" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">دفترچه آدرس‌ها و انبارهای منتخب</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  جهت دریافت محموله‌های فیزیکی، گیفت کارت‌های فیزیکی و صدور فاکتور رسمی
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAddressOpen(true)}
                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت آدرس جدید</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="group relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-[#e2edf1] dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-1 hover:border-teal-400/40 dark:hover:border-teal-400/30 transition-all duration-300 space-y-3.5 sm:space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-primary dark:text-teal-400 shrink-0" />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{addr.title}</span>
                      {addr.isDefault && (
                        <span className="bg-teal-100 dark:bg-teal-950 text-brand-primary dark:text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          پیش‌فرض
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      title="حذف آدرس"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {addr.province}، {addr.city}، {addr.fullAddress}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
                    <div>
                      <span className="block text-[11px] text-slate-400 dark:text-slate-500">تحویل‌گیرنده:</span>
                      <strong className="text-slate-800 dark:text-slate-200 truncate block">{addr.receiverName}</strong>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 dark:text-slate-500">شماره تماس:</span>
                      <span className="font-mono text-left dir-ltr font-bold text-slate-800 dark:text-slate-200 block">
                        {addr.receiverPhone}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-400 dark:text-slate-500">کد پستی:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 block">{addr.postalCode}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ORDERS & SUBSCRIPTIONS (Stitch Screen 1 & StoreContext)            */}
        {/* ========================================================================= */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">سفارش‌ها و اشتراک‌های قانونی شما</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  مشاهده لایسنس‌ها، اعتبار باقی‌مانده و دسترسی به اطلاعات اکانت‌های خریداری شده
                </p>
              </div>
              <Link
                href="/orders"
                className="text-xs font-bold text-brand-primary dark:text-teal-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>مشاهده تاریخچه کامل سفارشات در صفحه اختصاصی</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>

            {userOrders.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-[#e2edf1] dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                  <PackageCheck className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">تاکنون سفارشی ثبت نکرده‌اید</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    با خرید اکانت‌های پرمیوم تلگرام، هوش مصنوعی، اسپاتیفای و یوتیوب، لایسنس‌های شما در اینجا قرار می‌گیرند.
                  </p>
                </div>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-[#005a71] hover:bg-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  <span>مشاهده کاتالوگ محصولات</span>
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.map((order) => (
                  <div
                    key={order.id}
                    className="group relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-[#e2edf1] dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-1 hover:border-teal-400/40 dark:hover:border-teal-400/30 transition-all duration-300 space-y-3.5 sm:space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold text-xs px-2.5 py-1 rounded-xl">
                          #{order.orderNumber}
                        </span>
                        <span className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          order.status === "delivered"
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                            : order.status === "processing"
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                            : order.status === "refund_requested"
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                            : order.status === "refunded"
                            ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700"
                            : "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300"
                        }`}>
                          {order.status === "delivered"
                            ? "تحویل شده و فعال"
                            : order.status === "processing"
                            ? "در حال پردازش / آماده‌سازی"
                            : order.status === "refund_requested"
                            ? "درخواست عودت داده شده (در دست بررسی)"
                            : order.status === "refunded"
                            ? "مسترد شده"
                            : "ناموفق"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          مبلغ: <strong className="text-brand-primary dark:text-teal-300 font-bold">{new Intl.NumberFormat("en-US").format(order.totalPriceToman)}</strong> تومان
                        </div>
                        {(order.status === "delivered" || order.status === "processing") && (
                          <button
                            type="button"
                            onClick={() => setRefundModalOrder(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-[11px] font-bold hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 cursor-pointer"
                          >
                            <Undo2 className="w-3 h-3" />
                            <span>درخواست عودت وجه</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {order.refundRejectionReason && (
                      <div className="text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-2.5 text-rose-700 dark:text-rose-300">
                        <span className="font-bold">عدم موافقت با عودت وجه: </span>
                        <span>{order.refundRejectionReason}</span>
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {it.productTitle} ({it.quantity} عدد)
                          </span>
                          <span className="font-mono text-slate-600 dark:text-slate-400">
                            {new Intl.NumberFormat("en-US").format(it.priceToman)} تومان
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Delivered Credentials */}
                    {order.deliveredAccounts && order.deliveredAccounts.length > 0 && (
                      <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-teal-50/70 dark:bg-slate-800/80 border border-teal-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-brand-primary dark:text-teal-300">
                          <span className="flex items-center gap-1.5">
                            <Key className="w-4 h-4 shrink-0" />
                            <span>لایسنس و اطلاعات دسترسی تحویل‌شده:</span>
                          </span>
                        </div>
                        {order.deliveredAccounts.map((acc, i) => (
                          <div
                            key={i}
                            className="bg-white dark:bg-slate-900 border border-teal-100 dark:border-slate-800 rounded-xl p-2 sm:p-2.5 font-mono text-xs text-slate-800 dark:text-slate-200 text-left dir-ltr flex items-center justify-between gap-2"
                          >
                            <span className="break-all select-all">{acc}</span>
                            <button
                              onClick={() => copyToClipboard(acc, "لایسنس")}
                              className="text-slate-400 hover:text-brand-primary dark:hover:text-teal-400 transition-colors p-1 shrink-0"
                              title="کپی مشخصات"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: PASSWORD MANAGEMENT (تنظیم و تغییر رمز عبور)                        */}
        {/* ========================================================================= */}
        {activeTab === "password" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Password Form Card */}
            <div className="group relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-[#e2edf1] dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-card hover:shadow-xl hover:shadow-teal-500/5 hover:border-teal-400/30 transition-all duration-300 space-y-5 sm:space-y-6">
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-teal-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-500 pointer-events-none" />
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-brand-primary dark:text-teal-400 flex items-center justify-center shrink-0 shadow-sm">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">تنظیم و تغییر رمز عبور ثابت</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    با تعیین رمز عبور، می‌توانید علاوه بر کد یکبار مصرف پیامکی و ایمیلی، با شماره موبایل و این رمز عبور نیز وارد سایت شوید.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSavePassword} className="space-y-5 max-w-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    رمز عبور فعلی (در صورت وجود)
                  </label>
                  <input
                    type="password"
                    placeholder="اگر برای نخستین بار رمز عبور تنظیم می‌کنید این فیلد را خالی بگذارید"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      رمز عبور جدید <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="حداقل ۶ کاراکتر"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                      minLength={6}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      تکرار رمز عبور جدید <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="تکرار همان رمز عبور"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 dark:text-slate-200">روش‌های ورود فعال به حساب کاربری:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <li>ورود با کد تأیید پیامکی (پیش‌فرض سریع)</li>
                      <li>ورود با کد تأیید ایمیلی (پشتیبان در صورت عدم دریافت پیامک)</li>
                      <li>ورود مستقیم با شماره موبایل و رمز عبور ثابت</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-md hover:shadow-lg hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingPassword ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{isSavingPassword ? "در حال ذخیره سازی..." : "ذخیره و به‌روزرسانی رمز عبور"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: TOP UP WALLET (افزایش موجودی)                                     */}
      {/* ========================================================================= */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-brand-primary dark:text-teal-400">
                <Wallet className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">افزایش موجودی کیف پول</h3>
              </div>
              <button onClick={() => setIsTopUpOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  مبلغ شارژ مورد نظر (تومان):
                </label>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2.5 px-3 font-mono text-left dir-ltr font-bold text-sm outline-none"
                />
              </div>

              {/* Amount Presets */}
              <div className="grid grid-cols-3 gap-2">
                {[100000, 250000, 500000, 1000000, 2000000, 5000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    className={`py-2 px-1 rounded-xl text-center font-mono font-bold border transition-colors ${
                      topUpAmount === amt
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {new Intl.NumberFormat("en-US").format(amt)}
                  </button>
                ))}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                  روش پرداخت و شارژ حساب:
                </label>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div
                    className="p-3.5 rounded-xl border border-teal-500 bg-teal-500/10 text-teal-900 dark:text-teal-200 font-bold flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      <div>
                        <span className="block text-xs font-bold text-slate-900 dark:text-white">کارت‌به‌کارت هوشمند (CartBeCart)</span>
                        <span className="text-[11px] text-teal-600 dark:text-teal-400 font-normal">
                          تأیید و افزایش اعتبار آنی با پایش پیامک بانک
                        </span>
                      </div>
                    </div>
                    <span className="w-4 h-4 rounded-full border border-teal-500 flex items-center justify-center shrink-0">
                      <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-teal-50 dark:bg-slate-800 text-teal-900 dark:text-teal-300 text-[11px] leading-relaxed">
                ℹ️ موجودی کیف پول بلافاصله برای خرید آنی کلیه اکانت‌ها و اشتراک‌ها بدون نیاز به اتصال مجدد به درگاه بانکی قابل استفاده است.
              </div>

              <button
                type="button"
                onClick={handleExecuteTopUp}
                disabled={isTopUpLoading || topUpAmount <= 0}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isTopUpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>ادامه و انتقال کارت‌به‌کارت (CartBeCart)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: WITHDRAWAL REQUEST (درخواست تسویه و برداشت وجه)                     */}
      {/* ========================================================================= */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">درخواست تسویه و انتقال وجه</h3>
              </div>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {hasPendingWithdrawal ? (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>درخواست تسویه در حال بررسی دارید</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  درخواست شما به شناسه <span className="font-mono font-bold">#{pendingWithdrawal?.id.slice(-6).toUpperCase()}</span> به مبلغ <span className="font-mono font-bold">{new Intl.NumberFormat("en-US").format(pendingWithdrawal?.amountToman || 0)} تومان</span> در حال پردازش توسط واحد مالی است.
                  جهت رعایت امنیت حساب و الزامات سامانه پایا/ساتنا، امکان ثبت درخواست جدید پس از تعیین تکلیف درخواست فعلی فعال خواهد شد.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    متوجه شدم
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitWithdrawal} className="space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-300">سقف قابل تسویه شما (واریز مستقیم):</span>
                    <strong className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-300">
                      {new Intl.NumberFormat("en-US").format(user?.directDepositBalance || 0)} تومان
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>حداقل برداشت: ۵۰,۰۰۰ تومان</span>
                    <span>سقف روزانه: ۵۰,۰۰۰,۰۰۰ تومان</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      مبلغ درخواستی جهت تسویه (تومان):
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">حداقل ۵۰,۰۰۰ ت</span>
                  </div>
                  <input
                    type="number"
                    value={withdrawForm.amountToman}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, amountToman: e.target.value })}
                    placeholder="مثلاً 500000"
                    min={50000}
                    max={user?.directDepositBalance || 0}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2.5 px-3 font-mono text-left dir-ltr font-bold outline-none"
                    required
                  />

                  {/* Amount Preset Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {[50000, 100000, 250000, 500000, 1000000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setWithdrawForm({ ...withdrawForm, amountToman: String(preset) })}
                        disabled={preset > (user?.directDepositBalance || 0)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 text-[10px] font-mono font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {new Intl.NumberFormat("en-US").format(preset)} ت
                      </button>
                    ))}
                    {(user?.directDepositBalance || 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => setWithdrawForm({ ...withdrawForm, amountToman: String(user?.directDepositBalance || 0) })}
                        className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 text-[10px] font-bold transition-colors"
                      >
                        کل موجودی
                      </button>
                    )}
                  </div>
                </div>

                {/* Saved Bank Cards quick select */}
                {bankCards.length > 0 && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      انتخاب سریع از کارت‌های ذخیره شده:
                    </label>
                    <select
                      onChange={(e) => {
                        const sel = bankCards.find((c) => c.id === e.target.value);
                        if (sel) {
                          setWithdrawForm({
                            ...withdrawForm,
                            cardNumber: sel.cardNumber,
                            sheba: sel.sheba,
                            accountOwnerName: sel.ownerName,
                          });
                        }
                      }}
                      defaultValue=""
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 outline-none text-[11px]"
                    >
                      <option value="" disabled>-- انتخاب کارت یا حساب --</option>
                      {bankCards.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.bankName} - {card.cardNumber} ({card.ownerName})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sheba (IBAN) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      شماره شبا (IBAN) جهت واریز پایا / ساتنا:
                    </label>
                    {shebaValidation && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        shebaValidation.isValid
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      }`}>
                        {shebaValidation.isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        <span>{shebaValidation.isValid ? shebaValidation.bankName : "شبا نامعتبر"}</span>
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={withdrawForm.sheba}
                    onChange={(e) => {
                      let val = e.target.value.trim().toUpperCase();
                      if (val && !val.startsWith("IR") && !val.startsWith("I") && /^\d/.test(val)) {
                        val = "IR" + val;
                      }
                      setWithdrawForm({ ...withdrawForm, sheba: val });
                    }}
                    placeholder="IR120560000000001234567001"
                    className={`w-full bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white rounded-xl py-2.5 px-3 font-mono text-left dir-ltr outline-none transition-colors ${
                      shebaValidation
                        ? shebaValidation.isValid
                          ? "border-emerald-500/60 focus:border-emerald-500"
                          : "border-rose-400 focus:border-rose-500"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  />
                  {shebaValidation && !shebaValidation.isValid && withdrawForm.sheba.length >= 10 && (
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 block">
                      {shebaValidation.error}
                    </span>
                  )}
                </div>

                {/* Card Number */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      شماره ۱۶ رقمی کارت بانکی (اختیاری):
                    </label>
                    {cardValidation && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        cardValidation.isValid
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      }`}>
                        {cardValidation.isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        <span>{cardValidation.isValid ? cardValidation.bankName : "کارت نامعتبر"}</span>
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={withdrawForm.cardNumber}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, cardNumber: e.target.value })}
                    placeholder="6037 9918 1234 5678"
                    maxLength={19}
                    className={`w-full bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white rounded-xl py-2.5 px-3 font-mono text-left dir-ltr outline-none transition-colors ${
                      cardValidation
                        ? cardValidation.isValid
                          ? "border-emerald-500/60 focus:border-emerald-500"
                          : "border-rose-400 focus:border-rose-500"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  />
                  {cardValidation && !cardValidation.isValid && withdrawForm.cardNumber.replace(/\D/g, '').length === 16 && (
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 block">
                      {cardValidation.error}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    نام و نام‌خانوادگی صاحب حساب:
                  </label>
                  <input
                    type="text"
                    value={withdrawForm.accountOwnerName}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, accountOwnerName: e.target.value })}
                    placeholder={user?.name || "نام صاحب کارت"}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2.5 px-3 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    توضیحات کاربر (اختیاری):
                  </label>
                  <textarea
                    rows={2}
                    value={withdrawForm.userNote}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, userNote: e.target.value })}
                    placeholder="توضیحات تکمیلی در صورت نیاز..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={
                      isSubmittingWithdraw ||
                      hasPendingWithdrawal ||
                      !withdrawForm.amountToman ||
                      Number(withdrawForm.amountToman) < 50000 ||
                      Number(withdrawForm.amountToman) > (user?.directDepositBalance || 0) ||
                      (withdrawForm.sheba.trim() && !shebaValidation?.isValid) ||
                      (withdrawForm.cardNumber.trim() && !cardValidation?.isValid) ||
                      (!withdrawForm.sheba.trim() && !withdrawForm.cardNumber.trim())
                    }
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmittingWithdraw ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>ثبت و ارسال درخواست تسویه</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD BANK CARD                                                      */}
      {/* ========================================================================= */}
      {isAddCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-brand-primary dark:text-teal-400">
                <CreditCard className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">افزودن کارت شتاب جدید</h3>
              </div>
              <button onClick={() => setIsAddCardOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCard} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  انتخاب بانک صادرکننده:
                </label>
                <select
                  value={cardForm.bankName}
                  onChange={(e) => setCardForm({ ...cardForm, bankName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2.5 px-3 outline-none"
                >
                  <option value="بانک سامان">بانک سامان</option>
                  <option value="بلو بانک (سامان)">بلو بانک (Blu)</option>
                  <option value="بانک ملت">بانک ملت</option>
                  <option value="بانک پاسارگاد">بانک پاسارگاد</option>
                  <option value="بانک ملی ایران">بانک ملی ایران</option>
                  <option value="بانک تجارت">بانک تجارت</option>
                  <option value="بانک آینده">بانک آینده</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  شماره ۱۶ رقمی کارت:
                </label>
                <input
                  type="text"
                  value={cardForm.cardNumber}
                  onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                  placeholder="6219 8610 1234 5678"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2.5 px-3 font-mono text-left dir-ltr outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  شماره شبا (IBAN):
                </label>
                <input
                  type="text"
                  value={cardForm.sheba}
                  onChange={(e) => setCardForm({ ...cardForm, sheba: e.target.value })}
                  placeholder="IR120560000000001234567001"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2.5 px-3 font-mono text-left dir-ltr outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  نام صاحب کارت:
                </label>
                <input
                  type="text"
                  value={cardForm.ownerName}
                  onChange={(e) => setCardForm({ ...cardForm, ownerName: e.target.value })}
                  placeholder={user.name || "علیرضا تهرانی"}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2.5 px-3 outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>ثبت و ذخیره کارت بانکی</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD ADDRESS                                                        */}
      {/* ========================================================================= */}
      {isAddAddressOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-brand-primary dark:text-teal-400">
                <MapPin className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">ثبت آدرس پستی جدید</h3>
              </div>
              <button onClick={() => setIsAddAddressOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان آدرس (مثلاً منزل، دفتر کار، انبار):
                </label>
                <input
                  type="text"
                  value={addressForm.title}
                  onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2.5 px-3 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">استان:</label>
                  <input
                    type="text"
                    value={addressForm.province}
                    onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">شهر:</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  نشانی کامل، خیابان، پلاک و واحد:
                </label>
                <textarea
                  rows={2}
                  value={addressForm.fullAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, fullAddress: e.target.value })}
                  placeholder="بلوار، خیابان، کوچه، پلاک، طبقه و واحد..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2.5 px-3 outline-none"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  کد پستی ۱۰ رقمی:
                </label>
                <input
                  type="text"
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                  placeholder="1987654321"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2.5 px-3 font-mono text-left dir-ltr outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>ثبت آدرس در دفترچه</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CustomerRefundModal
        isOpen={!!refundModalOrder}
        order={refundModalOrder}
        onClose={() => setRefundModalOrder(null)}
      />

      {/* Card-to-Card Wallet Top-Up Modal */}
      {isCardPaymentModalOpen && user && (
        <CardPaymentModal
          isOpen={isCardPaymentModalOpen}
          onClose={() => setIsCardPaymentModalOpen(false)}
          amountToman={topUpAmount}
          userId={user.id}
          customerName={user.name}
          customerPhone={user.phone || undefined}
          paymentType="WALLET_TOPUP"
          onSuccess={async (res) => {
            setIsCardPaymentModalOpen(false);
            if (res.isManualReview) {
              showToast(
                "success",
                "فیش واریزی با موفقیت ثبت شد و پس از بررسی ادمین به موجودی شما افزوده خواهد شد."
              );
            } else {
              showToast(
                "success",
                `کیف پول شما به مبلغ ${new Intl.NumberFormat("en-US").format(topUpAmount)} تومان با موفقیت شارژ گردید!`
              );
              // Fetch latest accurate balance directly from server
              await refreshUser();
            }
          }}
        />
      )}

      <Footer />
    </div>
  );
}
