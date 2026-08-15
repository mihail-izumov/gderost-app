<script setup>
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'

// Шильд «Честная цифра» — статус чисел, показанный знаком.
//
// У числа три состояния: «со слов», «посчитано», «✓ проверено».
// В приложении честно заняты два первых: владелец вносит то, что знает,
// модель считает прогноз и разрыв. Третье ставит только контур на данных,
// поэтому здесь оно не загорается никогда — и это его продающая часть:
// человек видит, чего у его чисел нет, без единого слова уговора.
//
// Пилюля молчит о себе: устройство объясняет сторис, которая открывается
// тапом. Подписи под шильдом нет — экран сообщает состояние.

const props = defineProps({
  // Сколько делений заполнено. Три бывает только там, где прошёл чекап,
  // то есть в паспорте буткемпа — как обещание продукта, а не как факт
  // владельца.
  filled: { type: Number, default: 2 },
  // Тёмная подложка: тот же шильд на чёрной карточке.
  onDark: { type: Boolean, default: false },
  // Крупная плашка вместо пилюли: слева имя и одна строка о том, что это,
  // справа те же деления. Пилюля под декой месяца читалась значком-украшением,
  // и открыть её никто не пробовал — а за ней лежит то, чем меряется весь
  // продукт.
  large: { type: Boolean, default: false },
})
defineEmits(['open'])

const STEPS = ['со слов', 'посчитано', 'проверено']

// Знак рядом с именем несёт состояние теми же цветами, что светофор дней:
// все три деления — зелёный, неполный набор — жёлтый (мера и незавершённость).
// Красного здесь не бывает: числа со слов не ошибка, а нижняя ступень.
const tone = computed(() => (props.filled >= 3 ? 'var(--positive)' : 'var(--warning)'))
const toneInk = computed(() => (props.filled >= 3 ? 'var(--ink-on-color)' : 'var(--accent-ink)'))
</script>

<template>
  <button
    v-if="large"
    type="button"
    class="flex min-h-[64px] w-full items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 py-3 text-left"
    :aria-label="`Честная цифра: ${filled} из 3`"
    @click="$emit('open')"
  >
    <span
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
      :style="{ background: tone, color: toneInk }"
      aria-hidden="true"
    >
      <Check class="h-[18px] w-[18px]" :stroke-width="3" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block text-[0.9375rem] font-bold leading-tight text-[var(--text)]">Честная цифра</span>
      <span class="mt-0.5 block text-[0.75rem] leading-snug text-[var(--text-muted)]">
        Видно, откуда взялось каждое число
      </span>
    </span>
    <span class="flex shrink-0 items-center gap-[4px]" aria-hidden="true">
      <span
        v-for="(s, i) in STEPS"
        :key="s"
        class="h-[8px] w-[18px] rounded-full"
        :style="{ background: i < filled ? 'var(--text)' : 'var(--line)' }"
      ></span>
    </span>
  </button>

  <button
    v-else
    type="button"
    class="inline-flex min-h-[32px] items-center gap-2 rounded-full px-2.5 py-1"
    :style="{ background: onDark ? 'var(--line-on-color)' : 'var(--surface-2)' }"
    :aria-label="`Честная цифра: ${filled} из 3`"
    @click="$emit('open')"
  >
    <span
      class="text-[0.625rem] font-bold uppercase tracking-wide"
      :style="{ color: onDark ? 'var(--ink-on-color)' : 'var(--text-muted)' }"
    >Честная цифра</span>
    <span class="flex items-center gap-[3px]" aria-hidden="true">
      <span
        v-for="(s, i) in STEPS"
        :key="s"
        class="h-[6px] w-[14px] rounded-full"
        :style="{
          background: i < filled
            ? (onDark ? 'var(--ink-on-color)' : 'var(--text)')
            : (onDark ? 'var(--surface-black)' : 'var(--line)'),
        }"
      ></span>
    </span>
  </button>
</template>
