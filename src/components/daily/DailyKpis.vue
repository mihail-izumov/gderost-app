<script setup>
import { computed } from 'vue'
import { mln, ths, thsSigned, pctWhole, pctSigned, L, SIG_VAR } from '../../i18n/daily.js'
import { sigClass } from '../../composables/miniModel.js'

// Ряд плиток. Сигнал несёт заливка карточки, а не точка рядом с числом:
// точка при четырёх карточках превращается в россыпь, которую глаз собирает
// по одной. Тон — та же идиома, что у карточек сигналов в рабочем Ранскейле:
// 12 % цвета сигнала на поверхности под фон, 30 % на линии под обводку.
// Текст на такой заливке остаётся монохромным и читается 11–15:1.

const props = defineProps({ m: { type: Object, required: true } })

const tint = (sig) => (sig
  ? { background: `color-mix(in srgb, ${SIG_VAR[sig]} 12%, var(--surface))`,
      borderColor: `color-mix(in srgb, ${SIG_VAR[sig]} 30%, var(--line))` }
  : { background: 'var(--surface)', borderColor: 'var(--line)' })

const tiles = computed(() => {
  const m = props.m
  const out = [
    {
      label: L.kpi_earned,
      value: mln(m.realizedRev),
      note: `${pctWhole(m.T ? m.realizedRev / m.T : null)} плана (${m.realizedCount} дн из ${m.DIM})`,
      sig: null,
    },
    {
      label: L.kpi_onplan,
      value: m.onPlan == null ? '—' : pctWhole(m.onPlan),
      note: m.onPlan == null ? 'нет факта'
        : `${m.onPlan >= 1 ? 'опережаем' : 'отстаём'} за ${m.realizedCount} дн`,
      sig: m.onPlan == null ? null : sigClass(m.onPlan),
    },
    {
      label: L.kpi_tail,
      value: thsSigned(-m.tailCum),
      note: m.tailCum > 0 ? `+${ths(m.spread)}/день к плану` : `−${ths(m.spread)}/день запаса`,
      sig: m.tailCum > 0 ? 'bad' : 'good',
    },
  ]
  if (m.futureCount && m.needPerDay > 0) {
    out.push({
      label: L.kpi_pace,
      value: `${ths(m.needPerDay)}/день`,
      note: `текущий ~${ths(m.currentPace)}/день`,
      sig: m.paceGap > 0.05 ? 'bad' : m.paceGap > 0.001 ? 'warn' : 'good',
    })
  }
  return out
})
</script>

<template>
  <div class="grid grid-cols-2 gap-2">
    <div
      v-for="(t, i) in tiles" :key="i"
      class="flex flex-col gap-1 rounded-2xl border p-3"
      :style="tint(t.sig)"
    >
      <span class="text-[0.75rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">{{ t.label }}</span>
      <span class="text-[1.25rem] font-semibold leading-tight text-[var(--text)]">{{ t.value }}</span>
      <span class="text-[0.75rem] leading-snug text-[var(--text-muted)]">{{ t.note }}</span>
    </div>
  </div>
</template>
