<script setup>
import { computed } from 'vue'
import WeekWidget from '../components/WeekWidget.vue'
import LiveClock from '../components/LiveClock.vue'
import BrandLockup from '../components/BrandLockup.vue'
import { logoStyle } from '../composables/brandMask.js'
import { BRAND } from '../i18n/brand.js'

// Вход. Один путь и ни одного слова, которое пришлось бы объяснять голосом.
//
// Порядок сверху вниз: имя продукта → живое время → высказывание во всю ширину →
// живая неделя → действие → строка условий → знак системы.
//
// Иерархия взята с продуктовых страниц Apple. Имя продукта стоит первым и мелко,
// высказывание — крупно и на всю ширину карточки под ним, как «Mac mini» над
// снимком устройства. Ширину задаёт плашка недели: строка, набранная ровно по её
// краям, читается как заголовок этой карточки, а не как отдельная надпись.
//
// Живое время под именем доказывает, что экран работает прямо сейчас, — и делает
// это молча, без подписи «данные актуальны».

defineEmits(['start'])

const MONTH_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
// Плашка подписана месяцем: остаток справа считается по месяцу, и диапазон
// недели над ним читался бы как подпись не к тем числам.
const monthTitle = computed(() => MONTH_RU[new Date().getMonth()])

const logo = logoStyle(24)
</script>

<template>
  <div class="min-h-[100dvh] w-full flex justify-center bg-[var(--bg)]">
    <div
      class="w-full max-w-[430px] min-h-[100dvh] flex flex-col px-4
             pl-[max(1rem,env(safe-area-inset-left))]
             pr-[max(1rem,env(safe-area-inset-right))]
             pt-[max(1rem,env(safe-area-inset-top))]
             pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <header class="flex flex-col items-center gap-2">
        <BrandLockup :size="30" tone="var(--text)" />
        <LiveClock />
      </header>

      <!-- Герой по центру оставшейся высоты: воздух над ним и под ним делится
           поровну, поэтому блок дышит и на 375, и на 430. Кнопка при этом
           остаётся в нижней половине экрана — в зоне большого пальца. -->
      <main class="flex flex-1 flex-col justify-center gap-4 py-6">
        <!-- Высказывание набирается по ширине плашки: 20vw при колонке 430
             даёт строку впритык к её краям, ниже 375 срабатывает нижняя
             граница clamp и строка сжимается вместе с экраном. -->
        <h1
          class="font-brand w-full text-center font-bold uppercase leading-[0.86] tracking-[-0.01em]
                 text-[var(--text)] bc-fade-in"
          :style="{ fontSize: 'clamp(3.25rem, 21vw, 5.5rem)' }"
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
          <span class="block bg-[var(--text-muted)]" :style="logo" aria-hidden="true" />
        </a>
      </footer>
    </div>
  </div>
</template>
