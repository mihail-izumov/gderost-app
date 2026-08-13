<script setup>
// Плитка показателя: заголовок капсом, крупное число, строка расшифровки.
//
// Маркер перед числом ставится только тогда, когда у показателя есть светофор.
// Плитка без маркера — величина, у которой нет «хорошо» и «плохо»: заработанное
// не бывает плохим само по себе, оно бывает меньше или больше плана.

defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  note: { type: String, default: '' },
  tone: { type: String, default: '' }, // цвет маркера; пусто — маркера нет
})
</script>

<template>
  <div class="rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-3.5">
    <div class="text-[0.6875rem] font-medium uppercase leading-tight tracking-wide text-[var(--text-muted)]">
      {{ label }}
    </div>
    <div class="mt-2 flex items-center gap-1.5">
      <i v-if="tone" class="h-2 w-2 shrink-0 rounded-full" :style="{ background: tone }" aria-hidden="true" />
      <span class="text-[1.5rem] font-bold leading-none tabular-nums text-[var(--text)]">{{ value }}</span>
    </div>
    <p v-if="note" class="mt-1.5 text-[0.75rem] leading-snug text-[var(--text-muted)]">{{ note }}</p>
  </div>
</template>
