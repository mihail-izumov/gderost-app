<script setup>
import { computed, onMounted, ref } from 'vue'
import WeekWidget from '../components/WeekWidget.vue'
import LiveClock from '../components/LiveClock.vue'
import CountersCard from '../components/CountersCard.vue'
import { chevronStyle, logoStyle } from '../composables/brandMask.js'
import { BRAND } from '../i18n/brand.js'

// Вход. Один экран, один путь и ни одного слова, которое пришлось бы
// объяснять голосом.
//
// Порядок сверху вниз повторяет образец Михаила (`materials/вход-2026-08-14/`):
// карточка системы (имя витрины · счётчики · живое время) → имя продукта
// во всю ширину → живая неделя месяца → действие → условия и обещание →
// знак «Модуль роста».
//
// Имя продукта стоит одним файлом `public/runscale-mini.svg` — тем самым,
// что прислан образцом. Плашка «РАНСКЕЙЛ» и слово «МИНИ» набраны в нём
// брендовым начертанием и связаны между собой; собирать эту связку из двух
// элементов вёрстки значит каждый раз заново подбирать кегль и отбивку.
// Синий внутри файла — тот же #2563EB, что живёт токеном `--action`.
//
// Карточка сверху отвечает на вопрос «кто это говорит» до того, как он
// прозвучит: три числа работающей системы и время, которое идёт прямо сейчас.

defineEmits(['start'])

const MONTH_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
// Плашка подписана месяцем: остаток справа считается по месяцу, и диапазон
// недели над ним читался бы как подпись не к тем числам.
const monthTitle = computed(() => MONTH_RU[new Date().getMonth()])

const logo = logoStyle(24)
const chevron = chevronStyle(52)
const lockup = `${(import.meta.env && import.meta.env.BASE_URL) || '/'}runscale-mini.svg`

// Прелоадер. Имя продукта — большой файл, начертания грузятся отдельно, и до
// их появления экран собирался рывком: сперва пустое место, потом резко буквы
// во всю ширину. Первое, что видит человек, не должно дёргаться.
//
// Ждём два события: картинку имени и начертания. Страховка по времени
// обязательна — если браузер не отдаст ни того, ни другого, экран обязан
// открыться всё равно: показать витрину с неготовым шрифтом честнее,
// чем держать человека на заставке.
const ready = ref(false)
let pending = 2
function step() { if (--pending <= 0) ready.value = true }

onMounted(() => {
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(step).catch(step)
  } else step()
  setTimeout(() => { ready.value = true }, 4000)
})
</script>

<template>
  <!-- Заставка держится поверх витрины, пока она не готова. Внизу — одна
       строка о том, что происходит: пустой экран с крутящимся знаком
       не сообщает ничего. -->
  <div
    v-if="!ready"
    class="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-5 bg-[var(--bg)]"
    role="status"
    aria-live="polite"
  >
    <span class="block bg-[var(--text)] gr-pulse" :style="chevron" aria-hidden="true" />
    <p class="text-[0.8125rem] text-[var(--text-muted)]">Загружаем Ранскейл Мини</p>
  </div>

  <div class="min-h-[100dvh] w-full flex justify-center bg-[var(--bg)]">
    <div
      class="w-full max-w-[430px] min-h-[100dvh] flex flex-col px-6
             pl-[max(1.5rem,env(safe-area-inset-left))]
             pr-[max(1.5rem,env(safe-area-inset-right))]
             pt-[max(1.5rem,env(safe-area-inset-top))]
             pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <!-- Карточка системы: имя витрины шапкой, под ним числа и время.
           Внутренние блоки белые на светло-сером — вложенность видна тоном,
           без второй обводки. -->
      <header class="rounded-3xl border border-[var(--rim)] bg-[var(--surface-2)] p-2.5 pt-3">
        <h1 class="text-center text-[1.5rem] font-bold leading-none text-[var(--text)]">
          {{ BRAND.question }}
        </h1>
        <CountersCard class="mt-3 w-full" :bordered="false" />
        <!-- Обёртка именно div: у часов корень — абзац, а абзац внутри абзаца
             браузер закрывает молча и ломает вёрстку. -->
        <div class="mt-2 rounded-2xl bg-[var(--surface)] py-3">
          <LiveClock />
        </div>
      </header>

      <!-- Герой по центру оставшейся высоты: воздух над ним и под ним делится
           поровну, поэтому блок дышит и на 375, и на 430. Кнопка при этом
           остаётся в нижней половине экрана — в зоне большого пальца. -->
      <main class="flex flex-1 flex-col justify-center gap-5 py-8">
        <img
          :src="lockup"
          :alt="BRAND.header"
          class="block w-full bc-fade-in"
          decoding="async"
          @load="step"
          @error="step"
        />

        <WeekWidget tone="black" :label="monthTitle" />

        <button
          type="button"
          class="min-h-[52px] w-full rounded-xl text-[1.0625rem] font-semibold"
          :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
          @click="$emit('start')"
        >{{ BRAND.cta }}</button>

        <!-- Условия и обещание одним блоком: сперва чего с человека не спросят,
             следом что он получит. Машинное начертание отделяет служебную
             строку от голоса продукта выше. -->
        <div class="text-center font-mono text-[0.8125rem] leading-relaxed">
          <p class="text-[var(--text-secondary)]">{{ BRAND.honesty }}</p>
          <p class="font-bold text-[var(--text)]">{{ BRAND.promise }}</p>
        </div>
      </main>

      <!-- Знак системы, за которой стоит приложение. Обёртка добирает тач-таргет
           до 44pt: сам знак 24px высотой. rel="noopener noreferrer" обязателен
           при target="_blank" — иначе открытая страница получает доступ
           к window.opener. -->
      <footer class="flex justify-center">
        <a
          :href="BRAND.siteUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex min-h-[44px] items-center justify-center px-4 active:opacity-70"
          :aria-label="BRAND.siteLabel"
        >
          <span class="block bg-[var(--text)]" :style="logo" aria-hidden="true" />
        </a>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* Знак дышит, а не крутится: вращение обещает процесс с концом, которого
   приложение не знает. При выключенной анимации знак просто стоит. */
@keyframes gr-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
}
.gr-pulse { animation: gr-pulse 1.4s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .gr-pulse { animation: none; }
}
</style>
