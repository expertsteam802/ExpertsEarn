"use client";

import { useState } from "react";
import { Bell, BellRing, X } from "lucide-react";

export function NotificationOptIn() {
  const [status, setStatus] = useState<"idle" | "loading" | "enabled" | "blocked" | "unsupported">("idle");
  const [dismissed, setDismissed] = useState(false);

  async function enableNotifications() {
    if (!( "Notification" in window) || !( "serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }

    setStatus("loading");
    try {
      // Permission is requested only after the visitor deliberately presses the button.
      const permission = Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission;

      if (permission !== "granted") {
        setStatus("blocked");
        return;
      }

      // Monetag's supplied sw.js is served from the domain root and includes
      // zone 12294874's service-worker integration alongside ExpertsEarn PWA support.
      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      // Add the supplied notification tag to <head> only after explicit opt-in.
      if (!document.getElementById("monetag-notification-12294874")) {
        const script = document.createElement("script");
        script.id = "monetag-notification-12294874";
        script.src = "https://5gvci.com/act/files/tag.min.js?z=12294874";
        script.async = true;
        script.setAttribute("data-cfasync", "false");
        document.head.appendChild(script);
      }
      setStatus("enabled");
    } catch (error) {
      console.error("ExpertsEarn notification setup failed", error);
      setStatus("unsupported");
    }
  }

  if (dismissed) return null;

  return (
    <aside aria-label="Optional browser notifications" className="mx-auto w-full max-w-6xl px-4 pb-5 pt-2 sm:px-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-[#c6a873]/25 bg-gradient-to-r from-[#171820] via-[#12131a] to-[#1c1a18] p-4 shadow-[0_10px_35px_rgba(0,0,0,.22)] sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#c6a873]/25 bg-[#c6a873]/10 text-[#d5bd91]">
            {status === "enabled" ? <BellRing size={19} /> : <Bell size={19} />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#eee7dc]">
              {status === "enabled" ? "Browser notifications enabled" : "Stay updated with ExpertsEarn"}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#aaa6a2]">
              {status === "enabled"
                ? "Your browser permission is granted. You can manage notifications in browser settings."
                : status === "blocked"
                  ? "Permission was not granted. You can enable it later in your browser settings."
                  : status === "unsupported"
                    ? "This browser does not support the notification setup."
                    : "Optional updates may arrive on this device. You choose whether to subscribe; notifications are never required to use the platform."}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {status !== "enabled" && (
            <button type="button" onClick={enableNotifications} disabled={status === "loading"} className="min-h-10 flex-1 rounded-xl border border-[#c6a873]/40 bg-[#c6a873] px-4 py-2 text-xs font-extrabold text-[#111116] transition hover:brightness-110 disabled:opacity-60 sm:flex-none">
              {status === "loading" ? "Enabling…" : "Enable notifications"}
            </button>
          )}
          <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss notification option" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 text-[#aaa6a2] transition hover:bg-white/5 hover:text-white">
            <X size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
