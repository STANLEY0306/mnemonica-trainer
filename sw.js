const CACHE = "mnemonica-trainer-v2";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./css/tokens.css", "./css/themes.css", "./css/base.css", "./css/components.css", "./css/suits.css", "./js/main.js", "./js/storage.js", "./js/srs.js", "./js/games/questions.js", "./data/stack.js", "./data/mnemonics.js", "./assets/icon.svg"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); }
    return response;
  }).catch(() => caches.match("./index.html"))));
});
