<script setup>
import { computed } from 'vue'
import { L } from '../../i18n/daily.js'
import { OBS_FOR_DATA } from '../../data/weekShape.js'

// Коэффициенты дней недели: значение, источник, число наблюдений. Дни на
// допущении помечены чипом. Полоса нейтральная — это не сигнал, а вес;
// метка «1,00» показывает средний день. Перенесено из рабочего Ранскейла.
//
// Кнопка настройки — добавление против оригинала: там веса приходят из контура
// и правке не подлежат, здесь их ставит сам владелец.

const props = defineProps({ m: { type: Object, required: true } })
const emit = defineEmits(['tune'])

const midPos = computed(() => (props.m.maxCoef ? (1 / props.m.maxCoef) * 100 : 0))
// Сколько дней недели ещё не набрали наблюдений на собственный расчёт.
const shortDays = computed(() => (props.m.coefRows || []).filter((r) => r.n < OBS_FOR_DATA).length)
const note = computed(() => {
  const rows = props.m.coefRows || []
  if (!rows.length) return ''
  if (!rows.some((r) => r.assume)) return 'Посчитано по вашим дням. Пересчитывается, когда данных становится больше.'
  return shortDays.value
    ? `Пока допущение: ${shortDays.value} из 7 дней недели встретились в ваших данных меньше ${OBS_FOR_DATA} раз. Когда встретятся — приложение предложит пересчитать.`
    : 'Наблюдений хватает на расчёт — приложение предложит пересчитать веса по вашим дням.'
})
</script>

<template>
  <section>
    <h2 class="mb-3 mt-4 flex flex-wrap items-center gap-2 text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
      {{ L.coef }}
      <span
        v-if="shortDays"
        class="rounded border border-dashed border-[var(--warning)] px-1.5 py-0.5 text-[0.625rem] font-normal normal-case tracking-normal text-[var(--text-muted)]"
      >{{ shortDays }} дн · уточнятся с историей</span>
    </h2>

    <div class="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <div class="overflow-x-auto" style="-webkit-overflow-scrolling: touch">
        <div class="min-w-[340px]">
          <div
            v-for="(r, i) in m.coefRows" :key="i"
            class="grid items-center gap-3 py-1 text-[0.8125rem]"
            style="grid-template-columns: 28px 1fr 44px 150px"
          >
            <span class="text-[var(--text)]">{{ r.dowRu }}</span>
            <div class="relative h-2.5 rounded-full bg-[var(--surface-2)]">
              <i
                class="absolute bottom-0 left-0 top-0 rounded-full"
                :style="{ width: (r.coef ? (r.coef / m.maxCoef) * 100 : 0) + '%', background: 'var(--text-muted)', opacity: 0.4 }"
              />
              <span class="absolute -bottom-0.5 -top-0.5 w-px bg-[var(--text-muted)]" :style="{ left: midPos + '%' }" />
            </div>
            <span class="text-right [font-variant-numeric:tabular-nums] text-[var(--text)]">
              {{ r.coef != null ? r.coef.toFixed(2).replace('.', ',') : '—' }}
            </span>
            <span class="flex items-center justify-end gap-1 text-[0.6875rem] text-[var(--text-muted)]">
              {{ r.src === 'данные' ? `факт (n=${r.n})` : `ваши веса (n=${r.n})` }}
              <span
                v-if="r.assume"
                class="rounded border border-dashed border-[var(--warning)] px-1 text-[0.625rem] text-[var(--text-muted)]"
              >{{ L.assume }}</span>
            </span>
          </div>
        </div>
      </div>

      <p v-if="note" class="mt-3 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
        {{ note }}
      </p>

      <button
        type="button"
        class="mt-3 min-h-[44px] text-[0.8125rem] font-semibold"
        :style="{ color: 'var(--action)' }"
        @click="emit('tune')"
      >Настроить веса</button>
    </div>
  </section>
</template>
