<script setup>
import { computed } from 'vue'
import { chevronStyle } from '../composables/brandMask.js'
import { BRAND } from '../i18n/brand.js'

// Связка имени: шеврон · РАНСКЕЙЛ · МИНИ.
//
// Строится как имя продукта у Apple: знак, затем линейка обычным начертанием,
// затем издание светлее и тем же кеглем. Издание набрано тем же межбуквенным
// расстоянием, что и линейка, — разное расстояние в одной строке читается
// как две разные надписи, случайно оказавшиеся рядом.
//
// Отдельного бейджа у издания нет: цветная плашка внутри имени спорит
// с высказыванием, которое стоит следующей строкой и должно быть громче всех.

const props = defineProps({
  // Кегль строки в px. Шеврон считается от него, чтобы связка не рассыпалась.
  size: { type: Number, default: 26 },
  tone: { type: String, default: 'var(--text)' },
})

const chevron = computed(() => chevronStyle(Math.round(props.size * 0.92)))
</script>

<template>
  <div class="flex items-center gap-2" role="img" :aria-label="BRAND.header">
    <span class="block shrink-0" :style="{ ...chevron, background: tone }" aria-hidden="true" />
    <span
      class="whitespace-nowrap uppercase leading-none"
      :style="{ fontSize: size + 'px', letterSpacing: '0.06em', color: tone }"
      aria-hidden="true"
    >
      <span class="font-bold">{{ BRAND.brandName }}</span>
      <span class="font-light"> {{ BRAND.brandEdition }}</span>
    </span>
  </div>
</template>
