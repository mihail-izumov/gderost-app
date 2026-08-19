// Обновление приложения. Две разные вещи, которые нельзя путать.
//
// **Обновление** — забрать свежую версию программы, если она вышла. Дёшево,
// занимает секунду-две и происходит по жесту и по кнопке.
//
// **Сброс** — снести кэши оболочки и обработчик и загрузить всё заново.
// Дорого: после него приложение тянет из сети шрифты, знаки и всю сборку.
// Это аварийный инструмент на случай «застряло на вчерашней версии»,
// он живёт отдельной строкой в шторке обновления.
//
// ⚠ Здесь была авария (Н-27). Сброс висел на жесте «потяни-обнови», то есть
// на самом частом движении пальца в приложении. Каждое случайное срабатывание
// выбрасывало человека на пять-десять секунд ожидания посреди работы, и это
// читалось падением, а не обновлением. Правило: частый жест не имеет права
// звать самое дорогое действие в программе.
//
// ⚠ И вторая авария, из-за которой этот файл переписан целиком (Н-31).
// Проверка спрашивала у браузера «появился ли новый обработчик» — то есть
// смотрела на СЛЕДСТВИЕ установки, а не на факт. Следствие приходит с
// задержкой и не всегда: приложение отвечало «Трек уже последней версии»
// ровно тогда, когда новая версия ставилась, и наоборот молчало, когда
// ставить было нечего. Ответ, который иногда врёт, хуже отсутствия ответа:
// человек перестаёт верить кнопке и жмёт её по кругу.
//
// Теперь решает ВЕРСИЯ СБОРКИ, и решает однозначно. У обработчика внутри
// стоит `BUILD_ID`, он называет его по запросу (`{ type: 'VERSION' }`).
// Тот же идентификатор лежит в `sw.js`, который отдаёт сеть. Разошлись —
// значит новая версия есть, и мы её ставим. Совпали — версия актуальная,
// и приложение так и говорит.
//
// Что не трогается ни тем, ни другим: введённые данные. Они лежат на
// устройстве и к кэшу оболочки отношения не имеют.

import { computed, ref } from 'vue'

// Состояние живёт модульным синглтоном: панель показывает оболочка, а зовут
// обновление из двух мест — жест и кнопка в шапке.
//
//   idle    — ничего не происходит
//   working — идёт проверка
//   install — версия найдена, ставим и сейчас перезагрузимся
//   fresh   — версия актуальная, ставить нечего
//   offline — сети нет, проверить нечем
//   failed  — проверить не удалось, и мы говорим об этом прямо
const state = ref('idle')

// Сколько состояние держится на экране минимум. Работа часто занимает
// двести миллисекунд, а мигнувшая и пропавшая панель читается сбоем:
// человек не успевает прочитать, что произошло, и жмёт второй раз.
const MIN_VISIBLE_MS = 900
// Сколько ждём ответа обработчика о своей версии.
const ASK_TIMEOUT_MS = 1500
// Сколько ждём, пока найденная версия встанет и заберёт управление.
const INSTALL_TIMEOUT_MS = 8000
// Сколько висит ответ перед тем, как панель уедет.
const ANSWER_MS = 1600

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/'

// Версия обработчика, который сейчас управляет страницей. Спрашиваем через
// личный канал: общий `message` у страницы один на всех, и чужой ответ
// сюда попасть не должен.
function askActiveVersion() {
  return new Promise((resolve) => {
    const sw = navigator.serviceWorker && navigator.serviceWorker.controller
    if (!sw) return resolve(null)
    let done = false
    const ch = new MessageChannel()
    const finish = (v) => { if (!done) { done = true; resolve(v) } }
    ch.port1.onmessage = (e) => finish(e.data && e.data.buildId ? String(e.data.buildId) : null)
    try { sw.postMessage({ type: 'VERSION' }, [ch.port2]) } catch { return finish(null) }
    setTimeout(() => finish(null), ASK_TIMEOUT_MS)
  })
}

// Версия, которая лежит в сети прямо сейчас. `cache: 'no-store'` обязателен:
// иначе браузер отдаст тот же файл, по которому и живёт старая версия.
async function fetchNetVersion() {
  const res = await fetch(`${BASE}sw.js?ts=${Date.now()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('sw unreachable')
  const text = await res.text()
  const m = text.match(/BUILD_ID\s*=\s*['"]([^'"]+)['"]/)
  return m ? m[1] : null
}

// Ждём, пока новая версия заберёт управление страницей. Наш обработчик зовёт
// `skipWaiting` и `clients.claim`, поэтому событие приходит само; в ответ
// на него мы и перезагружаемся.
function waitTakeover() {
  return new Promise((resolve) => {
    let done = false
    const finish = () => { if (!done) { done = true; resolve() } }
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', finish, { once: true })
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'SW_ACTIVATED') finish()
      })
    }
    setTimeout(finish, INSTALL_TIMEOUT_MS)
  })
}

export function useAppRefresh() {
  const status = computed(() => state.value)
  const busy = computed(() => state.value !== 'idle')

  // Обновление. Ничего не перезагружает, пока не убедится, что есть что.
  async function refresh() {
    if (typeof window === 'undefined' || state.value !== 'idle') return
    state.value = 'working'
    const started = Date.now()

    const hold = async () => {
      const left = MIN_VISIBLE_MS - (Date.now() - started)
      if (left > 0) await wait(left)
    }

    // Обработчика нет вовсе — dev-сборка или первый запуск: перезагрузка
    // и есть единственное честное действие.
    if (!('serviceWorker' in navigator)) {
      await hold()
      window.location.reload()
      return
    }

    let net = null
    try {
      net = await fetchNetVersion()
    } catch {
      await hold()
      state.value = navigator.onLine === false ? 'offline' : 'failed'
      await wait(ANSWER_MS)
      state.value = 'idle'
      return
    }

    const mine = await askActiveVersion()

    // Версии совпали — ставить нечего, и это законное состояние, а не отказ.
    if (net && mine && net === mine) {
      await hold()
      state.value = 'fresh'
      await wait(ANSWER_MS)
      state.value = 'idle'
      return
    }

    // Дальше два случая: версии разошлись (есть новая) либо обработчик
    // не ответил и сравнивать не с чем. Оба честно решаются установкой:
    // хуже от неё не станет, а вопрос закрывается фактом.
    state.value = 'install'
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.update()
        await waitTakeover()
      }
    } catch {
      // Не получилось — перезагружаемся всё равно: свежий `index.html`
      // придёт сетью, и новая сборка подхватится.
    }
    await hold()
    window.location.reload()
  }

  return { status, busy, refresh, hardReload }
}

// Аварийный сброс. Чистятся кэши оболочки и зарегистрированный обработчик;
// введённые данные не трогаются — кнопка обновляет программу, а не стирает
// работу, и путать эти две вещи нельзя.
export async function hardReload() {
  if (typeof window === 'undefined') return
  state.value = 'install'
  try {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
  } catch {
    // Не получилось почистить — перезагружаемся всё равно: хуже не станет.
  }
  window.location.reload()
}
