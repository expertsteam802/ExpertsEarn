import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const SITE_URL = "https://expertsearn.mywire.org";
const SITE_DESCRIPTION = "ExpertsEarn connects survey participants with research teams through targeted studies, transparent RWF rewards and responsible research participation.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ExpertsEarn | Survey Research & Rewards",
    template: "%s | ExpertsEarn",
  },
  description: SITE_DESCRIPTION,
  applicationName: "ExpertsEarn",
  openGraph: {
    type: "website",
    siteName: "ExpertsEarn",
    title: "ExpertsEarn | Survey Research & Rewards",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "ExpertsEarn | Survey Research & Rewards",
    description: SITE_DESCRIPTION,
  },
  icons: { icon: "/expertsearn-mark.svg", apple: "/expertsearn-mark.svg" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "ExpertsEarn" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#090a0f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}<PwaRegister /></body>
    </html>
  );
}
