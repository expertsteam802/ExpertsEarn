"use client";

import { useState } from "react";
import { Bell, BellRing } from "lucide-react";

export function NotificationOptIn() {
  const [status, setStatus] = useState<"idle" | "loading" | "enabled" | "blocked" | "unsupported">("idle");

  async function enableNotifications() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    try {
      const permission = Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission;
      if (permission !== "granted") {
        setStatus("blocked");
        return;
      }
      await navigator.serviceWorker.register("/sw.js");
      if (!document.getElementById("monetag-notification-12294874")) {
        const script = document.createElement("script");
        script.id = "monetag-notification-12294874";
        script.src = "https://5gvci.com/act/files/tag.min.js?z=12294874";
        script.async = true;
        script.dataset.cfasync = "false";
        document.body.appendChild(script);
      }
      setStatus("enabled");
    } catch {
      setStatus("unsupported");
    }
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-[#969198]">
      <button type="button" onClick={enableNotifications} disabled={status === "loading" || status === "enabled"} className="inline-flex items-center gap-2 rounded-full border border-[#c6a873]/30 px-3 py-2 font-semibold text-[#d5bd91] transition hover:bg-[#c6a873]/10 disabled:opacity-60">
        {status === "enabled" ? <BellRing size={14}/> : <Bell size={14}/>}
        {status === "loading" ? "Enabling…" : status === "enabled" ? "Notifications enabled" : "Enable browser notifications"}
      </button>
      {status === "blocked" && <span>Permission was not granted. You can change it in your browser settings.</span>}
      {status === "unsupported" && <span>Browser notifications are unavailable in this browser.</span>}
    </div>
  );
}
