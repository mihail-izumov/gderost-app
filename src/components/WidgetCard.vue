<script setup>
import { ArrowUpRight } from 'lucide-vue-next'

// Карточка-виджет на «Сегодня»: раздел показывает своё главное число прямо
// на входе и открывается тапом.
//
// Устройство одно и то же у всех карточек: жёлтая иконка, имя раздела,
// подпись отношения, крупное число со стрелкой захода, внизу второе число.
// Одинаковая форма — чтобы разделы сравнивались взглядом, а не читались
// каждый по-своему.

defineProps({
  title: { type: String, required: true },
  icon: { type: [Object, Function], default: null },
  ratioLabel: { type: String, default: '' },
  ratioValue: { type: String, default: '' },
  // Цвет крупного числа: светофор ставится только там, где он что-то значит.
  ratioTone: { type: String, default: 'var(--text)' },
  footLabel: { type: String, default: '' },
  footValue: { type: String, default: '' },
})
defineEmits(['open'])
</script>

<template>
  <button
    type="button"
    class="flex w-full flex-col rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4 text-left"
    :style="{ boxShadow: 'var(--card-shadow)' }"
    @click="$emit('open')"
  >
    <span class="flex items-start gap-3">
      <span
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        :style="{ background: 'var(--accent)' }"
      >
        <component :is="icon" v-if="icon" class="h-6 w-6" :style="{ color: 'var(--accent-ink)' }" aria-hidden="true" />
      </span>
      <span class="min-w-0 flex-1 text-[1.0625rem] font-bold leading-tight text-[var(--text)]">
        {{ title }}
      </span>
    </span>

    <span class="mt-4 block text-[0.8125rem] text-[var(--text-secondary)]">{{ ratioLabel }}</span>

    <span class="mt-1 flex items-center gap-2">
      <span
        class="text-[1.75rem] font-bold leading-none tabular-nums"
        :style="{ color: ratioTone }"
      >{{ ratioValue }}</span>
      <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)]">
        <ArrowUpRight class="h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
      </span>
    </span>

    <span class="mt-3 block text-[0.8125rem] text-[var(--text-secondary)]">{{ footLabel }}</span>
    <span class="mt-0.5 block text-[1.0625rem] font-semibold tabular-nums text-[var(--text)]">
      {{ footValue }}
    </span>
  </button>
</template>
