<script setup>
import { computed, ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import CoefRows from '../daily/CoefRows.vue'
import { formatRub, formatGrowth, plural } from '../../i18n/format.js'
import { monthCap } from '../../i18n/home.js'
import { SIG_VAR, L } from '../../i18n/daily.js'
import { sigClass } from '../../composables/miniModel.js'

// Месяц — главный блок «Прогресса».
//
// На его месте стояла идущая неделя, и это была ошибка масштаба: страница
// отвечает на вопрос «куда идёт месяц», а начиналась с семи дней.
//
// ⚠ Плана, прогноза и трёхчастной полосы здесь нет. Ровно та же полоса стоит
// на «Сегодня», считает то же самое и делает это точнее — две одинаковые
// полосы на соседних экранах человек читает как два разных расчёта и начинает
// сверять их между собой. У блока свой вопрос, которого нет больше нигде:
// КАК ИДУТ ДНИ.
//
// Ряд — по делению на день, и высота деления не декоративная: она берётся
// из веса дня недели. Поправка на форму недели живёт в расчётах и до сих пор
// была видна только таблицей коэффициентов в самом низу «Контроля Дня»;
// здесь она читается формой месяца — суббота выше вторника, и понятно,
// почему план на них разный.
//
// Счёт «выше / близко / ниже плана» переехал сюда из отдельного блока внизу
// страницы: он отвечает на тот же вопрос, что и ряд, — как прошли дни, —
// и стоять двумя разными карточками ему незачем. Полоса из того блока
// не переносится: ряд выше информативнее, а два одинаковых счёта подряд
// снова заставляли бы их сверять.

const props = defineProps({
  m: { type: Object, required: true },
  today: { type: String, required: true },
})
const emit = defineEmits(['enter', 'tune'])

// Поправка на день недели открывается прямо здесь, вторым концом к той же
// настройке внизу «Контроля Дня». Вопрос «почему столбцы разной высоты»
// возникает ровно на этом ряду, и отвечать на него в другом разделе — значит
// отправлять человека искать.
const coefOpen = ref(false)

const dayShort = (iso) => `${iso.slice(8)}.${iso.slice(5, 7)}`

// Ближайший день, который можно внести, — строго ПРОШЕДШИЙ: сегодняшний ещё
// идёт, его выручка не итог, и форма ввода его не принимает.
const nextISO = computed(() => {
  const d = props.m.days.find((x) => !x.closed && x.iso < props.today)
  return d ? d.iso : ''
})

// Цвет говорит ровно то же, что и везде в приложении: светофор у дня
// с известной выручкой, серый у дня, вошедшего в стартовую сумму (его
// выручка неизвестна, оценивать нечего), жёлтый у прошедшего дня без цифры —
// это долг. Будущее нейтрально: там ещё ничего не случилось.
const maxW = computed(() => Math.max(...props.m.days.map((d) => d.weight || 1), 0.01))
const strip = computed(() => props.m.days.map((d) => {
  const ahead = !d.closed && d.iso > props.today
  let bg = 'var(--line)'
  if (d.entered) bg = SIG_VAR[sigClass(d.fact / d.planAt)]
  else if (d.inCarry) bg = 'var(--text-muted)'
  else if (d.iso < props.today) bg = 'var(--warning)'
  // Высота — доля веса дня от самого сильного дня месяца. Нижняя граница
  // нужна, чтобы слабый день оставался различимым делением, а не полоской.
  const h = Math.round(14 + ((d.weight || 1) / maxW.value) * 14)
  // ⚠ У дня, который ещё не наступил, столбец говорит две вещи сразу: сам он —
  // план на этот день, а заливка внутри — то, что даст нынешний темп. Разрыв
  // между ними и есть тот самый недобор, только не суммой за месяц, а по дням,
  // и видно, где именно он копится. Считается тем же `impliedBase`, что и весь
  // прогноз: второго расчёта темпа в приложении нет.
  const planDay = d.planAt || 0
  const fcDay = (props.m.impliedBase || 0) * (d.weight || 0)
  const fcPct = ahead && planDay > 0 ? Math.max(0, Math.min(100, (fcDay / planDay) * 100)) : 0
  return { key: d.iso, dd: d.dd, bg, h, ahead, fcPct, today: d.iso === props.today }
}))

const passed = computed(() => props.m.days.filter((d) => d.iso < props.today).length)
const filled = computed(() => props.m.days.filter((d) => d.closed).length)
const missing = computed(() => props.m.days.filter((d) => d.due).length)
const stats = computed(() => props.m.dayStats)
</script>

<template>
  <section class="rounded-[22px] bg-[var(--surface)] p-4">
    <div class="flex items-center gap-2">
      <h2 class="text-[1.0625rem] font-bold leading-none text-[var(--text)]">{{ monthCap(m.month) }}</h2>
      <span
        class="ml-auto inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.6875rem] font-bold tabular-nums"
        :style="{ background: SIG_VAR[m.fcSig] || 'var(--surface-2)', color: m.fcSig === 'warn' ? 'var(--accent-ink)' : 'var(--ink-on-color)' }"
      >{{ formatGrowth(m.landDev) }}</span>
    </div>

    <div class="mt-3 flex items-baseline gap-2">
      <span class="text-[2rem] font-bold leading-none tabular-nums text-[var(--text)]">{{ formatRub(m.realizedRev) }}</span>
      <span class="text-[0.875rem] text-[var(--text-muted)]">факт</span>
    </div>

    <!-- Дни месяца. Высота — сила дня недели, цвет — что с ним стало.
         Сегодняшний отмечен точкой под столбцом: человек ищет глазами
         «где я сейчас», а высоту тут занял смысл. -->
    <div class="mt-3.5 flex h-[28px] items-end gap-[2px]">
      <span
        v-for="d in strip"
        :key="d.key"
        class="relative min-w-0 flex-1 overflow-hidden rounded-[2px]"
        :style="{ height: `${d.h}px`, background: d.bg }"
      >
        <!-- День, который ещё не наступил: сам столбец — план, заливка внутри —
             то, что даст нынешний темп. Разрыв между ними и есть недобор,
             только разложенный по дням. -->
        <i
          v-if="d.ahead && d.fcPct > 0"
          class="absolute inset-x-0 bottom-0 block rounded-[2px]"
          :style="{ height: `${d.fcPct}%`, background: 'color-mix(in srgb, var(--accent) 55%, var(--surface))' }"
        />
        <i
          v-if="d.today"
          class="absolute -bottom-[6px] left-1/2 block h-[3px] w-[3px] -translate-x-1/2 rounded-full"
          :style="{ background: 'var(--action)' }"
        />
      </span>
    </div>

    <!-- Слева — полнота данных одной величиной: сколько прошедших дней внесено.
         Справа — поправка на день недели: вопрос «почему столбцы разной
         высоты» возникает прямо здесь, и ответ открывается здесь же, вторым
         концом к той же настройке внизу «Контроля Дня». -->
    <div class="mt-4 flex items-start gap-3">
      <div class="min-w-0 flex-1">
        <div class="text-[0.6875rem] uppercase tracking-wide text-[var(--text-muted)]">Внесено</div>
        <div class="mt-0.5 text-[1.0625rem] font-bold tabular-nums" :style="{ color: missing > 0 ? 'var(--text)' : 'var(--positive)' }">
          {{ filled }}
          <span class="text-[0.875rem] font-normal text-[var(--text-muted)]">
            из {{ passed }} {{ plural(passed, 'дня', 'дн', 'дн') }}
          </span>
        </div>
      </div>

      <button
        type="button"
        class="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-3 text-left text-[0.75rem] font-medium text-[var(--text)]"
        :aria-expanded="coefOpen ? 'true' : 'false'"
        @click="coefOpen = !coefOpen"
      >
        Поправка на день недели
        <ChevronDown
          class="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform"
          :class="coefOpen ? 'rotate-180' : ''"
          :stroke-width="2"
          aria-hidden="true"
        />
      </button>
    </div>

    <div v-if="coefOpen" class="mt-3 rounded-2xl border border-[var(--line)] p-3">
      <CoefRows :m="m" @tune="emit('tune')" />
    </div>

    <!-- Как прошли внесённые дни против плана. Полосы у этого счёта нет
         намеренно: ряд выше показывает то же самое подробнее. -->
    <div v-if="stats" class="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--line)] pt-3 text-[0.8125rem] text-[var(--text-muted)]">
      <span class="inline-flex items-center gap-1.5">
        <i class="inline-block h-2.5 w-2.5 rounded-sm" style="background: var(--positive)" />
        <b class="font-semibold text-[var(--text)]">{{ stats.good }}</b> {{ L.above }}
      </span>
      <span class="inline-flex items-center gap-1.5">
        <i class="inline-block h-2.5 w-2.5 rounded-sm" style="background: var(--warning)" />
        <b class="font-semibold text-[var(--text)]">{{ stats.warn }}</b> {{ L.close }}
      </span>
      <span class="inline-flex items-center gap-1.5">
        <i class="inline-block h-2.5 w-2.5 rounded-sm" style="background: var(--negative)" />
        <b class="font-semibold text-[var(--text)]">{{ stats.bad }}</b> {{ L.below }}
      </span>
    </div>

    <button
      v-if="nextISO"
      type="button"
      class="mt-3.5 min-h-[48px] w-full rounded-2xl text-[1rem] font-bold"
      :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      @click="emit('enter', nextISO)"
    >Внести {{ dayShort(nextISO) }}</button>
  </section>
</template>
