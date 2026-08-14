<script setup>
import { ref } from 'vue'

// Шторка. Одна на всё приложение — как у Whoosh: всегда снизу, сверху
// ручка-грабер, закрывается свайпом вниз, тапом по затемнению или кнопкой
// внизу содержимого. Крестиков нет: выход всегда в одном месте, и палец
// не ищет его по углам.
//
// Свайп закрывает только от верха прокрутки: пока содержимое листается,
// жест принадлежит списку, а не шторке. Иначе длинный паспорт нельзя было бы
// прочитать до конца — любая попытка проскроллить закрывала бы его.
//
// Панель следует за пальцем — обрыв без обратной связи читается как глюк,
// а не как жест.

defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const panel = ref(null)
const dy = ref(0)
let startY = null
let dragging = false

function onTouchStart(e) {
  // Жест берётся только когда содержимое стоит на верху: иначе это скролл.
  if (panel.value && panel.value.scrollTop > 0) { startY = null; return }
  startY = e.touches[0].clientY
  dragging = false
}

function onTouchMove(e) {
  if (startY === null) return
  const delta = e.touches[0].clientY - startY
  if (delta > 6) dragging = true
  dy.value = Math.max(0, delta)
  // Пока панель едет за пальцем, прокрутку не отдаём содержимому.
  if (dragging && e.cancelable) e.preventDefault()
}

function onTouchEnd() {
  if (dragging && dy.value > 80) emit('close')
  dy.value = 0
  startY = null
  dragging = false
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] flex items-end justify-center bg-[var(--scrim)] backdrop-blur-sm"
      role="presentation"
      @click.self="emit('close')"
    >
      <div
        ref="panel"
        class="max-h-[88svh] w-full max-w-[430px] overflow-y-auto rounded-t-2xl bg-[var(--bg)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        :style="dy > 0 ? { transform: `translateY(${dy}px)`, transition: 'none' } : { transition: 'transform 0.2s ease-out' }"
        @touchstart.passive="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
      >
        <!-- Ручка: видимое обещание, что шторку можно утащить вниз. -->
        <div class="sticky top-0 z-10 flex justify-center bg-[var(--bg)] pb-2 pt-2.5" aria-hidden="true">
          <span class="h-[4px] w-9 rounded-full" :style="{ background: 'var(--line)' }"></span>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
