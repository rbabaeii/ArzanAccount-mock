import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "دسته‌بندی جامع اشتراک‌ها و اکانت‌های دیجیتال | ارزان اکانت",
  description:
    "مرور دسته‌بندی‌های تخصصی انواع اکانت هوش مصنوعی، استریمینگ فیلم و موسیقی، شبکه‌های اجتماعی، گیمینگ و لایسنس‌های اورجینال با تحویل آنی.",
  alternates: {
    canonical: "https://arzanaccount.ir/categories",
  },
  openGraph: {
    title: "دسته‌بندی جامع اشتراک‌ها و اکانت‌های دیجیتال | ارزان اکانت",
    description:
      "مرور دسته‌بندی‌های تخصصی انواع اکانت هوش مصنوعی، استریمینگ، شبکه‌های اجتماعی، گیمینگ و لایسنس‌ها با تحویل آنی.",
    url: "https://arzanaccount.ir/categories",
    siteName: "ارزان اکانت",
    locale: "fa_IR",
    type: "website",
  },
};

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
