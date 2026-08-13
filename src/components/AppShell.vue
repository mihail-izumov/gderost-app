<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import NavigationBar from './NavigationBar.vue'
import TabBar from './TabBar.vue'

// Оболочка приложения. Перенесена из рабочего Ранскейла.
//
// Принимает конфиг вкладок, активную вкладку и опциональную под-страницу.
// Под-страница имеет приоритет над вкладкой.
//
// Скролл живёт в оболочке, а не на странице: таб-бар зафиксирован под ней и
// не уезжает с содержимым. При смене экрана прокрутка возвращается к верху,
// крупный заголовок снова раскрывается — экран, открытый с середины, читается
// как продолжение предыдущего.

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

function onScroll(e) {
  collapsed.value = e.target.scrollTop > COLLAPSE_AT
}

watch(() => [props.active, props.subView], async () => {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = 0
  collapsed.value = false
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
        @back="emit('back')"
      />
      <slot />
    </div>

    <TabBar :tabs="tabs" :active="active" @select="(id) => emit('update:active', id)" />
  </div>
</template>
