import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "کاتالوگ و خرید انواع اکانت و اشتراک قانونی | ارزان اکانت",
  description:
    "خرید آنلاین انواع اکانت هوش مصنوعی، سرویس‌های استریم فیلم و سریال، تلگرام پرمیوم و ابزارهای توسعه با تحویل فوری زیر ۱۰ دقیقه و گارانتی تعویض کامل.",
  alternates: {
    canonical: "https://arzanaccount.ir/products",
  },
  openGraph: {
    title: "کاتالوگ و خرید انواع اکانت و اشتراک قانونی | ارزان اکانت",
    description:
      "خرید آنلاین انواع اکانت هوش مصنوعی، سرویس‌های استریم فیلم و سریال، تلگرام پرمیوم و ابزارهای توسعه با تحویل فوری و گارانتی کامل.",
    url: "https://arzanaccount.ir/products",
    siteName: "ارزان اکانت",
    locale: "fa_IR",
    type: "website",
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
