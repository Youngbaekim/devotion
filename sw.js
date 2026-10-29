// devotion service worker (index.html + bible.html share this one worker)
// VERSION is bumped automatically by deploy.ps1 on every deploy.
const VERSION = '20261029-235203';
const SHELL = 'devotion-shell-' + VERSION;   // pages, icons: replaced every deploy
const DATA  = 'devotion-data-v1';            // bible / commentary JSON: kept across deploys
const FONTS = 'devotion-fonts-v1';           // web fonts: kept across deploys
const BYPASS = ['supabase.co', 'bible-api.com', 'bolls.life', 'accounts.google.com'];

self.addEventListener('install', () => {});  // wait; the page asks before switching

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => ![SHELL, DATA, FONTS].includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// '새로고침' button on the page -> activate the new version now
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

const isFont = u => u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com' ||
  (u.hostname === 'cdn.jsdelivr.net' && u.pathname.includes('pretendard'));

function networkFirst(req, cacheName) {
  return fetch(req)
    .then(res => { if (res.ok) { const c = res.clone(); caches.open(cacheName).then(x => x.put(req, c)); } return res; })
    .catch(() => caches.match(req));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (BYPASS.some(d => url.hostname.includes(d))) return;

  if (isFont(url)) {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone()).catch(() => {});
      return res;
    }));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // pages: latest first, cached copy when offline
  if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/devotion/')) {
    e.respondWith(networkFirst(req, SHELL));
    return;
  }
  // bible text / commentary
  if (url.pathname.includes('/bible/') || url.pathname.includes('/commentary/')) {
    e.respondWith(networkFirst(req, DATA));
    return;
  }
  // icons, manifest etc.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const c = res.clone(); caches.open(SHELL).then(x => x.put(req, c)); }
    return res;
  })));
});
