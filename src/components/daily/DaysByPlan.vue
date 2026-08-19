<script setup>
// «Дни по плану» — распределение внесённых дней по светофору.
//
// Блок вынут из `DailySummary` в отдельный компонент, потому что живёт теперь
// в двух местах: в сводке «Контроля Дня», где он всегда стоял, и на «Прогрессе»,
// где отвечает на вопрос месяца — из чего сложились недели. Одна разметка
// на оба экрана: две копии одной полосы разошлись бы молча, и человек прочёл
// бы их как два разных счёта.
//
// Считает не он: `dayStats` приходит из модели, второго счёта в проекте нет.

import { L } from '../../i18n/daily.js'

defineProps({
  stats: { type: Object, required: true },
  // На «Прогрессе» блок стоит сам по себе и держит собственную рамку;
  // в сводке он — последняя строка общей карточки.
  standalone: { type: Boolean, default: false },
})
</script>

<template>
  <!-- На «Прогрессе» блок стоит сам по себе, и заголовок раздела уходит НАД
       карточкой — в общий ряд с «Важно» и «Сводкой по неделям»: внутри рамки
       он читался подписью к полосе, а не именем раздела. Охват («N дн
       с фактом») становится заголовком внутри — тем же набором, каким
       подписаны недели в списке выше. В сводке «Контроля Дня» блок остаётся
       последней строкой общей карточки и заголовок держит при себе. -->
  <h2
    v-if="standalone"
    class="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)]"
  >{{ L.days_by_plan }}</h2>

  <div
    class="px-4 py-3"
    :class="standalone ? 'rounded-2xl border border-[var(--line)] bg-[var(--surface)]' : 'border-t border-[var(--line)]'"
  >
    <div
      v-if="standalone"
      class="mb-2 text-[0.9375rem] font-semibold text-[var(--text)]"
    >{{ stats.total }} дн с фактом</div>
    <div v-else class="mb-2 text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
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
