<script setup>
import { computed } from 'vue'
import { BY_LABEL } from '../../i18n/energy.js'

// На чём стоят цифры владельца — разбор числа из плашки статуса.
//
// ⚠ Переписано 18.08. Прежняя версия печатала «Из чего сложились 20%»,
// пять строк вида «5 / 20» и подпись «Потолок этого приложения — 20%».
// Каждая строка была верна, и вместе они не отвечали на единственный вопрос,
// с которым сюда заходят: а что это вообще за число и почему оно такое.
// Проценты и доли — язык расчёта; человек, открывший разбор, спрашивает
// про свои цифры.
//
// Поэтому здесь теперь: что за часть, в каком она состоянии сейчас, что её
// делает точнее. Проценты остались одной строкой внизу — они честные,
// и прятать их незачем, но первым делом читается не они.
//
// Мостик на будущее — последняя строка. Она называет, что стоит выше, и прямо
// говорит, что это не сегодняшний разговор: без цены, кнопки и обещания.
// Продажа в разделе, где человек смотрит на своё состояние, — это шум.

const props = defineProps({
  energy: { type: Object, required: true },
})
defineEmits(['close'])

const rows = computed(() => props.energy.parts.map((p) => ({
  key: p.key,
  label: p.label,
  // Состояние словом, а не долей: «со слов» человек понимает сразу,
  // «5 / 20» требует знать шкалу.
  status: p.on ? p.status : 'ещё нет',
  on: p.on,
  next: p.nextGain > 0
    ? `Точнее — ${BY_LABEL[p.nextBy] || p.nextBy}: ${p.nextLabel}`
    : '',
})))
</script>

<template>
  <div>
    <h2 class="text-[1.0625rem] font-bold text-[var(--text)]">На чём стоят ваши цифры</h2>
    <p class="mt-1 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
      Трек считает на том, что вы ввели. Здесь видно, что уже есть и что делает
      прогноз точнее.
    </p>

    <ul class="mt-3 flex flex-col">
      <li
        v-for="r in rows"
        :key="r.key"
        class="border-b border-[var(--line)] py-2.5 last:border-b-0"
      >
        <span class="flex items-baseline gap-2">
          <span class="text-[0.9375rem] font-semibold text-[var(--text)]">{{ r.label }}</span>
          <span
            class="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide"
            :style="r.on
              ? { background: 'var(--surface-2)', color: 'var(--text-secondary)' }
              : { background: 'var(--surface-2)', color: 'var(--text-muted)' }"
          >{{ r.status }}</span>
        </span>
        <span v-if="r.next" class="mt-0.5 block text-[0.75rem] leading-snug text-[var(--text-muted)]">
          {{ r.next }}
        </span>
      </li>
    </ul>

    <!-- Само число. Стоит после разбора, а не до него: сначала человек читает
         про свои цифры, потом видит, во что это сложилось. -->
    <div class="mt-3 flex items-baseline justify-between gap-3 border-t border-[var(--line)] pt-3">
      <span class="text-[0.9375rem] font-bold text-[var(--text)]">Энергия роста</span>
      <span class="text-[1.0625rem] font-bold tabular-nums text-[var(--text)]">{{ energy.pct }} / 100</span>
    </div>

    <!-- Мостик. Называет следующий уровень словами и закрывает тему:
         «не сейчас» здесь — обещание не продавать, а не приманка. -->
    <p class="mt-2 text-[0.75rem] leading-snug text-[var(--text-muted)]">
      Выше поднимают проверенные данные и план, собранный с командой. Это работа
      с инженерами Ранскеил, и она начинается с разбора — не сегодня и не отсюда.
    </p>

    <button
      type="button"
      class="mt-4 min-h-[48px] w-full rounded-full text-[0.9375rem] font-bold"
      :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      @click="$emit('close')"
    >Понятно</button>
  </div>
</template>
