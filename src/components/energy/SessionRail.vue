<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import HandIcon from '../icons/HandIcon.vue'
import TopoLayer from '../TopoLayer.vue'
import { formatRub } from '../../i18n/format.js'
import { moduleGain } from '../../composables/energyModel.js'
import { MODULES, RAIL, isLocked } from '../../i18n/energy.js'

// Лента ступеней. Три карточки лестницей вовлечения: владелец и 90 минут →
// владелец и серия разборов → команда и данные. Режим живёт баннером ниже.
//
// Замок стоит на заказе, а не на информации: карточка открывается и показывает
// состав, цену и мощность. Серия и буткемп заперты до состоявшегося разбора —
// продавать раскладку плана человеку, чей план никто не видел, значит
// продавать наугад.
//
// Доступная ступень залита зелёным целиком, и весь её текст — на цвете. Это
// единственное место экрана, где цвет означает «здесь можно действовать»,
// и полутон был слишком тихим для единственного действия на ленте. Бейдж
// на ней белый: салатовый на зелёном — производный оттенок, а таких в системе
// нет. Запертые карточки остаются обычными светлыми.
//
// Лента горизонтальная и в один ряд: паспорта сравниваются глазами за секунду,
// а вертикальный список занял бы весь экран и утопил бы всё, что под ним.

const props = defineProps({
  energy: { type: Object, required: true },
  unlocked: { type: Boolean, default: false },
  // Отправленные заявки: по ним карточка знает, что сессия уже заказана.
  requests: { type: Array, default: () => [] },
  // Разбор оценён — значит он состоялся.
  rated: { type: Boolean, default: false },
})
defineEmits(['open'])

const cards = computed(() => RAIL.map((id) => {
  const mod = MODULES[id]
  const gain = moduleGain(id, props.energy)
  const locked = isLocked(id, props.unlocked)
  const done = id === 'razbor' && props.rated
  const state = done ? 'done' : locked ? 'wait' : 'open'
  const price = mod.price
    ? formatRub(mod.price) + (mod.priceUnit ? ' / мес' : '')
    : 'на разборе'
  // На цветной заливке весь текст белый: цветного текста в системе нет,
  // а полутонов на цвете — тем более.
  const onColor = state !== 'wait'
  return {
    id,
    title: mod.title,
    subtitle: mod.subtitle,
    price,
    gain,
    state,
    locked,
    onColor,
    label: locked && mod.lockChip ? mod.lockChip : state === 'done' ? 'Завершена' : 'Доступно',
    cardBg: state === 'open' ? 'var(--positive)'
      : state === 'done' ? 'var(--text)'
        : 'var(--surface)',
    ink: onColor ? 'var(--ink-on-color)' : 'var(--text)',
    // На заливке весь текст белый, разница — в прозрачности: серый токен
    // подобран против графита и на зелёном тонет.
    inkMuted: onColor ? 'var(--ink-on-color)' : 'var(--text-secondary)',
    inkFaint: onColor ? 'var(--ink-on-color)' : 'var(--text-muted)',
    mutedOpacity: onColor ? 0.9 : 1,
    faintOpacity: onColor ? 0.75 : 1,
    chipBg: onColor ? 'var(--ink-on-color)' : 'var(--surface-2)',
    chipInk: onColor ? 'var(--text)' : 'var(--text-muted)',
    // Рельеф на заднем плане карточки: на заливке линии белые и видны чуть
    // сильнее, на светлой — тёмные и почти на пределе различимости.
    topoInk: onColor ? 'var(--ink-on-color)' : 'var(--text)',
    topoOpacity: onColor ? 0.07 : 0.028,
  }
}))

// Полоса под лентой: сколько её видно и где человек внутри неё.
//
// Горизонтальная лента на телефоне не показывает, что справа есть ещё
// карточки: системной полосы прокрутки там нет вовсе, а обрезанный край
// последней видимой карточки читается краем экрана. Человек честно решает,
// что ступеней две, и до третьей не доходит.
//
// Полоса считается от самой ленты, а не от числа карточек: их станет больше
// или меньше — она останется верной.
const railEl = ref(null)
const bar = ref({ width: 100, left: 0, show: false })

function measure() {
  const el = railEl.value
  if (!el) return
  const { scrollWidth, clientWidth, scrollLeft } = el
  const hidden = scrollWidth - clientWidth
  if (hidden <= 4) { bar.value = { width: 100, left: 0, show: false }; return }
  const width = Math.max(18, Math.round((clientWidth / scrollWidth) * 100))
  const left = Math.round((scrollLeft / hidden) * (100 - width))
  bar.value = { width, left: Math.max(0, Math.min(100 - width, left)), show: true }
}

let ro = null
onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined' && railEl.value) {
    ro = new ResizeObserver(measure)
    ro.observe(railEl.value)
  }
})
onBeforeUnmount(() => { if (ro) { ro.disconnect(); ro = null } })
</script>

<template>
  <div
    ref="railEl"
    class="-mx-4 overflow-x-auto px-4 pb-1"
    style="scrollbar-width: none"
    @scroll="measure"
  >
    <ul class="flex snap-x snap-mandatory gap-2.5">
      <!-- Карточка шире экрана минус край следующей: на 375 это ровно та
           ширина, при которой соседняя ступень видна кромкой и зовёт листать,
           а не занимает пол-экрана вторым равноправным предложением. -->
      <li v-for="c in cards" :key="c.id" class="w-[19.5rem] shrink-0 snap-start">
        <button
          type="button"
          class="relative isolate flex h-full min-h-[13.5rem] w-full flex-col overflow-hidden rounded-2xl p-4 text-left"
          :style="{ background: c.cardBg }"
          @click="$emit('open', c.id)"
        >
          <TopoLayer :seed="`ступень-${c.id}`" :ink="c.topoInk" :opacity="c.topoOpacity" />

          <!-- ⚠ Знак стоит в одном месте у всех карточек и одного роста.
               Рука была вдвое крупнее стрелки и вставала ниже неё — в ленте,
               где карточки читаются рядом, разнобой знаков сообщал разницу,
               которой нет: и рука, и стрелка тут говорят одно, «сюда можно
               заглянуть». Крупная рука осталась на строке недели, где стоит
               одна и означает состояние. -->
          <span class="flex items-start justify-between gap-2">
            <!-- Заголовок держит место под две строки: подписи под ним
                 обязаны стоять на одной высоте у всех карточек ленты, иначе
                 глаз читает разную длину имени как разный состав ступени. -->
            <span class="min-h-[2.625rem] text-[1.0625rem] font-bold leading-tight" :style="{ color: c.ink }">{{ c.title }}</span>
            <!-- Рука вместо стрелки у запертой ступени. Ступень не заперта
                 деньгами: её открывает состоявшийся разбор, то есть работа,
                 а не покупка. Паспорт всё равно открывается — заперт заказ,
                 а не чтение.
                 ⚠ Бокс у руки крупнее стрелочного, и это не разнобой:
                 в её `viewBox` заложены поля, знак вписывается по высоте
                 и в равном боксе выходит заметно мельче соседа. Двадцать
                 четыре пикселя дают ту же оптическую величину, что шеврон
                 в восемнадцати. Приглушение снято — знак живёт тем же тоном,
                 что стрелка. -->
            <HandIcon
              v-if="c.locked"
              class="h-[24px] w-[24px] shrink-0"
              :style="{ color: c.inkFaint }"
            />
            <ChevronRight
              v-else
              class="mt-[3px] h-[18px] w-[18px] shrink-0"
              :style="{ color: c.inkFaint }"
              :stroke-width="2.5"
              aria-hidden="true"
            />
          </span>

          <span class="mt-1.5 block text-[0.8125rem] leading-snug" :style="{ color: c.inkMuted, opacity: c.mutedOpacity }">{{ c.subtitle }}</span>

          <span class="mt-3 flex items-end justify-between gap-2">
            <span>
              <span class="block text-[0.625rem] uppercase tracking-wide" :style="{ color: c.inkFaint, opacity: c.faintOpacity }">Расход</span>
              <span class="block text-[1.0625rem] font-bold tabular-nums" :style="{ color: c.ink }">{{ c.price }}</span>
            </span>
            <span class="text-right">
              <span class="block text-[0.625rem] uppercase tracking-wide" :style="{ color: c.inkFaint, opacity: c.faintOpacity }">Мощность</span>
              <span class="block text-[1.0625rem] font-bold tabular-nums" :style="{ color: c.ink }">
                {{ c.gain > 0 ? `+${c.gain}%` : '—' }}
              </span>
            </span>
          </span>

          <!-- Времени встречи на карточке нет: выбор ступени оно не двигает,
               а место занимало. Длительность стоит в паспорте, где человек
               уже решает, идти ли. -->
          <span class="mt-2.5 flex items-center">
            <span
              class="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.625rem]
                     font-medium uppercase tracking-wide"
              :style="{ background: c.chipBg, color: c.chipInk }"
            >{{ c.label }}</span>
          </span>
        </button>
      </li>
      <!-- Распорка в конце ленты. Правый отступ контейнера в горизонтальной
           прокрутке не работает: браузер отдаёт его до содержимого и в конце
           прокрутки схлопывает, поэтому последняя карточка упиралась в край
           экрана. Пустой элемент той же ширины — единственный способ дать
           ленте дышать справа. -->
      <li class="w-1 shrink-0" aria-hidden="true"></li>
    </ul>
  </div>

  <!-- Полоса ленты. Показывается только когда есть что прокручивать: полоса
       во всю ширину под лентой, которая и так видна целиком, сообщала бы
       о прокрутке там, где её нет. -->
  <div v-if="bar.show" class="mt-2 flex justify-center" aria-hidden="true">
    <span class="relative block h-[3px] w-[64px] overflow-hidden rounded-full bg-[var(--line)]">
      <span
        class="absolute inset-y-0 rounded-full bg-[var(--text-muted)] transition-[left] duration-150"
        :style="{ width: bar.width + '%', left: bar.left + '%' }"
      ></span>
    </span>
  </div>
</template>
