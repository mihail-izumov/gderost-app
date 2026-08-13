// miniModel.js — расчётное ядро Ранскейл Мини. Чистый JS, без vue и DOM.
//
// Считает на том, что ввёл владелец: план месяца, цель, выручку по дням.
// Прогноз один — «куда приземлится месяц при текущем темпе». Сценарии и
// внешние факторы числа прогноза не двигают.
//
// Правила честности, зашитые в расчёт:
//   • история не переписывается: закрытые дни задним числом не перекрашиваются.
//     День меряется против того плана, который стоял в момент ввода, и запоминает
//     его. Поднять план в конце месяца и обнаружить, что прошлые дни покраснели
//     задним числом, нельзя: оценка выставлялась не по этой линейке;
//   • прошлое, внесённое одной суммой, остаётся серым — дневного факта у него
//     не существует, поэтому оценка дню не ставится никогда;
//   • всё введённое носит статус «со слов», посчитанное из него — «посчитано»;
//   • деление «достижимо / нужен рекорд / вне досягаемости» опирается на лучший
//     день самого пользователя, а не на чужие ориентиры.
//
// Инварианты (scripts/verify-mini.mjs):
//   • сумма планов всех дней месяца равна плану месяца ровно;
//   • светофор: ≥1.00 good · 0.85–0.99 warn · <0.85 bad · нет данных idle;
//   • дни, вошедшие суммой, оценки не имеют ('carry');
//   • неделя N открыта ⇔ все прошедшие дни недель 1..N-1 внесены.

export const DOW_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
export const GOOD = 1.0
export const OK = 0.85

// Единый светофор: одни пороги везде — день, неделя, посадка месяца.
export function sigClass(r) {
  if (r == null || !Number.isFinite(r)) return 'idle'
  if (r >= GOOD) return 'good'
  if (r >= OK) return 'warn'
  return 'bad'
}

const pad2 = (n) => String(n).padStart(2, '0')
const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0)

// Локальная дата пользователя: его бизнес — его часовой пояс.
export function todayISO(now = new Date()) {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

/**
 * Модель месяца одного бизнес-юнита.
 *
 * set = {
 *   month: 'YYYY-MM',
 *   month_target: Number,            // план — обязательство владельца
 *   month_goal: Number|null,         // цель — опциональна; null → шкала до плана
 *   dow_coef: [7],                   // веса дней недели Пн..Вс
 *   coef_src: 'preset'|'user'|'data',// откуда веса: пресет · правка · свои данные
 *   carry: { upTo:'YYYY-MM-DD', amount:Number }|null, // прошлое одной суммой
 *   // введённые по одному дни; planRef — план этого дня в момент ввода
 *   days: [{ date:'YYYY-MM-DD', rev:Number, planRef:Number|undefined }],
 * }
 *
 * `now` передаётся в тестах, чтобы расчёт был воспроизводим.
 */
export function computeMini(set, now = new Date()) {
  if (!set || typeof set !== 'object') return null
  const [Y, M] = String(set.month || '').split('-').map(Number)
  if (!Y || !M) return null
  const DIM = new Date(Y, M, 0).getDate()
  const coefArr = Array.isArray(set.dow_coef) && set.dow_coef.length === 7
    ? set.dow_coef.map((c) => (Number.isFinite(Number(c)) && Number(c) > 0 ? Number(c) : 1))
    : [1, 1, 1, 1, 1, 1, 1]

  const byDate = {}
  const planRefByDate = {}
  ;(set.days || []).forEach((x) => {
    // ноль — валидная выручка (бизнес был закрыт); отбрасываются только не-числа
    if (x && typeof x.date === 'string' && Number.isFinite(Number(x.rev))) {
      byDate[x.date] = Number(x.rev)
      if (Number.isFinite(Number(x.planRef)) && Number(x.planRef) > 0) {
        planRefByDate[x.date] = Number(x.planRef)
      }
    }
  })
  const carry = set.carry && Number.isFinite(Number(set.carry.amount)) && set.carry.upTo
    ? { upTo: String(set.carry.upTo), amount: Number(set.carry.amount) }
    : null

  const tISO = todayISO(now)

  // Все дни месяца: план строится на полный месяц, а не на введённый кусок.
  const days = []
  for (let dd = 1; dd <= DIM; dd++) {
    const dt = new Date(Y, M - 1, dd)
    const dow = ((dt.getDay() + 6) % 7) + 1 // 1=Пн..7=Вс
    const iso = `${Y}-${pad2(M)}-${pad2(dd)}`
    const entered = Object.prototype.hasOwnProperty.call(byDate, iso)
    const inCarry = !entered && !!carry && iso <= carry.upTo
    days.push({
      dd, iso, dow, dowRu: DOW_RU[dow - 1], weekend: dow >= 6,
      coef: coefArr[dow - 1], weight: coefArr[dow - 1],
      fact: entered ? byDate[iso] : null,
      entered,
      inCarry,               // закрыт суммой: серый, оценка не ставится никогда
      closed: entered || inCarry,
      // подлежит вводу: день уже прошёл (вчера и раньше), а закрытым не стал
      due: iso < tISO && !entered && !inCarry,
      isToday: iso === tISO,
    })
  }

  // План: сумма планов дней равна плану месяца ровно.
  const T = Number(set.month_target) || 0
  const sumW = sum(days, (x) => x.weight)
  days.forEach((x) => {
    x.plan = sumW ? (T * x.weight) / sumW : 0
    // Линейка, по которой день оценивался. У дней без запомненного плана
    // (внесённых до появления этого правила) берётся текущий — иначе оценки
    // у них не будет вовсе, а это хуже, чем оценка по нынешней линейке.
    x.planAt = planRefByDate[x.iso] != null ? planRefByDate[x.iso] : x.plan
  })

  // Цель опциональна: нет — шкала строится до плана, маркер цели не рисуется.
  const goalRaw = Number(set.month_goal)
  const goal = Number.isFinite(goalRaw) && goalRaw > 0 ? goalRaw : null

  // Факт: введённые дни + прошлое, вошедшее суммой.
  const closed = days.filter((x) => x.closed)
  const enteredDays = days.filter((x) => x.entered)
  const carryDays = days.filter((x) => x.inCarry)
  const realizedRev = sum(enteredDays, (x) => x.fact) + (carry ? carry.amount : 0)

  // Темп: вся закрытая выручка на вес всех закрытых дней. У суммы нет разбивки
  // по дням, но вес её дней известен — темп считается честно.
  const wClosed = sum(closed, (x) => x.weight)
  const impliedBase = wClosed > 0 ? realizedRev / wClosed : 0

  // Хвост: остаток плана разносится по весам открытых дней.
  const remaining = days.filter((x) => !x.closed)
  const wRemain = sum(remaining, (x) => x.weight)
  const remainTarget = Math.max(T - realizedRev, 0)
  const adjBase = wRemain > 0 ? remainTarget / wRemain : 0
  days.forEach((x) => { x.need = x.closed ? null : adjBase * x.weight })

  // Приземление: один прогноз, при текущем темпе, если ничего не менять.
  const landing = realizedRev + sum(remaining, (x) => impliedBase * x.weight)

  // Достижимость — против лучшего дня самого пользователя. Лучший день известен
  // только из дней, введённых по одному; из суммы его не восстановить, поэтому
  // при одном суммовом прошлом состояние честно «неизвестно».
  const maxObsBase = enteredDays.length
    ? Math.max(...enteredDays.map((x) => x.fact / x.weight))
    : null
  const goalState = maxObsBase == null
    ? (wClosed > 0 ? 'unknown' : 'ok')
    : adjBase > maxObsBase * 1.001 ? 'out'
    : adjBase > impliedBase * 1.25 ? 'record'
    : 'ok'
  const achievable = goalState === 'ok' || goalState === 'record' || goalState === 'unknown'

  // Исполнение плана на закрытых днях.
  // По линейке момента ввода: поднятый в конце месяца план не делает
  // задним числом хуже те дни, что оценивались по прежней.
  const planRealized = sum(closed, (x) => x.planAt)
  const onPlan = planRealized > 0 ? realizedRev / planRealized : null
  const tailCum = planRealized - realizedRev

  // Нужный темп и цена промедления.
  const lastClosedISO = closed.length ? closed[closed.length - 1].iso : null
  const futureDays = days.filter((x) => !x.closed && (!lastClosedISO || x.iso > lastClosedISO))
  const currentPace = closed.length ? realizedRev / closed.length : 0
  const needPerDay = futureDays.length ? remainTarget / futureDays.length : 0
  const paceGap = currentPace ? needPerDay / currentPace - 1 : 0

  // Недели Пн–Вс. Следующая неделя открывается, когда все прошедшие дни
  // предыдущих внесены. Запирают данные, а не деньги: ввод задним числом
  // разрешён всегда — он неделю и отпирает.
  const weeks = []
  let cur = null
  days.forEach((x) => { if (!cur || x.dow === 1) { cur = { days: [] }; weeks.push(cur) } cur.days.push(x) })
  let prevComplete = true
  weeks.forEach((w, i) => {
    w.idx = i + 1
    w.from = w.days[0].dd
    w.to = w.days[w.days.length - 1].dd
    w.plan = sum(w.days, (x) => x.plan)
    w.factDays = w.days.filter((x) => x.entered)
    w.fact = sum(w.factDays, (x) => x.fact)
    w.hasFact = w.factDays.length > 0
    // против плана меряются только дни с известной дневной выручкой:
    // дни, вошедшие суммой, в недельную оценку не входят
    w.partOfPlan = sum(w.factDays, (x) => x.planAt)
    w.delta = w.fact - w.partOfPlan
    w.ratio = w.partOfPlan > 0 ? w.fact / w.partOfPlan : null
    w.leftDays = w.days.filter((x) => !x.closed).length
    w.need = sum(w.days.filter((x) => !x.closed), (x) => x.need || 0)
    w.missing = w.days.filter((x) => x.due).length
    w.complete = w.missing === 0
    w.isCurrent = w.days.some((x) => x.isToday)
    w.open = prevComplete
    prevComplete = prevComplete && w.complete
    // Полоса недели — доля факта от плана тех же дней. Меряем против плана
    // дней с дневной выручкой: делить на план всей недели значит занижать
    // неделю, которая ещё не кончилась.
    w.faWidth = w.partOfPlan > 0 ? Math.max(0, Math.min(100, (w.fact / w.partOfPlan) * 100)) : 0
    w.rows = w.days.map((x) => ({
      dd: x.dd, dowRu: x.dowRu, weekend: x.weekend, isToday: x.isToday,
      plan: x.planAt, fact: x.fact, need: x.need,
      entered: x.entered, inCarry: x.inCarry, due: x.due,
      // `full` — день с известной дневной выручкой: только у него бывает
      // заливка и оценка. `status` отделяет его от дня, вошедшего суммой,
      // и от дня, которого ещё не было: три разных пустоты, три разных вида.
      full: x.entered,
      status: x.entered ? 'full' : x.inCarry ? 'carry' : null,
      ratio: x.entered ? x.fact / x.planAt : null,
      sig: x.inCarry ? 'carry' : x.entered ? sigClass(x.fact / x.planAt) : 'idle',
      progWidth: x.entered ? Math.min(100, (x.fact / x.planAt) * 100) : 0,
    }))
  })

  // Статистика введённых дней по светофору (суммовое прошлое не участвует).
  const stG = enteredDays.filter((x) => x.fact / x.planAt >= GOOD).length
  const stY = enteredDays.filter((x) => { const r = x.fact / x.planAt; return r >= OK && r < GOOD }).length
  const stR = enteredDays.filter((x) => x.fact / x.planAt < OK).length
  const pctOf = (k) => (enteredDays.length ? Math.round((k / enteredDays.length) * 100) : 0)
  const dayStats = enteredDays.length
    ? { total: enteredDays.length, good: stG, warn: stY, bad: stR, pctGood: pctOf(stG), pctWarn: pctOf(stY), pctBad: pctOf(stR) }
    : null

  // Виджет месяца.
  const landDev = T ? landing / T - 1 : 0
  const factPct = T ? Math.min(100, (realizedRev / T) * 100) : 0
  const landPct = T ? Math.min(100, (landing / T) * 100) : 0
  const gap = Math.max(0, T - landing)
  const daysLeft = days.filter((x) => x.iso >= tISO).length

  // Сегодняшний день — для «сколько надо сегодня».
  const todayRow = days.find((x) => x.isToday) || null

  // Журнал прогноза: куда приземлялся месяц после каждого внесённого дня.
  // Ряд не перестраивается задним числом — каждая строка хранит прогноз,
  // каким он был в момент ввода того дня. Пересчитать его по сегодняшним
  // весам значит стереть ровно ту историю, ради которой журнал и ведётся.
  const logByDay = new Map()
  ;(set.forecastLog || []).forEach((e) => {
    if (e && typeof e.after === 'string' && Number.isFinite(Number(e.landing))) {
      logByDay.set(e.after, Number(e.landing))
    }
  })
  const journal = [...logByDay.keys()].sort().map((iso, i, arr) => {
    const value = logByDay.get(iso)
    const prev = i > 0 ? logByDay.get(arr[i - 1]) : null
    const landingPct = T ? value / T : null
    return {
      date: iso,
      landing: value,
      landingPct,
      sig: sigClass(landingPct),
      arrow: prev == null ? 'flat'
        : value > prev * 1.001 ? 'up'
        : value < prev * 0.999 ? 'down' : 'flat',
      goalState,
    }
  })

  // Коэффициенты дней недели с источником и числом наблюдений. Пресет и правка
  // человека подписаны допущением: то, что приложение приняло за него без
  // данных, обязано быть названо своим словом.
  const obs = [0, 0, 0, 0, 0, 0, 0]
  enteredDays.forEach((x) => { obs[x.dow - 1] += 1 })
  const fromData = (set.coef_src || 'preset') === 'data'
  const coefRows = coefArr.map((c, i) => ({
    dowRu: DOW_RU[i],
    coef: c,
    n: obs[i],
    src: fromData ? 'данные' : 'допущение',
    assume: !fromData,
  }))
  const maxCoef = Math.max(...coefArr, 0.01)

  return {
    month: set.month, Y, M, DIM,
    T, goal, coefSrc: set.coef_src || 'preset',
    realizedRev, realizedCount: closed.length, enteredCount: enteredDays.length,
    carry, carryDays: carryDays.length,
    impliedBase, adjBase,
    landing, landDev, fcSig: sigClass(T ? landing / T : null),
    achievable, goalState, remainTarget, factPct, landPct, gap,
    planRealized, onPlan, tailCum,
    spread: remaining.length ? Math.abs(tailCum) / remaining.length : 0,
    currentPace, needPerDay, paceGap, futureCount: futureDays.length,
    daysLeft, todayNeed: todayRow && !todayRow.closed ? todayRow.need : null,
    days, weeks, dayStats, journal, coefRows, maxCoef,
  }
}
