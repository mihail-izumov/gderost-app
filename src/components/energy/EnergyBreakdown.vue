<script setup>
import { X } from 'lucide-vue-next'
import { PART } from '../../composables/energyModel.js'
import { BY_LABEL } from '../../i18n/energy.js'

// Состав энергии. Число публично — значит и его происхождение публично:
// пять компонент по 20, сколько даёт каждая сейчас и чем поднимается.
//
// Это не объяснение метафоры, а расшифровка числа: тот же жанр, что таблица
// коэффициентов под требованием на день.

defineProps({
  energy: { type: Object, required: true },
})
defineEmits(['close'])
</script>

<template>
  <div>
    <div class="flex items-start justify-between gap-3">
      <h2 class="text-[1.0625rem] font-bold text-[var(--text)]">Из чего сложились {{ energy.pct }}%</h2>
      <button
        type="button"
        class="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        aria-label="Закрыть"
        @click="$emit('close')"
      >
        <X class="h-5 w-5 text-[var(--text-muted)]" :stroke-width="2" aria-hidden="true" />
      </button>
    </div>

    <table class="mt-3 w-full border-collapse text-[0.875rem]">
      <thead>
        <tr class="text-[0.6875rem] uppercase tracking-wide text-[var(--text-muted)]">
          <th class="py-1 text-left font-medium">Компонента</th>
          <th class="py-1 text-right font-medium">Сейчас</th>
          <th class="py-1 pl-3 text-left font-medium">Чем поднимается</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in energy.parts" :key="p.key" class="border-t border-[var(--line)]">
          <td class="py-2 pr-2 align-top">
            <span class="block font-semibold text-[var(--text)]">{{ p.label }}</span>
            <span class="block text-[0.75rem] text-[var(--text-muted)]">{{ p.status }}</span>
          </td>
          <td class="py-2 text-right align-top tabular-nums">
            <span class="font-semibold text-[var(--text)]">{{ p.value }}</span>
            <span class="text-[var(--text-muted)]"> / {{ PART }}</span>
          </td>
          <td class="py-2 pl-3 align-top text-[0.8125rem] text-[var(--text-secondary)]">
            <template v-if="p.nextLabel">
              {{ p.nextLabel }}
              <span class="text-[var(--text-muted)]">— {{ BY_LABEL[p.nextBy] || p.nextBy }}, +{{ p.nextGain }}%</span>
            </template>
            <span v-else class="text-[var(--text-muted)]">выше не поднимается</span>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="border-t-2 border-[var(--text)]">
          <td class="py-2 font-bold text-[var(--text)]">Итого</td>
          <td class="py-2 text-right font-bold tabular-nums text-[var(--text)]">{{ energy.pct }} / 100</td>
          <td></td>
        </tr>
      </tfoot>
    </table>

    <p class="mt-3 text-[0.75rem] leading-snug text-[var(--text-muted)]">
      Считается из ваших чисел. Потолок этого приложения — 20%: выше нужны данные,
      которых оно не собирает.
    </p>
  </div>
</template>
