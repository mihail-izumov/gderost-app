<script setup>
import { computed, ref } from 'vue'
import { Gauge, Target } from 'lucide-vue-next'
import MonthProgressCard from '../components/home/MonthProgressCard.vue'
import HomeWidget from '../components/home/HomeWidget.vue'
import CountersCard from '../components/CountersCard.vue'
import InstallBanner from '../components/InstallBanner.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { mlnRub, mlnSigned, pct1, pctDelta, monthCap } from '../i18n/home.js'

// Главная — дека виджетов. Устройство взято у рабочего Ранскейла:
// счётчики системы · дека месяца в рублях и днях · два виджета в процентах ·
// вход внутрь по тапу.
//
// Дека и виджеты не дублируют друг друга намеренно: дека говорит рублями
// и днями, виджеты — отношениями. Одно и то же число в двух видах на одном
// экране читалось бы как два разных.

const emit = defineEmits(['go'])

const store = useMiniStore()
const m = store.model
const monthOver = store.monthOver
const state = store.state

const askReset = ref(false)

const slides = computed(() => (m.value ? [{
  key: 'unit',
  title: state.unit || state.company || 'Ваш бизнес',
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

function reset() {
  store.reset()
  askReset.value = false
}
</script>

<template>
  <div v-if="m" class="flex flex-col gap-3 px-4 pb-8">
    <!-- Календарь ушёл вперёд: делать вид, что месяц идёт, приложение не станет -->
    <p
      v-if="monthOver"
      class="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-[0.8125rem] leading-snug text-[var(--text-secondary)]"
    >
      {{ monthCap(m.month) }} закончился. Числа ниже — итог того месяца.
      Новый месяц заводится вводом нового плана.
    </p>

    <CountersCard clickable @open="emit('go', 'runscale')" />

    <MonthProgressCard :slides="slides" :month="m.month" :days-left="m.daysLeft" />

    <div class="grid grid-cols-2 gap-3">
      <HomeWidget
        :icon="Gauge"
        name="Контроль&#10;Дня"
        metric-label="План/Факт"
        :value-main="m.onPlan == null ? '—' : pct1(m.onPlan)"
        sub-label="Разрыв"
        :sub-value="gapValue"
        @select="emit('go', 'day')"
      />
      <HomeWidget
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

    <InstallBanner />

    <!-- Выход не заперт: инструмент возвращаемый -->
    <footer class="mt-4 border-t border-[var(--line)] pt-4">
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
