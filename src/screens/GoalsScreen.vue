<script setup>
import { ref, computed, watch } from 'vue'
import { ChevronLeft, AlertCircle } from 'lucide-vue-next'
import MoneyField from '../components/MoneyField.vue'
import StatusChip from '../components/StatusChip.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { formatRub, formatGrowth, monthLabel } from '../i18n/format.js'

// Цели и планы. Четыре сущности стоят здесь в своём порядке — факт, прогноз,
// план, цель, — и порядок этот не украшение, а весь метод:
//
//   факт — что уже произошло, спорить не с чем;
//   прогноз — куда несёт текущий темп, считается и не выбирается;
//   план — обязательство, его ставит владелец;
//   цель — то, ради чего стараются сверх обязательства.
//
// План и цель правятся в любой момент: обязательство живое. Но правка плана
// не переписывает прошлое — закрытые дни остались измеренными по той линейке,
// что стояла в момент ввода.

const store = useMiniStore()
const m = store.model
const state = store.state
const emit = defineEmits(['back'])

const target = ref(state.month_target || null)
const goal = ref(state.month_goal)

watch(() => state.month_target, (v) => { target.value = v || null })
watch(() => state.month_goal, (v) => { goal.value = v })

const targetOk = computed(() => Number(target.value) > 0)
const goalConflict = computed(() =>
  Number(goal.value) > 0 && targetOk.value && Number(goal.value) < Number(target.value))
const dirty = computed(() =>
  Number(target.value || 0) !== Number(state.month_target || 0)
  || Number(goal.value || 0) !== Number(state.month_goal || 0))
const canSave = computed(() => targetOk.value && !goalConflict.value && dirty.value)

// Прогноз уже выше плана — предупреждение, а не запрет: план ставит владелец,
// и запрещать ему занижать обязательство мы не вправе. Назвать это обязаны.
const planBelowForecast = computed(() =>
  targetOk.value && m.value && m.value.landing > Number(target.value) * 1.001)

function save() {
  if (!canSave.value) return
  store.setTargets({ target: target.value, goal: goal.value })
}
</script>

<template>
  <div v-if="m" class="w-full pb-10">
    <header class="pt-2">
      <button
        type="button"
        class="-ml-1 flex min-h-[44px] items-center gap-1 text-[0.9375rem] font-medium"
        :style="{ color: 'var(--action)' }"
        @click="emit('back')"
      >
        <ChevronLeft class="h-5 w-5" aria-hidden="true" />
        Сегодня
      </button>
      <h1 class="mt-1 font-brand text-[1.75rem] font-bold leading-tight tracking-tight text-[var(--text)]">
        Цели и планы
      </h1>
      <p class="mt-2 text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
        {{ monthLabel(m.month) }}. План — обязательство, цель — то, ради чего стараются
        сверх него. Прогноз не ставится, он считается.
      </p>
    </header>

    <!-- Порядок четырёх сущностей, как он есть сейчас -->
    <section class="mt-5 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
      <h2 class="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Где вы сейчас
      </h2>
      <dl class="mt-3 flex flex-col gap-3">
        <div class="flex items-baseline justify-between gap-3">
          <dt class="flex items-center gap-1.5 text-[0.875rem] text-[var(--text-secondary)]">
            Факт <StatusChip kind="said" />
          </dt>
          <dd class="font-mono text-[0.9375rem] tabular-nums text-[var(--text)]">
            {{ formatRub(m.realizedRev) }}
          </dd>
        </div>
        <div class="flex items-baseline justify-between gap-3">
          <dt class="flex items-center gap-1.5 text-[0.875rem] text-[var(--text-secondary)]">
            Прогноз <StatusChip kind="computed" />
          </dt>
          <dd class="text-right">
            <span class="font-mono text-[0.9375rem] tabular-nums text-[var(--text)]">
              {{ formatRub(m.landing) }}
            </span>
            <span class="ml-1.5 font-mono text-[0.75rem] tabular-nums text-[var(--text-muted)]">
              {{ formatGrowth(m.landDev) }}
            </span>
          </dd>
        </div>
        <div class="flex items-baseline justify-between gap-3">
          <dt class="text-[0.875rem] text-[var(--text-secondary)]">План</dt>
          <dd class="font-mono text-[0.9375rem] tabular-nums text-[var(--text)]">
            {{ formatRub(m.T) }}
          </dd>
        </div>
        <div class="flex items-baseline justify-between gap-3">
          <dt class="text-[0.875rem] text-[var(--text-secondary)]">Цель</dt>
          <dd class="font-mono text-[0.9375rem] tabular-nums text-[var(--text)]">
            {{ m.goal ? formatRub(m.goal) : 'не поставлена' }}
          </dd>
        </div>
      </dl>
    </section>

    <!-- Правка -->
    <form class="mt-4 flex flex-col gap-5" @submit.prevent="save">
      <MoneyField
        id="mini-goals-target"
        v-model="target"
        label="План месяца"
        hint="Сумма, которую вы обязаны сделать"
        placeholder="3 000 000"
      />

      <div>
        <MoneyField
          id="mini-goals-goal"
          v-model="goal"
          label="Цель"
          hint="Сверх плана. Оставьте пустой, если её нет"
          placeholder="Можно без цели"
        />
        <p
          v-if="goalConflict"
          class="mt-2 flex items-start gap-1.5 text-[0.8125rem] leading-snug text-[var(--negative)]"
        >
          <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Цель ниже плана — тогда это не цель, а другой план.
            Порядок один: прогноз, план, цель.
          </span>
        </p>
      </div>

      <p v-if="planBelowForecast" class="text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
        Прогноз уже выше плана. Так бывает, и запрещать это мы не станем —
        план ваш. Но обязательство ниже того, что и так произойдёт,
        перестаёт быть обязательством.
      </p>

      <p class="text-[0.75rem] leading-snug text-[var(--text-muted)]">
        Правка плана меняет то, что осталось разнести по открытым дням.
        Закрытые дни остаются с той оценкой, что получили: их мерили
        по плану, который стоял тогда, и переписывать это задним числом
        приложение не станет.
      </p>

      <button
        type="submit"
        class="min-h-[52px] w-full rounded-xl text-[1.0625rem] font-semibold transition-opacity disabled:opacity-40"
        :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
        :disabled="!canSave"
      >Сохранить</button>
    </form>

    <!-- Место переключателя сценариев занято честно: контрол здесь будет,
         но выдумывать за него содержимое — то же враньё, что фейковое превью. -->
    <section class="mt-6 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
      <div class="flex items-center gap-2">
        <h2 class="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
          Сценарий прогноза
        </h2>
        <StatusChip kind="computed" />
      </div>
      <p class="mt-2 text-[0.9375rem] font-semibold text-[var(--text)]">
        Один, публикуемый
      </p>
      <p class="mt-1 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
        Переключатель сценариев встанет сюда. Сегодня прогноз один и переключать
        его нечем: выбирать между прогнозами значит выбирать удобный, а месяц
        приземлится туда, куда его несёт темп.
      </p>
    </section>
  </div>
</template>
