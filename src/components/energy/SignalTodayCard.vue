<script setup>
import { computed } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import StatusChip from '../StatusChip.vue'
import { formatRub } from '../../i18n/format.js'
import { SIGNAL } from '../../i18n/energy.js'

// Сигнал сегодня — первая карточка вкладки «Сигналы».
//
// Вкладка обязана показывать сигналы, иначе её имя врёт. Поэтому выше
// товара стоит то, что владелец уже получает бесплатно: планка дня
// из его собственных чисел. Каждая строка носит статус и открывается
// тапом — происхождение числа и есть механика честной цифры.
//
// Числа планки совпадают с числами «Сегодня», и это названное решение,
// а не дубль: там они живут как состояние месяца, здесь — как сигнал
// с границей. Человек приходит сюда по баннеру дороги и читает те же
// числа в раме того, что продаётся.
//
// Граница внизу — главная строка карточки: действия и чит-кода в сигнале
// Мини нет, их ставит контур. Строка называет отсутствие своим словом
// вместо того, чтобы изображать совет.

const props = defineProps({
  // Результат `computeTodaySignal`: null — сигнала нет.
  signal: { type: Object, default: null },
  // Месяц закрыт: планка дня не существует, сигнал говорит про переход.
  over: { type: Boolean, default: false },
})
const emit = defineEmits(['origin', 'go'])

const rows = computed(() => {
  const s = props.signal
  if (!s) return []
  const out = []
  if (s.need != null) {
    out.push({ key: 'need', label: SIGNAL.need, value: formatRub(s.need) })
  }
  out.push({
    key: 'forecast',
    label: SIGNAL.forecast,
    value: formatRub(s.landing) + (s.planPct != null ? ` = ${s.planPct}% плана` : ''),
  })
  // Совпадение направлением не называется; недобор и запас — своим словом.
  out.push({
    key: 'gap',
    label: s.even ? SIGNAL.gapEven : s.gap > 0 ? SIGNAL.gapBehind : SIGNAL.gapAhead,
    value: s.even ? '' : formatRub(s.gap > 0 ? s.gap : s.surplus),
  })
  return out
})
</script>

<template>
  <section class="rounded-2xl bg-[var(--surface)] px-4 pb-3 pt-3.5">
    <p class="text-[0.625rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
      {{ SIGNAL.kicker }}
    </p>

    <!-- Живой сигнал: строки планки, каждая открывает происхождение числа. -->
    <template v-if="signal && !over">
      <ul class="mt-1 flex flex-col">
        <li v-for="(r, i) in rows" :key="r.key">
          <button
            type="button"
            class="flex min-h-[44px] w-full items-center justify-between gap-3 text-left"
            :class="i < rows.length - 1 ? 'border-b border-[var(--line)]' : ''"
            @click="emit('origin', r.key)"
          >
            <span class="text-[0.875rem] text-[var(--text-secondary)]">{{ r.label }}</span>
            <span class="flex shrink-0 items-center gap-1.5">
              <span v-if="r.value" class="text-[0.9375rem] font-bold tabular-nums text-[var(--text)]">{{ r.value }}</span>
              <StatusChip kind="computed" />
              <ChevronRight class="h-4 w-4 text-[var(--text-muted)]" :stroke-width="2.5" aria-hidden="true" />
            </span>
          </button>
        </li>
      </ul>
      <p class="mt-2 border-t border-[var(--line)] pt-2 text-[0.75rem] leading-snug text-[var(--text-muted)]">
        {{ SIGNAL.boundary }}
      </p>
    </template>

    <!-- Месяц закрыт: планки дня нет, и сигнал говорит одно — куда идти. -->
    <template v-else-if="over">
      <p class="mt-1 text-[0.9375rem] font-semibold text-[var(--text)]">{{ SIGNAL.closedTitle }}</p>
      <p class="mt-0.5 text-[0.875rem] leading-snug text-[var(--text-secondary)]">{{ SIGNAL.closedText }}</p>
    </template>

    <!-- Данных нет — сигнала нет. Правило контура: не из чего собрать
         утверждение — молчим, а не изображаем сигнал нулями. -->
    <template v-else>
      <p class="mt-1 text-[0.9375rem] font-semibold text-[var(--text)]">{{ SIGNAL.emptyTitle }}</p>
      <p class="mt-0.5 text-[0.875rem] leading-snug text-[var(--text-secondary)]">{{ SIGNAL.emptyText }}</p>
      <button
        type="button"
        class="mt-2.5 min-h-[44px] w-full rounded-full text-[0.875rem] font-bold"
        :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
        @click="emit('go', 'day')"
      >{{ SIGNAL.emptyCta }}</button>
    </template>
  </section>
</template>
