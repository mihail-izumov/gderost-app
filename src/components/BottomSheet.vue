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
//
// ── Как она приходит и уходит ───────────────────────────────────────────────
//
// Раньше шторка появлялась и пропадала кадром: `v-if` без перехода. Панель
// без движения не сообщает, откуда она взялась и куда делась, — экран просто
// подменяется, и человек теряет место, на котором стоял.
//
// Кривая `cubic-bezier(0.32, 0.72, 0, 1)` — та же, по которой ездит системная
// шторка в iOS: почти весь путь проходится в первой трети времени, дальше
// панель мягко доезжает. Поэтому движение читается как вес предмета,
// а не как равномерная анимация.
//
// Уход короче прихода (0,3 против 0,42 с). Появление показывает новое и может
// себе позволить быть заметным; закрытие человек уже решил — тянуть его
// значит держать его на месте, где он больше не хочет быть.
//
// Смещение пальцем передаётся переменной `--gr-dy`, а не инлайновым
// `transform`. Инлайновый стиль сильнее любого класса: с ним панель, брошенная
// за порогом, дёргалась бы обратно наверх и только потом уезжала вниз.
// С переменной класс ухода перебивает её штатно, и панель уезжает с того
// места, где её отпустили.

defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const panel = ref(null)
const dy = ref(0)
const dragging = ref(false)
let startY = null

function onTouchStart(e) {
  // Жест берётся только когда содержимое стоит на верху: иначе это скролл.
  if (panel.value && panel.value.scrollTop > 0) { startY = null; return }
  startY = e.touches[0].clientY
  dragging.value = false
}

function onTouchMove(e) {
  if (startY === null) return
  const delta = e.touches[0].clientY - startY
  if (delta > 6) dragging.value = true
  dy.value = Math.max(0, delta)
  // Пока панель едет за пальцем, прокрутку не отдаём содержимому.
  if (dragging.value && e.cancelable) e.preventDefault()
}

function onTouchEnd() {
  const closing = dragging.value && dy.value > 80
  dragging.value = false
  startY = null
  if (closing) emit('close')
  else dy.value = 0
}
</script>

<template>
  <Teleport to="body">
    <Transition name="gr-sheet" @after-leave="dy = 0">
      <div
        v-if="open"
        class="gr-sheet-overlay z-[60] flex items-end justify-center"
        role="presentation"
      >
        <div
          class="gr-sheet-scrim absolute inset-0 bg-[var(--scrim)] backdrop-blur-sm"
          @click="emit('close')"
        ></div>
        <div
          ref="panel"
          class="gr-sheet-panel relative w-full max-w-[430px] overflow-y-auto
                 rounded-t-2xl bg-[var(--bg)] px-4"
          :class="dragging ? 'is-dragging' : ''"
          :style="{ '--gr-dy': `${dy}px` }"
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
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Клавиатуру держит не панель, а её оверлей: `.gr-sheet-overlay` встаёт
   ровно по видимой области экрана (`visualViewport`), поэтому низ панели
   всегда над клавиатурой. Отсюда и высота в процентах — от оверлея,
   а не от окна: окно при открытой клавиатуре остаётся прежним и врёт. */
.gr-sheet-panel {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
  max-height: 88%;
  transform: translateY(var(--gr-dy, 0px));
  transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
}

/* Пока панель под пальцем, она обязана идти ровно за ним: любая длительность
   здесь читается как залипание. */
.gr-sheet-panel.is-dragging {
  transition: none;
}

.gr-sheet-enter-active .gr-sheet-panel {
  transition: transform 0.42s cubic-bezier(0.32, 0.72, 0, 1);
}
.gr-sheet-leave-active .gr-sheet-panel {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.gr-sheet-enter-from .gr-sheet-panel,
.gr-sheet-leave-to .gr-sheet-panel {
  transform: translateY(100%);
}

.gr-sheet-scrim {
  transition: opacity 0.3s ease;
}
.gr-sheet-enter-from .gr-sheet-scrim,
.gr-sheet-leave-to .gr-sheet-scrim {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .gr-sheet-panel,
  .gr-sheet-enter-active .gr-sheet-panel,
  .gr-sheet-leave-active .gr-sheet-panel,
  .gr-sheet-scrim {
    transition: none;
  }
}
</style>
