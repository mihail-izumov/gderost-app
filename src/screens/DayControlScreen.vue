<script setup>
import { computed, ref } from 'vue'
import { ChevronLeft, Plus, X } from 'lucide-vue-next'
import StatTile from '../components/StatTile.vue'
import WeekList from '../components/WeekList.vue'
import WeekSummary from '../components/WeekSummary.vue'
import ForecastLog from '../components/ForecastLog.vue'
import WeekShapeCard from '../components/WeekShapeCard.vue'
import AddReportForm from '../components/AddReportForm.vue'
import StatusChip from '../components/StatusChip.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { todayISO } from '../composables/miniModel.js'
import {
  formatK, formatMln, formatPct, formatGrowth, stampISO, daysWord,
} from '../i18n/format.js'

// Контроль дня — вся глубина месяца по дням.
//
// Порядок сверху вниз повторяет вопрос владельца: куда приземлимся → чем
// это набрано → как шли недели → каким был прогноз вчера → на чём вообще
// стоит разнос по дням. Каждый следующий блок объясняет предыдущий, поэтому
// человек может остановиться на любом и уйти с ответом.

defineEmits(['back'])

const store = useMiniStore()
const m = store.model
const state = store.state

const SIG = { good: 'var(--positive)', warn: 'var(--warning)', bad: 'var(--negative)', idle: 'var(--text-muted)' }

// Данные приложения — ровно то, что внесено. Дата среза честная: последний
// день, о котором приложение что-то знает, а не сегодняшнее число.
const asOf = computed(() => {
  const mm = m.value
  if (!mm) return todayISO()
  const closed = mm.days.filter((d) => d.closed)
  return closed.length ? closed[closed.length - 1].iso : `${mm.month}-01`
})

const fcColor = computed(() => SIG[m.value.fcSig] || SIG.idle)
const onPlanColor = computed(() => {
  const r = m.value.onPlan
  if (r == null) return SIG.idle
  return r >= 1 ? SIG.good : r >= 0.85 ? SIG.warn : SIG.bad
})

// Хвост: сколько недобрано против плана на уже закрытых днях. Плюс означает
// опережение — знак несёт направление, цвет остаётся за светофором.
const tail = computed(() => -m.value.tailCum)

const sheet = ref(false)
const pickedDate = ref('')

function openSheet(iso = '') {
  pickedDate.value = iso
  sheet.value = true
}
</script>

<template>
  <div v-if="m" class="w-full pb-24">
    <header class="pt-1">
      <div class="grid grid-cols-[1fr_auto_1fr] items-center">
        <button
          type="button"
          class="-ml-2 flex h-11 items-center gap-0.5 pr-2 text-[1.0625rem] text-[var(--action)]"
          @click="$emit('back')"
        >
          <ChevronLeft class="h-5 w-5" aria-hidden="true" />
          <span>Главная</span>
        </button>
        <p class="text-center text-[0.75rem] tabular-nums text-[var(--text-muted)]">
          данные от {{ stampISO(asOf) }}
        </p>
        <span />
      </div>

      <h1 class="mt-2 text-center font-brand text-[2rem] font-bold leading-tight tracking-tight text-[var(--text)]">
        Контроль Дня
      </h1>

      <div class="mt-3 flex justify-center">
        <span class="rounded-full bg-[var(--surface-2)] px-4 py-2 text-[0.9375rem] font-medium text-[var(--text)]">
          {{ state.unit || state.company || 'Ваш бизнес' }}
        </span>
      </div>
    </header>

    <!-- Шапка чисел: обязательство · куда приземлимся · что уже сделано -->
    <section class="mt-4 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4"
             :style="{ boxShadow: 'var(--card-shadow)' }">
      <div class="flex items-center gap-2">
        <span class="text-[0.8125rem] text-[var(--text-muted)]">план месяца</span>
        <StatusChip kind="said" />
      </div>
      <div class="mt-0.5 text-[2rem] font-bold leading-none tabular-nums text-[var(--text)]">
        {{ formatMln(m.T) }}
      </div>

      <div class="mt-4 flex items-end justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-[0.8125rem] text-[var(--text-muted)]">прогноз</span>
            <StatusChip kind="computed" />
          </div>
          <div class="mt-0.5 flex items-center gap-2">
            <i class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ background: fcColor }" aria-hidden="true" />
            <span class="text-[1.5rem] font-bold leading-none tabular-nums text-[var(--text)]">
              {{ formatMln(m.landing) }}
            </span>
          </div>
          <div class="mt-1 text-[0.875rem] font-semibold tabular-nums text-[var(--text-secondary)]">
            {{ formatGrowth(m.landDev) }}
          </div>
        </div>

        <div class="shrink-0 text-right">
          <div class="text-[0.8125rem] text-[var(--text-muted)]">заработано</div>
          <div class="mt-0.5 text-[1.5rem] font-bold leading-none tabular-nums text-[var(--text)]">
            {{ formatMln(m.realizedRev) }}
          </div>
        </div>
      </div>
    </section>

    <!-- Четыре плитки: чем набран месяц и что требуется дальше -->
    <div class="mt-3 grid grid-cols-2 gap-3">
      <StatTile
        label="Заработано"
        :value="formatK(m.realizedRev)"
        :note="`${m.T ? Math.round((m.realizedRev / m.T) * 100) : 0} % плана — ${m.realizedCount} дн из ${m.DIM}`"
      />
      <StatTile
        label="Идём к плану"
        :value="m.onPlan === null ? '—' : formatPct(m.onPlan * 100, 0)"
        :tone="onPlanColor"
        :note="m.onPlan === null ? 'дневной выручки пока нет'
          : m.onPlan >= 1 ? 'идём выше плана по прошедшим дням'
          : 'отстаём по прошедшим дням'"
      />
      <StatTile
        label="Хвост накоплен"
        :value="formatK(tail)"
        :tone="tail < 0 ? SIG.bad : SIG.good"
        :note="tail < 0
          ? `по +${formatK(Math.abs(m.spread))} к плану каждого из оставшихся дней`
          : `оставшимся дням нужно на ${formatK(Math.abs(m.spread))} меньше плана`"
      />
      <StatTile
        label="Нужный темп на остаток"
        :value="`${formatK(m.needPerDay)}/день`"
        :tone="m.goalState === 'out' ? SIG.bad : m.goalState === 'record' ? SIG.warn : SIG.good"
        :note="`текущий ~${formatK(m.currentPace)}/день · нужен ${formatGrowth(m.paceGap)}`"
      />
    </div>

    <!-- Недели месяца с таблицей дней -->
    <div class="mt-5">
      <h2 class="px-1 text-[0.75rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        По неделям
      </h2>
      <div class="mt-2">
        <WeekList :m="m" @pick="openSheet" />
      </div>
    </div>

    <div class="mt-5">
      <WeekSummary :m="m" />
    </div>

    <div class="mt-5">
      <ForecastLog :log="state.forecastLog" :target="m.T" />
    </div>

    <div class="mt-5">
      <WeekShapeCard />
    </div>

    <p class="mt-5 px-1 text-[0.75rem] leading-snug text-[var(--text-muted)]">
      Осталось {{ m.daysLeft }} {{ daysWord(m.daysLeft) }}. Все числа посчитаны
      на том, что внесли вы; ничего не отправляется в сеть.
    </p>

    <!-- Ввод отчёта: действие живёт на том же экране, где виден его результат -->
    <button
      type="button"
      class="fixed bottom-24 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full"
      :style="{ background: 'var(--accent)', boxShadow: '0 6px 20px rgba(0,0,0,0.18)' }"
      aria-label="Добавить отчёт"
      @click="openSheet('')"
    >
      <Plus class="h-7 w-7" :style="{ color: 'var(--accent-ink)' }" aria-hidden="true" />
    </button>

    <div
      v-if="sheet"
      class="fixed inset-0 z-30 flex items-end justify-center"
      :style="{ background: 'var(--scrim)' }"
      @click.self="sheet = false"
    >
      <div class="max-h-[88dvh] w-full max-w-[430px] overflow-y-auto rounded-t-2xl bg-[var(--bg)] p-4
                  pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div class="mb-3 flex justify-end">
          <button
            type="button"
            class="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-2)]"
            aria-label="Закрыть"
            @click="sheet = false"
          >
            <X class="h-5 w-5 text-[var(--text-secondary)]" aria-hidden="true" />
          </button>
        </div>
        <AddReportForm :preset="pickedDate" />
      </div>
    </div>
  </div>
</template>
