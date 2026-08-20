<script setup>
import { computed, ref } from 'vue'
import { ChevronRight, Eye, Clock } from 'lucide-vue-next'
import ZapIcon from '../icons/ZapIcon.vue'
import BottomSheet from '../BottomSheet.vue'
import { COUNTERS, TELEMETRY, scoreNow } from '../../data/runscaleCounters.js'
import { formatInt, formatPct, plural } from '../../i18n/format.js'
import { HEAD } from '../../i18n/growth247.js'

// Телеметрия системы. Перенесена из готовой песочницы
// `materials/draft/sandbox/counters-widgets-v6-sandbox.html` вместе с составом,
// поведением и запретами спеки; тёмная палитра песочницы заменена токенами
// светлой темы, разметка и логика графика — те же.
//
// Устройство: две раскрывающиеся плитки во всю ширину — проверки и разборы.
// Внутри плитки: что означают её слова, и график пользы 0–10 с переключателем
// месяцев; число рядом с графиком — последняя оценка, то есть правый край
// линии. Бизнесы под наблюдением стоят числом в круге у заголовка: это
// подпись к слову «вместе», а не третий счётчик в ряду.
//
// Запреты спеки перенесены дословно: ни выручки клиентов, ни процентов
// выполнения их планов, ни названий компаний, ни оценок поимённо. Публикуются
// только свои числа системы.
//
// Ряда за месяц нет — график не рисуется, на его месте стоит строка о том,
// когда он появится. Линия из ниоткуда была бы ровно тем враньём, ради
// запрета которого заведён статус числа.
//
// Контекст места (слова Михаила, 20.08): телеметрия стоит на «Ультре» —
// у неё нет цены в приложении, в отличие от разбора и буткемпа. Это
// доказательство существования идеального круга (референс — Майлз,
// водитель Шелби): сам Ранскейл ездит на своём Треке и показывает приборы.
// Поэтому тексты внутренностей — короткие показания приборов, без лирики
// и без продажи: продаёт здесь само число, у которого есть источник.
//
// Плитка «Разборы» показывает связку «после разбора»: ясность
// по оценкам участников + задачи разбора, закрытые в срок. Оба числа
// выходят только вместе и только когда счёт системы разрешил публикацию
// (окно четырёх разборов, от шести оценок) — до того плитка называет,
// когда числа встанут. Ряды «пользы разборов» наружу не идут: польза —
// внутреннее число методики, и витрина это уважает.

defineEmits(['connect'])

const byKey = (k) => COUNTERS.items.find((c) => c.key === k)
const checkups = computed(() => byKey('checkups'))
const signals = computed(() => byKey('signals'))
const reviews = computed(() => byKey('reviews'))

const open = ref('')
// Круг с числом бизнесов открывает одну строку о том, что это число значит.
const clientsOpen = ref(false)
function toggle(id) { open.value = open.value === id ? '' : id }

// ⚠ Раскрытая плитка выворачивается: заливка цветом текста, содержимое
// чернилами наоборот. Повод назван Михаилом на приёмке — раскрытый блок лежит
// под ОБЕИМИ плитками во всю ширину, плитки при этом одинаковые, и понять,
// чей он, нельзя. Поворота шеврона на это не хватает: он мелкий и стоит
// в углу, а вопрос человек задаёт про всю карточку.
//
// Средство сильное и потому единственное: выворотка помечает ровно одно
// состояние — «открыто», и второй метки у плитки не появляется: у объекта
// на экране одна метка, и все средства показа красятся одним состоянием.
//
// Сделано двумя уровнями, и это не украшательство. Заливка стоит на кнопке
// и берёт `--text` в его обычном значении; подмена токенов живёт на вложенном
// слое с `display: contents` — тот же элемент, переопределяющий `--text`
// и одновременно красящийся им, дал бы ссылку токена на самого себя,
// и правило целиком отменяется браузером. `contents` при этом не заводит
// собственной коробки: дети остаются детьми кнопки, и её раскладка
// не меняется ни на пиксель.
const INVERT = {
  '--text': 'var(--ink-inverse)',
  '--text-secondary': 'var(--ink-inverse-secondary)',
  '--text-muted': 'var(--ink-inverse-muted)',
  '--surface-2': 'var(--surface-inverse-soft)',
  // Синий знак на светлой заливке — тот же, что на светлой теме:
  // осветлённый нужен только на тёмном холсте.
  '--action-text': 'var(--action)',
}
const inverted = (id) => (open.value === id ? INVERT : {})
const plateFill = (id) => (open.value === id ? { background: 'var(--text)' } : {})

// Переключатель месяцев — только у проверок: у разборов графика нет,
// их плитка несёт связку «после разбора».
const monthPick = ref({ checkups: 'aug' })

function seriesOf(list, id) {
  return list.find((s) => s.id === id) || { values: [], label: '' }
}
const checkSeries = computed(() => seriesOf(TELEMETRY.signalScores, monthPick.value.checkups))
const outcome = TELEMETRY.reviewOutcome

function word(c) {
  return plural(c.value, ...c.forms)
}

// Ломаная и её тренд. Оси 0–10, скользящее среднее окном 3 — как в песочнице.
const W = 300
const H = 84
const PAD_L = 20
const PAD_R = 8
const PAD_Y = 10
const yAt = (v) => H - PAD_Y - (v / 10) * (H - 2 * PAD_Y)
const xAt = (i, n) => (n <= 1 ? PAD_L : PAD_L + (i * (W - PAD_L - PAD_R)) / (n - 1))

function chart(values) {
  const n = values.length
  const pts = values.map((v, i) => `${xAt(i, n)},${yAt(v)}`).join(' ')
  const ma = values.map((_, i) => {
    const from = Math.max(0, i - 2)
    let s = 0
    let k = 0
    for (let j = from; j <= i; j++) { s += values[j]; k += 1 }
    return s / k
  })
  return {
    n,
    points: pts,
    trend: ma.map((v, i) => `${xAt(i, n)},${yAt(v)}`).join(' '),
    dots: values.map((v, i) => ({ cx: xAt(i, n), cy: yAt(v), key: i })),
    grid: values.map((_, i) => xAt(i, n)),
  }
}
const checkChart = computed(() => chart(checkSeries.value.values))

const TICKS = [0, 5, 10]
const tickY = (v) => yAt(v)

const oneDecimal = (v) => (v === null ? '' : String(v).replace('.', ','))
</script>

<template>
  <section>
    <!-- Число в круге — сколько бизнесов система ведёт прямо сейчас. Стоит
         у заголовка, а не отдельной плиткой: это подпись к «вместе»,
         а не третий счётчик в ряду. -->
    <div class="flex items-center gap-2">
      <h2 class="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
        {{ HEAD.telemetry }}
      </h2>
      <button
        type="button"
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-bold tabular-nums"
        :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
        :aria-label="`${TELEMETRY.businesses} ${plural(TELEMETRY.businesses, 'бизнес', 'бизнеса', 'бизнесов')} под наблюдением`"
        @click="clientsOpen = true"
      >{{ formatInt(TELEMETRY.businesses) }}</button>
    </div>

    <div class="mt-2.5 grid grid-cols-2 gap-2">
      <!-- ПРОВЕРКИ: ежедневная петля -->
      <button
        type="button"
        class="flex min-h-[9rem] flex-col gap-2 rounded-2xl bg-[var(--surface)] p-3.5 text-left"
        :style="plateFill('checkups')"
        :aria-expanded="open === 'checkups' ? 'true' : 'false'"
        @click="toggle('checkups')"
      >
      <span class="contents" :style="inverted('checkups')">
        <span class="flex items-center justify-between">
          <span class="text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
            {{ checkups.title }}
          </span>
          <ChevronRight
            class="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200"
            :class="open === 'checkups' ? 'rotate-90' : ''"
            :stroke-width="2"
            aria-hidden="true"
          />
        </span>
        <span class="mt-1 block text-[2rem] font-bold leading-none tabular-nums text-[var(--text)]">
          {{ formatInt(checkups.value) }}
        </span>
        <span class="mt-auto flex h-6 items-center gap-2 text-[0.75rem] text-[var(--text-secondary)]">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)]" aria-hidden="true">
            <ZapIcon class="h-3.5 w-3.5" :style="{ color: 'var(--action-text)' }" />
          </span>
          <span><b class="font-semibold tabular-nums text-[var(--text)]">{{ formatInt(signals.value) }}</b> {{ word(signals) }}</span>
        </span>
        <span class="flex h-6 items-center gap-2 text-[0.75rem] text-[var(--text-secondary)]">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)]" aria-hidden="true">
            <Eye class="h-3.5 w-3.5" :style="{ color: 'var(--action-text)' }" :stroke-width="2.2" />
          </span>
          <span><b class="font-semibold tabular-nums text-[var(--text)]">{{ formatPct(TELEMETRY.readsRate * 100, 0) }}</b> прочтений</span>
        </span>
      </span>
      </button>

      <!-- РАЗБОРЫ: живые встречи -->
      <button
        type="button"
        class="flex min-h-[9rem] flex-col gap-2 rounded-2xl bg-[var(--surface)] p-3.5 text-left"
        :style="plateFill('reviews')"
        :aria-expanded="open === 'reviews' ? 'true' : 'false'"
        @click="toggle('reviews')"
      >
      <span class="contents" :style="inverted('reviews')">
        <span class="flex items-center justify-between">
          <span class="text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
            {{ reviews.title }}
          </span>
          <ChevronRight
            class="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200"
            :class="open === 'reviews' ? 'rotate-90' : ''"
            :stroke-width="2"
            aria-hidden="true"
          />
        </span>
        <span class="mt-1 block text-[2rem] font-bold leading-none tabular-nums text-[var(--text)]">
          {{ formatInt(reviews.value) }}
        </span>
        <span class="mt-auto flex h-6 items-center gap-2 text-[0.75rem] text-[var(--text-secondary)]">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)]" aria-hidden="true">
            <Clock class="h-3.5 w-3.5" :style="{ color: 'var(--action-text)' }" :stroke-width="2.2" />
          </span>
          <span class="flex items-center gap-1">
            <b class="font-semibold tabular-nums text-[var(--text)]">90</b> мин
            <span
              v-for="d in ['вт', 'пт']"
              :key="d"
              class="inline-flex items-center rounded px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide"
              :style="{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }"
            >{{ d }}</span>
          </span>
        </span>
      </span>
      </button>

    </div>

    <!-- Внутренности: ПРОВЕРКИ -->
    <div v-if="open === 'checkups'" class="mt-2 rounded-2xl bg-[var(--surface-2)] p-4">
      <p class="text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
        <b class="font-semibold text-[var(--text)]">Проверка</b> — осмотр бизнеса за день:
        выручка, гости, средний чек, сданы ли цифры. Каждое утро, включая выходные.
      </p>
      <p class="mt-2 border-t border-[var(--line)] pt-2 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
        <b class="font-semibold text-[var(--text)]">Сигнал</b> — итог проверки, когда пора
        вмешаться: что случилось и что сделать сегодня, пока день можно догнать.
        Команда оценивает каждый сигнал от 0 до 10 — оценки на графике ниже.
      </p>
      <p class="mt-2 border-t border-[var(--line)] pt-2 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
        <b class="font-semibold text-[var(--text)]">Прочтения</b> — доля сигналов, открытых
        командой. Непрочитанный сигнал не работает, поэтому считается и это.
      </p>

      <div class="mt-4">
        <div class="mb-2 flex items-center justify-between gap-2">
          <span class="text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
            Польза сигналов
          </span>
          <span class="inline-flex rounded-lg bg-[var(--surface)] p-[2px]">
            <button
              v-for="s in TELEMETRY.signalScores"
              :key="s.id"
              type="button"
              class="min-h-[28px] rounded-md px-2.5 text-[0.75rem]"
              :style="monthPick.checkups === s.id
                ? { background: 'var(--surface-2)', color: 'var(--text)', fontWeight: 600 }
                : { color: 'var(--text-muted)' }"
              @click="monthPick.checkups = s.id"
            >{{ s.label }}</button>
          </span>
        </div>

        <div class="grid grid-cols-[5.5rem_1fr] gap-2">
          <div class="flex min-h-[6.5rem] items-center justify-center rounded-xl bg-[var(--surface)] p-3">
            <span v-if="scoreNow(checkSeries.values) !== null" class="whitespace-nowrap text-[1.75rem] font-bold leading-none tabular-nums text-[var(--text)]">
              {{ oneDecimal(scoreNow(checkSeries.values)) }}<span class="text-[0.875rem] font-medium text-[var(--text-muted)]"> /10</span>
            </span>
            <span v-else class="text-[1.75rem] font-bold leading-none text-[var(--text-muted)]">—</span>
          </div>
          <div class="relative min-h-[6.5rem] rounded-xl bg-[var(--surface)] px-3 py-2.5">
            <svg
              v-if="checkChart.n > 1"
              :viewBox="`0 0 ${W} ${H}`"
              preserveAspectRatio="none"
              class="block h-[5.25rem] w-full"
              role="img"
              :aria-label="`Оценки пользы за ${checkSeries.label}, шкала от 0 до 10`"
            >
              <line
                v-for="(gx, i) in checkChart.grid" :key="'g' + i"
                :x1="gx" :x2="gx" :y1="tickY(10)" :y2="tickY(0)"
                stroke="var(--line)" stroke-width="1"
              />
              <template v-for="t in TICKS" :key="'t' + t">
                <line :x1="PAD_L" :x2="W - PAD_R" :y1="tickY(t)" :y2="tickY(t)" stroke="var(--line)" stroke-width="1" />
                <text :x="PAD_L - 5" :y="tickY(t) + 3" text-anchor="end" font-size="9" fill="var(--text-muted)">{{ t }}</text>
              </template>
              <polyline
                :points="checkChart.trend" fill="none" stroke="var(--text-muted)"
                stroke-width="1.5" stroke-dasharray="4 5" stroke-linecap="round" stroke-linejoin="round"
              />
              <polyline
                :points="checkChart.points" fill="none" stroke="var(--text)"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              />
              <circle v-for="d in checkChart.dots" :key="'d' + d.key" :cx="d.cx" :cy="d.cy" r="2.4" fill="var(--text)" />
            </svg>
            <p v-else class="flex h-full items-center justify-center px-2 text-center text-[0.75rem] leading-snug text-[var(--text-muted)]">
              Оценки за {{ checkSeries.label.toLowerCase() }} появятся с первой проверкой месяца.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Внутренности: РАЗБОРЫ -->
    <div v-if="open === 'reviews'" class="mt-2 rounded-2xl bg-[var(--surface-2)] p-4">
      <p class="text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
        <b class="font-semibold text-[var(--text)]">Разбор</b> — 90 минут по вторникам
        и пятницам: сигналы недели становятся задачами. У каждой — кто делает, срок
        и число, которое должно измениться.
      </p>
      <p class="mt-2 border-t border-[var(--line)] pt-2 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
        После встречи участники оценивают <b class="font-semibold text-[var(--text)]">ясность</b> —
        насколько понятно, что делать до следующего разбора. Дальше видно по задачам:
        закрыты они в срок или нет.
      </p>

      <div class="mt-4">
        <span class="text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
          После разбора
        </span>

        <!-- Связка публикуется только целиком: оба числа или ни одного.
             Правило счёта живёт в системе, экран его не повторяет. -->
        <div v-if="outcome.publish" class="mt-2 grid grid-cols-2 gap-2">
          <div class="flex min-h-[6.5rem] flex-col justify-center gap-1 rounded-xl bg-[var(--surface)] p-3">
            <span class="whitespace-nowrap text-[1.75rem] font-bold leading-none tabular-nums text-[var(--text)]">
              {{ oneDecimal(outcome.clarity) }}<span class="text-[0.875rem] font-medium text-[var(--text-muted)]"> /10</span>
            </span>
            <span class="text-[0.75rem] leading-snug text-[var(--text-secondary)]">ясность — понятно, что делать дальше</span>
          </div>
          <div class="flex min-h-[6.5rem] flex-col justify-center gap-1 rounded-xl bg-[var(--surface)] p-3">
            <span class="whitespace-nowrap text-[1.75rem] font-bold leading-none tabular-nums text-[var(--text)]">
              {{ formatInt(outcome.onTime) }}<span class="text-[0.875rem] font-medium text-[var(--text-muted)]"> из {{ formatInt(outcome.total) }}</span>
            </span>
            <span class="text-[0.75rem] leading-snug text-[var(--text-secondary)]">задач закрыто в срок</span>
          </div>
        </div>
        <p v-else class="mt-2 rounded-xl bg-[var(--surface)] p-3 text-[0.75rem] leading-snug text-[var(--text-muted)]">
          Здесь встанут два числа: ясность после встречи и задачи, закрытые в срок.
          Публикуются вместе, от {{ formatInt(outcome.need) }} оценок — сейчас {{ formatInt(outcome.votes) }}.
          Ясность меряется с 14 августа.
        </p>
      </div>
    </div>

    <BottomSheet :open="clientsOpen" @close="clientsOpen = false">
      <div class="pb-2">
        <h2 class="text-[1.25rem] font-bold leading-tight text-[var(--text)]">
          Сегодня {{ formatInt(TELEMETRY.businesses) }}
          {{ plural(TELEMETRY.businesses, 'бизнес растёт', 'бизнеса растут', 'бизнесов растут') }} на Ранскеил
        </h2>
        <button
          type="button"
          class="mt-4 min-h-[52px] w-full rounded-2xl text-[1.0625rem] font-bold"
          :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
          @click="clientsOpen = false; $emit('connect')"
        >Подключить бизнес с инженером Ранскеил</button>
      </div>
    </BottomSheet>
  </section>
</template>
