<script setup>
import { computed } from 'vue'
import { L } from '../../i18n/daily.js'
import { OBS_FOR_DATA } from '../../data/weekShape.js'

// Коэффициенты дней недели: полоса, значение, метка среднего дня.
// Перенесено из рабочего Ранскейла; полоса нейтральная — это вес, не сигнал.
//
// Столбец источника снят: «ваши веса (n=0)» и чип «допущение» стояли в каждой
// из семи строк и повторяли один и тот же факт семь раз. Статус формы — свойство
// формы целиком, а не каждого дня по отдельности, поэтому он сказан один раз
// в подписи под таблицей.

const props = defineProps({ m: { type: Object, required: true } })
const emit = defineEmits(['tune'])

const midPos = computed(() => (props.m.maxCoef ? (1 / props.m.maxCoef) * 100 : 0))
const rows = computed(() => props.m.coefRows || [])
const fromData = computed(() => rows.value.length > 0 && !rows.value.some((r) => r.assume))
const shortDays = computed(() => rows.value.filter((r) => r.n < OBS_FOR_DATA).length)

const note = computed(() => {
  if (fromData.value) return 'Посчитано по вашим дням: форма пересчитывается, когда данных становится больше.'
  return `Допущение: веса поставлены без ваших данных. Пересчёт по факту включится, когда каждый день недели встретится дважды — сейчас не хватает ${shortDays.value} из 7.`
})
</script>

<template>
  <section>
    <h2 class="mb-3 mt-4 text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
      {{ L.coef }}
    </h2>

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

      <button
        type="button"
        class="mt-3 min-h-[44px] text-[0.8125rem] font-semibold"
        :style="{ color: 'var(--action)' }"
        @click="emit('tune')"
      >Настроить форму недели</button>
    </div>
  </section>
</template>
