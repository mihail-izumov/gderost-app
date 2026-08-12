<script setup>
import { computed } from 'vue'
import StatusChip from './StatusChip.vue'
import { formatRub, formatGrowth, monthLabel, daysWord } from '../i18n/format.js'

// Виджет месяца: факт · прогноз · план · цель на одной шкале.
//
// Прогноз здесь один. Не «оптимистичный и осторожный» на выбор — один,
// потому что выбирать между прогнозами значит выбирать удобный, а месяц
// приземлится ровно туда, куда его несёт сегодняшний темп.
//
// Разрыв показан деньгами, а не процентами: «не доедем на 2,6 млн» — это
// сумма, за которой видно решение. «Минус 12 %» решения за собой не тянет.

const props = defineProps({ m: { type: Object, required: true } })

const SIG = { good: 'var(--positive)', warn: 'var(--warning)', bad: 'var(--negative)', idle: 'var(--text-muted)' }
const fcColor = computed(() => SIG[props.m.fcSig] || SIG.idle)

// Шкала строится до цели, если цель есть; иначе до плана — рисовать пустое
// место под несуществующую цель значит требовать её молча.
const scaleMax = computed(() => Math.max(props.m.goal || 0, props.m.T, props.m.landing, props.m.realizedRev) || 1)
const pct = (v) => Math.max(0, Math.min(100, (v / scaleMax.value) * 100))

const factPct = computed(() => pct(props.m.realizedRev))
const landPct = computed(() => pct(props.m.landing))
const planPct = computed(() => pct(props.m.T))
const goalPct = computed(() => (props.m.goal ? pct(props.m.goal) : null))

const short = computed(() => props.m.T - props.m.landing)
const overshoot = computed(() => short.value < 0)

const GOAL_STATE = {
  ok: 'темп посильный: так вы уже работали',
  record: 'нужен темп выше обычного — но в ваших границах',
  out: 'выше вашего лучшего дня: планом это уже не закрыть',
  unknown: 'дневной выручки пока нет, сравнивать не с чем',
}
const stateNote = computed(() => GOAL_STATE[props.m.goalState] || GOAL_STATE.unknown)
</script>

<template>
  <section
    class="rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4"
    :style="{ boxShadow: 'var(--card-shadow)' }"
  >
    <div class="flex items-baseline justify-between gap-2">
      <h2 class="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {{ monthLabel(m.month) }}
      </h2>
      <span class="text-[0.75rem] text-[var(--text-muted)]">
        осталось {{ m.daysLeft }} {{ daysWord(m.daysLeft) }}
      </span>
    </div>

    <!-- Главное число экрана: разрыв деньгами -->
    <div class="mt-3">
      <div class="flex items-center gap-2">
        <span class="text-[0.75rem] text-[var(--text-muted)]">
          {{ overshoot ? 'Приземляетесь выше плана на' : 'Не доедете до плана на' }}
        </span>
        <StatusChip kind="computed" />
      </div>
      <div class="mt-1 flex flex-wrap items-baseline gap-x-2">
        <!-- Крупная цифра монохромна. Смысл «не доедете» несут слова над ней,
             а цвет оставлен светофору: как только красным заговорит и оценка дня,
             и большая цифра, светофор перестанет означать что-то одно. -->
        <span
          class="font-brand text-[2.125rem] font-bold leading-none tracking-tight text-[var(--text)]"
        >{{ formatRub(Math.abs(short)) }}</span>
        <span class="text-[0.875rem] font-semibold text-[var(--text-secondary)]">
          {{ formatGrowth(m.landDev) }}
        </span>
      </div>
      <p class="mt-1.5 text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
        Так месяц закончится, если темп не изменится. {{ stateNote }}.
      </p>
    </div>

    <!-- Шкала: сделано · добавит текущий темп · план · цель -->
    <div class="relative mt-4 h-4 overflow-hidden rounded-lg bg-[var(--surface-2)]">
      <i class="absolute bottom-0 top-0 block rounded-l-lg"
         :style="{ left: 0, width: factPct + '%', background: 'var(--positive)' }" />
      <i class="absolute bottom-0 top-0 block"
         :style="{ left: factPct + '%', width: Math.max(0, landPct - factPct) + '%',
                   background: fcColor, opacity: 0.35 }" />
      <i class="absolute -bottom-0.5 -top-0.5 w-0.5"
         :style="{ left: planPct + '%', background: 'var(--text)' }" />
      <i v-if="goalPct !== null" class="absolute -bottom-0.5 -top-0.5 w-0.5"
         :style="{ left: goalPct + '%', background: 'var(--text-muted)' }" />
    </div>

    <!-- Четыре сущности словами: порядок факт → прогноз ≤ план ≤ цель -->
    <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
      <div>
        <dt class="flex items-center gap-1.5 text-[0.75rem] text-[var(--text-muted)]">
          Сделано <StatusChip kind="said" />
        </dt>
        <dd class="mt-0.5 font-mono text-[1rem] font-semibold text-[var(--text)]">
          {{ formatRub(m.realizedRev) }}
        </dd>
      </div>
      <div>
        <dt class="flex items-center gap-1.5 text-[0.75rem] text-[var(--text-muted)]">
          <span class="inline-block h-2 w-2 shrink-0 rounded-full" :style="{ background: fcColor }" />
          Прогноз <StatusChip kind="computed" />
        </dt>
        <dd class="mt-0.5 font-mono text-[1rem] font-semibold text-[var(--text)]">
          {{ formatRub(m.landing) }}
        </dd>
      </div>
      <div>
        <dt class="flex items-center gap-1.5 text-[0.75rem] text-[var(--text-muted)]">
          План <StatusChip kind="said" />
        </dt>
        <dd class="mt-0.5 font-mono text-[1rem] font-semibold text-[var(--text)]">
          {{ formatRub(m.T) }}
        </dd>
      </div>
      <div>
        <dt class="text-[0.75rem] text-[var(--text-muted)]">Цель</dt>
        <dd v-if="m.goal" class="mt-0.5 font-mono text-[1rem] font-semibold text-[var(--text)]">
          {{ formatRub(m.goal) }}
        </dd>
        <dd v-else class="mt-0.5 text-[0.8125rem] leading-snug text-[var(--text-muted)]">
          не поставлена — шкала идёт до плана
        </dd>
      </div>
    </dl>

    <p class="mt-3 border-t border-[var(--line)] pt-3 text-[0.75rem] leading-snug text-[var(--text-muted)]">
      Осталось заработать {{ formatRub(m.remainTarget) }}.
      Прогноз считается на введённом вами и меняется с каждым новым днём.
    </p>
  </section>
</template>
