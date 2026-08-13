<script setup>
import { computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { L } from '../../i18n/daily.js'
import { useMiniStore } from '../../composables/useMiniStore.js'
import { shapeName, calibrateFromDays, OBS_FOR_DATA } from '../../data/weekShape.js'

// Дни недели: чем именно разносится остаток плана.
//
// Полоса нейтральная — это вес, а не сигнал. Метка на полосе показывает
// средний день: без неё непонятно, сильный день или слабый.
//
// Столбца источника у каждой строки нет: он повторял один и тот же факт
// семь раз. Статус — свойство формы целиком, поэтому сказан один раз, а имя
// текущей формы стоит кнопкой в шапке и оттуда же открывается настройка.

const props = defineProps({ m: { type: Object, required: true } })
const emit = defineEmits(['tune'])

const store = useMiniStore()
const state = store.state

const midPos = computed(() => (props.m.maxCoef ? (1 / props.m.maxCoef) * 100 : 0))
const rows = computed(() => props.m.coefRows || [])
const title = computed(() => (state.coef_src === 'off'
  ? 'Выключено'
  : shapeName(state.coef_src, state.shape_id)))

// Пересчёт из собственных дней возможен, только когда КАЖДЫЙ день недели
// встретился в данных нужное число раз. Полусчитанной формы не существует:
// половина недели из факта, половина из допущения — форма, про которую нельзя
// сказать ни «посчитано», ни «допущение».
const calibration = computed(() => calibrateFromDays(state.days))
const shortDays = computed(() => rows.value.filter((r) => r.n < OBS_FOR_DATA).length)

const note = computed(() => {
  if (state.coef_src === 'off') return 'Поправка выключена: остаток плана разносится по дням ровно.'
  if (state.coef_src === 'data') return 'Посчитано по вашим дням. Пересчитывается, когда данных становится больше.'
  if (calibration.value) return 'Данных уже хватает на расчёт по вашим дням — можно пересчитать.'
  return `Допущение: веса поставлены без ваших данных. Пересчёт станет возможен, когда каждый день недели встретится дважды — не хватает ${shortDays.value} из 7.`
})

function recalc() {
  if (!calibration.value) return
  store.setWeekShape(calibration.value.coef, 'data', state.shape_id)
}
</script>

<template>
  <section>
    <div class="mb-3 mt-4 flex items-center gap-3">
      <h2 class="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">{{ L.coef }}</h2>
      <!-- Имя текущей формы и есть вход в настройку: отдельная ссылка внизу
           заставляла искать её после того, как вопрос уже возник здесь. -->
      <button
        type="button"
        class="ml-auto inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-3 text-[0.8125rem] font-medium text-[var(--text)]"
        @click="emit('tune')"
      >
        {{ title }}
        <ChevronDown class="h-4 w-4 text-[var(--text-muted)]" :stroke-width="2" aria-hidden="true" />
      </button>
    </div>

    <div class="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <div
        v-for="(r, i) in rows" :key="i"
        class="grid items-center gap-3 py-1 text-[0.8125rem]"
        style="grid-template-columns: 28px 1fr 44px"
      >
        <span class="text-[var(--text)]">{{ r.dowRu }}</span>
        <div class="relative h-2.5 rounded-full bg-[var(--surface-2)]">
          <i
            class="absolute bottom-0 left-0 top-0 rounded-full"
            :style="{ width: (r.coef ? (r.coef / m.maxCoef) * 100 : 0) + '%', background: 'var(--text-muted)', opacity: 0.4 }"
          />
          <span class="absolute -bottom-0.5 -top-0.5 w-px bg-[var(--text-muted)]" :style="{ left: midPos + '%' }" />
        </div>
        <span class="text-right tabular-nums text-[var(--text)]">
          {{ r.coef != null ? r.coef.toFixed(2).replace('.', ',') : '—' }}
        </span>
      </div>

      <p class="mt-3 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
        {{ note }}
      </p>

      <!-- Пересчёт предлагается, а не срабатывает сам: переписать веса,
           поставленные человеком, без спроса — отменить его решение за него. -->
      <button
        v-if="calibration && state.coef_src !== 'data'"
        type="button"
        class="mt-3 min-h-[44px] w-full rounded-xl text-[0.9375rem] font-semibold"
        :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
        @click="recalc"
      >Пересчитать по моим дням</button>
    </div>
  </section>
</template>
