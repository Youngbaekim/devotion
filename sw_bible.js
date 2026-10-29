const CACHE = '1426bible-v7';
const HTML_FILES = ['/devotion/bible.html'];
const BYPASS_DOMAINS = [
  'supabase.co','bible-api.com','bolls.life',
  'fonts.googleapis.com','fonts.gstatic.com',
  'cdn.jsdelivr.net','accounts.google.com'
];
self.addEventListener('install', e => { e.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (BYPASS_DOMAINS.some(d => url.includes(d))) return;
  if (HTML_FILES.some(f => url.includes(f)) || url.includes('/bible/') || url.includes('/commentary/')) {
    e.respondWith(fetch(e.request)
      .then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return res; })
      .catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request)));
});
