<script setup>
import { computed, ref } from 'vue'
import { Check } from 'lucide-vue-next'
import BottomSheet from '../components/BottomSheet.vue'
import ConnectProgress from '../components/energy/ConnectProgress.vue'
import EnergyBreakdown from '../components/energy/EnergyBreakdown.vue'
import Telemetry from '../components/growth/Telemetry.vue'
import WeekRows from '../components/growth/WeekRows.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { computeEnergy } from '../composables/energyModel.js'
import { todayISO } from '../composables/miniModel.js'
import { HEAD, LEVEL_ROWS } from '../i18n/growth247.js'
import { plural } from '../i18n/format.js'
import { monthOf } from '../i18n/format.js'

// «Рост 24/7» — страница состояния, а не витрина системы.
//
// Образец — страница расхода в Claude: прозрачно, полосами, без лишних слов.
// Экран закрывает названный пробел: владелец не видит, что вносить нужно
// каждый день, не видит своих пропусков и не понимает, почему следующая
// неделя закрыта.
//
// Сверху вниз: повод (когда он есть) · статус с полосой пути · эта неделя ·
// недели месяца · что доступно сейчас · телеметрия. Первый экран без прокрутки
// показывает своё состояние; числа системы живут ниже.
//
// ⚠ Замок недели снимается вводом данных и никогда оплатой. Продавать снятие
// собственного замка нельзя: сначала создать препятствие, потом взять за него
// деньги — ровно то, за что метод ругает чужие калькуляторы. Разбор открывает
// не неделю, а глубину, и это стоит строкой в таблице уровня.

const emit = defineEmits(['go'])

const store = useMiniStore()
const state = store.state
const m = store.model

const breakdownOpen = ref(false)
const energy = computed(() => computeEnergy(state, m.value))
const today = computed(() => todayISO())

// Текущая неделя месяца приложения. На закрытом месяце текущей недели нет —
// тогда блок молчит, а не показывает «0 из 7» про август в июле.
// Заголовок списка недель называет месяц, о котором он говорит: «недели
// месяца» на закрытом августе читались бы как недели текущего календаря.
const weeksTitle = computed(() => (m.value ? `Недели ${monthOf(m.value.month)}` : 'Недели месяца'))

const thisWeek = computed(() => (m.value ? m.value.weeks.find((w) => w.isCurrent) || null : null))
const weekDone = computed(() => (thisWeek.value ? thisWeek.value.days.filter((d) => d.closed).length : 0))
const weekTotal = computed(() => (thisWeek.value ? thisWeek.value.days.length : 0))

// Повод-плашка. Есть пропуски в прошедших неделях — говорим о них и даём
// кнопку; повода нет — плашки нет. Пустая плашка «всё хорошо» приучает
// не читать это место вовсе.
const reason = computed(() => {
  if (!m.value) return null
  const blocked = m.value.weeks.find((w) => !w.open)
  if (blocked && blocked.blockedBy) {
    const n = blocked.blockedBy.days.length
    return {
      text: `В неделе ${blocked.blockedBy.idx} нет цифр за ${n} ${plural(n, 'день', 'дня', 'дней')}. Следующая неделя откроется, когда внесёте.`,
      iso: blocked.blockedBy.iso[0],
    }
  }
  const gap = m.value.weeks.find((w) => w.missing > 0)
  if (gap) {
    const n = gap.missing
    return {
      text: `Не внесено ${n} ${plural(n, 'день', 'дня', 'дней')}: ${gap.missingDays.join(', ')}.`,
      iso: gap.missingISO[0],
    }
  }
  return null
})
</script>

<template>
  <div v-if="m" class="w-full px-4 pb-4">
    <!-- 1 · Повод -->
    <div
      v-if="reason"
      class="mb-3 rounded-2xl border p-3.5"
      :style="{ borderColor: 'var(--warning)', background: 'var(--surface)' }"
    >
      <p class="text-[0.875rem] leading-snug text-[var(--text)]">{{ reason.text }}</p>
      <button
        type="button"
        class="mt-2.5 min-h-[44px] w-full rounded-xl text-[0.9375rem] font-semibold"
        :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
        @click="emit('go', 'day', reason.iso)"
      >Внести</button>
    </div>

    <!-- 2 · Статус и полоса пути -->
    <h2 class="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
      {{ HEAD.level }}
    </h2>
    <ConnectProgress
      :unit="state.unit || state.company"
      :pct="energy.pct"
      :level-id="energy.level.id"
      @info="breakdownOpen = true"
    />

    <!-- 4 · Эта неделя -->
    <section v-if="thisWeek" class="mt-4">
      <div class="flex items-baseline justify-between gap-3">
        <h2 class="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
          {{ HEAD.week }}
        </h2>
        <span class="text-[0.8125rem] font-semibold tabular-nums text-[var(--text)]">
          {{ weekDone }} из {{ weekTotal }}
        </span>
      </div>
      <span class="mt-2 block h-[8px] w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
        <span
          class="block h-full rounded-full"
          :style="{ width: `${weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0}%`, background: 'var(--text)' }"
        ></span>
      </span>
      <p class="mt-1.5 text-[0.75rem] text-[var(--text-muted)]">Счёт начнётся заново в понедельник.</p>
    </section>

    <!-- 4 · Недели месяца -->
    <div class="mt-4">
      <WeekRows :m="m" :today="today" :month-title="weeksTitle" @enter="emit('go', 'day', $event)" />
    </div>

    <!-- 5 · Доступно сейчас. Пустой круг вместо прочерка: место под то, чего
         ещё нет, а не знак отсутствия. Чем открывается — бейджем. -->
    <section class="mt-5">
      <h2 class="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
        {{ HEAD.access }}
      </h2>
      <ul class="mt-2 overflow-hidden rounded-2xl bg-[var(--surface)]">
        <li
          v-for="r in LEVEL_ROWS"
          :key="r.id"
          class="flex min-h-[48px] items-center gap-3 border-b border-[var(--line)] px-4 py-2.5 last:border-b-0"
        >
          <span
            v-if="r.has"
            class="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full"
            :style="{ background: 'var(--positive)' }"
            aria-hidden="true"
          >
            <Check class="h-[13px] w-[13px]" :style="{ color: 'var(--ink-on-color)' }" :stroke-width="3" />
          </span>
          <span
            v-else
            class="h-[20px] w-[20px] shrink-0 rounded-full border-2"
            :style="{ borderColor: 'var(--line)' }"
            aria-hidden="true"
          ></span>
          <span class="min-w-0 flex-1 text-[0.9375rem] leading-snug text-[var(--text)]">{{ r.what }}</span>
          <span
            v-if="!r.has"
            class="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide"
            :style="{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }"
          >{{ r.by }}</span>
        </li>
      </ul>
    </section>

    <!-- 6 · Числа системы: сначала человек про себя, потом про нас -->
    <div class="mt-5">
      <Telemetry />
    </div>

    <SiteFooter />

    <BottomSheet :open="breakdownOpen" @close="breakdownOpen = false">
      <EnergyBreakdown :energy="energy" @close="breakdownOpen = false" />
    </BottomSheet>
  </div>
</template>
