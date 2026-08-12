<script setup>
import { ref, computed } from 'vue'
import { AlertCircle } from 'lucide-vue-next'
import MoneyField from '../components/MoneyField.vue'
import { useMiniStore, currentMonth } from '../composables/useMiniStore.js'
import { todayISO } from '../composables/miniModel.js'
import { monthLabel, dayLabel, formatRub } from '../i18n/format.js'

// Подключение бизнеса: четыре поля и ни одним больше.
// Спрашиваем только то, что владелец знает наизусть, — деньги и даты.
// Прогноз не спрашивается никогда: он считается, в этом весь смысл.

const store = useMiniStore()
const emit = defineEmits(['done'])

const month = currentMonth()
const today = todayISO()
const firstOfMonth = `${month}-01`
const dayBefore = (() => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const iso = todayISO(d)
  return iso >= firstOfMonth ? iso : firstOfMonth
})()

const company = ref('')
const unit = ref('')
const target = ref(null)
const earned = ref(null)
const earnedUpTo = ref(dayBefore)
const goal = ref(null)

// Первое число месяца: прошлого в этом месяце ещё нет, поле лишнее.
const monthJustStarted = computed(() => today === firstOfMonth)

const targetOk = computed(() => Number(target.value) > 0)
const goalConflict = computed(() =>
  Number(goal.value) > 0 && targetOk.value && Number(goal.value) < Number(target.value))
const earnedOk = computed(() =>
  !targetOk.value || earned.value === null || Number(earned.value) <= Number(target.value) * 3)
const canGo = computed(() => targetOk.value && !goalConflict.value)

function submit() {
  if (!canGo.value) return
  store.setup({
    company: company.value,
    unit: unit.value,
    target: target.value,
    goal: goal.value,
    earned: monthJustStarted.value ? null : earned.value,
    earnedUpTo: monthJustStarted.value ? null : earnedUpTo.value,
    month,
  })
  emit('done')
}
</script>

<template>
  <div class="w-full">
    <header class="pt-2">
      <h1 class="font-brand text-[1.75rem] font-bold leading-tight tracking-tight text-[var(--text)]">
        Подключите бизнес
      </h1>
      <p class="mt-2 text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
        Четыре ответа, которые вы знаете без отчётов. Дальше считает приложение —
        прямо здесь, на вашем телефоне, без регистрации и без отправки куда-либо.
      </p>
    </header>

    <form class="mt-6 flex flex-col gap-5" @submit.prevent="submit">
      <!-- 1. Чей это месяц -->
      <label class="block">
        <span class="block text-[0.8125rem] font-medium text-[var(--text-secondary)]">Компания и точка</span>
        <span class="mt-0.5 block text-[0.75rem] leading-snug text-[var(--text-muted)]">
          Чтобы цифры имели имя. Останется на этом устройстве
        </span>
        <span class="mt-2 grid grid-cols-2 gap-2">
          <input
            v-model="company"
            class="min-h-[44px] rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3
                   text-[1.0625rem] text-[var(--text)] outline-none
                   placeholder:text-[var(--placeholder)] focus:border-[var(--text-secondary)]"
            type="text" autocomplete="off" placeholder="Компания"
          >
          <input
            v-model="unit"
            class="min-h-[44px] rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3
                   text-[1.0625rem] text-[var(--text)] outline-none
                   placeholder:text-[var(--placeholder)] focus:border-[var(--text-secondary)]"
            type="text" autocomplete="off" placeholder="Точка"
          >
        </span>
      </label>

      <!-- 2. План — обязательство, единственное обязательное поле -->
      <MoneyField
        id="mini-target"
        v-model="target"
        :label="`План на ${monthLabel(month)}`"
        hint="Сумма, которую вы обязаны сделать. Не мечта — обязательство"
        placeholder="3 000 000"
      />

      <!-- 3. Прошлое одной суммой: месяц не обязан начинаться первого числа -->
      <div v-if="!monthJustStarted">
        <MoneyField
          id="mini-earned"
          v-model="earned"
          label="Заработано с начала месяца"
          hint="Одной суммой, по дням разбивать не нужно"
          placeholder="0"
        />
        <label class="mt-2 flex flex-wrap items-center gap-2">
          <span class="text-[0.8125rem] text-[var(--text-muted)]">по</span>
          <input
            v-model="earnedUpTo"
            class="min-h-[44px] rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3
                   font-mono text-[0.9375rem] text-[var(--text)] outline-none
                   focus:border-[var(--text-secondary)]"
            type="date"
            :min="firstOfMonth"
            :max="dayBefore"
          >
          <span class="text-[0.8125rem] text-[var(--text-muted)]">включительно</span>
        </label>
        <p class="mt-2 text-[0.75rem] leading-snug text-[var(--text-muted)]">
          Эти дни останутся серыми: дневной выручки по ним нет, значит и оценивать
          их нечем. Оценка появится у дней, которые вы внесёте по одному.
        </p>
      </div>

      <!-- 4. Цель — можно пропустить без наказания -->
      <div>
        <MoneyField
          id="mini-goal"
          v-model="goal"
          label="Цель — если она есть"
          hint="То, ради чего стараетесь сверх плана. Можно пропустить"
          placeholder="Можно пропустить"
        />
        <p
          v-if="goalConflict"
          class="mt-2 flex items-start gap-1.5 text-[0.8125rem] leading-snug text-[var(--negative)]"
        >
          <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Цель ниже плана — тогда это не цель, а другой план.
            Цель либо выше {{ formatRub(target) }}, либо её пока нет.
          </span>
        </p>
      </div>

      <p v-if="!earnedOk" class="text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
        Заработано больше трёх планов за
        {{ monthJustStarted ? 'месяц' : `период до ${dayLabel(earnedUpTo)}` }} —
        проверьте, не лишний ли ноль.
      </p>

      <button
        type="submit"
        class="min-h-[52px] w-full rounded-xl text-[1.0625rem] font-semibold
               transition-opacity disabled:opacity-40"
        :style="{ background: 'var(--text)', color: 'var(--ink-on-color)' }"
        :disabled="!canGo"
      >
        Показать разрыв
      </button>

      <p class="text-center text-[0.75rem] leading-snug text-[var(--text-muted)]">
        Ничего не уходит в сеть. Данные лежат в этом браузере и стираются,
        если очистить его данные.
      </p>
    </form>
  </div>
</template>
