import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "رهگیری سفارشات و دریافت مشخصات لایسنس | ارزان اکانت",
  description:
    "پیگیری لحظه‌ای وضعیت سفارش، دسترسی آنی به اطلاعات اکانت و لایسنس‌های صادره، صدور فاکتور رسمی و ثبت درخواست عودت وجه در ارزان اکانت.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
