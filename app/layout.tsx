import type { Metadata } from "next";
import { headers } from "next/headers";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import { NextAuthProvider } from "@/components/providers/next-auth-provider"
import { AnalyticsTracker } from "@/components/analytics/tracker";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PrepNova — AI Study & Career Workspace",
  description: "Summarize lecture notes, build ATS-friendly resumes, practise mock interviews, and plan your study schedule — all in one place.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The nonce is injected by middleware so Next.js can attach it to any
  // inline scripts it generates (hydration, router prefetch, etc.).
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          <NextAuthProvider>
            <AuthProvider>
              <AnalyticsTracker />
              {children}
              <Toaster />
            </AuthProvider>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
