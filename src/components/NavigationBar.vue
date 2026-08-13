<script setup>
import { ChevronLeft } from 'lucide-vue-next'
import BusinessChip from './business/BusinessChip.vue'
import { RotateCw } from 'lucide-vue-next'
import { useNavCaption } from '../composables/useNavCaption.js'
import { hardReload } from '../composables/useAppRefresh.js'

// Шапка навигации. Перенесена из рабочего Ранскейла вместе с правилами,
// которые там выстрадывались по одному.
//
// Устройство: липкая компактная полоса сверху (слева back или чип бизнеса,
// по центру компактный заголовок, справа служебное действие) и в потоке
// скролла — крупный центрированный заголовок с подписью над ним.
//
// Три колонки, центральная — `auto`: заголовок занимает свою ширину и стоит
// ровно по центру, потому что боковые `minmax(2.75rem, 1fr)` делят остаток
// поровну. Фиксированные боковые отступы зажимали компактный заголовок и он
// обрезался. На узком экране сжимается подпись «Назад», а не заголовок;
// 2.75rem = 44pt тач-таргета боковым слотам гарантированы.
//
// Чип бизнеса живёт В ЛИПКОЙ ПОЛОСЕ, а не в потоке под ней: контекст экрана
// не должен уезжать при прокрутке. Служебная кнопка за это уехала вправо.
//
// Стекло и фон появляются ТОЛЬКО при collapsed: на самом верху шапка
// полностью прозрачна, иначе невидимый слой размытия размывает подпись.
//
// Крупный заголовок центрирован — сознательное отклонение от iOS-умолчания,
// перенесено как есть.

defineProps({
  title: { type: String, default: '' },
  collapsed: { type: Boolean, default: false },
  showBack: { type: Boolean, default: false },
  backLabel: { type: String, default: '' },
  leadingAction: { type: String, default: null }, // null | 'hardReload'
  // Подпись чипа бизнеса; пусто — чипа нет
  eyebrow: { type: String, default: null },
  eyebrowName: { type: String, default: '' },
})
defineEmits(['back'])

const { caption } = useNavCaption()
</script>

<template>
  <header
    class="sticky top-0 z-20 pt-[env(safe-area-inset-top)] transition-colors duration-200"
    :class="collapsed
      ? 'backdrop-blur bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] border-b border-[var(--line)]'
      : 'bg-transparent border-b border-transparent'"
  >
    <div class="grid h-11 w-full grid-cols-[minmax(2.75rem,1fr)_auto_minmax(2.75rem,1fr)] items-center">
      <div class="flex min-w-0 items-center justify-self-start pl-1">
        <button
          v-if="showBack"
          type="button"
          class="flex min-h-[44px] min-w-0 items-center gap-0.5 rounded-lg px-1 text-[var(--text)] active:bg-[var(--surface-2)]"
          @click="$emit('back')"
        >
          <ChevronLeft class="h-6 w-6 shrink-0" :stroke-width="2.25" />
          <span v-if="backLabel" class="truncate text-[1.0625rem] leading-none">{{ backLabel }}</span>
        </button>
        <div v-else-if="eyebrow" class="pl-2">
          <BusinessChip :label="eyebrow" :name="eyebrowName" />
        </div>
        <div v-else class="min-h-[44px] min-w-[44px]" aria-hidden="true"></div>
      </div>

      <div
        v-if="title"
        data-test="nav-compact-title"
        class="pointer-events-none flex min-w-0 items-center justify-center px-2 transition-opacity duration-200"
        :class="collapsed ? 'opacity-100' : 'opacity-0'"
      >
        <span class="truncate text-[1.0625rem] font-semibold text-[var(--text)]">{{ title }}</span>
      </div>
      <!-- заглушка центральной колонки: без неё правый слот съезжает в центр -->
      <div v-else aria-hidden="true"></div>

      <div class="flex min-w-0 items-center justify-self-end gap-1 pr-1">
        <button
          v-if="!showBack && leadingAction === 'hardReload'"
          type="button"
          data-test="nav-hard-reload"
          class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--text)] active:bg-[var(--surface-2)]"
          aria-label="Жёсткая перезагрузка (загрузить свежую версию)"
          title="Загрузить свежую версию"
          @click="hardReload"
        >
          <RotateCw class="h-5 w-5" :stroke-width="2" />
        </button>
      </div>
    </div>
  </header>

  <!-- Крупный заголовок в потоке. Подпись — absolute НАД ним, чтобы h1
       не сдвигался и стоял на одном месте во всех разделах. -->
  <div v-if="title || caption" class="relative px-4 pb-3 pt-2 text-center">
    <p
      v-if="caption"
      class="pointer-events-none absolute inset-x-0 -top-2 text-[0.75rem] leading-none text-[var(--text-muted)]"
    >{{ caption }}</p>
    <h1 v-if="title" class="text-[2.125rem] font-bold leading-tight tracking-tight text-[var(--text)]">
      {{ title }}
    </h1>
  </div>
</template>
