<script setup>
import { computed } from 'vue'
import { TrendingUp, Zap } from 'lucide-vue-next'
import CalDateIcon from './icons/CalDateIcon.vue'

// Таб-бар — плавающая капсула по стандарту iOS: скруглённая плашка с воздухом
// по периметру, а не полоса во всю ширину экрана. Так она читается контролом
// поверх содержимого, а не краем окна.
//
// Активная вкладка помечена синей заливкой под знаком: синий — цвет действия
// и активного состояния. Жёлтый отсюда убран: он означает меру
// и незавершённость, а «здесь вы сейчас» ни то, ни другое.
//
// Знаки у вкладок свои, а не библиотечные: «Сегодня» — календарь Ранскейла
// с сегодняшним числом внутри (человек видит день, не открывая экран),
// «Рост 24/7» — растущая линия, «Сигналы» — залитая молния.
//
// Шеврона здесь нет и не будет: знак марки, поставленный на место иконки,
// перестаёт быть знаком марки и начинает означать «раздел». Он живёт только
// в связке имени продукта.
//
// Стекло — Tailwind-утилита backdrop-blur, а не своё свойство: autoprefixer
// добавляет -webkit-backdrop-filter, без которого на iOS Safari размытие
// не рисуется вовсе.
defineProps({
  tabs: { type: Array, required: true },
  active: { type: String, required: true },
})
defineEmits(['select'])

const today = computed(() => new Date().getDate())
</script>

<template>
  <nav
    role="tablist"
    class="flex items-stretch gap-1 rounded-full border border-[var(--line)] p-1 shadow-lg backdrop-blur
           bg-[color-mix(in_srgb,var(--surface)_88%,transparent)]"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      :aria-selected="active === tab.id"
      :aria-label="tab.label"
      class="flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-full px-3 outline-none transition-colors duration-150"
      :style="active === tab.id ? { background: 'var(--action)' } : {}"
      @click="$emit('select', tab.id)"
    >
      <CalDateIcon
        v-if="tab.iconKind === 'cal'"
        class="h-[20px] w-[20px]"
        :day="today"
        :class="active === tab.id ? 'text-[var(--action-ink)]' : 'text-[var(--text-muted)]'"
      />
      <TrendingUp
        v-else-if="tab.iconKind === 'growth'"
        class="h-[20px] w-[20px]"
        :class="active === tab.id ? 'text-[var(--action-ink)]' : 'text-[var(--text-muted)]'"
        :stroke-width="2.5"
      />
      <Zap
        v-else
        class="h-[20px] w-[20px]"
        :class="active === tab.id ? 'text-[var(--action-ink)]' : 'text-[var(--text-muted)]'"
        fill="currentColor"
        :stroke-width="1"
      />
      <span
        class="whitespace-nowrap text-[0.625rem] font-semibold leading-none"
        :class="active === tab.id ? 'text-[var(--action-ink)]' : 'text-[var(--text-muted)]'"
      >{{ tab.label }}</span>
    </button>
  </nav>
</template>
