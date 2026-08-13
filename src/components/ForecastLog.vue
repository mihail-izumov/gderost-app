<script setup>
import { computed } from 'vue'
import { formatK, dayLabel } from '../i18n/format.js'

// Журнал прогноза: куда приземлялся месяц после каждого внесённого дня.
//
// Это единственное место, где видно не состояние, а движение. Одно число
// «прогноз 4,99 млн» не говорит ничего; ряд, в котором он четыре дня подряд
// падал и на пятый пошёл вверх, говорит, что сделанное вчера сработало.
//
// Ряд не перестраивается задним числом: каждая строка — прогноз, каким он
// был в момент ввода того дня. Пересчитать его по сегодняшним коэффициентам
// значит стереть ровно ту историю, ради которой журнал и ведётся.

const props = defineProps({
  // Записи хранилища: [{ at, after, landing, was }]
  log: { type: Array, default: () => [] },
  target: { type: Number, default: 0 },
})

const SIG = { good: 'var(--positive)', warn: 'var(--warning)', bad: 'var(--negative)' }

const rows = computed(() => {
  // На один день приходится одна строка: правка суммы за день заменяет
  // прежнюю запись, а не добавляет вторую с той же датой.
  const byDay = new Map()
  props.log.forEach((e) => {
    if (e && typeof e.after === 'string' && Number.isFinite(Number(e.landing))) {
      byDay.set(e.after, Number(e.landing))
    }
  })
  const days = [...byDay.keys()].sort()
  return days.map((iso, i) => {
    const landing = byDay.get(iso)
    const prev = i > 0 ? byDay.get(days[i - 1]) : null
    const ratio = props.target > 0 ? landing / props.target : null
    return {
      iso,
      label: dayLabel(iso),
      landing,
      // Сдвиг ко вчерашней записи журнала, а не к плану: журнал про движение.
      move: prev === null ? 'flat' : landing > prev * 1.001 ? 'up' : landing < prev * 0.999 ? 'down' : 'flat',
      pct: ratio === null ? null : Math.round(ratio * 100),
      width: ratio === null ? 0 : Math.max(2, Math.min(100, ratio * 100)),
      color: ratio === null ? 'var(--text-muted)'
        : ratio >= 1 ? SIG.good : ratio >= 0.85 ? SIG.warn : SIG.bad,
    }
  })
})

const MOVE = { up: '▲', down: '▼', flat: '→' }
</script>

<template>
  <section>
    <h2 class="px-1 text-[0.75rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
      Журнал прогноза
    </h2>

    <div
      v-if="rows.length"
      class="mt-2 overflow-hidden rounded-2xl border border-[var(--rim)] bg-[var(--surface)]"
    >
      <div
        v-for="r in rows" :key="r.iso"
        class="grid grid-cols-[1fr_auto_5rem_2.75rem] items-center gap-2 border-b border-[var(--line)] px-3 py-2.5 last:border-b-0"
      >
        <span class="truncate text-[0.9375rem] text-[var(--text)]">{{ r.label }}</span>
        <span class="flex items-center gap-1.5 tabular-nums">
          <span class="text-[0.9375rem] font-semibold text-[var(--text)]">{{ formatK(r.landing) }}</span>
          <span class="text-[0.6875rem] text-[var(--text-muted)]" aria-hidden="true">{{ MOVE[r.move] }}</span>
        </span>
        <span class="h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
          <i class="block h-full rounded-full" :style="{ width: r.width + '%', background: r.color }" />
        </span>
        <span class="text-right text-[0.9375rem] font-bold tabular-nums text-[var(--text)]">
          {{ r.pct === null ? '—' : r.pct + ' %' }}
        </span>
      </div>
    </div>

    <p v-else class="mt-2 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-3.5
                     text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
      Журнал начнётся с первого внесённого дня.
    </p>

    <p v-if="rows.length" class="mt-2 px-1 text-[0.75rem] leading-snug text-[var(--text-muted)]">
      Прогноз на конец каждого дня. ▲ и ▼ — сдвиг ко вчерашней записи.
    </p>
  </section>
</template>
