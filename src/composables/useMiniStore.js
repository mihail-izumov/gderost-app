// Хранилище на устройстве. Модульный синглтон: состояние живёт в модуле,
// любой экран получает одно и то же.
//
// Данные никуда не отправляются: ни строчки наружу, ни аккаунта, ни почты.
// Всё, что здесь лежит, лежит в браузере пользователя и стирается вместе с ним.
// Отсюда же следует граница: очистил данные сайта — данные ушли навсегда,
// и об этом честнее сказать в интерфейсе, чем делать вид, что есть облако.

import { reactive, computed, watch } from 'vue'
import { computeMini, nextMonthState, todayISO } from './miniModel.js'
import { DEFAULT } from '../data/weekShape.js'
import { shapeName, shapeStatus } from '../data/weekShape.js'

const KEY = 'gderost.mini.v1'

function emptyState() {
  return {
    ready: false,        // онбординг пройден
    company: '',
    unit: '',
    month: '',           // 'YYYY-MM'
    month_target: 0,
    month_goal: null,
    dow_coef: [...DEFAULT],
    coef_src: 'preset',
    shape_id: 'default',
    shape_from: '',      // 'YYYY-MM' — из какого месяца переехали веса
    carry: null,         // { upTo:'YYYY-MM-DD', amount:Number, spread:Boolean }
    days: [],            // [{ date:'YYYY-MM-DD', rev:Number, planRef:Number }]
    // [{ at, after, landing, was, goalState }] — по одной записи на день
    forecastLog: [],
  }
}

function load() {
  const base = emptyState()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return base
    const saved = JSON.parse(raw)
    if (!saved || typeof saved !== 'object') return base
    // Берём только известные поля: чужой мусор в состояние не попадает.
    Object.keys(base).forEach((k) => {
      if (saved[k] !== undefined) base[k] = saved[k]
    })
    if (!Array.isArray(base.dow_coef) || base.dow_coef.length !== 7) base.dow_coef = [...DEFAULT]
    if (!Array.isArray(base.days)) base.days = []
    if (!Array.isArray(base.forecastLog)) base.forecastLog = []
  } catch {
    // Битое хранилище не должно ронять приложение: начинаем с чистого.
    return emptyState()
  }
  return base
}

const state = reactive(load())

let writeFailed = false
watch(state, (s) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
    writeFailed = false
  } catch {
    // Приватный режим или переполненное хранилище: молчать нельзя, но и падать
    // незачем — сессия доработает в памяти, а экран скажет об этом словами.
    writeFailed = true
  }
}, { deep: true })

export function currentMonth(now = new Date()) {
  return todayISO(now).slice(0, 7)
}

// Модель пересчитывается на каждое изменение состояния — отдельной команды
// «обновить» не существует, и рассинхрона цифр на экране быть не может.
const model = computed(() => (state.ready ? computeMini(state, new Date()) : null))

const monthOver = computed(() => state.ready && state.month < currentMonth())

export function useMiniStore() {
  return {
    state,
    model,
    monthOver,
    storageFailed: () => writeFailed,

    /** Онбординг: четыре поля и ни одним больше. Прогноз не спрашивается. */
    setup({ company, unit, target, goal, earned, earnedUpTo, month }) {
      const m = month || currentMonth()
      state.company = String(company || '').trim()
      state.unit = String(unit || '').trim()
      state.month = m
      state.month_target = Number(target) || 0
      state.month_goal = Number(goal) > 0 ? Number(goal) : null
      state.days = []
      state.forecastLog = []
      const amount = Number(earned)
      state.carry = Number.isFinite(amount) && amount >= 0 && earnedUpTo
        ? { upTo: String(earnedUpTo), amount }
        : null
      state.ready = true
    },

    /**
     * Разнести стартовую сумму по дням её периода — или убрать разнос.
     *
     * Ничего не додумывает: берётся сумма, которую назвал владелец, и его же
     * форма недели. Дни помечаются как разложенные и оценки не получают.
     * Выключается тем же переключателем: раскладка обратима, как и всё здесь.
     */
    setCarrySpread(on) {
      if (state.carry) state.carry = { ...state.carry, spread: !!on }
    },

    /** Правка стартовой суммы: месяц мог начаться не с первого числа. */
    setCarry({ amount, upTo }) {
      const v = Number(amount)
      if (!Number.isFinite(v) || v < 0 || !upTo) return false
      state.carry = { upTo: String(upTo), amount: v, spread: !!(state.carry && state.carry.spread) }
      return true
    },

    /** План и цель правятся в любой момент: обязательство живое, а не бетонное. */
    setTargets({ target, goal }) {
      if (target !== undefined) state.month_target = Number(target) || 0
      if (goal !== undefined) state.month_goal = Number(goal) > 0 ? Number(goal) : null
    },

    setWeekShape(coef, src, shapeId) {
      if (Array.isArray(coef) && coef.length === 7) state.dow_coef = coef.map(Number)
      if (src) state.coef_src = src
      if (shapeId) state.shape_id = shapeId
      // Форма перестала быть перенесённой — месяц, из которого она приехала,
      // больше ничего не объясняет.
      if (src && src !== 'moved') state.shape_from = ''
    },

    /** Первый день, который можно внести по отдельности. */
    firstOpenDay() {
      if (!state.carry) return `${state.month}-01`
      const d = new Date(`${state.carry.upTo}T00:00:00`)
      d.setDate(d.getDate() + 1)
      return todayISO(d)
    },

    /**
     * Внести день. Ноль — валидная выручка: бизнес мог не работать, и это факт,
     * а не пропуск. Повторный ввод той же даты правит её, а не плодит вторую.
     *
     * День, уже вошедший в стартовую сумму, отдельно внести нельзя: его выручка
     * в этой сумме сидит, и вторая запись прибавила бы её к месяцу дважды.
     */
    putDay(date, rev) {
      const value = Number(rev)
      if (!date || !Number.isFinite(value)) return false
      if (state.carry && date <= state.carry.upTo) return false
      const before = model.value ? model.value.landing : null
      // День запоминает линейку, по которой его оценили. Поднимут план в конце
      // месяца — прошлые дни не покраснеют задним числом: их мерили не этим.
      const row = model.value ? model.value.days.find((d) => d.iso === date) : null
      const planRef = row && row.plan > 0 ? row.plan : undefined
      const i = state.days.findIndex((d) => d.date === date)
      // Правка суммы за уже внесённый день линейку не меняет: день тот же.
      const keepRef = i >= 0 && state.days[i].planRef ? state.days[i].planRef : planRef
      if (i >= 0) state.days[i] = { date, rev: value, planRef: keepRef }
      else state.days.push({ date, rev: value, planRef })
      state.days.sort((a, b) => (a.date < b.date ? -1 : 1))
      const after = model.value ? model.value.landing : null
      if (after != null) {
        // На день приходится одна запись: правка того же дня переписывает её,
        // а не кладёт вторую. Иначе журнал растёт от каждой опечатки, а на
        // экране всё равно виден один день — расхождение, которого не видно.
        // Точка отсчёта `was` при этом остаётся первой: она про то, каким был
        // прогноз до того, как этот день внесли впервые.
        const i = state.forecastLog.findIndex((e) => e && e.after === date)
        const was = i >= 0 && state.forecastLog[i].was !== undefined ? state.forecastLog[i].was : before
        // Достижимость запоминается вместе со строкой: колонка журнала
        // показывает состояние момента, а не сегодняшнее.
        const entry = { at: todayISO(), after: date, landing: after, was, goalState: model.value.goalState }
        if (i >= 0) state.forecastLog[i] = entry
        else state.forecastLog.push(entry)
      }
      return true
    },

    /**
     * Мягкий перенос месяца.
     *
     * Календарь ушёл вперёд — приложение предлагает начать следующий месяц.
     * План и цель приходят сюда подтверждёнными владельцем: обязательство
     * не копируется молча. Веса дней недели переезжают значениями, дни,
     * стартовая сумма и журнал прогноза стираются — выгрузка предлагается
     * до этого, а не после: другой копии старого месяца нигде нет.
     */
    startNextMonth({ month, target, goal }) {
      const next = nextMonthState(state, { month: month || currentMonth(), target, goal })
      if (!next) return false
      Object.assign(state, next)
      return true
    },

    removeDay(date) {
      const i = state.days.findIndex((d) => d.date === date)
      if (i >= 0) state.days.splice(i, 1)
    },

    /**
     * Выгрузка месяца текстом.
     *
     * Данных нет нигде, кроме этого устройства, — значит и унести их человек
     * должен уметь без нас. Разметка простая: таблицы читаются глазами,
     * вставляются в заметки и открываются таблицей.
     *
     * Выгружается всё состояние, а не то, что видно на экранах: линейка дня,
     * форма недели с её источником, разнос стартовой суммы, журнал прогноза.
     * Раньше половина этого оставалась в хранилище, и выгрузку можно было
     * прочитать, но нельзя было по ней восстановить месяц. С переносом месяца
     * это перестало быть мелочью: после переноса другой копии не существует.
     */
    exportText() {
      const s = state
      const pad = (n) => String(n).padStart(2, '0')
      const now = new Date()
      const lines = [
        `# ${s.unit || s.company || 'Бизнес'} — ${s.month}`,
        `Выгружено ${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`,
        '',
        '## Месяц',
        `Компания: ${s.company || '—'}`,
        `Бизнес-юнит: ${s.unit || '—'}`,
        `Месяц: ${s.month}`,
        `План месяца: ${s.month_target}`,
        s.month_goal ? `Цель месяца: ${s.month_goal}` : 'Цель месяца: не поставлена',
        '',
        '## Стартовая сумма',
      ]
      if (s.carry) {
        lines.push(
          `Заработано с начала месяца по ${s.carry.upTo} включительно: ${s.carry.amount}`,
          `Разнесено по дням: ${s.carry.spread ? 'да' : 'нет'}`,
        )
      } else {
        lines.push('Стартовой суммы нет: месяц ведётся с первого числа')
      }

      lines.push(
        '',
        '## Форма недели',
        `Веса Пн–Вс: ${(s.dow_coef || []).join(', ')}`,
        `Источник: ${shapeName(s.coef_src, s.shape_id, s.shape_from)} (${shapeStatus(s.coef_src, 0, s.shape_id, s.shape_from).label})`,
        `Служебные значения: coef_src=${s.coef_src}, shape_id=${s.shape_id}${s.shape_from ? `, shape_from=${s.shape_from}` : ''}`,
        '',
        '## Дни',
        '| дата | выручка | план дня в момент ввода |',
        '| --- | --- | --- |',
      )
      if (s.days.length) {
        s.days.forEach((d) => lines.push(`| ${d.date} | ${d.rev} | ${d.planRef != null ? d.planRef : '—'} |`))
      } else {
        lines.push('| — | — | — |')
      }

      lines.push(
        '',
        '## Журнал прогноза',
        '| день | приземление после него | было до него | достижимость | записано |',
        '| --- | --- | --- | --- | --- |',
      )
      if (s.forecastLog.length) {
        s.forecastLog.forEach((e) => lines.push(
          `| ${e.after} | ${e.landing} | ${e.was != null ? e.was : '—'} | ${e.goalState || '—'} | ${e.at || '—'} |`,
        ))
      } else {
        lines.push('| — | — | — | — | — |')
      }
      return lines.join('\n')
    },

    /** Полная очистка: инструмент возвращаемый, выход не заперт. */
    reset() {
      Object.assign(state, emptyState())
      try { localStorage.removeItem(KEY) } catch { /* нечего чистить */ }
    },
  }
}
