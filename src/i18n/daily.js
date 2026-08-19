// Словарь и форматтеры «Контроля Дня». Перенесены из рабочего Ранскеила
// один в один вместе с причинами — там эти решения уже проверены людьми.
//
// Расхождение с оригиналом ровно одно и оно словарное: там верхняя величина
// месяца называется целью, здесь — планом. В этом приложении план и цель
// разные вещи (план — обязательство, цель — то, ради чего стараются сверх
// него), и назвать план целью значило бы сломать словарь на всех экранах.

import { formatInt, formatGrowth, DASH } from './format.js'

const NBSP = ' '

// «4,77 млн» (два знака) — шапка, прогноз, недели.
export function mln(n) {
  if (n == null || !Number.isFinite(Number(n))) return DASH
  return `${(Number(n) / 1e6).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${NBSP}млн`
}

// «128k» — таблицы дней. Суффикс именно «k», а не «тыс»: четыре колонки должны
// влезать в мобильную колонку без горизонтального скролла, а «тыс» с неразрывным
// пробелом съедает четыре знака в каждой ячейке. Пробела перед «k» намеренно нет —
// он вернул бы половину потери.
export function ths(n) {
  if (n == null || !Number.isFinite(Number(n))) return DASH
  return `${formatInt(Math.round(Number(n) / 1000))}k`
}

// «+128k» / «−128k», минус типографский.
export function thsSigned(n) {
  if (n == null || !Number.isFinite(Number(n))) return DASH
  const v = Number(n)
  return `${v >= 0 ? '+' : '−'}${formatInt(Math.round(Math.abs(v) / 1000))}k`
}

// доля → «+1,4 %» / «−8,2 %»
export function pctSigned(x) {
  if (x == null || !Number.isFinite(Number(x))) return DASH
  return formatGrowth(Number(x))
}

// доля → «95%» без знака
export function pctWhole(x) {
  if (x == null || !Number.isFinite(Number(x))) return DASH
  return `${Math.round(Number(x) * 100)}%`
}

const MONTH_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

// число месяца + 'YYYY-MM' → «13 июля»
export function dayGen(dd, ym) {
  const mi = Number(String(ym).split('-')[1])
  return `${dd} ${MONTH_GEN[mi - 1] || ''}`
}
export function dayGenIso(iso) {
  return dayGen(Number(String(iso).slice(8)), String(iso).slice(0, 7))
}

// Заливка по классу светофора. Цветом говорит только сигнал, текст монохромный.
export const SIG_VAR = {
  good: 'var(--positive)',
  warn: 'var(--warning)',
  bad: 'var(--negative)',
  carry: 'var(--text-muted)',
  idle: 'var(--line)',
}

// Три состояния достижимости. Цветная только точка-индикатор, рядом с ней
// смысл дублируется словами: цвет без слова не читается дальтоником и
// не читается вслух.
// Метка состояния — самостоятельное высказывание, а не хвост чужой фразы:
// она стоит бейджем на «Сигналах», строкой в шапке «Контроля Дня» и нигде
// не продолжает предложение. Поэтому прописная буква в начале.
export const GOAL_STATE = {
  ok: { dot: 'var(--positive)', label: 'План достижим', journal: '✓ достижим' },
  record: { dot: 'var(--warning)', label: 'Нужен рекордный темп', journal: '↑ рекордный темп' },
  out: { dot: 'var(--negative)', label: 'Фокус — минимум отставания', journal: 'вне досягаемости' },
  unknown: { dot: 'var(--text-muted)', label: 'Сравнивать пока не с чем', journal: 'нет дневного факта' },
  // Строка журнала, записанная до того, как достижимость стала запоминаться.
  // Подставить сегодняшнее состояние нельзя: это и была бы та перекраска
  // истории, от которой колонку чинили.
  none: { dot: 'var(--line)', label: '—', journal: '—' },
}

export const L = {
  back: 'Главная',
  title: 'Контроль Дня',
  target: 'План месяца',
  forecast: 'Прогноз выручки',
  forecast_hint: 'при текущем темпе',
  to_earn: 'осталось заработать',
  earned: 'заработано',
  will_add: 'прогноз добавит',
  gap: 'по прогнозу не хватит',
  kpi_earned: 'Заработано',
  kpi_onplan: 'Идём к плану',
  kpi_tail: 'Хвост накоплен',
  kpi_pace: 'Нужный темп',
  by_weeks: 'По неделям',
  summary: 'Сводка по неделям',
  month: 'Месяц',
  days_by_plan: 'Дни по плану',
  above: 'выше плана',
  close: 'близко 85–99%',
  below: 'ниже 85%',
  journal: 'Журнал прогноза',
  coef: 'Дни недели',
  assume: 'допущение',
  add_report: 'Добавить отчёт',
  refrain: 'Рост не ждёт.',
  motto: 'Рост — это не решение.\nЭто команда.',
}
