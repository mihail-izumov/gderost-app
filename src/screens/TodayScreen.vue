<script setup>
import { computed, ref } from 'vue'
import MonthWidget from '../components/MonthWidget.vue'
import UnitSwitch from '../components/UnitSwitch.vue'
import StatusChip from '../components/StatusChip.vue'
import WeekShapeCard from '../components/WeekShapeCard.vue'
import WeekList from '../components/WeekList.vue'
import AddReportForm from '../components/AddReportForm.vue'
import CountersCard from '../components/CountersCard.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { shapeStatus } from '../data/weekShape.js'
import { formatRub, monthLabel, daysWord, dayLabel } from '../i18n/format.js'
import { BRAND } from '../i18n/brand.js'

// «Сегодня» отвечает на один вопрос владельца: сколько надо сделать сегодня,
// чтобы месяц пришёл к плану. Всё остальное на экране объясняет, откуда
// это число взялось.

const emit = defineEmits(['go'])

const store = useMiniStore()
const m = store.model
const monthOver = store.monthOver
const state = store.state

const askReset = ref(false)
// Дата, выбранная в таблице дней: тап по «внести» ведёт прямо в форму.
const pickedDate = ref('')

const todayNeed = computed(() => (m.value ? m.value.todayNeed : null))
const hasDayFacts = computed(() => !!m.value && m.value.enteredCount > 0)

// Требование на день целиком стоит на форме недели. Пока она допущение,
// число рядом обязано носить ту же подпись — иначе допущение выдаётся за знание.
const shape = computed(() => shapeStatus(state.coef_src, state.days.length, state.shape_id))

function reset() {
  store.reset()
  askReset.value = false
}

// Тап по пропущенному дню в таблице переносит человека к форме с этой датой:
// иначе он ищет её в календаре сам, зная ответ.
function onPick(iso) {
  pickedDate.value = iso
  const el = typeof document !== 'undefined' ? document.getElementById('mini-add-report') : null
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div v-if="m" class="w-full pb-10">
    <header class="pt-2">
      <h1 class="font-brand text-[1.75rem] font-bold leading-tight tracking-tight text-[var(--text)]">
        Сегодня
      </h1>
      <p class="mt-1 text-[0.8125rem] text-[var(--text-muted)]">
        {{ monthLabel(m.month) }} · {{ BRAND.header }}
      </p>
    </header>

    <div class="mt-4">
      <UnitSwitch :company="state.company" :unit="state.unit" />
    </div>

    <!-- Календарь ушёл вперёд: делать вид, что месяц идёт, приложение не станет -->
    <p
      v-if="monthOver"
      class="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3
             text-[0.8125rem] leading-snug text-[var(--text-secondary)]"
    >
      {{ monthLabel(m.month) }} закончился. Числа ниже — итог того месяца, а не
      сегодняшнего дня. Новый месяц заводится вводом нового плана.
    </p>

    <!-- Число дня: требование к сегодняшнему дню с учётом силы дня недели -->
    <section
      v-if="!monthOver"
      class="mt-4 rounded-2xl p-4"
      :style="{ background: 'var(--text)', color: 'var(--ink-on-color)' }"
    >
      <div class="text-[0.75rem] uppercase tracking-wide" :style="{ opacity: 0.7 }">
        Сегодня нужно сделать
      </div>
      <div class="mt-1 font-brand text-[2rem] font-bold leading-none tracking-tight">
        {{ todayNeed === null ? 'день уже закрыт' : formatRub(todayNeed) }}
      </div>
      <p class="mt-2 text-[0.8125rem] leading-snug" :style="{ opacity: 0.75 }">
        <template v-if="todayNeed !== null">
          Столько выпадает на сегодня, если разнести остаток плана по оставшимся дням
          с поправкой на силу дня недели. Внесёте вчерашний день — число пересчитается.
        </template>
        <template v-else>
          Выручка за сегодня уже внесена. Следующее требование появится завтра.
        </template>
      </p>
      <p
        v-if="todayNeed !== null"
        class="mt-3 border-t pt-2 text-[0.75rem] leading-snug"
        :style="{ borderColor: 'var(--text-muted)', opacity: 0.7 }"
      >
        Форма недели — {{ shape.label }}: {{ shape.note }}.
      </p>
    </section>

    <div class="mt-4">
      <MonthWidget :m="m" />
    </div>

    <div id="mini-add-report" class="mt-4">
      <AddReportForm :preset="pickedDate" />
    </div>

    <div class="mt-4">
      <WeekList :m="m" @pick="onPick" />
    </div>

    <div class="mt-4">
      <WeekShapeCard />
    </div>

    <!-- Как приложение узнало про прошлое: суммой или по дням -->
    <section
      v-if="m.carry"
      class="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4"
    >
      <div class="flex items-center gap-2">
        <h2 class="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
          Начало месяца
        </h2>
        <StatusChip kind="said" />
      </div>
      <p class="mt-2 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
        {{ formatRub(m.carry.amount) }} вошли одной суммой по {{ dayLabel(m.carry.upTo) }} —
        это {{ m.carryDays }} {{ daysWord(m.carryDays) }} без дневной выручки.
        Оценку таким дням приложение не ставит и задним числом не поставит:
        оценивать нечего.
      </p>
      <p v-if="!hasDayFacts" class="mt-2 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
        Пока внесена только эта сумма, лучший день неизвестен — поэтому приложение
        не берётся судить, посильный ли нужный темп.
      </p>
    </section>

    <!-- Счётчики работающей системы: здесь у них есть куда вести -->
    <div class="mt-6">
      <CountersCard clickable @open="emit('go', 'runscale')" />
    </div>

    <!-- Выход не заперт: инструмент возвращаемый -->
    <footer class="mt-8 border-t border-[var(--line)] pt-4">
      <p class="text-[0.75rem] leading-snug text-[var(--text-muted)]">
        Данные лежат на этом устройстве. Никуда не отправляются, аккаунта нет.
      </p>
      <button
        v-if="!askReset"
        class="mt-2 min-h-[44px] text-[0.8125rem] font-medium text-[var(--text-secondary)] underline"
        type="button"
        @click="askReset = true"
      >Удалить всё и начать заново</button>
      <div v-else class="mt-2 flex flex-wrap items-center gap-3">
        <span class="text-[0.8125rem] text-[var(--text-secondary)]">Удалить введённое без возврата?</span>
        <button
          class="min-h-[44px] rounded-lg px-3 text-[0.8125rem] font-semibold"
          :style="{ background: 'var(--negative)', color: 'var(--ink-on-color)' }"
          type="button" @click="reset"
        >Удалить</button>
        <button
          class="min-h-[44px] text-[0.8125rem] font-medium text-[var(--text-secondary)] underline"
          type="button" @click="askReset = false"
        >Оставить</button>
      </div>
    </footer>
  </div>
</template>
