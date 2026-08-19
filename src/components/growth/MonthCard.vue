<script setup>
import { computed } from 'vue'
import { formatRub, formatGrowth, monthOf } from '../../i18n/format.js'
import { mln, SIG_VAR } from '../../i18n/daily.js'

// Месяц — главный блок «Прогресса».
//
// На его месте стояла идущая неделя, и это была ошибка масштаба: страница
// отвечает на вопрос «куда идёт месяц», а начиналась с семи дней и счёта
// «2 / 7 дн». Счёт дней говорит про полноту данных, а не про положение дел,
// и человек, открывший раздел ради месяца, первым делом читал про неделю.
//
// Состав повторяет строку «Месяц» из сводки «Контроля Дня»: полоса, факт,
// план, отклонение прогноза. Одинаковые вещи на двух экранах обязаны
// выглядеть одинаково, иначе человек считает их разными.
//
// ⚠ Расхождение с той строкой одно и названо вслух: полоса здесь трёхчастная,
// как в шапке «Контроля Дня» и в деке месяца, — заработанное сплошным,
// то, что доложит темп, точками, недобор до плана красным. В сводке полоса
// одна и показывает только прогноз; здесь блок стоит один на экране и обязан
// отвечать целиком, а язык фактур в приложении уже общий.
//
// Дней и метки «идёт» на блоке нет: они принадлежали неделе. Ввод стоит
// кнопкой и уводит в «Контроль Дня» — ввода на «Прогрессе» нет ни одного.

const props = defineProps({
  m: { type: Object, required: true },
  today: { type: String, required: true },
})
const emit = defineEmits(['enter'])

const dayShort = (iso) => `${iso.slice(8)}.${iso.slice(5, 7)}`

const FORECAST_FILL = {
  backgroundColor: 'color-mix(in srgb, var(--accent) 40%, var(--surface))',
  backgroundImage: 'radial-gradient(circle at 50% 50%, var(--text-muted) 0.45px, transparent 0.55px)',
  backgroundSize: '2.5px 2.5px',
}
const SHORT_FILL = { backgroundColor: 'color-mix(in srgb, var(--negative) 55%, var(--surface))' }

const title = computed(() => `${monthOf(props.m.month)} ${props.m.month.slice(0, 4)}`)

// Ближайший день, который можно внести, — строго ПРОШЕДШИЙ: сегодняшний ещё
// идёт, его выручка не итог, и форма ввода его не принимает.
const nextISO = computed(() => {
  const d = props.m.days.find((x) => !x.closed && x.iso < props.today)
  return d ? d.iso : ''
})

const factW = computed(() => Math.max(0, Math.min(100, props.m.factPct)))
const fcW = computed(() => Math.max(0, Math.min(100, props.m.landPct) - factW.value))
const shortW = computed(() => Math.max(0, 100 - factW.value - fcW.value))

// Чип отклонения прогноза от плана — цветом светофора прогноза: тем же,
// каким этот прогноз покрашен во всех остальных местах приложения.
const devInk = computed(() => (props.m.fcSig === 'warn' ? 'var(--accent-ink)' : 'var(--ink-on-color)'))
const devBg = computed(() => SIG_VAR[props.m.fcSig] || 'var(--surface-2)')
</script>

<template>
  <section class="rounded-[22px] bg-[var(--surface)] p-4">
    <div class="flex items-center gap-2">
      <h2 class="text-[1.0625rem] font-bold leading-none text-[var(--text)]">{{ title }}</h2>
      <span
        class="ml-auto inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.6875rem] font-bold tabular-nums"
        :style="{ background: devBg, color: devInk }"
      >{{ formatGrowth(m.landDev) }}</span>
    </div>

    <!-- Факт крупно, план подписью: заработанное — то, что человек сделал,
         план — то, с чем это сравнивается. -->
    <div class="mt-3 flex items-baseline gap-2">
      <span class="text-[2rem] font-bold leading-none tabular-nums text-[var(--text)]">{{ formatRub(m.realizedRev) }}</span>
      <span class="text-[0.875rem] text-[var(--text-muted)]">факт</span>
    </div>
    <p class="mt-1 text-[0.8125rem] text-[var(--text-muted)]">
      план {{ mln(m.T) }} · прогноз {{ mln(m.landing) }}
    </p>

    <div class="mt-3 flex h-[10px] overflow-hidden rounded-full bg-[var(--surface-2)]">
      <i :style="{ width: factW + '%', background: 'var(--accent)' }" />
      <i :style="{ width: fcW + '%', ...FORECAST_FILL }" />
      <i :style="{ width: shortW + '%', ...SHORT_FILL }" />
    </div>

    <p class="mt-2.5 text-[0.8125rem] text-[var(--text-muted)]">
      <template v-if="nextISO">{{ dayShort(nextISO) }} — нужно внести</template>
      <template v-else>Все прошедшие дни внесены</template>
    </p>

    <button
      v-if="nextISO"
      type="button"
      class="mt-3 min-h-[48px] w-full rounded-2xl text-[1rem] font-bold"
      :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      @click="emit('enter', nextISO)"
    >Внести {{ dayShort(nextISO) }}</button>
  </section>
</template>
