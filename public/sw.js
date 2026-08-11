const BUILD_ID = '__BUILD_ID__'          // подменяется на Date.now() при билде
const CACHE_NAME = 'gderost-' + BUILD_ID
const BASE = '/'
const SHELL_URL = BASE + 'index.html'

const PRECACHE = [
  BASE, SHELL_URL,
  BASE + 'manifest.json',
  BASE + 'icon-192.png', BASE + 'icon-512.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    await self.clients.claim()
    const cs = await self.clients.matchAll({ type: 'window' })
    cs.forEach((c) => c.postMessage({ type: 'SW_ACTIVATED', cacheName: CACHE_NAME }))
  })())
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
