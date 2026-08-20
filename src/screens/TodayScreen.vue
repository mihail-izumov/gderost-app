<script setup>
import { computed, ref, watch } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import DayControlIcon from '../components/icons/DayControlIcon.vue'
import PlansIcon from '../components/icons/PlansIcon.vue'
import MonthProgressCard from '../components/home/MonthProgressCard.vue'
import HomeWidget from '../components/home/HomeWidget.vue'
import QuestionIcon from '../components/icons/QuestionIcon.vue'
import InstallBanner from '../components/InstallBanner.vue'
import TryWeekCard from '../components/TryWeekCard.vue'
import SiteFooter from '../components/SiteFooter.vue'
import NextMonthSheet from '../components/NextMonthSheet.vue'
import ShareSheet from '../components/ShareSheet.vue'
import BottomSheet from '../components/BottomSheet.vue'
import StoryOnboarding from '../components/StoryOnboarding.vue'
import HonestBadge from '../components/HonestBadge.vue'
import FirstStepsCard from '../components/FirstStepsCard.vue'
import CarrySheet from '../components/CarrySheet.vue'
import { useMiniStore, currentMonth } from '../composables/useMiniStore.js'
import { sigClass } from '../composables/miniModel.js'
import { shareReason as pickShareReason } from '../composables/shareReason.js'
import { honestLoop } from '../composables/honestLoop.js'
import { mlnRub, mlnNum, pct1, pctDelta, monthCap } from '../i18n/home.js'
import { widgetStory, honestStory } from '../i18n/stories.js'

// Главная — дека виджетов. Устройство взято у рабочего Ранскеила:
// дека месяца в рублях и днях, два виджета в отношениях, вход внутрь по тапу.
//
// Виджеты не дублируют друг друга намеренно: слева процент исполнения
// (где вы сейчас), справа прогноз рублями с целью (куда придёте). Одно
// и то же число в двух видах на одном экране читалось бы как два разных —
// ровно на этом погорела прежняя пара «План/Факт» и «Прогноз/План».
//
// Счётчиков системы здесь нет: они живут на вкладке «Ранскеил», где им есть
// что объяснить. На экране собственных цифр владельца чужая статистика —
// второе сообщение, которое спорит с первым.

const emit = defineEmits(['go'])

const store = useMiniStore()
const m = store.model
const monthOver = store.monthOver
const loop = computed(() => honestLoop(store.state, m.value))

const storyOpen = ref(false)
const nextOpen = ref(false)
// Что уже заработано: спрашивается там, где стало нужно, а не на входе.
const carryOpen = ref(false)
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

// Расстояние прогноза до плана. Подпись несёт направление, число — размер:
// «Недобор + ₽0,3 млн» со знаком читалось как «идёте в плюсе», хотя число
// было недостачей. На «Сигналах» та же величина зовётся «Недобор к плану» —
// здесь тот же язык, короче на ширину виджета.
const gapAmt = computed(() => (m.value && m.value.landing != null ? m.value.T - m.value.landing : null))
const gapLabel = computed(() => {
  if (gapAmt.value == null || gapAmt.value === 0) return 'Разрыв'
  return gapAmt.value > 0 ? 'Недобор' : 'Опережение'
})
const gapValue = computed(() => (gapAmt.value == null ? '—' : mlnRub(Math.abs(gapAmt.value))))

// Статус виджетов цветом. «Контроль Дня» — тот же светофор, которым красятся
// дни внутри него: отношение факта к плану на прошедшие дни. «Цели и планы» —
// один вопрос: догоняет ли прогноз план. Считать не из чего — серый, и это
// тоже состояние, а не отсутствие оформления.
const dayTone = computed(() => (m.value && m.value.onPlan != null
  ? sigClass(m.value.onPlan)
  : 'idle'))
const goalsTone = computed(() => {
  if (!m.value || !m.value.T || !m.value.landing) return 'idle'
  return m.value.landing >= m.value.T ? 'good' : 'bad'
})

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

// Предложение поделиться ростом приходит в четырёх точках, и каждая — момент,
// когда человеку впервые есть что сказать: план поставлен, третий день на
// треке, первая прожитая неделя без пропусков, закрытый месяц. Показывается
// по одному разу на повод.
//
// Условия живут чистыми функциями в `composables/shareReason.js` и проверяются
// самопроверкой: правило «только внесённое руками» ломается молча, и однажды
// уже сломалось — шторка прилетала сразу после подключения, в неделю, которая
// ещё даже не началась.
const shareReason = computed(() => (m.value
  ? pickShareReason(m.value, store.state.shareSeen || [])
  : ''))
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

// Сторис на этом экране две: разбор виджетов на своих числах и «Честная
// цифра» с шильда. Открывающий ставит сюжет, дальше механика одна.
const storyKind = ref('widgets')

const widgetSlides = computed(() => widgetStory({
  planFact: m.value && m.value.onPlan != null ? pct1(m.value.onPlan) : '',
  planFactLine: planFactInfo.value,
  pace: m.value ? mlnRub(m.value.landing) : '',
  paceLine: paceInfo.value,
}))
const storySlides = computed(() => (storyKind.value === 'honest' ? honestStory(loop.value) : widgetSlides.value))

function openWidgetStory() {
  storyKind.value = 'widgets'
  storyOpen.value = true
}
function openHonest() {
  storyKind.value = 'honest'
  storyOpen.value = true
}

// Финал ведёт на «Сигналы»: и уровень, и статусы чисел посчитаны там.
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

    <!-- Продолжение объяснения на интерфейсе: короткий вход спросил два
         числа, остальное приложение просит здесь, по одному действию. -->
    <FirstStepsCard class="mb-3" :m="m" @go="emit('go', $event)" @carry="carryOpen = true" />

    <!-- Статус чисел стоит там же, где числа: под декой месяца. Устройство
         объясняет сторис, экран сообщает состояние. -->
    <div class="mb-3">
      <HonestBadge large :loop="loop" @open="openHonest" />
    </div>

    <div class="flex gap-3">
      <HomeWidget
        class="flex-1"
        :icon="DayControlIcon"
        name="Контроль&#10;Дня"
        metric-label="План/Факт"
        :value-main="m.onPlan == null ? '—' : pct1(m.onPlan)"
        :trend="m.onPlanTrend"
        :sub-label="gapLabel"
        :sub-value="gapValue"
        :tone="dayTone"
        @select="emit('go', 'day')"
      />
      <!-- Прогноз стоит рублями, а не отношением к плану: «Прогноз/План»
           был тем же числом, что «План/Факт» слева, — тождество держится,
           пока план не правился внутри месяца, и половина экрана показывала
           одну величину в двух костюмах. Рубли прогноза из процента слева
           не выводятся; рядом цель — второе число, которого слева нет. -->
      <HomeWidget
        class="flex-1"
        :icon="PlansIcon"
        name="Цели и&#10;планы"
        metric-label="Прогноз"
        :value-main="mlnNum(m.landing)"
        value-unit="млн"
        :trend="fcTrend"
        sub-label="Цель"
        :sub-value="m.goal ? mlnRub(m.goal) : '—'"
        :tone="goalsTone"
        @select="emit('go', 'goals')"
      />
    </div>

    <!-- Как читать виджеты — реплика от самих виджетов: облачко с хвостиком,
         направленным в деку. Карточкой этот блок спорил с «Честной цифрой»
         и «Попробовать неделю» — три плашки подряд, и глаз выбирал между ними
         вместо того, чтобы читать. Бабл принадлежит тому, на что указывает,
         и в очередь равных блоков не встаёт. -->
    <!-- Заливка бабла темнее холста и заметно темнее белых карточек вокруг:
         на `--surface` он был белым пятном среди белых плашек и читался
         четвёртой карточкой подряд. Реплика обязана отличаться от того,
         о чём говорит. -->
    <!-- Реплика от виджетов, и она принадлежит им, а не блоку под собой.
         Плашка эту принадлежность не держала: заливка делала из подписи
         четвёртую карточку в очереди равных. Держит расстояние — сверху
         вплотную к деке, снизу вдвое больше, — и подчёркнутое слово,
         которое читается ссылкой на объяснение. -->
    <div class="mb-6 mt-2 flex justify-center">
      <button
        type="button"
        class="flex min-h-[40px] items-center gap-1.5 px-1 text-left"
        @click="openWidgetStory"
      >
        <QuestionIcon class="h-[17px] w-[17px] shrink-0 text-[var(--text)]" />
        <span class="text-[0.8125rem] font-semibold text-[var(--text)] underline underline-offset-4">Как читать виджеты</span>
      </button>
    </div>

    <div>
      <TryWeekCard />
    </div>

    <SiteFooter />

    <!-- Установка стоит последней: она про то, как вернуться сюда завтра,
         и до неё дочитывает тот, кто уже посмотрел свои числа. -->
    <InstallBanner />

    <!-- Перенос месяца: шторка общего вида -->
    <BottomSheet :open="carryOpen" @close="carryOpen = false">
      <CarrySheet @close="carryOpen = false" />
    </BottomSheet>

    <BottomSheet :open="nextOpen" @close="nextOpen = false">
      <NextMonthSheet @close="nextOpen = false" />
    </BottomSheet>

    <!-- Предложение поделиться ростом: приходит в момент ценности, по разу
         на повод, не чаще раза за запуск. -->
    <BottomSheet :open="shareOpen" @close="closeShare">
      <ShareSheet :reason="shareShownReason" :m="m" @close="closeShare" />
    </BottomSheet>

    <StoryOnboarding
      :open="storyOpen"
      :slides="storySlides"
      @close="storyOpen = false"
      @done="storyDone"
    />
  </div>
</template>

