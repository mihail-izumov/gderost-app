<script setup>
import { computed } from 'vue'
import { Zap } from 'lucide-vue-next'
import CalDateIcon from './icons/CalDateIcon.vue'
import { chevronStyle } from '../composables/brandMask.js'

// Таб-бар. Перенесён из рабочего Ранскейла: активная вкладка помечена жёлтой
// пилюлей-заливкой под иконкой, подписи монохромные. Цветом здесь говорит
// только состояние «здесь вы сейчас».
//
// Знаки у вкладок свои, а не библиотечные: «Сегодня» — календарь Ранскейла
// с сегодняшним числом внутри (человек видит день, не открывая экран),
// «Рост 24/7» — шеврон системы, «Сигналы» — залитая молния. Контурная иконка
// рядом с двумя плотными знаками читалась недорисованной.
//
// Стекло на фоне — Tailwind-утилита backdrop-blur, а не своё свойство:
// autoprefixer добавляет -webkit-backdrop-filter, без которого на iOS Safari
// размытие не рисуется вовсе.
defineProps({
  tabs: { type: Array, required: true },
  active: { type: String, required: true },
})
defineEmits(['select'])

const today = computed(() => new Date().getDate())
const chevron = chevronStyle(20)
</script>

<template>
  <nav
    role="tablist"
    class="flex shrink-0 items-stretch gap-1 border-t border-[var(--line)] px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur bg-[color-mix(in_srgb,var(--bg)_82%,transparent)]"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      :aria-selected="active === tab.id"
      :aria-label="tab.label"
      class="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 py-1.5 outline-none"
      @click="$emit('select', tab.id)"
    >
      <span
        class="flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150"
        :class="active === tab.id ? 'bg-[var(--accent)]' : 'bg-transparent'"
      >
        <CalDateIcon
          v-if="tab.iconKind === 'cal'"
          class="h-[22px] w-[22px]"
          :day="today"
          :class="active === tab.id ? 'text-[var(--accent-ink)]' : 'text-[var(--text-muted)]'"
        />
        <span
          v-else-if="tab.iconKind === 'chevron'"
          class="block"
          :class="active === tab.id ? 'bg-[var(--accent-ink)]' : 'bg-[var(--text-muted)]'"
          :style="chevron"
          aria-hidden="true"
        />
        <Zap
          v-else
          class="h-[22px] w-[22px]"
          :class="active === tab.id ? 'text-[var(--accent-ink)]' : 'text-[var(--text-muted)]'"
          fill="currentColor"
          :stroke-width="1"
        />
      </span>
      <span
        class="whitespace-nowrap text-[0.6875rem] font-medium leading-none"
        :class="active === tab.id ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'"
      >{{ tab.label }}</span>
    </button>
  </nav>
</template>
