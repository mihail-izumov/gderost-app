<script setup>
import { ref } from 'vue'
import MoneyField from './MoneyField.vue'
import { useMiniStore, currentMonth } from '../composables/useMiniStore.js'
import { todayISO } from '../composables/miniModel.js'

// Что уже заработано в этом месяце — одной суммой.
//
// Короткий вход этого не спрашивает: до первого дня сумма не нужна.
// Как только становится видно, что месяц идёт не с первого числа, шторка
// открывается отсюда — те же два поля, что стояли в полном подключении,
// и то же правило хранилища.

const store = useMiniStore()
const emit = defineEmits(['close'])

const month = currentMonth()
const firstOfMonth = `${month}-01`
const dayBefore = (() => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const iso = todayISO(d)
  return iso >= firstOfMonth ? iso : firstOfMonth
})()

const amount = ref(store.state.carry ? store.state.carry.amount : null)
const upTo = ref(store.state.carry ? store.state.carry.upTo : dayBefore)

function save() {
  if (!(Number(amount.value) >= 0) || !upTo.value) return
  store.setCarry({ amount: amount.value, upTo: upTo.value })
  emit('close')
}
</script>

<template>
  <section>
    <h2 class="text-[1.25rem] font-bold leading-tight text-[var(--text)]">Заработано с начала месяца</h2>

    <div class="mt-4 flex flex-col gap-4">
      <MoneyField id="carry-amount" v-model="amount" label="Сумма" placeholder="1 250 000" />
      <label class="block">
        <span class="block text-[0.8125rem] font-medium text-[var(--text-secondary)]">
          По какой день включительно
        </span>
        <input
          v-model="upTo"
          class="mt-2 min-h-[52px] w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3
                 text-[1.0625rem] tabular-nums text-[var(--text)] outline-none focus:border-[var(--text-secondary)]"
          type="date"
          :min="firstOfMonth"
          :max="dayBefore"
        >
      </label>
    </div>

    <button
      type="button"
      class="mt-5 min-h-[48px] w-full rounded-full text-[0.9375rem] font-bold transition-opacity disabled:opacity-40"
      :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      :disabled="!(Number(amount) >= 0) || !upTo"
      @click="save"
    >Сохранить</button>
  </section>
</template>
