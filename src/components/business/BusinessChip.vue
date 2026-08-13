<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Check, ChevronsUpDown, Plus } from 'lucide-vue-next'
import ConnectBusinessModal from './ConnectBusinessModal.vue'

// Чип бизнеса в шапке. Перенесён из рабочего Ранскейла вместе с решениями.
//
// Стрелка ВВЕРХ-ВНИЗ, а не вниз: одинарный шеврон вниз читается как
// «раскрыть список», двойной — как «переключить между». Здесь верен второй.
//
// Капсула низкая, но тач-таргет остаётся 44pt: фон живёт на внутреннем span,
// min-h — на кнопке. Иначе графит красит всю 44-пиксельную кнопку и бейдж
// выглядит раздутым.
//
// Чип выровнен влево: по центру он читается как логотип-вывеска, а это контрол
// выбора контекста — его место у края.
//
// Подсветка строки под курсором только через @media (hover: hover): на тач-экране
// ховер залипает на последнем тапнутом пункте и выглядит как выбранный по ошибке
// бизнес.

const props = defineProps({
  label: { type: String, required: true },
  // Имя в списке отличается от подписи в чипе: в чипе капс — это стиль,
  // а не написание имени.
  name: { type: String, default: '' },
})

const open = ref(false)
const modalOpen = ref(false)
const rootRef = ref(null)

function toggle() { open.value = !open.value }
function close() { open.value = false }
function openConnect() {
  close()
  modalOpen.value = true
}

function onKey(e) {
  if (!open.value) return
  if (e.key === 'Escape') { e.preventDefault(); close() }
}
function onDocClick(e) {
  if (!open.value) return
  if (rootRef.value && !rootRef.value.contains(e.target)) close()
}

watch(open, async (v) => {
  if (v) {
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onDocClick, true)
    await nextTick()
    // Первый пункт программно не фокусируем: после тапа пальцем браузер рисует
    // на нём системное кольцо фокуса, и активный бизнес выглядит выделенным
    // по ошибке. Клавиатура доходит до пунктов обычным Tab.
  } else {
    document.removeEventListener('keydown', onKey)
    document.removeEventListener('click', onDocClick, true)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.removeEventListener('click', onDocClick, true)
})
</script>

<template>
  <div ref="rootRef" class="relative inline-flex">
    <button
      type="button"
      data-test="business-chip"
      class="inline-flex min-h-[44px] items-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-muted)] focus-visible:ring-offset-0"
      :aria-expanded="open ? 'true' : 'false'"
      aria-haspopup="menu"
      @click="toggle"
    >
      <span
        data-test="business-chip-pill"
        class="inline-flex h-[26px] max-w-[13rem] items-center gap-1.5 rounded-full bg-[var(--graphite)] pl-3.5 pr-2 text-[0.6875rem] font-medium uppercase tracking-[0.28em] text-[var(--ink-on-color)]"
      >
        <span class="truncate">{{ label }}</span>
        <ChevronsUpDown class="h-3.5 w-3.5 shrink-0" :stroke-width="2.25" aria-hidden="true" />
      </span>
    </button>

    <!-- Разделителя нет: каждый пункт — самостоятельная плашка, границу держит
         зазор. Высота у всех одинаковая, хотя у «Подключить бизнес» две строки:
         разновысокие плашки в коротком списке читаются как разные по важности. -->
    <div
      v-if="open"
      data-test="business-menu"
      role="menu"
      class="absolute left-0 top-full z-40 mt-1.5 flex w-[17rem] flex-col gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1.5 text-left shadow-2xl"
    >
      <button
        type="button"
        role="menuitem"
        class="bc-menu-item flex min-h-[56px] w-full items-center gap-2 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-muted)] active:bg-[var(--surface-hover)]"
        @click="close"
      >
        <span class="text-[1rem] text-[var(--text)]">{{ name || label }}</span>
        <Check class="ml-auto h-5 w-5 shrink-0 text-[var(--text)]" :stroke-width="2.25" aria-label="Активный бизнес" />
      </button>

      <button
        type="button"
        role="menuitem"
        data-test="business-connect"
        class="bc-menu-item flex min-h-[56px] w-full items-center gap-2.5 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-muted)] active:bg-[var(--surface-hover)]"
        @click="openConnect"
      >
        <Plus class="h-5 w-5 shrink-0 text-[var(--text-secondary)]" :stroke-width="2.25" aria-hidden="true" />
        <span class="flex min-w-0 flex-col">
          <span class="text-[1rem] leading-tight text-[var(--text)]">Подключить бизнес</span>
          <span class="text-[0.75rem] leading-tight text-[var(--text-muted)]">с экспертом</span>
        </span>
      </button>
    </div>

    <ConnectBusinessModal :open="modalOpen" @close="modalOpen = false" />
  </div>
</template>

<style scoped>
/* Только для устройств с настоящим ховером: на тач-экране :hover остаётся
   на последнем тапнутом пункте и выглядит как ошибочно выбранный бизнес. */
@media (hover: hover) and (pointer: fine) {
  .bc-menu-item { transition: background-color 120ms ease; }
  .bc-menu-item:hover { background: var(--surface-hover); }
}
</style>
