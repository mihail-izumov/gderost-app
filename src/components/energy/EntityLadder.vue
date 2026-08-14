<script setup>
import { computed } from 'vue'
import { ArrowDown, ChevronRight } from 'lucide-vue-next'
import { formatRub } from '../../i18n/format.js'
import { PART } from '../../composables/energyModel.js'
import { PART_HINT, MINI_HINT, BY_LABEL } from '../../i18n/energy.js'

// Четыре сущности и разрывы между ними.
//
// Главное число карты — уровень сущности, а не рубли. Рубли владелец
// и так видит на «Сегодня» в четырёх видах; здесь они справка, по которой он
// узнаёт свою карту, а вопрос экрана другой: на чём это число стоит. Пока
// рубли стояли крупно, экран читался как второй дашборд и терял свой смысл.
//
// Статус — чип, а не серая строка: «со слов» и «посчитано» это положение
// числа на лестнице доверия, то же самое, что `StatusChip` в остальном
// приложении, и выглядеть оно обязано одинаково везде.
//
// Строка «чем поднимается» стала кнопкой: у каждой сущности свой модуль,
// и открывается он оттуда, где названа нехватка. Ступень, которая берётся
// своими руками, кнопкой не становится — покупать там нечего.
//
// Лестница факт → прогноз → план → цель показывает не четыре числа, а три
// расстояния между ними: именно там живёт вопрос «как вообще расти».
// Приложение показывает величину и молчит — отношение к разрыву у каждого
// владельца своё, и это предмет разбора, а не подпись на экране.

const props = defineProps({
  model: { type: Object, required: true },
  energy: { type: Object, required: true },
  gaps: { type: Array, default: () => [] },
})
defineEmits(['module'])

const VALUE_OF = {
  fact: (m) => m.realizedRev,
  forecast: (m) => m.landing,
  plan: (m) => m.T,
  goal: (m) => m.goal,
}

// Разрыв стоит между теми картами, к которым относится.
const GAP_AFTER = { fact: 'fact-forecast', forecast: 'forecast-plan', plan: 'plan-goal' }

const rows = computed(() => props.energy.parts
  .filter((p) => p.key !== 'live')
  .map((p) => ({
    key: p.key,
    label: p.label,
    status: p.status,
    on: p.on,
    value: VALUE_OF[p.key] ? VALUE_OF[p.key](props.model) : null,
    level: p.value,
    nextBy: p.nextBy,
    nextGain: p.nextGain,
    // Ступень своими руками покупкой не открывается: там действие, а не модуль.
    buyable: p.nextGain > 0 && p.nextBy !== 'mini',
    // Подпись отвечает ближайшей ступени, а не верхней: пока цель
    // не поставлена, ближайшее — поставить её здесь.
    hint: (p.nextBy === 'mini' ? MINI_HINT[p.key] : PART_HINT[p.key]) || '',
    gap: props.gaps.find((g) => g.key === GAP_AFTER[p.key]) || null,
  })))

function gapColor(tone) {
  if (tone === 'bad') return 'var(--negative)'
  if (tone === 'good') return 'var(--positive)'
  return 'var(--text-muted)'
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <template v-for="r in rows" :key="r.key">
      <article class="rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-3.5">
        <div class="flex items-start justify-between gap-3">
          <span class="min-w-0">
            <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span class="text-[0.9375rem] font-bold text-[var(--text)]">{{ r.label }}</span>
              <span
                class="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.625rem]
                       font-medium uppercase tracking-wide"
                :style="{ background: 'var(--surface-2)', color: 'var(--text-muted)' }"
              >{{ r.status }}</span>
            </span>
            <span
              v-if="r.on && r.value !== null && r.value !== undefined"
              class="mt-1.5 inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.75rem]
                     font-semibold tabular-nums"
              :style="{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }"
            >{{ formatRub(r.value) }}</span>
          </span>

          <span class="shrink-0 text-right">
            <span class="text-[1.5rem] font-bold leading-none tabular-nums text-[var(--text)]">{{ r.level }}</span>
            <span class="text-[0.9375rem] font-medium tabular-nums text-[var(--text-muted)]"> / {{ PART }}</span>
          </span>
        </div>

        <!-- Чем поднимается. Модуль открывается отсюда: нехватка названа
             здесь, значит и ответ на неё стоит здесь. -->
        <button
          v-if="r.buyable"
          type="button"
          class="mt-3 flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left"
          :style="{ background: 'var(--surface-2)' }"
          @click="$emit('module', r.nextBy)"
        >
          <span class="min-w-0">
            <span class="block text-[0.8125rem] font-semibold leading-snug text-[var(--text)]">
              +{{ r.nextGain }}% — {{ BY_LABEL[r.nextBy] || r.nextBy }}
            </span>
            <span class="block truncate text-[0.75rem] text-[var(--text-muted)]">{{ r.hint }}</span>
          </span>
          <ChevronRight class="h-[18px] w-[18px] shrink-0 text-[var(--text-muted)]" :stroke-width="2.5" aria-hidden="true" />
        </button>

        <!-- Ступень, которая берётся здесь же. Покупать нечего — и кнопки нет. -->
        <div
          v-else-if="r.nextGain > 0"
          class="mt-3 flex items-center justify-between gap-3 rounded-xl px-3 py-2"
          :style="{ background: 'var(--surface-2)' }"
        >
          <span class="min-w-0 text-[0.8125rem] leading-snug text-[var(--text-secondary)]">{{ r.hint }}</span>
          <span class="shrink-0 text-[0.8125rem] font-bold tabular-nums text-[var(--text)]">+{{ r.nextGain }}%</span>
        </div>
      </article>

      <!-- Разрыв между картами. Ноль не показываем: расстояния нет. -->
      <div
        v-if="r.on && r.gap && r.gap.value > 0"
        class="flex items-center justify-center gap-2 py-0.5"
      >
        <ArrowDown class="h-3.5 w-3.5" :style="{ color: gapColor(r.gap.tone) }" :stroke-width="2.5" aria-hidden="true" />
        <span class="text-[0.75rem] text-[var(--text-muted)]">{{ r.gap.label }}</span>
        <span class="text-[0.8125rem] font-bold tabular-nums" :style="{ color: gapColor(r.gap.tone) }">
          {{ formatRub(r.gap.value) }}
        </span>
      </div>
    </template>
  </div>
</template>
