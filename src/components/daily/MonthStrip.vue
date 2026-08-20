<script setup>
import { computed } from 'vue'
import { SIG_VAR, hatch } from '../../i18n/daily.js'
import { sigClass } from '../../composables/miniModel.js'

// Ряд дней месяца — одно устройство на всё приложение.
//
// Высота деления это деньги дня: у прожитого его выручка, у будущего то, что
// даст нынешний темп. Цвет несёт состояние, фактура — природу числа: сплошное
// измерено, штриховка означает дыру в данных или день из стартовой суммы,
// ровный серый — прогноз. Шкалы у ряда нет, поэтому сумм из него
// не восстановить: он показывает форму месяца, а не величины.
//
// ⚠ Компонент общий нарочно. Ряд стоит в блоке месяца на «Прогрессе» и
// на странице месяца по ссылке; двумя копиями он разошёлся бы по зазору
// и толщине штриховки, и один и тот же месяц на двух экранах выглядел бы
// по-разному.

const props = defineProps({
  m: { type: Object, required: true },
  today: { type: String, required: true },
  // Точка под сегодняшним столбцом. На чужом месяце она лишняя: читателю
  // незачем знать, какой день у отправителя идёт.
  markToday: { type: Boolean, default: false },
})

const dayValue = (d) => (d.entered ? d.fact : (props.m.impliedBase || 0) * (d.weight || 0))
const maxV = computed(() => Math.max(...props.m.days.map(dayValue), 1))

// ⚠ Жёлтый носил ДВА смысла сразу — это ловит общее правило приоритета
// состояний (`composables/stateBadge.js`). Сплошным жёлтым красился и день,
// отработавший близко к плану (результат), и день, за который цифры нет вовсе
// (долг). На экране это дало дюжину жёлтых столбцов при счётчике «0 близко
// 85–99 %»: числа были верны, врал цвет — человек считал жёлтые столбцы
// и получал другое число.
//
// Разводим фактурой, а цвет остаётся значением состояния: сплошное —
// измеренное, штриховка — дыра в данных, серое — прогноз. Тот же приём
// работает в сводке недель, где штриховкой помечена разнесённая стартовая
// сумма.
const strip = computed(() => props.m.days.map((d) => {
  const h = Math.round(8 + (dayValue(d) / maxV.value) * 20)
  const base = { key: d.iso, dd: d.dd, h, today: d.iso === props.today }
  if (d.entered) return { ...base, style: { background: SIG_VAR[sigClass(d.fact / d.planAt)] } }
  // День из стартовой суммы: выручка известна общей суммой, но не по дням —
  // тоже не измерение, и тоже штриховка, только нейтральная.
  if (d.inCarry) return { ...base, style: hatch('var(--text-muted)') }
  if (d.iso < props.today) return { ...base, style: hatch('var(--warning)') }
  return { ...base, style: { background: 'var(--line)' } }
}))
</script>

<template>
  <!-- Зазор в 3 px: на двух пикселях границы делений сливались, и месяц
       читался сплошной лентой вместо тридцати одного дня. -->
  <div class="flex h-[28px] items-end gap-[3px]">
    <span
      v-for="d in strip"
      :key="d.key"
      class="relative min-w-0 flex-1 rounded-[2px]"
      :style="{ height: `${d.h}px`, ...d.style }"
    >
      <i
        v-if="markToday && d.today"
        class="absolute -bottom-[6px] left-1/2 block h-[3px] w-[3px] -translate-x-1/2 rounded-full"
        :style="{ background: 'var(--action)' }"
      />
    </span>
  </div>
</template>
