// sw.js
const CACHE_NAME = 'mgmt-pad-v3';  // ←更新時は番号を上げる
const APP_SHELL = [
  '/',                // ルート
  '/index.html',
  '/manifest.webmanifest',
  '/sw.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512-maskable.png'
  // 必要ならCSS/JSを分離している場合に追加
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// ルーティング：同一オリジンの GET はキャッシュ優先、失敗時はネット
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        // 成功したら静的リソースは更新しておく
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        return res;
      }).catch(() => cached || Promise.reject('offline'));
      return cached || fetchPromise;
    })
  );
});
