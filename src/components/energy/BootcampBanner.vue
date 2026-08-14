<script setup>
import { ChevronRight, Zap } from 'lucide-vue-next'

// Баннер буткемпа — паттерн СберПрайма в Whoosh: главный продукт
// не лежит в общем списке, а маячит собственной тёмной карточкой там, где
// человек уже смотрит на цену пути.
//
// Карточка — одна кнопка целиком, открывает паспорт буткемпа. Цены на ней
// нет: цену буткемпа называет человек на разборе.

defineEmits(['open'])
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center gap-3.5 rounded-[22px] p-4 text-left"
    :style="{ background: 'var(--surface-black)', color: 'var(--ink-on-color)' }"
    @click="$emit('open')"
  >
    <span
      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      :style="{ background: 'var(--accent)' }"
      aria-hidden="true"
    >
      <Zap class="h-5 w-5" :style="{ color: 'var(--accent-ink)' }" :stroke-width="2.5" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block text-[1.0625rem] font-bold leading-tight">Буткемп</span>
      <span class="mt-0.5 block text-[0.8125rem] leading-snug" :style="{ color: 'var(--ink-on-color-muted)' }">
        30 дней с командой инженеров. К концу месяца план работает
      </span>
    </span>
    <ChevronRight class="h-5 w-5 shrink-0" :style="{ color: 'var(--ink-on-color-muted)' }" :stroke-width="2.5" aria-hidden="true" />
  </button>
</template>
