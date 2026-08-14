<script setup>
import { computed, ref } from 'vue'
import { Star, Check } from 'lucide-vue-next'
import ConnectProgress from '../components/energy/ConnectProgress.vue'
import EnergyBreakdown from '../components/energy/EnergyBreakdown.vue'
import EntityLadder from '../components/energy/EntityLadder.vue'
import ModulePassport from '../components/energy/ModulePassport.vue'
import SessionRail from '../components/energy/SessionRail.vue'
import RateRazborSheet from '../components/energy/RateRazborSheet.vue'
import ShareMonthButton from '../components/ShareMonthButton.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { computeEnergy, computeGaps } from '../composables/energyModel.js'

// «Буткемп» — вкладка, на которой человек видит, на чём стоят его числа
// и чем каждое из них поднимается.
//
// Экран стоит на одном развороте: плашка, четыре карты, лента сессий, отметка
// разбора и одна кнопка. Всё остальное — состав энергии, паспорта модулей,
// заказ — живёт в модалках и открывается оттуда, где о нём зашла речь
// (D-112). До правки экран рассказывал всё сразу и оттого читался как текст,
// а не как прибор.
//
// Числа владельца на экране есть — значит и тон обычный: экран сообщает
// состояние и не объясняет себя абзацами.

const store = useMiniStore()
const m = store.model
const state = store.state

const energy = computed(() => computeEnergy(state, m.value))
const gaps = computed(() => computeGaps(m.value))

// Сессии открываются отметкой о состоявшемся разборе. Проверить её нечем,
// и заказ всё равно проходит через живого человека — отметка открывает
// возможность заказать, а не сам продукт.
const unlocked = computed(() => state.razborRating !== null && state.razborRating !== undefined)

const breakdownOpen = ref(false)
const rateOpen = ref(false)
const moduleOpen = ref('')

function openModule(id) {
  moduleOpen.value = id
}
function fromModuleToRate() {
  moduleOpen.value = ''
  rateOpen.value = true
}
</script>

<template>
  <div v-if="m" class="w-full px-4 pb-4">
    <ConnectProgress
      :unit="state.unit || state.company"
      :pct="energy.pct"
      :level-id="energy.level.id"
      @info="breakdownOpen = true"
    />

    <EntityLadder class="mt-3" :model="m" :energy="energy" :gaps="gaps" @module="openModule" />

    <h2 class="mb-2 mt-5 text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
      Сессии
    </h2>
    <SessionRail :energy="energy" :unlocked="unlocked" @open="openModule" />

    <!-- Отметка разбора видна сразу: без неё петля обрывается на середине
         и непонятно, чем открываются остальные карточки. -->
    <button
      type="button"
      class="mt-2.5 flex min-h-[52px] w-full items-center justify-between gap-3 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] px-4 text-left"
      @click="rateOpen = true"
    >
      <span class="flex min-w-0 items-center gap-2.5">
        <Check v-if="unlocked" class="h-[18px] w-[18px] shrink-0" :style="{ color: 'var(--positive)' }" :stroke-width="2.5" aria-hidden="true" />
        <Star v-else class="h-[18px] w-[18px] shrink-0 text-[var(--text-muted)]" :stroke-width="2" aria-hidden="true" />
        <span class="min-w-0">
          <span class="block text-[0.9375rem] font-semibold text-[var(--text)]">
            {{ unlocked ? `Разбор оценён: ${state.razborRating} из 10` : 'Разбор уже был?' }}
          </span>
          <span class="block truncate text-[0.75rem] text-[var(--text-muted)]">
            {{ unlocked ? 'Сессии открыты' : 'Оцените пользу — откроются остальные сессии' }}
          </span>
        </span>
      </span>
      <span class="shrink-0 text-[0.8125rem] font-medium" :style="{ color: 'var(--action)' }">
        {{ unlocked ? 'Изменить' : 'Оценить' }}
      </span>
    </button>

    <ShareMonthButton class="mt-4" tone="accent" label="Поделиться" />

    <SiteFooter />

    <!-- Состав энергии -->
    <Teleport to="body">
      <div
        v-if="breakdownOpen"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-[var(--scrim)] backdrop-blur-sm"
        role="presentation"
        @click.self="breakdownOpen = false"
      >
        <div class="max-h-[88svh] w-full max-w-[430px] overflow-y-auto rounded-t-2xl bg-[var(--bg)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <EnergyBreakdown :energy="energy" @close="breakdownOpen = false" />
        </div>
      </div>
    </Teleport>

    <!-- Паспорт модуля и заказ -->
    <Teleport to="body">
      <div
        v-if="moduleOpen"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-[var(--scrim)] backdrop-blur-sm"
        role="presentation"
        @click.self="moduleOpen = ''"
      >
        <div class="max-h-[88svh] w-full max-w-[430px] overflow-y-auto rounded-t-2xl bg-[var(--bg)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <ModulePassport
            :module-id="moduleOpen"
            :energy="energy"
            :locked="moduleOpen !== 'razbor' && !unlocked"
            @rate="fromModuleToRate"
          />
          <button
            type="button"
            class="mt-3 min-h-[44px] w-full rounded-full text-[0.875rem] font-medium text-[var(--text-muted)]"
            @click="moduleOpen = ''"
          >Закрыть</button>
        </div>
      </div>
    </Teleport>

    <!-- Оценка разбора -->
    <Teleport to="body">
      <div
        v-if="rateOpen"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-[var(--scrim)] backdrop-blur-sm"
        role="presentation"
        @click.self="rateOpen = false"
      >
        <div class="max-h-[88svh] w-full max-w-[430px] overflow-y-auto rounded-t-2xl bg-[var(--bg)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <RateRazborSheet @close="rateOpen = false" />
        </div>
      </div>
    </Teleport>
  </div>
</template>
