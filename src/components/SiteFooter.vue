<script setup>
import { L } from '../i18n/daily.js'

// Подвал приложения — один на все экраны.
//
// Здесь единственное место, где приложение говорит не про цифры, а про себя.
// Двух фраз хватает: утверждение о том, чем на самом деле делается рост,
// и рефрен. Никаких ссылок и разъяснений — подвал закрывает страницу,
// а не открывает новую тему.
</script>

<template>
  <footer class="mt-8 pb-6 text-center">
    <p class="whitespace-pre-line text-[1.375rem] font-bold leading-tight tracking-tight text-[var(--text)]">
      {{ L.motto }}
    </p>
    <p class="mt-2 text-[1rem] font-semibold" :style="{ color: 'var(--action)' }">
      {{ L.refrain }}
    </p>
  </footer>
</template>
