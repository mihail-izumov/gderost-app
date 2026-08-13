<script setup>
import { computed, ref } from 'vue'
import { X } from 'lucide-vue-next'
import MoneyField from './MoneyField.vue'
import { useMiniStore, currentMonth } from '../composables/useMiniStore.js'
import { monthLabel, monthOf, plural } from '../i18n/format.js'
import { shapeName } from '../data/weekShape.js'
import { saveText } from '../composables/saveFile.js'

// Начать следующий месяц — мягкий перенос.
//
// Месяц закрылся, и приложение не делает вид, что он идёт. Перенос — четыре
// действия, и все четыре видны здесь: план, цель, форма недели, судьба дней.
// Ни одно не срабатывает молча.
//
// План предзаполнен прошлым значением, но подтверждает его владелец: план —
// обязательство, и копировать обязательство за человека нельзя.
//
// Выгрузка стоит выше кнопки переноса, а не ниже: после переноса дней старого
// месяца в приложении не остаётся, и другой копии нигде нет.

const store = useMiniStore()
const state = store.state
const emit = defineEmits(['close'])

const from = state.month
const to = currentMonth()

const target = ref(state.month_target || null)
const goal = ref(state.month_goal || null)

const saved = ref(false)
const saveFailed = ref(false)
const asking = ref(false)

const targetOk = computed(() => Number(target.value) > 0)
const goalConflict = computed(() =>
  Number(goal.value) > 0 && targetOk.value && Number(goal.value) < Number(target.value))

// Имя формы после переноса: посчитанная по дням становится перенесённой —
// наблюдения стираются вместе с днями.
const shapeAfter = computed(() => (state.coef_src === 'data'
  ? shapeName('moved', state.shape_id, from)
  : shapeName(state.coef_src, state.shape_id, state.shape_from)))

const dayCount = computed(() => state.days.length)
const daysLabel = computed(() => `${dayCount.value} ${plural(dayCount.value, 'день', 'дня', 'дней')}`)
const hasData = computed(() => dayCount.value > 0 || !!state.carry)

// Файлом, а не в буфер: это последняя копия месяца, и обрыв длинного текста
// при вставке на телефоне здесь стоил бы всей истории. Буфер — запасной путь.
async function saveData() {
  const text = store.exportText()
  saveFailed.value = false
  if (saveText(text, store.exportFileName())) {
    saved.value = true
    return true
  }
  try {
    await navigator.clipboard.writeText(text)
    saved.value = true
    return true
  } catch {
    saveFailed.value = true
    return false
  }
}

function apply() {
  if (!targetOk.value || goalConflict.value) return
  store.startNextMonth({ month: to, target: target.value, goal: goal.value })
  emit('close')
}

function start() {
  if (!targetOk.value || goalConflict.value) return
  if (hasData.value && !saved.value) { asking.value = true; return }
  apply()
}

async function saveAndStart() {
  if (await saveData()) apply()
}
</script>

<template>
  <div class="w-full">
    <header class="flex items-center gap-3 pb-3">
      <h2 class="text-[1.25rem] font-bold text-[var(--text)]">Начать {{ monthLabel(to) }}</h2>
      <button
        type="button"
        class="ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-2)]"
        aria-label="Закрыть"
        @click="emit('close')"
      >
        <X class="h-5 w-5 text-[var(--text-secondary)]" :stroke-width="2" aria-hidden="true" />
      </button>
    </header>

    <div class="flex flex-col gap-3 rounded-2xl bg-[var(--surface)] p-4">
      <MoneyField
        id="mini-next-target"
        v-model="target"
        :label="`План на ${monthLabel(to)}`"
        placeholder="3 000 000"
      />
      <MoneyField
        id="mini-next-goal"
        v-model="goal"
        :label="`Цель на ${monthLabel(to)}`"
        placeholder="3 500 000"
      />
      <p v-if="goalConflict" class="text-[0.8125rem] leading-snug text-[var(--negative)]">
        Цель ниже плана.
      </p>
    </div>

    <div class="mt-3 overflow-hidden rounded-2xl bg-[var(--surface)]">
      <div class="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3">
        <span class="text-[0.9375rem] text-[var(--text-secondary)]">Форма недели</span>
        <span class="ml-auto text-right text-[0.9375rem] font-medium text-[var(--text)]">{{ shapeAfter }}</span>
      </div>
      <div class="flex items-center gap-3 px-4 py-3">
        <span class="text-[0.9375rem] text-[var(--text-secondary)]">Дни {{ monthOf(from) }}</span>
        <span class="ml-auto text-right text-[0.9375rem] font-medium text-[var(--text)]">
          {{ daysLabel }}, стираются
        </span>
      </div>
    </div>

    <button
      type="button"
      class="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border text-[1.0625rem] font-semibold"
      :style="{ borderColor: 'var(--line)', color: 'var(--text)' }"
      @click="saveData"
    >
      {{ saved ? 'Готово' : `Скачать ${monthOf(from)}` }}
      <span
        class="rounded px-1.5 py-0.5 text-[0.6875rem] font-bold"
        :style="{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }"
      >MD</span>
    </button>
    <p v-if="saveFailed" class="mt-2 text-[0.8125rem] text-[var(--negative)]">
      Браузер не дал сохранить файл.
    </p>

    <template v-if="!asking">
      <button
        type="button"
        class="mt-3 min-h-[52px] w-full rounded-2xl text-[1.0625rem] font-bold transition-opacity disabled:opacity-40"
        :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
        :disabled="!targetOk || goalConflict"
        @click="start"
      >Перенести и начать</button>
    </template>

    <!-- Копии нет, а дни сейчас исчезнут: приложение об этом уведомляет
         и оставляет оба выхода открытыми. -->
    <div v-else class="mt-3 flex flex-col gap-2">
      <p class="text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
        Дни {{ monthOf(from) }} стираются. Файл не скачан.
      </p>
      <button
        type="button"
        class="min-h-[52px] w-full rounded-2xl text-[1.0625rem] font-bold"
        :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
        @click="saveAndStart"
      >Скачать и начать</button>
      <button
        type="button"
        class="min-h-[48px] w-full rounded-2xl border border-[var(--line)] text-[1rem] font-medium text-[var(--text-secondary)]"
        @click="apply"
      >Начать без файла</button>
    </div>
  </div>
</template>
