<script setup>
import { ChevronRight } from 'lucide-vue-next'
import { MODULES } from '../../i18n/energy.js'

// Режим Ранскейл — баннер под лентой, а не карточка в ней.
//
// В общем ряду подписка читалась просто самой дорогой из четырёх ступеней:
// те же плитки, тот же размер, а разговор другой — это не встреча, а работа
// каждый день. Цены и мощности на баннере нет: и то и другое человек читает
// в паспорте, когда уже решил посмотреть.

defineEmits(['open'])
const mod = MODULES.runscale
</script>

<template>
  <button
    type="button"
    class="mt-2.5 flex w-full items-center gap-3.5 rounded-[22px] p-4 text-left"
    :style="{ background: 'var(--surface-black)', color: 'var(--ink-on-color)' }"
    @click="$emit('open', 'runscale')"
  >
    <span class="min-w-0 flex-1">
      <span class="block text-[1.0625rem] font-bold leading-tight">{{ mod.title }}</span>
      <span class="mt-1 block text-[0.8125rem] leading-snug" :style="{ color: 'var(--ink-on-color-muted)' }">
        {{ mod.subtitle }}
      </span>
    </span>
    <ChevronRight class="h-5 w-5 shrink-0" :style="{ color: 'var(--ink-on-color-muted)' }" :stroke-width="2.5" aria-hidden="true" />
  </button>
</template>
