<script setup>
import { PART } from '../../composables/energyModel.js'
import { BY_LABEL } from '../../i18n/energy.js'

// Состав энергии. Число публично — значит и его происхождение публично:
// пять компонент по 20, сколько даёт каждая сейчас и чем поднимается.
//
// Таблица из трёх колонок читалась как отчёт: заголовки, длинные строки
// «чем поднимается», текст на текст. Осталось то же содержание строками —
// имя со статусом, число и одна короткая подпись, чем поднимается.
//
// Закрывается кнопкой внизу, а не крестиком в углу: на телефоне угол
// приходится на самый дальний от пальца край экрана.

defineProps({
  energy: { type: Object, required: true },
})
defineEmits(['close'])
</script>

<template>
  <div>
    <h2 class="text-[1.0625rem] font-bold text-[var(--text)]">Из чего сложились {{ energy.pct }}%</h2>

    <ul class="mt-3 flex flex-col">
      <li
        v-for="p in energy.parts"
        :key="p.key"
        class="flex items-baseline justify-between gap-3 border-b border-[var(--line)] py-2.5"
      >
        <span class="min-w-0">
          <span class="block text-[0.9375rem] font-semibold text-[var(--text)]">{{ p.label }}</span>
          <span class="block text-[0.75rem] text-[var(--text-muted)]">
            <template v-if="p.nextGain > 0">
              +{{ p.nextGain }}% — {{ BY_LABEL[p.nextBy] || p.nextBy }}
            </template>
            <template v-else>выше не поднимается</template>
          </span>
        </span>
        <span class="shrink-0 text-[0.9375rem] font-bold tabular-nums text-[var(--text)]">
          {{ p.value }}<span class="font-medium text-[var(--text-muted)]"> / {{ PART }}</span>
        </span>
      </li>
    </ul>

    <div class="flex items-baseline justify-between gap-3 pt-3">
      <span class="text-[0.9375rem] font-bold text-[var(--text)]">Итого</span>
      <span class="text-[1.0625rem] font-bold tabular-nums text-[var(--text)]">{{ energy.pct }} / 100</span>
    </div>

    <p class="mt-2 text-[0.75rem] leading-snug text-[var(--text-muted)]">
      Потолок этого приложения — 20%.
    </p>

    <button
      type="button"
      class="mt-4 min-h-[48px] w-full rounded-full text-[0.9375rem] font-bold"
      :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      @click="$emit('close')"
    >Понятно</button>
  </div>
</template>
