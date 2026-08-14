<script setup>
import { computed, ref, watch } from 'vue'
import { Gauge, Target, Info } from 'lucide-vue-next'
import MonthProgressCard from '../components/home/MonthProgressCard.vue'
import HomeWidget from '../components/home/HomeWidget.vue'
import InstallBanner from '../components/InstallBanner.vue'
import TryWeekCard from '../components/TryWeekCard.vue'
import SiteFooter from '../components/SiteFooter.vue'
import NextMonthSheet from '../components/NextMonthSheet.vue'
import ShareSheet from '../components/ShareSheet.vue'
import BottomSheet from '../components/BottomSheet.vue'
import StoryOnboarding from '../components/StoryOnboarding.vue'
import { useMiniStore, currentMonth } from '../composables/useMiniStore.js'
import { mlnRub, mlnSigned, pct1, pctDelta, monthCap } from '../i18n/home.js'
import { widgetStory } from '../i18n/stories.js'

// Главная — дека виджетов. Устройство взято у рабочего Ранскейла:
// дека месяца в рублях и днях, два виджета в отношениях, вход внутрь по тапу.
//
// Виджеты не дублируют друг друга намеренно: слева процент исполнения
// (где вы сейчас), справа прогноз рублями с целью (куда придёте). Одно
// и то же число в двух видах на одном экране читалось бы как два разных —
// ровно на этом погорела прежняя пара «План/Факт» и «Прогноз/План».
//
// Счётчиков системы здесь нет: они живут на вкладке «Подписка», где им есть
// что объяснить. На экране собственных цифр владельца чужая статистика —
// второе сообщение, которое спорит с первым.

const emit = defineEmits(['go'])

const store = useMiniStore()
const m = store.model
const monthOver = store.monthOver

const storyOpen = ref(false)
const nextOpen = ref(false)
const nextMonth = computed(() => currentMonth())

const slides = computed(() => (m.value ? [{
  key: 'unit',
  title: store.state.unit || store.state.company || 'Ваш бизнес',
  fact: m.value.realizedRev,
  plan: m.value.T,
  forecast: m.value.landing,
  goal: m.value.goal,
}] : []))

// Тренд виджета — направление последнего сдвига прогноза по журналу.
// Пока журнала нет, стрелки нет: рисовать «ровно» там, где сравнивать не с чем,
// значит утверждать, что ничего не менялось.
const fcTrend = computed(() => {
  const j = m.value ? m.value.journal : []
  if (!j || j.length < 2) return null
  return j[j.length - 1].arrow
})

const gapValue = computed(() => (m.value ? mlnSigned(m.value.T - m.value.landing) : '—'))

// Живые интерпретации для сторис о виджетах: расшифровка на своих числах,
// а не на выдуманном примере. Перенесено из оригинала; раскрывашка с экрана
// уехала в сторис, числа остались живыми.
const planFactInfo = computed(() => {
  const v = m.value ? m.value.onPlan : null
  if (v == null) return ''
  if (v > 1.001) return `Сейчас ${pct1(v)} — опережаем план на сегодня.`
  if (v < 0.999) return `Сейчас ${pct1(v)} — отстаём от плана на сегодня.`
  return `Сейчас ${pct1(v)} — идём ровно по плану.`
})
const paceInfo = computed(() => {
  const d = m.value ? m.value.landDev : null
  if (d == null) return ''
  if (d < -0.001) return `Сейчас ${pctDelta(d)} — по прогнозу придём ниже плана.`
  if (d > 0.001) return `Сейчас ${pctDelta(d)} — по прогнозу придём выше плана.`
  return `Сейчас ${pctDelta(d)} — по прогнозу выйдем ровно к плану.`
})

// Предложение поделиться месяцем приходит в двух точках, и обе — момент,
// когда человеку впервые есть что показать: первая прожитая и полностью
// внесённая неделя и закрытый месяц. Показывается по одному разу на повод.
//
// «Полная неделя» здесь означает не `w.complete`: в ядре у будущей недели
// нет прошедших невнесённых дней, поэтому она полна по определению — и сразу
// после подключения человеку предлагали бы поделиться пустым месяцем.
// Повод настоящий, когда неделя прожита целиком и все её дни внесены.
const shareReason = computed(() => {
  if (!m.value) return ''
  const seen = store.state.shareSeen || []
  if (monthOver.value && !seen.includes('month')) return 'month'
  const livedFull = m.value.weeks.some((w) => w.days.length === 7
    && w.days.every((d) => d.entered || d.inCarry))
  if (livedFull && !seen.includes('week')) return 'week'
  return ''
})
// Шторка показывается не чаще одного раза за запуск: закрыл повод —
// следующий приходит в следующий раз, а не подменяет текст под пальцем.
const shareShown = ref(false)
const shareOpen = ref(false)
// Причина замораживается на момент открытия: `shareReason` пересчитается
// сразу после отметки, и живая привязка сменила бы заголовок при закрытии.
const shareShownReason = ref('')
watch(shareReason, (r) => {
  if (r && !shareShown.value) {
    shareShownReason.value = r
    shareShown.value = true
    shareOpen.value = true
  }
}, { immediate: true })

function closeShare() {
  if (shareShownReason.value) store.markShareSeen(shareShownReason.value)
  shareOpen.value = false
}

// Слайды сторис собираются на текущих числах в момент открытия.
const storySlides = computed(() => widgetStory({
  planFact: m.value && m.value.onPlan != null ? pct1(m.value.onPlan) : '',
  planFactLine: planFactInfo.value,
  pace: m.value ? mlnRub(m.value.landing) : '',
  paceLine: paceInfo.value,
}))

// Финал сторис ведёт на «Буткемп»: уровень посчитан там.
function storyDone() {
  storyOpen.value = false
  emit('go', 'power')
}

</script>

<template>
  <div v-if="m" class="px-4 pb-8">
    <!-- Календарь ушёл вперёд: делать вид, что месяц идёт, приложение не станет.
         Рядом с сообщением стоит и выход из него — перенос на новый месяц. -->
    <div
      v-if="monthOver"
      class="mb-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3"
    >
      <p class="text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
        {{ monthCap(m.month) }} закончился. Числа ниже — итог того месяца.
      </p>
      <button
        type="button"
        class="mt-3 min-h-[44px] w-full rounded-xl text-[0.9375rem] font-semibold"
        :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
        @click="nextOpen = true"
      >Начать {{ monthCap(nextMonth) }}</button>
    </div>

    <MonthProgressCard class="mb-3" :slides="slides" :month="m.month" :days-left="m.daysLeft" />

    <div class="flex gap-3">
      <HomeWidget
        class="flex-1"
        :icon="Gauge"
        name="Контроль&#10;Дня"
        metric-label="План/Факт"
        :value-main="m.onPlan == null ? '—' : pct1(m.onPlan)"
        sub-label="Разрыв"
        :sub-value="gapValue"
        @select="emit('go', 'day')"
      />
      <!-- Прогноз стоит рублями, а не отношением к плану: «Прогноз/План»
           был тем же числом, что «План/Факт» слева, — тождество держится,
           пока план не правился внутри месяца, и половина экрана показывала
           одну величину в двух костюмах. Рубли прогноза из процента слева
           не выводятся; рядом цель — второе число, которого слева нет. -->
      <HomeWidget
        class="flex-1"
        :icon="Target"
        name="Цели и планы"
        metric-label="Прогноз"
        :value-main="mlnRub(m.landing)"
        :trend="fcTrend"
        sub-label="Цель"
        :sub-value="m.goal ? mlnRub(m.goal) : '—'"
        @select="emit('go', 'goals')"
      />
    </div>

    <!-- Как читать виджеты: сторис по запросу, на своих числах.
         Абзац с экрана ушёл — формат объяснения теперь свой. -->
    <button
      type="button"
      class="mx-auto mt-2.5 flex min-h-[44px] items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8125rem] font-medium text-[var(--text-muted)] transition-colors active:bg-[var(--surface-2)]"
      @click="storyOpen = true"
    >
      <Info class="h-4 w-4" :stroke-width="2" aria-hidden="true" />
      <span>Как читать виджеты</span>
    </button>

    <InstallBanner />

    <div class="mt-4">
      <TryWeekCard />
    </div>

    <SiteFooter />

    <!-- Перенос месяца: шторка общего вида -->
    <BottomSheet :open="nextOpen" @close="nextOpen = false">
      <NextMonthSheet @close="nextOpen = false" />
    </BottomSheet>

    <!-- Предложение поделиться: приходит в момент ценности, по разу на повод. -->
    <BottomSheet :open="shareOpen" @close="closeShare">
      <ShareSheet :reason="shareShownReason" @close="closeShare" />
    </BottomSheet>

    <StoryOnboarding
      :open="storyOpen"
      :slides="storySlides"
      @close="storyOpen = false"
      @done="storyDone"
    />
  </div>
</template>
