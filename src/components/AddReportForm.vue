<script setup>
import { ref, computed, watch } from 'vue'
import { AlertCircle } from 'lucide-vue-next'
import MoneyField from './MoneyField.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { todayISO } from '../composables/miniModel.js'
import { formatRub, dayLabel, dayClosedLabel } from '../i18n/format.js'

// Отчёт за день: дата и одна сумма. Больше ничего не спрашивается — всё, что
// приложение считает, оно считает из выручки по дням.
//
// После сохранения экран говорит одну вещь: день закрыт. Раньше на этом месте
// разворачивался разбор сдвигов прогноза и поле под следующую цифру — человек
// внёс вечернюю выручку и получил второй экран вместо конца дела. Пересчёт
// он и так увидит на «Сегодня»; здесь нужна точка, а не отчёт о работе.
//
// Пропуски предлагаются отдельной кнопкой и только после сохранения: тихая
// подстановка следующей дыры превращала форму в конвейер, из которого не видно
// выхода.

const store = useMiniStore()
const state = store.state
const m = store.model
const emit = defineEmits(['done'])

const props = defineProps({
  // Дата, выбранная в таблице дней; пусто — берём день по умолчанию.
  preset: { type: String, default: '' },
})

const today = todayISO()
// Вчера. Сегодняшний день не вводится вовсе: он ещё идёт, и выручка за него
// не итог, а промежуточное состояние. Внесённая днём цифра встала бы фактом
// закрытого дня и потянула за собой прогноз всего месяца.
const yesterday = (() => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return todayISO(d)
})()

const minDate = computed(() => store.firstOpenDay())
const maxDate = computed(() => {
  const last = `${state.month}-${String(new Date(m.value.Y, m.value.M, 0).getDate()).padStart(2, '0')}`
  return yesterday < last ? yesterday : last
})

// Вводить нечего, когда открытых дат не осталось.
const inputClosed = computed(() => minDate.value > maxDate.value)

/**
 * День по умолчанию — вчерашний, если он открыт и ещё не внесён; иначе
 * последний доступный.
 *
 * Раньше подставлялась первая дыра месяца. У короткого входа первая дыра —
 * второе число, и человек, который каждый вечер вносит вчерашний день, каждый
 * раз правил дату руками. Частый сценарий получил умолчание, редкий —
 * явную кнопку.
 */
function defaultDate() {
  const lo = minDate.value
  const hi = maxDate.value
  if (yesterday >= lo && yesterday <= hi && !store.hasDay(yesterday)) return yesterday
  return hi >= lo ? hi : lo
}

const date = ref(props.preset || defaultDate())
const rev = ref(null)
const saved = ref(null)
const error = ref('')

watch(() => props.preset, (v) => { if (v) { date.value = v; saved.value = null } })

const already = computed(() => state.days.find((d) => d.date === date.value) || null)

// Ближайший пропуск, который остался после сохранения. Показывается кнопкой
// и только там: сам по себе он ничего не подставляет.
const nextGap = computed(() => {
  const due = m.value.days.find((d) => d.due)
  return due ? due.iso : ''
})

function submit() {
  error.value = ''
  if (rev.value === null) { error.value = 'Впишите сумму. Ноль тоже сумма — если день был закрыт.'; return }
  if (date.value < minDate.value) {
    error.value = 'Этот день уже вошёл в стартовую сумму — второй раз его выручка сложилась бы дважды.'
    return
  }
  // Отказ приходит своей строкой: общее «проверьте дату» оставляло человека
  // в уверенности, что день внесён.
  const res = store.putDay(date.value, rev.value)
  if (res !== true) { error.value = typeof res === 'string' ? res : 'День не принят: проверьте дату.'; return }
  saved.value = { date: date.value, rev: rev.value }
  rev.value = null
}

// «Внести пропуск» возвращает форму в рабочее состояние на нужной дате.
function goToGap(iso) {
  saved.value = null
  date.value = iso
  rev.value = null
}
</script>

<template>
  <!-- min-w-0 обязателен: без него содержимое считает ширину по своему
       минимуму и вылезает за карточку на узком экране. -->
  <section class="w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
    <!-- Сохранено: одна строка и выход. Ни расчётов, ни второго поля. -->
    <template v-if="saved">
      <p class="text-[1.25rem] font-bold leading-tight text-[var(--text)]">
        {{ dayClosedLabel(saved.date) }}
      </p>
      <p class="mt-1 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
        {{ dayLabel(saved.date) }} — {{ formatRub(saved.rev) }}
      </p>

      <button
        type="button"
        class="mt-4 min-h-[52px] w-full rounded-xl text-[1.0625rem] font-semibold"
        :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
        @click="emit('done')"
      >Отлично!</button>

      <!-- Пропуск — кнопка, а не ссылка: действие того же веса стоит рядом
           и должно выглядеть нажимаемым. -->
      <button
        v-if="nextGap"
        type="button"
        class="mt-2 min-h-[48px] w-full rounded-xl border text-[0.9375rem] font-semibold text-[var(--text)]"
        :style="{ borderColor: 'var(--rim)', background: 'var(--surface-2)' }"
        @click="goToGap(nextGap)"
      >Внести пропуск: {{ dayLabel(nextGap) }}</button>
    </template>

    <template v-else>
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
          <!-- Поле даты на iOS имеет собственную ширину и без max-w вылезает
               за карточку вместе с рамкой. -->
          <input
            v-model="date"
            class="mt-2 block min-h-[44px] w-full min-w-0 max-w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3
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
    </template>
  </section>
</template>
