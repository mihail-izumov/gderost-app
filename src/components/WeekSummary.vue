<script setup>
import { computed } from 'vue'
import { formatK, formatGrowth } from '../i18n/format.js'

// Сводка по неделям: месяц одним взглядом, строка на неделю.
//
// Недели без внесённых дней стоят словом «ждём», а не нулём и не пустой
// полосой: ноль означал бы «сработали на ноль», а неделя ещё не наступила.
// Разница между «нет данных» и «данные плохие» — то, ради чего эта сводка
// вообще существует.
//
// Внизу — раскладка дней по светофору. Она отвечает на вопрос, который
// проценты не берут: месяц просел ровным недобором или парой провальных дней.

const props = defineProps({ m: { type: Object, required: true } })

const SIG = { good: 'var(--positive)', warn: 'var(--warning)', bad: 'var(--negative)' }

function sigOf(r) {
  if (!Number.isFinite(r)) return null
  if (r >= 1) return SIG.good
  if (r >= 0.85) return SIG.warn
  return SIG.bad
}

const rows = computed(() => props.m.weeks.map((w) => {
  // Меряется только то, у чего есть дневная выручка: дни, вошедшие суммой,
  // в недельную оценку не входят — оценивать в них нечего.
  const ratio = w.partOfPlan > 0 ? w.fact / w.partOfPlan : null
  // Пустая строка бывает двух разных сортов, и путать их нельзя: неделя,
  // которая ещё не наступила, ждёт; неделя, целиком вошедшая в стартовую
  // сумму, уже прошла, и «ждём» про неё было бы неправдой.
  const allClosed = w.days.every((d) => d.closed)
  return {
    idx: w.idx,
    range: `${w.from}–${w.to}`,
    hasFact: w.hasFact,
    empty: w.hasFact ? '' : allClosed ? 'суммой' : 'ждём',
    fact: w.fact,
    plan: w.plan,
    dev: ratio === null ? null : ratio - 1,
    width: w.plan > 0 ? Math.max(2, Math.min(100, (w.fact / w.plan) * 100)) : 0,
    color: sigOf(ratio),
  }
}))

const monthDev = computed(() => (props.m.T ? props.m.landing / props.m.T - 1 : null))
const monthWidth = computed(() => (props.m.T
  ? Math.max(2, Math.min(100, (props.m.landing / props.m.T) * 100)) : 0))
const monthColor = computed(() => SIG[props.m.fcSig] || 'var(--text-muted)')

const stats = computed(() => props.m.dayStats)
</script>

<template>
  <section>
    <h2 class="px-1 text-[0.75rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
      Сводка по неделям
    </h2>

    <div class="mt-2 overflow-hidden rounded-2xl border border-[var(--rim)] bg-[var(--surface)]">
      <div
        v-for="r in rows" :key="r.idx"
        class="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 border-b border-[var(--line)] px-3 py-3 last:border-b-0"
      >
        <div class="min-w-0">
          <div class="text-[0.9375rem] font-semibold leading-tight text-[var(--text)]">Неделя {{ r.idx }}</div>
          <div class="text-[0.75rem] text-[var(--text-muted)]">{{ r.range }}</div>
        </div>

        <div class="h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
          <i
            v-if="r.hasFact"
            class="block h-full rounded-full"
            :style="{ width: r.width + '%', background: r.color || 'var(--text-muted)' }"
          />
        </div>

        <div class="text-right">
          <div class="text-[0.9375rem] font-semibold tabular-nums text-[var(--text)]">
            <template v-if="r.hasFact">{{ formatK(r.fact) }}</template>
            <span v-else class="font-normal text-[var(--text-muted)]">{{ r.empty }}</span>
          </div>
          <div class="text-[0.75rem] text-[var(--text-muted)]">план {{ formatK(r.plan) }}</div>
        </div>
      </div>

      <!-- Итог месяца — прогноз против плана: строка сводки говорит о том же,
           о чём виджет месяца, и обязана давать то же число -->
      <div class="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 bg-[var(--surface-2)] px-3 py-3">
        <div class="text-[0.9375rem] font-bold text-[var(--text)]">Месяц</div>
        <div class="h-2.5 overflow-hidden rounded-full bg-[var(--surface)]">
          <i class="block h-full rounded-full" :style="{ width: monthWidth + '%', background: monthColor }" />
        </div>
        <div class="text-right">
          <div class="text-[0.9375rem] font-bold tabular-nums text-[var(--text)]">{{ formatK(m.landing) }}</div>
          <div class="text-[0.75rem] text-[var(--text-muted)]">план {{ formatK(m.T) }}</div>
        </div>
      </div>

      <div v-if="monthDev !== null" class="border-t border-[var(--line)] px-3 py-2 text-right">
        <span class="text-[0.8125rem] font-semibold tabular-nums text-[var(--text-secondary)]">
          {{ formatGrowth(monthDev) }} к плану
        </span>
      </div>
    </div>

    <!-- Дни по плану: из чего сложился месяц -->
    <div v-if="stats" class="mt-3 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-3.5">
      <div class="text-[0.6875rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Дни по плану · факт — {{ stats.total }} дн
      </div>
      <div class="mt-2 flex h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <i v-if="stats.good" :style="{ width: stats.pctGood + '%', background: SIG.good }" />
        <i v-if="stats.warn" :style="{ width: stats.pctWarn + '%', background: SIG.warn }" />
        <i v-if="stats.bad" :style="{ width: stats.pctBad + '%', background: SIG.bad }" />
      </div>
      <dl class="mt-2.5 flex flex-col gap-1 text-[0.8125rem] text-[var(--text-secondary)]">
        <div class="flex items-center gap-2">
          <i class="h-2.5 w-2.5 rounded-[3px]" :style="{ background: SIG.good }" />
          <span><b class="font-semibold text-[var(--text)]">{{ stats.good }}</b> выше плана · {{ stats.pctGood }} %</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="h-2.5 w-2.5 rounded-[3px]" :style="{ background: SIG.warn }" />
          <span><b class="font-semibold text-[var(--text)]">{{ stats.warn }}</b> близко 85–99 % · {{ stats.pctWarn }} %</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="h-2.5 w-2.5 rounded-[3px]" :style="{ background: SIG.bad }" />
          <span><b class="font-semibold text-[var(--text)]">{{ stats.bad }}</b> ниже 85 % · {{ stats.pctBad }} %</span>
        </div>
      </dl>
    </div>
  </section>
</template>
