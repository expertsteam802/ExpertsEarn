"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { NotificationOptIn } from "@/components/notification-opt-in";

const EXCLUDED_PATHS = [
  "/wallet/payout",
  "/profile",
  "/admin/identity",
  "/verification",
  "/verify",
  "/identity",
];

function isExcluded(pathname: string) {
  return EXCLUDED_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

const IN_PAGE_LOADER = "(function(s){s.dataset.zone='12294866',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))";
const VIGNETTE_LOADER = "(function(s){s.dataset.zone='12294868',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))";

function ensureLoader(id: string, source: string) {
  if (document.getElementById(id)) return;
  const loader = document.createElement("script");
  loader.id = id;
  loader.textContent = source;
  document.head.appendChild(loader);
}

export function MonetagRouteRuntime() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const [eligible, setEligible] = useState(() => !isExcluded(pathname));

  useEffect(() => {
    const excluded = isExcluded(pathname);
    const wasExcluded = isExcluded(previousPath.current);
    previousPath.current = pathname;

    if (excluded) {
      setEligible(false);
      // Root layout persists during Next.js client navigation. Reload once when
      // entering a protected flow so the server omits ad tags and clears overlays.
      if (!wasExcluded) window.location.reload();
      return;
    }

    setEligible(true);
    // When navigating from a protected page without a full document load,
    // install the same exact Monetag loaders used in the server-rendered <head>.
    ensureLoader("monetag-inpage-loader", IN_PAGE_LOADER);
    ensureLoader("monetag-vignette-loader", VIGNETTE_LOADER);
  }, [pathname]);

  return eligible ? <NotificationOptIn /> : null;
}
