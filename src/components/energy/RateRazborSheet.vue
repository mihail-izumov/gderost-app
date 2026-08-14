<script setup>
import { ref } from 'vue'
import { useMiniStore } from '../../composables/useMiniStore.js'
import { RATING } from '../../i18n/energy.js'

// Оценка разбора. Единственное место, где человек сам отмечает, что встреча
// была, — автоматики нет и не подразумевается.
//
// Спрашивается польза, а не факт: «был разбор?» — вопрос учёта, и отвечать
// на него человеку незачем. Польза от 0 до 10 — вопрос, ответ на который
// нужен и ему самому: он же и есть та петля, ради которой считается энергия.
//
// Формулировка не сокращается (стандарт оценок контура данных): сокращённый
// вопрос дал трём людям три разных предмета оценки.

const store = useMiniStore()
const emit = defineEmits(['close'])

const picked = ref(store.state.razborRating)

function save() {
  if (picked.value === null || picked.value === undefined) return
  store.rateRazbor(picked.value)
  emit('close')
}

function clear() {
  store.clearRazborRating()
  picked.value = null
  emit('close')
}
</script>

<template>
  <div>
    <h2 class="text-[1.0625rem] font-bold text-[var(--text)]">{{ RATING.title }}</h2>
    <p class="mt-1 text-[0.875rem] leading-snug text-[var(--text-secondary)]">{{ RATING.question }}</p>

    <div class="mt-4 grid grid-cols-6 gap-1.5">
      <button
        v-for="n in 11"
        :key="n"
        type="button"
        class="flex min-h-[44px] items-center justify-center rounded-xl text-[0.9375rem] font-bold tabular-nums"
        :style="picked === n - 1
          ? { background: 'var(--accent)', color: 'var(--accent-ink)' }
          : { background: 'var(--surface-2)', color: 'var(--text-secondary)' }"
        :aria-pressed="picked === n - 1 ? 'true' : 'false'"
        @click="picked = n - 1"
      >{{ n - 1 }}</button>
    </div>

    <div class="mt-2 flex justify-between text-[0.6875rem] text-[var(--text-muted)]">
      <span>0 — {{ RATING.low }}</span>
      <span>10 — {{ RATING.high }}</span>
    </div>

    <button
      type="button"
      class="mt-4 min-h-[48px] w-full rounded-full text-[0.9375rem] font-bold disabled:opacity-40"
      :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      :disabled="picked === null || picked === undefined"
      @click="save"
    >Сохранить оценку</button>

    <button
      v-if="store.state.razborRating !== null"
      type="button"
      class="mt-2 min-h-[44px] w-full rounded-full text-[0.875rem] font-medium text-[var(--text-muted)]"
      @click="clear"
    >Убрать отметку</button>

    <button
      v-else
      type="button"
      class="mt-2 min-h-[44px] w-full rounded-full text-[0.875rem] font-medium text-[var(--text-muted)]"
      @click="emit('close')"
    >Отмена</button>
  </div>
</template>
