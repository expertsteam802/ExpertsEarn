import Script from "next/script";
import { NotificationOptIn } from "@/components/notification-opt-in";

export function MonetagInPage() {
  return <Script id="monetag-inpage-12294866" src="https://nap5k.com/tag.min.js" data-zone="12294866" async strategy="afterInteractive" />;
}

export function MonetagVignette() {
  return <Script id="monetag-vignette-12294868" src="https://n6wxm.com/vignette.min.js" data-zone="12294868" async strategy="afterInteractive" />;
}

export function MonetagNotificationOptIn() {
  return <NotificationOptIn />;
}
