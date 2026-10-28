// Service worker do COSMO: guarda o app para funcionar sem internet e os azulejos do mapa já vistos.
// Com internet, o app sempre vem da rede (versão nova assim que publicada); sem internet, vem do cache.
// Se mudar a lista de arquivos, aumente VERSION para o navegador refazer o cache e apagar o antigo.
const VERSION = 'cosmo-v2';
const TILES = 'cosmo-tiles-v1';
const APP_FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/main.js', 'js/util.js', 'js/ui.js', 'js/charts.js', 'js/fmt.js', 'js/physics.js', 'js/catalog.js', 'js/data.js', 'js/store.js', 'js/router.js',
  'js/screens/core.js', 'js/screens/ciencia.js', 'js/screens/fisica.js', 'js/screens/comunidade.js', 'js/screens/investigacao.js', 'js/screens/caixa.js',
  'fonts/poppins-400.ttf', 'fonts/poppins-600.ttf', 'fonts/poppins-700.ttf',
  'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];
const MAX_TILES = 500;
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => Promise.all(APP_FILES.map((f) => c.add(new Request(f, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== TILES).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_TILES) await Promise.all(keys.slice(0, keys.length - MAX_TILES).map((k) => cache.delete(k)));
}

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.hostname.endsWith('tile.openstreetmap.org')) { // azulejos: usa o guardado e atualiza em segundo plano
    e.respondWith(caches.open(TILES).then(async (cache) => {
      const hit = await cache.match(req);
      const net = fetch(req).then((r) => { if (r.ok || r.type === 'opaque') { cache.put(req, r.clone()); trim(cache); } return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  e.respondWith(caches.open(VERSION).then(async (cache) => { // app: rede primeiro; sem rede (ou lenta), cache
    try {
      const r = await withTimeout(fetch(req), NETWORK_TIMEOUT_MS);
      if (r.ok) cache.put(req, r.clone());
      return r;
    } catch {
      const hit = await cache.match(req, { ignoreSearch: true });
      return hit || (req.mode === 'navigate' ? cache.match('index.html') : Response.error());
    }
  }));
});
