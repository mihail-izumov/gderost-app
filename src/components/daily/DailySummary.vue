<script setup>
import { computed } from 'vue'
import { mln, pctSigned, L, SIG_VAR } from '../../i18n/daily.js'
import { sigClass } from '../../composables/miniModel.js'
import { useMiniStore } from '../../composables/useMiniStore.js'
import DaysByPlan from './DaysByPlan.vue'

// Сводка по неделям: полоса, суммы, отклонение · строка «Месяц» · распределение
// внесённых дней по светофору. Перенесено из рабочего Ранскеила.
//
// РАЗНОС СТАРТОВОЙ СУММЫ. Недели, целиком вошедшие в стартовую сумму, стояли
// пустыми: дневной выручки у них нет, мерить нечего. Владелец при этом знает,
// сколько заработал, и видит в сводке дыру там, где месяц шёл.
//
// Приложение не додумывает за него — оно предлагает разнести его же сумму
// по его же форме недели одним переключателем. Разложенные недели рисуются
// серой полосой в штриховку и подписаны словом «разнесено»: это раскладка,
// а не замер. Отклонения у них нет и светофор им не ставится — оценивать
// собственную арифметику приложение не станет.

const props = defineProps({ m: { type: Object, required: true } })
const store = useMiniStore()

const wSig = (w) => sigClass(w.ratio)
const HATCH = {
  backgroundColor: 'var(--surface-2)',
  backgroundImage: 'repeating-linear-gradient(-45deg, transparent 0 2px, var(--text-muted) 2px 3px)',
}

const spreadOn = computed(() => !!(store.state.carry && store.state.carry.spread))
const carryWeeks = computed(() => props.m.weeks.filter(
  (w) => !w.hasFact && w.days.some((d) => d.inCarry),
).length)
</script>

<template>
  <section>
    <h2 class="mb-3 mt-4 text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">{{ L.summary }}</h2>
    <div class="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <div
        v-for="w in m.weeks"
        :key="w.idx"
        class="grid items-center gap-3 border-t border-[var(--line)] px-4 py-2.5 text-[0.8125rem] first:border-t-0"
        style="grid-template-columns: 96px 1fr 92px 64px"
      >
        <div class="font-semibold text-[var(--text)]">
          Неделя {{ w.idx }}<span class="block text-[0.6875rem] font-normal text-[var(--text-muted)]">{{ w.from }}–{{ w.to }}</span>
        </div>
        <div class="relative h-3 overflow-hidden rounded-full bg-[var(--surface-2)]">
          <i
            v-if="w.hasFact"
            class="absolute bottom-0 left-0 top-0 rounded-full"
            :style="{ width: w.faWidth + '%', background: SIG_VAR[wSig(w)] }"
          />
          <i
            v-else-if="w.hasSpread"
            class="absolute bottom-0 left-0 top-0 rounded-full"
            :style="{ width: w.spreadWidth + '%', ...HATCH }"
          />
        </div>
        <div class="text-right tabular-nums text-[var(--text-muted)]">
          <template v-if="w.hasFact"><b class="font-semibold text-[var(--text)]">{{ mln(w.fact) }}</b></template>
          <template v-else-if="w.hasSpread"><b class="font-semibold text-[var(--text-secondary)]">{{ mln(w.spreadFact) }}</b></template>
          <template v-else><span>ждём</span></template>
          <!-- Подпись называет охват. Процент справа считается против плана
               внесённых дней, и пока неделя внесена не целиком, «план» всей
               недели рядом с ним предлагал читателю поделить видимое
               на видимое и получить другое число. -->
          <span class="block text-[0.625rem]">
            <template v-if="!w.hasFact && w.hasSpread">разнесено</template>
            <template v-else-if="w.hasFact && w.partOfPlan < w.plan - 0.5">план внесённых {{ mln(w.partOfPlan) }}</template>
            <template v-else>план {{ mln(w.plan) }}</template>
          </span>
        </div>
        <div class="text-right font-bold tabular-nums text-[var(--text-secondary)]">
          {{ w.hasFact ? pctSigned(w.delta / (w.partOfPlan || 1)) : '—' }}
        </div>
      </div>

      <!-- Месяц -->
      <div
        class="grid items-center gap-3 border-t border-[var(--line)] bg-[var(--surface-2)] px-4 py-2.5 text-[0.8125rem] font-bold"
        style="grid-template-columns: 96px 1fr 92px 64px"
      >
        <div class="text-[var(--text)]">{{ L.month }}</div>
        <div class="relative h-3 overflow-hidden rounded-full bg-[var(--surface)]">
          <i class="absolute bottom-0 left-0 top-0 rounded-full" :style="{ width: m.landPct + '%', background: SIG_VAR[m.fcSig] }" />
        </div>
        <div class="text-right tabular-nums text-[var(--text)]">
          {{ mln(m.landing) }}<span class="block text-[0.625rem] font-normal text-[var(--text-muted)]">план {{ mln(m.T) }}</span>
        </div>
        <div class="text-right tabular-nums text-[var(--text)]">{{ pctSigned(m.landDev) }}</div>
      </div>

      <!-- Переключатель разноса: появляется, только когда есть что разносить -->
      <label
        v-if="carryWeeks > 0 || spreadOn"
        class="flex items-center gap-3 border-t border-[var(--line)] px-4 py-3"
      >
        <span class="min-w-0 flex-1">
          <span class="block text-[0.9375rem] text-[var(--text)]">Разнести стартовую сумму по дням</span>
          <span class="block text-[0.75rem] leading-snug text-[var(--text-muted)]">
            По вашей форме недели. Оценку таким дням приложение не ставит.
          </span>
        </span>
        <input :checked="spreadOn" type="checkbox" class="sr-only" >
        <span
          class="relative block h-[31px] w-[51px] shrink-0 rounded-full transition-colors"
          :style="{ background: spreadOn ? 'var(--accent)' : 'var(--line)' }"
          @click="store.setCarrySpread(!spreadOn)"
        >
          <span
            class="absolute top-[2px] block h-[27px] w-[27px] rounded-full bg-[var(--surface)] transition-all"
            :style="{ left: spreadOn ? '22px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }"
          />
        </span>
      </label>

      <DaysByPlan v-if="m.dayStats" :stats="m.dayStats" />
    </div>
  </section>
</template>
