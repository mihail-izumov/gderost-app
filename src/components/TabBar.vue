<script setup>
import { computed } from 'vue'
import CalDateIcon from './icons/CalDateIcon.vue'
import ProgressIcon from './icons/ProgressIcon.vue'
import SignalsIcon from './icons/SignalsIcon.vue'
import UltraIcon from './icons/UltraIcon.vue'

// Таб-бар — плавающая капсула по стандарту iOS: скруглённая плашка с воздухом
// по периметру, а не полоса во всю ширину экрана. Так она читается контролом
// поверх содержимого, а не краем окна.
//
// Активная вкладка помечена синей заливкой под знаком: синий — цвет действия
// и активного состояния. Жёлтый отсюда убран: он означает меру
// и незавершённость, а «здесь вы сейчас» ни то, ни другое.
//
// Знаки у всех четырёх вкладок свои, библиотечных здесь не осталось: файлы
// присланы Михаилом и перенесены как есть, без перерисовки. «Сегодня» —
// календарь Ранскеила с сегодняшним числом внутри (человек видит день,
// не открывая экран), дальше — прогресс, сигналы, ультра.
//
// Шеврона здесь нет и не будет: знак марки, поставленный на место иконки,
// перестаёт быть знаком марки и начинает означать «раздел». Он живёт только
// в связке имени продукта.
//
// Стекло — Tailwind-утилита backdrop-blur, а не своё свойство: autoprefixer
// добавляет -webkit-backdrop-filter, без которого на iOS Safari размытие
// не рисуется вовсе.
//
// ⚠ Пустой `active` — законное состояние, а не ошибка. Человек стоит
// на под-странице («Контроль Дня», «Цели и планы»), и она не принадлежит
// ни одной вкладке: подсвеченный «Прогресс» над экраном «Контроля Дня»
// сообщал бы, что человек находится там, где его нет. Возврат при этом
// всё равно ведёт в раздел, из которого пришли, — это разные вопросы.
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
      <ProgressIcon
        v-else-if="tab.iconKind === 'growth'"
        class="h-[20px] w-[20px]"
        :class="active === tab.id ? 'text-[var(--action-ink)]' : 'text-[var(--text-muted)]'"
      />
      <UltraIcon
        v-else-if="tab.iconKind === 'ultra'"
        class="h-[20px] w-[20px]"
        :class="active === tab.id ? 'text-[var(--action-ink)]' : 'text-[var(--text-muted)]'"
      />
      <SignalsIcon
        v-else
        class="h-[20px] w-[20px]"
        :class="active === tab.id ? 'text-[var(--action-ink)]' : 'text-[var(--text-muted)]'"
      />
      <span
        class="whitespace-nowrap text-[0.625rem] font-semibold leading-none"
        :class="active === tab.id ? 'text-[var(--action-ink)]' : 'text-[var(--text-muted)]'"
      >{{ tab.label }}</span>
    </button>
  </nav>
</template>
