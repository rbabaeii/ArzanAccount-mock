import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import LoginModal from "@/components/auth/LoginModal";
import DynamicBrandHead from "@/components/common/DynamicBrandHead";
import MobileBottomNav from "@/components/store/MobileBottomNav";

export const metadata: Metadata = {
  title: "ارزان اکانت | خرید ارزان و آنی انواع اکانت و اشتراک دیجیتال",
  description: "مرجع تخصصی خرید ارزان اکانت‌های هوش مصنوعی، استریمینگ، شبکه‌های اجتماعی و خدمات دیجیتال با تحویل فوری",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('arzan_theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased text-slate-800 dark:text-slate-100 bg-store-bg dark:bg-slate-950 selection:bg-brand-primary selection:text-white min-h-screen transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <StoreProvider>
              <DynamicBrandHead />
              {children}
              <LoginModal />
              <MobileBottomNav />
            </StoreProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
