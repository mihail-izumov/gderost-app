<script setup>
import { computed } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import HandIcon from '../icons/HandIcon.vue'
import { weekRangeLabel, formatRub } from '../../i18n/format.js'
import { sigClass } from '../../composables/miniModel.js'

// Недели месяца на странице состояния. Тот же расчёт, что в «Контроле Дня»:
// недели приходят из модели, второго правила недельного замка в проекте нет.
//
// Разница ролей названа вслух: в «Контроле Дня» недели — рабочий инструмент
// ввода с таблицей дней, здесь — сводка состояния со входом в тот же ввод.
//
// ⚠ У строки ОДНО сообщение, и все средства говорят его вместе.
//
// Раньше их было три и каждое про своё: цвет полосы про время, метка про
// результат, вторая метка про долг. На идущей неделе с пропусками это давало
// синий бейдж «идёт», жёлтый бейдж «нет 2 дн» и зелёную полосу под ними —
// три разных ответа в одной строке. Теперь так:
//
//   БЕЙДЖ один и называет главное: долг важнее результата, результат важнее
//   времени. Порядок разобран у самого расчёта ниже.
//
//   ПОЛОСА показывает данные — долю закрытых дней недели — и красится ЦВЕТОМ
//   БЕЙДЖА. Одно состояние — один цвет; расхождение между ними и было тем,
//   из-за чего строка не читалась.
//
//   ЗНАК СПРАВА говорит про проходимость: стрелка — внутрь можно, рука —
//   нельзя. Запертая и будущая недели внутрь не пускают.
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
const emit = defineEmits(['week'])

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

  // ⚠ Внутрь пускает только неделя, в которой есть что смотреть, и это ровно
  // те же недели, которые открыты по правилу такта. Запертая неделя не
  // открывается никогда: замок держат дыры в предыдущих неделях, и обойти его
  // переходом значит сделать замок декорацией. Будущая — тоже: смотреть в ней
  // нечего, а раскрытая пустая таблица читается поломкой.
  //
  // Раньше запертая неделя пропускала внутрь, и от этого замок терял смысл,
  // а у человека появлялись хвосты — он открывал неделю, которой ещё нет.
  const goTo = locked || time === 'ahead' ? 0 : w.idx

  // Полоса прошедшей недели красится её результатом: неделя кончилась,
  // и «сколько внесено» у неё всегда сто процентов — чернильная полоса
  // на всю ширину не сообщала ничего. Идущая неделя остаётся цветом действия:
  // мерить планом её рано.
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
  // Оценка для недели, закрытой стартовой суммой: её показанный факт против
  // её же плана. Данные те же, что в сводке «Контроля Дня», второго счёта
  // здесь не заводится.
  const sumRatio = full && ratio === null && w.plan > 0 ? w.shownFact / w.plan : null
  const sumPct = sumRatio !== null ? Math.round(sumRatio * 100) : null
  const SIG = {
    good: { bg: 'var(--positive)', ink: 'var(--ink-on-color)' },
    warn: { bg: 'var(--warning)', ink: 'var(--accent-ink)' },
    bad: { bg: 'var(--negative)', ink: 'var(--ink-on-color)' },
    idle: { bg: 'var(--surface-2)', ink: 'var(--text-muted)' },
  }

  // ⚠ Бейдж У НЕДЕЛИ ОДИН, и цвет полосы всегда равен его цвету.
  //
  // Раньше их бывало два: «идёт» синим и «нет 2 дн» жёлтым в одной строке, —
  // а полоса красилась третьим правилом и могла быть зелёной под жёлтым
  // бейджем. Три средства отвечали на разные вопросы в одном месте, и строка
  // переставала читаться: человек видел зелёное и жёлтое рядом и не понимал,
  // хорошо у него или плохо.
  //
  // Теперь порядок один и он про приоритет сообщения:
  //   1. есть долг — говорим про долг, жёлтым; всё остальное подождёт;
  //   2. неделя кончилась и внесена — говорим результатом, светофором;
  //   3. неделя идёт и дыр в ней нет — «идёт», цветом действия;
  //   4. неделя впереди или заперта — «скоро» / «ждём данные», серым.
  let chip
  if (missing > 0) {
    chip = { text: `нет ${missing} дн`, bg: 'var(--warning)', ink: 'var(--accent-ink)' }
  } else if (time === 'past' && donePct !== null) {
    chip = { text: `${donePct} %`, ...SIG[sigClass(ratio)] }
  } else if (time === 'past' && sumPct !== null) {
    // Неделя целиком вошла в стартовую сумму: дневных чисел у её дней нет,
    // и процент по ним не считается. Но недельный план и её доля общей суммы
    // известны — процент честно берётся с них, только помечается знаком «≈»:
    // он верен для недели в целом и не разложен по дням.
    chip = { text: `≈ ${sumPct} %`, ...SIG[sigClass(sumRatio)] }
  } else if (time === 'past') {
    chip = { text: 'внесена', bg: 'var(--text)', ink: 'var(--ink-on-color)' }
  } else if (locked) {
    chip = { text: 'ждём данные', bg: 'var(--surface-2)', ink: 'var(--text-muted)' }
  } else if (time === 'now') {
    chip = { text: 'идёт', bg: 'var(--action)', ink: 'var(--action-ink)' }
  } else {
    // «Впереди» звучало как строка расписания. «Скоро» говорит про близость,
    // а не про очередь, и не обещает срока.
    chip = { text: 'скоро', bg: 'var(--surface-2)', ink: 'var(--text-muted)' }
  }

  // Полоса — та же ось, что бейдж, и того же цвета. Длина говорит про данные
  // (сколько дней недели закрыто), цвет — про состояние, которое назвал бейдж.
  // Серый бейдж — серая полоса: у недели, которой ещё нет, показывать нечего.
  const bar = chip.bg === 'var(--surface-2)' ? 'var(--line)' : chip.bg

  return {
    idx: w.idx,
    name: `Неделя ${w.idx}`,
    range: weekRangeLabel(w.days[0].iso, w.days[total - 1].iso),
    closed,
    total,
    // Деньги недели — то, ради чего дни и вносят. Счёт дней остаётся рядом
    // подписью: он говорит, насколько этой сумме можно верить.
    fact: w.hasFact || w.hasSpread ? formatRub(w.shownFact) : '',
    width: total ? Math.round((closed / total) * 100) : 0,
    time,
    now: time === 'now',
    locked,
    chip,
    ink: { bar },
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
          @click="r.goTo ? emit('week', r.goTo) : null"
        >
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

            <!-- Деньги недели и счёт внесённых дней. Второй метки долга здесь
                 больше нет: о долге говорит бейдж в шапке строки, и он один. -->
            <span class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span v-if="r.fact" class="text-[0.9375rem] font-bold tabular-nums text-[var(--text)]">
                {{ r.fact }}
              </span>
              <span class="text-[0.75rem] tabular-nums text-[var(--text-muted)]">
                {{ r.closed }} / {{ r.total }} дн
              </span>
            </span>

            <!-- Причина замка — своей строкой. В общей строке счёта она
                 читалась хвостом числа, а это единственное место экрана,
                 где неделя объясняет, чем она держится. -->
            <span
              v-if="r.locked && r.blockedBy && r.idx === firstLocked"
              class="mt-1 block text-[0.75rem] leading-snug text-[var(--text-muted)]"
            >Держит неделя {{ r.blockedBy.idx }} — нет {{ r.blockedBy.days.join(', ') }}</span>
          </span>

          <!-- ⚠ Знаки живут в СВОЁМ столбце постоянной ширины, и от этого
               зависит не только их ряд: пока знак стоял в общем потоке,
               ширина полос недель менялась от того, что оказалось справа —
               рука, стрелка или ничего. Полосы разной длины на соседних
               строках человек читает как разный масштаб.
               Рука вместо замка: закрыто здесь не приложением и не за деньги,
               а отсутствием фактов. Толщина линии и размер — стрелочные.
               Цвет говорит о проходимости: тёмный там, где внутрь можно,
               светлый там, где нельзя. -->
          <span class="flex w-[22px] shrink-0 justify-center" aria-hidden="true">
            <!-- Рука стоит у каждой недели, куда сейчас не зайти: и у запертой
                 чужими дырами, и у той, которая ещё не наступила. Пустое место
                 в столбце знаков читалось как «здесь что-то не нарисовалось»,
                 хотя состояние у этих недель ровно одно — «ещё рано». -->
            <HandIcon
              v-if="!r.goTo"
              class="h-[22px] w-[22px] text-[var(--line)]"
              aria-label="Ждём данные"
            />
            <ChevronRight
              v-else
              class="h-[22px] w-[22px] text-[var(--text-secondary)]"
              :stroke-width="2"
            />
          </span>
        </component>
      </li>
    </ul>
  </section>
</template>
