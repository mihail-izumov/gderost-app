<script setup>
import { computed } from 'vue'
import { formatRub, formatGrowth, monthOf, plural } from '../../i18n/format.js'
import { SIG_VAR } from '../../i18n/daily.js'
import { sigClass } from '../../composables/miniModel.js'

// Месяц — главный блок «Прогресса».
//
// На его месте стояла идущая неделя, и это была ошибка масштаба: страница
// отвечает на вопрос «куда идёт месяц», а начиналась с семи дней.
//
// ⚠ Второй заход убрал отсюда план и прогноз. Полоса «факт · доложит темп ·
// недобор» уже стоит на «Сегодня», считает то же самое и делает это точнее —
// две одинаковые полосы на соседних экранах человек читает как два разных
// расчёта и начинает сверять их между собой. У блока остался свой вопрос,
// которого нет больше нигде: КАК ИДУТ ДНИ. Сколько их прошло, сколько
// внесено, где дыры — и всё это видно одним рядом, по дню на деление.
//
// Деньги наверху остаются: они отвечают «сколько сделано», и ради них дни
// и вносят. Отклонение прогноза стоит чипом — одно число, а не вторая полоса.

const props = defineProps({
  m: { type: Object, required: true },
  today: { type: String, required: true },
})
const emit = defineEmits(['enter'])

const dayShort = (iso) => `${iso.slice(8)}.${iso.slice(5, 7)}`

const title = computed(() => `${monthOf(props.m.month)} ${props.m.month.slice(0, 4)}`)

// Ближайший день, который можно внести, — строго ПРОШЕДШИЙ: сегодняшний ещё
// идёт, его выручка не итог, и форма ввода его не принимает.
const nextISO = computed(() => {
  const d = props.m.days.find((x) => !x.closed && x.iso < props.today)
  return d ? d.iso : ''
})

// Ряд дней месяца. Цвет говорит ровно то же, что и везде в приложении:
// светофор у дня с известной выручкой, серый у дня, вошедшего в стартовую
// сумму (его выручка неизвестна, оценивать нечего), жёлтый у прошедшего дня
// без цифры — это долг, и жёлтый в системе означает именно его. Будущее
// нейтрально: там ещё ничего не случилось.
const strip = computed(() => props.m.days.map((d) => {
  let bg = 'var(--line)'
  if (d.entered) bg = SIG_VAR[sigClass(d.fact / d.planAt)]
  else if (d.inCarry) bg = 'var(--text-muted)'
  else if (d.iso < props.today) bg = 'var(--warning)'
  return { key: d.iso, dd: d.dd, bg, today: d.iso === props.today }
}))

const passed = computed(() => props.m.days.filter((d) => d.iso < props.today).length)
const filled = computed(() => props.m.days.filter((d) => d.closed).length)
const missing = computed(() => props.m.days.filter((d) => d.due).length)
</script>

<template>
  <section class="rounded-[22px] bg-[var(--surface)] p-4">
    <div class="flex items-center gap-2">
      <h2 class="text-[1.0625rem] font-bold leading-none text-[var(--text)]">{{ title }}</h2>
      <span
        class="ml-auto inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.6875rem] font-bold tabular-nums"
        :style="{ background: SIG_VAR[m.fcSig] || 'var(--surface-2)', color: m.fcSig === 'warn' ? 'var(--accent-ink)' : 'var(--ink-on-color)' }"
      >{{ formatGrowth(m.landDev) }}</span>
    </div>

    <div class="mt-3 flex items-baseline gap-2">
      <span class="text-[2rem] font-bold leading-none tabular-nums text-[var(--text)]">{{ formatRub(m.realizedRev) }}</span>
      <span class="text-[0.875rem] text-[var(--text-muted)]">факт</span>
    </div>

    <!-- Дни месяца, по делению на день. Сегодняшний выше остальных: человек
         ищет глазами «где я сейчас», и это единственный способ ответить,
         не подписывая числа под каждым делением. -->
    <div class="mt-3.5 flex h-[26px] items-end gap-[2px]">
      <span
        v-for="d in strip"
        :key="d.key"
        class="min-w-0 flex-1 rounded-[2px]"
        :class="d.today ? 'h-[26px]' : 'h-[18px]'"
        :style="{ background: d.bg }"
        :title="`${d.dd}`"
      ></span>
    </div>

    <p class="mt-2.5 text-[0.8125rem] text-[var(--text-muted)]">
      Прошло {{ passed }} из {{ m.days.length }} {{ plural(m.days.length, 'дня', 'дней', 'дней') }} · внесено {{ filled }}
    </p>

    <p
      v-if="missing > 0"
      class="mt-1 text-[0.8125rem] font-semibold"
      :style="{ color: 'var(--text)' }"
    >Не внесено {{ missing }} {{ plural(missing, 'день', 'дня', 'дней') }}</p>
    <p v-else class="mt-1 text-[0.8125rem] text-[var(--text-secondary)]">Все прошедшие дни внесены</p>

    <button
      v-if="nextISO"
      type="button"
      class="mt-3 min-h-[48px] w-full rounded-2xl text-[1rem] font-bold"
      :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      @click="emit('enter', nextISO)"
    >Внести {{ dayShort(nextISO) }}</button>
  </section>
</template>
