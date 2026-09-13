import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ورود و ثبت‌نام سریع با کد یکبار مصرف (OTP) | ارزان اکانت",
  description:
    "ورود امن و سریع به حساب کاربری ارزان اکانت با شماره همراه و کد تایید ۵ رقمی یا رمز عبور.",
  alternates: {
    canonical: "https://arzanaccount.ir/login",
  },
  openGraph: {
    title: "ورود و ثبت‌نام سریع | ارزان اکانت",
    description: "ورود امن و سریع به حساب کاربری ارزان اکانت با شماره همراه.",
    url: "https://arzanaccount.ir/login",
    siteName: "ارزان اکانت",
    locale: "fa_IR",
    type: "website",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
