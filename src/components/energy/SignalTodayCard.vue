<script setup>
import { computed } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { formatRub } from '../../i18n/format.js'
import { sigClass } from '../../composables/miniModel.js'
import { SIGNAL } from '../../i18n/energy.js'

// Сигнал сегодня — первая карточка вкладки «Сигналы».
//
// Вкладка обязана показывать сигналы, иначе её имя врёт. Поэтому выше
// товара стоит то, что владелец уже получает бесплатно: планка дня
// из его собственных чисел. Каждая строка открывается тапом — происхождение
// числа и есть механика честной цифры.
//
// Бейджей «посчитано» на строках больше нет: три одинаковых чипа подряд
// не сообщали ничего, кроме шума, а статус числа человек читает в шторке
// происхождения — там он относится к конкретному числу и объяснён.
//
// Стрелок у строк нет: их было по одной на каждое число, и три шеврона
// столбиком читались списком разделов. Нажимаемость держит само число —
// крупное, цветное и стоящее особняком; что за ним открывается объяснение,
// человек узнаёт с первого тапа и дальше это знает.
//
// Числа носят цвет по светофору: прогноз меряется против плана теми же
// порогами, что дни, недобор красный, запас зелёный. Требование дня цвета
// не имеет — это не оценка, а задание.
//
// Границу «действия здесь нет» держит плашка метода внизу карточки: раньше
// на её месте стоял абзац о том, чего приложение не умеет. Плашка говорит
// то же самое делом — открывает, из чего собраны числа выше.

const props = defineProps({
  // Результат `computeTodaySignal`: null — сигнала нет.
  signal: { type: Object, default: null },
  // Месяц закрыт: планка дня не существует, сигнал говорит про переход.
  over: { type: Boolean, default: false },
  // Состояние месяца — то же, что стоит бейджем над карточкой и строкой
  // в шапке «Контроля Дня». Плашка метода красится им же.
  goalState: { type: String, default: 'unknown' },
})
const emit = defineEmits(['origin', 'go', 'method'])

const TONE = {
  good: 'var(--positive)',
  warn: 'var(--warning)',
  bad: 'var(--negative)',
  idle: 'var(--text)',
}

const rows = computed(() => {
  const s = props.signal
  if (!s) return []
  const out = []
  if (s.need != null) {
    out.push({ key: 'need', label: SIGNAL.need, value: formatRub(s.need), color: 'var(--text)' })
  }
  out.push({
    key: 'forecast',
    label: SIGNAL.forecast,
    value: formatRub(s.landing),
    color: TONE[sigClass(s.planPct != null ? s.planPct / 100 : null)] || 'var(--text)',
  })
  // Совпадение направлением не называется; недобор и запас — своим словом.
  out.push({
    key: 'gap',
    label: s.even ? SIGNAL.gapEven : s.gap > 0 ? SIGNAL.gapBehind : SIGNAL.gapAhead,
    value: s.even ? '' : formatRub(s.gap > 0 ? s.gap : s.surplus),
    color: s.even ? 'var(--text)' : s.gap > 0 ? 'var(--negative)' : 'var(--positive)',
  })
  return out
})

// Плашка метода красится состоянием месяца — тем же, что стоит бейджем выше
// и строкой в шапке «Контроля Дня». Графит на ней был единственным местом
// экрана, где цвет ничего не значил: человек читал «Нужен рекордный темп»
// жёлтым и тут же видел серую плашку про рост по плану, будто она про другой
// месяц. Состояние одно — цвет один.
//
// На жёлтом текст тёмный, на зелёном и красном белый: цветного текста
// и полутонов на цвете в системе нет.
const METHOD_SKIN = {
  ok: { bg: 'var(--positive)', ink: 'var(--ink-on-color)' },
  record: { bg: 'var(--warning)', ink: 'var(--accent-ink)' },
  out: { bg: 'var(--negative)', ink: 'var(--ink-on-color)' },
  unknown: { bg: 'var(--graphite)', ink: 'var(--ink-on-color)' },
  none: { bg: 'var(--graphite)', ink: 'var(--ink-on-color)' },
}
const method = computed(() => METHOD_SKIN[props.goalState] || METHOD_SKIN.unknown)
</script>

<template>
  <section class="rounded-2xl bg-[var(--surface)] px-4 pb-3 pt-1">
    <!-- Живой сигнал: строки планки, каждая открывает происхождение числа. -->
    <template v-if="signal && !over">
      <ul class="flex flex-col">
        <li v-for="(r, i) in rows" :key="r.key">
          <button
            type="button"
            class="flex min-h-[48px] w-full items-center justify-between gap-3 text-left"
            :class="i < rows.length - 1 ? 'border-b border-[var(--line)]' : ''"
            @click="emit('origin', r.key)"
          >
            <span class="text-[0.875rem] text-[var(--text-secondary)]">{{ r.label }}</span>
            <span class="flex shrink-0 items-center gap-1.5">
              <span
                v-if="r.value"
                class="text-[1rem] font-bold tabular-nums"
                :style="{ color: r.color }"
              >{{ r.value }}</span>
            </span>
          </button>
        </li>
      </ul>

      <!-- Метод стоит здесь, а не отдельной плашкой ниже: он объясняет ровно
           те числа, что над ним. -->
      <button
        type="button"
        class="mt-2 flex min-h-[56px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left"
        :style="{ background: method.bg, color: method.ink }"
        @click="emit('method')"
      >
        <span class="min-w-0 flex-1">
          <span class="block text-[0.9375rem] font-bold leading-tight">Расти по плану</span>
          <span class="mt-0.5 block text-[0.75rem] leading-snug" :style="{ color: method.ink, opacity: 0.8 }">
            Система роста: факт, прогноз, план и цель
          </span>
        </span>
        <ChevronRight class="h-5 w-5 shrink-0" :style="{ color: method.ink }" :stroke-width="2.5" aria-hidden="true" />
      </button>
    </template>

    <!-- Месяц закрыт: планки дня нет, и сигнал говорит одно — куда идти. -->
    <template v-else-if="over">
      <p class="mt-2 text-[0.9375rem] font-semibold text-[var(--text)]">{{ SIGNAL.closedTitle }}</p>
      <p class="mt-0.5 text-[0.875rem] leading-snug text-[var(--text-secondary)]">{{ SIGNAL.closedText }}</p>
    </template>

    <!-- Данных нет — сигнала нет. Правило контура: не из чего собрать
         утверждение — молчим, а не изображаем сигнал нулями. -->
    <template v-else>
      <p class="mt-2 text-[0.9375rem] font-semibold text-[var(--text)]">{{ SIGNAL.emptyTitle }}</p>
      <p class="mt-0.5 text-[0.875rem] leading-snug text-[var(--text-secondary)]">{{ SIGNAL.emptyText }}</p>
      <button
        type="button"
        class="mt-2.5 min-h-[44px] w-full rounded-full text-[0.875rem] font-bold"
        :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
        @click="emit('go', 'day')"
      >{{ SIGNAL.emptyCta }}</button>
    </template>
  </section>
</template>
