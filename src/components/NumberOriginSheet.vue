<script setup>
import { computed } from 'vue'
import StatusChip from './StatusChip.vue'
import { ORIGINS } from '../i18n/energy.js'
import { BADGE } from '../i18n/onboarding.js'

// Происхождение числа — механика честной цифры.
//
// Тап по числу открывает эту шторку: что это, из чего посчитано, какой
// статус и что переводит выше. Сигнал стоит ровно столько, сколько стоит
// число под ним, поэтому у каждого числа виден не только размер,
// но и основание.
//
// Статусов здесь два — «со слов» и «посчитано». Третий в приложении
// не выдаётся никогда: его ставит чекап, и строка «выше» честно называет,
// где это происходит.

const props = defineProps({
  originKey: { type: String, required: true },
  // Значение владельца — если у числа оно есть на открывшем экране.
  value: { type: String, default: '' },
})
const emit = defineEmits(['close', 'go'])

// Неизвестный ключ — ошибка сборки, а не состояние пользователя.
const o = computed(() => ORIGINS[props.originKey] || null)
</script>

<template>
  <section v-if="o">
    <div class="flex items-baseline justify-between gap-3">
      <h2 class="text-[1.25rem] font-bold leading-tight text-[var(--text)]">{{ o.title }}</h2>
      <span v-if="value" class="shrink-0 text-[1.0625rem] font-bold tabular-nums text-[var(--text)]">{{ value }}</span>
    </div>

    <dl class="mt-3 flex flex-col">
      <div class="border-b border-[var(--line)] py-2.5">
        <dt class="text-[0.625rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">{{ BADGE.originWhat }}</dt>
        <dd class="mt-0.5 text-[0.875rem] leading-snug text-[var(--text-secondary)]">{{ o.what }}</dd>
      </div>
      <div class="border-b border-[var(--line)] py-2.5">
        <dt class="text-[0.625rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">{{ BADGE.originFrom }}</dt>
        <dd class="mt-0.5 text-[0.875rem] leading-snug text-[var(--text-secondary)]">{{ o.from }}</dd>
      </div>
      <div class="flex items-center justify-between gap-3 border-b border-[var(--line)] py-2.5">
        <dt class="text-[0.625rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">{{ BADGE.originStatus }}</dt>
        <dd><StatusChip :kind="o.status" /></dd>
      </div>
      <div class="py-2.5">
        <dt class="text-[0.625rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">{{ BADGE.originNext }}</dt>
        <dd class="mt-0.5 text-[0.875rem] leading-snug text-[var(--text-secondary)]">{{ o.next }}</dd>
      </div>
    </dl>

    <!-- Шторка кончается делом, а не согласием. «Понятно» закрывало её
         и оставляло человека там же, откуда он пришёл; теперь кнопка ведёт
         туда, где это число правится или собирается. -->
    <button
      type="button"
      class="mt-2 min-h-[48px] w-full rounded-full text-[0.9375rem] font-bold"
      :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      @click="emit('go', o.go)"
    >{{ o.cta }}</button>
    <button
      type="button"
      class="mt-2 min-h-[44px] w-full text-[0.875rem] text-[var(--text-muted)]"
      @click="emit('close')"
    >{{ BADGE.originClose }}</button>
  </section>
</template>
