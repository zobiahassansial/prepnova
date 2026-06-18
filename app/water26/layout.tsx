import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Access Control",
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Completely isolated from the main site layout — no Navbar, Footer, or ThemeProvider
  return <>{children}</>
}
