<script setup>
import { computed } from 'vue'

// Статус числа. Лестница из трёх ступеней, и приложение честно стоит на первых двух:
//   «со слов»    — ввёл человек, никто не проверял;
//   «посчитано»  — выведено из введённого по правилам, которые видно;
//   «✓ проверено» — данные прошли собственный сбор и проверки.
// Третья ступень здесь не выдаётся никогда: ставить галочку на непроверенном —
// первое место, где система соврала бы.

const props = defineProps({
  kind: { type: String, default: 'said' }, // said | computed | verified
  title: { type: String, default: '' },
})

const MAP = {
  said: { label: 'со слов', hint: 'вы ввели, никто не проверял' },
  computed: { label: 'посчитано', hint: 'выведено из введённого вами' },
  verified: { label: '✓ проверено', hint: 'данные прошли сбор и проверки' },
}
const s = computed(() => MAP[props.kind] || MAP.said)
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.625rem] font-medium
           uppercase tracking-wide"
    :style="{ background: 'var(--surface-2)', color: 'var(--text-muted)' }"
    :title="title || s.hint"
  >{{ s.label }}</span>
</template>
