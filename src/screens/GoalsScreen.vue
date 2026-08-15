<script setup>
import { ref, computed } from 'vue'
import { ArrowDown, ChevronRight } from 'lucide-vue-next'
import WeekWidget from '../components/WeekWidget.vue'
import ValueSheet from '../components/ValueSheet.vue'
import BottomSheet from '../components/BottomSheet.vue'
import ModulePassport from '../components/energy/ModulePassport.vue'
import StoryOnboarding from '../components/StoryOnboarding.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { sigClass } from '../composables/miniModel.js'
import { computeEnergy, computeGaps } from '../composables/energyModel.js'
import { formatRub, formatGrowth, formatPct, daysWord } from '../i18n/format.js'
import { monthCap } from '../i18n/home.js'
import { FORECAST_STORY } from '../i18n/stories.js'

// Цели и планы — четыре величины, четыре плашки и расстояния между ними.
//
// Каждая плашка показывает имя и число и открывается тапом. Что это за
// величина, откуда берётся и можно ли её поменять — внутри, там же и правка,
// и только по отдельной кнопке: тап по цифре открывал бы клавиатуру раньше,
// чем человек решил менять.
//
// Плашки светлые: чёрными они спорили с чёрным календарём над ними, и экран
// читался одним пятном. Календарь остаётся единственным тёмным якорем.
//
// Расстояния между величинами переехали сюда с «Буткемпа»: «осталось
// заработать по прогнозу», «прогноз выше плана», «цель выше плана». Место
// правильное — здесь эти числа и правятся. Мощностей `N / 20` при них нет,
// а вход в сессию, которая двигает соседнюю величину, остался: разрыв назван,
// и ответ на него стоит рядом.
//
// Всё, что раньше объяснялось абзацами вокруг полей, разложено по слайдам
// сторис «Как работает прогноз».

const store = useMiniStore()
const m = store.model
const state = store.state

const sheet = ref('')

// Виджет показывает неделю месяца приложения, а не календаря устройства:
// раньше он рисовал текущую календарную неделю с пустыми маркерами над
// числами месяца приложения, и на закрытом месяце шапка говорила про август,
// а числа под ней были июльские. Дни берутся из модели вместе с оценками —
// виджет перестал быть декорацией там, где данные для оценок есть.
const widgetWeek = computed(() => {
  if (!m.value) return null
  const w = m.value.weeks.find((x) => x.isCurrent) || m.value.weeks[m.value.weeks.length - 1]
  if (!w) return null
  return w.days.map((x) => ({
    key: x.iso,
    dow: x.dow,
    dowRu: x.dowRu,
    dd: x.dd,
    isToday: x.isToday,
    mark: x.inCarry ? 'carry' : x.entered ? sigClass(x.fact / x.planAt) : 'idle',
  }))
})

// Все недели месяца — для разворота карточки на весь месяц.
const monthWeeks = computed(() => {
  if (!m.value) return []
  return m.value.weeks.map((w) => w.days.map((x) => ({
    key: x.iso,
    dow: x.dow,
    dowRu: x.dowRu,
    dd: x.dd,
    isToday: x.isToday,
    mark: x.inCarry ? 'carry' : x.entered ? sigClass(x.fact / x.planAt) : 'idle',
  })))
})

// Подпись и остаток — того же месяца, что и числа под виджетом.
const widgetNote = computed(() => (m.value ? `${m.value.daysLeft} ${daysWord(m.value.daysLeft)} ост.` : ''))
const widgetPill = computed(() => (m.value && m.value.days.length
  ? formatPct((m.value.daysLeft / m.value.days.length) * 100, 0)
  : ''))

const rows = computed(() => {
  if (!m.value) return []
  // Пустота у каждой величины своя: цель «не поставлена» — её ставят руками;
  // факт и прогноз без данных — прочерк, слово «не поставлена» рядом с ними
  // врало бы про их природу. Отклонение прогноза на пустом месяце (−100 %)
  // не печатается: это арифметика пустоты, а не оценка.
  return [
    { key: 'fact', label: 'Факт', value: m.value.realizedRev, extra: '', empty: '—' },
    {
      key: 'forecast',
      label: 'Прогноз',
      value: m.value.landing,
      extra: m.value.landing > 0 ? formatGrowth(m.value.landDev) : '',
      empty: '—',
    },
    { key: 'plan', label: 'План', value: m.value.T, extra: '', empty: '—' },
    { key: 'goal', label: 'Цель', value: m.value.goal, extra: '', empty: 'не поставлена' },
  ]
})

// Расстояния между величинами и сессия, которая двигает соседнюю.
// Разрыв «факт → прогноз» никакой сессией не двигается: его закрывает работа,
// а не встреча, — поэтому входа у него нет.
const energy = computed(() => computeEnergy(state, m.value))
const GAP_MODULE = { 'forecast-plan': 'session-plan', 'plan-goal': 'session-goal' }
const gaps = computed(() => {
  const byKey = {}
  for (const g of computeGaps(m.value)) byKey[g.key] = { ...g, module: GAP_MODULE[g.key] || '' }
  return byKey
})
// Разрыв стоит под той плашкой, к которой относится. Строка без числа
// (цель не поставлена) показывается тоже: без неё цепочка рвётся.
const GAP_AFTER = { fact: 'fact-forecast', forecast: 'forecast-plan', plan: 'plan-goal' }
function gapFor(key) {
  const g = gaps.value[GAP_AFTER[key]]
  if (!g) return null
  return g.value === null || g.value > 0 ? g : null
}
function gapColor(tone) {
  if (tone === 'bad') return 'var(--negative)'
  if (tone === 'good') return 'var(--positive)'
  return 'var(--text-muted)'
}

const moduleOpen = ref('')
const storyOpen = ref(false)

// Цель ниже плана — не цель, а второй план. Называем это в той же шторке,
// где человек её и правит.
function goalErrorFor(v) {
  return Number(v) > 0 && Number(v) < Number(state.month_target)
    ? `Цель ниже плана ${formatRub(state.month_target)}.`
    : ''
}

const planDraftError = ref('')
const goalDraftError = ref('')

function savePlan(v) {
  if (!(Number(v) > 0)) { planDraftError.value = 'План не может быть пустым.'; return }
  planDraftError.value = ''
  store.setTargets({ target: v })
  sheet.value = ''
}
function saveGoal(v) {
  const err = goalErrorFor(v)
  if (err) { goalDraftError.value = err; return }
  goalDraftError.value = ''
  store.setTargets({ goal: v })
  sheet.value = ''
}
function saveCarry(v) {
  if (!state.carry) return
  store.setCarry({ amount: v, upTo: state.carry.upTo })
  sheet.value = ''
}
</script>

<template>
  <div v-if="m" class="px-4 pb-4">
    <!-- Тот же виджет, что на входе, но с днями месяца приложения:
         календарь и числа под ним говорят про один и тот же месяц. -->
    <WeekWidget
      tone="black"
      :label="monthCap(m.month)"
      :days="widgetWeek"
      :weeks="monthWeeks"
      :note="widgetNote"
      :pill="widgetPill"
    />

    <!-- Метод стоит между календарём и числами: человек посмотрел свою неделю,
         и здесь ему объясняют, откуда берутся числа под этим блоком. Заливка
         и рост выше соседей — так его видно раньше, чем плашки. -->
    <button
      type="button"
      class="mt-3 flex min-h-[84px] w-full items-center gap-3 rounded-2xl px-4 py-4 text-left"
      :style="{ background: 'color-mix(in srgb, var(--action) 12%, var(--surface))' }"
      @click="storyOpen = true"
    >
      <span class="min-w-0 flex-1">
        <span class="block text-[1.0625rem] font-bold leading-tight text-[var(--text)]">Расти с прогнозом</span>
        <span class="mt-1 block text-[0.875rem] leading-snug text-[var(--text-secondary)]">
          Закрывайте разрывы быстрее
        </span>
      </span>
      <ChevronRight class="h-5 w-5 shrink-0" :style="{ color: 'var(--action)' }" :stroke-width="2.5" aria-hidden="true" />
    </button>

    <h2 class="mb-2 mt-5 text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
      Движение к цели
    </h2>

    <div class="flex flex-col gap-2">
      <template v-for="r in rows" :key="r.key">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 py-3.5 text-left shadow-sm"
          @click="sheet = r.key"
        >
          <span class="min-w-0 flex-1">
            <span class="block text-[0.8125rem] text-[var(--text-muted)]">{{ r.label }}</span>
            <span class="mt-0.5 flex items-baseline gap-2">
              <span class="text-[1.5rem] font-bold leading-none tabular-nums text-[var(--text)]">
                {{ r.value ? formatRub(r.value) : r.empty }}
              </span>
              <span v-if="r.extra" class="text-[0.875rem] font-semibold text-[var(--text-muted)]">
                {{ r.extra }}
              </span>
            </span>
          </span>
          <ChevronRight class="h-5 w-5 shrink-0 text-[var(--text-muted)]" :stroke-width="2" aria-hidden="true" />
        </button>

        <!-- Расстояние до следующей величины. Ноль не показываем: расстояния
             нет. Где его двигает сессия — строка становится кнопкой. -->
        <!-- Разрывы выровнены по левому краю: по центру они читались подписями
             к плашкам, а не самостоятельным рядом чисел. -->
        <component
          :is="gapFor(r.key) && gapFor(r.key).module ? 'button' : 'div'"
          v-if="gapFor(r.key)"
          :type="gapFor(r.key).module ? 'button' : null"
          class="flex w-full items-center gap-2 px-4 py-0.5 text-left"
          @click="gapFor(r.key).module ? moduleOpen = gapFor(r.key).module : null"
        >
          <ArrowDown class="h-3.5 w-3.5 shrink-0" :style="{ color: gapColor(gapFor(r.key).tone) }" :stroke-width="2.5" aria-hidden="true" />
          <span class="text-[0.75rem] text-[var(--text-muted)]">{{ gapFor(r.key).label }}</span>
          <span
            v-if="gapFor(r.key).value !== null"
            class="text-[0.8125rem] font-bold tabular-nums"
            :style="{ color: gapColor(gapFor(r.key).tone) }"
          >{{ formatRub(gapFor(r.key).value) }}</span>
          <ChevronRight
            v-if="gapFor(r.key).module"
            class="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]"
            :stroke-width="2.5"
            aria-hidden="true"
          />
        </component>
      </template>
    </div>

    <SiteFooter />

    <!-- Паспорт сессии открывается прямо из разрыва. -->
    <BottomSheet :open="!!moduleOpen" @close="moduleOpen = ''">
      <ModulePassport
        :module-id="moduleOpen"
        :energy="energy"
        :locked="state.razborRating === null || state.razborRating === undefined"
        :rated="state.razborRating !== null && state.razborRating !== undefined"
        @close="moduleOpen = ''"
      />
    </BottomSheet>

    <StoryOnboarding
      :open="storyOpen"
      :slides="FORECAST_STORY"
      @close="storyOpen = false"
      @done="storyOpen = false"
    />

    <Teleport to="body">
      <div
        v-if="sheet"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-[var(--scrim)] backdrop-blur-sm"
        role="presentation"
        @click.self="sheet = ''"
      >
        <div class="max-h-[88svh] w-full max-w-[430px] overflow-y-auto rounded-t-2xl bg-[var(--bg)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <ValueSheet
            v-if="sheet === 'fact'"
            title="Факт"
            subtitle="Заработано с начала месяца: дни, которые вы внесли, плюс стартовая сумма."
            :value="m.realizedRev"
            :edit-label="state.carry ? 'Изменить стартовую сумму' : ''"
            hint="Заработано с начала месяца до первого внесённого дня"
            placeholder="1 250 000"
            @close="sheet = ''"
            @save="saveCarry"
          />

          <ValueSheet
            v-else-if="sheet === 'forecast'"
            title="Прогноз"
            subtitle="Куда приземлится месяц, если темп не изменится. Прогноз не ставится, он считается — и меняется только от внесённых дней."
            :value="m.landing"
            @close="sheet = ''"
          />

          <ValueSheet
            v-else-if="sheet === 'plan'"
            title="План"
            subtitle="Обязательство на месяц. Правка меняет то, что осталось разнести по открытым дням; закрытые дни остаются с прежней оценкой."
            :value="m.T"
            edit-label="Изменить план"
            hint="Сумма, которую вы обязаны сделать"
            placeholder="3 000 000"
            :error="planDraftError"
            @close="sheet = ''"
            @save="savePlan"
          />

          <ValueSheet
            v-else-if="sheet === 'goal'"
            title="Цель"
            subtitle="То, ради чего стараются сверх плана. Можно не ставить — тогда шкала строится до плана."
            :value="m.goal"
            edit-label="Изменить цель"
            hint="Сверх плана"
            placeholder="3 500 000"
            :error="goalDraftError"
            @close="sheet = ''"
            @save="saveGoal"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>
