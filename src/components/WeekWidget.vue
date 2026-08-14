<script setup>
import { computed } from 'vue'
import { DOW_RU, todayISO } from '../composables/miniModel.js'
import { weekRangeLabel, daysWord, formatPct } from '../i18n/format.js'

// Виджет недели на входе. Работает в двух режимах и ни в одном ничего
// не выдумывает.
//
// Без `days` он берёт текущую календарную неделю из часов устройства — так он
// стоит на витрине, где данных ещё нет и все маркеры пустые. С `days` он рисует
// ровно те дни, что ему дали, вместе с их оценками: неделя месяца может быть
// неполной на своих границах, и дорисовывать в неё чужие дни было бы враньём
// о том, что в этой неделе посчитано.
//
// Чёрный вид — не тема, а якорь внимания: одна тёмная карточка на светлом
// холсте держит взгляд там, где начинается разговор. Заливка сплошная, без
// градиента: градиент на карточке-герое читается как эффект, а не как форма.
// Моноширинного набора внутри нет — цифры держит tabular-nums, а машинное
// начертание в герое выглядит выводом программы, а не календарём.

const props = defineProps({
  // Явные дни: [{ key, dow (1=Пн..7=Вс), dowRu, dd, isToday, mark }]
  days: { type: Array, default: null },
  // Оценки для режима без `days`: 7 значений Пн..Вс
  marks: { type: Array, default: null },
  now: { type: Date, default: () => new Date() },
  // Своя подпись вместо диапазона дат
  label: { type: String, default: null },
  // 'black' — герой-кадр входа, 'surface' — обычная карточка внутри приложения
  tone: { type: String, default: 'surface' },
  // Нижняя строка. Без них печатается остаток месяца.
  note: { type: String, default: null },
  pill: { type: String, default: null },
})

const dark = computed(() => props.tone === 'black')

const MARK_FILL = {
  good: 'var(--positive)',
  warn: 'var(--warning)',
  bad: 'var(--negative)',
  carry: 'var(--text-muted)',
}

const skin = computed(() => (dark.value
  ? {
    card: { background: 'var(--surface-black)', color: 'var(--ink-on-color)' },
    title: 'var(--ink-on-color)',
    dow: 'var(--ink-on-color-muted)',
    num: 'var(--ink-on-color)',
    todayBg: 'var(--ink-on-color)',
    todayInk: 'var(--surface-black)',
    emptyMark: 'var(--line-on-color)',
    note: 'var(--ink-on-color-muted)',
    pillBorder: 'var(--line-on-color)',
    pillInk: 'var(--ink-on-color)',
  }
  : {
    card: { background: 'var(--surface)', color: 'var(--text)', boxShadow: 'var(--card-shadow)' },
    title: 'var(--text)',
    dow: 'var(--text-muted)',
    num: 'var(--text)',
    todayBg: 'var(--text)',
    todayInk: 'var(--ink-on-color)',
    emptyMark: 'var(--line)',
    note: 'var(--text-secondary)',
    pillBorder: 'var(--line)',
    pillInk: 'var(--text-secondary)',
  }))

const calendarWeek = computed(() => {
  const t = new Date(props.now)
  t.setHours(0, 0, 0, 0)
  const shift = (t.getDay() + 6) % 7 // 0 = понедельник
  const monday = new Date(t)
  monday.setDate(t.getDate() - shift)
  const todayIso = todayISO(t)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      key: todayISO(d),
      dow: i + 1,
      dowRu: DOW_RU[i],
      dd: d.getDate(),
      isToday: todayISO(d) === todayIso,
      mark: props.marks && props.marks[i] ? props.marks[i] : 'idle',
    }
  })
})

const week = computed(() => (props.days || calendarWeek.value).map((d) => ({
  ...d,
  fill: MARK_FILL[d.mark] || null,
})))

const title = computed(() => {
  if (props.label) return props.label
  const w = week.value
  return weekRangeLabel(w[0].key, w[w.length - 1].key)
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

const noteText = computed(() => props.note ?? `${daysLeft.value} ${daysWord(daysLeft.value)} ост.`)
const pillText = computed(() => props.pill ?? formatPct(leftPct.value, 0))
</script>

<template>
  <section class="rounded-2xl px-3 py-4" :style="skin.card">
    <!-- Шапка: слева период, справа остаток. Обе величины про месяц, поэтому
         стоят в одной строке; разные формы — текст и пилюля — разводят их
         без разделительных знаков. -->
    <div class="flex items-center justify-between gap-3 px-1">
      <h2 class="text-[1.25rem] font-bold leading-none" :style="{ color: skin.title }">{{ title }}</h2>

      <div v-if="noteText || pillText" class="flex shrink-0 items-center gap-2">
        <span v-if="noteText" class="text-[0.75rem]" :style="{ color: skin.note }">{{ noteText }}</span>
        <span
          v-if="pillText"
          class="rounded-full border px-2 py-0.5 text-[0.75rem] tabular-nums"
          :style="{ borderColor: skin.pillBorder, color: skin.pillInk }"
        >{{ pillText }}</span>
      </div>
    </div>

    <ul class="mt-4 grid grid-cols-7 gap-1">
      <li
        v-for="d in week" :key="d.key"
        class="flex flex-col items-center gap-1.5"
        :style="{ gridColumnStart: d.dow }"
      >
        <span class="text-[0.6875rem] font-medium" :style="{ color: skin.dow }">{{ d.dowRu }}</span>
        <!-- Цифра в круге центруется утилитой `.gr-digit` из `main.css`:
             коробка строки обрезается по высоте прописной, и флекс центрирует
             саму цифру. Подобранного на глаз сдвига здесь больше нет — он
             опускал весь ряд ниже середины кругов; замер по снимку экрана
             14.08 дал сдвиг вниз на 1,25 пикселя. -->
        <span
          class="flex h-8 w-8 items-center justify-center rounded-full"
          :style="d.isToday
            ? { background: skin.todayBg, color: skin.todayInk }
            : { color: skin.num }"
        >
          <span
            class="gr-digit block text-[0.9375rem] font-semibold tabular-nums"
          >{{ d.dd }}</span>
        </span>
        <span
          class="block h-2.5 w-2.5 rounded-full border"
          :style="d.fill
            ? { background: d.fill, borderColor: d.fill }
            : { background: 'transparent', borderColor: skin.emptyMark }"
        />
      </li>
    </ul>
  </section>
</template>
