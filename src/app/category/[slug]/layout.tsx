import type { Metadata } from "next";
import { initialCategories } from "@/data/mockData";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const decodedSlug = decodeURIComponent(params.slug || "");
  const category = initialCategories.find(
    (c) => c.slug === params.slug || c.slug === decodedSlug
  );

  if (!category) {
    return {
      title: "دسته‌بندی اشتراک دیجیتال | ارزان اکانت",
      description: "خرید آنلاین و ارزان انواع اشتراک دیجیتال با تحویل فوری.",
    };
  }

  return {
    title: `خرید اشتراک‌های ${category.title} | ارزان اکانت`,
    description:
      category.description ||
      `خرید آنلاین و ارزان انواع اشتراک‌های ${category.title} با تحویل فوری و ضمانت کامل.`,
    alternates: {
      canonical: `https://arzanaccount.ir/category/${category.slug}`,
    },
    openGraph: {
      title: `خرید اشتراک‌های ${category.title} | ارزان اکانت`,
      description:
        category.description ||
        `خرید آنلاین و ارزان انواع اشتراک‌های ${category.title}`,
      url: `https://arzanaccount.ir/category/${category.slug}`,
      siteName: "ارزان اکانت",
      locale: "fa_IR",
      type: "website",
    },
  };
}

export default function CategorySlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
