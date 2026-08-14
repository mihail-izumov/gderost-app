<script setup>
import { computed } from 'vue'
import { Lock, ChevronRight } from 'lucide-vue-next'
import { formatRub } from '../../i18n/format.js'
import { moduleGain } from '../../composables/energyModel.js'
import { MODULES, SESSIONS } from '../../i18n/energy.js'

// Лента сессий. Первая карточка — разбор, вход на дорогу; за ней четыре
// тематические сессии.
//
// До первого разбора остальные читаются целиком, но не заказываются (D-102):
// дорога начинается с разбора, и продавать сессию по плану человеку, чей план
// никто не видел, значит продавать наугад. Замок стоит на заказе, а не
// на информации: карточка открывается и показывает состав, цену и мощность.
//
// Лента горизонтальная и в один ряд: пять паспортов сравниваются глазами
// за секунду, а вертикальный список из пяти карточек занял бы весь экран
// и утопил бы всё, что под ним.

const props = defineProps({
  energy: { type: Object, required: true },
  unlocked: { type: Boolean, default: false },
})
defineEmits(['open'])

const cards = computed(() => SESSIONS.map((id) => {
  const mod = MODULES[id]
  const gain = moduleGain(id, props.energy)
  return {
    id,
    title: mod.title,
    subtitle: mod.subtitle,
    price: mod.price ? formatRub(mod.price) : 'на разборе',
    speed: mod.speed,
    gain,
    locked: id !== 'razbor' && !props.unlocked,
  }
}))
</script>

<template>
  <div class="-mx-4 overflow-x-auto px-4 pb-1">
    <ul class="flex snap-x snap-mandatory gap-2.5" style="scrollbar-width: none">
      <li v-for="c in cards" :key="c.id" class="w-[15.5rem] shrink-0 snap-start">
        <button
          type="button"
          class="flex h-full w-full flex-col rounded-2xl border border-[var(--rim)] p-3.5 text-left"
          :style="{ background: c.locked ? 'var(--surface-2)' : 'var(--surface)' }"
          @click="$emit('open', c.id)"
        >
          <span class="flex items-start justify-between gap-2">
            <span class="text-[0.9375rem] font-bold leading-tight text-[var(--text)]">{{ c.title }}</span>
            <Lock
              v-if="c.locked"
              class="h-4 w-4 shrink-0 text-[var(--text-muted)]"
              :stroke-width="2"
              aria-hidden="true"
            />
            <ChevronRight
              v-else
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

          <span class="mt-2 block text-[0.6875rem] text-[var(--text-muted)]">
            {{ c.locked ? 'Заказ — после первого разбора' : c.speed }}
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>
