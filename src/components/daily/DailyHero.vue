<script setup>
import { computed } from 'vue'
import { mln, pctSigned, L, SIG_VAR, GOAL_STATE } from '../../i18n/daily.js'

// Шапка «Контроля Дня»: план · прогноз выручки с отклонением · достижимость ·
// осталось заработать. Перенесено из рабочего Ранскейла.
//
// Сетка устойчивая: план во всю ширину, ниже две колонки. Через flex-wrap
// с ml-auto блоки разъезжались на узком экране.
//
// Достижимость — три состояния, а не бинарный флаг: «посильно», «нужен рекорд»
// и «планом уже не закрыть» требуют разных решений, и склеивать их нельзя.
// Текст монохромный, сигнал несут цветная точка и заливка полосы.

const props = defineProps({ m: { type: Object, required: true } })
const fcColor = computed(() => SIG_VAR[props.m.fcSig] || 'var(--line)')
const gs = computed(() => GOAL_STATE[props.m.goalState] || GOAL_STATE.ok)
</script>

<template>
  <div class="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
    <div>
      <div class="text-[0.75rem] text-[var(--text-muted)]">{{ L.target }}</div>
      <div class="text-[2rem] font-bold leading-none tracking-tight text-[var(--text)]">{{ mln(m.T) }}</div>
    </div>

    <div class="mt-3 grid grid-cols-2 items-start gap-4">
      <div class="min-w-0">
        <!-- Подпись в две строки без разделителя «·»: он ломался при переносе -->
        <div class="text-[0.75rem] leading-snug text-[var(--text-muted)]">{{ L.forecast }}<br>{{ L.forecast_hint }}</div>
        <div class="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span class="inline-block h-2.5 w-2.5 shrink-0 rounded-full" :style="{ background: fcColor }" />
          <span class="text-[1.375rem] font-bold leading-none tracking-tight text-[var(--text)]">{{ mln(m.landing) }}</span>
          <span class="text-[0.875rem] font-semibold text-[var(--text-secondary)]">{{ pctSigned(m.landDev) }}</span>
        </div>
      </div>
      <div class="min-w-0 text-right">
        <!-- Точка статуса — в потоке текста, перед первым словом. Во flex-строке
             при переносе двухстрочной подписи она центрировалась по вертикали
             блока и висела посреди карточки как артефакт. -->
        <div class="text-[0.75rem] leading-snug text-[var(--text-muted)]">
          <span class="mr-1 inline-block h-2 w-2 rounded-full align-baseline" :style="{ background: gs.dot }" />{{ gs.label }}
        </div>
        <div class="mt-1 text-[1.25rem] font-bold leading-none text-[var(--text)]">{{ mln(m.remainTarget) }}</div>
        <div class="mt-0.5 text-[0.75rem] text-[var(--text-muted)]">{{ L.to_earn }}</div>
      </div>
    </div>

    <div class="relative mt-4 h-4 overflow-hidden rounded-lg bg-[var(--surface-2)]">
      <i class="absolute bottom-0 top-0 block rounded-l-lg" :style="{ left: 0, width: m.factPct + '%', background: 'var(--positive)' }" />
      <i class="absolute bottom-0 top-0 block" :style="{ left: m.factPct + '%', width: Math.max(0, m.landPct - m.factPct) + '%', background: 'var(--text-muted)', opacity: 0.35 }" />
      <i class="absolute -bottom-0.5 -top-0.5 w-0.5" :style="{ left: '100%', background: 'var(--text)' }" />
    </div>
    <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] text-[var(--text-muted)]">
      <span class="inline-flex items-center gap-1.5"><i class="inline-block h-2.5 w-2.5 rounded-sm" style="background: var(--positive)" />{{ L.earned }} {{ mln(m.realizedRev) }}</span>
      <span class="inline-flex items-center gap-1.5"><i class="inline-block h-2.5 w-2.5 rounded-sm" style="background: var(--text-muted); opacity: 0.35" />{{ L.will_add }} {{ mln(Math.max(0, m.landing - m.realizedRev)) }}</span>
      <span class="inline-flex items-center gap-1.5"><i class="inline-block h-2.5 w-2.5 rounded-sm border border-[var(--line)]" style="background: var(--surface-2)" />{{ L.gap }} {{ mln(m.gap) }}</span>
    </div>
  </div>
</template>
