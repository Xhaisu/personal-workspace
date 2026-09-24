/* 专属工作台 离线缓存 Service Worker
   策略：页面（HTML 导航）网络优先且强制绕过浏览器 HTTP 缓存（GitHub Pages 给 HTML 设了
   max-age=600，若走默认 fetch 会拿到 10 分钟内的旧页面）——改完刷新即最新；
   静态资源（图标/manifest）缓存优先——离线可用。 */
var CACHE = 'personal-workspace-v4';
var PRECACHE = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE).then(function (c) { return c.addAll(PRECACHE); })
            .then(function () { return self.skipWaiting(); })
    );
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
        }).then(function () { return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function (e) {
    if (e.request.method !== 'GET') return;
    var req = e.request;

    if (req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1) {
        e.respondWith(
            fetch(req.url, { cache: 'reload', credentials: 'same-origin' }).then(function (res) {
                var copy = res.clone();
                caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
                return res;
            }).catch(function () {
                return caches.match('./index.html', { ignoreSearch: true });
            })
        );
        return;
    }

    e.respondWith(
        caches.match(req, { ignoreSearch: true }).then(function (hit) {
            if (hit) return hit;
            return fetch(req).then(function (res) {
                var copy = res.clone();
                caches.open(CACHE).then(function (c) { c.put(req, copy); });
                return res;
            });
        })
    );
});
