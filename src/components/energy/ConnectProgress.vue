<script setup>
import { Info } from 'lucide-vue-next'
import { LEVELS } from '../../composables/energyModel.js'

// Плашка юнита со статусом подключения и прогрессом по пути к буткемпу.
//
// Статус — процесс, а не продукт: «Ранскейл Мини» это имя приложения,
// а «Подключён» случается на буткемпе или с контрактом. Пока идёт первое
// и не случилось второе, честное слово одно — «Подключается».
//
// Сплошной шкалы под числом больше нет (D-113): она показывала ровно тот же
// процент, что стоит рядом цифрой, и первое, что человек делал на экране, —
// читал одно и то же дважды. Осталась лестница этапов: где он и куда ведёт
// дорога. Процентов у этапов нет — этап это место, а не оценка.
//
// Разбор состава открывается отсюда же: расшифровка числа стоит там, где
// стоит число, а не отдельной строкой под плашкой.

defineProps({
  unit: { type: String, default: '' },
  pct: { type: Number, default: 0 },
  levelId: { type: String, default: 'mini' },
})
defineEmits(['info'])

const levels = LEVELS
</script>

<template>
  <section
    class="rounded-[22px] px-4 pb-3.5 pt-3.5"
    :style="{ background: 'var(--surface-black)', color: 'var(--ink-on-color)' }"
  >
    <div class="flex items-start justify-between gap-3">
      <span class="min-w-0">
        <span class="block truncate text-[1.0625rem] font-bold leading-tight">{{ unit || 'Ваш бизнес' }}</span>
        <span class="mt-1 flex items-center gap-1.5">
          <span
            class="inline-block h-[7px] w-[7px] rounded-full"
            :style="{ background: 'var(--accent)' }"
            aria-hidden="true"
          ></span>
          <span class="text-[0.8125rem]" :style="{ color: 'var(--ink-on-color-muted)' }">Подключается</span>
        </span>
      </span>

      <span class="flex shrink-0 items-start gap-1">
        <span class="text-right">
          <span class="block text-[0.625rem] uppercase tracking-wide" :style="{ color: 'var(--ink-on-color-muted)' }">
            Энергия роста
          </span>
          <span class="block text-[1.75rem] font-bold leading-none tabular-nums">{{ pct }}%</span>
        </span>
        <button
          type="button"
          class="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          aria-label="Из чего сложился процент"
          @click="$emit('info')"
        >
          <Info class="h-[18px] w-[18px]" :style="{ color: 'var(--ink-on-color-muted)' }" :stroke-width="2" aria-hidden="true" />
        </button>
      </span>
    </div>

    <!-- Этапы пути. Пройденный — светлый, будущий — приглушённый; текущий подписан. -->
    <ol class="mt-3.5 flex items-start justify-between gap-1.5">
      <li
        v-for="l in levels"
        :key="l.id"
        class="flex min-w-0 flex-1 flex-col"
        :aria-current="l.id === levelId ? 'step' : undefined"
      >
        <span
          class="mb-1.5 h-[3px] w-full rounded-full"
          :style="{ background: l.id === levelId ? 'var(--accent)' : 'var(--line-on-color)' }"
          aria-hidden="true"
        ></span>
        <span
          class="truncate text-[0.75rem] leading-tight"
          :style="{
            color: l.id === levelId ? 'var(--ink-on-color)' : 'var(--ink-on-color-muted)',
            fontWeight: l.id === levelId ? 700 : 400,
          }"
        >{{ l.label }}</span>
      </li>
    </ol>
  </section>
</template>
