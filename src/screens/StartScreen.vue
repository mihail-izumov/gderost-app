<script setup>
import WeekWidget from '../components/WeekWidget.vue'
import { BRAND } from '../i18n/brand.js'

// Вход. Один путь и ни одного слова, которое пришлось бы объяснять голосом:
// имя мелко, высказывание крупно, живая неделя, действие.
// Виджет и кнопка объясняют друг друга — подзаголовок между ними был бы
// признанием, что они этого не делают.
defineEmits(['start'])
</script>

<template>
  <div class="min-h-[100dvh] w-full flex justify-center bg-[var(--bg)]">
    <div
      class="w-full max-w-[430px] min-h-[100dvh] flex flex-col px-4
             pl-[max(1rem,env(safe-area-inset-left))]
             pr-[max(1rem,env(safe-area-inset-right))]
             pt-[max(1rem,env(safe-area-inset-top))]
             pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <header class="min-h-[44px] flex items-center">
        <span class="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {{ BRAND.header }}
        </span>
      </header>

      <main class="flex-1 flex flex-col justify-center gap-7 py-4">
        <h1
          class="font-brand font-bold leading-[0.95] tracking-tight text-[var(--text)] bc-fade-in"
          :style="{ fontSize: 'clamp(2.75rem, 14vw, 4rem)' }"
        >{{ BRAND.question }}</h1>

        <WeekWidget />
      </main>

      <footer class="flex flex-col gap-3">
        <button
          type="button"
          class="min-h-[52px] w-full rounded-xl text-[1.0625rem] font-semibold"
          :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
          @click="$emit('start')"
        >{{ BRAND.cta }}</button>

        <p class="text-center text-[0.8125rem] text-[var(--text-secondary)]">
          {{ BRAND.honesty }}
        </p>

        <div class="mt-3 flex flex-col gap-0.5">
          <p class="text-[0.9375rem] font-medium text-[var(--text)]">{{ BRAND.refrain }}</p>
          <p class="text-[0.75rem] leading-snug text-[var(--text-muted)]">{{ BRAND.domain }}</p>
        </div>
      </footer>
    </div>
  </div>
</template>
