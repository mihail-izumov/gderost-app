<script setup>
import { computed } from 'vue'
import { chevronStyle } from '../composables/brandMask.js'
import { BRAND } from '../i18n/brand.js'

// Имя продукта: шеврон · РАНСКЕИЛ · ТРЕК.
//
// Раньше связка стояла одним файлом `runscale-mini.svg`. Файл кончился вместе
// с именем «Мини», и рисовать новый ради одной строки незачем: набор даёт то,
// чего картинка не даёт никогда — знак живёт цветом токена, слово наследует
// брендовое начертание, а вся связка масштабируется одним кеглем.
//
// Три вещи держат её выверенной, и все три завязаны на `em`, а не на пиксели:
//   1. Высота шеврона равна высоте прописной буквы. Задай их пикселями —
//      при смене кегля они разъедутся, и увидеть это на глаз уже нельзя.
//   2. Отбивка одна на оба стыка. Глаз читает «шеврон · слово · плашка» как
//      один предмет только пока промежутки равны.
//   3. Междустрочное поставлено ровно по прописным (0.76). При обычном
//      единичном интерлиньяже над буквами остаётся воздух под выносные,
//      которых в прописном наборе нет, — связка выглядела бы разболтанной.
//
// Синяя плашка стоит только под изданием: линейка различается им одним,
// и цвет здесь работает указателем, а не украшением.

const props = defineProps({
  // Кегль связки. Всё остальное считается от него.
  size: { type: String, default: '2.25rem' },
})

const chevron = computed(() => chevronStyle('0.76em'))

const row = computed(() => ({
  fontSize: props.size,
  gap: '0.24em',
}))
</script>

<template>
  <div
    class="inline-flex items-center font-brand"
    :style="row"
    role="img"
    :aria-label="BRAND.header"
  >
    <span
      class="block shrink-0 bg-[var(--text)]"
      :style="chevron"
      aria-hidden="true"
    />
    <span
      class="block text-[var(--text)]"
      :style="{ lineHeight: '0.76' }"
      aria-hidden="true"
    >{{ BRAND.wordmark }}</span>
    <span
      class="block"
      :style="{
        lineHeight: '0.76',
        padding: '0.11em 0.22em',
        borderRadius: '0.16em',
        background: 'var(--action)',
        color: 'var(--action-ink)',
      }"
      aria-hidden="true"
    >{{ BRAND.editionMark }}</span>
  </div>
</template>
