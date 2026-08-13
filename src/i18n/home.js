// Форматтеры Главной. Перенесены из рабочего Ранскейла: подписи виджетов
// и деки месяца обязаны выглядеть так же, иначе одно и то же число
// на двух экранах читается как два разных.

import { DASH } from './format.js'

const NBSP = ' '
const MINUS = '−'

// ₽-млн, только число до десятых: 5 402 293 → «5,4».
export function mlnNum(n) {
  if (n == null || !Number.isFinite(Number(n))) return DASH
  return (Number(n) / 1e6).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

// ₽-млн со знаком рубля слитно: «₽5,4 млн».
export function mlnRub(n) {
  if (n == null || !Number.isFinite(Number(n))) return DASH
  return `₽${(Number(n) / 1e6).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}${NBSP}млн`
}

// Накопленный хвост со знаком: «− ₽0,2 млн» — опережение, «+ ₽0,3 млн» — недобор.
export function mlnSigned(n) {
  if (n == null || !Number.isFinite(Number(n))) return DASH
  const v = Number(n)
  const sign = v < 0 ? MINUS : v > 0 ? '+' : ''
  const abs = (Math.abs(v) / 1e6).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return `${sign}${NBSP}₽${abs}${NBSP}млн`
}

// доля → «103,7%» (до десятых)
export function pct1(x) {
  if (x == null || !Number.isFinite(Number(x))) return DASH
  return `${(Number(x) * 100).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

// доля → «96%» (целое)
export function pctWhole(x) {
  if (x == null || !Number.isFinite(Number(x))) return DASH
  return `${Math.round(Number(x) * 100)}%`
}

// доля → «−7,7%» / «+2,3%»
export function pctDelta(x) {
  if (x == null || !Number.isFinite(Number(x))) return DASH
  const v = Number(x) * 100
  const sign = v < 0 ? MINUS : '+'
  return `${sign}${Math.abs(v).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

const MONTH = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

// 'YYYY-MM' → «Август 2026»
export function monthCap(ym) {
  if (typeof ym !== 'string') return ''
  const [y, m] = ym.split('-')
  const mi = Number(m)
  if (!(mi >= 1 && mi <= 12)) return ym
  return `${MONTH[mi - 1]}${NBSP}${y}`
}

// Склоняется НЕ только существительное, но и глагол: «остался 1 день», но
// «осталось 2 дня». Форма глагола берётся с того же числа — иначе на единице
// бейдж читается как ошибка.
export function plural(n, forms) {
  const v = Math.abs(Math.round(Number(n) || 0))
  const d10 = v % 10
  const d100 = v % 100
  if (d10 === 1 && d100 !== 11) return forms[0]
  if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return forms[1]
  return forms[2]
}
