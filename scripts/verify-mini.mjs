// verify-mini.mjs — самопроверка расчётного ядра: регрессия выпадает сразу.
// Запуск: node scripts/verify-mini.mjs (из app/).
import { computeMini, nextMonthState, sigClass } from '../src/composables/miniModel.js'
import { calibrateFromDays, observationsByDow, shapeStatus, shapeName } from '../src/data/weekShape.js'

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

// 9. Форма недели из собственных данных: пока каждый день недели не встретился
// достаточно раз, пересчёта не бывает — полусчитанной формы не существует.
const days9 = []
for (let d = 1; d <= 13; d++) days9.push({ date: `2026-08-${String(d).padStart(2, '0')}`, rev: 100_000 })
ok(calibrateFromDays(days9) === null, 'неполные наблюдения → пересчёта нет')

// 14 дней = по два наблюдения на каждый день недели. Выходные вдвое сильнее буден.
const days9b = []
for (let d = 1; d <= 14; d++) {
  const dow = (new Date(2026, 7, d).getDay() + 6) % 7
  days9b.push({ date: `2026-08-${String(d).padStart(2, '0')}`, rev: dow >= 5 ? 200_000 : 100_000 })
}
const cal = calibrateFromDays(days9b)
ok(cal !== null, 'два наблюдения на каждый день недели → форма считается')
ok(близко(cal.coef.slice(0, 5).reduce((a, x) => a + x, 0) / 5 * 2,
  cal.coef.slice(5).reduce((a, x) => a + x, 0) / 2, 0.02), 'выходные вдвое тяжелее буден')
ok(близко(cal.coef.reduce((a, x) => a + x, 0) / 7, 1, 0.02), 'средний вес нормирован к единице')
ok(observationsByDow(days9b).every((c) => c === 2), 'наблюдения считаются по дням недели')

// Пересчитанная форма не ломает главный инвариант плана.
const m9 = computeMini({ month: '2026-08', month_target: 3_100_000, dow_coef: cal.coef,
  carry: null, days: [] }, NOW)
ok(близко(m9.days.reduce((a, x) => a + x.plan, 0), 3_100_000, 1e-6),
  'Σ план = month_target на посчитанной форме недели')

// 10. История не перекрашивается: день помнит линейку, по которой его мерили.
// Месяц из 31 дня, равные веса, план 3 100 000 → план дня 100 000.
// День закрыт ровно в план и зелёный. Поднимаем план месяца вдвое.
const set10 = {
  month: '2026-08', month_target: 3_100_000, dow_coef: [1, 1, 1, 1, 1, 1, 1], carry: null,
  days: [{ date: '2026-08-03', rev: 100_000, planRef: 100_000 }],
}
const m10 = computeMini(set10, NOW)
const row10 = m10.days.find((x) => x.dd === 3)
ok(row10.planAt === 100_000 && sigClass(row10.fact / row10.planAt) === 'good',
  'день зелёный по линейке момента ввода')

const m10b = computeMini({ ...set10, month_target: 6_200_000 }, NOW)
const row10b = m10b.days.find((x) => x.dd === 3)
ok(row10b.plan === 200_000, 'план дня вырос вместе с планом месяца')
ok(row10b.planAt === 100_000 && sigClass(row10b.fact / row10b.planAt) === 'good',
  'закрытый день не покраснел от правки плана')
ok(m10b.weeks.flatMap((w) => w.rows).find((r) => r.dd === 3).sig === 'good',
  'оценка дня в недельной строке та же')

// Без запомненной линейки день меряется по текущей: оценка есть, а не пропадает.
const m10c = computeMini({ ...set10, month_target: 6_200_000, days: [{ date: '2026-08-03', rev: 100_000 }] }, NOW)
const row10c = m10c.days.find((x) => x.dd === 3)
ok(row10c.planAt === 200_000 && sigClass(row10c.fact / row10c.planAt) === 'bad',
  'без запомненной линейки берётся текущая')

// Хвост считается по действующему плану, а не по запомненному: обязательство сегодня.
ok(близко(m10b.days.filter((x) => !x.closed).reduce((a, x) => a + x.need, 0),
  6_200_000 - 100_000, 1e-6), 'хвост разносит остаток действующего плана')

// 11. Разнос стартовой суммы: раскладка, а не замер.
// Сумма по 10 августа раскладывается по весам своих дней; такие дни оценки
// не получают, в статистику дней не входят и исполнение плана не двигают.
const shape11 = [0.85, 0.9, 0.95, 1.0, 1.2, 1.15, 0.95]
const set11 = {
  month: '2026-08', month_target: 3_100_000, dow_coef: shape11,
  carry: { upTo: '2026-08-10', amount: 1_000_000, spread: true },
  days: [{ date: '2026-08-11', rev: 120_000, planRef: 100_000 }],
}
const m11 = computeMini(set11, NOW)
const m11off = computeMini({ ...set11, carry: { ...set11.carry, spread: false } }, NOW)
const spreadDays = m11.days.filter((x) => x.spread)
ok(spreadDays.length === 10, 'разнос покрывает ровно дни стартовой суммы')
ok(близко(spreadDays.reduce((a, x) => a + x.fact, 0), 1_000_000, 1e-6),
  'сумма разложенного равна стартовой сумме')
ok(spreadDays.every((x) => !x.entered), 'разложенный день не считается внесённым')
ok(m11.dayStats.total === 1 && m11off.dayStats.total === 1,
  'разложенные дни в dayStats не входят')
ok(m11.weeks.flatMap((w) => w.rows).filter((r) => r.spread).every((r) => r.sig === 'carry' && r.ratio === null),
  'разложенному дню светофор не ставится')
ok(близко(m11.onPlan, m11off.onPlan, 1e-9) && близко(m11.landing, m11off.landing, 1e-6),
  'разнос не меняет ни исполнение плана, ни приземление')
ok(близко(m11.realizedRev, m11off.realizedRev, 1e-6)
  && m11off.days.filter((x) => x.spread).length === 0,
  'выключение разноса возвращает модель к прежнему состоянию до значения')

// 12. Журнал прогноза: строка хранит состояние своего момента.
// Достижимость записана вместе со строкой; правка плана задним числом
// меняет сегодняшнюю достижимость и не трогает старые строки.
const set12 = {
  month: '2026-08', month_target: 3_100_000, dow_coef: [1, 1, 1, 1, 1, 1, 1], carry: null,
  days: [{ date: '2026-08-03', rev: 100_000, planRef: 100_000 }],
  forecastLog: [{ at: '2026-08-03', after: '2026-08-03', landing: 3_100_000, was: null, goalState: 'ok' }],
}
const m12 = computeMini(set12, NOW)
ok(m12.journal.length === 1 && m12.journal[0].goalState === 'ok',
  'строка журнала хранит достижимость момента')
const m12b = computeMini({ ...set12, month_target: 20_000_000 }, NOW)
ok(m12b.goalState === 'out' && m12b.journal[0].goalState === 'ok',
  'правка плана задним числом старую строку журнала не перекрашивает')
const m12c = computeMini({ ...set12, dow_coef: [0.5, 0.6, 0.7, 1, 1.5, 1.9, 0.8] }, NOW)
ok(m12c.journal[0].goalState === 'ok' && m12c.journal[0].landing === 3_100_000,
  'правка формы недели старую строку журнала не трогает')
const m12d = computeMini({ ...set12, forecastLog: [{ after: '2026-08-03', landing: 3_100_000 }] }, NOW)
ok(m12d.journal[0].goalState === null, 'у старой записи без состояния его и нет')

// 13. На день приходится одна строка журнала, и это последняя запись дня.
const m13 = computeMini({
  ...set12,
  forecastLog: [
    { after: '2026-08-03', landing: 3_100_000, goalState: 'ok' },
    { after: '2026-08-03', landing: 2_900_000, goalState: 'record' },
    { after: '2026-08-04', landing: 2_800_000, goalState: 'record' },
  ],
}, NOW)
ok(m13.journal.length === 2 && m13.journal[0].landing === 2_900_000
  && m13.journal[0].goalState === 'record', 'одна строка на день, значение последнее')

// 14. Подпись формы недели знает все свои состояния.
ok(shapeStatus('off').kind === 'off' && shapeStatus('off').label === 'выключено',
  'выключенная поправка подписана выключенной, а не формой отрасли')
ok(shapeStatus('moved', 0, 'default', '2026-08').label === 'перенесено'
  && shapeStatus('moved', 0, 'default', '2026-08').note.includes('августа'),
  'перенесённая форма подписана переносом и месяцем')
ok(shapeStatus('data', 14).label === 'посчитано' && shapeStatus('preset').label === 'допущение',
  'посчитанное и допущение подписаны как прежде')
ok(shapeName('off') === 'Выключено' && shapeName('moved', 'default', '2026-08') === 'Перенесено из августа',
  'имя формы совпадает с её состоянием')

// 15. Мягкий перенос месяца.
const set15 = {
  month: '2026-08', month_target: 3_100_000, month_goal: 3_500_000,
  dow_coef: [0.9, 0.95, 1, 1.05, 1.2, 1.1, 0.8], coef_src: 'data', shape_id: 'default',
  carry: { upTo: '2026-08-10', amount: 1_000_000, spread: true },
  days: [{ date: '2026-08-11', rev: 120_000, planRef: 100_000 }],
  forecastLog: [{ after: '2026-08-11', landing: 3_000_000, goalState: 'ok' }],
}
const n15 = nextMonthState(set15, { month: '2026-09', target: 3_300_000, goal: null })
ok(n15.month === '2026-09' && n15.month_target === 3_300_000 && n15.month_goal === null,
  'перенос ставит подтверждённые план и цель')
ok(n15.days.length === 0 && n15.forecastLog.length === 0 && n15.carry === null,
  'дни, журнал и стартовая сумма в новый месяц не переезжают')
ok(n15.dow_coef.join() === set15.dow_coef.join(), 'форма недели переезжает значениями')
ok(n15.coef_src === 'moved' && n15.shape_from === '2026-08',
  'посчитанная форма становится перенесённой из своего месяца')
ok(shapeStatus(n15.coef_src, 0, n15.shape_id, n15.shape_from).label === 'перенесено',
  'после переноса подпись формы честна')
const m15 = computeMini(n15, new Date(2026, 8, 3, 12, 0, 0))
ok(близко(m15.days.reduce((a, x) => a + x.plan, 0), 3_300_000, 1e-6),
  'Σ план = новому плану месяца')
ok(m15.realizedRev === 0 && m15.journal.length === 0 && m15.dayStats === null,
  'новый месяц начинается с чистых дней')
ok(m15.coefRows.every((r) => r.n === 0), 'наблюдения в новом месяце копятся заново')
const n15b = nextMonthState({ ...set15, coef_src: 'user' }, { month: '2026-09', target: 3_300_000 })
ok(n15b.coef_src === 'user' && n15b.shape_from === '',
  'своя настройка переносится собой: перекрашивать нечего')
ok(nextMonthState(set15, { month: '2026-09', target: 0 }) === null,
  'перенос без плана не происходит')

console.log(fails ? `✗ провалов: ${fails}` : '✓ все проверки прошли')
process.exit(fails ? 1 : 0)
