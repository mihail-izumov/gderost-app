<script setup>
import { computed } from 'vue'
import { mln, pctSigned, L, SIG_VAR, GOAL_STATE } from '../../i18n/daily.js'

// Шапка «Контроля Дня».
//
// Здесь было семь чисел и три подписи, и глазу не за что было зацепиться.
// Сокращено до двух величин, между которыми и идёт вся работа месяца:
// куда приземлимся и сколько ещё заработать. Они стоят по обе стороны
// вертикальной черты — одна плашка, разделённая пополам, а не два блока
// рядом: это две стороны одного вопроса, и форма обязана это показывать.
//
// План ушёл наверх мелкой строкой — он не меняется день ото дня и работает
// как заголовок, а не как показатель. Достижимость — под чертой одной
// строкой с точкой: цветом говорит только она.
//
// Полоса переведена на язык деки месяца: сделанное — сплошной жёлтый,
// то, что доложит темп, — жёлтый с точками, недобор до плана — красный.
// Одинаковые вещи на двух экранах обязаны выглядеть одинаково, иначе
// человек считает их разными.

const props = defineProps({ m: { type: Object, required: true } })
const fcColor = computed(() => SIG_VAR[props.m.fcSig] || 'var(--line)')
const gs = computed(() => GOAL_STATE[props.m.goalState] || GOAL_STATE.ok)

const FORECAST_FILL = {
  backgroundColor: 'color-mix(in srgb, var(--accent) 40%, var(--surface))',
  backgroundImage: 'radial-gradient(circle at 50% 50%, var(--text-muted) 0.45px, transparent 0.55px)',
  backgroundSize: '2.5px 2.5px',
}
const SHORT_FILL = {
  backgroundColor: 'color-mix(in srgb, var(--negative) 55%, var(--surface))',
}

// Ширины считаются от плана: полоса отвечает на вопрос «доедем ли до плана»,
// поэтому его край и есть конец шкалы.
const factW = computed(() => Math.max(0, Math.min(100, props.m.factPct)))
const fcW = computed(() => Math.max(0, Math.min(100, props.m.landPct) - factW.value))
const shortW = computed(() => Math.max(0, 100 - factW.value - fcW.value))
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
    <div class="px-4 pt-3">
      <span class="text-[0.75rem] text-[var(--text-muted)]">{{ L.target }}</span>
      <span class="ml-2 text-[1rem] font-bold tabular-nums text-[var(--text)]">{{ mln(m.T) }}</span>
    </div>

    <!-- Две величины по обе стороны черты: куда придём и сколько добрать -->
    <div class="mt-2 grid grid-cols-2">
      <div class="border-r border-[var(--line)] px-4 pb-3">
        <div class="text-[0.75rem] text-[var(--text-muted)]">{{ L.forecast }}</div>
        <div class="mt-1 flex items-baseline gap-1.5">
          <span class="inline-block h-2.5 w-2.5 shrink-0 self-center rounded-full" :style="{ background: fcColor }" />
          <span class="text-[1.5rem] font-bold leading-none tracking-tight text-[var(--text)]">{{ mln(m.landing) }}</span>
        </div>
        <div class="mt-1 text-[0.8125rem] font-semibold tabular-nums text-[var(--text-secondary)]">
          {{ pctSigned(m.landDev) }}
        </div>
      </div>

      <div class="px-4 pb-3">
        <div class="text-[0.75rem] text-[var(--text-muted)]">{{ L.to_earn }}</div>
        <div class="mt-1 text-[1.5rem] font-bold leading-none tracking-tight text-[var(--text)]">
          {{ mln(m.remainTarget) }}
        </div>
        <div class="mt-1 text-[0.8125rem] text-[var(--text-secondary)]">
          за {{ m.daysLeft }} дн
        </div>
      </div>
    </div>

    <!-- Полоса и её расшифровка. Фактуры те же, что в деке месяца. -->
    <div class="border-t border-[var(--line)] px-4 py-3">
      <div class="flex h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <i :style="{ width: factW + '%', background: 'var(--accent)' }" />
        <i :style="{ width: fcW + '%', ...FORECAST_FILL }" />
        <i :style="{ width: shortW + '%', ...SHORT_FILL }" />
      </div>
      <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] text-[var(--text-muted)]">
        <span class="inline-flex items-center gap-1.5">
          <i class="inline-block h-2.5 w-2.5 rounded-sm" style="background: var(--accent)" />
          {{ L.earned }} {{ mln(m.realizedRev) }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <i class="inline-block h-2.5 w-2.5 rounded-sm" :style="FORECAST_FILL" />
          {{ L.will_add }} {{ mln(Math.max(0, m.landing - m.realizedRev)) }}
        </span>
        <span v-if="m.gap > 0" class="inline-flex items-center gap-1.5">
          <i class="inline-block h-2.5 w-2.5 rounded-sm" :style="SHORT_FILL" />
          {{ L.gap }} {{ mln(m.gap) }}
        </span>
      </div>
    </div>

    <!-- Достижимость: единственное место шапки, где цвет что-то значит -->
    <div class="flex items-center gap-2 border-t border-[var(--line)] px-4 py-2.5">
      <span class="inline-block h-2 w-2 shrink-0 rounded-full" :style="{ background: gs.dot }" />
      <span class="text-[0.8125rem] text-[var(--text-secondary)]">{{ gs.label }}</span>
    </div>
  </div>
</template>
