<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import WeekWidget from '../components/WeekWidget.vue'
import BrandLockup from '../components/BrandLockup.vue'
import HeroBlock from '../components/HeroBlock.vue'
import DotMark from '../components/icons/DotMark.vue'
import BottomSheet from '../components/BottomSheet.vue'
import WhereGrowthSheet from '../components/WhereGrowthSheet.vue'
import { BRAND } from '../i18n/brand.js'
import { TRACK } from '../data/runscaleCounters.js'
import { formatInt } from '../i18n/format.js'
import { SHOWCASE, fill } from '../i18n/onboarding.js'

// Вход. Один экран, один путь и ни одного слова, которое пришлось бы
// объяснять голосом. Что здесь принято и что отменено — `docs/ВИТРИНА-вход.md`.
//
// Сверху вниз читается как одна мысль:
//   вот кто говорит → день делает месяц → вот что это за предмет → вот твои
//   дни → закрой план → а вот кто считает.
//
// Три вещи, которых здесь больше нет, и причины:
//   · часы — дату несёт календарь, живость системы несёт число на плашке;
//     часы делали третьим то, что уже сделано дважды, и съедали высоту;
//   · три счётчика (проверки · сигналы · разборы) — они мерили работу
//     Ранскеила и от прихода человека не росли; уехали на «Прогресс»,
//     где у них есть контекст;
//   · знак «Модуль роста» в подвале — забирал внимание витрины и вёл
//     на страницу, где Трека нет. Живёт в шторке «Где Рост».
//
// Блок «знак · высказывание · подпись» вынесен в `HeroBlock`: он же стоит
// на «Ультре», и две копии одной вёрстки разошлись бы молча.

defineEmits(['start'])

const MONTH_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
// Плашка подписана месяцем: остаток справа считается по месяцу, и диапазон
// недели над ним читался бы как подпись не к тем числам. Тем же месяцем
// подписана кнопка — она действует на карточку прямо над собой.
const monthTitle = computed(() => MONTH_RU[new Date().getMonth()])
const cta = computed(() => BRAND.cta(monthTitle.value))

const countNumber = computed(() => formatInt(TRACK.businesses))

// Шторка «Где Рост»: кто считает, чем считает и откуда число на плашке.
const whereOpen = ref(false)

// ── Заставка ────────────────────────────────────────────────────────────────
//
// Начертания грузятся отдельно, и до их появления экран собирался рывком:
// сперва фолбэк, потом резко буквы во всю ширину. Первое, что видит человек,
// не должно дёргаться. Страховка по времени обязательна: если браузер
// не отдаст начертания вовсе, экран обязан открыться всё равно — показать
// витрину с неготовым шрифтом честнее, чем держать человека на заставке.
const ready = ref(false)
let timer = null

onMounted(() => {
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { ready.value = true }).catch(() => { ready.value = true })
  } else ready.value = true
  timer = setTimeout(() => { ready.value = true }, 4000)
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <!-- Заставка держится поверх витрины, пока она не готова. Внизу — одна
       строка о том, что происходит: пустой экран с крутящимся знаком
       не сообщает ничего. Витрина под ней уже отрисована — иначе строки
       нечем было бы померить. -->
  <div
    v-if="!ready"
    class="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-5 bg-[var(--bg)]"
    role="status"
    aria-live="polite"
  >
    <BrandLockup size="1.75rem" class="gr-pulse" />
    <p class="text-[0.8125rem] text-[var(--text-muted)]">{{ fill(SHOWCASE.loading, '{продукт}', BRAND.header) }}</p>
  </div>

  <div class="min-h-[100dvh] w-full flex justify-center bg-[var(--bg)]">
    <!-- Отступ снизу равен верхнему: экран стоит в одинаковой рамке,
         и нижняя плашка не выглядит прижатой к краю. -->
    <div
      class="w-full max-w-[430px] min-h-[100dvh] flex flex-col px-6
             pl-[max(1.5rem,env(safe-area-inset-left))]
             pr-[max(1.5rem,env(safe-area-inset-right))]
             pt-[max(1.5rem,env(safe-area-inset-top))]
             pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <!-- Имя продукта стоит первым: до всякого высказывания человек обязан
           увидеть, кто говорит. -->
      <header class="flex justify-center">
        <BrandLockup size="2rem" />
      </header>

      <!-- Высказывание по центру оставшейся высоты: воздух над ним и под ним
           делится поровну, поэтому блок дышит и на 375, и на 430. Кнопка
           при этом остаётся в нижней половине экрана — в зоне большого
           пальца. Всё на одной оси: три разных выключки на первом экране
           читались бы как три разных голоса. -->
      <main class="flex flex-1 flex-col justify-center gap-5 py-3">
        <HeroBlock :lines="BRAND.hero" :tagline="BRAND.tagline" />

        <WeekWidget tone="black" :label="monthTitle" />

        <button
          type="button"
          class="min-h-[52px] w-full rounded-xl text-[1.0625rem] font-semibold"
          :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
          @click="$emit('start')"
        >{{ cta }}</button>

        <!-- Чего с человека не спросят и что не утечёт. Два возражения,
             от которых зависит, введёт он настоящие цифры или выдуманные. -->
        <p class="text-center font-mono text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
          {{ BRAND.honesty }}
        </p>
      </main>

      <!-- Приборная строка: слева показание, справа вход в справку.
           Плашка низкая и живёт по содержимому — весом она не спорит
           с главной кнопкой выше, а тень отделяет её от холста без обводки.
           Всё в строке одного кегля и одного веса: разный вес назначил бы
           одному из двух блоков старшинство, которого у него нет. -->
      <footer class="pt-3">
        <div
          class="flex w-full items-center gap-3 rounded-2xl bg-[var(--surface)]
                 px-3.5 py-2.5 shadow-lg"
        >
          <!-- Число в точечных скобках и машинным начертанием: скобки держат
               цифру, не заливая её плашкой, а моноширинный набор ставит её
               в тот же регистр, что и сами скобки, — это показание прибора,
               а не слово из фразы. -->
          <span class="flex items-center gap-2">
            <span class="flex items-center gap-[0.2em] text-[0.9375rem] leading-none">
              <DotMark kind="bracket-left" size="1.2em" class="text-[var(--text-muted)]" />
              <span class="font-mono font-normal tabular-nums text-[var(--text)]">{{ countNumber }}</span>
              <DotMark kind="bracket-right" size="1.2em" class="text-[var(--text-muted)]" />
            </span>
            <span class="font-label text-[0.9375rem] font-normal uppercase leading-none tracking-[0.06em] text-[var(--text-secondary)]">
              {{ TRACK.label }}
            </span>
          </span>

          <!-- Обводка вокруг имени и стрелки: нажимаемое в строке ровно одно,
               и границей сказано, что именно. -->
          <button
            type="button"
            class="ml-auto flex shrink-0 items-center gap-2 rounded-full border
                   border-[var(--line)] px-3 py-1.5 active:opacity-70"
            @click="whereOpen = true"
          >
            <span class="font-label text-[0.9375rem] font-normal uppercase leading-none tracking-[0.06em] text-[var(--text)]">
              {{ BRAND.question }}
            </span>
            <DotMark kind="arrow-down" size="0.4rem" class="text-[var(--text-muted)]" />
          </button>
        </div>
      </footer>
    </div>
  </div>

  <BottomSheet :open="whereOpen" @close="whereOpen = false">
    <WhereGrowthSheet @close="whereOpen = false" />
  </BottomSheet>
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
