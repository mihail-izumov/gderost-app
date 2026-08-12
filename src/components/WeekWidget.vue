<script setup>
import { computed } from 'vue'
import { DOW_RU, todayISO } from '../composables/miniModel.js'
import { weekRangeLabel, daysWord, formatPct } from '../i18n/format.js'

// Виджет текущей недели. Даты настоящие и берутся из календаря устройства —
// подставная неделя на витрине была бы первым местом, где приложение соврало.
//
// Маркеры под днями приходят снаружи. Без них все дни пустые, и это тоже правда:
// оценок пока нет, потому что выручки пока нет. Демонстрационных оценок здесь
// не бывает — рисовать чужой хороший месяц, выдавая его за приглашение, нечестно.
//
// Графитовый вид — не тема, а якорь внимания: одна тёмная карточка на светлом
// холсте держит взгляд там, где начинается разговор. Контраст текста на ней
// посчитан формулой и живёт отдельными токенами.

const props = defineProps({
  // 7 значений Пн..Вс: 'good' | 'warn' | 'bad' | 'carry' | 'idle'
  marks: { type: Array, default: null },
  now: { type: Date, default: () => new Date() },
  // Своя подпись вместо диапазона дат — понадобится, когда недели получат номера.
  label: { type: String, default: null },
  // 'graphite' — герой-кадр, 'surface' — обычная карточка внутри приложения.
  // По умолчанию светлая: тёмная заливка запрашивается осознанно, иначе она
  // расползётся по экранам сама и перестанет быть акцентом.
  tone: { type: String, default: 'surface' },
})

const dark = computed(() => props.tone === 'graphite')

const MARK_FILL = {
  good: 'var(--positive)',
  warn: 'var(--warning)',
  bad: 'var(--negative)',
  carry: 'var(--text-muted)',
}

const skin = computed(() => (dark.value
  ? {
    card: { background: 'var(--graphite)', color: 'var(--ink-on-color)' },
    title: 'var(--ink-on-color-muted)',
    dow: 'var(--ink-on-color-muted)',
    num: 'var(--ink-on-color)',
    todayBg: 'var(--ink-on-color)',
    todayInk: 'var(--graphite)',
    emptyMark: 'var(--line-on-color)',
    note: 'var(--ink-on-color)',
    pillBorder: 'var(--line-on-color)',
    pillInk: 'var(--ink-on-color)',
  }
  : {
    card: { background: 'var(--surface)', color: 'var(--text)', boxShadow: 'var(--card-shadow)' },
    title: 'var(--text-muted)',
    dow: 'var(--text-muted)',
    num: 'var(--text)',
    todayBg: 'var(--text)',
    todayInk: 'var(--ink-on-color)',
    emptyMark: 'var(--line)',
    note: 'var(--text-secondary)',
    pillBorder: 'var(--line)',
    pillInk: 'var(--text-secondary)',
  }))

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

// Виджет говорит про неделю, значит и подписан неделей: месяц, которого
// в этих семи днях нет, в заголовке не появляется.
const title = computed(() => {
  if (props.label) return props.label
  const w = week.value
  return weekRangeLabel(w[0].key, w[6].key)
})

// Считается вместе с сегодняшним днём: сегодня ещё можно работать.
const daysLeft = computed(() => {
  const t = new Date(props.now)
  const dim = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()
  return dim - t.getDate() + 1
})

const leftPct = computed(() => {
  const t = new Date(props.now)
  const dim = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()
  return (daysLeft.value / dim) * 100
})
</script>

<template>
  <section class="rounded-2xl px-3 py-4" :style="skin.card">
    <h2
      class="px-1 text-[0.8125rem] font-medium uppercase tracking-wide"
      :style="{ color: skin.title }"
    >{{ title }}</h2>

    <ul class="mt-3 grid grid-cols-7 gap-1">
      <li v-for="d in week" :key="d.key" class="flex flex-col items-center gap-1.5">
        <span class="text-[0.6875rem] font-medium" :style="{ color: skin.dow }">{{ d.dow }}</span>
        <span
          class="flex h-8 w-8 items-center justify-center rounded-full font-mono text-[0.9375rem] font-semibold tabular-nums"
          :style="d.isToday
            ? { background: skin.todayBg, color: skin.todayInk }
            : { color: skin.num }"
        >{{ d.dd }}</span>
        <span
          class="block h-2.5 w-2.5 rounded-full border"
          :style="d.fill
            ? { background: d.fill, borderColor: d.fill }
            : { background: 'transparent', borderColor: skin.emptyMark }"
        />
      </li>
    </ul>

    <!-- Остаток месяца: слева счёт словами, справа доля. Разделительной точки
         между ними нет — разные формы сами разводят величины. -->
    <div class="mt-4 flex items-center justify-between gap-3 px-1">
      <span class="text-[0.8125rem]" :style="{ color: skin.note }">
        {{ daysLeft }} {{ daysWord(daysLeft) }} ост.
      </span>
      <span
        class="rounded-full border px-2 py-0.5 font-mono text-[0.75rem] tabular-nums"
        :style="{ borderColor: skin.pillBorder, color: skin.pillInk }"
      >{{ formatPct(leftPct, 0) }}</span>
    </div>
  </section>
</template>
