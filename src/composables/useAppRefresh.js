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
// Что не трогается ни тем, ни другим: введённые данные. Они лежат на
// устройстве и к кэшу оболочки отношения не имеют.

import { computed, ref } from 'vue'

// Состояние живёт модульным синглтоном: панель показывает оболочка, а зовут
// обновление из двух мест — жест и кнопка в шапке.
//
//   idle    — ничего не происходит
//   working — идёт проверка и, если есть что, установка новой версии
//   fresh   — новой версии нет, приложение уже последнее
//   offline — сети нет, проверить нечем
const state = ref('idle')

// Сколько состояние держится на экране минимум. Работа часто занимает
// двести миллисекунд, а мигнувшая и пропавшая панель читается сбоем:
// человек не успевает прочитать, что произошло, и жмёт второй раз.
const MIN_VISIBLE_MS = 900
// Дольше этого не ждём: версия ставится где-то в сети, а человек смотрит
// в экран. Не дождались — перезагружаемся, новая версия доедет сама.
const INSTALL_TIMEOUT_MS = 8000
// Сколько висит ответ «уже последняя» перед тем, как панель уедет.
const ANSWER_MS = 1500

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// Ждём, пока новый обработчик доберётся до рабочего состояния. Наш `sw.js`
// зовёт `skipWaiting()` при установке, поэтому ожидание короткое: установился —
// значит вот-вот заменит собой старый.
function waitInstalled(worker) {
  return new Promise((resolve) => {
    if (['installed', 'activating', 'activated'].includes(worker.state)) return resolve(true)
    const onChange = () => {
      if (['installed', 'activating', 'activated'].includes(worker.state)) {
        worker.removeEventListener('statechange', onChange)
        resolve(true)
      }
      if (worker.state === 'redundant') {
        worker.removeEventListener('statechange', onChange)
        resolve(false)
      }
    }
    worker.addEventListener('statechange', onChange)
  })
}

// Есть ли новая версия. Возвращает true, только когда она действительно
// появилась и встала: перезагружать страницу ради ничего — обман.
async function fetchUpdate() {
  if (!('serviceWorker' in navigator)) return 'reload' // dev-сборка: обработчика нет
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return 'reload'

  // `update()` идёт в сеть за `sw.js`. В нём стоит идентификатор сборки,
  // поэтому у новой версии файл отличается байтами и браузер видит замену.
  await reg.update()

  const next = reg.installing || reg.waiting
  if (!next) return 'none'

  const settled = await Promise.race([
    waitInstalled(next),
    wait(INSTALL_TIMEOUT_MS).then(() => true),
  ])
  return settled ? 'updated' : 'none'
}

export function useAppRefresh() {
  const status = computed(() => state.value)
  const busy = computed(() => state.value !== 'idle')

  // Обновление. Ничего не перезагружает, пока не убедится, что есть что.
  async function refresh() {
    if (typeof window === 'undefined' || state.value !== 'idle') return
    state.value = 'working'
    const started = Date.now()

    let result
    try {
      result = await fetchUpdate()
    } catch {
      // Единственная причина, по которой проверка падает, — сеть.
      // Молчать здесь нельзя: человек решит, что обновился, а он нет.
      result = navigator.onLine === false ? 'offline' : 'none'
    }

    const left = MIN_VISIBLE_MS - (Date.now() - started)
    if (left > 0) await wait(left)

    if (result === 'updated' || result === 'reload') {
      window.location.reload()
      return
    }

    state.value = result === 'offline' ? 'offline' : 'fresh'
    await wait(ANSWER_MS)
    state.value = 'idle'
  }

  return { status, busy, refresh, hardReload }
}

// Аварийный сброс. Чистятся кэши оболочки и зарегистрированный обработчик;
// введённые данные не трогаются — кнопка обновляет программу, а не стирает
// работу, и путать эти две вещи нельзя.
export async function hardReload() {
  if (typeof window === 'undefined') return
  state.value = 'working'
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
