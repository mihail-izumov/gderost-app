<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import NavigationBar from './NavigationBar.vue'
import TabBar from './TabBar.vue'
import CalDateIcon from './icons/CalDateIcon.vue'
import { ArrowDown } from 'lucide-vue-next'
import { hardReload } from '../composables/useAppRefresh.js'

// Оболочка приложения. Перенесена из рабочего Ранскеила.
//
// Принимает конфиг вкладок, активную вкладку и опциональную под-страницу.
// Под-страница имеет приоритет над вкладкой.
//
// Скролл живёт в оболочке, а не на странице: таб-бар плавает над ней и
// не уезжает с содержимым. При смене экрана прокрутка возвращается к верху,
// крупный заголовок снова раскрывается — экран, открытый с середины, читается
// как продолжение предыдущего.
//
// Ушли ниже первого экрана — капсула таб-бара уезжает влево и на её месте
// остаётся круглая кнопка с сегодняшним числом (механика ленты Reddit):
// человек читает длинную страницу, и три подписи поверх неё отбирают полосу
// содержимого. Тап по кругу возвращает панель, возврат к верху — тоже.
//
// Потянули страницу вниз от самого верха — приложение перезагружается свежей
// версией, как в мобильном браузере. Жест привычный, и искать кнопку
// обновления ради этого не нужно. Устройство жеста и авария, которая на нём
// случилась, разобраны ниже, у самих обработчиков.

const props = defineProps({
  tabs: { type: Array, required: true },
  active: { type: String, required: true },
  subView: { type: String, default: null },
  subViews: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:active', 'back'])

const activeTab = computed(() => props.tabs.find((t) => t.id === props.active) ?? props.tabs[0])

const current = computed(() => {
  if (props.subView && props.subViews[props.subView]) {
    return { ...props.subViews[props.subView], _isSub: true }
  }
  return activeTab.value
})

const scrollEl = ref(null)
const collapsed = ref(false)
const COLLAPSE_AT = 28 // px прокрутки, после которых крупный заголовок сворачивается

// Панель сворачивается заметно ниже заголовка: она должна пережить первый
// экран целиком, иначе исчезает от одного движения пальцем.
const NAV_HIDE_AT = 240
const navHidden = ref(false)
const navPinned = ref(false)

const today = computed(() => new Date().getDate())

function onScroll(e) {
  const top = e.target.scrollTop
  collapsed.value = top > COLLAPSE_AT
  if (top <= NAV_HIDE_AT) {
    navHidden.value = false
    navPinned.value = false
  } else if (!navPinned.value) {
    navHidden.value = true
  }
}

function openNav() {
  navPinned.value = true
  navHidden.value = false
}

// ── Потяни-обнови ───────────────────────────────────────────────────────────
//
// Механика повторяет мобильный Chrome, и это не вкусовщина: жест человек уже
// знает оттуда, и любое отличие он читает как поломку.
//
// ⚠ Здесь была авария. Панель ехала за пальцем по формуле `sqrt(dy) * 9`,
// то есть маленькое движение УСИЛИВАЛОСЬ: шестьдесят четыре пикселя пальца
// давали ровно порог срабатывания, и приложение перезагружалось от обычной
// попытки проскроллить страницу вверх. Правило простое и нарушать его нельзя:
// **панель обязана ехать медленнее пальца, а не быстрее.** Отсюда `DAMP < 1`.
//
// Три вещи, которые делают жест жестом, а не случайностью:
//   1. Порог по пальцу. Сработать можно на ста тридцати пикселях движения —
//      это осознанное протягивание, а не рывок при чтении.
//   2. Люфт. Пока палец не прошёл десять пикселей вниз, прокрутка остаётся
//      прокруткой и `preventDefault` не зовётся. Иначе жест отбирает скролл
//      у страницы с первого же касания.
//   3. Возврат пружиной. Отпустили, не дотянув, — панель уезжает обратно
//      за 0,25 с. Мгновенное исчезновение читается сбоем.
//
// Подтверждения у жеста нет намеренно. Данные лежат на устройстве
// и перезагрузкой не трогаются, а модалка на жесте превращает односекундное
// действие в два шага. Беспокойство снимается строкой под стрелкой, а не
// вопросом.
const PULL_MAX = 96
const PULL_SLOP = 10
const PULL_DAMP = 0.5
const PULL_TRIGGER = 64 // ≈ 138 px пальца вместе с люфтом

const pull = ref(0)
const pullReady = computed(() => pull.value >= PULL_TRIGGER)
let pullStart = null
let pullActive = false

function onTouchStart(e) {
  pullStart = scrollEl.value && scrollEl.value.scrollTop <= 0 ? e.touches[0].clientY : null
  pullActive = false
  pull.value = 0
}

function onTouchMove(e) {
  if (pullStart === null) return
  const dy = e.touches[0].clientY - pullStart
  if (dy <= PULL_SLOP) {
    if (pullActive) pull.value = 0
    return
  }
  pullActive = true
  pull.value = Math.min(PULL_MAX, Math.round((dy - PULL_SLOP) * PULL_DAMP))
  // Прокрутку отбираем только когда жест уже начался: до люфта страница
  // обязана листаться как обычно.
  if (e.cancelable) e.preventDefault()
}

function onTouchEnd() {
  const fire = pullActive && pullReady.value
  pullStart = null
  pullActive = false
  pull.value = 0
  if (fire) hardReload()
}

watch(() => [props.active, props.subView], async () => {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = 0
  collapsed.value = false
  navHidden.value = false
  navPinned.value = false
  pull.value = 0
})
</script>

<template>
  <div
    class="relative mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[var(--bg)]
           pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]
           md:border-x md:border-[var(--line)]"
  >
    <!-- Индикатор жеста приезжает сверху вместе с пальцем. Строки появляются
         по мере того, как под них освобождается место: на первых пикселях
         подпись обрезалась бы по половине строки. -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col items-center justify-end overflow-hidden px-6 pb-1"
      :style="{ height: `${pull}px`, transition: pull > 0 ? 'none' : 'height 0.25s ease-out' }"
      aria-hidden="true"
    >
      <!-- Стрелка вниз, пока тянут, и вверх на пороге срабатывания: знак
           говорит, куда идёт жест, а не какой марки приложение. Шеврон
           Ранскеила иконкой не работает нигде. -->
      <ArrowDown
        class="h-[22px] w-[22px] shrink-0 transition-all duration-150"
        :class="pullReady
          ? 'rotate-180 text-[var(--action)] opacity-100'
          : 'text-[var(--text-muted)] opacity-60'"
        :stroke-width="2.5"
      />
      <span
        v-if="pull >= 44"
        class="font-label mt-1 block whitespace-nowrap text-[0.75rem] uppercase tracking-[0.12em]"
        :style="{ color: pullReady ? 'var(--action)' : 'var(--text-muted)' }"
      >Обновить Трек</span>
      <!-- Строка снимает единственное беспокойство жеста — «а не потеряю ли
           я введённое». Поэтому подтверждения у жеста нет: вопрос закрыт
           до того, как он задан. -->
      <span
        v-if="pull >= 74"
        class="mt-0.5 block text-center text-[0.6875rem] leading-tight text-[var(--text-muted)]"
      >Данные сохранятся. Ранскеил станет полезнее.</span>
    </div>

    <div
      ref="scrollEl"
      class="relative flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain pb-28"
      :style="pull > 0 ? { transform: `translateY(${pull}px)`, transition: 'none' } : { transition: 'transform 0.25s ease-out' }"
      @scroll="onScroll"
      @touchstart.passive="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <NavigationBar
        :title="current.title"
        :collapsed="collapsed"
        :show-back="!!current.showBack"
        :back-label="current.backLabel || ''"
        :leading-action="current.leadingAction || null"
        :eyebrow="current.eyebrow || null"
        :eyebrow-name="current.eyebrowName || ''"
        :clock-title="!!current.clockTitle"
        :big-title="current.bigTitle !== false"
        @back="emit('back')"
      />
      <slot />
    </div>

    <!-- Плавающая навигация. Капсула уезжает влево, на её месте остаётся
         круглая кнопка с сегодняшним числом. -->
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-4"
      style="padding-bottom: calc(env(safe-area-inset-bottom) + 0.75rem)"
    >
      <div class="relative">
        <div
          class="pointer-events-auto transition-all duration-300 ease-out"
          :class="navHidden ? '-translate-x-[120%] opacity-0' : 'translate-x-0 opacity-100'"
        >
          <TabBar :tabs="tabs" :active="active" @select="(id) => emit('update:active', id)" />
        </div>

        <button
          v-show="navHidden"
          type="button"
          class="pointer-events-auto absolute bottom-0 left-0 flex h-14 w-14 items-center justify-center rounded-full shadow-lg active:opacity-90"
          :style="{ background: 'var(--action)' }"
          aria-label="Показать навигацию"
          @click="openNav"
        >
          <CalDateIcon class="h-7 w-7" :day="today" :style="{ color: 'var(--action-ink)' }" />
        </button>
      </div>
    </div>
  </div>
</template>
