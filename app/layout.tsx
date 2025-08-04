import type { Metadata } from "next";
import { AuthProvider } from "./lib/ui/contexts/auth-context";
import { ThemeProvider } from "./lib/ui/contexts/theme-context";
import { AdvancedI18nProvider } from "./lib/contexts/advanced-i18n-context";
import ConditionalNavbar from "./lib/ui/components/layouts/ConditionalNavbar";
import ConditionalMain from "./lib/ui/components/layouts/ConditionalMain";
import "./globals.css";

export const metadata: Metadata = {
  title: "Test Website - Modern Blog Platform",
  description: "A modern blog platform built with Next.js and MongoDB Atlas",
};



interface RootLayoutProps {
  readonly children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head />
      <body className="antialiased bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 min-h-screen">
        <AdvancedI18nProvider initialLocale="ja" fallbackLocale="en">
          <ThemeProvider>
            <AuthProvider>
              <ConditionalNavbar />
              <ConditionalMain>
                {children}
              </ConditionalMain>
            </AuthProvider>
          </ThemeProvider>
        </AdvancedI18nProvider>
      </body>
    </html>
  );
}
