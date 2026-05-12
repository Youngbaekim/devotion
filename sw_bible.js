const CACHE = '1426bible-v2';
const ASSETS = [
  '/devotion/bible.html',
  '/devotion/bible2.html',
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 활성화: 이전 캐시 제거
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// 외부 API 도메인 — 항상 네트워크 직접 사용 (캐시 금지)
const BYPASS_DOMAINS = [
  'supabase.co',
  'bible-api.com',
  'bolls.life',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // 외부 API는 SW 우회 — 그냥 네트워크로
  if (BYPASS_DOMAINS.some(d => url.includes(d))) {
    return; // SW가 개입하지 않음
  }

  // bible/ 폴더 JSON — 네트워크 우선 (최신 유지)
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

  // 나머지 같은 도메인 파일 — 캐시 우선
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request))
  );
});
