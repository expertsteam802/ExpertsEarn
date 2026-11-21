import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { PwaRegister } from "@/components/pwa-register";
import { NotificationOptIn } from "@/components/notification-opt-in";
import "./globals.css";

const SITE_URL = "https://www.expertsearn.mywire.org";
const SITE_NAME = "ExpertsEarn";
const SITE_DESCRIPTION =
  "ExpertsEarn is a worldwide survey and research rewards platform. Join from supported locations, discover eligible paid surveys, share your opinions and track approved rewards. Survey availability and reward terms vary by country.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ExpertsEarn | Paid Online Surveys & Rewards Worldwide",
    template: "%s | ExpertsEarn",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "ExpertsEarn | Paid Online Surveys & Rewards Worldwide",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "ExpertsEarn — paid surveys and rewards worldwide" }],
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: "ExpertsEarn | Paid Online Surveys & Rewards Worldwide",
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
      "@id": "https://www.expertsearn.mywire.org/#organization",
      name: "ExpertsEarn",
      alternateName: ["Experts Earn", "ExpertsEarn by ExpertsTeam"],
      url: "https://www.expertsearn.mywire.org/",
      email: "expertsearn@gmail.com",
      logo: { "@type": "ImageObject", url: "https://www.expertsearn.mywire.org/expertsearn-mark.svg", width: 512, height: 512 },
      sameAs: ["https://www.youtube.com/@expertsearn"],
      parentOrganization: { "@type": "Organization", name: "ExpertsTeam" },
      description: SITE_DESCRIPTION,
      slogan: "Your insight has value.",
      knowsLanguage: ["en", "rw", "fr"],
      areaServed: "Worldwide",
    },
    {
      "@type": "WebSite",
      "@id": "https://www.expertsearn.mywire.org/#website",
      url: "https://www.expertsearn.mywire.org/",
      name: "ExpertsEarn",
      alternateName: "ExpertsEarn by ExpertsTeam",
      inLanguage: ["en", "rw", "fr"],
      publisher: { "@id": "https://www.expertsearn.mywire.org/#organization" },
    },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const monetagEligible = requestHeaders.get("x-expertearn-monetag-eligible") === "1";

  return (
    <html lang="en">
      <head>
        {monetagEligible && (
          <script
            id="monetag-inpage-loader"
            dangerouslySetInnerHTML={{
              __html: "(function(s){s.dataset.zone='12296064',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))",
            }}
          />
        )}
        {monetagEligible && (
          <script
            id="monetag-vignette-loader"
            dangerouslySetInnerHTML={{
              __html: "(function(s){s.dataset.zone='12296060',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))",
            }}
          />
        )}
        {monetagEligible && (
          <script
            src="https://5gvci.com/act/files/tag.min.js?z=12294874"
            data-cfasync="false"
            async
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c") }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}{monetagEligible && <NotificationOptIn />}<PwaRegister /></body>
    </html>
  );
}
