<script setup>
import { computed } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import { formatRub } from '../../i18n/format.js'
import { moduleGain } from '../../composables/energyModel.js'
import { MODULES } from '../../i18n/energy.js'
import { bookingLink } from '../../data/contact.js'

// Паспорт модуля: услуга описана как устройство.
//
// Три плитки — скорость, мощность, расход — и спецификация строками.
// Мощность не написана словом, а посчитана на состоянии владельца: разбор
// поднимает цель с 5 до 20, значит на его паспорте стоит «+15%». Так шкала
// сверху и паспорт говорят на одном языке, и человек видит, из чего
// складывается недостающее.
//
// Цена, которой нет, так и остаётся пустой: её называет человек на разборе,
// и выдуманная цифра связала бы публичным обязательством.

const props = defineProps({
  moduleId: { type: String, required: true },
  energy: { type: Object, required: true },
})

// Неизвестный модуль — ошибка сборки, а не состояние пользователя: экран
// в этом случае просто не рисуется, вместо падения на пустом объекте.
const mod = computed(() => MODULES[props.moduleId] || null)
const gain = computed(() => moduleGain(props.moduleId, props.energy))
const link = computed(() => bookingLink())

const tiles = computed(() => (!mod.value ? [] : [
  { label: 'Скорость', value: mod.value.speed },
  { label: 'Мощность', value: gain.value > 0 ? `+${gain.value}%` : '—' },
  { label: 'Расход', value: mod.value.price ? formatRub(mod.value.price) : 'на разборе' },
]))
</script>

<template>
  <section v-if="mod" class="rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
    <h2 class="text-[1.0625rem] font-bold text-[var(--text)]">{{ mod.title }}</h2>
    <p class="mt-0.5 text-[0.8125rem] leading-snug text-[var(--text-secondary)]">{{ mod.subtitle }}</p>

    <!-- Три плитки. Одинаковые у всех модулей: сравниваются глазами за секунду. -->
    <div class="mt-3 grid grid-cols-3 gap-2">
      <div
        v-for="t in tiles"
        :key="t.label"
        class="rounded-xl px-2.5 py-2"
        :style="{ background: 'var(--surface-2)' }"
      >
        <span class="block text-[0.625rem] uppercase tracking-wide text-[var(--text-muted)]">{{ t.label }}</span>
        <span class="mt-0.5 block text-[0.9375rem] font-bold tabular-nums text-[var(--text)]">{{ t.value }}</span>
      </div>
    </div>

    <!-- Спецификация строками. -->
    <dl class="mt-3 flex flex-col">
      <div class="flex items-baseline justify-between gap-3 border-b border-[var(--line)] py-2">
        <dt class="shrink-0 text-[0.8125rem] font-semibold text-[var(--text)]">Команда</dt>
        <dd class="text-right text-[0.8125rem] text-[var(--text-secondary)]">{{ mod.team }}</dd>
      </div>
      <div class="flex items-baseline justify-between gap-3 border-b border-[var(--line)] py-2">
        <dt class="shrink-0 text-[0.8125rem] font-semibold text-[var(--text)]">Приносите</dt>
        <dd class="text-right text-[0.8125rem] text-[var(--text-secondary)]">{{ mod.bring }}</dd>
      </div>
      <div class="flex items-baseline justify-between gap-3 py-2">
        <dt class="shrink-0 text-[0.8125rem] font-semibold text-[var(--text)]">Уносите</dt>
        <dd class="text-right text-[0.8125rem] text-[var(--text-secondary)]">{{ mod.take }}</dd>
      </div>
    </dl>

    <a
      :href="link.url"
      target="_blank"
      rel="noopener"
      class="mt-3 flex min-h-[48px] w-full items-center justify-between gap-2 rounded-full px-5 text-[0.9375rem] font-bold active:opacity-90"
      :style="{ background: 'var(--accent)', color: 'var(--accent-ink)' }"
    >
      Записаться на разбор
      <ArrowRight class="h-5 w-5 shrink-0" :stroke-width="2.5" aria-hidden="true" />
    </a>

    <p v-if="mod.note" class="mt-2 text-[0.75rem] leading-snug text-[var(--text-muted)]">{{ mod.note }}</p>
  </section>
</template>
