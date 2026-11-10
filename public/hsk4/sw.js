// HSK4 中国語トレーナー：オフライン用 Service Worker
const CACHE = "hsk4-v1";
const FILES = ["/hsk4/", "/hsk4/index.html", "/hsk4/manifest.webmanifest", "/hsk4/icon-180.png", "/hsk4/icon-512.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
// キャッシュを先に返して即起動し、通信できれば裏で最新版に更新する
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((cached) => {
      const net = fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached || caches.match("/hsk4/index.html"));
      return cached || net;
    })
  );
});
