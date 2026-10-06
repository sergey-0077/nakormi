/* «Накорми меня» — сервис-воркер: игра работает без интернета.
   Страница игры: сначала сеть (свежая версия, если есть интернет), без сети — из кэша.
   Иконки и манифест: из кэша. Новая версия игры подхватывается при следующем запуске с интернетом. */
const CACHE = 'nakormi-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // страница игры: сеть с проверкой свежести (304, если не менялась), запасной вариант — кэш
    e.respondWith(
      fetch(req.url, { cache: 'no-cache' })   // req.url: запрос навигации с параметрами создать нельзя
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
