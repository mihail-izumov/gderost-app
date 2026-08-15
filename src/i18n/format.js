// Локализованный вывод (ru-RU): неразрывный пробел в разрядах и перед знаком
// валюты, запятая в дробных, типографский минус. Везде null/NaN → прочерк «—»:
// ни нуля, ни пустой строки, ни «N/A» — пусто и ноль это разные вещи.

const NBSP = ' '
export const DASH = '—'

function safeNum(v) {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function formatInt(n) {
  const v = safeNum(n)
  if (v === null) return DASH
  return Math.round(v).toLocaleString('ru-RU').replace(/\s/g, NBSP)
}

export function formatRub(n) {
  const v = safeNum(n)
  if (v === null) return DASH
  return `${formatInt(v)}${NBSP}₽`
}

export function formatPct(n, digits = 1) {
  const v = safeNum(n)
  if (v === null) return DASH
  return `${v.toFixed(digits).replace('.', ',')}${NBSP}%`
}

// Отклонение от плана: +12,3 % / −5,1 %. На вход доля, не проценты.
export function formatGrowth(n, digits = 1) {
  const v = safeNum(n)
  if (v === null) return DASH
  const p = v * 100
  const sign = p > 0.05 ? '+' : p < -0.05 ? '−' : ''
  return `${sign}${Math.abs(p).toFixed(digits).replace('.', ',')}${NBSP}%`
}

// Компактные деньги для подписей: 5,9 млн ₽ / 750 тыс ₽ / 900 ₽.
export function formatRubCompact(n) {
  const v = safeNum(n)
  if (v === null) return DASH
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.', ',')}${NBSP}млн${NBSP}₽`
  if (abs >= 1_000) return `${Math.round(v / 1_000)}${NBSP}тыс${NBSP}₽`
  return `${formatInt(v)}${NBSP}₽`
}

// Плотные деньги для плиток и таблиц: 412k · 1,2 млн · 900 ₽.
// Латинская «k» взята из рабочего Ранскейла: в колонке из восьми чисел
// «412 тыс ₽» ломает ряд, а «412k» держит ширину и читается с одного взгляда.
export function formatK(n) {
  const v = safeNum(n)
  if (v === null) return DASH
  const abs = Math.abs(v)
  const sign = v < 0 ? '−' : ''
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1).replace('.', ',')}${NBSP}млн`
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}k`
  return `${sign}${formatInt(abs)}`
}

// Деньги для карточек-виджетов: «₽15,4 млн» — знак валюты впереди, как
// в рабочем Ранскейле, где эти карточки и живут.
export function formatRubBig(n) {
  const v = safeNum(n)
  if (v === null) return DASH
  const abs = Math.abs(v)
  const sign = v < 0 ? '−' : ''
  if (abs >= 1_000_000) return `${sign}₽${(abs / 1_000_000).toFixed(1).replace('.', ',')}${NBSP}млн`
  if (abs >= 1_000) return `${sign}₽${Math.round(abs / 1_000)}${NBSP}тыс`
  return `${sign}₽${formatInt(abs)}`
}

// «17,70 млн» — крупные числа шапки контроля дня, два знака после запятой.
export function formatMln(n) {
  const v = safeNum(n)
  if (v === null) return DASH
  return `${(v / 1_000_000).toFixed(2).replace('.', ',')}${NBSP}млн`
}

// 'YYYY-MM-DD' → '12.08.2026'. Дата среза данных печатается цифрами:
// подпись под заголовком читают взглядом, а не вслух.
export function stampISO(iso) {
  if (typeof iso !== 'string') return DASH
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}.${m}.${y}`
}

const MONTH_RU = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
]
const MONTH_RU_OF = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

// 'YYYY-MM' → 'август 2026'
export function monthLabel(ym) {
  if (typeof ym !== 'string') return DASH
  const [y, m] = ym.split('-')
  const mi = Number(m)
  if (!Number.isFinite(mi) || mi < 1 || mi > 12) return ym
  return `${MONTH_RU[mi - 1]} ${y}`
}

// 'YYYY-MM' → 'августа' — для подписей вида «перенесено из августа»
export function monthOf(ym) {
  if (typeof ym !== 'string') return DASH
  const mi = Number(ym.split('-')[1])
  if (!Number.isFinite(mi) || mi < 1 || mi > 12) return ym
  return MONTH_RU_OF[mi - 1]
}

// 'YYYY-MM-DD' → '11 августа'
export function dayLabel(iso) {
  if (typeof iso !== 'string') return DASH
  const [, m, d] = iso.split('-')
  const mi = Number(m)
  if (!Number.isFinite(mi) || mi < 1 || mi > 12) return iso
  return `${Number(d)} ${MONTH_RU_OF[mi - 1]}`
}

const DOW_RU_FULL = [
  'Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота',
]

// 'YYYY-MM-DD' → 'Вторник'. Подтверждение ввода называет день словом: «Вторник
// закрыт» человек прочитывает без сверки с календарём, «12.08 закрыт» — нет.
export function dowFullLabel(iso) {
  if (typeof iso !== 'string') return DASH
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return DASH
  const dt = new Date(y, m - 1, d)
  if (Number.isNaN(dt.getTime())) return DASH
  return DOW_RU_FULL[dt.getDay()]
}

const MONTH_RU_ABBR = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
]
const DOW_RU_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

// «Ср, 12 авг.» — календарная часть живой строки.
export function stampDateLabel(d = new Date()) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return DASH
  return `${DOW_RU_SHORT[d.getDay()]},${NBSP}${d.getDate()}${NBSP}${MONTH_RU_ABBR[d.getMonth()]}.`
}

// Часы и минуты порознь: двоеточие между ними живёт своей жизнью и пульсирует.
export function stampTimeParts(d = new Date()) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return { hh: '--', mm: '--' }
  const p = (n) => String(n).padStart(2, '0')
  return { hh: p(d.getHours()), mm: p(d.getMinutes()) }
}

// Диапазон недели: «10 — 16 августа», «27 июля — 2 августа», «29 декабря — 4 января».
// Месяц у первой даты печатается только когда он отличается от второго: неделя
// не должна стоять под шапкой месяца, которого в ней нет.
export function weekRangeLabel(fromISO, toISO) {
  if (typeof fromISO !== 'string' || typeof toISO !== 'string') return DASH
  const [, fm, fd] = fromISO.split('-')
  const [, tm, td] = toISO.split('-')
  const fi = Number(fm)
  const ti = Number(tm)
  if (!Number.isFinite(fi) || !Number.isFinite(ti) || fi < 1 || fi > 12 || ti < 1 || ti > 12) return DASH
  // Неделя в один день — не диапазон: «31 — 31 августа» читается как опечатка.
  if (fromISO === toISO) return `${Number(fd)} ${MONTH_RU_OF[fi - 1]}`
  const head = fi === ti ? `${Number(fd)}` : `${Number(fd)} ${MONTH_RU_OF[fi - 1]}`
  return `${head}${NBSP}—${NBSP}${Number(td)} ${MONTH_RU_OF[ti - 1]}`
}

// «5 дней» / «1 день» / «22 дня» — без этого подписи читаются как машинный вывод.
export function plural(n, one, few, many) {
  const v = Math.abs(Math.round(safeNum(n) ?? 0))
  const d10 = v % 10
  const d100 = v % 100
  if (d10 === 1 && d100 !== 11) return one
  if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return few
  return many
}

export function daysWord(n) { return plural(n, 'день', 'дня', 'дней') }
