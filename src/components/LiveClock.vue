<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { stampDateLabel, stampTimeParts } from '../i18n/format.js'

// Живая строка: дата и время из устройства, время идёт.
// Смысл не в украшении — экран доказывает, что он работает прямо сейчас,
// а не показывает картинку, снятую когда-то.
//
// Пульсирует только двоеточие, и делает это CSS: анимировать прозрачность
// таймером значит будить отрисовку шестьдесят раз в секунду ради одной точки.
// При выключенной анимации в системе двоеточие просто стоит — время идёт всегда.

const now = ref(new Date())
const date = ref(stampDateLabel(now.value))
const time = ref(stampTimeParts(now.value))

let timer = null
function tick() {
  now.value = new Date()
  date.value = stampDateLabel(now.value)
  time.value = stampTimeParts(now.value)
}

onMounted(() => { timer = setInterval(tick, 1000) })
onUnmounted(() => { if (timer) clearInterval(timer); timer = null })
</script>

<template>
  <p class="text-center font-mono text-[0.8125rem] tabular-nums text-[var(--text-muted)]">
    <span>{{ date }}</span>
    <span class="ml-1.5">{{ time.hh }}</span><span class="gr-blink">:</span><span>{{ time.mm }}</span>
  </p>
</template>

<style scoped>
@keyframes gr-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.25; }
}
.gr-blink { animation: gr-blink 2s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .gr-blink { animation: none; opacity: 1; }
}
</style>
