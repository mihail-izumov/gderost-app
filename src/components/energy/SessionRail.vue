<script setup>
import { computed } from 'vue'
import { ChevronRight, Lock } from 'lucide-vue-next'
import { formatRub } from '../../i18n/format.js'
import { moduleGain } from '../../composables/energyModel.js'
import { MODULES, RAIL, isLocked } from '../../i18n/energy.js'

// Лента ступеней. Три карточки лестницей вовлечения: владелец и 90 минут →
// владелец и серия разборов → команда и данные. Режим живёт баннером ниже.
//
// Замок стоит на заказе, а не на информации: карточка открывается и показывает
// состав, цену и мощность. Серия и буткемп заперты до состоявшегося разбора —
// продавать раскладку плана человеку, чей план никто не видел, значит
// продавать наугад.
//
// Доступная ступень залита зелёным целиком, и весь её текст — на цвете. Это
// единственное место экрана, где цвет означает «здесь можно действовать»,
// и полутон был слишком тихим для единственного действия на ленте. Бейдж
// на ней белый: салатовый на зелёном — производный оттенок, а таких в системе
// нет. Запертые карточки остаются обычными светлыми.
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

const cards = computed(() => RAIL.map((id) => {
  const mod = MODULES[id]
  const gain = moduleGain(id, props.energy)
  const locked = isLocked(id, props.unlocked)
  const done = id === 'razbor' && props.rated
  const state = done ? 'done' : locked ? 'wait' : 'open'
  const price = mod.price
    ? formatRub(mod.price) + (mod.priceUnit ? ' / мес' : '')
    : 'на разборе'
  // На цветной заливке весь текст белый: цветного текста в системе нет,
  // а полутонов на цвете — тем более.
  const onColor = state !== 'wait'
  return {
    id,
    title: mod.title,
    subtitle: mod.subtitle,
    price,
    gain,
    state,
    locked,
    onColor,
    label: locked && mod.lockChip ? mod.lockChip : state === 'done' ? 'Завершена' : 'Доступно',
    cardBg: state === 'open' ? 'var(--positive)'
      : state === 'done' ? 'var(--text)'
        : 'var(--surface)',
    ink: onColor ? 'var(--ink-on-color)' : 'var(--text)',
    inkMuted: onColor ? 'var(--ink-on-color-muted)' : 'var(--text-secondary)',
    inkFaint: onColor ? 'var(--ink-on-color-muted)' : 'var(--text-muted)',
    chipBg: onColor ? 'var(--ink-on-color)' : 'var(--surface-2)',
    chipInk: onColor ? 'var(--text)' : 'var(--text-muted)',
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
            <span class="text-[0.9375rem] font-bold leading-tight" :style="{ color: c.ink }">{{ c.title }}</span>
            <!-- Замок вместо стрелки у запертой ступени: стрелка обещает шаг
                 вперёд, а шага вперёд отсюда пока нет. Паспорт всё равно
                 открывается — заперт заказ, а не чтение. -->
            <Lock
              v-if="c.locked"
              class="h-[18px] w-[18px] shrink-0"
              :style="{ color: c.inkFaint }"
              :stroke-width="2"
              aria-hidden="true"
            />
            <ChevronRight
              v-else
              class="h-[18px] w-[18px] shrink-0"
              :style="{ color: c.inkFaint }"
              :stroke-width="2.5"
              aria-hidden="true"
            />
          </span>

          <span class="mt-1 block text-[0.75rem] leading-snug" :style="{ color: c.inkMuted }">{{ c.subtitle }}</span>

          <span class="mt-3 flex items-end justify-between gap-2">
            <span>
              <span class="block text-[0.625rem] uppercase tracking-wide" :style="{ color: c.inkFaint }">Расход</span>
              <span class="block text-[0.9375rem] font-bold tabular-nums" :style="{ color: c.ink }">{{ c.price }}</span>
            </span>
            <span class="text-right">
              <span class="block text-[0.625rem] uppercase tracking-wide" :style="{ color: c.inkFaint }">Мощность</span>
              <span class="block text-[0.9375rem] font-bold tabular-nums" :style="{ color: c.ink }">
                {{ c.gain > 0 ? `+${c.gain}%` : '—' }}
              </span>
            </span>
          </span>

          <!-- Времени встречи на карточке нет: выбор ступени оно не двигает,
               а место занимало. Длительность стоит в паспорте, где человек
               уже решает, идти ли. -->
          <span class="mt-2.5 flex items-center">
            <span
              class="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.625rem]
                     font-medium uppercase tracking-wide"
              :style="{ background: c.chipBg, color: c.chipInk }"
            >{{ c.label }}</span>
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>
