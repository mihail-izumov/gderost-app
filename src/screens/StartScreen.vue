<script setup>
import { computed } from 'vue'
import WeekWidget from '../components/WeekWidget.vue'
import LiveClock from '../components/LiveClock.vue'
import CountersCard from '../components/CountersCard.vue'
import BrandLockup from '../components/BrandLockup.vue'
import { logoStyle } from '../composables/brandMask.js'
import { BRAND } from '../i18n/brand.js'

// Вход. Один путь и ни одного слова, которое пришлось бы объяснять голосом.
//
// Иерархия взята у продуктовых страниц Apple: имя продукта строкой среднего
// кегля, под ним высказывание во всю ширину. Имя и высказывание не конкурируют,
// потому что различаются масштабом, а не громкостью.
//
// Порядок сверху вниз: живое время → счётчики системы → имя → высказывание →
// живая неделя → действие. Первые два элемента — доказательства: время идёт
// прямо сейчас, счётчики показывают, что за приложением работает система.
// Всё остальное прижато вниз, чтобы кнопка попадала в зону большого пальца
// при телефоне в одной руке.

defineEmits(['start'])

const MONTH_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
// Плашка подписана месяцем: остаток справа от заголовка считается по месяцу,
// и диапазон недели над ними читался бы как подпись не к тем числам.
const monthTitle = computed(() => MONTH_RU[new Date().getMonth()])

const logo = logoStyle(24)
</script>

<template>
  <div class="min-h-[100dvh] w-full flex justify-center bg-[var(--bg)]">
    <div
      class="w-full max-w-[430px] min-h-[100dvh] flex flex-col px-4
             pl-[max(1rem,env(safe-area-inset-left))]
             pr-[max(1rem,env(safe-area-inset-right))]
             pt-[max(0.75rem,env(safe-area-inset-top))]
             pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <LiveClock />

      <div class="mt-3">
        <CountersCard />
      </div>

      <!-- Герой прижат вниз: кнопка обязана попадать в зону пальца -->
      <main class="flex flex-1 flex-col justify-end gap-4 pb-1 pt-6">
        <BrandLockup :size="26" tone="var(--text)" />

        <h1
          class="font-brand font-bold leading-[0.9] tracking-[-0.03em] text-[var(--text)] bc-fade-in"
          :style="{ fontSize: 'clamp(2.75rem, 19vw, 5rem)' }"
        >{{ BRAND.question }}</h1>

        <WeekWidget tone="black" :label="monthTitle" />

        <button
          type="button"
          class="min-h-[52px] w-full rounded-xl text-[1.0625rem] font-semibold"
          :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
          @click="$emit('start')"
        >{{ BRAND.cta }}</button>

        <p class="text-center text-[0.8125rem] text-[var(--text-secondary)]">
          {{ BRAND.honesty }}
        </p>
      </main>

      <!-- Знак системы, за которой стоит приложение. Обёртка добирает
           тач-таргет до 44pt: сам знак 24px высотой.
           rel="noopener noreferrer" обязателен при target="_blank" —
           иначе открытая страница получает доступ к window.opener. -->
      <footer class="flex justify-center pt-4">
        <a
          :href="BRAND.siteUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex min-h-[44px] items-center justify-center px-4 active:opacity-70"
          :aria-label="BRAND.siteLabel"
        >
          <span class="block bg-[var(--text-muted)]" :style="logo" aria-hidden="true" />
        </a>
      </footer>
    </div>
  </div>
</template>
