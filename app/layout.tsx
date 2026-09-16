import type { Metadata, Viewport } from "next";
import "./globals.css";
import SWRegister from "@/components/SWRegister";
import { UIProvider } from "@/components/UI";

export const metadata: Metadata = {
  title: "OJT Tracker",
  description: "Track OJT hours, daily journal, and weekly reports.",
  appleWebApp: { capable: true, title: "OJT Tracker", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0A4DA2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. ColorZilla) inject attributes before React hydrates
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh font-sans" suppressHydrationWarning>
        <SWRegister />
        <UIProvider>{children}</UIProvider>
      </body>
    </html>
  );
}
