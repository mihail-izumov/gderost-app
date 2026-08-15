<script setup>
// Слой шага: сверху то, как этот кусок дня выглядит у владельца сейчас,
// ниже — как он проходит с системой. Порядок именно такой: сначала своё,
// потом чужое, иначе получается реклама.
//
// Образец утреннего сообщения показывается целиком и подписан «числа
// условные»: показать устройство честнее, чем описать его словами.

import { LAYER, SAMPLE } from '../../i18n/growth247.js'
import CountersCard from '../CountersCard.vue'

defineProps({
  step: { type: Object, required: true },
  // Строка о состоянии владельца, посчитанная экраном.
  you: { type: String, default: '' },
  // Показывать образец сообщения (шаги «подсказка» и «действие»).
  sample: { type: String, default: '' },
  // Счётчики системы: их место — шаг про данные.
  counters: { type: Boolean, default: false },
})
defineEmits(['close'])
</script>

<template>
  <section>
    <h2 class="text-[1.25rem] font-bold leading-tight text-[var(--text)]">{{ step.title }}</h2>

    <div class="mt-4 rounded-2xl bg-[var(--surface-2)] p-3.5">
      <p class="text-[0.625rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">{{ LAYER.you }}</p>
      <p class="mt-1 text-[0.9375rem] leading-snug text-[var(--text)]">{{ you }}</p>
    </div>

    <div class="mt-3">
      <p class="text-[0.625rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">{{ LAYER.system }}</p>
      <p class="mt-1 text-[0.9375rem] leading-snug text-[var(--text-secondary)]">{{ step.with }}</p>
    </div>

    <!-- Образец сообщения: структура настоящая, числа условные. -->
    <div v-if="sample" class="mt-3 rounded-2xl border border-[var(--rim)] p-3.5">
      <div class="flex items-baseline justify-between gap-3">
        <p class="text-[0.625rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">Утреннее сообщение</p>
        <span class="shrink-0 text-[0.6875rem] text-[var(--text-muted)]">{{ LAYER.sample }}</span>
      </div>
      <p class="mt-2 text-[0.875rem] font-semibold leading-snug text-[var(--text)]">{{ SAMPLE.head }}</p>
      <p class="mt-1.5 text-[0.8125rem] leading-snug text-[var(--text-secondary)]">{{ SAMPLE.body }}</p>
      <p v-if="sample === 'action'" class="mt-1.5 text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
        {{ SAMPLE.action }}
      </p>
      <p v-if="sample === 'action'" class="mt-1.5 text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
        {{ SAMPLE.cheat }}
      </p>
      <p v-if="sample === 'hint'" class="mt-2 border-t border-[var(--line)] pt-2 text-[0.8125rem] leading-snug text-[var(--text-muted)]">
        {{ SAMPLE.silence }}
      </p>
    </div>

    <div v-if="counters" class="mt-3">
      <CountersCard caption />
    </div>

    <button
      type="button"
      class="mt-4 min-h-[48px] w-full rounded-full text-[0.9375rem] font-bold"
      :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      @click="$emit('close')"
    >Понятно</button>
  </section>
</template>
