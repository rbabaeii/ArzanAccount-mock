import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سبد خرید | ارزان اکانت",
  description:
    "مشاهده و مدیریت اشتراک‌های انتخابی، اعمال کد تخفیف و بررسی فاکتور نهایی خرید اکانت‌های هوش مصنوعی، استریمینگ و بازی در ارزان اکانت.",
  alternates: {
    canonical: "https://arzanaccount.ir/cart",
  },
  openGraph: {
    title: "سبد خرید | ارزان اکانت",
    description:
      "مشاهده و مدیریت اشتراک‌های انتخابی، اعمال کد تخفیف و بررسی فاکتور نهایی خرید با تحویل فوری.",
    url: "https://arzanaccount.ir/cart",
    siteName: "ارزان اکانت",
    locale: "fa_IR",
    type: "website",
  },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
