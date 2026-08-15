<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { BRAND } from '../../i18n/brand.js'

// Модалка «Подключить бизнес». Оболочка, поведение и стили перенесены
// из рабочего Ранскейла: bottom-sheet, ловушка фокуса, Esc, блокировка скролла.
//
// РАСХОЖДЕНИЕ С ОРИГИНАЛОМ, названное вслух. Там форма отправляет заявку
// на сервер. Здесь сервера нет и не будет: приложение не делает ни одного
// сетевого вызова, это его рамка, а не недоделка. Поле «название бизнеса»,
// которое собирает текст и никуда его не отправляет, было бы враньём в самом
// заметном месте. Поэтому действие одно и настоящее — открыть сайт системы,
// где заявку принимают. Обещание совпадает с тем, что произойдёт.

const props = defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close'])

const L = {
  title: 'Подключить бизнес',
  lead: 'Бизнес-инженер Ранскейл подключит ваши данные и соберёт систему под ваш бизнес: проверенные цифры и сигнал каждый день.',
  submit: 'Отправить заявку',
}

const dialogRef = ref(null)

function hide() { emit('close') }

function focusables() {
  if (!dialogRef.value) return []
  return Array.from(dialogRef.value.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )).filter((el) => !el.hasAttribute('disabled'))
}

function onKey(e) {
  if (!props.open) return
  if (e.key === 'Escape') { e.preventDefault(); hide(); return }
  if (e.key === 'Tab') {
    const els = focusables()
    if (els.length === 0) { e.preventDefault(); return }
    const first = els[0]
    const last = els[els.length - 1]
    const active = document.activeElement
    if (e.shiftKey && active === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus() }
  }
}

let prevOverflow = ''
watch(() => props.open, async (v) => {
  if (v) {
    prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    await nextTick()
    focusables()[0]?.focus?.()
  } else {
    document.body.style.overflow = prevOverflow
    document.removeEventListener('keydown', onKey)
  }
})

onBeforeUnmount(() => {
  if (props.open) {
    document.body.style.overflow = prevOverflow
    document.removeEventListener('keydown', onKey)
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] flex items-end justify-center bg-[var(--scrim)] backdrop-blur-sm sm:items-center"
      role="presentation"
      @click.self="hide"
    >
      <div
        ref="dialogRef"
        data-test="connect-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="L.title"
        class="flex max-h-[88svh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-2xl bg-[var(--surface)] shadow-2xl sm:rounded-2xl"
        style="padding-bottom: env(safe-area-inset-bottom)"
      >
        <header class="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3">
          <h2 class="text-[1rem] font-semibold text-[var(--text)]">{{ L.title }}</h2>
          <button
            type="button"
            class="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--text-secondary)] active:bg-[var(--surface-2)]"
            aria-label="Закрыть"
            @click="hide"
          >
            <X class="h-5 w-5" :stroke-width="2" />
          </button>
        </header>

        <div class="flex flex-col gap-4 px-4 py-4">
          <p class="text-[1rem] leading-relaxed text-[var(--text-secondary)]">{{ L.lead }}</p>

          <a
            :href="BRAND.siteUrl"
            target="_blank"
            rel="noopener noreferrer"
            data-test="connect-submit"
            class="flex min-h-[48px] w-full items-center justify-center rounded-2xl px-4 text-[1.0625rem] font-bold active:opacity-90"
            :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
            @click="hide"
          >{{ L.submit }}</a>

        </div>
      </div>
    </div>
  </Teleport>
</template>
