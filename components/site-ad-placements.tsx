"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const EXCLUDED_PATHS = ["/wallet/payout", "/profile", "/admin/identity"];

function isExcluded(pathname: string) {
  return EXCLUDED_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

export function SiteAdPlacements() {
  const pathname = usePathname();

  useEffect(() => {
    if (isExcluded(pathname)) return;

    // Monetag In-Page Push is a banner-style placement that Monetag positions
    // automatically (desktop: usually upper-right; mobile: usually top).
    // Load one copy per eligible page and keep it out of payout/identity flows.
    const existing = document.getElementById("monetag-inpage-loader");
    if (existing) return;

    const script = document.createElement("script");
    script.id = "monetag-inpage-loader";
    script.src = "https://nap5k.com/tag.min.js";
    script.dataset.zone = "12296064";
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [pathname]);

  return null;
}
