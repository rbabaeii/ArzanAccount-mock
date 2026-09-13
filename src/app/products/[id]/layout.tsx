import type { Metadata } from "next";
import { initialProducts } from "@/data/mockData";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const product = initialProducts.find((p) => p.id === params.id);

  if (!product) {
    return {
      title: "جزئیات اشتراک دیجیتال | ارزان اکانت",
      description:
        "خرید آنلاین انواع اکانت‌های پریمیوم و اشتراک دیجیتال با تحویل آنلاین.",
    };
  }

  const cleanDescription = (product.description || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  return {
    title: `خرید ${product.customTitle} | ارزان اکانت`,
    description:
      cleanDescription ||
      `خرید آنلاین و تحویل آنی ${product.customTitle} با گارانتی تعویض و پشتیبانی ۲۴ ساعته.`,
    alternates: {
      canonical: `https://arzanaccount.ir/products/${product.id}`,
    },
    openGraph: {
      title: `خرید ${product.customTitle} | ارزان اکانت`,
      description: cleanDescription,
      url: `https://arzanaccount.ir/products/${product.id}`,
      siteName: "ارزان اکانت",
      locale: "fa_IR",
      images: product.image
        ? [{ url: product.image, alt: product.customTitle }]
        : [],
      type: "website",
    },
  };
}

export default function ProductDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
