// verify-mini.mjs — самопроверка расчётного ядра: регрессия выпадает сразу.
// Запуск: node scripts/verify-mini.mjs (из app/).
import { computeMini, sigClass } from '../src/composables/miniModel.js'

let fails = 0
const ok = (cond, name) => {
  if (cond) { console.log(`  ✓ ${name}`) } else { fails++; console.log(`  ✗ ${name}`) }
}
const близко = (a, b, eps = 1e-6) => Math.abs(a - b) < eps

// Фикс «сегодня» для детерминизма: 15 августа 2026 (суббота).
const NOW = new Date(2026, 7, 15, 12, 0, 0)

console.log('── verify-mini ──')

// 1. Светофор.
ok(sigClass(1.0) === 'good' && sigClass(0.99) === 'warn' && sigClass(0.85) === 'warn'
  && sigClass(0.84) === 'bad' && sigClass(null) === 'idle', 'sigClass: 1.00/0.85/idle')

// 2. Сумма планов дней равна плану месяца ровно (неравные веса).
const set2 = {
  month: '2026-08', month_target: 3_100_000, month_goal: null,
  dow_coef: [0.8, 0.85, 0.9, 0.95, 1.1, 1.4, 1.3], carry: null, days: [],
}
const m2 = computeMini(set2, NOW)
ok(близко(m2.days.reduce((a, x) => a + x.plan, 0), 3_100_000), 'Σ план = month_target ровно')

// 3. Равные веса, факт = плану 10 дней → приземление = плану, onPlan = 1.
const days3 = []
for (let d = 1; d <= 10; d++) days3.push({ date: `2026-08-${String(d).padStart(2, '0')}`, rev: 100_000 })
const m3 = computeMini({ month: '2026-08', month_target: 3_100_000, dow_coef: [1,1,1,1,1,1,1], carry: null, days: days3 }, NOW)
ok(близко(m3.landing, 3_100_000, 1e-3), 'ровный темп → приземление = плану')
ok(близко(m3.onPlan, 1, 1e-9), 'onPlan = 1 при факте, равном плану')
ok(m3.goalState === 'ok', 'достижимость ok при ровном темпе')

// 4. Прошлое одной суммой: по 10-е = 1 000 000, дней по одному нет.
const m4 = computeMini({ month: '2026-08', month_target: 3_100_000, dow_coef: [1,1,1,1,1,1,1],
  carry: { upTo: '2026-08-10', amount: 1_000_000 }, days: [] }, NOW)
ok(m4.realizedRev === 1_000_000, 'сумма прошлого входит в факт')
ok(близко(m4.landing, 3_100_000, 1e-3), 'сумма прошлого: темп 100к/день → приземление 3,1 млн')
ok(m4.goalState === 'unknown', 'достижимость unknown: лучший день из суммы не восстановить')
ok(m4.days[0].inCarry && m4.weeks[0].rows[0].sig === 'carry', 'день из суммы серый, sig=carry')
ok(m4.days.filter((x) => x.inCarry).every((x) => x.need === null), 'дням из суммы need не ставится')

// 5. Недельный такт: август 2026 начинается в субботу; неделя 2 = 3–9 авг.
//    Внесены не все прошедшие дни недели 2 → неделя 3 заперта, ввод задним числом отпирает.
const days5 = [
  { date: '2026-08-01', rev: 90_000 }, { date: '2026-08-02', rev: 120_000 },
  { date: '2026-08-03', rev: 80_000 }, { date: '2026-08-04', rev: 85_000 },
  // 05–09 августа пропущены
]
const m5 = computeMini({ month: '2026-08', month_target: 3_100_000, dow_coef: [1,1,1,1,1,1,1], carry: null, days: days5 }, NOW)
const w5 = m5.weeks
ok(w5[0].complete && w5[0].open, 'неделя 1 полна и открыта')
ok(!w5[1].complete && w5[1].open, 'неделя 2 не полна, но открыта (первая незакрытая)')
ok(!w5[2].open, 'неделя 3 заперта: в неделе 2 дыры')
const days5b = days5.concat(['05', '06', '07', '08', '09'].map((d) => ({ date: `2026-08-${d}`, rev: 100_000 })))
const m5b = computeMini({ month: '2026-08', month_target: 3_100_000, dow_coef: [1,1,1,1,1,1,1], carry: null, days: days5b }, NOW)
ok(m5b.weeks[1].complete && m5b.weeks[2].open, 'ввод задним числом отпирает неделю 3')

// 6. Ноль — валидная выручка: день закрыт, недельный такт его принимает.
const m6 = computeMini({ month: '2026-08', month_target: 3_100_000, dow_coef: [1,1,1,1,1,1,1], carry: null,
  days: [{ date: '2026-08-01', rev: 0 }] }, NOW)
ok(m6.days[0].entered && m6.days[0].closed && !m6.days[0].due, 'ноль выручки закрывает день')

// 7. Цель опциональна: нет цели → goal null, шкала до плана.
ok(m3.goal === null, 'без цели goal = null (шкала до плана)')

// 8. Вне досягаемости: 10 слабых дней, план заведомо высокий.
const days8 = []
for (let d = 1; d <= 10; d++) days8.push({ date: `2026-08-${String(d).padStart(2, '0')}`, rev: 10_000 })
const m8 = computeMini({ month: '2026-08', month_target: 3_100_000, dow_coef: [1,1,1,1,1,1,1], carry: null, days: days8 }, NOW)
ok(m8.goalState === 'out', 'нужный темп выше лучшего дня → out')

console.log(fails ? `✗ провалов: ${fails}` : '✓ все проверки прошли')
process.exit(fails ? 1 : 0)
