// Service Worker for caching articles with persistent storage
const CACHE_NAME = 'trans-parents-cache-v2';
const ARTICLES_CACHE = 'articles-cache-v2';
const STATIC_CACHE = 'static-cache-v2';

// 缓存文章页面的 URL 模式
const ARTICLE_URL_PATTERN = /^\/posts\/[^\/]+$/;

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/docs',
  '/manifest.json',
  '/favicon-32.png',
  '/favicon.svg'
];

// 缓存策略
const CACHE_STRATEGIES = {
  // 网络优先，但缓存失败的请求
  NETWORK_FIRST: 'network-first',
  // 缓存优先，网络作为后备
  CACHE_FIRST: 'cache-first',
  // 仅缓存（用于静态资源）
  CACHE_ONLY: 'cache-only'
};

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  event.waitUntil(
    Promise.all([
      // 缓存静态资源
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      // 预缓存一些关键资源
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll([
          '/assets/astro.svg',
          '/assets/background.svg'
        ].filter(url => STATIC_ASSETS.includes(url) === false));
      })
    ])
  );
  // 强制激活新的 Service Worker
  self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 删除旧版本的缓存
          if (cacheName !== CACHE_NAME && cacheName !== ARTICLES_CACHE && cacheName !== STATIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 立即接管所有客户端
      return self.clients.claim();
    })
  );
});

// 静态资源缓存优先策略
async function staticCacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Static cache first strategy failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// 缓存优先策略（用于文章页面）
async function cacheFirstStrategy(request) {
  // 先检查缓存
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('Serving article from cache:', request.url);
    return cachedResponse;
  }

  // 缓存中没有，从网络获取并缓存
  try {
    console.log('Fetching article from network:', request.url);
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(ARTICLES_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('Cached article:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch article:', error);
    return new Response('Offline - Please check your internet connection', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }

  // 只处理 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }

  // 处理文章页面请求 - 使用缓存优先策略
  if (ARTICLE_URL_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }

  // 处理静态资源请求 - 使用缓存优先策略
  if (STATIC_ASSETS.includes(url.pathname) ||
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/fonts/') ||
      url.pathname.startsWith('/styles/')) {
    event.respondWith(staticCacheFirstStrategy(event.request));
    return;
  }

  // 其他请求直接从网络获取
  event.respondWith(fetch(event.request));
});

// 监听消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // 手动清理缓存
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Clearing cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('All caches cleared');
    });
  }

  // 获取缓存状态
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    Promise.all([
      caches.open(ARTICLES_CACHE).then(cache => cache.keys()),
      caches.open(STATIC_CACHE).then(cache => cache.keys()),
      caches.open(CACHE_NAME).then(cache => cache.keys())
    ]).then(([articles, statics, general]) => {
      event.ports[0].postMessage({
        articlesCount: articles.length,
        staticCount: statics.length,
        generalCount: general.length
      });
    });
  }

  // 预缓存文章
  if (event.data && event.data.type === 'PRE_CACHE_ARTICLES') {
    const articles = event.data.articles || [];
    console.log('Pre-caching articles:', articles);

    caches.open(ARTICLES_CACHE).then(cache => {
      return Promise.all(
        articles.map(url => {
          return cache.match(url).then(cached => {
            if (!cached) {
              console.log('Pre-caching:', url);
              return cache.add(url).catch(err => {
                console.warn('Failed to pre-cache:', url, err);
              });
            }
          });
        })
      );
    });
  }
});

// 定期清理过期缓存（可选）
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupExpiredCaches());
  }
});

async function cleanupExpiredCaches() {
  // 这里可以实现更复杂的缓存清理逻辑
  // 例如：删除超过一定时间的缓存条目
  console.log('Running periodic cache cleanup');
}