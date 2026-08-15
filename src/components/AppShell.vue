<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import NavigationBar from './NavigationBar.vue'
import TabBar from './TabBar.vue'
import CalDateIcon from './icons/CalDateIcon.vue'

// Оболочка приложения. Перенесена из рабочего Ранскейла.
//
// Принимает конфиг вкладок, активную вкладку и опциональную под-страницу.
// Под-страница имеет приоритет над вкладкой.
//
// Скролл живёт в оболочке, а не на странице: таб-бар зафиксирован под ней и
// не уезжает с содержимым. При смене экрана прокрутка возвращается к верху,
// крупный заголовок снова раскрывается — экран, открытый с середины, читается
// как продолжение предыдущего.
//
// Ушли ниже первого экрана — таб-бар сворачивается в круг слева внизу
// (механика ленты Reddit): человек читает длинную страницу, и три подписи
// поверх неё отбирают полосу содержимого. Круг остаётся входом обратно —
// тап разворачивает панель. Вернулись к верху — панель возвращается сама.

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

watch(() => [props.active, props.subView], async () => {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = 0
  collapsed.value = false
  navHidden.value = false
  navPinned.value = false
})
</script>

<template>
  <div
    class="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[var(--bg)]
           pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]
           md:border-x md:border-[var(--line)]"
  >
    <div
      ref="scrollEl"
      class="relative flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain"
      @scroll="onScroll"
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
        @back="emit('back')"
      />
      <slot />
    </div>

    <TabBar v-show="!navHidden" :tabs="tabs" :active="active" @select="(id) => emit('update:active', id)" />

    <!-- Свёрнутая навигация: жёлтый круг в левом нижнем углу с сегодняшним
         числом. Тап разворачивает панель обратно. -->
    <div
      v-if="navHidden"
      class="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[430px] justify-start px-4"
      style="padding-bottom: calc(env(safe-area-inset-bottom) + 0.75rem)"
    >
      <button
        type="button"
        class="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full shadow-lg active:opacity-90"
        :style="{ background: 'var(--accent)' }"
        aria-label="Показать навигацию"
        @click="openNav"
      >
        <CalDateIcon class="h-7 w-7 text-[var(--accent-ink)]" :day="today" />
      </button>
    </div>
  </div>
</template>
