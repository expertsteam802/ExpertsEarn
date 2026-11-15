import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const SITE_URL = "https://mywire.org";
const SITE_NAME = "ExpertsEarn";
const SITE_DESCRIPTION =
  "Find paid online surveys and research studies in Rwanda. Share your perspective, discover eligible opportunities and earn transparent rewards in RWF with ExpertsEarn.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ExpertsEarn | Paid Surveys & Research Rewards in Rwanda",
    template: "%s | ExpertsEarn",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "ExpertsEarn | Paid Surveys & Research Rewards in Rwanda",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_RW",
    alternateLocale: ["rw_RW", "fr_FR"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ExpertsEarn | Paid Surveys & Research Rewards in Rwanda",
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  icons: { icon: "/expertsearn-mark.svg", apple: "/expertsearn-mark.svg" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: SITE_NAME },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#090a0f" };

const organizationSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://mywire.org/#organization",
      name: "ExpertsEarn",
      alternateName: ["ExpertsEarn by ExpertsTeam"],
      url: "https://mywire.org/",
      email: "mucyochristhecla@gmail.com",
      parentOrganization: { "@type": "Organization", name: "ExpertsTeam" },
      description: SITE_DESCRIPTION,
      knowsLanguage: ["en", "rw", "fr"],
      areaServed: [{ "@type": "Country", name: "Rwanda" }, "International markets"],
    },
    {
      "@type": "WebSite",
      "@id": "https://mywire.org/#website",
      url: "https://mywire.org/",
      name: "ExpertsEarn",
      alternateName: "ExpertsEarn by ExpertsTeam",
      inLanguage: ["en", "rw", "fr"],
      publisher: { "@id": "https://mywire.org/#organization" },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c") }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}<PwaRegister /></body>
    </html>
  );
}
