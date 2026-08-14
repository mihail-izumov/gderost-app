<script setup>
import { ChevronRight, Zap } from 'lucide-vue-next'

// Баннер дороги — паттерн СберПрайма в Whoosh: главное предложение
// не лежит в общем списке, а маячит собственной тёмной карточкой там, где
// человек уже смотрит на свои числа.
//
// Раньше здесь стоял буткемп в одиночку. Ступеней теперь четыре, и обещать
// с «Сегодня» одну из середины значит прятать дорогу: карточка ведёт
// на вкладку, где лестница видна целиком и посчитан текущий уровень.
//
// Цены на баннере нет: цену человек читает в паспорте ступени, а не в
// приглашении.

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
      :style="{ background: 'var(--line-on-color)' }"
      aria-hidden="true"
    >
      <Zap class="h-5 w-5" :style="{ color: 'var(--ink-on-color)' }" :stroke-width="2.5" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="flex items-center gap-2">
        <span class="text-[1.0625rem] font-bold leading-tight">Разборы</span>
        <span
          class="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.6875rem] font-bold leading-none"
          :style="{ background: 'var(--line-on-color)', color: 'var(--ink-on-color)' }"
        >4 ступени</span>
      </span>
      <span class="mt-0.5 block text-[0.8125rem] leading-snug" :style="{ color: 'var(--ink-on-color-muted)' }">
        От девяноста минут до режима с командой. Ваш уровень уже посчитан
      </span>
    </span>
    <ChevronRight class="h-5 w-5 shrink-0" :style="{ color: 'var(--ink-on-color-muted)' }" :stroke-width="2.5" aria-hidden="true" />
  </button>
</template>
