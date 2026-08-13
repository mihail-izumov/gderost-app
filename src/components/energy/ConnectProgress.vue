<script setup>
import { computed } from 'vue'
import { LEVELS } from '../../composables/energyModel.js'

// Плашка юнита со статусом подключения и прогрессом по всему пути.
//
// Статус — процесс, а не продукт: «Ранскейл Мини» это имя приложения,
// а «Подключён» случается на буткемпе или с контрактом. Пока идёт первое
// и не случилось второе, честное слово одно — «Подключается».
//
// Прогресс показывает ВСЕ четыре этапа и всегда. Прогресс из одного шага —
// это кнопка, а не прогресс; пункт назначения виден с первого дня, и человек
// сам видит, какой строки у него ещё нет.
//
// Идиома взята у индикатора зарядки: заполненная часть шкалы, отметки этапов
// и одно число. Цен на этапах нет — их называет человек на разборе.

const props = defineProps({
  unit: { type: String, default: '' },
  pct: { type: Number, default: 0 },
  levelId: { type: String, default: 'mini' },
})

const levels = LEVELS
const filled = computed(() => Math.max(0, Math.min(100, props.pct)))
const reached = (cap) => props.pct >= cap
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
      <span class="shrink-0 text-right">
        <span class="block text-[0.625rem] uppercase tracking-wide" :style="{ color: 'var(--ink-on-color-muted)' }">
          Энергия роста
        </span>
        <span class="block text-[1.75rem] font-bold leading-none tabular-nums">{{ pct }}%</span>
      </span>
    </div>

    <!-- Шкала: заполнено ровно посчитанным процентом. -->
    <div
      class="mt-3.5 h-[10px] w-full overflow-hidden rounded-full"
      :style="{ background: 'var(--line-on-color)' }"
      role="img"
      :aria-label="`Энергия роста ${pct} процентов из 100`"
    >
      <div
        class="h-full rounded-full transition-all"
        :style="{ width: `${filled}%`, background: 'var(--accent)' }"
      ></div>
    </div>

    <!-- Этапы. Пройденный — светлый, будущий — приглушённый; текущий подписан. -->
    <ol class="mt-2.5 flex items-start justify-between gap-1">
      <li
        v-for="l in levels"
        :key="l.id"
        class="flex min-w-0 flex-1 flex-col"
        :aria-current="l.id === levelId ? 'step' : undefined"
      >
        <span
          class="mb-1 h-[3px] w-full rounded-full"
          :style="{ background: reached(l.cap) ? 'var(--accent)' : 'var(--line-on-color)' }"
          aria-hidden="true"
        ></span>
        <span
          class="truncate text-[0.6875rem] leading-tight"
          :style="{
            color: l.id === levelId ? 'var(--ink-on-color)' : 'var(--ink-on-color-muted)',
            fontWeight: l.id === levelId ? 700 : 400,
          }"
        >{{ l.label }}</span>
        <span class="text-[0.625rem] tabular-nums" :style="{ color: 'var(--ink-on-color-muted)' }">
          {{ l.cap }}%
        </span>
      </li>
    </ol>
  </section>
</template>
