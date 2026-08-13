<script setup>
import { ref, computed } from 'vue'
import { ChevronRight, HelpCircle } from 'lucide-vue-next'
import WeekWidget from '../components/WeekWidget.vue'
import ValueSheet from '../components/ValueSheet.vue'
import HowItWorksSheet from '../components/HowItWorksSheet.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { formatRub, formatGrowth } from '../i18n/format.js'

// Цели и планы — четыре величины, четыре плашки, ни одного абзаца.
//
// Каждая плашка показывает имя и число и открывается тапом. Что это за
// величина, откуда берётся и можно ли её поменять — внутри, там же и правка,
// и только по отдельной кнопке: тап по цифре открывал бы клавиатуру раньше,
// чем человек решил менять.
//
// Плашки чёрные: это не карточки данных, а входы. Их четыре, они одинаковые
// и стоят в порядке метода — факт, прогноз, план, цель.
//
// Всё, что раньше объяснялось абзацами вокруг полей, собрано в «Как это
// работает» и открывается с любого места.

const store = useMiniStore()
const m = store.model
const state = store.state

const sheet = ref('')

const rows = computed(() => {
  if (!m.value) return []
  return [
    { key: 'fact', label: 'Факт', value: m.value.realizedRev, extra: '' },
    { key: 'forecast', label: 'Прогноз', value: m.value.landing, extra: formatGrowth(m.value.landDev) },
    { key: 'plan', label: 'План', value: m.value.T, extra: '' },
    { key: 'goal', label: 'Цель', value: m.value.goal, extra: '' },
  ]
})

// Цель ниже плана — не цель, а второй план. Называем это в той же шторке,
// где человек её и правит.
function goalErrorFor(v) {
  return Number(v) > 0 && Number(v) < Number(state.month_target)
    ? `Цель ниже плана ${formatRub(state.month_target)}.`
    : ''
}

const planDraftError = ref('')
const goalDraftError = ref('')

function savePlan(v) {
  if (!(Number(v) > 0)) { planDraftError.value = 'План не может быть пустым.'; return }
  planDraftError.value = ''
  store.setTargets({ target: v })
  sheet.value = ''
}
function saveGoal(v) {
  const err = goalErrorFor(v)
  if (err) { goalDraftError.value = err; return }
  goalDraftError.value = ''
  store.setTargets({ goal: v })
  sheet.value = ''
}
function saveCarry(v) {
  if (!state.carry) return
  store.setCarry({ amount: v, upTo: state.carry.upTo })
  sheet.value = ''
}
</script>

<template>
  <div v-if="m" class="px-4 pb-4">
    <!-- Тот же виджет, что на входе: месяц, в котором человек живёт, выглядит
         одинаково везде, где про него говорят. -->
    <WeekWidget tone="black" label="Этот месяц" />

    <div class="mt-3 flex flex-col gap-2">
      <button
        v-for="r in rows" :key="r.key"
        type="button"
        class="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left"
        :style="{ background: 'var(--surface-black)', color: 'var(--ink-on-color)' }"
        @click="sheet = r.key"
      >
        <span class="min-w-0 flex-1">
          <span class="block text-[0.8125rem]" :style="{ color: 'var(--ink-on-color-muted)' }">{{ r.label }}</span>
          <span class="mt-0.5 flex items-baseline gap-2">
            <span class="text-[1.5rem] font-bold leading-none tabular-nums">
              {{ r.value ? formatRub(r.value) : 'не поставлена' }}
            </span>
            <span v-if="r.extra" class="text-[0.875rem] font-semibold" :style="{ color: 'var(--ink-on-color-muted)' }">
              {{ r.extra }}
            </span>
          </span>
        </span>
        <ChevronRight class="h-5 w-5 shrink-0" :style="{ color: 'var(--ink-on-color-muted)' }" :stroke-width="2" aria-hidden="true" />
      </button>
    </div>

    <button
      type="button"
      class="mx-auto mt-4 flex min-h-[44px] items-center gap-2 rounded-full px-4 text-[0.9375rem] font-medium"
      :style="{ color: 'var(--action)' }"
      @click="sheet = 'how'"
    >
      <HelpCircle class="h-4 w-4" :stroke-width="2" aria-hidden="true" />
      Как это работает
    </button>

    <SiteFooter />

    <Teleport to="body">
      <div
        v-if="sheet"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-[var(--scrim)] backdrop-blur-sm"
        role="presentation"
        @click.self="sheet = ''"
      >
        <div class="max-h-[88svh] w-full max-w-[430px] overflow-y-auto rounded-t-2xl bg-[var(--bg)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <HowItWorksSheet v-if="sheet === 'how'" @close="sheet = ''" />

          <ValueSheet
            v-else-if="sheet === 'fact'"
            title="Факт"
            subtitle="Заработано с начала месяца: дни, которые вы внесли, плюс стартовая сумма."
            :value="m.realizedRev"
            :edit-label="state.carry ? 'Изменить стартовую сумму' : ''"
            hint="Заработано с начала месяца до первого внесённого дня"
            placeholder="1 250 000"
            @close="sheet = ''"
            @save="saveCarry"
          />

          <ValueSheet
            v-else-if="sheet === 'forecast'"
            title="Прогноз"
            subtitle="Куда приземлится месяц, если темп не изменится. Прогноз не ставится, он считается — и меняется только от внесённых дней."
            :value="m.landing"
            @close="sheet = ''"
          />

          <ValueSheet
            v-else-if="sheet === 'plan'"
            title="План"
            subtitle="Обязательство на месяц. Правка меняет то, что осталось разнести по открытым дням; закрытые дни остаются с прежней оценкой."
            :value="m.T"
            edit-label="Изменить план"
            hint="Сумма, которую вы обязаны сделать"
            placeholder="3 000 000"
            :error="planDraftError"
            @close="sheet = ''"
            @save="savePlan"
          />

          <ValueSheet
            v-else-if="sheet === 'goal'"
            title="Цель"
            subtitle="То, ради чего стараются сверх плана. Можно не ставить — тогда шкала строится до плана."
            :value="m.goal"
            edit-label="Изменить цель"
            hint="Сверх плана"
            placeholder="3 500 000"
            :error="goalDraftError"
            @close="sheet = ''"
            @save="saveGoal"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>
