<script setup>
import { computed } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import HandIcon from '../icons/HandIcon.vue'
import { weekRangeLabel } from '../../i18n/format.js'
import { sigClass } from '../../composables/miniModel.js'

// Недели месяца на странице состояния. Тот же расчёт, что в «Контроле Дня»:
// недели приходят из модели, второго правила недельного замка в проекте нет.
//
// Разница ролей названа вслух: в «Контроле Дня» недели — рабочий инструмент
// ввода с таблицей дней, здесь — сводка состояния со входом в тот же ввод.
//
// ⚠ Здесь смешивались две разные оси, и от этого цвет ничего не означал.
// Первая ось — ВРЕМЯ: неделя прошла, идёт или ещё впереди. Вторая — ДАННЫЕ:
// дни внесены или нет. Раньше обе красили одно и то же место, и «закрыта»
// стояло рядом с «идёт», хотя это ответы на разные вопросы. Теперь ось у
// каждого средства своя и одна:
//
//   ЦВЕТ говорит про время. Прошлое — чернильное, идущая неделя — цвет
//   действия, будущее — серое. Три состояния, между собой не пересекаются.
//
//   ПОЛОСА говорит про данные. Всегда одно и то же: какая доля дней недели
//   внесена. Пустая полоса означает пустую неделю и ничего больше.
//
//   ЖЁЛТЫЙ говорит про долг, и только про него. Он появляется отдельной
//   меткой «нет N дней» и не красит собой строку целиком: пропуск — это
//   часть состояния недели, а не сама неделя.
//
// Номер недели важнее её дат: человек говорит «на этой неделе» и «в прошлую»,
// а не «шестнадцатого—двадцать второго». Поэтому крупно стоит «Неделя 3»,
// а диапазон идёт следом подписью.

const props = defineProps({
  m: { type: Object, required: true },
  // 'YYYY-MM-DD' сегодняшнего дня из модели: недели живут в месяце приложения,
  // а не в календаре устройства.
  today: { type: String, required: true },
  // Заголовок с именем месяца — подставляется экраном.
  monthTitle: { type: String, default: 'Недели месяца' },
})
const emit = defineEmits(['enter'])

// Причина замка называется один раз — у первой запертой недели. Дальше она
// та же самая, и повторённая трижды строка перестаёт читаться вовсе.
const firstLocked = computed(() => {
  const w = props.m.weeks.find((x) => !x.open)
  return w ? w.idx : 0
})

// Время недели — одна из трёх позиций, других не бывает.
function timeOf(w, total) {
  if (w.isCurrent) return 'now'
  return w.days[total - 1].iso < props.today ? 'past' : 'ahead'
}

const rows = computed(() => props.m.weeks.map((w) => {
  const total = w.days.length
  const closed = w.days.filter((d) => d.closed).length
  const time = timeOf(w, total)
  const locked = !w.open
  // Долг — только про прошедшие дни. Будущий день не внесён не потому,
  // что о нём забыли, и меткой долга он не помечается никогда.
  const missing = w.missing

  // Куда ведёт тап: в тот день, которого не хватает. У запертой недели это
  // дыра в неделе-причине — чинится там, а не здесь. В будущее тап не ведёт:
  // выручки за не наступивший день не бывает, и форма ввода там оказалась бы
  // предложением её выдумать.
  const goTo = time === 'ahead' && !locked ? ''
    : locked && w.blockedBy ? w.blockedBy.iso[0]
      : missing > 0 ? w.missingISO[0]
        : time === 'now' ? w.days.find((d) => !d.closed && d.iso <= props.today)?.iso || ''
          : ''

  const INK = {
    past: { bar: 'var(--text)' },
    now: { bar: 'var(--action)' },
    ahead: { bar: 'var(--line)' },
  }[time]

  // Метка справа. У прошедшей недели она говорит про план, и это законно
  // только тогда, когда неделя внесена целиком: процент по половине данных —
  // не результат, а половина результата, выданная за целое. Неполная прошлая
  // неделя вместо процента называет долг числами.
  //
  // У идущей и будущей недели процента нет по той же причине: неделя ещё
  // не кончилась, и мерить её планом рано.
  const full = closed === total && total > 0
  const ratio = w.ratio
  const donePct = full && ratio !== null ? Math.round(ratio * 100) : null
  const SIG = {
    good: { bg: 'var(--positive)', ink: 'var(--ink-on-color)' },
    warn: { bg: 'var(--warning)', ink: 'var(--accent-ink)' },
    bad: { bg: 'var(--negative)', ink: 'var(--ink-on-color)' },
    idle: { bg: 'var(--surface-2)', ink: 'var(--text-muted)' },
  }
  let chip
  if (time === 'past' && donePct !== null) {
    chip = { text: `${donePct} %`, ...SIG[sigClass(ratio)] }
  } else if (time === 'past') {
    chip = { text: `нет ${total - closed} дн`, bg: 'var(--warning)', ink: 'var(--accent-ink)' }
  } else if (time === 'now') {
    chip = { text: 'идёт', bg: 'var(--action)', ink: 'var(--action-ink)' }
  } else {
    // «Впереди» звучало как строка расписания. «Скоро» говорит про близость,
    // а не про очередь, и не обещает срока.
    chip = { text: 'скоро', bg: 'var(--surface-2)', ink: 'var(--text-muted)' }
  }

  return {
    idx: w.idx,
    name: `Неделя ${w.idx}`,
    range: weekRangeLabel(w.days[0].iso, w.days[total - 1].iso),
    closed,
    total,
    width: total ? Math.round((closed / total) * 100) : 0,
    time,
    now: time === 'now',
    locked,
    chip,
    ink: INK,
    // Долг показывается только там, где метка о нём не сказала сама.
    missing: time === 'past' ? 0 : missing,
    blockedBy: locked ? w.blockedBy : null,
    goTo,
  }
}))
</script>

<template>
  <section>
    <h2 class="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
      {{ monthTitle }}
    </h2>

    <ul class="mt-2 overflow-hidden rounded-2xl bg-[var(--surface)]">
      <li v-for="r in rows" :key="r.idx" class="border-b border-[var(--line)] last:border-b-0">
        <component
          :is="r.goTo ? 'button' : 'div'"
          :type="r.goTo ? 'button' : null"
          class="relative flex w-full min-h-[64px] items-center gap-3 py-3 pl-4 pr-4 text-left"
          @click="r.goTo ? emit('enter', r.goTo) : null"
        >
          <!-- Идущая неделя отмечена полосой у самого края строки. Заливка
               всей строки спорила бы с полосой данных внутри неё, а метка
               «идёт» находится глазом только после чтения. -->
          <span
            v-if="r.now"
            class="absolute inset-y-2 left-0 w-[3px] rounded-r-full"
            :style="{ background: 'var(--action)' }"
            aria-hidden="true"
          ></span>

          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-2">
              <span
                class="text-[0.9375rem] text-[var(--text)]"
                :class="r.now ? 'font-bold' : 'font-semibold'"
              >{{ r.name }}</span>
              <span class="text-[0.8125rem] text-[var(--text-muted)]">{{ r.range }}</span>
              <span
                class="ml-auto inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide tabular-nums"
                :style="{ background: r.chip.bg, color: r.chip.ink }"
              >{{ r.chip.text }}</span>
            </span>

            <span class="mt-1.5 block h-[6px] w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
              <span
                class="block h-full rounded-full"
                :style="{ width: `${r.width}%`, background: r.ink.bar }"
              ></span>
            </span>

            <!-- Счёт слэшем, метка долга — отдельной плашкой. Точка-разделитель
                 склеивала два разных сообщения в одну строку, и человек читал
                 «не хватает 5» как продолжение счёта дней. -->
            <span class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span class="text-[0.75rem] tabular-nums text-[var(--text-muted)]">
                {{ r.closed }} / {{ r.total }} дн
              </span>
              <span
                v-if="r.missing > 0"
                class="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide tabular-nums"
                :style="{ background: 'var(--warning)', color: 'var(--accent-ink)' }"
              >нет {{ r.missing }} дн</span>
            </span>

            <!-- Причина замка — своей строкой. В общей строке счёта она
                 читалась хвостом числа, а это единственное место экрана,
                 где неделя объясняет, чем она держится. -->
            <span
              v-if="r.locked && r.blockedBy && r.idx === firstLocked"
              class="mt-1 block text-[0.75rem] leading-snug text-[var(--text-muted)]"
            >Держит неделя {{ r.blockedBy.idx }} — нет {{ r.blockedBy.days.join(', ') }}</span>
          </span>

          <!-- Рука вместо замка: закрыто здесь не приложением и не за деньги,
               а отсутствием фактов. Знак стоит в жёлтом круге — жёлтый
               в системе означает незавершённость, и это ровно тот случай;
               сам знак тёмный, потому что жёлтая фигура на белом не читается,
               а производных оттенков в системе нет. -->
          <span
            v-if="r.locked"
            class="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full"
            :style="{ background: 'var(--warning)' }"
            aria-label="Ждём данные"
          >
            <HandIcon class="h-[15px] w-[15px]" :style="{ color: 'var(--accent-ink)' }" />
          </span>
          <ChevronRight
            v-else-if="r.goTo"
            class="h-[18px] w-[18px] shrink-0 text-[var(--text-muted)]"
            :stroke-width="2.5"
            aria-hidden="true"
          />
        </component>
      </li>
    </ul>
  </section>
</template>
