<script setup>
import { computed } from 'vue'
import { DOW_RU, todayISO } from '../composables/miniModel.js'
import { monthLabel, daysWord } from '../i18n/format.js'

// Виджет текущей недели. Даты настоящие и берутся из календаря устройства —
// подставная неделя на витрине была бы первым местом, где приложение соврало.
//
// Маркеры под днями приходят снаружи. Без них все дни пустые, и это тоже правда:
// оценок пока нет, потому что выручки пока нет. Демонстрационных оценок здесь
// не бывает — рисовать чужой хороший месяц, выдавая его за приглашение, нечестно.

const props = defineProps({
  // 7 значений Пн..Вс: 'good' | 'warn' | 'bad' | 'carry' | 'idle'
  marks: { type: Array, default: null },
  now: { type: Date, default: () => new Date() },
})

const MARK_FILL = {
  good: 'var(--positive)',
  warn: 'var(--warning)',
  bad: 'var(--negative)',
  carry: 'var(--text-muted)',
}

const week = computed(() => {
  const t = new Date(props.now)
  t.setHours(0, 0, 0, 0)
  const shift = (t.getDay() + 6) % 7 // 0 = понедельник
  const monday = new Date(t)
  monday.setDate(t.getDate() - shift)
  const todayIso = todayISO(t)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const kind = props.marks && props.marks[i] ? props.marks[i] : 'idle'
    return {
      key: todayISO(d),
      dow: DOW_RU[i],
      dd: d.getDate(),
      isToday: todayISO(d) === todayIso,
      fill: MARK_FILL[kind] || null,
    }
  })
})

const month = computed(() => {
  const t = new Date(props.now)
  return monthLabel(todayISO(t).slice(0, 7))
})

// Считается вместе с сегодняшним днём: сегодня ещё можно работать.
const daysLeft = computed(() => {
  const t = new Date(props.now)
  const dim = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()
  return dim - t.getDate() + 1
})
</script>

<template>
  <section
    class="rounded-2xl border border-[var(--rim)] bg-[var(--surface)] px-3 py-4"
    :style="{ boxShadow: 'var(--card-shadow)' }"
  >
    <h2 class="px-1 text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
      {{ month }}
    </h2>

    <ul class="mt-3 grid grid-cols-7 gap-1">
      <li v-for="d in week" :key="d.key" class="flex flex-col items-center gap-1.5">
        <span class="text-[0.6875rem] font-medium text-[var(--text-muted)]">{{ d.dow }}</span>
        <span
          class="flex h-8 w-8 items-center justify-center rounded-full font-mono text-[0.9375rem] font-semibold"
          :style="d.isToday
            ? { background: 'var(--text)', color: 'var(--ink-on-color)' }
            : { color: 'var(--text)' }"
        >{{ d.dd }}</span>
        <span
          class="block h-2.5 w-2.5 rounded-full border"
          :style="d.fill
            ? { background: d.fill, borderColor: d.fill }
            : { background: 'transparent', borderColor: 'var(--line)' }"
        />
      </li>
    </ul>

    <p class="mt-3 px-1 text-[0.8125rem] text-[var(--text-secondary)]">
      До конца месяца {{ daysLeft }} {{ daysWord(daysLeft) }}
    </p>
  </section>
</template>
