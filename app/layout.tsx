import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import { NextAuthProvider } from "@/components/providers/next-auth-provider";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PrepNova - Master Your Career",
  description: "The all-in-one platform for students. Calendar, Resume, Interview Prep, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextAuthProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
