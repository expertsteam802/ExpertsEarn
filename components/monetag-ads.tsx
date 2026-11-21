import Script from "next/script";
import { NotificationOptIn } from "@/components/notification-opt-in";

export function MonetagInPage() {
  return <Script id="monetag-inpage-loader" src="https://nap5k.com/tag.min.js" data-zone="12296064" async strategy="afterInteractive" />;
}

export function MonetagVignette() {
  return <Script id="monetag-vignette-loader" src="https://n6wxm.com/vignette.min.js" data-zone="12296060" async strategy="afterInteractive" />;
}

export function MonetagNotificationOptIn() {
  return <NotificationOptIn />;
}
