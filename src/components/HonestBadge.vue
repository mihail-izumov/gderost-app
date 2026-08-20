<script setup>
import { computed } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import HonestDigitIcon from './icons/HonestDigitIcon.vue'

// Плашка «Честная цифра» — петля роста, показанная знаком.
//
// Кольцо вокруг сердца — четыре дуги петли: данные → сигнал → действие →
// замер. Горит то, что уже крутится; подпись называет состояние и ближайший
// шаг. Условия каждого сегмента — `composables/honestLoop.js`, там они
// выводятся из состояния месяца, а не выставляются руками.
//
// Прежде кольцо показывало лестницу статусов «со слов → посчитано →
// проверено» — и стояло на двойке всю жизнь пользователя: первые две ступени
// человек получает в первые минуты, третью приложение не ставит никогда.
// Шкала, которая не движется, — не шкала. Лестница осталась там, где она
// объясняет, а не изображает прогресс: у каждого числа в шторке
// происхождения и в сторис этой плашки.
//
// Плашка тёмная — единственная тёмная на «Сегодня»: состояние петли — то,
// ради чего человек открывает приложение каждый день, и ему положено
// читаться раньше белых карточек. Знак стоит во всю высоту плашки:
// он здесь и есть сообщение, текст при нём — подпись.
//
// Пилюля на чужом месяце говорит то же самое четырьмя короткими делениями:
// дугам на её высоте не хватило бы пикселей.

const props = defineProps({
  // Петля из composables/honestLoop.js: { segs, lit, note }.
  loop: { type: Object, required: true },
  // Тёмная подложка: пилюля на тёмной карточке.
  onDark: { type: Boolean, default: false },
  // Крупная плашка вместо пилюли.
  large: { type: Boolean, default: false },
  // Чужой месяц: подпись говорит о состоянии, не обращаясь к читателю.
  // «Внесите их» на экране получателя адресовано человеку, у которого этих
  // дней нет и быть не может.
  foreign: { type: Boolean, default: false },
})
defineEmits(['open'])

// Полная петля — зелёный (держим), неполная — жёлтый (мера
// и незавершённость). Красного нет: незамкнутая петля не ошибка,
// а место, где человек сейчас. Дуги горят одним цветом, а не четырьмя:
// цвет в системе несёт состояние, и четыре цвета сказали бы «четыре
// разных состояния» там, где состояние одно — сколько петли набрано.
const full = computed(() => props.loop.lit >= props.loop.segs.length)
const tone = computed(() => (full.value ? 'var(--positive)' : 'var(--warning)'))

// Крупная плашка красится состоянием целиком, а не держит его одним знаком
// в углу. Раньше она была графитовой при любой петле: состояние читалось
// только после того, как человек рассмотрел четыре дуги размером с ноготь.
// Цвет заливки виден с расстояния вытянутой руки, и это ровно та величина,
// ради которой экран открывают каждый день.
//
// Чернила на заливке — один цвет, приглушение делает прозрачность. Жёлтый
// держит тёмный текст, зелёный — белый; это правило системы, а не выбор
// на глаз.
const ink = computed(() => (full.value ? 'var(--ink-on-color)' : 'var(--accent-ink)'))
</script>

<template>
  <button
    v-if="large"
    type="button"
    class="flex min-h-[72px] w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left"
    :style="{ background: tone }"
    :aria-label="`Петля роста: ${loop.lit} из ${loop.segs.length}`"
    @click="$emit('open')"
  >
    <HonestDigitIcon
      class="h-12 w-12 shrink-0"
      :segs="loop.segs"
      :tone="ink"
      :idle="ink"
      :idle-opacity="0.3"
      :ink="ink"
    />
    <span class="min-w-0 flex-1">
      <span class="block text-[0.9375rem] font-bold leading-tight" :style="{ color: ink }">Честная цифра</span>
      <span class="mt-0.5 block text-[0.75rem] leading-snug" :style="{ color: ink, opacity: 0.8 }">{{ foreign ? (loop.noteForeign || loop.note) : loop.note }}</span>
    </span>
    <!-- Стрелка называет плашку нажимаемой. Без неё она читалась сообщением,
         и то, что за ней стоит объяснение петли, человек не находил. -->
    <ChevronRight class="h-5 w-5 shrink-0" :style="{ color: ink, opacity: 0.8 }" :stroke-width="2.5" aria-hidden="true" />
  </button>

  <button
    v-else
    type="button"
    class="inline-flex min-h-[32px] items-center gap-2 rounded-full px-2.5 py-1"
    :style="{ background: onDark ? 'var(--line-on-color)' : 'var(--surface-2)' }"
    :aria-label="`Петля роста: ${loop.lit} из ${loop.segs.length}`"
    @click="$emit('open')"
  >
    <span
      class="text-[0.625rem] font-bold uppercase tracking-wide"
      :style="{ color: onDark ? 'var(--ink-on-color)' : 'var(--text-muted)' }"
    >Честная цифра</span>
    <span class="flex items-center gap-[3px]" aria-hidden="true">
      <span
        v-for="s in loop.segs"
        :key="s.id"
        class="h-[6px] w-[11px] rounded-full"
        :style="{
          background: s.on
            ? (onDark ? 'var(--ink-on-color)' : 'var(--text)')
            : (onDark ? 'var(--surface-black)' : 'var(--line)'),
        }"
      ></span>
    </span>
  </button>
</template>
