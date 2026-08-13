<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import DailyHero from '../components/daily/DailyHero.vue'
import DailyKpis from '../components/daily/DailyKpis.vue'
import DailyWeeks from '../components/daily/DailyWeeks.vue'
import DailySummary from '../components/daily/DailySummary.vue'
import DailyJournal from '../components/daily/DailyJournal.vue'
import DailyCoef from '../components/daily/DailyCoef.vue'
import WeekShapeCard from '../components/WeekShapeCard.vue'
import AddReportForm from '../components/AddReportForm.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { useNavCaption } from '../composables/useNavCaption.js'
import { todayISO } from '../composables/miniModel.js'
import { stampISO } from '../i18n/format.js'
import { L } from '../i18n/daily.js'

// «Контроль Дня» — композиция секций в том же порядке, что в рабочем Ранскейле:
// шапка → плитки → недели → сводка → журнал → коэффициенты.
//
// Порядок повторяет вопрос владельца: куда приземлимся → чем это набрано →
// как шли недели → каким был прогноз вчера → на чём вообще стоит разнос
// по дням. Человек может остановиться на любом блоке и уйти с ответом.

const store = useMiniStore()
const m = store.model
const state = store.state
const { setCaption, clearCaption } = useNavCaption()

const sheet = ref(false)
const tune = ref(false)
const pickedDate = ref('')

// Дата среза — последний закрытый день, а не сегодняшнее число: приложение
// знает ровно то, что внесено, и подпись сегодняшним числом означала бы,
// что данные свежие, когда последний отчёт трёхдневной давности.
const asOf = computed(() => {
  const mm = m.value
  if (!mm) return todayISO()
  const closed = mm.days.filter((d) => d.closed)
  return closed.length ? closed[closed.length - 1].iso : `${mm.month}-01`
})

onMounted(() => setCaption(`данные от ${stampISO(asOf.value)}`))
onUnmounted(() => clearCaption())

function openSheet(iso = '') {
  pickedDate.value = iso
  sheet.value = true
}
</script>

<template>
  <div v-if="m" class="px-4 pb-28">
    <div class="flex flex-col gap-3">
      <DailyHero :m="m" />
      <DailyKpis :m="m" />
      <DailyWeeks :m="m" @pick="openSheet" />
      <DailySummary :m="m" />
      <DailyJournal :m="m" />
      <DailyCoef :m="m" @tune="tune = true" />
    </div>

    <p class="mt-4 px-1 text-[0.75rem] leading-snug text-[var(--text-muted)]">
      Все числа посчитаны на том, что внесли вы. Ничего не отправляется в сеть.
    </p>

    <!-- Кнопка ввода — внизу по центру и липкая. Действие живёт там же, где
         виден его результат: внести день и тут же увидеть, как сдвинулся
         прогноз, — это и есть петля, ради которой экран существует.
         Круглая кнопка дублирует ту же команду для большого пальца. -->
    <div class="mt-6">
      <button
        type="button"
        class="min-h-[52px] w-full rounded-2xl text-[1.0625rem] font-bold"
        :style="{ background: 'var(--accent)', color: 'var(--accent-ink)' }"
        @click="openSheet('')"
      >{{ L.add_report }}</button>
    </div>

    <div class="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-20 flex justify-center">
      <button
        type="button"
        class="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full"
        :style="{ background: 'var(--accent)', boxShadow: '0 6px 20px rgba(0,0,0,0.18)' }"
        :aria-label="L.add_report"
        @click="openSheet('')"
      >
        <Plus class="h-7 w-7" :style="{ color: 'var(--accent-ink)' }" :stroke-width="2.5" aria-hidden="true" />
      </button>
    </div>

    <!-- Шторка ввода -->
    <Teleport to="body">
      <div
        v-if="sheet || tune"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-[var(--scrim)] backdrop-blur-sm"
        role="presentation"
        @click.self="sheet = false; tune = false"
      >
        <div
          class="max-h-[88svh] w-full max-w-[430px] overflow-y-auto rounded-t-2xl bg-[var(--bg)] p-4
                 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div class="mb-3 flex justify-end">
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-2)]"
              aria-label="Закрыть"
              @click="sheet = false; tune = false"
            >
              <X class="h-5 w-5 text-[var(--text-secondary)]" :stroke-width="2" aria-hidden="true" />
            </button>
          </div>
          <AddReportForm v-if="sheet" :preset="pickedDate" />
          <WeekShapeCard v-else />
        </div>
      </div>
    </Teleport>
  </div>
</template>
