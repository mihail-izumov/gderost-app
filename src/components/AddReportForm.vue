<script setup>
import { ref, computed, watch } from 'vue'
import { AlertCircle } from 'lucide-vue-next'
import MoneyField from './MoneyField.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { todayISO } from '../composables/miniModel.js'
import { formatRub, formatRubCompact, dayLabel } from '../i18n/format.js'

// Отчёт за день: дата и одна сумма. Больше ничего не спрашивается — всё, что
// приложение считает, оно считает из выручки по дням.
//
// Здесь замыкается петля: внёс день — увидел, что поменялось. Поэтому после
// сохранения на этом же месте показывается сдвиг прогноза, остатка и требования
// на сегодня. Без этого ввод превращается в отчётность ради отчётности.

const store = useMiniStore()
const state = store.state
const m = store.model

const props = defineProps({
  // Дата, выбранная в таблице дней; пусто — берём первую открытую.
  preset: { type: String, default: '' },
})

const today = todayISO()
const minDate = computed(() => store.firstOpenDay())
const maxDate = computed(() => {
  // Будущее не вводится: выручки, которой ещё не было, не бывает.
  const last = `${state.month}-${String(new Date(m.value.Y, m.value.M, 0).getDate()).padStart(2, '0')}`
  return today < last ? today : last
})

// Вводить нечего, когда открытых дат не осталось.
const inputClosed = computed(() => minDate.value > maxDate.value)

// Первая дыра в месяце, иначе сегодня: чаще всего вносят именно пропущенное.
function firstSuggested() {
  const due = m.value.days.find((d) => d.due)
  if (due) return due.iso
  const last = `${state.month}-${String(new Date(m.value.Y, m.value.M, 0).getDate()).padStart(2, '0')}`
  const top = today < last ? today : last
  return top >= store.firstOpenDay() ? top : store.firstOpenDay()
}

const date = ref(props.preset || firstSuggested())
const rev = ref(null)
const saved = ref(null)
const error = ref('')

watch(() => props.preset, (v) => { if (v) { date.value = v; saved.value = null } })

const already = computed(() => state.days.find((d) => d.date === date.value) || null)

function snapshot() {
  const x = m.value
  return { landing: x.landing, remain: x.remainTarget, todayNeed: x.todayNeed }
}

function submit() {
  error.value = ''
  if (rev.value === null) { error.value = 'Впишите сумму. Ноль тоже сумма — если день был закрыт.'; return }
  if (date.value < minDate.value) {
    error.value = 'Этот день уже вошёл в стартовую сумму — второй раз его выручка сложилась бы дважды.'
    return
  }
  const before = snapshot()
  if (!store.putDay(date.value, rev.value)) { error.value = 'День не принят: проверьте дату.'; return }
  const after = snapshot()
  saved.value = { date: date.value, rev: rev.value, before, after }
  rev.value = null
  // Следующая дыра подставляется сама: вносить пропущенные дни подряд —
  // самый частый сценарий, и заставлять человека каждый раз листать календарь незачем.
  date.value = nextGap()
}

function nextGap() {
  const due = m.value.days.find((d) => d.due)
  if (due) return due.iso
  return today <= maxDate.value ? today : maxDate.value
}

// Направление несут знак и слово, не цвет. Цвет в приложении означает светофор,
// и если им начнёт говорить ещё и дельта, светофор перестанет означать что-то одно.
function diffLine(label, a, b) {
  const delta = b - a
  const moved = Math.abs(delta) > 0.5
  return {
    label,
    from: a,
    to: b,
    delta,
    moved,
    arrow: !moved ? '' : delta > 0 ? '↑' : '↓',
    sign: !moved ? 'без изменений' : `${delta > 0 ? '+' : '−'}${formatRubCompact(Math.abs(delta))}`,
  }
}

const changes = computed(() => {
  if (!saved.value) return []
  const { before, after } = saved.value
  const out = [
    diffLine('Прогноз месяца', before.landing, after.landing),
    diffLine('Осталось заработать', before.remain, after.remain),
  ]
  if (before.todayNeed !== null && after.todayNeed !== null) {
    out.push(diffLine('Нужно сегодня', before.todayNeed, after.todayNeed))
  }
  return out
})
</script>

<template>
  <section class="rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
    <h2 class="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
      Добавить отчёт
    </h2>

    <!-- Состояние: вводить нечего -->
    <p v-if="inputClosed" class="mt-2 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
      Все прошедшие дни месяца закрыты. Следующий отчёт — завтра.
    </p>

    <form v-else class="mt-3 flex flex-col gap-4" @submit.prevent="submit">
      <label class="block">
        <span class="block text-[0.8125rem] font-medium text-[var(--text-secondary)]">За какой день</span>
        <input
          v-model="date"
          class="mt-2 min-h-[44px] w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3
                 font-mono text-[1rem] text-[var(--text)] outline-none focus:border-[var(--text-secondary)]"
          type="date"
          :min="minDate"
          :max="maxDate"
        >
      </label>

      <MoneyField
        id="mini-day-rev"
        v-model="rev"
        label="Выручка за день"
        hint="Ноль — тоже ответ, если работы не было"
        placeholder="0"
      />

      <p v-if="already" class="text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
        За {{ dayLabel(date) }} уже внесено {{ formatRub(already.rev) }}.
        Новая сумма заменит прежнюю.
      </p>

      <!-- Единственное место, где цвет живёт в тексте: ошибка формы, и та с иконкой,
           чтобы сообщение доходило и без различения цвета. -->
      <p v-if="error" class="flex items-start gap-1.5 text-[0.8125rem] leading-snug text-[var(--negative)]">
        <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{{ error }}</span>
      </p>

      <button
        type="submit"
        class="min-h-[52px] w-full rounded-xl text-[1.0625rem] font-semibold"
        :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      >Сохранить день</button>
    </form>

    <!-- Замер: что сдвинулось от одного внесённого дня -->
    <div v-if="saved" class="mt-4 rounded-xl bg-[var(--surface-2)] p-3">
      <p class="text-[0.8125rem] font-medium text-[var(--text)]">
        {{ dayLabel(saved.date) }} — {{ formatRub(saved.rev) }}. Что изменилось:
      </p>
      <ul class="mt-2 flex flex-col gap-1.5">
        <li v-for="c in changes" :key="c.label" class="flex items-baseline justify-between gap-2">
          <span class="text-[0.8125rem] text-[var(--text-secondary)]">{{ c.label }}</span>
          <span class="text-right font-mono text-[0.8125rem] tabular-nums text-[var(--text)]">
            <span class="text-[var(--text-muted)]">{{ formatRubCompact(c.from) }}</span>
            <span class="mx-1 text-[var(--text-muted)]">→</span>
            <span>{{ formatRubCompact(c.to) }}</span>
            <span class="ml-1.5 text-[var(--text-secondary)]">{{ c.arrow }} {{ c.sign }}</span>
          </span>
        </li>
      </ul>
      <p class="mt-2 text-[0.6875rem] leading-snug text-[var(--text-muted)]">
        Прогноз пересчитан на новом темпе, остаток плана заново разнесён по открытым дням.
      </p>
    </div>
  </section>
</template>
