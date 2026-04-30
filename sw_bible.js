const CACHE = '1426bible-v1';
const ASSETS = [
  '/devotion/bible.html',
  'https://fonts.googleapis.com/css2?family=KoPub+Dotum:wght@300;500&family=Noto+Serif+KR:wght@400;600&family=Noto+Sans+KR:wght@400;500;700;900&family=Nanum+Myeongjo:wght@400;700&family=Nanum+Gothic&display=swap'
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// 활성화: 이전 캐시 제거
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 요청 처리: 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', e => {
  // bible/ 폴더 JSON은 네트워크 우선 (최신 파일 유지)
  if (e.request.url.includes('/bible/')) {
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
  // 나머지는 캐시 우선
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
