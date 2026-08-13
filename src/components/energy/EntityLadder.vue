<script setup>
import { computed } from 'vue'
import { ArrowDown } from 'lucide-vue-next'
import { formatRub } from '../../i18n/format.js'
import { PART } from '../../composables/energyModel.js'
import { PART_HINT, MINI_HINT, BY_LABEL } from '../../i18n/energy.js'

// Четыре сущности и разрывы между ними.
//
// Лестница факт → прогноз → план → цель показывает не четыре числа, а три
// расстояния между ними: именно там живёт вопрос «как вообще расти», и почти
// никто эти расстояния не считает. Приложение показывает величину и молчит —
// отношение к разрыву у каждого владельца своё, и это предмет разбора,
// а не подпись на экране.
//
// Каждая карта несёт свой уровень энергии: сколько сущность даёт сейчас
// и чем поднимается. Это то же число, что в шкале сверху, поэтому шкала
// и карты не спорят между собой.

const props = defineProps({
  model: { type: Object, required: true },
  energy: { type: Object, required: true },
  gaps: { type: Array, default: () => [] },
})

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
    // Подпись отвечает ближайшей ступени, а не верхней: пока цель
    // не поставлена, ближайшее — поставить её здесь, и «отделяется от плана
    // на разборе» рядом с «+5 %, Мини» спорило бы само с собой.
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
            <span class="block text-[0.9375rem] font-bold text-[var(--text)]">{{ r.label }}</span>
            <span class="mt-0.5 block text-[0.75rem] text-[var(--text-muted)]">{{ r.status }}</span>
          </span>
          <span class="shrink-0 text-right">
            <span class="block text-[1.25rem] font-bold leading-none tabular-nums text-[var(--text)]">
              {{ !r.on || r.value === null || r.value === undefined ? '—' : formatRub(r.value) }}
            </span>
            <span class="mt-1 block text-[0.6875rem] tabular-nums text-[var(--text-muted)]">
              энергия {{ r.level }} / {{ PART }}
            </span>
          </span>
        </div>

        <!-- Невключённая опция: что поднимает эту сущность и чем включается.
             Без имени модуля строка превращается в упрёк. -->
        <div
          v-if="r.nextGain > 0"
          class="mt-3 flex items-center justify-between gap-3 rounded-xl px-3 py-2"
          :style="{ background: 'var(--surface-2)' }"
        >
          <span class="min-w-0 text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
            {{ r.hint }}
          </span>
          <span class="shrink-0 text-right">
            <span class="block text-[0.8125rem] font-bold tabular-nums text-[var(--text)]">+{{ r.nextGain }}%</span>
            <span class="block text-[0.6875rem] text-[var(--text-muted)]">{{ BY_LABEL[r.nextBy] || r.nextBy }}</span>
          </span>
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
