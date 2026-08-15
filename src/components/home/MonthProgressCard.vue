<script setup>
import { computed, ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import MonthProgressSlide from './MonthProgressSlide.vue'
import ConnectBusinessModal from '../business/ConnectBusinessModal.vue'
import { monthCap, plural } from '../../i18n/home.js'

// Дека месяца — свайп-карусель «где месяц» В РУБЛЯХ И ДНЯХ.
// Перенесено из рабочего Ранскейла.
//
// Экран 1 — ваш бизнес-юнит, дальше по экрану на юнит. Заголовок слайда
// называет, чьи это числа; точки внизу показывают, сколько экранов.
//
// Зачем отдельно от виджетов ниже: те дают только проценты. Здесь ни одного
// процента — рубли, дни и разрез по юнитам, которого в виджетах нет.
//
// Бейдж считает ОСТАВШИЕСЯ дни, а не пройденные: «прошло 27 из 31» —
// констатация, «осталось 4 дня» — то, чем можно распорядиться. Месяц закрыт →
// так и пишем: «осталось 0» читалось бы как ошибка, а не как завершённый месяц.
//
// ОТЛИЧИЕ ОТ ОРИГИНАЛА, названное вслух: второй слот здесь заперт. Юнит один,
// и вместо выдуманных чисел за размытием стоит кнопка «Подключить» — та же,
// что в меню чипа бизнеса. Возможность видна, система нигде не врёт.

const props = defineProps({
  // [{ key, title, fact, plan, forecast, goal }]
  slides: { type: Array, default: () => [] },
  month: { type: String, default: '' },
  daysLeft: { type: Number, default: null },
  // Показать запертый слот второго юнита следующим экраном
  lockedSlot: { type: Boolean, default: true },
})

const idx = ref(0)
const track = ref(null)
const connectOpen = ref(false)
// Сигнал слайдам «снять подсветку». Дека дёргает его при любой смене экрана:
// выделение относится к конкретной полосе, переносить его на соседний юнит —
// врать про то, что выбрано.
const resetToken = ref(0)

const screens = computed(() => {
  const list = props.slides.map((s) => ({ ...s, locked: false }))
  if (props.lockedSlot) list.push({ key: '__locked__', title: 'Все бизнес-юниты', locked: true })
  return list
})
const many = computed(() => screens.value.length > 1)
const current = computed(() => screens.value[Math.min(idx.value, screens.value.length - 1)] || null)
const monthLabel = computed(() => (props.month ? monthCap(props.month) : ''))

const daysWord = (n) =>
  `${n} ${plural(n, ['день', 'дня', 'дней'])} с сегодня`

const daysBadge = computed(() => {
  if (props.daysLeft == null) return ''
  if (props.daysLeft === 0) return 'Месяц закрыт'
  return daysWord(props.daysLeft)
})

// Индекс активного экрана — из позиции прокрутки. Слушаем сам скролл,
// а не касания: так одинаково работают свайп на телефоне, трекпад
// на десктопе и программная прокрутка по тапу в точку.
function onScroll(e) {
  const el = e.target
  const w = el.clientWidth || 1
  const next = Math.max(0, Math.min(screens.value.length - 1, Math.round(el.scrollLeft / w)))
  if (next !== idx.value) resetToken.value += 1
  idx.value = next
}
function goTo(i) {
  if (i !== idx.value) resetToken.value += 1
  idx.value = i
  const el = track.value
  if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
}
</script>

<template>
  <section class="rounded-[22px] bg-[var(--surface)] px-4 pb-3 pt-3 shadow-sm">
    <!-- Шапка. Главное — МЕСЯЦ: карта про месяц, а юнит лишь уточняет, чей срез. -->
    <div class="mb-2.5 flex items-start justify-between gap-2">
      <span class="flex min-w-0 flex-col">
        <h3 class="truncate text-[0.9375rem] font-bold leading-tight text-[var(--text)]">{{ monthLabel || '—' }}</h3>
        <span data-test="month-deck-scope" class="truncate text-[0.6875rem] text-[var(--text-muted)]">
          {{ current?.title || '' }}
        </span>
      </span>
      <span
        v-if="daysBadge"
        data-test="month-deck-days"
        class="shrink-0 whitespace-nowrap rounded-full bg-[var(--surface-2)] px-2 py-[3px] text-[0.6875rem] font-semibold text-[var(--text-secondary)]"
      >{{ daysBadge }}</span>
    </div>

    <div
      ref="track"
      data-test="month-deck-track"
      class="bc-deck flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      role="group"
      aria-roledescription="карусель"
      aria-label="Месяц по бизнес-юнитам"
      @scroll.passive="onScroll"
    >
      <div
        v-for="(s, i) in screens"
        :key="s.key"
        class="w-full shrink-0 snap-center"
        role="group"
        aria-roledescription="слайд"
        :aria-label="`${s.title}, ${i + 1} из ${screens.length}`"
      >
        <MonthProgressSlide
          v-if="!s.locked"
          :fact="s.fact"
          :plan="s.plan"
          :forecast="s.forecast"
          :goal="s.goal"
          :reset-token="resetToken"
        />

        <!-- Запертый слот: одна кнопка и пустое место. Раньше под ней лежала
             размытая полоса с подставными числами — она читалась как чужие
             данные, которые почему-то спрятали, а её размытие вылезало жёлтым
             хвостом на соседний экран деки (маска блюра выходит за края слайда,
             а лента прокрутки его не обрезает). Ни данных, ни артефакта. -->
        <div v-else class="flex min-h-[104px] items-center justify-center">
          <button
            type="button"
            data-test="deck-connect"
            class="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--rim)] px-4 text-[0.9375rem] font-semibold text-[var(--text)] active:bg-[var(--surface-2)]"
            @click="connectOpen = true"
          >
            <Plus class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
            Подключить
          </button>
        </div>
      </div>
    </div>

    <!-- Точки — сколько экранов и где мы. Тап доводит до экрана; область тапа
         растянута до 44pt по высоте строки, сама точка мелкая. -->
    <div v-if="many" class="mt-2 flex items-center justify-center gap-1.5" data-test="month-deck-dots">
      <button
        v-for="(s, i) in screens"
        :key="s.key"
        type="button"
        class="flex h-6 w-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-muted)]"
        :aria-label="`Показать: ${s.title}`"
        :aria-current="i === idx ? 'true' : undefined"
        @click="goTo(i)"
      >
        <span
          class="h-[6px] w-[6px] rounded-full transition-colors"
          :class="i === idx ? 'bg-[var(--text)]' : 'bg-[var(--line)]'"
        ></span>
      </button>
    </div>

    <ConnectBusinessModal :open="connectOpen" @close="connectOpen = false" />
  </section>
</template>

<style scoped>
/* Полосу прокрутки прячем — навигация жестом и точками. */
.bc-deck { scrollbar-width: none; }
.bc-deck::-webkit-scrollbar { display: none; }
</style>
