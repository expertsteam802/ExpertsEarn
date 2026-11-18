self.options = {
    "domain": "5gvci.com",
    "zoneId": 12294443
};
self.lary = "";
importScripts("https://5gvci.com/act/files/service-worker.min.js?r=sw");

const CACHE = "expertsearn-shell-v1";
const SHELL = ["/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => {
      const cached = await caches.match("/offline.html");
      return cached || Response.error();
    }));
  }
});
