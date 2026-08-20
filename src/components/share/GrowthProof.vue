<script setup>
import { computed } from 'vue'
import { formatGrowth, plural, monthOf } from '../../i18n/format.js'
import { pctWhole } from '../../i18n/home.js'
import { SIG_VAR } from '../../i18n/daily.js'
import { sigClass, todayISO } from '../../composables/miniModel.js'

// Доказательство роста — блок, ради которого ссылку и открывают.
//
// Отвечает на один вопрос: как месяц идёт к плану. Рублей здесь нет ни одного,
// и это условие, а не оформление: тот же блок стоит на экране, который владелец
// отправляет в бизнес-клуб, и выручка малого бизнеса туда не уезжает.
//
// Процент считается той же линейкой, что и сообщения роста: идущий месяц
// меряется прогнозом, закрытый — фактом. Двух линеек у одного числа не бывает,
// иначе ссылка и сообщение под ней разойдутся.
//
// ⚠ Обрезка сверху здесь законна ТОЛЬКО у полосы: заливка не бывает шире
// дорожки. Крупное число берёт отношение напрямую и показывает 105 % как 105 %.

const props = defineProps({
  m: { type: Object, required: true },
  monthOver: { type: Boolean, default: false },
})

const today = computed(() => todayISO())

const ratio = computed(() => {
  const T = props.m.T
  if (!T) return null
  return props.monthOver ? props.m.realizedRev / T : props.m.landing / T
})
const headPct = computed(() => (ratio.value == null ? '—' : pctWhole(ratio.value)))
const headNote = computed(() => {
  const n = monthOf(props.m.month)
  return props.monthOver ? `Итог ${n} к плану` : `Прогноз ${n} к плану`
})
const tone = computed(() => SIG_VAR[sigClass(ratio.value)] || 'var(--surface-2)')

// Полоса месяца: заработано и то, что доложит нынешний темп. План — вся
// дорожка. Величины идут долями, подписей в рублях у полосы нет.
const factW = computed(() => Math.max(0, Math.min(100, props.m.factPct || 0)))
const landW = computed(() => Math.max(0, Math.min(100, props.m.landPct || 0) - factW.value))

// Ряд дней. Устройство перенесено из блока месяца на «Прогрессе»: высота —
// деньги дня, цвет — состояние, фактура разводит измеренное и недостающее.
// Шкалы у ряда нет, поэтому суммы из него не восстанавливаются.
const dayValue = (d) => (d.entered ? d.fact : (props.m.impliedBase || 0) * (d.weight || 0))
const maxV = computed(() => Math.max(...props.m.days.map(dayValue), 1))
const HATCH = (color) => ({
  backgroundColor: 'var(--surface)',
  backgroundImage: `repeating-linear-gradient(-45deg, ${color} 0 2px, transparent 2px 4px)`,
})
const strip = computed(() => props.m.days.map((d) => {
  const h = Math.round(8 + (dayValue(d) / maxV.value) * 20)
  const base = { key: d.iso, h }
  if (d.entered) return { ...base, style: { background: SIG_VAR[sigClass(d.fact / d.planAt)] } }
  if (d.inCarry) return { ...base, style: HATCH('var(--text-muted)') }
  if (d.iso < today.value) return { ...base, style: HATCH('var(--warning)') }
  return { ...base, style: { background: 'var(--line)' } }
}))

// Серия: сколько прожитых дней владелец внёс руками. Это и есть доказательство
// дисциплины — число, которое нельзя получить, не ведя месяц каждый день.
const passed = computed(() => props.m.days.filter((d) => d.iso < today.value || d.entered).length)
</script>

<template>
  <section class="rounded-[22px] bg-[var(--surface)] p-4">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="text-[0.6875rem] uppercase tracking-wide text-[var(--text-muted)]">{{ headNote }}</div>
        <div class="mt-1 text-[2.75rem] font-bold leading-none tabular-nums text-[var(--text)]">{{ headPct }}</div>
      </div>
      <span
        class="mt-1 inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.6875rem] font-bold tabular-nums"
        :style="{ background: tone, color: m.fcSig === 'warn' ? 'var(--accent-ink)' : 'var(--ink-on-color)' }"
      >{{ formatGrowth(m.landDev) }}</span>
    </div>

    <!-- Полоса месяца: план — вся дорожка, цветное — заработано, серое —
         то, что доложит нынешний темп. -->
    <div class="mt-3 flex h-[8px] w-full overflow-hidden rounded-full" :style="{ background: 'var(--line)' }">
      <span :style="{ width: `${factW}%`, background: tone }" />
      <span :style="{ width: `${landW}%`, background: 'var(--text-muted)', opacity: 0.45 }" />
    </div>

    <div class="mt-3.5 flex h-[28px] items-end gap-[2px]">
      <span
        v-for="d in strip"
        :key="d.key"
        class="min-w-0 flex-1 rounded-[2px]"
        :style="{ height: `${d.h}px`, ...d.style }"
      />
    </div>

    <div class="mt-4">
      <div class="text-[0.6875rem] uppercase tracking-wide text-[var(--text-muted)]">Внесено</div>
      <div class="mt-1 text-[1.0625rem] font-bold tabular-nums text-[var(--text)]">
        {{ m.enteredCount }}
        <span class="text-[0.875rem] font-normal text-[var(--text-muted)]">
          из {{ passed }} {{ plural(passed, 'дня', 'дней', 'дней') }}
        </span>
      </div>
    </div>

    <!-- Статус стоит при самом числе. Требование общее для всех величин
         приложения, и у чужого месяца оно строже: получатель проверить
         не может ничего, кроме подписи. -->
    <p class="mt-3 text-[0.75rem] leading-snug text-[var(--text-muted)]">
      Посчитано на числах владельца.{{ monthOver ? '' : ' Прогноз — при неизменном темпе.' }}
    </p>
  </section>
</template>
