<script setup>
import { ref, computed } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'
import MoneyField from '../components/MoneyField.vue'
import { useMiniStore, currentMonth } from '../composables/useMiniStore.js'
import { todayISO } from '../composables/miniModel.js'
import { monthLabel, formatRub } from '../i18n/format.js'

// Подключение бизнеса. Первый шаг — выбор пути, дальше поля по одному экрану.
//
// Короткий путь основной: два числа — название и план, — и человек сразу
// в живом приложении. Остальное приложение просит там, где без этого не может
// посчитать следующее: пустая карточка говорит одно действие. Просить четыре
// ответа до первой пользы значит просить доверия, которого ещё нет.
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

// Путь выбирается первым экраном и меняет только длину анкеты: короткий
// доводит до чисел за два шага, полный спрашивает всё сразу.
const mode = ref('')

const STEPS = computed(() => {
  if (!mode.value) return ['choice']
  if (mode.value === 'short') return ['choice', 'who', 'plan']
  return monthJustStarted.value
    ? ['choice', 'who', 'plan', 'goal']
    : ['choice', 'who', 'plan', 'earned', 'goal']
})

const at = ref(0)
const step = computed(() => STEPS.value[at.value])
const last = computed(() => at.value === STEPS.value.length - 1)

function choose(m) {
  mode.value = m
  at.value = 1
}

// Кто это — обязательный шаг. Без имени компании и юнита все дальнейшие
// экраны говорят «Ваш бизнес», ссылка на месяц приходит без адресата,
// а выгрузка получает имя файла без имени. Пропускать его нельзя.
function looksLikeNumber(v) {
  const t = String(v).trim()
  return t.length > 0 && /^[\d\s.,\-+]+$/.test(t)
}

// Что не так с именем. Пустое — просто не пускаем кнопкой; число вместо
// названия — говорим прямо, иначе человек второй раз введёт то же самое.
const whoError = computed(() => {
  if (looksLikeNumber(company.value)) return 'Название компании — слово, а не число. Например: «Кофейня на углу».'
  if (looksLikeNumber(unit.value)) return 'Бизнес-юнит — слово, а не число. Например: «Кухня» или «Доставка».'
  if (company.value.trim().length === 1 || unit.value.trim().length === 1) return 'Одна буква — вряд ли название. Напишите так, как говорите сами.'
  return ''
})
const whoOk = computed(() => company.value.trim().length > 1
  && unit.value.trim().length > 1 && !whoError.value)

// Границы плана. Верхняя и нижняя названы числами: «неверное значение»
// не говорит человеку, что делать, а «меньше десяти тысяч» — говорит.
const MIN_PLAN = 10_000
const MAX_PLAN = 10_000_000_000
const targetError = computed(() => {
  const v = Number(target.value)
  if (target.value === null) return ''
  if (v < MIN_PLAN) return `План меньше ${formatRub(MIN_PLAN)} — проверьте разряды: обычно теряется три нуля.`
  if (v > MAX_PLAN) return `План больше ${formatRub(MAX_PLAN)} — проверьте разряды: обычно лишние три нуля.`
  return ''
})
const targetOk = computed(() => Number(target.value) > 0)
const GOAL_MAX_RATIO = 1.5
const goalConflict = computed(() =>
  Number(goal.value) > 0 && targetOk.value
  && (Number(goal.value) < Number(target.value)
    || Number(goal.value) > Number(target.value) * GOAL_MAX_RATIO))
// Разные причины — разные слова: ниже плана это второй план, выше плана
// в полтора раза это не цель, а другой план, и чинится он планом.
const goalMessage = computed(() => {
  const g = Number(goal.value)
  if (!(g > 0) || !targetOk.value) return ''
  const t = Number(target.value)
  if (g < t) return `Цель ниже плана ${formatRub(t)}.`
  if (g > t * GOAL_MAX_RATIO) {
    return `Цель выше плана больше чем в полтора раза (${formatRub(t)} → ${formatRub(g)}). Столько не берут за месяц — пересчитайте план.`
  }
  return ''
})
const earnedHigh = computed(() =>
  targetOk.value && earned.value !== null && Number(earned.value) > Number(target.value) * 3)

// Дальше пускает только то, без чего расчёт неверен: план и непротиворечивая цель.
// План обязателен на обоих путях: без обязательства месяца считать нечего —
// ни прогноза к чему, ни «сколько надо сегодня» из чего.
const canNext = computed(() => {
  if (step.value === 'choice') return false
  if (step.value === 'who') return whoOk.value
  if (step.value === 'plan') return targetOk.value && !targetError.value
  if (step.value === 'goal') return !goalConflict.value
  return true
})

// Подсказка внизу шага: зачем спрашиваем, что подойдёт и что делать, если
// точного ответа нет. Это не абзац-объяснение на экране — это условие поля,
// без которого человек застревает и выдумывает ответ.
const HINT = {
  choice: 'Короткий путь — два вопроса, и вы сразу видите свои цифры. Остальное спросим позже, когда понадобится.',
  who: 'Имя нужно, чтобы отличать бизнесы и подписывать файл выгрузки. Юнит — точка или направление, по которому вы считаете выручку. Если у вас несколько ресторанов, то напишите название одного из них.',
  plan: 'План — обязательство месяца, а не мечта. Не помните точно — возьмите прошлый месяц, поправить можно в любой день.',
  earned: 'Сумма за все дни с начала месяца одним числом. Точной нет — назовите близкую: приложение разложит её по дням и подпишет допущением.',
  goal: 'Цель — то, ради чего стараются сверх плана. Её можно не ставить, шкала построится до плана.',
}
const hint = computed(() => HINT[step.value] || '')

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
  const withPast = mode.value === 'full' && !monthJustStarted.value
  store.setup({
    company: company.value,
    unit: unit.value,
    target: target.value,
    goal: mode.value === 'full' ? goal.value : null,
    earned: withPast ? earned.value : null,
    earnedUpTo: withPast ? earnedUpTo.value : null,
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

      <!-- Шаг назван словами, а не полосой: полоска из четырёх насечек
           не сообщает, сколько ещё спросят, и на первом экране, где шаг один,
           читалась поломкой. -->
      <p v-if="at > 0" class="flex-1 text-[0.8125rem] font-medium text-[var(--text-muted)]">
        Шаг {{ at }} из {{ STEPS.length - 1 }}
      </p>
      <div v-else class="flex-1" aria-hidden="true"></div>
    </header>

    <!-- Системным начертанием, а не брендовым: это служебный шаг анкеты,
         а не голос продукта. Брендовое здесь выделяло анкету сильнее, чем
         имя на витрине. -->
    <h1 class="mt-8 text-[1.75rem] font-bold leading-tight tracking-tight text-[var(--text)]">
      {{ step === 'choice' ? 'С чего начнём' : 'Подключить бизнес' }}
    </h1>

    <form class="mt-8 flex flex-1 flex-col" @submit.prevent="next">
      <div class="flex flex-col gap-5">
        <!-- 0. Путь. Короткий стоит первым и выглядит как основной: он
             доводит до живых чисел за два шага, остальное приложение
             попросит там, где без этого не посчитает. -->
        <template v-if="step === 'choice'">
          <button
            type="button"
            class="w-full rounded-2xl px-4 py-4 text-left"
            :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
            @click="choose('short')"
          >
            <span class="block text-[1.0625rem] font-bold leading-tight">Компания и план на месяц</span>
            <span class="mt-1 block text-[0.875rem] leading-snug opacity-80">
              Остальное — потом, по ходу дела
            </span>
          </button>
          <button
            type="button"
            class="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-left"
            @click="choose('full')"
          >
            <span class="block text-[1.0625rem] font-bold leading-tight text-[var(--text)]">Заполнить всё сразу</span>
            <span class="mt-1 block text-[0.875rem] leading-snug text-[var(--text-secondary)]">
              Ещё заработанное с начала месяца и цель
            </span>
          </button>
        </template>

        <!-- 1. Чей это месяц -->
        <template v-else-if="step === 'who'">
          <label class="block">
            <span class="block text-[0.8125rem] font-medium text-[var(--text-secondary)]">Компания</span>
            <input v-model="company" :class="FIELD" class="mt-2" type="text" autocomplete="off">
          </label>
          <label class="block">
            <span class="block text-[0.8125rem] font-medium text-[var(--text-secondary)]">Бизнес-юнит</span>
            <input v-model="unit" :class="FIELD" class="mt-2" type="text" autocomplete="off">
          </label>
          <p v-if="whoError" class="text-[0.8125rem] leading-snug text-[var(--negative)]">{{ whoError }}</p>
        </template>

        <!-- 2. План — единственное обязательное число -->
        <template v-else-if="step === 'plan'">
          <MoneyField
            id="mini-target"
            v-model="target"
            :label="`План на ${monthLabel(month)}`"
            placeholder="3 000 000"
          />
          <p v-if="targetError" class="text-[0.8125rem] leading-snug text-[var(--negative)]">{{ targetError }}</p>
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
          <p v-if="goalMessage" class="text-[0.8125rem] leading-snug text-[var(--negative)]">
            {{ goalMessage }}
          </p>
        </template>
      </div>

      <!-- Подсказка шага: зачем это спрашивают и что делать, если точного
           ответа нет. Стоит внизу, под полями, и не спорит с ними за внимание. -->
      <p v-if="hint" class="mt-6 text-[0.8125rem] leading-snug text-[var(--text-muted)]">{{ hint }}</p>

      <div class="mt-auto flex flex-col gap-3 pb-6 pt-10">
        <button
          v-if="step !== 'choice'"
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
