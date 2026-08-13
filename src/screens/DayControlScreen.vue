<script setup>
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import DailyHero from '../components/daily/DailyHero.vue'
import DailyKpis from '../components/daily/DailyKpis.vue'
import DailyWeeks from '../components/daily/DailyWeeks.vue'
import DailySummary from '../components/daily/DailySummary.vue'
import DailyJournal from '../components/daily/DailyJournal.vue'
import DailyCoef from '../components/daily/DailyCoef.vue'
import WeekShapeSheet from '../components/WeekShapeSheet.vue'
import AddReportForm from '../components/AddReportForm.vue'
import SiteFooter from '../components/SiteFooter.vue'
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

// Наблюдение за нижней кнопкой: видна — плавающая не нужна.
const bottomCta = ref(null)
const bottomCtaVisible = ref(false)
let io = null
watch(bottomCta, (el) => {
  if (io) { io.disconnect(); io = null }
  bottomCtaVisible.value = false
  if (!el || typeof IntersectionObserver === 'undefined') return
  io = new IntersectionObserver(([e]) => { bottomCtaVisible.value = !!(e && e.isIntersecting) })
  io.observe(el)
}, { flush: 'post' })
onBeforeUnmount(() => { if (io) { io.disconnect(); io = null } })
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

    <!-- Вход в ввод отчёта. Перенесено из оригинала: светлая кнопка во всю
         ширину с жёлтым кружком-иконкой слева, а не сплошная жёлтая плашка. -->
    <button
      ref="bottomCta"
      type="button"
      class="mt-1 flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-[var(--surface)] shadow-sm transition-opacity active:opacity-90"
      @click="openSheet('')"
    >
      <span class="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)]">
        <Plus class="h-[18px] w-[18px] text-[var(--accent-ink)]" :stroke-width="2.5" aria-hidden="true" />
      </span>
      <span class="text-[1rem] font-semibold text-[var(--text)]">{{ L.add_report }}</span>
    </button>

    <!-- Плавающая кнопка гаснет, когда до нижней уже долистали: две кнопки
         об одном на одном экране — шум, а не подстраховка. Наблюдение через
         IntersectionObserver, а не слушатель скролла: тот будит отрисовку
         на каждый кадр прокрутки, и на длинной странице это видно на телефоне. -->
    <div
      class="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[430px] justify-center px-4"
      style="padding-bottom: calc(env(safe-area-inset-bottom) + 4.75rem)"
      aria-hidden="true"
    >
      <button
        v-show="!bottomCtaVisible"
        type="button"
        class="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] shadow-lg transition-opacity duration-150 active:opacity-90"
        :aria-label="L.add_report"
        @click="openSheet('')"
      >
        <Plus class="h-7 w-7 text-[var(--accent-ink)]" :stroke-width="2.75" aria-hidden="true" />
      </button>
    </div>

    <SiteFooter />

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
          <template v-if="sheet">
            <div class="mb-3 flex justify-end">
              <button
                type="button"
                class="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-2)]"
                aria-label="Закрыть"
                @click="sheet = false"
              >
                <X class="h-5 w-5 text-[var(--text-secondary)]" :stroke-width="2" aria-hidden="true" />
              </button>
            </div>
            <AddReportForm :preset="pickedDate" />
          </template>
          <!-- Свой крестик у настройки формы: у неё есть заголовок, и вторая
               кнопка закрытия над ним читалась бы как закрытие чего-то ещё. -->
          <WeekShapeSheet v-else @close="tune = false" />
        </div>
      </div>
    </Teleport>
  </div>
</template>
