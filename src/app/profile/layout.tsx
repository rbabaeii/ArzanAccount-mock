import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "حساب کاربری و کیف پول | ارزان اکانت",
  description:
    "مدیریت اطلاعات حساب کاربری، کیف پول دیجیتال، کارت‌های بانکی عضو شتاب، آدرس‌ها و شبکه کسب درآمد رفرال در ارزان اکانت.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
