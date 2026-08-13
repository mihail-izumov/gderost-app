<script setup>
import { computed } from 'vue'
import { formatK } from '../i18n/format.js'

// Контроль дня: план · факт · надо по каждому дню недели.
//
// Факт нарисован полосой внутри своей ячейки, а не числом в столбик: длина
// полосы против ширины ячейки — это и есть «сколько от плана», и её видно
// раньше, чем прочитаны цифры. Цифра стоит рядом для тех, кому нужна точность.
//
// Три вида дня различены намеренно и никогда не смешиваются:
//   закрыт по одному — есть дневная выручка, есть полоса и оценка;
//   вошёл суммой     — дневной выручки не существует, оценки нет и не будет;
//   ещё открыт       — пусто в «факте» и требование в «надо».
//
// Столбец «надо» у закрытых дней стоит прочерком: требовать от прошедшего дня
// нечего, и число там читалось бы как невыполненный долг.

const props = defineProps({
  // Дни из модели: любой отрезок месяца, обычно одна неделя.
  days: { type: Array, required: true },
  legend: { type: Boolean, default: false },
})
const emit = defineEmits(['pick'])

const SIG = {
  good: 'var(--positive)',
  warn: 'var(--warning)',
  bad: 'var(--negative)',
  carry: 'var(--text-muted)',
}

function sigOf(r) {
  if (!Number.isFinite(r)) return null
  if (r >= 1) return 'good'
  if (r >= 0.85) return 'warn'
  return 'bad'
}

const rows = computed(() => props.days.map((d) => {
  const sig = d.inCarry ? 'carry' : d.entered ? sigOf(d.fact / d.plan) : null
  return {
    iso: d.iso,
    dd: d.dd,
    dowRu: d.dowRu,
    weekend: d.weekend,
    isToday: d.isToday,
    plan: d.plan,
    fact: d.fact,
    need: d.need,
    entered: d.entered,
    inCarry: d.inCarry,
    due: d.due,
    sig,
    fill: sig ? SIG[sig] : null,
    // Полоса упирается в край ячейки на 100 % и дальше не растёт: перевыполнение
    // читается по цвету, а не по полосе, вылезающей за таблицу.
    width: d.entered && d.plan > 0 ? Math.max(4, Math.min(100, (d.fact / d.plan) * 100)) : 0,
  }
}))

const hasCarry = computed(() => rows.value.some((r) => r.inCarry))
</script>

<template>
  <div>
    <div
      class="grid grid-cols-[3.5rem_3.5rem_1fr_3.25rem] items-center gap-2 border-b border-[var(--line)] pb-1.5
             text-[0.625rem] font-medium uppercase tracking-wide text-[var(--text-muted)]"
    >
      <span>День</span>
      <span class="text-right">План</span>
      <span class="text-right">Факт</span>
      <span class="text-right">Надо</span>
    </div>

    <ul class="flex flex-col">
      <li
        v-for="r in rows" :key="r.iso"
        class="grid grid-cols-[3.5rem_3.5rem_1fr_3.25rem] items-center gap-2 border-b border-[var(--line)]
               py-2 last:border-b-0"
        :style="r.weekend || r.isToday ? { background: 'var(--surface-2)' } : null"
      >
        <span class="flex items-baseline gap-1">
          <span
            class="text-[0.9375rem] tabular-nums"
            :style="{ color: r.isToday ? 'var(--text)' : 'var(--text-secondary)',
                      fontWeight: r.isToday ? 700 : 400 }"
          >{{ r.dd }}</span>
          <span
            class="text-[0.6875rem]"
            :style="{ color: r.weekend ? 'var(--text-secondary)' : 'var(--text-muted)' }"
          >{{ r.dowRu }}</span>
        </span>

        <span class="text-right text-[0.8125rem] tabular-nums text-[var(--text-muted)]">
          {{ formatK(r.plan) }}
        </span>

        <!-- Факт полосой: длина против ширины ячейки = доля плана -->
        <span class="relative block h-7 overflow-hidden rounded-lg bg-[var(--surface)]">
          <template v-if="r.entered">
            <i
              class="absolute bottom-0 left-0 top-0 block rounded-lg"
              :style="{ width: r.width + '%', background: r.fill, opacity: 0.35 }"
            />
            <span
              class="absolute inset-y-0 right-2 flex items-center text-[0.8125rem] font-semibold
                     tabular-nums text-[var(--text)]"
            >{{ formatK(r.fact) }}</span>
          </template>
          <span
            v-else-if="r.inCarry"
            class="absolute inset-y-0 right-2 flex items-center text-[0.75rem] text-[var(--text-muted)]"
          >вошёл суммой</span>
          <button
            v-else-if="r.due"
            type="button"
            class="absolute inset-0 flex items-center justify-end pr-2 text-[0.8125rem] font-semibold"
            :style="{ color: 'var(--action)' }"
            @click="emit('pick', r.iso)"
          >внести</button>
        </span>

        <span class="text-right text-[0.8125rem] tabular-nums">
          <template v-if="r.entered || r.inCarry">
            <span class="text-[var(--text-muted)]">—</span>
          </template>
          <template v-else>
            <span class="text-[var(--text-secondary)]">{{ formatK(r.need) }}</span>
          </template>
        </span>
      </li>
    </ul>

    <p v-if="hasCarry" class="mt-2 text-[0.6875rem] leading-snug text-[var(--text-muted)]">
      Дни, попавшие в стартовую сумму, дневной выручки не имеют — оценки у них
      не будет и задним числом.
    </p>

    <dl v-if="legend" class="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--line)] pt-3
                             text-[0.6875rem] text-[var(--text-muted)]">
      <div class="flex items-center gap-1.5">
        <i class="h-2 w-2 rounded-full" :style="{ background: 'var(--positive)' }" />
        <span>план дня взят</span>
      </div>
      <div class="flex items-center gap-1.5">
        <i class="h-2 w-2 rounded-full" :style="{ background: 'var(--warning)' }" />
        <span>от 85 %</span>
      </div>
      <div class="flex items-center gap-1.5">
        <i class="h-2 w-2 rounded-full" :style="{ background: 'var(--negative)' }" />
        <span>ниже 85 %</span>
      </div>
    </dl>
  </div>
</template>
