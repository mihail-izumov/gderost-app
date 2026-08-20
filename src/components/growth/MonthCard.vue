<script setup>
import { computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import MonthStrip from '../daily/MonthStrip.vue'
import { formatRub, formatGrowth, plural } from '../../i18n/format.js'
import { monthCap } from '../../i18n/home.js'
import { SIG_VAR, L, mln, hatch } from '../../i18n/daily.js'
import { useMiniStore } from '../../composables/useMiniStore.js'
import { shapeName } from '../../data/weekShape.js'

// Месяц — главный блок «Прогресса».
//
// На его месте стояла идущая неделя, и это была ошибка масштаба: страница
// отвечает на вопрос «куда идёт месяц», а начиналась с семи дней.
//
// ⚠ Плана, прогноза и трёхчастной полосы здесь нет. Ровно та же полоса стоит
// на «Сегодня», считает то же самое и делает это точнее — две одинаковые
// полосы на соседних экранах человек читает как два разных расчёта и начинает
// сверять их между собой. У блока свой вопрос, которого нет больше нигде:
// КАК ИДУТ ДНИ.
//
// Ряд — по делению на день, и высота деления не декоративная: она берётся
// из веса дня недели. Поправка на форму недели живёт в расчётах и до сих пор
// была видна только таблицей коэффициентов в самом низу «Контроля Дня»;
// здесь она читается формой месяца — суббота выше вторника, и понятно,
// почему план на них разный.
//
// Счёт «выше / близко / ниже плана» переехал сюда из отдельного блока внизу
// страницы: он отвечает на тот же вопрос, что и ряд, — как прошли дни, —
// и стоять двумя разными карточками ему незачем. Полоса из того блока
// не переносится: ряд выше информативнее, а два одинаковых счёта подряд
// снова заставляли бы их сверять.

const props = defineProps({
  m: { type: Object, required: true },
  today: { type: String, required: true },
})
const emit = defineEmits(['enter', 'tune'])

// Поправка на день недели открывается отсюда — вторым концом к той же
// настройке внизу «Контроля Дня». Вопрос «почему столбцы разной высоты»
// возникает ровно на этом ряду, и отвечать на него в другом разделе значит
// отправлять человека искать.
//
// ⚠ Промежуточной раскрывашки здесь нет. Она показывала те же строки, что
// и шторка настройки, то есть просила лишний тап ради того, что человек
// увидит секундой позже: сначала «покажи», потом «а теперь правь». Кнопка
// называет текущий пресет и сразу ведёт туда, где его меняют.
const store = useMiniStore()
const shape = computed(() => shapeName(store.state.coef_src, store.state.shape_id, store.state.shape_from))

const dayShort = (iso) => `${iso.slice(8)}.${iso.slice(5, 7)}`

// Ближайший день, который можно внести, — строго ПРОШЕДШИЙ: сегодняшний ещё
// идёт, его выручка не итог, и форма ввода его не принимает.
const nextISO = computed(() => {
  const d = props.m.days.find((x) => !x.closed && x.iso < props.today)
  return d ? d.iso : ''
})

// ⚠ Ряд говорит про ДЕНЬГИ по дням, а не про веса. У прожитого дня высота —
// его выручка, у будущего — то, что даст нынешний темп (`impliedBase` на вес
// дня, тот же расчёт, что у всего прогноза). Цвет разводит одно с другим
// без единой подписи: цветное — факт, серое — прогноз.
//
// Раньше высота бралась от веса дня недели, а прогноз рисовался заливкой
// внутри столбца-плана. Получалось три величины в одном делении — план, вес
// и темп, — и человек читал их как одну. Форма недели никуда не делась:
// она видна ровно так же, потому что прогноз дня из неё и считается.
const passed = computed(() => props.m.days.filter((d) => d.iso < props.today).length)
const filled = computed(() => props.m.days.filter((d) => d.closed).length)
const missing = computed(() => props.m.days.filter((d) => d.due).length)
const stats = computed(() => props.m.dayStats)
</script>

<template>
  <section class="rounded-[22px] bg-[var(--surface)] p-4">
    <div class="flex items-center gap-2">
      <h2 class="text-[1.0625rem] font-bold leading-none text-[var(--text)]">{{ monthCap(m.month) }}</h2>
      <span
        class="ml-auto inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.6875rem] font-bold tabular-nums"
        :style="{ background: SIG_VAR[m.fcSig] || 'var(--surface-2)', color: m.fcSig === 'warn' ? 'var(--accent-ink)' : 'var(--ink-on-color)' }"
      >{{ formatGrowth(m.landDev) }}</span>
    </div>

    <!-- Две величины ряда названы над самим рядом: слева факт, справа прогноз.
         Подписи стоят там же, где цвета, — и ряд читается без легенды:
         цветное — то, что уже заработано, серое — то, что даст темп. -->
    <div class="mt-3 flex items-end justify-between gap-3">
      <div class="min-w-0">
        <div class="text-[0.6875rem] uppercase tracking-wide text-[var(--text-muted)]">Факт</div>
        <div class="mt-0.5 text-[2rem] font-bold leading-none tabular-nums text-[var(--text)]">{{ formatRub(m.realizedRev) }}</div>
      </div>
      <div class="min-w-0 text-right">
        <div class="text-[0.6875rem] uppercase tracking-wide text-[var(--text-muted)]">Прогноз</div>
        <div class="mt-0.5 text-[1.0625rem] font-bold leading-none tabular-nums text-[var(--text-muted)]">{{ mln(m.landing) }}</div>
      </div>
    </div>

    <!-- Дни месяца. Устройство ряда общее с экраном месяца по ссылке. -->
    <MonthStrip class="mt-3.5" :m="m" :today="today" mark-today />

    <!-- Слева — полнота данных одной величиной: сколько прошедших дней внесено.
         Справа — поправка на день недели: заголовок и текущий пресет кнопкой,
         тап сразу открывает настройку. -->
    <div class="mt-4 flex items-start gap-3">
      <div class="min-w-0 flex-1">
        <div class="text-[0.6875rem] uppercase tracking-wide text-[var(--text-muted)]">Внесено</div>
        <div class="mt-1 text-[1.0625rem] font-bold tabular-nums" :style="{ color: missing > 0 ? 'var(--text)' : 'var(--positive)' }">
          {{ filled }}
          <span class="text-[0.875rem] font-normal text-[var(--text-muted)]">
            из {{ passed }} {{ plural(passed, 'дня', 'дн', 'дн') }}
          </span>
        </div>
      </div>

      <div class="min-w-0 shrink-0 text-right">
        <div class="text-[0.6875rem] uppercase tracking-wide text-[var(--text-muted)]">Поправка на день недели</div>
        <button
          type="button"
          class="mt-1 inline-flex min-h-[32px] max-w-full items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-3 text-[0.8125rem] font-medium text-[var(--text)]"
          @click="emit('tune')"
        >
          <span class="truncate">{{ shape }}</span>
          <ChevronDown class="h-4 w-4 shrink-0 text-[var(--text-muted)]" :stroke-width="2" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Как прошли ИЗМЕРЕННЫЕ дни против плана. Счёт идёт по дням с цифрой,
         и последним пунктом стоит их полнота: без неё человек считал жёлтые
         столбцы в ряду и не находил их в счётчике «близко» — потому что
         это разные вещи, дыра в данных и результат близко к плану. -->
    <div v-if="stats || missing" class="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--line)] pt-3 text-[0.8125rem] text-[var(--text-muted)]">
      <template v-if="stats">
        <span class="inline-flex items-center gap-1.5">
          <i class="inline-block h-2.5 w-2.5 rounded-sm" style="background: var(--positive)" />
          <b class="font-semibold text-[var(--text)]">{{ stats.good }}</b> {{ L.above }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <i class="inline-block h-2.5 w-2.5 rounded-sm" style="background: var(--warning)" />
          <b class="font-semibold text-[var(--text)]">{{ stats.warn }}</b> {{ L.close }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <i class="inline-block h-2.5 w-2.5 rounded-sm" style="background: var(--negative)" />
          <b class="font-semibold text-[var(--text)]">{{ stats.bad }}</b> {{ L.below }}
        </span>
      </template>
      <span v-if="missing" class="inline-flex items-center gap-1.5">
        <i class="inline-block h-2.5 w-2.5 rounded-sm" :style="hatch('var(--warning)')" />
        <b class="font-semibold text-[var(--text)]">{{ missing }}</b> без цифр
      </span>
    </div>

    <button
      v-if="nextISO"
      type="button"
      class="mt-3.5 min-h-[48px] w-full rounded-2xl text-[1rem] font-bold"
      :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      @click="emit('enter', nextISO)"
    >Внести {{ dayShort(nextISO) }}</button>
  </section>
</template>
