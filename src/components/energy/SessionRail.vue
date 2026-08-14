<script setup>
import { computed } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { formatRub } from '../../i18n/format.js'
import { moduleGain } from '../../composables/energyModel.js'
import { MODULES, SESSIONS, isLocked } from '../../i18n/energy.js'

// Лента ступеней. Четыре карточки лестницей вовлечения: владелец и 90 минут →
// владелец и серия разборов → команда и данные → система и поток.
//
// Замок стоит на заказе, а не на информации: карточка открывается и показывает
// состав, цену и мощность. Серия заперта до состоявшегося разбора — продавать
// раскладку плана человеку, чей план никто не видел, значит продавать наугад.
// Режим заперт всегда: в него входят по вердикту буткемпа, и открыть его
// нажатием в приложении нельзя.
//
// Состояние карточки называется словом, а не угадывается по цвету фона:
// «Ожидание» — заказ закрыт, «Доступно» — можно заказывать, «Завершена» —
// пройдено. Доступная карточка залита зелёным: это единственное место экрана,
// где цвет означает «здесь можно действовать».
//
// Лента горизонтальная и в один ряд: паспорта сравниваются глазами за секунду,
// а вертикальный список занял бы весь экран и утопил бы всё, что под ним.

const props = defineProps({
  energy: { type: Object, required: true },
  unlocked: { type: Boolean, default: false },
  // Отправленные заявки: по ним карточка знает, что сессия уже заказана.
  requests: { type: Array, default: () => [] },
  // Разбор оценён — значит он состоялся.
  rated: { type: Boolean, default: false },
})
defineEmits(['open'])

const STATE = {
  wait: { label: 'Ожидание', bg: 'var(--surface-2)', ink: 'var(--text-muted)' },
  open: { label: 'Доступно', bg: 'var(--positive)', ink: 'var(--ink-on-color)' },
  done: { label: 'Завершена', bg: 'var(--text)', ink: 'var(--ink-on-color)' },
}

const cards = computed(() => SESSIONS.map((id) => {
  const mod = MODULES[id]
  const gain = moduleGain(id, props.energy)
  const locked = isLocked(id, props.unlocked)
  const done = id === 'razbor' && props.rated
  const state = done ? 'done' : locked ? 'wait' : 'open'
  const price = mod.price
    ? formatRub(mod.price) + (mod.priceUnit ? ' / мес' : '')
    : 'на разборе'
  return {
    id,
    title: mod.title,
    subtitle: mod.subtitle,
    price,
    speed: mod.speed,
    gain,
    state,
    // Запертая ступень объясняет замок своим словом: «Ожидание» без причины
    // читается как ошибка приложения.
    label: locked && mod.lockChip ? mod.lockChip : STATE[state].label,
    chipBg: STATE[state].bg,
    chipInk: STATE[state].ink,
    // Заливкой отмечаем только то, что можно заказать прямо сейчас.
    cardBg: state === 'open'
      ? 'color-mix(in srgb, var(--positive) 12%, var(--surface))'
      : 'var(--surface)',
  }
}))
</script>

<template>
  <div class="-mx-4 overflow-x-auto px-4 pb-1">
    <ul class="flex snap-x snap-mandatory gap-2.5" style="scrollbar-width: none">
      <li v-for="c in cards" :key="c.id" class="w-[15.5rem] shrink-0 snap-start">
        <button
          type="button"
          class="flex h-full w-full flex-col rounded-2xl p-3.5 text-left"
          :style="{ background: c.cardBg }"
          @click="$emit('open', c.id)"
        >
          <span class="flex items-start justify-between gap-2">
            <span class="text-[0.9375rem] font-bold leading-tight text-[var(--text)]">{{ c.title }}</span>
            <ChevronRight
              class="h-[18px] w-[18px] shrink-0 text-[var(--text-muted)]"
              :stroke-width="2.5"
              aria-hidden="true"
            />
          </span>

          <span class="mt-1 block text-[0.75rem] leading-snug text-[var(--text-secondary)]">{{ c.subtitle }}</span>

          <span class="mt-3 flex items-end justify-between gap-2">
            <span>
              <span class="block text-[0.625rem] uppercase tracking-wide text-[var(--text-muted)]">Расход</span>
              <span class="block text-[0.9375rem] font-bold tabular-nums text-[var(--text)]">{{ c.price }}</span>
            </span>
            <span class="text-right">
              <span class="block text-[0.625rem] uppercase tracking-wide text-[var(--text-muted)]">Мощность</span>
              <span class="block text-[0.9375rem] font-bold tabular-nums text-[var(--text)]">
                {{ c.gain > 0 ? `+${c.gain}%` : '—' }}
              </span>
            </span>
          </span>

          <span class="mt-2.5 flex items-center justify-between gap-2">
            <span
              class="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.625rem]
                     font-medium uppercase tracking-wide"
              :style="{ background: c.chipBg, color: c.chipInk }"
            >{{ c.label }}</span>
            <span class="truncate text-[0.6875rem] text-[var(--text-muted)]">{{ c.speed }}</span>
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>
