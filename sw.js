/* Service worker: deja la app guardada para que abra sin internet. */
var V = 'inv-refri-v2';
var ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(V).then(function (c) {
      return Promise.all(ASSETS.map(function (a) { return c.add(a).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Primero lo guardado (rápido y sin internet); si hay internet, se actualiza en segundo plano. */
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin !== location.origin) return;
  e.respondWith(
    caches.match(r, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(r).then(function (res) {
        if (res && res.ok) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(r, cp); }); }
        return res;
      }).catch(function () { return null; });
      if (hit) return hit;
      return net.then(function (res) {
        if (res) return res;
        if (r.mode === 'navigate') return caches.match('index.html').then(function (x) { return x || caches.match('./'); });
        return Response.error();
      });
    })
  );
});
