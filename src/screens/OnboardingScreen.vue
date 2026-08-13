<script setup>
import { ref, computed } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'
import MoneyField from '../components/MoneyField.vue'
import { useMiniStore, currentMonth } from '../composables/useMiniStore.js'
import { todayISO } from '../composables/miniModel.js'
import { monthLabel, formatRub } from '../i18n/format.js'

// Подключение бизнеса: четыре ответа, по одному экрану на каждый.
//
// Интерфейс информирует и уведомляет. Он не рассказывает, как устроен, зачем
// нужен и почему безопасен: поле с понятным именем объясняет себя само, а
// абзац под ним нужен только там, где имя подобрано плохо. Сообщения остаются
// ровно двумя: что ввести и что не сходится.
//
// Шаги вместо ленты — потому что одно поле на экране не даёт пролистать мимо,
// а вернуться назад можно в любой момент: введённое не теряется.

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

// Первое число месяца: прошлого в этом месяце ещё нет, шаг лишний.
const monthJustStarted = computed(() => today === firstOfMonth)

const STEPS = computed(() => (monthJustStarted.value
  ? ['who', 'plan', 'goal']
  : ['who', 'plan', 'earned', 'goal']))

const at = ref(0)
const step = computed(() => STEPS.value[at.value])
const last = computed(() => at.value === STEPS.value.length - 1)

const targetOk = computed(() => Number(target.value) > 0)
const goalConflict = computed(() =>
  Number(goal.value) > 0 && targetOk.value && Number(goal.value) < Number(target.value))
const earnedHigh = computed(() =>
  targetOk.value && earned.value !== null && Number(earned.value) > Number(target.value) * 3)

// Дальше пускает только то, без чего расчёт неверен: план и непротиворечивая цель.
const canNext = computed(() => {
  if (step.value === 'plan') return targetOk.value
  if (step.value === 'goal') return !goalConflict.value
  return true
})

function next() {
  if (!canNext.value) return
  if (last.value) { submit(); return }
  at.value += 1
}

function back() {
  if (at.value > 0) at.value -= 1
}

function skipGoal() {
  goal.value = null
  submit()
}

function submit() {
  if (!targetOk.value || goalConflict.value) return
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

const FIELD = `min-h-[52px] w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3
               text-[1.0625rem] text-[var(--text)] outline-none
               placeholder:text-[var(--placeholder)] focus:border-[var(--text-secondary)]`
</script>

<template>
  <div class="flex min-h-[calc(100dvh-4rem)] w-full flex-col">
    <header class="flex items-center gap-2 pt-2">
      <button
        type="button"
        class="-ml-2 flex h-11 w-11 items-center justify-center"
        :class="at === 0 ? 'invisible' : ''"
        aria-label="Назад"
        @click="back"
      >
        <ChevronLeft class="h-6 w-6 text-[var(--text-secondary)]" aria-hidden="true" />
      </button>

      <!-- Полоса шагов: сколько пройдено и сколько осталось, без слов -->
      <div class="flex flex-1 gap-1.5">
        <i
          v-for="(s, i) in STEPS" :key="s"
          class="h-1 flex-1 rounded-full"
          :style="{ background: i <= at ? 'var(--text)' : 'var(--line)' }"
        />
      </div>
    </header>

    <h1 class="mt-8 font-brand text-[1.75rem] font-bold leading-tight tracking-tight text-[var(--text)]">
      Подключить бизнес
    </h1>

    <form class="mt-8 flex flex-1 flex-col" @submit.prevent="next">
      <div class="flex flex-col gap-5">
        <!-- 1. Чей это месяц -->
        <template v-if="step === 'who'">
          <label class="block">
            <span class="block text-[0.8125rem] font-medium text-[var(--text-secondary)]">Компания</span>
            <input v-model="company" :class="FIELD" class="mt-2" type="text" autocomplete="off">
          </label>
          <label class="block">
            <span class="block text-[0.8125rem] font-medium text-[var(--text-secondary)]">Бизнес-юнит</span>
            <input v-model="unit" :class="FIELD" class="mt-2" type="text" autocomplete="off">
          </label>
        </template>

        <!-- 2. План — единственное обязательное число -->
        <template v-else-if="step === 'plan'">
          <MoneyField
            id="mini-target"
            v-model="target"
            :label="`План на ${monthLabel(month)}`"
            placeholder="3 000 000"
          />
        </template>

        <!-- 3. Прошлое одной суммой: месяц не обязан начинаться первого числа -->
        <template v-else-if="step === 'earned'">
          <MoneyField
            id="mini-earned"
            v-model="earned"
            label="Заработано с начала месяца"
            placeholder="1 250 000"
          />
          <label class="block">
            <span class="block text-[0.8125rem] font-medium text-[var(--text-secondary)]">
              По какой день включительно
            </span>
            <input
              v-model="earnedUpTo"
              :class="FIELD"
              class="mt-2 tabular-nums"
              type="date"
              :min="firstOfMonth"
              :max="dayBefore"
            >
          </label>
          <p v-if="earnedHigh" class="text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
            Больше трёх планов — проверьте разряды.
          </p>
        </template>

        <!-- 4. Цель — пропускается кнопкой, не подписью в поле -->
        <template v-else>
          <MoneyField
            id="mini-goal"
            v-model="goal"
            label="Цель на месяц"
            placeholder="3 500 000"
          />
          <p v-if="goalConflict" class="text-[0.8125rem] leading-snug text-[var(--negative)]">
            Цель ниже плана {{ formatRub(target) }}.
          </p>
        </template>
      </div>

      <div class="mt-auto flex flex-col gap-3 pb-6 pt-10">
        <button
          type="submit"
          class="min-h-[52px] w-full rounded-xl text-[1.0625rem] font-semibold
                 transition-opacity disabled:opacity-40"
          :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
          :disabled="!canNext"
        >{{ last ? 'Показать прогноз' : 'Далее' }}</button>

        <button
          v-if="step === 'goal'"
          type="button"
          class="min-h-[44px] text-[0.9375rem] font-medium text-[var(--text-secondary)]"
          @click="skipGoal"
        >Пропустить</button>
      </div>
    </form>
  </div>
</template>
