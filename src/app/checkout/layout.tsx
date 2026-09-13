import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تسویه حساب و پرداخت امن سفارش | ارزان اکانت",
  description:
    "مرحله نهایی ثبت مشخصات خریدار، تنظیمات اکانت و اتصال به سامانه کارت‌به‌کارت اختصاصی ارزان اکانت با تحویل فوری.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
