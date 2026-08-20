// verify-mini.mjs — самопроверка расчётного ядра: регрессия выпадает сразу.
// Запуск: node scripts/verify-mini.mjs (из app/).
import { computeMini, nextMonthState, sigClass } from '../src/composables/miniModel.js'
import { calibrateFromDays, observationsByDow, shapeStatus, shapeName } from '../src/data/weekShape.js'
import { computeEnergy, computeGaps, moduleGain, LEVELS, PATH_VISIBLE, PART, PARTS, MODULE_LIFTS } from '../src/composables/energyModel.js'
import { encodeState, decodeState, readShared, shareUrl, hasSharePayload, packState, GROWTH_BASE } from '../src/composables/shareLink.js'
import { MODULES, SESSIONS, BY_LABEL, isLocked, ORIGINS, SIGNAL } from '../src/i18n/energy.js'
import { INTRO_STORY, honestStory } from '../src/i18n/stories.js'
import { HEAD, LEVEL_ROWS } from '../src/i18n/growth247.js'
import { TELEMETRY, COUNTERS, scoreNow } from '../src/data/runscaleCounters.js'
import { computeTodaySignal } from '../src/composables/signalModel.js'
import { honestLoop } from '../src/composables/honestLoop.js'
import { PULL, pullOffset, canStartPull, shouldFirePull } from '../src/composables/pullGesture.js'
import { initialNav, navigate, back as navBack, selectTab as navSelectTab } from '../src/composables/navFlow.js'
import { pickState, stateInk, BADGE_PRIORITY } from '../src/composables/stateBadge.js'
import { shareConditions, topShareReason, shareReason, SHARE_ORDER, PACE_DAYS } from '../src/composables/shareReason.js'
import { shareText } from '../src/i18n/share.js'

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

// 3а. Стрелка динамики на виджете «Контроль Дня»: куда движется исполнение
// плана. Три состояния и ни одного четвёртого; сравнивать не с чем — стрелки
// нет вовсе. Ровный темп даёт «flat»: отношение стоит на месте.
ok(m3.onPlanTrend === 'flat', 'ровный темп → стрелка «ровно»')

const trendUp = computeMini({ month: '2026-08', month_target: 3_100_000, dow_coef: [1,1,1,1,1,1,1], carry: null,
  days: [{ date: '2026-08-01', rev: 50_000 }, { date: '2026-08-02', rev: 200_000 }] }, NOW)
ok(trendUp.onPlanTrend === 'up', 'день выше прежнего темпа → стрелка вверх')

const trendDown = computeMini({ month: '2026-08', month_target: 3_100_000, dow_coef: [1,1,1,1,1,1,1], carry: null,
  days: [{ date: '2026-08-01', rev: 200_000 }, { date: '2026-08-02', rev: 50_000 }] }, NOW)
ok(trendDown.onPlanTrend === 'down', 'день ниже прежнего темпа → стрелка вниз')

const trendOne = computeMini({ month: '2026-08', month_target: 3_100_000, dow_coef: [1,1,1,1,1,1,1], carry: null,
  days: [{ date: '2026-08-01', rev: 100_000 }] }, NOW)
ok(trendOne.onPlanTrend === null, 'один внесённый день → стрелки нет: сравнивать не с чем')

const trendNone = computeMini({ month: '2026-08', month_target: 3_100_000, dow_coef: [1,1,1,1,1,1,1],
  carry: { upTo: '2026-08-10', amount: 1_000_000 }, days: [] }, NOW)
ok(trendNone.onPlanTrend === null, 'месяц из одной стартовой суммы → стрелки нет')

// 4. Прошлое одной суммой: по 10-е = 1 000 000, дней по одному нет.
const m4 = computeMini({ month: '2026-08', month_target: 3_100_000, dow_coef: [1,1,1,1,1,1,1],
  carry: { upTo: '2026-08-10', amount: 1_000_000 }, days: [] }, NOW)
ok(m4.realizedRev === 1_000_000, 'сумма прошлого входит в факт')
ok(близко(m4.landing, 3_100_000, 1e-3), 'сумма прошлого: темп 100к/день → приземление 3,1 млн')
ok(m4.goalState === 'unknown', 'достижимость unknown: лучший день из суммы не восстановить')

// Пустой месяц: ни одного дня — сравнивать не с чем, и «план достижим»
// не печатается. Пустота по дням и пустота из суммы говорят одно слово.
const m4b = computeMini({ month: '2026-08', month_target: 3_100_000, dow_coef: [1,1,1,1,1,1,1], carry: null, days: [] }, NOW)
ok(m4b.goalState === 'unknown', 'достижимость unknown на месяце без единого числа')
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

// Замок называет причину числами и снимается вводом последнего недостающего
// дня — в тот же момент и никогда оплатой. Правило живёт здесь, потому что
// экран берёт состояние недели только отсюда: второго правила замка в проекте
// не заводится.
ok(m5.weeks[1].missingDays.join() === '5,6,7,8,9',
  'неделя перечисляет недостающие дни числами')
ok(m5.weeks[2].blockedBy && m5.weeks[2].blockedBy.idx === 2
  && m5.weeks[2].blockedBy.days.join() === '5,6,7,8,9',
  'запертая неделя называет неделю-причину и её дыры')
// Внесены все дыры, кроме последней (9 августа), — замок ещё стоит.
const days5c = days5.concat(['05', '06', '07', '08'].map((d) => ({ date: `2026-08-${d}`, rev: 100_000 })))
const m5c = computeMini({ month: '2026-08', month_target: 3_100_000, dow_coef: [1,1,1,1,1,1,1], carry: null, days: days5c }, NOW)
ok(!m5c.weeks[2].open && m5c.weeks[2].blockedBy.days.join() === '9',
  'остался один недостающий день — замок стоит и называет именно его')
ok(m5b.weeks[2].open && m5b.weeks[2].blockedBy === null,
  'внесли последний недостающий день прошедшей недели → следующая открыта')
// Ничего, кроме ввода, замок не снимает: оплата в расчёт недель не входит вовсе.
ok(!('paid' in m5c.weeks[2]) && !('unlockedBy' in m5c.weeks[2]),
  'в состоянии недели нет ни одного поля об оплате')

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

// 10б. Закрытый день не считается дважды: закрыто + осталось не больше длины месяца.
const days10d = []
for (let d = 1; d <= 15; d++) days10d.push({ date: `2026-08-${String(d).padStart(2, '0')}`, rev: 100_000 })
const m10d = computeMini({ month: '2026-08', month_target: 3_100_000, dow_coef: [1,1,1,1,1,1,1], carry: null, days: days10d }, NOW)
ok(m10d.realizedCount + m10d.daysLeft <= m10d.DIM, 'закрытые и оставшиеся дни не пересекаются')
ok(m10d.daysLeft === 16, 'сегодняшний день внесён → в оставшиеся не входит')
const m10e = computeMini({ month: '2026-08', month_target: 3_100_000, dow_coef: [1,1,1,1,1,1,1], carry: null, days: days10d.slice(0, 14) }, NOW)
ok(m10e.daysLeft === 17, 'сегодняшний день не внесён → входит в оставшиеся')

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

// 16. Энергия роста. Число публично и складывается из пяти компонент —
// значит оно обязано быть проверяемым, иначе это шкала настроения.
const set16 = {
  month: '2026-08', month_target: 3_100_000, month_goal: 3_500_000,
  dow_coef: [1, 1, 1, 1, 1, 1, 1], carry: null,
  days: [{ date: '2026-08-01', rev: 100_000 }],
}
const m16 = computeMini(set16, NOW)
const e16 = computeEnergy(set16, m16)
ok(e16.pct === 20, 'потолок бесплатной версии — 20 %')
ok(e16.parts.length === 5 && e16.parts.every((p) => p.max === 20),
  'пять компонент по 20: сумма шкалы = 100')
ok(e16.parts.find((p) => p.key === 'drivers').value === 0,
  'драйверов в Треке нет: 0 %')

// Пустое состояние: компонента засчитывается, когда существует, а не когда
// про неё есть поле. Иначе меряется намерение, а не состояние.
const e16b = computeEnergy({ month: '2026-08', month_target: 0, month_goal: null, days: [], carry: null }, null)
ok(e16b.pct === 0, 'пустое состояние — 0 %, а не «пять за старание»')
const set16c = { ...set16, month_goal: null }
ok(computeEnergy(set16c, computeMini(set16c, NOW)).pct === 15,
  'цель не поставлена — 15 %: сущности нет, процента нет')

// Уровень подключения читается по посчитанному проценту, а не назначается.
ok(e16.level.id === 'mini', 'уровень выводится из процента')
ok(computeEnergy({ ...set16, month_target: 0, month_goal: null, days: [], carry: null }, null).level.id === 'mini',
  'пустое состояние остаётся на первом этапе')
ok(LEVELS.map((l) => l.cap).join() === '20,45,65,100',
  'лестница этапов: 20 → 45 → 65 → 100')
// Недостижимый этап — дефект шкалы: владелец, купивший всё на своём участке,
// обязан на него встать. Раньше этап «Сессии» стоял на 70 при потолке 55.
const TOP = PARTS.reduce((a, p) => a + p.steps[p.steps.length - 1].pct, 0)
ok(TOP === 100, 'сумма верхних ступеней всех компонент — ровно 100')
const reach = {
  mini: 20,
  razbory: 20 + moduleGain('razbor', e16) + moduleGain('masterplan', e16),
  bootcamp: 65,
  runscale: 100,
}
ok(LEVELS.every((l) => reach[l.id] >= l.cap), 'каждый этап достижим суммой ступеней')

// Мощность модуля — посчитанный прирост на этом состоянии, а не «х1».
ok(moduleGain('razbor', e16) === 10, 'разбор поднимает план и цель до середины: +10 %')
ok(moduleGain('masterplan', e16) === 20, 'серия разборов на состоянии Трека: +20 %')
ok(moduleGain('bootcamp', e16) === 30, 'буткемп поднимает факт и план: +30 %')
ok(moduleGain('runscale', e16) === 50, 'режим поднимает прогноз, цель и драйверы: +50 %')
// Ни одна ступень не принадлежит двум платным модулям. Иначе вторая покупка
// показала бы «+0 %» рядом с ценой — ровно та дыра, из-за которой линейка
// пересобиралась 15.08.
const liftKeys = Object.entries(MODULE_LIFTS)
  .flatMap(([, lifts]) => Object.entries(lifts).map(([k, v]) => `${k}:${v}`))
ok(new Set(liftKeys).size === liftKeys.length, 'ступень принадлежит одному модулю')

// Мощность считается на состоянии, в котором ступень покупают: дорога идёт
// снизу вверх, и каждая следующая берёт только то, что осталось.
const cur = Object.fromEntries(PARTS.map((p) => [p.key, p.steps[0].pct]))
const pathGain = {}
for (const id of SESSIONS) {
  let g = 0
  for (const [k, to] of Object.entries(MODULE_LIFTS[id])) {
    g += Math.max(0, to - cur[k])
    cur[k] = Math.max(cur[k], to)
  }
  pathGain[id] = g
}
ok(pathGain.razbor === 10 && pathGain.masterplan === 15
  && pathGain.bootcamp === 20 && pathGain.runscale === 35,
  'по дороге: +10 · +15 · +20 · +35')
ok(20 + SESSIONS.reduce((a, id) => a + pathGain[id], 0) === 100,
  'дорога закрывает шкалу ровно до 100')

// Каждая ступень что-то даёт человеку из Трека: платный модуль с нулевой
// мощностью на витрине — сломанный товар, а не состояние пользователя.
ok(SESSIONS.every((id) => moduleGain(id, e16) > 0),
  'у каждой ступени мощность на состоянии Трека больше нуля')

// Цена за процент не убывает вверх по лестнице: внизу покупается разговор,
// наверху — живая система, и она за процент дороже. Режим считается пакетом
// от трёх месяцев: это его минимальная покупка.
const fullPrice = (id) => MODULES[id].price * (MODULES[id].priceUnit ? 3 : 1)
const perPct = SESSIONS.map((id) => fullPrice(id) / pathGain[id])
ok(perPct.every((v, i) => i === 0 || v >= perPct[i - 1]),
  'цена за процент растёт по лестнице')

// Каждая карта сущности знает свой модуль: кнопка «+N%» открывает паспорт
// того, что эту ступень поднимает. Модуль без паспорта — мёртвая кнопка,
// и на экране она выглядит точно так же, как живая.
const byOf = (k) => e16.parts.find((p) => p.key === k).nextBy
ok(byOf('fact') === 'bootcamp' && byOf('forecast') === 'runscale'
  && byOf('plan') === 'razbor' && byOf('goal') === 'razbor',
  'у каждой сущности назван свой модуль')
ok(SESSIONS.every((id) => MODULES[id] && BY_LABEL[id]),
  'у каждой ступени есть паспорт и имя')
ok(SESSIONS.join() === 'razbor,masterplan,bootcamp,runscale',
  'лента ступеней: вход, серия, буткемп, режим')
ok(MODULES.razbor.price === 100000 && MODULES.masterplan.price === 250000
  && MODULES.bootcamp.price === 650000 && MODULES.runscale.price === 650000,
  'прайс: 100 000 · 250 000 · 650 000 · 650 000 в месяц')
ok(isLocked('masterplan', false) && !isLocked('masterplan', true)
  && isLocked('bootcamp', false) && !isLocked('bootcamp', true)
  && isLocked('runscale', true) && !isLocked('razbor', false),
  'замок: серия и буткемп — после разбора, режим — после буткемпа, вход открыт всегда')
// У каждой запертой ступени есть, чем подписать замок: «Ожидание» без причины
// читается как ошибка приложения.
ok(SESSIONS.filter((id) => isLocked(id, false)).every((id) => MODULES[id].lockChip && MODULES[id].lockNote),
  'каждая запертая ступень объясняет замок своим словом')

// Разрывы считаются на числах владельца и называются направлением.
const gaps16 = computeGaps(m16)
ok(gaps16.length === 3, 'три разрыва: до прогноза, прогноз↔план, план↔цель')
// Ровный темп: прогноз сходится с планом ровно — направления нет, и его
// не выдумывают.
ok(gaps16.find((g) => g.key === 'forecast-plan').tone === 'neutral',
  'совпадение прогноза с планом не называется направлением')
// Отставание: направление названо и посчитано.
const set16d = { ...set16, days: [{ date: '2026-08-01', rev: 10_000 }] }
const m16d = computeMini(set16d, NOW)
const gpd = computeGaps(m16d).find((g) => g.key === 'forecast-plan')
ok(gpd.tone === 'bad' && близко(gpd.value, m16d.T - m16d.landing, 1e-6),
  'разрыв прогноз↔план посчитан и подписан направлением')
ok(computeGaps(null).length === 0, 'без модели разрывов нет')
// Цель не поставлена — строка до цели всё равно стоит, но без числа: цепочка
// величин не рвётся, и выдуманного разрыва в ней не появляется.
const set16e = { ...set16, month_goal: null }
const g16e = computeGaps(computeMini(set16e, NOW)).find((g) => g.key === 'plan-goal')
ok(g16e && g16e.value === null, 'без цели разрыв до неё стоит строкой без числа')

// 17. Ссылка на месяц. Состояние уезжает в адрес и обязано вернуться тем же:
// получатель видит те же числа, что отправитель, иначе ссылка врёт молча.
const set17 = {
  ready: true, company: 'Компания', unit: 'Первый юнит',
  month: '2026-08', month_target: 3_100_000, month_goal: 3_500_000,
  dow_coef: [0.85, 0.9, 0.95, 1, 1.2, 1.15, 0.95], coef_src: 'data', shape_id: 'default', shape_from: '',
  carry: { upTo: '2026-08-05', amount: 400_000, spread: true },
  days: [
    { date: '2026-08-06', rev: 91_000, planRef: 100_000 },
    { date: '2026-08-07', rev: 0 },
  ],
  forecastLog: [{ at: '2026-08-07', after: '2026-08-06', landing: 2_900_000, was: 3_000_000, goalState: 'ok' }],
}
const back17 = decodeState(encodeState(set17, 'full'))
ok(back17 !== null, 'ссылка расшифровывается обратно')
ok(back17.month === set17.month && back17.month_target === set17.month_target
  && back17.month_goal === set17.month_goal && back17.unit === set17.unit,
  'месяц, план, цель и юнит доезжают без потерь')
ok(JSON.stringify(back17.dow_coef) === JSON.stringify(set17.dow_coef)
  && back17.coef_src === 'data', 'форма недели и её источник доезжают')
ok(back17.carry.upTo === '2026-08-05' && back17.carry.amount === 400_000 && back17.carry.spread === true,
  'стартовая сумма с разносом доезжает')
ok(back17.days.length === 2 && back17.days[0].date === '2026-08-06'
  && back17.days[0].planRef === 100_000 && back17.days[1].rev === 0,
  'дни доезжают вместе с линейкой момента ввода, ноль остаётся нулём')
ok(back17.forecastLog[0].after === '2026-08-06' && back17.forecastLog[0].goalState === 'ok',
  'журнал прогноза доезжает')

// Числа на экране получателя обязаны совпасть с числами отправителя.
const mA = computeMini(set17, NOW)
const mB = computeMini(back17, NOW)
ok(близко(mA.landing, mB.landing, 1e-6) && близко(mA.realizedRev, mB.realizedRev, 1e-6)
  && mA.goalState === mB.goalState, 'у получателя те же прогноз, факт и достижимость')
ok(computeEnergy(set17, mA).pct === computeEnergy(back17, mB).pct,
  'энергия у получателя та же')

// Мусор в адресе не роняет приложение и не притворяется месяцем.
ok(decodeState('не-ссылка') === null && decodeState('') === null, 'мусор в адресе даёт null')
ok(readShared('#m=' + encodeState(set17, 'full')) !== null && readShared('#что-то') === null,
  'месяц читается только из своего префикса')
ok(hasSharePayload('#m=что-угодно') && !hasSharePayload('#другое') && !hasSharePayload(''),
  'попытка открыть месяц отличается от обычного запуска')

// Битое состояние не должно доходить до ядра: `computeMini` на выдуманном
// месяце возвращает null, и экран получателя остался бы пустым без объяснения.
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
ok(decodeState(b64({ v: 1, m: 'не-месяц', k: [1, 1, 1, 1, 1, 1, 1], t: 1 })) === null,
  'выдуманный месяц отсекается до ядра')
ok(decodeState(b64({ v: 1, m: '2026-13', k: [1, 1, 1, 1, 1, 1, 1], t: 1 })) === null,
  'тринадцатого месяца не бывает')
ok(decodeState(b64({ v: 1, m: '2026-08', k: [0, 0, 0, 0, 0, 0, 0], t: 1 })) === null,
  'нулевые веса недели отсекаются: делить на них нечем')

// Длина ссылки меряется на худшем случае — полный месяц с журналом,
// иначе проверка называется одним, а меряет другое.
const days17 = []
const log17 = []
for (let d = 1; d <= 31; d++) {
  const iso = `2026-08-${String(d).padStart(2, '0')}`
  days17.push({ date: iso, rev: 91_000 + d * 137, planRef: 100_000 })
  log17.push({ at: iso, after: iso, landing: 3_000_000 + d, was: 3_000_000, goalState: 'ok' })
}
const full17 = { ...set17, days: days17, forecastLog: log17 }
const len17 = shareUrl(full17, 'https://gderost.ru/', 'full').length
ok(len17 < 4000, `ссылка на полный месяц с журналом укладывается в адрес (${len17} знаков)`)
ok(decodeState(encodeState(full17, 'full')).days.length === 31, 'полный месяц доезжает целиком')

// Перенос месяца обнуляет показанные предложения поделиться: повод
// «месяц закрыт» относится к месяцу, а не к устройству.
ok((nextMonthState(full17, { month: '2026-09', target: 3_000_000 }).shareSeen || []).length === 0,
  'в новом месяце предложения поделиться приходят заново')

// Повод «неделя закрыта полностью». Правило живёт на экране «Сегодня»,
// а проверяется здесь на ядре: 14.08 шторка прилетала сразу после подключения,
// потому что дни, покрытые стартовой суммой, считались внесёнными, и неделя,
// которая ещё не началась, проходила как прожитая.
const NOW_SHARE = new Date(2026, 7, 14, 12, 0, 0) // пятница 14 августа
const ISO_NOW = '2026-08-14'
const baseShare = {
  month: '2026-08', month_target: 3_000_000, month_goal: null,
  dow_coef: [0.85, 0.9, 0.95, 1, 1.2, 1.15, 0.95], carry: null, days: [],
}
const weekClosed = (set) => {
  const mm = computeMini(set, NOW_SHARE)
  return mm.weeks.some((w) => w.days.length === 7
    && w.days[w.days.length - 1].iso < ISO_NOW
    && w.days.every((d) => d.entered))
}
const daysRange = (from, to) => {
  const out = []
  for (let d = from; d <= to; d++) out.push({ date: `2026-08-${String(d).padStart(2, '0')}`, rev: 95_000 })
  return out
}
ok(weekClosed({ ...baseShare, days: daysRange(3, 9) }),
  'прожитая неделя, внесённая по дням, даёт повод поделиться')
ok(!weekClosed({ ...baseShare, days: daysRange(3, 9).filter((x) => !x.date.endsWith('05')) }),
  'неделя с дырой повода не даёт')
ok(!weekClosed({ ...baseShare, carry: { upTo: '2026-08-13', amount: 1_200_000, spread: true } }),
  'стартовая сумма за прошлое неделю не закрывает')
ok(!weekClosed({ ...baseShare, days: daysRange(10, 16) }),
  'текущая неделя, заполненная вперёд, повода не даёт')

// Сигнал Трека. Правило контура: не из чего собрать утверждение — молчим.
// Пустая карточка с нулями была бы шумом, и это проверяется машиной.
ok(computeTodaySignal(null) === null, 'без модели сигнала нет')
const mEmpty = computeMini({ month: '2026-08', month_target: 3_100_000, dow_coef: [1,1,1,1,1,1,1], carry: null, days: [] }, NOW)
ok(computeTodaySignal(mEmpty) === null, 'без единого числа сигнала нет')

// Планка сигнала совпадает с моделью до рубля: сигнал — те же числа
// в раме предмета торговли, а не второй расчёт рядом с первым.
const sig = computeTodaySignal(m3)
ok(sig !== null, 'на живом месяце сигнал собирается')
ok(близко(sig.need ?? m3.todayNeed ?? 0, m3.todayNeed ?? 0, 1e-6), 'планка «надо сегодня» — из модели')
ok(близко(sig.landing, m3.landing, 1e-6), 'прогноз сигнала — из модели')
ok(sig.even && sig.gap === 0 && sig.surplus === 0,
  'совпадение прогноза с планом направлением не называется')
const mBehind = computeMini({ month: '2026-08', month_target: 3_100_000, dow_coef: [1,1,1,1,1,1,1],
  carry: null, days: [{ date: '2026-08-01', rev: 10_000 }] }, NOW)
const sigB = computeTodaySignal(mBehind)
ok(sigB.gap > 0 && близко(sigB.gap, mBehind.T - mBehind.landing, 1e-6),
  'недобор сигнала равен разрыву модели')

// Происхождение чисел: у каждого ключа есть полный текст, а статусов
// только два — третий в приложении не выдаётся никогда.
const originKeys = ['fact', 'forecast', 'plan', 'goal', 'need', 'gap']
ok(originKeys.every((k) => {
  const o = ORIGINS[k]
  return o && o.title && o.what && o.from && o.next
}), 'происхождение названо для всех шести чисел')
ok(originKeys.every((k) => ['said', 'computed'].includes(ORIGINS[k].status)),
  'статусы происхождения — только «со слов» и «посчитано»')

// Предмет торговли назван на каждой ступени: строка сигналов обязательна.
ok(SESSIONS.every((id) => MODULES[id].signals && MODULES[id].signals.length > 0),
  'у каждой ступени названо, что она добавляет к сигналам')

// Голос витрины. Тот же словарь, что в `tools/proverka.mjs`: две проверки
// обязаны говорить одно и то же, иначе разойдутся молча и веры не будет ни
// одной. Здесь он ловит тексты, которые видит человек, — по значениям, а не
// по файлам: словарь без чисел проверяется дословно.
const VOICE_BAN = /контур|чекап|планк[аиуе]|вердикт|GO\s*\/\s*NO\s*GO|лаборатор|кольц|дуг[аиуе]|петл[яиюе]/i
const visible = [
  ...INTRO_STORY.flatMap((s) => [s.title, s.text, s.cta || '']),
  ...LEVEL_ROWS.flatMap((r) => [r.what, r.by]),
  ...Object.values(HEAD),
  ...Object.values(SIGNAL),
  ...SESSIONS.flatMap((id) => {
    const m = MODULES[id]
    return [m.title, m.subtitle, m.signals, m.bring, m.take, m.note || '', m.cta, m.lockNote || '']
  }),
  ...Object.values(ORIGINS).flatMap((o) => [o.title, o.what, o.from, o.next]),
]
ok(visible.every((s) => !VOICE_BAN.test(String(s))),
  'на витрине нет внутренних слов: контур, чекап, планка, вердикт, кольцо, дуга, петля')

// Онбординг входа: пять слайдов и говорящая кнопка на последнем — человек
// узнаёт, как это работает, до того как у него просят числа.
ok(INTRO_STORY.length === 5 && INTRO_STORY[4].cta, 'вход объясняется пятью слайдами до первого поля')

// Страница состояния: таблица уровня называет и то, что есть, и то, чем
// открывается остальное. Строка «нет» без имени модуля — упрёк, а не действие.
ok(LEVEL_ROWS.length === 5 && LEVEL_ROWS.filter((r) => r.has).length === 2,
  'в уровне пять строк, две из них уже есть в Треке')
ok(LEVEL_ROWS.every((r) => (r.has ? r.by === '' : r.by.length > 0)),
  'у каждой недостающей строки названо, чем она открывается')
// Ввод дней в таблицу уровня не входит: своя работа не продаётся никогда.
ok(!LEVEL_ROWS.some((r) => /недел/i.test(r.what)),
  'неделя не стоит строкой уровня: замок снимается вводом, а не покупкой')

// Телеметрия: числа из одного места, ряд без значений графиком не рисуется.
ok(COUNTERS.items.every((c) => c.title && c.forms.length === 3 && Number.isFinite(c.value)),
  'у каждого счётчика есть заголовок, склонения и число')
ok(/^\d{4}-\d{2}-\d{2}$/.test(COUNTERS.asOf), 'у счётчиков стоит дата среза')
ok(scoreNow([]) === null && scoreNow([5, 6.4]) === 6.4,
  'пустой ряд числа не имеет, у непустого берётся последняя оценка')
ok(TELEMETRY.readsRate >= 0 && TELEMETRY.readsRate <= 1 && TELEMETRY.businesses >= 0,
  'доля прочтений — доля, число бизнесов не отрицательно')
ok(TELEMETRY.signalScores
  .every((s) => s.id && s.label && Array.isArray(s.values)
    && s.values.every((v) => v >= 0 && v <= 10)),
  'оценки сигналов лежат в шкале 0–10 и подписаны месяцем')
// Связка «после разбора» публикуется только целиком: publish=false означает,
// что ни одного из трёх чисел в файле нет — публичный репозиторий не должен
// нести непубликуемое; publish=true обязывает нести все три.
{
  const o = TELEMETRY.reviewOutcome
  ok(o && typeof o.publish === 'boolean' && o.need > 0 && o.votes >= 0,
    'у связки после разбора есть ворота публикации и счёт оценок')
  ok(o.publish
    ? (o.clarity >= 0 && o.clarity <= 10 && o.onTime >= 0 && o.total >= o.onTime)
    : (o.clarity === null && o.onTime === null && o.total === null),
    'связка публикуется только целиком: оба числа или ни одного')
}

// Календарные недели месяца. Строк бывает от четырёх до шести — шесть только
// когда первое число попадает на воскресенье или суббота начинает 31-дневный
// месяц. Семи не бывает никогда, и первая со последней могут быть неполными.
for (const [ym, dim] of [['2026-02', 28], ['2026-08', 31], ['2026-11', 30], ['2027-05', 31]]) {
  const mm = computeMini({ month: ym, month_target: 1_000_000, dow_coef: [1,1,1,1,1,1,1], carry: null, days: [] },
    new Date(Number(ym.slice(0, 4)), Number(ym.slice(5)) - 1, 15, 12, 0, 0))
  ok(mm.weeks.length >= 4 && mm.weeks.length <= 6, `${ym}: недель месяца ${mm.weeks.length} — от четырёх до шести`)
  ok(mm.weeks.reduce((a, w) => a + w.days.length, 0) === dim, `${ym}: дни недель складываются в месяц`)
  ok(mm.weeks.every((w) => w.days.length <= 7), `${ym}: в неделе не больше семи дней`)
}

// 18. Петля «Честной цифры»: каждый сегмент — проверяемый факт, петля цепная.
//     Условия — composables/honestLoop.js; кольцо на плашке обязано говорить
//     то же, что модель, поэтому проверяются сами условия, а не картинка.
{
  const base = { month: '2026-08', month_target: 3_100_000, dow_coef: [1,1,1,1,1,1,1] }
  // Пустой месяц: ни одной дуги.
  const l0 = honestLoop({ ...base, carry: null, days: [] },
    computeMini({ ...base, carry: null, days: [] }, NOW))
  ok(l0.lit === 0, 'петля: пустой месяц — ни одной дуги')
  // Стартовая сумма без дней: данные и сигнал есть, действие и замер — нет.
  const s1 = { ...base, carry: { upTo: '2026-08-14', amount: 1_400_000 }, days: [] }
  const l1 = honestLoop(s1, computeMini(s1, NOW))
  ok(l1.segs[0].on && l1.segs[1].on && !l1.segs[2].on && !l1.segs[3].on,
    'петля: сумма без дней — данные и сигнал, действия нет')
  // Дни при живом плане, прошедшие закрыты целиком: петля замкнута.
  const days2 = []
  for (let d = 1; d <= 14; d++) days2.push({ date: `2026-08-${String(d).padStart(2, '0')}`, rev: 100_000, planRef: 100_000 })
  const s2 = { ...base, carry: null, days: days2 }
  const l2 = honestLoop(s2, computeMini(s2, NOW))
  ok(l2.lit === 4 && /Все проверки пройдены/.test(l2.note), 'петля: все прошедшие дни с фактом — все проверки пройдены')
  // Пропущенный день размыкает только замер.
  const s3 = { ...base, carry: null, days: days2.filter((x) => x.date !== '2026-08-10') }
  const l3 = honestLoop(s3, computeMini(s3, NOW))
  ok(l3.segs[2].on && !l3.segs[3].on && /без выручки/.test(l3.note),
    'петля: день без факта гасит четвёртую дугу и зовёт внести дни')
  // Дни, внесённые без плана на день, действия не зажигают.
  const s4 = { ...base, carry: null, days: days2.map(({ planRef, ...x }) => x) }
  const l4 = honestLoop(s4, computeMini(s4, NOW))
  ok(l4.segs[1].on && !l4.segs[2].on, 'петля: факт без плана дня — действие не горит')
  // Цепность: на всех фикстурах сегмент не горит раньше предыдущего.
  ok([l0, l1, l2, l3, l4].every((l) => l.segs.every((s, i, a) => !s.on || i === 0 || a[i - 1].on)),
    'петля цепная: сегмент не горит без предыдущего')
  // Голос витрины: «замер» существительным на экран не выходит (словарь
  // docs/контент/ГОЛОС.md). Проверяются все строки, которые печатает петля.
  const screenWords = [l0, l1, l2, l3, l4]
    .flatMap((l) => [l.note, ...l.segs.flatMap((s) => [s.label, s.check])])
  ok(screenWords.every((w) => !/замер/i.test(w)),
    'голос: строки петли не печатают «замер»')
  // Сторис строится от живой петли: шесть слайдов, первый несёт чек-лист
  // из четырёх проверок с теми же отметками, что дуги.
  const st = honestStory(l3)
  ok(st.length === 6 && Array.isArray(st[0].checks) && st[0].checks.length === 4
    && st[0].checks.every((c, i) => c.on === l3.segs[i].on && c.label === l3.segs[i].check),
    'сторис: чек-лист первого слайда совпадает с дугами петли')
  ok(st.every((s) => !/замер/i.test(`${s.title} ${s.text}`)),
    'голос: сторис не печатает «замер»')
  // Кольцо стоит на слайдах: первый показывает состояние человека без указки,
  // слайды шагов указывают каждый на свою дугу и несут живой ответ на неё.
  ok(st[0].ring && st[0].ring.highlight === null && st[0].ring.segs === l3.segs,
    'сторис: кольцо первого слайда — состояние человека')
  ok([1, 2, 3, 4].every((n) => st[n].ring && st[n].ring.highlight === n - 1
    && st[n].checks.length === 1 && st[n].checks[0].on === l3.segs[n - 1].on),
    'сторис: слайд шага указывает на свою дугу и несёт свой ответ')
}

// 19. Жест «потяни-обнови». Правила вынесены чистыми функциями именно ради
//     этого блока: обе аварии жеста жили в формуле среди обработчиков касания
//     и глазами в коде не читались.
{
  // Панель обязана ехать МЕДЛЕННЕЕ пальца на всём диапазоне.
  ok([1, 5, 10, 12, 13, 40, 64, 138, 400].every((dy) => pullOffset(dy) < dy),
    'жест: панель едет медленнее пальца на всём диапазоне')
  ok(pullOffset(PULL.SLOP) === 0 && pullOffset(PULL.SLOP + 1) >= 0,
    'жест: до люфта панель стоит — прокрутка остаётся прокруткой')
  ok(pullOffset(10_000) === PULL.MAX, 'жест: панель дальше своего предела не едет')
  // Порог берётся осознанным протягиванием, а не рывком при чтении.
  // Верхняя граница важнее нижней: слишком длинный жест человек не дотягивает
  // и читает как поломку. Нижняя держит его отличимым от случайного касания.
  const pathToTrigger = PULL.SLOP + PULL.TRIGGER / PULL.DAMP
  ok(pathToTrigger >= 90 && pathToTrigger <= 140,
    `жест: до порога палец проходит ${pathToTrigger} px`)

  // Инерция. Прокрутка обязана стоять до касания, иначе последний рывок
  // при возврате к верху страницы читается жестом.
  const base = { scrollTop: 0, sinceScrollMs: 5000, busy: false }
  ok(canStartPull(base), 'жест: на стоящей странице у верха жест возможен')
  ok(!canStartPull({ ...base, sinceScrollMs: 120 }),
    'жест: сразу после прокрутки не заводится — это инерция, а не жест')
  ok(!canStartPull({ ...base, scrollTop: 24 }), 'жест: не от верха не заводится')
  ok(!canStartPull({ ...base, busy: true }), 'жест: во время обновления не заводится')

  // Отпускание: путь, длительность и вертикальность — все три обязательны.
  const fired = { offset: PULL.TRIGGER, heldMs: PULL.HOLD_MS, drift: 0 }
  ok(shouldFirePull(fired), 'жест: протянули до порога и держали — засчитано')
  ok(!shouldFirePull({ ...fired, offset: PULL.TRIGGER - 1 }), 'жест: не дотянули — не засчитано')
  ok(!shouldFirePull({ ...fired, heldMs: PULL.HOLD_MS - 1 }),
    'жест: рывок короче порога длительности — не засчитано')
  ok(!shouldFirePull({ ...fired, drift: PULL.DRIFT + 1 }),
    'жест: увод вбок отменяет жест')
  ok(!shouldFirePull({ ...fired, drift: -(PULL.DRIFT + 1) }),
    'жест: увод вбок считается в обе стороны')
}

// 20. Дорога на странице состояния. Подписка живёт в расчёте и в паспортах,
//     но видимым концом пути у человека с двумя внесёнными днями не стоит:
//     дорога с недостижимым концом читается прайсом, а не дорогой.
{
  ok(!PATH_VISIBLE.some((l) => l.id === 'runscale'),
    'дорога состояния: подписки на ней нет')
  ok(PATH_VISIBLE.length === LEVELS.length - 1,
    'дорога состояния короче полной лестницы ровно на подписку')
  ok(PATH_VISIBLE[0].id === 'mini' && PATH_VISIBLE[PATH_VISIBLE.length - 1].id === 'bootcamp',
    'дорога состояния идёт от Трека до буткемпа')
  // Расчёт при этом не тронут: сто процентов остаются полной системой,
  // иначе паспорта показали бы мощность от другой шкалы.
  ok(LEVELS.some((l) => l.id === 'runscale' && l.cap === 100),
    'в расчёте подписка на месте и держит потолок шкалы')
}

// 21. Каждое число ведёт куда-то. Шторка происхождения кончается делом,
//     а не согласием: «Понятно» закрывало её и оставляло человека там же.
{
  const keys = Object.keys(ORIGINS)
  ok(keys.every((k) => ORIGINS[k].cta && ORIGINS[k].go),
    'у каждого числа названо продолжение действием')
  ok(keys.every((k) => ['day', 'goals'].includes(ORIGINS[k].go)),
    'продолжение ведёт в существующий раздел')
  // Требование дня ведёт в «Контроль Дня»: ввод в приложении один и место
  // у него одно.
  ok(ORIGINS.need.go === 'day' && ORIGINS.fact.go === 'day',
    'надо сегодня и факт ведут в Контроль Дня')
}

// 22. Переходы между разделами. Возврат обязан вести туда, откуда пришли:
//     под-страница принадлежит вопросу человека, а не назначенному владельцу.
{
  const from = (tab) => navSelectTab(initialNav(), tab)

  const a = navBack(navigate(from('power'), 'goals'))
  ok(a.tab === 'power' && a.subView === '',
    'переход: с «Сигналов» в цели и назад — обратно на «Сигналы»')

  const b = navBack(navigate(from('runscale'), 'day', { week: 3 }))
  ok(b.tab === 'runscale', 'переход: с «Прогресса» в неделю и назад — обратно на «Прогресс»')

  const c = navBack(navigate(from('today'), 'day', '2026-08-12'))
  ok(c.tab === 'today', 'переход: с «Сегодня» в день и назад — обратно на «Сегодня»')

  const openDay = navigate(from('runscale'), 'day', '2026-08-12')
  ok(openDay.tab === 'runscale' && openDay.subView === 'day',
    'переход: под-страница не переключает вкладку под собой')
  ok(openDay.dayPreset === '2026-08-12', 'переход: день едет вместе с адресом')

  // Цепочка под-страниц кончается там, где началась: «неделя → цели → назад»
  // не должно выбрасывать на «Сегодня».
  const chain = navBack(navigate(navigate(from('runscale'), 'day'), 'goals'))
  ok(chain.tab === 'runscale', 'переход: цепочка под-страниц возвращает к началу пути')

  const t = navSelectTab(navigate(from('power'), 'goals'), 'ultra')
  ok(t.tab === 'ultra' && t.subView === '' && t.homeTab === 'ultra',
    'переход: выбор вкладки закрывает под-страницу и обнуляет возврат')
}

// 23. Приоритет состояний. Правило уровня приложения, формулировка Михаила
//     19.08.2026: ДОЛГ ВАЖНЕЕ РЕЗУЛЬТАТА, РЕЗУЛЬТАТ ВАЖНЕЕ ВРЕМЕНИ, и одно
//     состояние красится одним цветом. Проверяется машиной, потому что
//     нарушается оно молча: два бейджа в строке и полоса третьего цвета
//     выглядят «просто вёрсткой», а человек перестаёт понимать, хорошо у него
//     или плохо.
{
  ok(BADGE_PRIORITY.join() === 'debt,result,time', 'состояния: порядок долг → результат → время')

  ok(pickState({ debt: true, result: true }) === 'debt',
    'состояния: долг перебивает результат')
  ok(pickState({ debt: true, result: false }) === 'debt',
    'состояния: долг перебивает время')
  ok(pickState({ debt: false, result: true }) === 'result',
    'состояния: результат перебивает время')
  ok(pickState({ debt: false, result: false }) === 'time',
    'состояния: без долга и результата остаётся время')
  ok(pickState() === 'time', 'состояния: пустой вход — самое слабое сообщение')

  // Долг всегда жёлтый, каким бы ни был светофор рядом: жёлтый в системе
  // означает меру и незавершённость, и у долга нет второго цвета.
  ok(stateInk('debt', 'good').bg === 'var(--warning)' && stateInk('debt', 'bad').bg === 'var(--warning)',
    'состояния: долг всегда жёлтый')
  ok(stateInk('result', 'good').bg === 'var(--positive)'
    && stateInk('result', 'bad').bg === 'var(--negative)',
    'состояния: результат говорит светофором')
  ok(stateInk('time', 'idle', 'now').bg === 'var(--action)'
    && stateInk('time', 'idle', 'ahead').bg === 'var(--surface-2)'
    && stateInk('time', 'idle', 'locked').bg === 'var(--surface-2)',
    'состояния: время — цвет действия у идущего, серый у будущего и запертого')

  // Одно состояние — один цвет: у метки и полосы источник цвета общий,
  // и второго правила окраски в проекте не заводится.
  const a = stateInk('result', 'warn')
  const b = stateInk('result', 'warn')
  ok(a.bg === b.bg && a.ink === b.ink, 'состояния: цвет состояния считается одним местом')
}

// 24. Четыре сообщения роста. Правило показа, а не расчёта, и ломается
//     оно молча: условие, посчитанное по стартовой сумме, выдаёт человеку
//     «неделя без пропусков» в первую же секунду после подключения — до того,
//     как он внёс хоть один день руками. Это уже случалось однажды.
{
  const day = (n, rev = 100_000) => ({ date: `2026-08-${String(n).padStart(2, '0')}`, rev })
  const mk = (days, extra = {}, now = NOW) => computeMini({
    month: '2026-08', month_target: 3_100_000, month_goal: null,
    dow_coef: [1, 1, 1, 1, 1, 1, 1], carry: null, days, ...extra,
  }, now)

  ok(SHARE_ORDER.join() === 'month,week,pace,start', 'поводы: старшинство month → week → pace → start')

  // Один внесённый день — ровно `start`, и ни одного повода сверх него.
  const one = mk([day(1)])
  const c1 = shareConditions(one, NOW)
  ok(topShareReason(one, NOW) === 'start', 'поводы: один внесённый день даёт start')
  ok(c1.start && !c1.pace && !c1.week && !c1.month, 'поводы: на одном дне выполнен только start')

  // План — условие старта, цель — нет: она в модели необязательна.
  const noPlan = mk([day(1)], { month_target: 0 })
  ok(topShareReason(noPlan, NOW) === '', 'поводы: без плана месяца поводов нет')
  ok(topShareReason(mk([day(1)], { month_goal: null }), NOW) === 'start',
    'поводы: start приходит и без поставленной цели')

  // Месяц, целиком покрытый стартовой суммой: внесённых руками дней нет.
  const carried = mk([], { carry: { upTo: '2026-08-14', amount: 1_400_000 } })
  const cc = shareConditions(carried, NOW)
  ok(!cc.start && !cc.pace && !cc.week && !cc.month,
    'поводы: месяц из одной стартовой суммы не даёт ни одного повода')

  // Та же сумма, разнесённая по дням: `spread` тоже не считается.
  const spread = mk([], { carry: { upTo: '2026-08-14', amount: 1_400_000, spread: true } })
  ok(topShareReason(spread, NOW) === '', 'поводы: разнесённая стартовая сумма поводов не даёт')

  // Порог первого прогноза — три дня, сколько бы дней ни было в сумме.
  ok(PACE_DAYS === 3, 'поводы: порог первого прогноза — три внесённых дня')
  const two = mk([day(1), day(2)], { carry: { upTo: '2026-08-10', amount: 1_000_000 } })
  ok(!shareConditions(two, NOW).pace, 'поводы: pace не приходит на двух днях при полной стартовой сумме')
  ok(shareConditions(mk([day(1), day(2), day(3)]), NOW).pace, 'поводы: три дня — pace выполнен')

  // Неделя: календарно закончившаяся и внесённая целиком.
  const wk = []
  for (let i = 1; i <= 9; i++) wk.push(day(i))
  ok(topShareReason(mk(wk), NOW) === 'week', 'поводы: прожитая неделя без пропусков даёт week')
  const holed = wk.filter((x) => x.date !== '2026-08-05')
  ok(!shareConditions(mk(holed), NOW).week, 'поводы: неделя с дырой week не даёт')
  // Идущая неделя, внесённая до вчера, поводом не является: она не кончилась.
  const running = []
  for (let i = 10; i <= 14; i++) running.push(day(i))
  ok(!shareConditions(mk(running), NOW).week, 'поводы: идущая неделя week не даёт')

  // Месяц: закончился календарно И внесён целиком.
  const SEP = new Date(2026, 8, 2, 12, 0, 0)
  const full = []
  for (let i = 1; i <= 31; i++) full.push(day(i))
  const closedMonth = mk(full, {}, SEP)
  ok(topShareReason(closedMonth, SEP) === 'month', 'поводы: закрытый месяц целиком даёт month')
  const gappy = full.filter((x) => x.date !== '2026-08-19')
  const gappyM = mk(gappy, {}, SEP)
  ok(!shareConditions(gappyM, SEP).month, 'поводы: месяц с пропусками month не даёт')
  ok(topShareReason(gappyM, SEP) === 'week', 'поводы: у месяца с пропусками остаётся week')

  // Приоритет: выполнено всё — показывается month.
  const all = shareConditions(closedMonth, SEP)
  ok(all.start && all.pace && all.week && all.month, 'поводы: на закрытом месяце выполнены все четыре')
  ok(topShareReason(closedMonth, SEP) === 'month', 'поводы: при совпадении выбирается month')

  // Показ по разу на повод; старший забрал показ — младшие не подсовываются.
  ok(shareReason(one, [], NOW) === 'start', 'поводы: непоказанный повод приходит')
  ok(shareReason(one, ['start'], NOW) === '', 'поводы: показанный повод второй раз не приходит')
  ok(shareReason(closedMonth, ['month'], SEP) === '',
    'поводы: после month младшие поводы того же месяца не приходят')

  // Перенос месяца обнуляет отметки: поводы приходят в новом месяце заново.
  const moved = nextMonthState({ ...closedMonth, month: '2026-08', dow_coef: [1, 1, 1, 1, 1, 1, 1], shareSeen: ['month', 'week'] },
    { month: '2026-09', target: 3_000_000 })
  ok((moved.shareSeen || []).length === 0, 'поводы: перенос месяца обнуляет отметки показа')

  // Числа сообщения: процент берётся без обрезки сверху. `landPct` в ядре
  // обрезано `Math.min(100, …)` ради полосы прогресса — в тексте, который
  // уезжает за пределы приложения, эта обрезка превратила бы честные 105 %
  // в 100 %.
  const ahead = mk([day(1, 200_000), day(2, 200_000), day(3, 200_000)])
  ok(ahead.landPct === 100, 'поводы: landPct в ядре по-прежнему обрезан сверху — брать его нельзя')
  const nAhead = Number((shareText('pace', ahead).match(/(\d+)% плана/) || [])[1])
  ok(nAhead > 100, 'поводы: при прогнозе выше плана процент в тексте больше 100')

  // Закрытый месяц меряется фактом, а не прогнозом.
  const under = []
  for (let i = 1; i <= 31; i++) under.push(day(i, 50_000))
  const underM = mk(under, {}, SEP)
  const nMonth = Number((shareText('month', underM).match(/(\d+)% плана/) || [])[1])
  ok(nMonth === Math.round((underM.realizedRev / underM.T) * 100),
    'поводы: процент закрытого месяца считается фактом')

  // Рефрен живёт ровно в одном сообщении из четырёх.
  const texts = ['start', 'pace', 'week', 'month'].map((r) => shareText(r, closedMonth))
  ok(texts.filter((t) => t.includes('Рост не ждёт.')).length === 1,
    'поводы: рефрен «Рост не ждёт.» стоит ровно в одном сообщении')
  ok(texts.every((t) => t.trim().endsWith('gderost.ru')),
    'поводы: все четыре сообщения кончаются коротким адресом')
  ok(texts.every((t) => !t.includes('#m=')), 'поводы: упакованного месяца в сообщениях нет')
}

// 25. Режим ссылки. У месяца два получателя: партнёру суммы показывать нормально,
//     клубу и в сториз — никогда. Спрятать рубли на экране мало: спрятанное число
//     остаётся в адресе, и любой, кто умеет его читать, достанет обратно. Поэтому
//     в режиме роста деньги нормализуются к плану ДО упаковки, и проверка держит
//     обе стороны — что выручки в ссылке нет и что проценты при этом не поехали.
{
  const src = {
    ready: true, company: 'Компания', unit: 'Первый юнит',
    month: '2026-08', month_target: 3_100_000, month_goal: 3_500_000,
    dow_coef: [0.85, 0.9, 0.95, 1, 1.2, 1.15, 0.95], coef_src: 'data', shape_id: 'default', shape_from: '',
    carry: { upTo: '2026-08-05', amount: 400_000, spread: true },
    days: [], forecastLog: [],
  }
  for (let d = 6; d <= 14; d++) {
    const iso = `2026-08-${String(d).padStart(2, '0')}`
    src.days.push({ date: iso, rev: 91_000 + d * 137, planRef: 100_000 })
    src.forecastLog.push({ at: iso, after: iso, landing: 3_000_000 + d, was: 3_000_000, goalState: 'ok' })
  }

  const g = decodeState(encodeState(src, 'growth'))
  const f = decodeState(encodeState(src, 'full'))
  ok(g && f, 'ссылка: оба режима расшифровываются')
  ok(g.shareMode === 'growth' && f.shareMode === 'full', 'ссылка: режим доезжает до экрана получателя')
  ok(encodeState(src).length === encodeState(src, 'growth').length,
    'ссылка: режим по умолчанию — рост')

  // Ни одной исходной суммы в ссылке роста.
  const packed = JSON.stringify(packState(src, 'growth'))
  const secrets = [3_100_000, 3_500_000, 400_000, ...src.days.map((x) => x.rev)]
  ok(secrets.every((n) => !packed.includes(String(n))),
    'ссылка роста: ни одной исходной суммы в упакованном месяце')
  ok(g.month_target === GROWTH_BASE && g.month_target !== src.month_target,
    'ссылка роста: план заменён условной величиной')
  ok(g.days.every((d, i) => d.rev !== src.days[i].rev) && g.carry.amount !== src.carry.amount,
    'ссылка роста: дни и стартовая сумма пересчитаны')
  ok(f.month_target === src.month_target && f.days[0].rev === src.days[0].rev,
    'полная ссылка: суммы доезжают как есть')

  // Отношения сохраняются: получатель видит те же проценты и те же дни.
  const mA = computeMini(src, NOW)
  const mG = computeMini(g, NOW)
  const mF = computeMini(f, NOW)
  const pct = (m) => Math.round((m.landing / m.T) * 100)
  const pctFact = (m) => Math.round((m.realizedRev / m.T) * 100)
  ok(pct(mA) === pct(mG) && pct(mA) === pct(mF), 'ссылка роста: процент плана у получателя тот же')
  ok(pctFact(mA) === pctFact(mG), 'ссылка роста: доля факта та же')
  ok(mA.enteredCount === mG.enteredCount && mA.DIM === mG.DIM && mA.days.length === mG.days.length,
    'ссылка роста: счёт дней и длина месяца те же')
  ok(близко(mA.landDev, mG.landDev, 1e-4), 'ссылка роста: отклонение прогноза то же')
  ok(mA.days.every((d, i) => d.entered === mG.days[i].entered && d.inCarry === mG.days[i].inCarry),
    'ссылка роста: какие дни внесены, а какие пришли суммой, видно так же')
  ok(mA.weeks.length === mG.weeks.length
    && mA.weeks.every((w, i) => близко(w.faWidth, mG.weeks[i].faWidth, 1e-3)),
    'ссылка роста: форма недель у получателя та же')

  // Журнал в режим роста не едет, и ссылка от этого короче.
  ok(g.forecastLog.length === 0 && f.forecastLog.length === src.forecastLog.length,
    'ссылка роста: журнал прогноза не уезжает')
  const lenG = shareUrl(src, 'https://gderost.ru/', 'growth').length
  const lenF = shareUrl(src, 'https://gderost.ru/', 'full').length
  ok(lenG < lenF, `ссылка роста короче полной (${lenG} против ${lenF} знаков)`)

  // Старые ссылки не ломаются: поля режима у них нет, и они полные.
  const oldPack = packState(src, 'full')
  delete oldPack.r
  const b64old = Buffer.from(JSON.stringify(oldPack)).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  ok(decodeState(b64old).shareMode === 'full', 'ссылка без поля режима читается полной')

  // Без плана режим роста не строится: мерить процент выполнения не от чего.
  ok(packState({ ...src, month_target: 0 }, 'growth') === null,
    'ссылка роста: без плана месяца не собирается')
}

console.log(fails ? `✗ провалов: ${fails}` : '✓ все проверки прошли')
process.exit(fails ? 1 : 0)
