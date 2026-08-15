<script setup>
// Круг дня: четыре шага по кольцу, тап открывает шаг.
//
// Шаг горит, когда у владельца есть свои данные для этой части дня, —
// круг заполняется от его собственных цифр, а не от выдуманного примера.
// Пустой шаг остаётся контуром: это не упрёк, а место, куда он ещё
// не дошёл.
//
// Кольцо рисуется четырьмя дугами на SVG без зависимостей. Подписи стоят
// снаружи по сторонам света, чтобы не спорить с числом в центре.

defineProps({
  // [{ id, short, on }] — ровно четыре, порядок по кругу.
  steps: { type: Array, required: true },
  // Большое число в центре и подпись под ним.
  centerValue: { type: String, default: '' },
  centerLabel: { type: String, default: '' },
})
defineEmits(['open'])

const R = 74
const C = 92
// Четыре дуги с зазорами: круг читается шагами, а не сплошным кольцом.
const ARCS = [
  { id: 0, from: -84, to: 6 },
  { id: 1, from: 6, to: 96 },
  { id: 2, from: 96, to: 186 },
  { id: 3, from: 186, to: 276 },
]
const pt = (deg) => {
  const r = (deg * Math.PI) / 180
  return [C + R * Math.cos(r), C + R * Math.sin(r)]
}
const arc = (from, to) => {
  const [x1, y1] = pt(from)
  const [x2, y2] = pt(to)
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}
// Точки подписей: право, низ, лево, верх.
const LABEL_POS = [
  { style: 'right:0;top:50%;transform:translateY(-50%)', align: 'text-right' },
  { style: 'left:50%;bottom:0;transform:translateX(-50%)', align: 'text-center' },
  { style: 'left:0;top:50%;transform:translateY(-50%)', align: 'text-left' },
  { style: 'left:50%;top:0;transform:translateX(-50%)', align: 'text-center' },
]
</script>

<template>
  <div class="relative mx-auto w-full max-w-[19rem]" style="aspect-ratio: 1 / 1">
    <svg viewBox="0 0 184 184" class="absolute inset-0 h-full w-full" aria-hidden="true">
      <path
        v-for="(a, i) in ARCS"
        :key="a.id"
        :d="arc(a.from + 4, a.to - 4)"
        fill="none"
        stroke-linecap="round"
        :stroke-width="steps[i] && steps[i].on ? 9 : 5"
        :stroke="steps[i] && steps[i].on ? 'var(--text)' : 'var(--line)'"
      />
    </svg>

    <!-- Центр: то, что уже посчитано на цифрах владельца. -->
    <div class="absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
      <span v-if="centerValue" class="text-[1.625rem] font-bold leading-none tabular-nums text-[var(--text)]">
        {{ centerValue }}
      </span>
      <span v-if="centerLabel" class="mt-1 text-[0.75rem] leading-snug text-[var(--text-muted)]">
        {{ centerLabel }}
      </span>
    </div>

    <!-- Подписи-кнопки шагов по сторонам круга. -->
    <button
      v-for="(s, i) in steps"
      :key="s.id"
      type="button"
      class="absolute min-h-[36px] rounded-full px-2.5 text-[0.8125rem] font-semibold"
      :class="LABEL_POS[i].align"
      :style="`${LABEL_POS[i].style};background:var(--surface);color:${s.on ? 'var(--text)' : 'var(--text-muted)'}`"
      @click="$emit('open', s.id)"
    >{{ s.short }}</button>
  </div>
</template>
