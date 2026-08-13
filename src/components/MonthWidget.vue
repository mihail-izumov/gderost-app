<script setup>
import { computed } from 'vue'
import { formatRubBig, monthLabel, daysWord } from '../i18n/format.js'

// Виджет месяца: факт · прогноз · план · цель на одной шкале, в этом порядке.
//
// Порядок не декоративный — это и есть метод: факт → прогноз ≤ план ≤ цель.
// Четыре величины стоят на общей линейке, поэтому разрыв между прогнозом
// и планом видно как расстояние, а не как разность двух чисел из разных углов.
//
// Прогноз здесь один. Не «оптимистичный и осторожный» на выбор — один,
// потому что выбирать между прогнозами значит выбирать удобный, а месяц
// приземлится ровно туда, куда его несёт сегодняшний темп.
//
// Заливки различаются фактурой, а не только цветом: сплошная — сделанное,
// точки — то, что доложит текущий темп, штрих — то, что обязан доложить план.
// На чёрно-белом экране и при дальтонизме порядок читается так же.

const props = defineProps({ m: { type: Object, required: true } })

// Линейка идёт до самой дальней величины: обрезать шкалу по плану значит
// спрятать цель, а обрезать по факту — спрятать всё остальное.
const scaleMax = computed(() => Math.max(
  props.m.goal || 0, props.m.T, props.m.landing, props.m.realizedRev,
) || 1)
const pct = (v) => Math.max(0, Math.min(100, (v / scaleMax.value) * 100))

const factPct = computed(() => pct(props.m.realizedRev))
const landPct = computed(() => pct(props.m.landing))
const planPct = computed(() => pct(props.m.T))

// Ширина сегмента: величины упорядочены, но факт может обогнать план —
// отрицательная ширина в этом случае обнуляется, а не рисуется наизнанку.
const forecastW = computed(() => Math.max(0, landPct.value - factPct.value))
const planW = computed(() => Math.max(0, planPct.value - Math.max(factPct.value, landPct.value)))

const FACT = { background: 'var(--accent)' }
const FORECAST = {
  backgroundColor: 'var(--surface-2)',
  backgroundImage: 'radial-gradient(var(--accent) 1.1px, transparent 1.2px)',
  backgroundSize: '5px 5px',
}
const PLAN = {
  backgroundImage: 'repeating-linear-gradient(45deg, var(--text-muted) 0 1px, var(--surface-2) 1px 5px)',
}

const legend = computed(() => [
  { key: 'fact', label: 'Факт', value: props.m.realizedRev, swatch: FACT },
  { key: 'forecast', label: 'Прогноз', value: props.m.landing, swatch: FORECAST },
  { key: 'plan', label: 'План', value: props.m.T, swatch: PLAN },
  {
    key: 'goal',
    label: 'Цель',
    value: props.m.goal,
    swatch: { background: 'transparent', border: '1.5px solid var(--text)' },
  },
])
</script>

<template>
  <section
    class="rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4"
    :style="{ boxShadow: 'var(--card-shadow)' }"
  >
    <div class="flex items-start justify-between gap-3">
      <h2 class="text-[1.25rem] font-bold capitalize leading-tight text-[var(--text)]">
        {{ monthLabel(m.month) }}
      </h2>
      <span
        class="shrink-0 rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-[0.8125rem] text-[var(--text-secondary)]"
      >Осталось {{ m.daysLeft }} {{ daysWord(m.daysLeft) }}</span>
    </div>

    <div class="relative mt-4 h-3.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
      <i class="absolute bottom-0 top-0 block" :style="{ left: 0, width: factPct + '%', ...FACT }" />
      <i class="absolute bottom-0 top-0 block"
         :style="{ left: factPct + '%', width: forecastW + '%', ...FORECAST }" />
      <i class="absolute bottom-0 top-0 block"
         :style="{ left: Math.max(factPct, landPct) + '%', width: planW + '%', ...PLAN }" />
    </div>

    <!-- Указатель плана: обязательство отмечено на линейке, а не только
         подписью снизу — иначе непонятно, где на шкале проходит граница -->
    <div class="relative h-0">
      <i
        class="absolute -top-6 block h-2 w-0.5"
        :style="{ left: `calc(${planPct}% - 1px)`, background: 'var(--text)' }"
        aria-hidden="true"
      />
    </div>

    <dl class="mt-4 grid grid-cols-4 gap-2">
      <div v-for="l in legend" :key="l.key" class="min-w-0">
        <dt class="flex items-center gap-1.5 text-[0.75rem] text-[var(--text-secondary)]">
          <i class="h-3 w-3 shrink-0 rounded-[3px]" :style="l.swatch" aria-hidden="true" />
          <span class="truncate">{{ l.label }}</span>
        </dt>
        <dd class="mt-1 text-[0.9375rem] font-semibold tabular-nums text-[var(--text)]">
          <template v-if="l.key !== 'goal' || l.value">{{ formatRubBig(l.value) }}</template>
          <span v-else class="text-[0.8125rem] font-normal text-[var(--text-muted)]">нет</span>
        </dd>
      </div>
    </dl>
  </section>
</template>
