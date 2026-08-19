const BUILD_ID = '__BUILD_ID__'          // подменяется на Date.now() при билде
const CACHE_NAME = 'gderost-' + BUILD_ID
const BASE = '/'
const SHELL_URL = BASE + 'index.html'

// Знаки бренда перечислены поимённо: они подключаются CSS-маской, поэтому
// в разметке страницы их адресов нет и вынуть их оттуда, как имена файлов
// сборки, невозможно. Без этой строки первый запуск без сети открывался бы
// с пустыми местами вместо имени продукта и знака системы.
const PRECACHE = [
  BASE, SHELL_URL,
  BASE + 'manifest.json',
  BASE + 'icon-192.png', BASE + 'icon-512.png', BASE + 'apple-touch-icon.png',
  BASE + 'runscale_chevron.svg', BASE + 'runscale_logo.svg',
  // Начертания бренда — по той же причине: они подключаются из CSS, в разметке
  // страницы их адресов нет. Без них первый запуск без сети покажет фолбэк,
  // и имя продукта наберётся не тем шрифтом.
  BASE + 'fonts/UniversLTCYR-67BoldCond.woff2',
  BASE + 'fonts/UniversLTCYR-57Condensed.woff2',
]

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

// Оболочка со всеми её файлами кладётся в кэш сразу при активации.
// Иначе получается ловушка: первую страницу браузер успевает загрузить до того,
// как обработчик заработал, в кэше оказывается только index.html, и первый же
// запуск без сети открывает пустой экран. Имена файлов взяты из самой страницы,
// а не зашиты списком: при следующей сборке они меняются.
async function precacheShell(cache) {
  const res = await fetch(SHELL_URL, { cache: 'reload' })
  const html = await res.text()
  await cache.put(SHELL_URL, new Response(html, { headers: res.headers }))
  const urls = []
  const re = /(?:src|href)="([^"]+)"/g
  let m
  while ((m = re.exec(html)) !== null) {
    if (m[1].startsWith(BASE + 'assets/')) urls.push(m[1])
  }
  if (urls.length) await cache.addAll(urls)
}

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    try {
      await precacheShell(await caches.open(CACHE_NAME))
    } catch {
      // Сети нет прямо сейчас — не беда: файлы осядут в кэше при первом обращении.
    }
    await self.clients.claim()
    const cs = await self.clients.matchAll({ type: 'window' })
    cs.forEach((c) => c.postMessage({ type: 'SW_ACTIVATED', cacheName: CACHE_NAME }))
  })())
})

// Обработчик называет свою версию по запросу страницы. Без этого клиент
// не мог отличить «новая версия встала» от «новой версии нет»: он смотрел
// на появление `installing` в регистрации, а оно появляется не сразу и не
// всегда — и приложение отвечало «уже последняя», когда обновление на самом
// деле шло. Версия — единственный факт, по которому это решается честно.
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'VERSION') {
    const reply = { type: 'VERSION', buildId: BUILD_ID, cacheName: CACHE_NAME }
    if (e.ports && e.ports[0]) e.ports[0].postMessage(reply)
    else if (e.source) e.source.postMessage(reply)
  }
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    // network-first: свежий index.html, офлайн — из кэша
    e.respondWith((async () => {
      try {
        const res = await fetch(req)
        const c = await caches.open(CACHE_NAME)
        c.put(SHELL_URL, res.clone())
        return res
      } catch {
        return (await caches.match(SHELL_URL)) || Response.error()
      }
    })())
    return
  }

  // cache-first для хешированных ассетов
  e.respondWith((async () => {
    const hit = await caches.match(req)
    if (hit) return hit
    const res = await fetch(req)
    if (res && res.ok) (await caches.open(CACHE_NAME)).put(req, res.clone())
    return res
  })())
})
