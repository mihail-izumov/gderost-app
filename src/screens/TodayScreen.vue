<script setup>
import { computed, ref } from 'vue'
import { Gauge, Target, Info } from 'lucide-vue-next'
import MonthProgressCard from '../components/home/MonthProgressCard.vue'
import HomeWidget from '../components/home/HomeWidget.vue'
import InstallBanner from '../components/InstallBanner.vue'
import TryWeekCard from '../components/TryWeekCard.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { mlnRub, mlnSigned, pct1, pctDelta, monthCap } from '../i18n/home.js'

// Главная — дека виджетов. Устройство взято у рабочего Ранскейла:
// дека месяца в рублях и днях, два виджета в отношениях, вход внутрь по тапу.
//
// Дека и виджеты не дублируют друг друга намеренно: дека говорит рублями
// и днями, виджеты — процентами. Одно и то же число в двух видах на одном
// экране читалось бы как два разных.
//
// Счётчиков системы здесь нет: они живут на вкладке «Ранскейл», где им есть
// что объяснить. На экране собственных цифр владельца чужая статистика —
// второе сообщение, которое спорит с первым.

const emit = defineEmits(['go'])

const store = useMiniStore()
const m = store.model
const monthOver = store.monthOver

const infoOpen = ref(false)

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

// Живые интерпретации для «Как читать виджеты»: расшифровка на своих числах,
// а не на выдуманном примере. Перенесено из оригинала.
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

</script>

<template>
  <div v-if="m" class="px-4 pb-8">
    <!-- Календарь ушёл вперёд: делать вид, что месяц идёт, приложение не станет -->
    <p
      v-if="monthOver"
      class="mb-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-[0.8125rem] leading-snug text-[var(--text-secondary)]"
    >
      {{ monthCap(m.month) }} закончился. Числа ниже — итог того месяца.
      Новый месяц заводится вводом нового плана.
    </p>

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
      <HomeWidget
        class="flex-1"
        :icon="Target"
        name="Цели и планы"
        metric-label="Прогноз/План"
        :value-main="pctDelta(m.landDev)"
        :trend="fcTrend"
        sub-label="Прогноз выручки"
        :sub-value="mlnRub(m.landing)"
        @select="emit('go', 'goals')"
      />
    </div>

    <!-- Как читать виджеты: расшифровка по запросу, на своих числах -->
    <button
      type="button"
      class="mx-auto mt-2.5 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8125rem] font-medium text-[var(--text-muted)] transition-colors active:bg-[var(--surface-2)]"
      :aria-expanded="infoOpen ? 'true' : 'false'"
      @click="infoOpen = !infoOpen"
    >
      <Info class="h-4 w-4" :stroke-width="2" aria-hidden="true" />
      <span>Как читать виджеты</span>
    </button>
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="infoOpen"
        class="mt-1 rounded-2xl bg-[var(--surface)] p-4 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)] shadow-sm"
      >
        <p><b class="text-[var(--text)]">План/Факт</b> — сколько заработали к сегодняшнему дню от плана на прошедшие дни. 100% — идём ровно по плану, ниже — отстаём. {{ planFactInfo }}</p>
        <p class="mt-2"><b class="text-[var(--text)]">Прогноз/План</b> — если темп сохранится, насколько выручка месяца отклонится от плана. Стрелка — сдвиг за последний внесённый день. {{ paceInfo }}</p>
        <p class="mt-2"><b class="text-[var(--text)]">Вместе:</b> слева — где вы сейчас, справа — куда придёте к концу месяца.</p>
        <p class="mt-2"><b class="text-[var(--text)]">Полоса месяца</b> — те же деньги в рублях. <b class="text-[var(--text)]">План</b> — обязательство, <b class="text-[var(--text)]">цель</b> — амбиция сверху; это разные числа.</p>
      </div>
    </Transition>

    <InstallBanner />

    <div class="mt-4">
      <TryWeekCard />
    </div>

    <SiteFooter />
  </div>
</template>
