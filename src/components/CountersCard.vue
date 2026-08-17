<script setup>
import { computed } from 'vue'
import { COUNTERS } from '../data/runscaleCounters.js'
import { formatInt, plural } from '../i18n/format.js'

// Счётчики работающей системы. Кликабельной карточка становится только там,
// где ей есть куда вести: кнопка, которая никуда не ведёт, — обманка.
//
// Подпись склоняется по своему числу: «59 чекапов», но «1 чекап». Формы лежат
// рядом со значением в `runscaleCounters.js`, склоняет та же `plural`, что
// считает дни, — двух правил склонения в приложении не заводим.
//
// Дата среза печатается там, где счётчики разбираются по существу (вкладка
// «Ранскеил»). На входе карточка идёт без подписи: там она доказывает, что
// система живая, и подпись про ручное обновление к этому ничего не добавляет.
// Само число без даты нигде не остаётся — дата от него на один тап.

defineProps({
  clickable: { type: Boolean, default: false },
  caption: { type: Boolean, default: false },
  // Внутри группирующей карточки входа обводка лишняя: рамка в рамке рисует
  // вторую границу там, где граница уже есть.
  bordered: { type: Boolean, default: true },
})
defineEmits(['open'])

const asOf = computed(() => {
  const [y, m, d] = COUNTERS.asOf.split('-')
  return `${d}.${m}.${y}`
})

// Первая буква прописная: подпись стоит под числом как заголовок колонки.
function label(c) {
  const w = plural(c.value, ...c.forms)
  return w.charAt(0).toUpperCase() + w.slice(1)
}
</script>

<template>
  <div>
    <component
      :is="clickable ? 'button' : 'ul'"
      :type="clickable ? 'button' : null"
      class="flex w-full items-stretch rounded-2xl bg-[var(--surface)] py-3"
      :class="bordered ? 'border border-[var(--rim)]' : ''"
      @click="clickable ? $emit('open') : null"
    >
      <component
        :is="clickable ? 'span' : 'li'"
        v-for="(c, i) in COUNTERS.items" :key="c.key"
        class="flex flex-1 flex-col items-center justify-center px-1"
        :class="i > 0 ? 'border-l border-[var(--line)]' : ''"
      >
        <span class="text-[1.5rem] font-bold leading-none tabular-nums text-[var(--text)]">
          {{ formatInt(c.value) }}
        </span>
        <span class="mt-1 text-[0.6875rem] text-[var(--text-muted)]">{{ label(c) }}</span>
      </component>
    </component>
    <p v-if="caption" class="mt-1.5 text-center text-[0.6875rem] text-[var(--text-muted)]">
      на {{ asOf }}, обновляется вручную
    </p>
  </div>
</template>
