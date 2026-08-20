// shareReason.js — когда приходит предложение поделиться. Чистый JS, без vue
// и DOM: правило показа проверяется самопроверкой, а не глазами на экране.
//
// Поводов четыре, и они идут по возрастанию доступной правды: заявка на старт
// (`start`), первый прогноз (`pace`), серия (`week`), результат (`month`).
// Слова каждого — `i18n/share.js`, здесь только условия.
//
// ⚠ Считается ТОЛЬКО внесённое руками. Стартовая сумма разносится по уже
// прошедшим дням при подключении, и если считать их, человек, подключившийся
// 17-го и назвавший сумму за первые шестнадцать дней, получит `pace` и `week`
// в первую же секунду — до того, как внёс хоть один день. Ни `inCarry`,
// ни `spread` в условия не входят нигде.
//
// ⚠ Старший повод забирает показ. Совпали несколько — приходит один, старший;
// младшие остаются непоказанными и приходят заново в следующем месяце, если
// условие снова выполнится. Двух шторок подряд не бывает: четыре предложения
// за тридцать дней — уже на грани, и тон между ними не повышается.

import { todayISO } from './miniModel.js'

/** Старшинство: старший забирает показ. */
export const SHARE_ORDER = ['month', 'week', 'pace', 'start']

/** Порог первого прогноза. Правило показа, а не расчёта: три точки — минимум,
 *  на котором темп перестаёт скакать от одного выходного. Меняется здесь. */
export const PACE_DAYS = 3

/**
 * Какие поводы выполнены на этой модели месяца.
 *
 * @param {object} m модель из `computeMini`
 * @param {Date} now «сегодня» — передаётся в тестах ради воспроизводимости
 * @returns {{start:boolean, pace:boolean, week:boolean, month:boolean}}
 */
export function shareConditions(m, now = new Date()) {
  const none = { start: false, pace: false, week: false, month: false }
  if (!m || !(Number(m.T) > 0)) return none

  const today = todayISO(now)
  const entered = Number(m.enteredCount) || 0

  // Месяц кончился календарно: последний его день уже прожит.
  const lastISO = m.days && m.days.length ? m.days[m.days.length - 1].iso : ''
  const monthOver = !!lastISO && lastISO < today

  // Полная неделя — не `w.complete`: у будущей недели нет прошедших
  // невнесённых дней, поэтому она полна по определению. Повод настоящий,
  // когда неделя кончилась календарно и каждый её день внесён руками.
  const weekDone = (m.weeks || []).some((w) => w.days.length === 7
    && w.days[w.days.length - 1].iso < today
    && w.days.every((d) => d.entered))

  return {
    // План поставлен, счёт пошёл. Цель условием не ставится: она в модели
    // необязательна, и многие её пропускают — сообщение до них не дошло бы.
    start: entered >= 1,
    pace: entered >= PACE_DAYS,
    week: weekDone,
    // Месяц с дырами не закрыт. «94 % плана, внесено 19 из 31» — неполный
    // замер, и уезжать из приложения он не должен.
    month: monthOver && entered === Number(m.DIM),
  }
}

/** Старший выполненный повод. Пустая строка — ни одного. */
export function topShareReason(m, now = new Date()) {
  const c = shareConditions(m, now)
  return SHARE_ORDER.find((id) => c[id]) || ''
}

/**
 * Повод, который показывается сейчас.
 *
 * Старший выполненный уже показан — не показывается ничего: младшие он забрал
 * себе в момент совпадения, и подсовывать их следом значит повышать тон.
 */
export function shareReason(m, seen = [], now = new Date()) {
  const top = topShareReason(m, now)
  if (!top) return ''
  return (seen || []).includes(top) ? '' : top
}
