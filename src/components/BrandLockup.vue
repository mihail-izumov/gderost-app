<script setup>
import { computed } from 'vue'
import { chevronStyle } from '../composables/brandMask.js'
import { BRAND } from '../i18n/brand.js'

// Связка имени: шеврон · РАНСКЕЙЛ · плашка МИНИ.
//
// Набрано брендовым Univers Bold Condensed — тем же файлом, что в рабочем
// Ранскейле. Издание стоит на синей плашке цвета действия: так строится имя
// продукта у Apple, где линейка идёт обычным весом, а поколение выделяется.
//
// Пропорции взяты с продуктовой страницы Apple Watch: знак по высоте прописной,
// зазор между знаком и словом — четверть кегля, плашка издания отбита половиной.

const props = defineProps({
  size: { type: Number, default: 30 },
  tone: { type: String, default: 'var(--text)' },
})

// Знак ростом с прописную букву: выше — спорит со словом, ниже — отваливается.
const chevron = computed(() => chevronStyle(Math.round(props.size * 0.78)))
const gap = computed(() => `${Math.round(props.size * 0.26)}px`)
</script>

<template>
  <div class="flex items-center" :style="{ gap: gap }" role="img" :aria-label="BRAND.header">
    <span class="block shrink-0" :style="{ ...chevron, background: tone }" aria-hidden="true" />
    <span
      class="font-brand whitespace-nowrap uppercase leading-none"
      :style="{ fontSize: size + 'px', letterSpacing: '0.02em', color: tone }"
      aria-hidden="true"
    >{{ BRAND.brandName }}</span>
    <span
      class="font-brand whitespace-nowrap rounded-md uppercase leading-none"
      :style="{
        fontSize: Math.round(size * 0.72) + 'px',
        letterSpacing: '0.02em',
        background: 'var(--action)',
        color: 'var(--action-ink)',
        padding: `${Math.round(size * 0.13)}px ${Math.round(size * 0.22)}px`,
        marginLeft: `${Math.round(size * 0.12)}px`,
      }"
      aria-hidden="true"
    >{{ BRAND.brandEdition }}</span>
  </div>
</template>
