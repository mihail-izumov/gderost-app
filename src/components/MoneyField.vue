<script setup>
import { computed } from 'vue'
import { formatInt } from '../i18n/format.js'

// Денежное поле. Показывает разряды, отдаёт число. Клавиатура на телефоне —
// цифровая: владелец вводит выручку стоя у кассы, а не за столом.
const props = defineProps({
  modelValue: { type: [Number, null], default: null },
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  placeholder: { type: String, default: '0' },
  id: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const shown = computed(() =>
  props.modelValue === null || props.modelValue === '' ? '' : formatInt(props.modelValue))

// ⚠ Вторая половина той же беды. Отступ `--gr-kb` поднимает шторку целиком,
// но само поле может стоять в её прокручиваемой части — и тогда оно уезжает
// под клавиатуру внутри шторки, а не вместе с ней. Поэтому после фокуса поле
// подводится к середине видимой области.
//
// Задержка обязательна: клавиатура выезжает примерно четверть секунды,
// и подводка, сделанная сразу, считает высоту старого, ещё полного экрана.
function onFocus(e) {
  const el = e.target
  if (!el || typeof el.scrollIntoView !== 'function') return
  setTimeout(() => {
    try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }) } catch { el.scrollIntoView() }
  }, 320)
}

function onInput(e) {
  const digits = String(e.target.value).replace(/\D/g, '')
  const next = digits === '' ? null : Number(digits)
  emit('update:modelValue', next)
  // Возвращаем в поле разрядку сразу: иначе курсор видит один текст, а модель другой.
  e.target.value = next === null ? '' : formatInt(next)
}
</script>

<template>
  <label class="block">
    <span v-if="label" class="block text-[0.8125rem] font-medium text-[var(--text-secondary)]">{{ label }}</span>
    <span v-if="hint" class="mt-0.5 block text-[0.75rem] leading-snug text-[var(--text-muted)]">{{ hint }}</span>
    <span class="mt-2 flex w-full min-w-0 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3
                 focus-within:border-[var(--text-secondary)]">
      <input
        :id="id"
        class="min-h-[44px] w-full min-w-0 bg-transparent font-mono text-[1.0625rem] text-[var(--text)]
               outline-none placeholder:text-[var(--placeholder)]"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :placeholder="placeholder"
        :value="shown"
        @focus="onFocus"
        @input="onInput"
      >
      <span class="shrink-0 text-[1rem] text-[var(--text-muted)]">₽</span>
    </span>
  </label>
</template>
