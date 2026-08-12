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

// 'YYYY-MM-DD' → '11 августа'
export function dayLabel(iso) {
  if (typeof iso !== 'string') return DASH
  const [, m, d] = iso.split('-')
  const mi = Number(m)
  if (!Number.isFinite(mi) || mi < 1 || mi > 12) return iso
  return `${Number(d)} ${MONTH_RU_OF[mi - 1]}`
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
