<script setup>
// «Дни по плану» — распределение внесённых дней по светофору.
//
// Живёт в одном месте: последней строкой сводки «Контроля Дня». На «Прогрессе»
// он стоял отдельной карточкой и был снят — там тот же счёт вошёл внутрь
// главного блока месяца, к ряду дней, и полоса ему больше не нужна: ряд
// показывает то же самое подробнее, а два одинаковых счёта на одном экране
// человек начинает сверять между собой.
//
// Считает не он: `dayStats` приходит из модели, второго счёта в проекте нет.

import { L } from '../../i18n/daily.js'

defineProps({
  stats: { type: Object, required: true },
})
</script>

<template>
  <div class="border-t border-[var(--line)] px-4 py-3">
    <div class="mb-2 text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
      {{ L.days_by_plan }} <span class="font-normal normal-case">({{ stats.total }} дн с фактом)</span>
    </div>
    <div class="flex h-4 gap-0.5 overflow-hidden rounded-lg bg-[var(--surface-2)]">
      <i v-if="stats.good" :style="{ width: stats.pctGood + '%', background: 'var(--positive)' }" />
      <i v-if="stats.warn" :style="{ width: stats.pctWarn + '%', background: 'var(--warning)' }" />
      <i v-if="stats.bad" :style="{ width: stats.pctBad + '%', background: 'var(--negative)' }" />
    </div>
    <div class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[0.8125rem] text-[var(--text-muted)]">
      <span class="inline-flex items-center gap-1.5"><i class="inline-block h-2.5 w-2.5 rounded-sm" style="background: var(--positive)" /><b class="font-semibold text-[var(--text)]">{{ stats.good }}</b> {{ L.above }} ({{ stats.pctGood }}%)</span>
      <span class="inline-flex items-center gap-1.5"><i class="inline-block h-2.5 w-2.5 rounded-sm" style="background: var(--warning)" /><b class="font-semibold text-[var(--text)]">{{ stats.warn }}</b> {{ L.close }} ({{ stats.pctWarn }}%)</span>
      <span class="inline-flex items-center gap-1.5"><i class="inline-block h-2.5 w-2.5 rounded-sm" style="background: var(--negative)" /><b class="font-semibold text-[var(--text)]">{{ stats.bad }}</b> {{ L.below }} ({{ stats.pctBad }}%)</span>
    </div>
  </div>
</template>
