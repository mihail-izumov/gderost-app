<script setup>
import { computed, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import MoneyField from './MoneyField.vue'
import { formatRub } from '../i18n/format.js'

// Шторка одной величины: что это, сколько сейчас и — по отдельной кнопке —
// правка.
//
// Правка не начинается по тапу в число: тап по цифре открывает клавиатуру
// раньше, чем человек решил менять, и он правит то, на что просто хотел
// посмотреть. Сначала показываем, потом спрашиваем, потом даём поле.
//
// Величины, которые приложение считает само, поля не имеют вовсе: их нельзя
// поставить, их можно только получить.

const props = defineProps({
  // Подпись разрыва: «ниже плана», «рост без цели». Пусто — разрыва нет.
  gapLabel: { type: String, default: '' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  value: { type: Number, default: null },
  // Пусто — величина только для чтения (факт, прогноз)
  editLabel: { type: String, default: '' },
  hint: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
})
// Разрыв, который эта величина создаёт: строка-подпись и признак наличия.
// Пусто — второй кнопки нет. Разбор предлагается только тогда, когда
// разбирать действительно есть что: кнопка «разобрать разрыв» при сошедшихся
// числах — реклама, а не помощь.
const emit = defineEmits(['close', 'save', 'razbor'])

const editing = ref(false)
const draft = ref(props.value)
watch(() => props.value, (v) => { draft.value = v })

const changed = computed(() => Number(draft.value || 0) !== Number(props.value || 0))
const canSave = computed(() => changed.value && !props.error)

function start() {
  draft.value = props.value
  editing.value = true
}
function save() {
  if (!canSave.value) return
  emit('save', draft.value)
  editing.value = false
}
</script>

<template>
  <div class="w-full">
    <header class="flex items-start gap-3 pb-4">
      <div class="min-w-0 flex-1">
        <h2 class="text-[1.375rem] font-bold leading-tight text-[var(--text)]">{{ title }}</h2>
        <p v-if="subtitle" class="mt-1 text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
          {{ subtitle }}
        </p>
      </div>
      <button
        type="button"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)]"
        aria-label="Закрыть"
        @click="emit('close')"
      >
        <X class="h-5 w-5 text-[var(--text-secondary)]" :stroke-width="2" aria-hidden="true" />
      </button>
    </header>

    <div class="rounded-2xl bg-[var(--surface)] p-4">
      <div class="text-[2rem] font-bold leading-none tabular-nums text-[var(--text)]">
        {{ value ? formatRub(value) : '—' }}
      </div>
    </div>

    <!-- Тихая вторая кнопка. Разрыв назван словами из той же строки, что
         человек видел на экране, и ведёт она не в оплату, а в паспорт разбора:
         сначала он читает, что это, и только потом решает. Обводка вместо
         заливки — у шторки одно главное действие, и это правка числа. -->
    <button
      v-if="gapLabel"
      type="button"
      class="mt-3 min-h-[48px] w-full rounded-2xl border text-[0.9375rem] font-semibold text-[var(--text)]"
      :style="{ borderColor: 'var(--rim)', background: 'var(--surface)' }"
      @click="emit('razbor')"
    >Разобрать разрыв: {{ gapLabel }}</button>

    <template v-if="editLabel">
      <button
        v-if="!editing"
        type="button"
        class="mt-3 min-h-[52px] w-full rounded-2xl text-[1.0625rem] font-semibold"
        :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
        @click="start"
      >{{ editLabel }}</button>

      <div v-else class="mt-3">
        <MoneyField v-model="draft" :hint="hint" :placeholder="placeholder" />
        <p v-if="error" class="mt-2 text-[0.8125rem] leading-snug text-[var(--negative)]">{{ error }}</p>
        <div class="mt-3 flex gap-2">
          <button
            type="button"
            class="min-h-[52px] flex-1 rounded-2xl text-[1.0625rem] font-semibold transition-opacity disabled:opacity-40"
            :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
            :disabled="!canSave"
            @click="save"
          >Сохранить</button>
          <button
            type="button"
            class="min-h-[52px] flex-1 rounded-2xl border border-[var(--line)] text-[1.0625rem] font-medium text-[var(--text-secondary)]"
            @click="editing = false"
          >Отмена</button>
        </div>
      </div>
    </template>
  </div>
</template>
