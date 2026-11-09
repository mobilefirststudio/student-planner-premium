// Student Planner Premium, Service Worker
// Change CACHE_NAME (for example to today's date) whenever you redeploy index.html.
const CACHE_NAME = "student-planner-cache-2026-11-09a";
const ICON_CSS = "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css";
const CORE_ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", ICON_CSS];
// Fonts and icons come from these sites; they are saved so the app looks right offline.
const ASSET_HOSTS = ["cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (event) => {
  // Each file is saved on its own, so one missing file can't stop the rest from being saved.
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => Promise.all(CORE_ASSETS.map((url) => cache.add(url).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// Network-first for the page itself, cache-first for icons and fonts.
// Google sign-in and Google Drive always go to the real network.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isAsset = ASSET_HOSTS.includes(url.hostname);
  if (url.origin !== self.location.origin && !isAsset) return;

  const isPage = event.request.mode === "navigate" || url.pathname.endsWith("/index.html") || url.pathname.endsWith("/");
  if (isPage && !isAsset) {
    event.respondWith(
      fetch(event.request).then((res) => { const copy = res.clone(); caches.open(CACHE_NAME).then((c) => c.put("./index.html", copy)); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request).then((res) => {
      if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(event.request, copy)); }
      return res;
    }))
  );
});
