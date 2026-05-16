const CACHE = '1426bible-v4';

// HTML 파일은 캐시 안 함 — 항상 최신본을 네트워크에서
const HTML_FILES = ['/devotion/bible.html', '/devotion/bible2.html'];

// 외부 API — SW 완전 우회
const BYPASS_DOMAINS = [
  'supabase.co',
  'bible-api.com',
  'bolls.life',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

self.addEventListener('install', e => {
  // HTML은 캐시하지 않고 바로 활성화
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // 외부 API — SW 개입 안 함
  if (BYPASS_DOMAINS.some(d => url.includes(d))) return;

  // HTML 파일 — 항상 네트워크 우선, 실패 시에만 캐시
  if (HTML_FILES.some(f => url.includes(f))) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // bible/ JSON 파일 — 네트워크 우선 (최신 유지)
  if (url.includes('/bible/')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // 나머지 정적 파일 (아이콘, JS 등) — 캐시 우선
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request))
  );
});
