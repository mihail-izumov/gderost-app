<script setup>
import { BRAND } from '../i18n/brand.js'

// Витрина: один вопрос и один путь дальше. Ветвлений здесь быть не должно —
// человек пришёл по ссылке и должен дойти до своих цифр без сопровождения.
defineEmits(['start'])
</script>

<template>
  <!-- Тёмная витрина скоупом на экране, а не на <html>: приложение внутри
       остаётся светлым. -->
  <div
    data-theme="showcase-dark"
    class="min-h-[100dvh] w-full flex justify-center"
    :style="{ background: 'var(--bg)', color: 'var(--text)' }"
  >
    <div
      class="w-full max-w-[430px] min-h-[100dvh] flex flex-col px-3
             pl-[max(0.75rem,env(safe-area-inset-left))]
             pr-[max(0.75rem,env(safe-area-inset-right))]
             pt-[max(1rem,env(safe-area-inset-top))]
             pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <!-- Подпись владельца инструмента, мелко -->
      <header class="min-h-[44px] flex items-center">
        <span
          class="text-[0.8125rem] font-medium uppercase tracking-wide"
          :style="{ color: 'var(--text-secondary)' }"
        >{{ BRAND.header }}</span>
      </header>

      <!-- Один вопрос и ничего больше -->
      <main class="flex-1 flex items-center">
        <h1
          class="font-brand text-[2.125rem] font-bold leading-tight tracking-tight bc-fade-in"
          :style="{ color: 'var(--text)' }"
        >{{ BRAND.question }}</h1>
      </main>

      <footer class="flex flex-col gap-4">
        <button
          type="button"
          class="min-h-[52px] w-full rounded-xl text-[1.0625rem] font-semibold tracking-wide"
          :style="{ background: 'var(--accent)', color: 'var(--accent-ink)' }"
          @click="$emit('start')"
        >СТАРТ</button>
        <p class="text-[0.8125rem] leading-snug" :style="{ color: 'var(--text-secondary)' }">
          Четыре ответа про ваш месяц — и вы увидите, куда он приземляется.
          Без почты и без регистрации, всё считается на вашем устройстве.
        </p>
        <div class="flex flex-col gap-1">
          <p class="text-[0.9375rem] font-medium" :style="{ color: 'var(--text)' }">
            {{ BRAND.refrain }}
          </p>
          <p class="text-[0.75rem] leading-snug" :style="{ color: 'var(--text-muted)' }">
            {{ BRAND.domain }}
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>
