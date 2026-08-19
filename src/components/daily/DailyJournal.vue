<script setup>
import { computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { mln, dayGenIso, pctWhole, L, SIG_VAR, GOAL_STATE } from '../../i18n/daily.js'

// Журнал прогноза: траектория приземления по дням, ▲/▼ ко вчерашнему, полоса
// доли плана, достижимость точкой. Перенесено из рабочего Ранскеила.
//
// Широкая таблица уходит в горизонтальный скролл контейнера, не страницы:
// иначе колонка достижимости режется на узких экранах.
//
// Ряд не пересчитывается — рендерится. Каждая строка хранит прогноз, каким он
// был в момент ввода того дня.

const props = defineProps({ m: { type: Object, required: true } })
const rows = computed(() => props.m.journal || [])
const arrowChar = (a) => (a === 'up' ? '▲' : a === 'down' ? '▼' : '→')
// Достижимость строки — из момента записи. У строк, записанных до того,
// как это состояние стало запоминаться, его нет, и вместо него стоит прочерк:
// подставить сегодняшнее значило бы перекрасить историю.
const gsOf = (s) => GOAL_STATE[s.goalState] || GOAL_STATE.none
</script>

<template>
  <details v-if="rows.length" open class="group">
    <summary class="flex cursor-pointer list-none items-center gap-2 py-2 text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)] [&::-webkit-details-marker]:hidden">
      {{ L.journal }}
      <ChevronDown class="h-4 w-4 transition-transform group-open:rotate-180" :stroke-width="2.5" />
    </summary>
    <div class="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <!-- ⚠ Горизонтального скролла здесь больше нет. Таблица шириной 600 px
           не помещалась в мобильную колонку, и первым за край уезжал процент —
           главное число строки: человек видел дату, сумму и полосу, а на месте
           доли плана — обрезанную цифру. Достижимость переехала второй строкой,
           и всё, что несёт число, стоит в видимой ширине. -->
      <div
        v-for="(s, i) in rows"
        :key="i"
        class="border-t border-[var(--line)] px-4 py-2 text-[0.8125rem] first:border-t-0"
      >
        <div
          class="grid items-center gap-2.5"
          style="grid-template-columns: 5.25rem 1fr 2.75rem"
        >
          <div class="font-semibold text-[var(--text)]">{{ dayGenIso(s.date) }}</div>
          <div class="flex min-w-0 items-center gap-2">
            <span class="whitespace-nowrap [font-variant-numeric:tabular-nums] text-[var(--text)]">
              {{ mln(s.landing) }} <span class="text-[var(--text-muted)]">{{ arrowChar(s.arrow) }}</span>
            </span>
            <span class="relative h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <i class="absolute bottom-0 left-0 top-0 rounded-full" :style="{ width: Math.min(100, s.landingPct * 100) + '%', background: SIG_VAR[s.sig] }" />
            </span>
          </div>
          <div class="whitespace-nowrap text-right font-bold [font-variant-numeric:tabular-nums] text-[var(--text)]">{{ pctWhole(s.landingPct) }}</div>
        </div>
        <div
          v-if="gsOf(s).journal !== '—'"
          class="mt-0.5 flex items-center gap-1.5 text-[0.75rem] text-[var(--text-muted)]"
        >
          <i class="inline-block h-1.5 w-1.5 shrink-0 rounded-full" :style="{ background: gsOf(s).dot }" />
          {{ gsOf(s).journal }}
        </div>
      </div>
    </div>
    <p class="mt-2 px-1 text-[0.6875rem] leading-snug text-[var(--text-muted)]">
      Прогноз выручки на конец каждого дня (коэффициенты фиксированы). ▲/▼ — сдвиг ко вчерашнему.
    </p>
  </details>
</template>
