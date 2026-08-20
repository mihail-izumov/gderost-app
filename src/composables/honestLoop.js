// Петля роста на плашке «Честная цифра»: данные → сигнал → действие → замер.
//
// Каждый сегмент — проверяемый факт из состояния месяца, а не оценка.
// Петля цепная: сегмент не загорается раньше предыдущего, потому что сигнал
// без данных и замер без действия — бессмыслица по построению.
//
//   данные   — в месяце есть факт: внесён хотя бы один день или разнесена
//              стартовая сумма. Модели есть из чего считать.
//   сигнал   — задан план месяца и посчитан прогноз: стоят разрыв
//              и «надо сегодня».
//   действие — есть день, внесённый при уже заданном плане: человек прожил
//              день, зная свою цифру, и принёс факт. Самого действия
//              приложение не видит и не изображает, что видит, — оно видит
//              его след в данных.
//   замер    — ни одного прошедшего дня без факта: прогноз стоит целиком
//              на данных. Пропущенный день размыкает кольцо, довнесённый —
//              смыкает обратно. Это единственный сегмент, который живёт
//              каждый день.
//
// Подпись называет состояние и ближайший шаг — первый погасший сегмент.
// Лестница статусов «со слов → посчитано → проверено» отсюда не исчезла:
// она стоит у каждого числа в шторке происхождения. Здесь живёт то,
// что человек меняет руками.

import { LOOP } from '../i18n/onboarding.js'

export function honestLoop(set, m) {
  const days = Array.isArray(set && set.days) ? set.days : []

  const data = !!m && (m.enteredCount > 0 || !!m.carry)
  const signal = data && m.T > 0 && m.landing != null
  const action = signal && days.some(
    (x) => x && Number.isFinite(Number(x.planRef)) && Number(x.planRef) > 0,
  )
  const measure = action && !!m && !m.days.some((d) => d.due)

  // Подписи и строки проверок — слова экрана, поэтому проходят голос витрины
  // (`docs/контент/ГОЛОС.md`): «замер» существительным на экран не выходит,
  // сегмент описывается тем, что человек сделал или ещё не сделал.
  // `check` — строка живого чек-листа в сторис: одна проверка одним фактом.
  const segs = [
    { id: 'data', label: LOOP.labelData, on: data, check: LOOP.checkData },
    { id: 'signal', label: LOOP.labelSignal, on: signal, check: LOOP.checkSignal },
    { id: 'action', label: LOOP.labelAction, on: action, check: LOOP.checkAction },
    { id: 'measure', label: LOOP.labelMeasure, on: measure, check: LOOP.checkMeasure },
  ]
  const lit = segs.filter((s) => s.on).length

  const note = !data ? LOOP.noteData
    : !signal ? LOOP.noteSignal
    : !action ? LOOP.noteAction
    : !measure ? LOOP.noteMeasure
    : LOOP.noteFull

  // Тот же смысл без обращения к читателю. На чужом месяце подпись владельца
  // превращается в команду тому, кто ничего внести не может: «внесите их»
  // адресовано человеку, у которого этих дней нет. Состояние остаётся тем же,
  // меняется только лицо, от которого оно сказано.
  const noteForeign = !data ? LOOP.foreignData
    : !signal ? LOOP.foreignSignal
    : !action ? LOOP.foreignAction
    : !measure ? LOOP.foreignMeasure
    : LOOP.foreignFull

  return { segs, lit, note, noteForeign }
}
