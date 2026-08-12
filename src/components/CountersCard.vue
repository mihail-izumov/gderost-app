<script setup>
import { computed } from 'vue'
import { COUNTERS } from '../data/runscaleCounters.js'
import { formatInt } from '../i18n/format.js'

// Кликабельной карточка становится только там, где ей есть куда вести.
// На витрине разделов ещё нет, и она остаётся текстом: кнопка, которая никуда
// не ведёт, — обманка, а вся ставка этого приложения на то, что оно нигде не врёт.

defineProps({ clickable: { type: Boolean, default: false } })
defineEmits(['open'])

const asOf = computed(() => {
  const [y, m, d] = COUNTERS.asOf.split('-')
  return `${d}.${m}.${y}`
})
</script>

<template>
  <div>
    <component
      :is="clickable ? 'button' : 'ul'"
      :type="clickable ? 'button' : null"
      class="flex w-full items-stretch rounded-2xl border border-[var(--rim)] bg-[var(--surface)] py-3"
      @click="clickable ? $emit('open') : null"
    >
      <component
        :is="clickable ? 'span' : 'li'"
        v-for="(c, i) in COUNTERS.items" :key="c.key"
        class="flex flex-1 flex-col items-center justify-center px-1"
        :class="i > 0 ? 'border-l border-[var(--line)]' : ''"
      >
        <span class="font-mono text-[1.5rem] font-bold leading-none tabular-nums text-[var(--text)]">
          {{ formatInt(c.value) }}
        </span>
        <span class="mt-1 text-[0.6875rem] text-[var(--text-muted)]">{{ c.label }}</span>
      </component>
    </component>
    <p class="mt-1.5 text-center text-[0.6875rem] text-[var(--text-muted)]">
      на {{ asOf }}, обновляется вручную
    </p>
  </div>
</template>
