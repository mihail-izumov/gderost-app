// Ссылка на месяц — состояние, уехавшее в саму ссылку.
//
// Сервера нет и не будет, поэтому месяц кодируется во фрагмент адреса (всё,
// что после «#»). Фрагмент браузер на сервер не отправляет: хостинг его
// не видит, в логах его нет, сохранить его негде. Данные покидают устройство
// ровно тогда, когда владелец сам отправил ссылку, и ровно тому, кому отправил.
//
// Почему ссылка, а не файл: партнёр, бухгалтер или инженер на разборе открывает
// её одним касанием и видит тот же месяц теми же числами. Файл остаётся —
// он нужен, когда месяц уходит в чужой разбор насовсем.
//
// Ключи сокращены не ради красоты: длинная ссылка ломается в мессенджерах.
// Дни хранятся числом месяца, а не датой, — тридцать одна дата в ссылке
// занимает вдвое больше самой выручки.

export const SHARE_VERSION = 1
export const HASH_PREFIX = '#m='

// Два режима ссылки, потому что получателей два.
//
//   full   — весь месяц с суммами. Партнёру, бухгалтеру, инженеру на разборе:
//            они и так знают эти числа, и без них сводка бесполезна.
//   growth — рост без сумм. Клубу, спору, сториз: выручка малого бизнеса — то,
//            что владелец не говорит вслух.
//
// ⚠ В режиме роста суммы НЕ уезжают вовсе, а не прячутся на экране. Спрятанное
// число остаётся в адресе, и любой, кто умеет читать ссылку, достанет его
// обратно. Поэтому деньги нормализуются к плану ДО упаковки: план становится
// условной величиной `GROWTH_BASE`, дни, стартовая сумма и цель пересчитываются
// тем же множителем. Все отношения — процент плана, форма месяца, счёт дней —
// линейны и сохраняются точно, а выручки в ссылке не существует.
export const SHARE_MODES = ['growth', 'full']
export const GROWTH_BASE = 1_000_000

/** base64url без завязки на Node: работает в браузере и в самопроверке. */
function toB64Url(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  bytes.forEach((b) => { bin += String.fromCharCode(b) })
  const b64 = typeof btoa === 'function'
    ? btoa(bin)
    : Buffer.from(bytes).toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64Url(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : ''
  if (typeof atob === 'function') {
    const bin = atob(b64 + pad)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return new TextDecoder().decode(bytes)
  }
  return Buffer.from(b64 + pad, 'base64').toString('utf8')
}

const dayNum = (iso) => Number(String(iso).slice(8, 10))
const isoOf = (month, dd) => `${month}-${String(dd).padStart(2, '0')}`

/**
 * Множитель нормализации. План месяца становится `GROWTH_BASE`, всё остальное
 * едет через тот же множитель. Плана нет — нормализовать не от чего, и режим
 * роста не строится: без плана процент выполнения не существует.
 */
function growthScale(s) {
  const T = Number(s && s.month_target) || 0
  return T > 0 ? GROWTH_BASE / T : 0
}

/** Состояние → компактный объект. Ничего, кроме месяца, в него не попадает. */
export function packState(s, mode = 'growth') {
  if (!s || !s.month) return null
  const growth = mode === 'growth'
  const k = growth ? growthScale(s) : 1
  // Плана нет — режим роста невозможен: мерить процент выполнения не от чего.
  if (growth && !k) return null
  const money = (v) => {
    const n = Number(v) || 0
    return growth ? Math.round(n * k) : n
  }
  const out = {
    v: SHARE_VERSION,
    // Режим едет в самой ссылке: экран получателя решает по нему, показывать
    // ли суммы. Старые ссылки поля не имеют и читаются полными, как и были.
    r: growth ? 'g' : 'f',
    c: s.company || '',
    u: s.unit || '',
    m: s.month,
    t: money(s.month_target),
    g: Number(s.month_goal) > 0 ? money(s.month_goal) : 0,
    k: (s.dow_coef || []).map((x) => Number(x)),
    ks: s.coef_src || 'preset',
    ki: s.shape_id || 'default',
    kf: s.shape_from || '',
    // День: [число месяца, выручка, линейка момента ввода]. Линейка нужна,
    // иначе у получателя дни перекрасятся по сегодняшнему плану — ровно то,
    // что приложение обещает не делать.
    d: (s.days || []).map((x) => [dayNum(x.date), money(x.rev), x.planRef ? money(x.planRef) : 0]),
    // Журнал прогноза: день, приземление, что было, достижимость, дата записи.
    // В режим роста не едет: на том экране его нет, а ссылка без него короче
    // примерно на треть.
    j: growth ? [] : (s.forecastLog || []).map((e) => [
      dayNum(e.after), Math.round(Number(e.landing) || 0),
      e.was == null ? -1 : Math.round(Number(e.was)), e.goalState || '', e.at || '',
    ]),
  }
  if (s.carry) out.y = [s.carry.upTo, money(s.carry.amount), s.carry.spread ? 1 : 0]
  return out
}

/** Компактный объект → состояние приложения. Чужие поля не проходят. */
export function unpackState(p) {
  if (!p || typeof p !== 'object' || p.v !== SHARE_VERSION || !p.m) return null
  const month = String(p.m)
  // Месяц обязан быть месяцем: на выдуманной строке ядро не считает ничего,
  // и экран получателя остался бы пустым без объяснения.
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return null
  const coef = Array.isArray(p.k) && p.k.length === 7 ? p.k.map(Number) : null
  if (!coef || coef.some((x) => !Number.isFinite(x) || x <= 0)) return null
  if (!Number.isFinite(Number(p.t))) return null
  return {
    ready: true,
    // Режим: экран получателя решает по нему, показывать ли суммы. У ссылок,
    // выпущенных до появления поля, режим полный — таким он и был.
    shareMode: p.r === 'g' ? 'growth' : 'full',
    company: String(p.c || ''),
    unit: String(p.u || ''),
    month,
    month_target: Number(p.t) || 0,
    month_goal: Number(p.g) > 0 ? Number(p.g) : null,
    dow_coef: coef,
    coef_src: String(p.ks || 'preset'),
    shape_id: String(p.ki || 'default'),
    shape_from: String(p.kf || ''),
    carry: Array.isArray(p.y)
      ? { upTo: String(p.y[0]), amount: Number(p.y[1]) || 0, spread: !!p.y[2] }
      : null,
    days: (Array.isArray(p.d) ? p.d : []).map((x) => ({
      date: isoOf(month, x[0]), rev: Number(x[1]) || 0, planRef: Number(x[2]) || undefined,
    })),
    forecastLog: (Array.isArray(p.j) ? p.j : []).map((e) => ({
      after: isoOf(month, e[0]),
      landing: Number(e[1]) || 0,
      was: Number(e[2]) === -1 ? undefined : Number(e[2]),
      goalState: String(e[3] || ''),
      at: String(e[4] || ''),
    })),
  }
}

/** Состояние → строка для фрагмента адреса. */
export function encodeState(s, mode = 'growth') {
  const packed = packState(s, mode)
  return packed ? toB64Url(JSON.stringify(packed)) : ''
}

/** Строка из фрагмента → состояние. Мусор молча превращается в null. */
export function decodeState(code) {
  if (!code) return null
  try {
    return unpackState(JSON.parse(fromB64Url(String(code))))
  } catch {
    return null
  }
}

/** Готовая ссылка на месяц от текущего адреса приложения. */
export function shareUrl(s, base, mode = 'growth') {
  const code = encodeState(s, mode)
  if (!code) return ''
  const root = String(base || '').split('#')[0]
  return `${root}${HASH_PREFIX}${code}`
}

/** Прочитать состояние из адреса. Пусто — обычный запуск приложения. */
export function readShared(hash) {
  const h = String(hash || '')
  if (!h.startsWith(HASH_PREFIX)) return null
  return decodeState(h.slice(HASH_PREFIX.length))
}

/**
 * Была ли в адресе попытка открыть месяц. Нужна, чтобы отличить обычный
 * запуск от оборванной ссылки: месяц не открылся — человек обязан узнать
 * об этом, а не решить, что владелец прислал ему приложение.
 */
export function hasSharePayload(hash) {
  return String(hash || '').startsWith(HASH_PREFIX)
}
