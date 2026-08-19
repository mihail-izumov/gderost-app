<script setup>
import { computed } from 'vue'
import { useMiniStore } from '../../composables/useMiniStore.js'
import { shapeName, shapeStatus, calibrateFromDays, OBS_FOR_DATA } from '../../data/weekShape.js'

// Поправка на день недели — сами строки, подпись состояния и пересчёт.
//
// Вынуто из `DailyCoef` в отдельный компонент, потому что живёт теперь
// в двух местах: внизу «Контроля Дня», где стояло всегда, и в блоке месяца
// на «Прогрессе», где отвечает на вопрос, возникающий прямо там, — почему
// столбцы дней разной высоты. Две копии одних строк разошлись бы молча.
//
// Считает не он: веса приходят из модели, второго расчёта в проекте нет.

const props = defineProps({
  m: { type: Object, required: true },
})
const emit = defineEmits(['tune'])

const store = useMiniStore()
const state = store.state

const midPos = computed(() => (props.m.maxCoef ? (1 / props.m.maxCoef) * 100 : 0))
const rows = computed(() => props.m.coefRows || [])

const title = computed(() => shapeName(state.coef_src, state.shape_id, state.shape_from))
const obsTotal = computed(() => rows.value.reduce((a, r) => a + (r.n || 0), 0))
const status = computed(() =>
  shapeStatus(state.coef_src, obsTotal.value, state.shape_id, state.shape_from))

// Пересчёт из собственных дней возможен, только когда КАЖДЫЙ день недели
// встретился в данных нужное число раз. Полусчитанной формы не существует.
const calibration = computed(() => calibrateFromDays(state.days))
const shortDays = computed(() => rows.value.filter((r) => r.n < OBS_FOR_DATA).length)

const note = computed(() => {
  const label = status.value.label
  const head = `${label.charAt(0).toUpperCase()}${label.slice(1)} — ${status.value.note}.`
  if (state.coef_src === 'off' || state.coef_src === 'data') return head
  if (calibration.value) return `${head} Данных уже хватает на расчёт по вашим дням.`
  return `${head} Пересчёт станет возможен, когда каждый день недели встретится дважды — не хватает ${shortDays.value} из 7.`
})

function recalc() {
  if (!calibration.value) return
  store.setWeekShape(calibration.value.coef, 'data', state.shape_id)
}
</script>

<template>
  <div>
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

    <!-- Имя формы и есть вход в её настройку. -->
    <button
      type="button"
      class="mt-2 min-h-[44px] w-full rounded-xl bg-[var(--surface-2)] text-[0.875rem] font-medium text-[var(--text)]"
      @click="emit('tune')"
    >{{ title }} — изменить</button>
  </div>
</template>
