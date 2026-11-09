import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExpertsEarn — Answer. Earn. Repeat.",
  description: "Share your opinion, shape better products, and earn rewards with ExpertsEarn by ExpertsTeam.",
  applicationName: "ExpertsEarn",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "ExpertsEarn" }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1B4332"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  return <html lang="en"><body>
    {children}
    <PwaRegister />
    {adsenseClient && <Script
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
    />}
  </body></html>;
}