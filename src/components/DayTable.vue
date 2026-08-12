<script setup>
import { computed } from 'vue'
import { formatRubCompact } from '../i18n/format.js'

// Контроль дня: план против факта по каждому дню.
//
// Экран показывает, из чего складывается месяц. План месяца делается не
// решимостью в конце, а тем, что видно каждый день: сколько выпало на этот
// день, сколько получилось, сколько осталось разнести по оставшимся.
//
// Три вида дня различены намеренно и никогда не смешиваются:
//   закрыт по одному    — есть дневная выручка, есть оценка;
//   вошёл суммой        — дневной выручки не существует, оценки нет и не будет;
//   ещё открыт          — стоит «нужно», а не пустое место.

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
  idle: null,
}

function sigOf(r) {
  if (!Number.isFinite(r)) return 'idle'
  if (r >= 1) return 'good'
  if (r >= 0.85) return 'warn'
  return 'bad'
}

const rows = computed(() => props.days.map((d) => ({
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
  // Ровно та же линейка, что и везде: оценка только у дней с дневной выручкой.
  sig: d.inCarry ? 'carry' : d.entered ? sigOf(d.fact / d.plan) : 'idle',
})))

const hasCarry = computed(() => rows.value.some((r) => r.inCarry))
</script>

<template>
  <div>
    <ul class="flex flex-col">
      <li
        v-for="r in rows" :key="r.iso"
        class="grid grid-cols-[3.25rem_1fr_1fr_0.75rem] items-center gap-2 border-b border-[var(--line)]
               py-1.5 last:border-b-0"
        :style="r.isToday ? { background: 'var(--surface-2)' } : null"
      >
        <span class="flex items-baseline gap-1">
          <span
            class="font-mono text-[0.9375rem] tabular-nums"
            :style="{ color: r.isToday ? 'var(--text)' : 'var(--text-secondary)',
                      fontWeight: r.isToday ? 700 : 400 }"
          >{{ r.dd }}</span>
          <span
            class="text-[0.6875rem]"
            :style="{ color: r.weekend ? 'var(--text-secondary)' : 'var(--text-muted)' }"
          >{{ r.dowRu }}</span>
        </span>

        <span class="text-right font-mono text-[0.8125rem] tabular-nums text-[var(--text-muted)]">
          {{ formatRubCompact(r.plan) }}
        </span>

        <span class="text-right font-mono text-[0.875rem] tabular-nums">
          <template v-if="r.entered">
            <span class="text-[var(--text)]">{{ formatRubCompact(r.fact) }}</span>
          </template>
          <template v-else-if="r.inCarry">
            <span class="text-[0.75rem] text-[var(--text-muted)]">вошёл суммой</span>
          </template>
          <template v-else-if="r.due">
            <button
              type="button"
              class="text-[0.8125rem] font-semibold"
              :style="{ color: 'var(--action)' }"
              @click="emit('pick', r.iso)"
            >внести</button>
          </template>
          <template v-else>
            <span class="text-[var(--text-secondary)]">{{ formatRubCompact(r.need) }}</span>
          </template>
        </span>

        <span
          class="block h-2.5 w-2.5 rounded-full border"
          :style="SIG[r.sig]
            ? { background: SIG[r.sig], borderColor: SIG[r.sig] }
            : { background: 'transparent', borderColor: 'var(--line)' }"
        />
      </li>
    </ul>

    <p v-if="hasCarry" class="mt-2 text-[0.6875rem] leading-snug text-[var(--text-muted)]">
      Серым отмечены дни, попавшие в стартовую сумму: дневной выручки по ним нет,
      поэтому оценки у них не будет и задним числом.
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
      <div class="flex items-center gap-1.5">
        <i class="h-2 w-2 rounded-full" :style="{ background: 'var(--text-muted)' }" />
        <span>вошёл суммой, оценки нет</span>
      </div>
    </dl>
  </div>
</template>
