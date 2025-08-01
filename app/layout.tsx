import type { Metadata } from "next";
import { AuthProvider } from "./lib/auth";
import { ThemeProvider } from "./lib/ThemeContext";
import ConditionalNavbar from "./lib/ConditionalNavbar";
import ConditionalMain from "./lib/ConditionalMain";
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
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>
            <ConditionalNavbar />
            <ConditionalMain>
              {children}
            </ConditionalMain>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
