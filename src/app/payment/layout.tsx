import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "درگاه پرداخت هوشمند کارت‌به‌کارت | ارزان اکانت",
  description:
    "سامانه پرداخت امن کارت‌به‌کارت هوشمند CartBeCart با پایش خودکار پیامک بانک و صدور آنی لایسنس در ارزان اکانت.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
