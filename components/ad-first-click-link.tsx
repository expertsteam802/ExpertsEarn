"use client";

import { useState } from "react";

const DIRECT_LINK = "https://uplcm.com/4/12315519";

type Props = {
  href: string;
  className?: string;
  children: React.ReactNode;
  label?: string;
};

/**
 * First activation opens the disclosed Monetag direct-link ad in a popup.
 * The next activation follows the original destination. The gate is scoped
 * to this destination for the current tab session.
 */
export function AdFirstClickLink({ href, className, children, label = "Continue" }: Props) {
  const [armed, setArmed] = useState(false);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    let alreadyOpened = false;
    try {
      alreadyOpened = window.sessionStorage.getItem(`expertsEarnAd:${href}`) === "opened";
    } catch {
      alreadyOpened = armed;
    }

    if (alreadyOpened) return;

    event.preventDefault();
    const width = 480;
    const height = 640;
    const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
    const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

    // Open a blank window synchronously during the user gesture, then navigate
    // it. This is more popup-blocker-friendly than opening the ad URL directly.
    const popup = window.open(
      "about:blank",
      "expertsEarnDirectLinkPopup",
      `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );

    if (!popup) {
      window.alert("Your browser blocked the advertisement popup. Please allow popups for ExpertsEarn, then click again to continue.");
      return;
    }

    try {
      popup.opener = null;
      popup.location.replace(DIRECT_LINK);
    } catch {
      popup.close();
      window.alert("The advertisement window could not be opened. Please allow popups for ExpertsEarn and try again.");
      return;
    }

    try {
      window.sessionStorage.setItem(`expertsEarnAd:${href}`, "opened");
    } catch {
      // Component state still provides the two-step flow if storage is blocked.
    }
    setArmed(true);
  }

  return (
    <a href={href} className={className} onClick={handleClick} aria-label={armed ? label : `${label} (opens an ad window first)`}>
      {children}
      {!armed && <span className="sr-only"> First click opens an advertisement in a separate popup; click again to continue.</span>}
    </a>
  );
}
