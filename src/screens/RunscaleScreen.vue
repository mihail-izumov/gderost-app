<script setup>
import { computed, ref } from 'vue'
import BottomSheet from '../components/BottomSheet.vue'
import DayCircle from '../components/growth/DayCircle.vue'
import StepLayer from '../components/growth/StepLayer.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { computeTodaySignal } from '../composables/signalModel.js'
import { HEAD, STEPS } from '../i18n/growth247.js'
import { formatRub, dayLabel, plural } from '../i18n/format.js'

// «Рост 24/7» — примерка дня, а не витрина системы.
//
// Экран отвечает на один вопрос: как выглядит день владельца, за цифрами
// которого следят круглосуточно. Поэтому здесь нет описаний продукта,
// цен и сравнений: цена и состав лежат на «Сигналах», где стоит дорога.
//
// Один разворот без прокрутки: круг из четырёх шагов дня в центре, под ним
// строка про свои цифры и вход на дорогу. Глубина открывается тапом по шагу:
// сверху слоя — состояние владельца на его числах, ниже — как этот шаг
// проходит с системой. Круг горит от того, что человек ввёл сам; чужих
// данных не выдумываем.

const emit = defineEmits(['go'])

const store = useMiniStore()
const m = store.model
const open = ref('')

const signal = computed(() => computeTodaySignal(m.value))

// Шаг горит, когда у владельца есть, чем его наполнить: внесённые дни,
// посчитанный сигнал, поставленная цель. Драйверов в приложении нет —
// четвёртый шаг не горит никогда, и это честная пустота, а не недоделка.
const steps = computed(() => {
  const mm = m.value
  const entered = mm ? mm.realizedCount : 0
  return STEPS.map((s) => ({
    ...s,
    on: s.id === 'data' ? entered > 0
      : s.id === 'hint' ? !!signal.value
        : s.id === 'action' ? false
          : false,
  }))
})

// Центр круга — то, ради чего человек сюда пришёл: его собственное
// требование на сегодня. Нет чисел — центр говорит, с чего начать.
const center = computed(() => {
  const s = signal.value
  if (s && s.need != null) return { value: formatRub(s.need), label: 'надо сегодня' }
  if (s) return { value: formatRub(s.landing), label: 'прогноз месяца' }
  return { value: '', label: 'Внесите первый день — здесь появятся ваши числа' }
})

// Строка «у вас сейчас» для каждого слоя: только посчитанное, без оценок.
const youLine = computed(() => {
  const mm = m.value
  const s = signal.value
  const last = mm && mm.days ? [...mm.days].reverse().find((d) => d.entered) : null
  return {
    data: mm && mm.realizedCount > 0
      ? `Внесено ${mm.realizedCount} ${plural(mm.realizedCount, 'день', 'дня', 'дней')}${last ? `, последний — ${dayLabel(last.iso)}` : ''}. Вносите вы, одной цифрой в вечер.`
      : 'Пока не внесено ни одного дня. Вносите вы, одной цифрой в вечер.',
    hint: s
      ? `Сегодня надо ${s.need != null ? formatRub(s.need) : '—'}, прогноз месяца ${formatRub(s.landing)}. Считает приложение, когда вы его откроете.`
      : 'Подсказка появится, как только будет что считать.',
    action: 'Приложение считает, сколько надо, но не говорит, как: оно не знает, на чём именно вы зарабатываете.',
    result: 'Задумки месяца живут в голове — через неделю уже не вспомнить, что дало рост.',
  }
})

const openStep = computed(() => STEPS.find((s) => s.id === open.value) || null)
</script>

<template>
  <div class="flex min-h-[calc(100dvh-9rem)] w-full flex-col px-4 pb-4">
    <!-- Заголовок ставит шапка. Здесь — одна строка о том, что показано. -->
    <p class="text-[0.9375rem] leading-snug text-[var(--text-secondary)]">{{ HEAD.lead }}</p>

    <div class="flex flex-1 items-center justify-center py-2">
      <DayCircle
        :steps="steps"
        :center-value="center.value"
        :center-label="center.label"
        @open="open = $event"
      />
    </div>

    <p class="text-center text-[0.8125rem] leading-snug text-[var(--text-muted)]">{{ HEAD.ownDogfood }}</p>

    <button
      type="button"
      class="mt-2.5 min-h-[48px] w-full rounded-full text-[0.9375rem] font-bold"
      :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      @click="emit('go', 'power')"
    >{{ HEAD.cta }}</button>

    <BottomSheet :open="!!openStep" @close="open = ''">
      <StepLayer
        v-if="openStep"
        :step="openStep"
        :you="youLine[openStep.id]"
        :sample="openStep.id === 'hint' ? 'hint' : openStep.id === 'action' ? 'action' : ''"
        :counters="openStep.id === 'data'"
        @close="open = ''"
      />
    </BottomSheet>
  </div>
</template>
