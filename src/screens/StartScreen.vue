<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import WeekWidget from '../components/WeekWidget.vue'
import BrandLockup from '../components/BrandLockup.vue'
import BottomSheet from '../components/BottomSheet.vue'
import WhereGrowthSheet from '../components/WhereGrowthSheet.vue'
import { BRAND } from '../i18n/brand.js'
import { TRACK } from '../data/runscaleCounters.js'
import { formatInt, plural } from '../i18n/format.js'

// Вход. Один экран, один путь и ни одного слова, которое пришлось бы
// объяснять голосом. Что здесь принято и что отменено — `docs/ВИТРИНА-вход.md`.
//
// Сверху вниз читается как одна мысль:
//   вот кто говорит → день делает месяц → вот что это за предмет → вот твои
//   дни → закрой план → а вот кто считает.
//
// Три вещи, которых здесь больше нет, и причины:
//   · часы — дату несёт календарь, живость системы несёт число на кнопке;
//     часы делали третьим то, что уже сделано дважды, и съедали высоту героя;
//   · три счётчика (проверки · сигналы · разборы) — они мерили работу
//     Ранскейла и от прихода человека не росли; уехали на «Рост 24/7»,
//     где у них есть контекст;
//   · знак «Модуль роста» в подвале — забирал внимание витрины и вёл
//     на страницу, где Трека нет. Живёт в шторке «Где Рост».
//
// Имя продукта набирается связкой `BrandLockup`, а не картинкой: файл
// `runscale-mini.svg` кончился вместе с прежним именем продукта.

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

const countWord = computed(() =>
  `${plural(TRACK.businesses, ...TRACK.forms)} ${TRACK.tail}`)
const countNumber = computed(() => formatInt(TRACK.businesses))

// Шторка «Где Рост»: кто считает, чем считает и откуда число на кнопке.
const whereOpen = ref(false)

// ── Строки, которые обязаны быть в одну строку ──────────────────────────────
//
// Высказывание набирается во всю ширину экрана, дескриптор под ним — во всю
// доступную, но не крупнее своего кегля. Ни то, ни другое нельзя задать
// в css: ширина зависит от экрана, а начертание грузится отдельно и до его
// появления фолбэк меряется по-своему. Поэтому строка меряется по факту
// и подгоняется — после монтирования, после загрузки начертаний и при
// каждом изменении ширины.
//
// Замер идёт на пробном кегле, а не на текущем: масштабировать от уже
// подогнанного значит копить ошибку с каждым пересчётом.
const PROBE = 100

const heroBox = ref(null)
const heroText = ref(null)
const tagBox = ref(null)
const tagText = ref(null)

function fit(boxRef, elRef, minPx, maxPx) {
  const box = boxRef.value
  const el = elRef.value
  if (!box || !el) return
  const avail = box.clientWidth
  if (!avail) return
  el.style.fontSize = `${PROBE}px`
  const w = el.scrollWidth
  if (!w) return
  const size = Math.min(maxPx, Math.max(minPx, Math.floor((PROBE * avail) / w)))
  el.style.fontSize = `${size}px`
}

function fitAll() {
  fit(heroBox, heroText, 28, 96)
  fit(tagBox, tagText, 13, 18)
}

// ── Заставка ────────────────────────────────────────────────────────────────
//
// Начертания грузятся отдельно, и до их появления экран собирался рывком:
// сперва фолбэк, потом резко буквы во всю ширину. Первое, что видит человек,
// не должно дёргаться. Страховка по времени обязательна: если браузер
// не отдаст начертания вовсе, экран обязан открыться всё равно — показать
// витрину с неготовым шрифтом честнее, чем держать человека на заставке.
const ready = ref(false)
let timer = null

function onFonts() {
  fitAll()
  ready.value = true
}

onMounted(() => {
  fitAll()
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(onFonts).catch(onFonts)
  } else onFonts()
  timer = setTimeout(() => { ready.value = true }, 4000)
  if (typeof window !== 'undefined') window.addEventListener('resize', fitAll)
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  if (typeof window !== 'undefined') window.removeEventListener('resize', fitAll)
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
    <p class="text-[0.8125rem] text-[var(--text-muted)]">Загружаем {{ BRAND.header }}</p>
  </div>

  <div class="min-h-[100dvh] w-full flex justify-center bg-[var(--bg)]">
    <div
      class="w-full max-w-[430px] min-h-[100dvh] flex flex-col px-6
             pl-[max(1.5rem,env(safe-area-inset-left))]
             pr-[max(1.5rem,env(safe-area-inset-right))]
             pt-[max(1.5rem,env(safe-area-inset-top))]
             pb-[max(1rem,env(safe-area-inset-bottom))]"
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
      <main class="flex flex-1 flex-col justify-center gap-5 py-6">
        <div class="flex flex-col items-center gap-3 text-center">
          <!-- Прописными и без точки: строка работает вывеской, а вывеска
               предложением не заканчивается. Начертание на ступень легче
               брендового, зато с разгонкой — плотный жирный прописной набор
               во всю ширину читается криком, а высказывание не кричит. -->
          <div ref="heroBox" class="w-full">
            <h1
              ref="heroText"
              class="inline-block whitespace-nowrap font-label leading-[0.95] tracking-[0.06em] text-[var(--text)]"
            >{{ BRAND.hero }}</h1>
          </div>

          <!-- Дескриптор машинным начертанием: он называет предмет, а не
               произносит его голосом бренда. -->
          <div ref="tagBox" class="w-full">
            <p
              ref="tagText"
              class="inline-block whitespace-nowrap font-mono font-semibold leading-snug text-[var(--text-secondary)]"
            >{{ BRAND.tagline }}</p>
          </div>
        </div>

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

      <!-- Кто считает — последней строкой, внизу. Вопрос «а вы кто» возникает
           после того, как человек посмотрел на предложение, а не до.
           Обводки нет, отделяет тень: плашка лежит поверх холста, а не
           врезана в него. Шеврон вниз — туда, откуда выедет шторка. -->
      <footer class="pt-5">
        <button
          type="button"
          class="flex min-h-[68px] w-full items-center gap-3 rounded-2xl bg-[var(--surface)]
                 px-4 py-4 text-left shadow-lg active:opacity-70"
          @click="whereOpen = true"
        >
          <!-- Число в квадратном знаке: цифра держит собственный вес
               и не тонет в строке, а строка обходится без карточки. -->
          <span class="flex items-center gap-2">
            <span
              class="flex h-[1.7em] min-w-[1.7em] items-center justify-center rounded-[0.45em]
                     px-[0.3em] text-[0.9375rem] font-bold leading-none tabular-nums"
              :style="{ background: 'var(--text)', color: 'var(--ink-on-color)' }"
            >{{ countNumber }}</span>
            <span class="text-[0.875rem] leading-none text-[var(--text-secondary)]">
              {{ countWord }}
            </span>
          </span>
          <span class="ml-auto flex shrink-0 items-center gap-1">
            <span class="text-[1.0625rem] font-bold leading-none text-[var(--text)]">
              {{ BRAND.question }}
            </span>
            <ChevronDown
              class="h-5 w-5 shrink-0 text-[var(--text-muted)]"
              :stroke-width="2.5"
              aria-hidden="true"
            />
          </span>
        </button>
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
