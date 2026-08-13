<script setup>
import { computed, ref } from 'vue'
import { Check, X } from 'lucide-vue-next'
import { useMiniStore } from '../composables/useMiniStore.js'
import { DOW_RU } from '../composables/miniModel.js'
import {
  WEEK_SHAPES, shapeById, calibrateFromDays, observationsByDow, OBS_FOR_DATA, DEFAULT,
} from '../data/weekShape.js'

// Настройка формы недели — эквалайзер, а не столбики.
//
// Форма недели ведёт себя как тембр: важна не высота каждого дня по отдельности,
// а рисунок всей недели. Кривая показывает рисунок целиком, столбики заставляют
// сравнивать семь чисел глазами и собирать форму в голове.
//
// Точку тянут вверх-вниз, кривая идёт через все семь. Как только человек сдвинул
// хоть одну, галочка переезжает на «Свою настройку»: пресет он больше не слушает.
//
// Выключатель гасит форму целиком — тогда остаток плана разносится ровно,
// без поправки на день недели. Это честный выбор для тех, у кого выручка
// действительно ровная, и он не притворяется расчётом.
//
// Одно окно, а не два: человек заходит сюда, чтобы перенастроить и выйти.

const store = useMiniStore()
const state = store.state
const emit = defineEmits(['close'])

const MIN = 0.3
const MAX = 2.0
const W = 320
const H = 150
const PAD_X = 18
const PAD_Y = 16

// Черновик: правка на графике не должна пересчитывать месяц на каждое
// движение пальца — иначе цифры под рукой пляшут и выбрать что-либо нельзя.
const draft = ref([...state.dow_coef])
const enabled = ref(state.coef_src !== 'off')
const pickedPreset = ref(state.coef_src === 'user' ? 'user' : state.shape_id)

const obs = computed(() => observationsByDow(state.days))
const calibration = computed(() => calibrateFromDays(state.days))

const x = (i) => PAD_X + (i * (W - PAD_X * 2)) / 6
const y = (v) => {
  const t = (Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN)
  return H - PAD_Y - t * (H - PAD_Y * 2)
}
const midY = computed(() => y(1))

// Гладкая кривая через семь точек: Катмулл-Ром, переведённый в кубические
// Безье. Ломаная читается как график данных; форма недели — оценка, и её
// линия обязана быть мягкой, чтобы никто не принял её за замер.
const path = computed(() => {
  const p = draft.value.map((v, i) => [x(i), y(v)])
  let d = `M ${p[0][0]} ${p[0][1]}`
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i]
    const p1 = p[i]
    const p2 = p[i + 1]
    const p3 = p[i + 2] || p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`
  }
  return d
})

const svgRef = ref(null)
const dragging = ref(null)

function valueFromEvent(e) {
  const el = svgRef.value
  if (!el) return null
  const box = el.getBoundingClientRect()
  const point = e.touches ? e.touches[0] : e
  const localY = ((point.clientY - box.top) / box.height) * H
  const t = 1 - (localY - PAD_Y) / (H - PAD_Y * 2)
  return Math.round((MIN + Math.min(1, Math.max(0, t)) * (MAX - MIN)) * 20) / 20
}

function onDown(i, e) {
  e.preventDefault()
  dragging.value = i
  move(e)
}
function move(e) {
  if (dragging.value === null) return
  const v = valueFromEvent(e)
  if (v == null) return
  const next = [...draft.value]
  next[dragging.value] = v
  draft.value = next
  pickedPreset.value = 'user'
}
function onUp() { dragging.value = null }

function pickPreset(id) {
  pickedPreset.value = id
  draft.value = [...shapeById(id).coef]
}

function useCalibrated() {
  if (!calibration.value) return
  pickedPreset.value = 'data'
  draft.value = [...calibration.value.coef]
}

// Отдельная кнопка сохранения: правка графика — это выбор, а не набор жестов,
// и выйти из него без последствий человек должен уметь.
function apply() {
  if (!enabled.value) {
    store.setWeekShape([1, 1, 1, 1, 1, 1, 1], 'off', 'neutral')
    emit('close')
    return
  }
  const src = pickedPreset.value === 'data' ? 'data'
    : pickedPreset.value === 'user' ? 'user' : 'preset'
  const shapeId = src === 'preset' ? pickedPreset.value : state.shape_id
  store.setWeekShape(draft.value, src, shapeId)
  emit('close')
}

// Расшифровка появляется только на выбранном: заранее рассказывать про все
// варианты значит объяснять то, чего человек не спрашивал.
const note = computed(() => {
  if (!enabled.value) return 'Поправка на день недели выключена: остаток плана разносится ровно.'
  if (pickedPreset.value === 'data') {
    return `Посчитано по вашим дням: ${calibration.value ? calibration.value.observations : 0} наблюдений. Это единственная форма, которая держится на факте.`
  }
  if (pickedPreset.value === 'user') {
    const top = DOW_RU[draft.value.indexOf(Math.max(...draft.value))]
    const low = DOW_RU[draft.value.indexOf(Math.min(...draft.value))]
    return `Ваша форма: сильнее всего ${top}, слабее всего ${low}. Это ваше решение, данными пока не проверено.`
  }
  return `${shapeById(pickedPreset.value).name}: ${shapeById(pickedPreset.value).hint.toLowerCase()}. Допущение — ваши данные её ещё не подтверждали.`
})

const shortDays = computed(() => obs.value.filter((c) => c < OBS_FOR_DATA).length)
</script>

<template>
  <div
    class="w-full"
    @mousemove="move" @mouseup="onUp" @mouseleave="onUp"
    @touchmove.prevent="move" @touchend="onUp"
  >
    <header class="flex items-center gap-3 pb-3">
      <h2 class="text-[1.25rem] font-bold text-[var(--text)]">Форма недели</h2>
      <button
        type="button"
        class="ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-2)]"
        aria-label="Закрыть"
        @click="emit('close')"
      >
        <X class="h-5 w-5 text-[var(--text-secondary)]" :stroke-width="2" aria-hidden="true" />
      </button>
    </header>

    <!-- Кривая. Точки тянутся пальцем; активная зона у каждой шире самой точки. -->
    <div class="rounded-2xl bg-[var(--surface)] p-3" :class="enabled ? '' : 'opacity-40'">
      <svg
        ref="svgRef"
        :viewBox="`0 0 ${W} ${H}`"
        class="w-full touch-none select-none"
        role="group"
        aria-label="Форма недели по дням"
      >
        <line
          :x1="PAD_X" :x2="W - PAD_X" :y1="midY" :y2="midY"
          stroke="var(--line)" stroke-width="1" stroke-dasharray="3 3"
        />
        <path :d="path" fill="none" stroke="var(--accent)" stroke-width="3"
              stroke-linecap="round" stroke-linejoin="round" />
        <g v-for="(v, i) in draft" :key="i">
          <circle
            :cx="x(i)" :cy="y(v)" r="6.5"
            fill="var(--surface)" stroke="var(--accent)" stroke-width="3"
          />
          <circle
            :cx="x(i)" :cy="y(v)" r="20" fill="transparent"
            :style="{ cursor: enabled ? 'ns-resize' : 'default' }"
            @mousedown="enabled && onDown(i, $event)"
            @touchstart="enabled && onDown(i, $event)"
          />
        </g>
      </svg>

      <div class="mt-1 grid grid-cols-7">
        <div v-for="(v, i) in draft" :key="i" class="flex flex-col items-center gap-0.5">
          <span class="text-[0.75rem] font-medium text-[var(--text-secondary)]">{{ DOW_RU[i] }}</span>
          <span class="text-[0.6875rem] tabular-nums text-[var(--text-muted)]">
            {{ v.toFixed(2).replace('.', ',') }}
          </span>
        </div>
      </div>
    </div>

    <label class="mt-3 flex min-h-[52px] items-center gap-3 rounded-2xl bg-[var(--surface)] px-4">
      <span class="flex-1 text-[1rem] text-[var(--text)]">Поправка на день недели</span>
      <input v-model="enabled" type="checkbox" class="sr-only" >
      <span
        class="relative block h-[31px] w-[51px] shrink-0 rounded-full transition-colors"
        :style="{ background: enabled ? 'var(--accent)' : 'var(--line)' }"
        @click="enabled = !enabled"
      >
        <span
          class="absolute top-[2px] block h-[27px] w-[27px] rounded-full bg-[var(--surface)] transition-all"
          :style="{ left: enabled ? '22px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }"
        />
      </span>
    </label>

    <div v-if="enabled" class="mt-3 overflow-hidden rounded-2xl bg-[var(--surface)]">
      <button
        type="button"
        class="flex min-h-[52px] w-full items-center gap-3 border-b border-[var(--line)] px-4 text-left"
        @click="pickedPreset = 'user'"
      >
        <span class="flex-1 text-[1rem] text-[var(--text)]">Своя настройка</span>
        <Check v-if="pickedPreset === 'user'" class="h-5 w-5 text-[var(--text)]" :stroke-width="2.5" />
      </button>

      <button
        v-if="calibration"
        type="button"
        class="flex min-h-[52px] w-full items-center gap-3 border-b border-[var(--line)] px-4 text-left"
        @click="useCalibrated"
      >
        <span class="flex-1 text-[1rem] text-[var(--text)]">По вашим данным</span>
        <Check v-if="pickedPreset === 'data'" class="h-5 w-5 text-[var(--text)]" :stroke-width="2.5" />
      </button>

      <button
        v-for="s in WEEK_SHAPES" :key="s.id"
        type="button"
        class="flex min-h-[52px] w-full items-center gap-3 border-b border-[var(--line)] px-4 text-left last:border-b-0"
        @click="pickPreset(s.id)"
      >
        <span class="flex-1 text-[1rem] text-[var(--text)]">{{ s.name }}</span>
        <Check v-if="pickedPreset === s.id" class="h-5 w-5 text-[var(--text)]" :stroke-width="2.5" />
      </button>
    </div>

    <p class="mt-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
      {{ note }}
      <template v-if="enabled && !calibration && pickedPreset !== 'data'">
        Пересчёт по факту включится, когда каждый день недели встретится
        в ваших данных дважды — сейчас не хватает {{ shortDays }} из 7.
      </template>
    </p>

    <button
      type="button"
      class="mt-3 min-h-[52px] w-full rounded-2xl text-[1.0625rem] font-bold"
      :style="{ background: 'var(--accent)', color: 'var(--accent-ink)' }"
      @click="apply"
    >Применить</button>
  </div>
</template>
