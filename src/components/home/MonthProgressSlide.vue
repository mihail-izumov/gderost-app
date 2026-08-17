<script setup>
import { computed, ref, watch } from 'vue'
import { Check } from 'lucide-vue-next'
import { mlnRub } from '../../i18n/home.js'
import { monthLayout, markStyle } from '../../composables/monthLayout.js'

// Один экран деки месяца. Перенесено из рабочего Ранскеила один в один:
// шелл карты, свайп, шапка и точки живут в MonthProgressCard.vue, здесь
// только полоса и подписи.
//
// ЭТО BULLET CHART (Stephen Few), а не четыре риски в ряд. Роли разные,
// и кодируются разными средствами, иначе читатель сравнивает штрихи:
//   ФАКТ    — сама МЕРА, сплошная жёлтая полоса;
//   ПРОГНОЗ — продолжение меры: светло-жёлтая заливка + точечная сыпь
//             («тот же жёлтый = та же мера, точки = ещё не заработано»);
//   НЕДОБОР — от прогноза до порога: ПОЛОСКИ. Не величина, а остаток плана;
//             без заливки пролёт читался как «тут ничего нет»;
//   ПЛАН    — ПОРОГ: штрих, ПЕРЕСЕКАЮЩИЙ полосу сверху и снизу. Именно так
//             в bullet chart рисуется цель-порог: он выше меры и виден сразу;
//   ЦЕЛЬ    — ЭТАЛОН = ВЕРХ ШКАЛЫ. Отдельной метки нет: длина полосы и есть
//             цель. Расстояние от штриха плана до конца = разрыв «план → цель».
//
// Метка цели возвращается ТОЛЬКО когда цель кто-то перерос и она оказалась
// внутри шкалы. Раньше она была третьей риской у правого края, сливалась
// с планом и требовала расшифровки.
//
// ВНУТРЕННИЕ КРАЯ ПРЯМЫЕ: скругление только у трека снаружи, иначе на стыке
// заливки и фактуры появляется светлый серп и полоса читается разорванной.
//
// КАРЕТКА У ПОРОГА: роль обязана читаться формой, а не позицией. Когда план
// близок к цели, штрих прижимается к концу шкалы и без каретки читается как
// торец полосы.
//
// ПОДСВЕТКА ПО ТАПУ: тап по чипу легенды приглушает всё, кроме выбранного.
// Повторный тап снимает. Легенда — единственный способ связать подпись
// с элементом, поэтому она интерактивна, а не декоративна.
//
// Геометрия — monthLayout.js. Здесь НЕТ собственной арифметики процентов.

const props = defineProps({
  fact: { type: Number, default: null },
  plan: { type: Number, default: null },
  forecast: { type: Number, default: null },
  goal: { type: Number, default: null },
  // Счётчик-сигнал от деки: сменился — снять подсветку. Выделение относится
  // к КОНКРЕТНОЙ полосе, таскать его на соседний экран значит врать про то,
  // что выбрано.
  resetToken: { type: Number, default: 0 },
})

// ПРОГНОЗ — светло-жёлтая заливка под точками. Заливка говорит «та же мера,
// что факт, только ещё не заработанная», точки держат контраст. Один светлый
// жёлтый без фактуры не годится: посчитано по WCAG — акцент 35–45 % на белом
// даёт 1,26–1,32:1 против факта и 1,03–1,08:1 против трека, сегмент исчезает.
const TINT = 'color-mix(in srgb, var(--accent) 40%, var(--surface))'
const DOTS = 'radial-gradient(circle at 50% 50%, var(--text-muted) 0.45px, transparent 0.55px)'
const HATCH = 'repeating-linear-gradient(-45deg, transparent 0 2px, var(--text-muted) 2px 3px)'
// Подложка недобора: чуть темнее трека, иначе у зоны не читаются границы
// и пролёт выглядит пустым.
const SHORT_BG = 'color-mix(in srgb, var(--line) 75%, var(--surface-2))'

const L = computed(() => monthLayout(props))
const active = ref(null)

const factStyle = computed(() => ({ width: `${L.value.factPct}%` }))
const gapStyle = computed(() => ({
  left: `${L.value.gapStart}%`,
  width: `${L.value.gapWidth}%`,
  backgroundColor: TINT,
  backgroundImage: DOTS,
  backgroundSize: '2.5px 2.5px',
}))
const shortStyle = computed(() => ({
  left: `${L.value.shortStart}%`,
  width: `${L.value.shortWidth}%`,
  backgroundColor: SHORT_BG,
  backgroundImage: HATCH,
}))
const planMark = computed(() => markStyle(L.value.planPct))

// Подсвечиваем НАКОПЛЕННУЮ ДЛИНУ от нуля, а не отдельный сегмент. Чип
// «Прогноз» показывает всю выручку месяца по прогнозу, а не прирост над
// фактом: подсветка одного приростного сегмента врала бы — число
// и подсвеченная длина обязаны совпадать. Высота полосы при этом не меняется,
// иначе перестраивается масштаб и глаз теряет опору.
const activePct = computed(() => {
  const l = L.value
  if (active.value === 'fact') return l.factPct
  if (active.value === 'forecast') return l.forecastPct
  if (active.value === 'plan') return l.planPct
  if (active.value === 'goal') return l.goalPct
  return null
})
const dimFrom = (startPct) => {
  const a = activePct.value
  if (a == null || startPct == null) return ''
  return startPct > a - 1e-9 ? 'opacity-10' : ''
}
// Метка гаснет только если стоит СТРОГО за величиной: метка самой выбранной
// величины обязана гореть.
const dimAt = (pct) => {
  const a = activePct.value
  if (a == null || pct == null) return ''
  return pct > a + 1e-9 ? 'opacity-10' : ''
}
// Обводим трек, когда выбранная величина равна всей шкале. Признак — позиция,
// а не имя ключа: у набора без цели верхом шкалы становится план.
const wholeScale = computed(() => activePct.value != null && activePct.value >= 99.999)
const goalMark = computed(() => (L.value.goalIsEnd ? null : markStyle(L.value.goalPct)))
function toggle(key) { active.value = active.value === key ? null : key }
watch(() => props.resetToken, () => { active.value = null })

// Колонки — в порядке следования по шкале, чтобы глаз связывал подпись
// с элементом. СОВПАВШИЕ ВЕЛИЧИНЫ СХЛОПЫВАЮТСЯ В ОДНУ: две подписи
// с одинаковым числом читаются как ошибка данных. Схлопываем ТОЛЬКО при
// точном равенстве — сближать разные числа значило бы врать.
const ROLE = { forecast: 1, fact: 2, plan: 3, goal: 4 }
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1)

const columns = computed(() => {
  const l = L.value
  const base = [
    { key: 'fact', name: 'факт', value: props.fact, glyph: 'fill' },
    { key: 'forecast', name: 'прогноз', value: props.forecast, glyph: 'hatch' },
    { key: 'plan', name: 'план', value: props.plan, glyph: 'cross', done: l.reachedPlan },
    { key: 'goal', name: 'цель', value: props.goal, glyph: 'end', done: l.reachedGoal },
  ].filter((c) => c.value != null)

  const groups = new Map()
  for (const c of base) {
    if (!groups.has(c.value)) groups.set(c.value, [])
    groups.get(c.value).push(c)
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([value, items]) => {
      const names = items.map((x) => x.name)
      const label = names.length === 1
        ? cap(names[0])
        : cap(`${names.slice(0, -1).join(', ')} и ${names[names.length - 1]}`)
      const lead = items.reduce((a, b) => (ROLE[b.key] > ROLE[a.key] ? b : a))
      return { key: lead.key, label, value, glyph: lead.glyph, done: items.some((x) => x.done) }
    })
})

// Полоса с метками сама по себе недоступна — дублируем смысл строкой,
// включая «взято»: без него скринридер получит числа, но не результат.
const aria = computed(() => (columns.value.length
  ? columns.value.map((c) => `${c.label} ${mlnRub(c.value)}${c.done ? ' — взято' : ''}`).join(', ')
  : 'Данных по месяцу нет'))
</script>

<template>
  <div>
    <!-- Внешний контейнер с воздухом сверху и снизу: штрих плана ВЫШЕ полосы,
         поэтому он не может жить внутри трека с обрезкой. -->
    <div class="relative pb-1 pt-[10px]" role="img" :aria-label="aria">
      <div data-test="track" class="relative h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <!-- ФАКТ — мера. Тёмного торца на конце нет: границу несёт фактура
             прогноза, а лишняя чёрная риска читалась как ещё одна метка
             и спорила с порогом. -->
        <div
          class="absolute inset-y-0 left-0 bg-[var(--accent)] transition-all duration-500"
          :class="dimFrom(0)"
          :style="factStyle"
        ></div>
        <!-- НЕДОБОР ДО ПЛАНА. Рисуем первым: он лежит под всем и заполняет
             пролёт от прогноза до порога, чтобы тот не читался пустым. -->
        <div
          v-if="L.shortWidth"
          data-test="seg-short"
          class="absolute inset-y-0 transition-all duration-500"
          :class="dimFrom(L.shortStart)"
          :style="shortStyle"
        ></div>
        <!-- ПРОГНОЗ -->
        <div
          v-if="L.gapWidth"
          data-test="seg-forecast"
          class="absolute inset-y-0 transition-all duration-500"
          :class="dimFrom(L.gapStart)"
          :style="gapStyle"
        ></div>
        <div
          v-if="wholeScale"
          data-test="scale-ring"
          class="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-[var(--text)]"
        ></div>
        <div
          v-if="goalMark"
          data-test="mark-goal"
          class="absolute inset-y-0 w-[3px] bg-[var(--text)] transition-opacity"
          :class="dimAt(L.goalPct)"
          :style="goalMark"
        ></div>
      </div>
      <!-- ПЛАН — порог: пересекает полосу сверху и снизу. Живёт НАД треком,
           вне его обрезки, поэтому виден целиком. -->
      <div
        v-if="planMark"
        data-test="mark-plan"
        class="absolute bottom-[1px] top-[7px] w-[2px] rounded-[1px] bg-[var(--text)] transition-opacity"
        :class="dimAt(L.planPct)"
        :style="planMark"
      ></div>
      <!-- КАРЕТКА ПОРОГА. Без неё роль плана угадывалась по позиции: когда план
           близок к цели, штрих прижимался к концу шкалы и читался как утолщённый
           торец полосы. Позиция — переменная, форма — постоянная, поэтому роль
           кодируется формой. Треугольник не двигает метку ни на пиксель. -->
      <svg
        v-if="planMark"
        data-test="caret-plan"
        class="absolute top-0 h-[5px] w-[9px] transition-opacity"
        :class="dimAt(L.planPct)"
        :style="planMark"
        viewBox="0 0 9 5"
        aria-hidden="true"
      >
        <!-- Треугольник рисуем svg, а не бордерами: у бордерного углы скруглить
             нечем, и он выбивался из стиля остальных элементов. -->
        <path d="M1.6 1.2 H7.4 L4.5 3.8 Z" fill="var(--text)" stroke="var(--text)" stroke-width="1.6" stroke-linejoin="round" />
      </svg>
    </div>

    <div class="mt-2 flex items-start justify-between gap-1">
      <button
        v-for="c in columns"
        :key="c.key"
        type="button"
        data-test="legend-chip"
        class="flex min-w-0 flex-1 flex-col items-start gap-[3px] rounded-lg px-1 py-1 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--text-muted)]"
        :class="active === c.key ? 'bg-[var(--surface-2)]' : ''"
        :aria-pressed="active === c.key ? 'true' : 'false'"
        :aria-label="`Подсветить: ${c.label}`"
        @click="toggle(c.key)"
      >
        <span class="flex items-center gap-[5px]">
          <!-- Чип-глиф: все одного размера, внутри — то же средство, которым
               элемент нарисован на полосе. У порога и эталона фон --surface-2:
               это кусок трека. Без фона они читались пустыми чекбоксами. -->
          <i
            class="flex h-[14px] w-[14px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] border transition-colors"
            :class="[
              active === c.key ? 'border-[var(--text)]' : 'border-[var(--line)]',
              c.glyph === 'cross' || c.glyph === 'end' ? 'bg-[var(--surface-2)]' : '',
            ]"
            aria-hidden="true"
          >
            <i v-if="c.glyph === 'fill'" class="h-full w-full bg-[var(--accent)]"></i>
            <i
              v-else-if="c.glyph === 'hatch'"
              class="h-full w-full"
              :style="{ backgroundColor: TINT, backgroundImage: DOTS, backgroundSize: '2.5px 2.5px' }"
            ></i>
            <!-- ПОРОГ: полоски — та же фактура, что у зоны недобора. Чип
                 обозначает не саму риску, а путь до плана. -->
            <i
              v-else-if="c.glyph === 'cross'"
              class="h-full w-full"
              :style="{ backgroundColor: SHORT_BG, backgroundImage: HATCH }"
            ></i>
            <!-- ЭТАЛОН: рамка внутри чипа. Цель — не точка на шкале, а вся её
                 протяжённость, рамка говорит ровно это. -->
            <i v-else class="h-2 w-2 rounded-[2px] border-[1.5px] border-[var(--text)]"></i>
          </i>
          <span class="truncate text-[0.625rem] text-[var(--text-muted)]">{{ c.label }}</span>
          <!-- Порог взят фактом. Галочка монохромная: цвет здесь несёт только
               жёлтая заливка, светофор живёт в «Контроле Дня». -->
          <Check v-if="c.done" class="h-3 w-3 shrink-0 text-[var(--text)]" :stroke-width="3" aria-hidden="true" />
        </span>
        <span class="text-[0.8125rem] font-semibold leading-none text-[var(--text)]">{{ mlnRub(c.value) }}</span>
      </button>
    </div>
  </div>
</template>
