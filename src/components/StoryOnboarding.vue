<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ChevronLeft, X } from 'lucide-vue-next'

// Сторис-онбординг — формат Whoosh: полноэкранные карточки,
// сегментный прогресс сверху с таймером, кнопка закрытия в конце полосы
// прогресса, тап листает вперёд и назад, удержание ставит на паузу,
// внизу говорящая кнопка.
//
// Это второй законный способ объяснять — вне экрана и по запросу: правило тона
// запрещает абзацы на экране, а не знание как таковое. Слайд говорит одну
// мысль и даёт одно действие.
//
// Таймер уважает `prefers-reduced-motion`: без анимаций сторис листаются
// только руками, полоса показывает позицию, а не время.

const props = defineProps({
  open: { type: Boolean, default: false },
  // [{ id, title, text, cta }] — cta последнего слайда говорит действием.
  slides: { type: Array, required: true },
  // Ручной режим: таймера нет, листает только кнопка, и с любого слайда,
  // включая первый, можно вернуться назад. Так работает вход: там сюжет —
  // не развлечение между делом, а объяснение перед первым полем, и уносить
  // его из-под глаз по таймеру нельзя. С первого слайда «назад» ведёт
  // на витрину — это и есть шаг назад.
  manual: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'done', 'back'])

const DURATION = 6000
const i = ref(0)
const progress = ref(0) // 0..1 текущего сегмента

const reduced = typeof window !== 'undefined'
  && window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let raf = null
let startedAt = 0
let pausedAt = null

function tick(now) {
  if (pausedAt !== null) { raf = requestAnimationFrame(tick); return }
  progress.value = Math.min(1, (now - startedAt) / DURATION)
  if (progress.value >= 1) {
    if (i.value < props.slides.length - 1) { next() } else { stopTimer() }
    return
  }
  raf = requestAnimationFrame(tick)
}

function startTimer() {
  stopTimer()
  if (props.manual || reduced) { progress.value = 1; return }
  progress.value = 0
  startedAt = performance.now()
  raf = requestAnimationFrame(tick)
}

function stopTimer() {
  if (raf) cancelAnimationFrame(raf)
  raf = null
}

function next() {
  if (i.value < props.slides.length - 1) { i.value += 1; startTimer() }
  else emit('done')
}
function prev() {
  // С первого слайда шаг назад ведёт наружу: в ручном режиме это витрина,
  // в остальных — просто закрытие. Кнопка, которая на первом экране ничего
  // не делает, читается как поломка.
  if (i.value === 0) { emit(props.manual ? 'back' : 'close'); return }
  i.value -= 1
  startTimer()
}

// Удержание — пауза: человек дочитывает, таймер ждёт.
function hold() {
  if (pausedAt === null) pausedAt = performance.now()
}
function release() {
  if (pausedAt !== null) { startedAt += performance.now() - pausedAt; pausedAt = null }
}

// Тап: левая треть — назад, остальное — вперёд. Как в любых сторис,
// поэтому объяснять зоны не нужно. В ручном режиме тап не листает: там
// переключение принадлежит кнопкам, и случайное касание не должно уносить
// объяснение, которое человек ещё читает.
function tap(e) {
  if (props.manual) return
  const x = e.clientX - e.currentTarget.getBoundingClientRect().left
  if (x < e.currentTarget.clientWidth / 3) prev()
  else next()
}

watch(() => props.open, (v) => {
  if (v) { i.value = 0; startTimer() } else stopTimer()
})
onBeforeUnmount(stopTimer)

const slide = computed(() => props.slides[i.value] || null)
const fill = (n) => (n < i.value ? 1 : n > i.value ? 0 : progress.value)
</script>

<template>
  <Teleport to="body">
    <!-- Холст на весь экран, содержимое — в мобильной колонке по центру.
         Приложение везде живёт в 430 пикселях, и сторис, растянутые на всю
         ширину рабочего стола, выпадали из него единственным местом. -->
    <div
      v-if="open && slide"
      class="fixed inset-0 z-[70] flex justify-center"
      :style="{ background: 'var(--surface-black)', color: 'var(--ink-on-color)' }"
      role="dialog"
      aria-modal="true"
      :aria-label="slide.title"
    >
    <div class="flex w-full max-w-[430px] flex-col">
      <!-- Полоса прогресса с закрытием в её конце — паттерн Whoosh. -->
      <div
        class="flex items-center gap-1.5 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
      >
        <button
          v-if="manual"
          type="button"
          class="-my-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          aria-label="Шаг назад"
          @click="prev"
        >
          <ChevronLeft class="h-5 w-5" :style="{ color: 'var(--ink-on-color-muted)' }" :stroke-width="2.25" aria-hidden="true" />
        </button>
        <span
          v-for="(s, n) in slides"
          :key="s.id"
          class="h-[3px] flex-1 overflow-hidden rounded-full"
          :style="{ background: 'var(--line-on-color)' }"
        >
          <span
            class="block h-full rounded-full"
            :style="{ width: `${fill(n) * 100}%`, background: 'var(--ink-on-color)' }"
          ></span>
        </span>
        <button
          type="button"
          class="-my-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          aria-label="Закрыть"
          @click="emit('close')"
        >
          <X class="h-5 w-5" :style="{ color: 'var(--ink-on-color-muted)' }" :stroke-width="2" aria-hidden="true" />
        </button>
      </div>

      <!-- Слайд. Тап листает, удержание останавливает таймер. -->
      <div
        class="flex flex-1 flex-col justify-center px-6 pb-6 select-none"
        @click="tap"
        @pointerdown="hold"
        @pointerup="release"
        @pointercancel="release"
      >
        <p
          v-if="slide.kicker"
          class="text-[0.8125rem] font-bold uppercase tracking-wide"
          :style="{ color: 'var(--action)' }"
        >{{ slide.kicker }}</p>
        <h2 class="mt-2 text-[1.75rem] font-bold leading-tight">{{ slide.title }}</h2>
        <p class="mt-3 max-w-[24rem] text-[1.0625rem] leading-snug" :style="{ color: 'var(--ink-on-color-muted)' }">
          {{ slide.text }}
        </p>
        <p v-if="slide.value" class="mt-4 text-[2rem] font-bold tabular-nums">{{ slide.value }}</p>
      </div>

      <div class="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          class="min-h-[52px] w-full rounded-full text-[1.0625rem] font-bold"
          :style="{ background: 'var(--ink-on-color)', color: 'var(--surface-black)' }"
          @click="next"
        >{{ slide.cta || 'Дальше' }}</button>
      </div>
      </div>
    </div>
  </Teleport>
</template>
