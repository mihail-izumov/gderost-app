<script setup>
import { computed, ref } from 'vue'
import { Gauge, Target, RotateCw, Info } from 'lucide-vue-next'
import MonthWidget from '../components/MonthWidget.vue'
import WidgetCard from '../components/WidgetCard.vue'
import CountersCard from '../components/CountersCard.vue'
import InstallBanner from '../components/InstallBanner.vue'
import { hardReload } from '../composables/useAppRefresh.js'
import { useMiniStore } from '../composables/useMiniStore.js'
import { formatRubBig, formatPct, formatGrowth, monthLabel } from '../i18n/format.js'

// «Сегодня» — дека виджетов. Каждый показывает главное число своего раздела
// и открывается тапом; глубина живёт внутри, а не здесь.
//
// Устройство взято у рабочего Ранскейла и держится на одном правиле: экран
// не рассказывает, он показывает состояние. Владелец открывает приложение,
// чтобы за пять секунд понять, куда идёт месяц, — и заходит вглубь только
// тогда, когда состояние ему не нравится.

const emit = defineEmits(['go'])

const store = useMiniStore()
const m = store.model
const monthOver = store.monthOver
const state = store.state

const askReset = ref(false)
const showHelp = ref(false)

const SIG = { good: 'var(--positive)', warn: 'var(--warning)', bad: 'var(--negative)', idle: 'var(--text)' }

const onPlanTone = computed(() => {
  const r = m.value ? m.value.onPlan : null
  if (r == null) return SIG.idle
  return r >= 1 ? SIG.good : r >= 0.85 ? SIG.warn : SIG.bad
})
const fcTone = computed(() => (m.value ? SIG[m.value.fcSig] || SIG.idle : SIG.idle))

// Разрыв — деньгами и со знаком: «не доедем на 0,9 млн» тянет за собой решение,
// «минус 13 %» не тянет.
const gapValue = computed(() => {
  if (!m.value) return '—'
  const short = m.value.T - m.value.landing
  return `${short > 0 ? '− ' : short < 0 ? '+ ' : ''}${formatRubBig(Math.abs(short))}`
})

function reset() {
  store.reset()
  askReset.value = false
}
</script>

<template>
  <div v-if="m" class="w-full pb-10">
    <header class="flex items-center justify-between gap-2 pt-1">
      <span class="min-w-0 truncate rounded-full bg-[var(--graphite)] px-4 py-2 text-[0.875rem]
                   font-semibold uppercase tracking-wide text-[var(--ink-on-color)]">
        {{ state.unit || state.company || 'Ваш бизнес' }}
      </span>
      <button
        type="button"
        class="flex h-11 w-11 shrink-0 items-center justify-center"
        aria-label="Обновить приложение"
        @click="hardReload"
      >
        <RotateCw class="h-5 w-5 text-[var(--text-secondary)]" aria-hidden="true" />
      </button>
    </header>

    <!-- Календарь ушёл вперёд: делать вид, что месяц идёт, приложение не станет -->
    <p
      v-if="monthOver"
      class="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3
             text-[0.8125rem] leading-snug text-[var(--text-secondary)]"
    >
      {{ monthLabel(m.month) }} закончился. Числа ниже — итог того месяца.
      Новый месяц заводится вводом нового плана.
    </p>

    <div class="mt-3">
      <CountersCard clickable @open="emit('go', 'runscale')" />
    </div>

    <div class="mt-3">
      <MonthWidget :m="m" />
    </div>

    <div class="mt-3 grid grid-cols-2 gap-3">
      <WidgetCard
        title="Контроль Дня"
        :icon="Gauge"
        ratio-label="План/Факт"
        :ratio-value="m.onPlan === null ? '—' : formatPct(m.onPlan * 100, 1)"
        :ratio-tone="onPlanTone"
        foot-label="Разрыв"
        :foot-value="gapValue"
        @open="emit('go', 'day')"
      />
      <WidgetCard
        title="Цели и планы"
        :icon="Target"
        ratio-label="Прогноз/План"
        :ratio-value="formatGrowth(m.landDev)"
        :ratio-tone="fcTone"
        foot-label="Прогноз выручки"
        :foot-value="formatRubBig(m.landing)"
        @open="emit('go', 'goals')"
      />
    </div>

    <div class="mt-4 flex justify-center">
      <button
        type="button"
        class="flex min-h-[44px] items-center gap-2 text-[0.9375rem] text-[var(--text-secondary)]"
        @click="showHelp = !showHelp"
      >
        <Info class="h-4 w-4" aria-hidden="true" />
        <span>Как читать виджеты</span>
      </button>
    </div>

    <!-- Расшифровка по запросу: на экране состояния объяснению не место,
         но человек, который спросил, обязан получить ответ здесь же -->
    <dl
      v-if="showHelp"
      class="mt-1 flex flex-col gap-3 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4
             text-[0.8125rem] leading-snug"
    >
      <div>
        <dt class="font-semibold text-[var(--text)]">Факт · Прогноз · План · Цель</dt>
        <dd class="text-[var(--text-secondary)]">
          Сделано · куда приземлится месяц при нынешнем темпе · что обязаны сделать ·
          к чему стремитесь сверх плана.
        </dd>
      </div>
      <div>
        <dt class="font-semibold text-[var(--text)]">План/Факт</dt>
        <dd class="text-[var(--text-secondary)]">
          Выручка закрытых дней против плана этих же дней. Зелёный — от 100 %,
          жёлтый — от 85 %, красный — ниже.
        </dd>
      </div>
      <div>
        <dt class="font-semibold text-[var(--text)]">Прогноз/План</dt>
        <dd class="text-[var(--text-secondary)]">
          Насколько приземление расходится с обязательством. Прогноз один и
          меняется только от внесённых дней.
        </dd>
      </div>
    </dl>

    <div class="mt-6">
      <InstallBanner />
    </div>

    <!-- Выход не заперт: инструмент возвращаемый -->
    <footer class="mt-8 border-t border-[var(--line)] pt-4">
      <p class="text-[0.75rem] leading-snug text-[var(--text-muted)]">
        Данные лежат на этом устройстве. Никуда не отправляются, аккаунта нет.
      </p>
      <button
        v-if="!askReset"
        class="mt-2 min-h-[44px] text-[0.8125rem] font-medium text-[var(--text-secondary)] underline"
        type="button"
        @click="askReset = true"
      >Удалить всё и начать заново</button>
      <div v-else class="mt-2 flex flex-wrap items-center gap-3">
        <span class="text-[0.8125rem] text-[var(--text-secondary)]">Удалить введённое без возврата?</span>
        <button
          class="min-h-[44px] rounded-lg px-3 text-[0.8125rem] font-semibold"
          :style="{ background: 'var(--negative)', color: 'var(--ink-on-color)' }"
          type="button" @click="reset"
        >Удалить</button>
        <button
          class="min-h-[44px] text-[0.8125rem] font-medium text-[var(--text-secondary)] underline"
          type="button" @click="askReset = false"
        >Оставить</button>
      </div>
    </footer>
  </div>
</template>
