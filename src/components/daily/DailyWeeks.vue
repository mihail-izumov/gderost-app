<script setup>
import { computed } from 'vue'
import { ChevronDown, Lock } from 'lucide-vue-next'
import { mln, ths, thsSigned, dayGen, L, SIG_VAR } from '../../i18n/daily.js'
import { plural } from '../../i18n/format.js'
import { useMiniStore } from '../../composables/useMiniStore.js'
import { shapeName } from '../../data/weekShape.js'

// Недели Пн–Вс: раскрывающийся блок с таблицей дней (план · факт · надо).
// Перенесено из рабочего Ранскеила вместе с решениями и их причинами.
//
// Плашка факта = и число, и прогресс. Полоса под числом сдвигала цифру, и её
// серый трек совпадал с фоном строки выходного — на субботе и воскресенье
// прогресса не было видно вовсе. Поэтому доля живёт В заливке плашки: жёсткая
// граница градиента на progWidth процентах, слева выполнено, справа остаток.
// Обе части — светлые тона одного токена сигнала: тёмный текст читается и на
// выполненной части, и на остатке (9,4–16,5:1 по WCAG). Насыщенную заливку
// сюда ставить нельзя — на границе текст ушёл бы в нечитаемое.
//
// Таблица помещается в мобильную колонку без горизонтального скролла:
// table-fixed плюс проценты, числа формата «252k» не разъезжают колонки.
//
// Добавлено против оригинала: замок недели. Следующая неделя открывается,
// когда закрыты прошедшие дни предыдущих — запирают данные, а не деньги.
//
// Раскрыта только текущая неделя. В оригинале открывалась каждая неделя
// с фактом, и месяц разворачивался в тридцать одну строку: искать в ней ту,
// в которой живёшь, приходится глазами. Прошлые недели открываются тапом.
//
// Добавлено против оригинала: статус формы недели в шапке блока. Колонка
// «надо» разносит остаток плана по весам дней, и с первого дня работы эти
// веса — допущение. Раньше узнать об этом можно было, только долистав до
// последнего блока экрана; теперь статус стоит там, где стоит и число,
// и открывает ту же настройку.

const props = defineProps({ m: { type: Object, required: true } })
const emit = defineEmits(['pick', 'tune'])
const monthGen = (dd) => dayGen(dd, props.m.month)

// Причина замка называется один раз — у первой запертой недели: дальше она
// та же самая, и повторённая трижды строка перестаёт читаться.
const firstLocked = computed(() => {
  const w = props.m.weeks.find((x) => !x.open)
  return w ? w.idx : 0
})

const state = useMiniStore().state
// В пилюле стоит выбранная форма, а не её статус: «допущение» одинаково
// у пяти разных пресетов, и по нему нельзя узнать, что именно выбрано.
// Длинное имя обрезается многоточием — статус читается в самой настройке.
const shapeLabel = computed(() =>
  shapeName(state.coef_src, state.shape_id, state.shape_from))

function progFill(r) {
  const c = SIG_VAR[r.sig]
  const w = Math.max(0, Math.min(100, r.progWidth))
  const done = `color-mix(in srgb, ${c} 40%, var(--surface))`
  const left = `color-mix(in srgb, ${c} 8%, var(--surface))`
  return `linear-gradient(90deg, ${done} 0 ${w}%, ${left} ${w}% 100%)`
}
</script>

<template>
  <section>
    <div class="mb-3 mt-2 flex items-center gap-3">
      <h2 class="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">{{ L.by_weeks }}</h2>
      <!-- Статус весов, по которым посчитана колонка «надо». Тап открывает
           ту же настройку, что имя формы в блоке «Дни недели». -->
      <button
        type="button"
        class="ml-auto flex min-h-[36px] min-w-0 items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-3 text-[0.8125rem] font-medium text-[var(--text)]"
        @click="emit('tune')"
      >
        <span class="shrink-0">{{ L.coef }}:</span>
        <span class="min-w-0 truncate">{{ shapeLabel }}</span>
        <ChevronDown class="h-4 w-4 shrink-0 text-[var(--text-muted)]" :stroke-width="2" aria-hidden="true" />
      </button>
    </div>

    <!-- Своё внесённое замок не прячет. Раньше запертая неделя не раскрывалась
         вовсе, и человек, внёсший в неё дни, не мог их увидеть: замок толкает
         закрыть дыры, а не отбирает уже сделанную работу. -->
    <details
      v-for="w in m.weeks"
      :key="`${w.idx}-${w.open}`"
      :open="(w.open || w.hasFact) && w.isCurrent"
      class="mb-2 overflow-hidden rounded-2xl border bg-[var(--surface)]"
      :style="{ borderColor: w.isCurrent ? 'var(--text)' : 'var(--line)' }"
    >
      <summary
        class="flex list-none flex-col gap-2 p-3 [&::-webkit-details-marker]:hidden"
        :class="w.open || w.hasFact ? 'cursor-pointer' : 'cursor-default'"
        @click="!(w.open || w.hasFact) && $event.preventDefault()"
      >
        <div class="flex items-center gap-2">
          <span class="font-semibold text-[var(--text)]">Неделя {{ w.idx }}</span>
          <span class="text-[0.75rem] text-[var(--text-muted)]">{{ w.from }}–{{ w.to }} {{ monthGen(w.to).split(' ')[1] }}</span>
          <Lock v-if="!w.open" class="ml-auto h-4 w-4 text-[var(--text-muted)]" :stroke-width="2" />
          <ChevronDown v-else class="ml-auto h-4 w-4 text-[var(--text-muted)]" :stroke-width="2" />
        </div>
        <!-- Свёрнутая неделя показывает план и то, что по ней известно.
             «Надо» печаталось у недель, целиком вошедших в стартовую сумму,
             и выходило «план 0,29 млн · надо 0,00 млн» — про неделю, которая
             давно прошла и в которой ничего делать уже не надо. -->
        <div class="flex flex-wrap gap-x-5 gap-y-1 text-[0.75rem]">
          <span><span class="text-[var(--text-muted)]">план </span><b class="font-semibold text-[var(--text)]">{{ mln(w.plan) }}</b></span>
          <span v-if="w.hasFact"><span class="text-[var(--text-muted)]">факт </span><b class="font-semibold text-[var(--text)]">{{ mln(w.fact) }}</b></span>
          <span v-else-if="w.hasSpread"><span class="text-[var(--text-muted)]">разнесено </span><b class="font-semibold text-[var(--text)]">{{ mln(w.spreadFact) }}</b></span>
          <span v-else-if="w.days.every((d) => d.closed)"><span class="text-[var(--text-muted)]">вошла суммой</span></span>
          <span v-else><span class="text-[var(--text-muted)]">надо </span><b class="font-semibold text-[var(--text)]">{{ mln(w.need) }}</b></span>
          <!-- Отклонение меряется против плана внесённых дней — пока неделя
               внесена не целиком, подпись называет охват, иначе читатель
               вычитает из факта план всей недели и получает другое число. -->
          <span v-if="w.hasFact"><span class="text-[var(--text-muted)]">{{ w.partOfPlan < w.plan - 0.5 ? 'откл. внесённых ' : 'откл. ' }}</span><b class="font-semibold text-[var(--text-secondary)]">{{ thsSigned(w.delta) }}</b></span>
        </div>
      </summary>

      <!-- Запертая неделя называет причину числами: каких именно дней не хватает
           и в какой неделе. «Прошедшие дни предыдущих недель» — это загадка,
           а замок, который запирает данные, обязан объясняться данными. Тап
           по числу ведёт в ввод этого дня: путь от объяснения до действия
           короче одного экрана. -->
      <div v-if="!w.open && !w.hasFact" class="border-t border-[var(--line)] px-3 py-3">
        <template v-if="w.blockedBy && w.idx === firstLocked">
          <p class="text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
            В неделе {{ w.blockedBy.idx }} нет выручки за
            {{ w.blockedBy.days.length }} {{ plural(w.blockedBy.days.length, 'день', 'дня', 'дней') }}.
            Внесите их — эта неделя откроется сама, платить за это не нужно.
          </p>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <button
              v-for="(iso, k) in w.blockedBy.iso"
              :key="iso"
              type="button"
              class="inline-flex min-h-[36px] items-center rounded-full bg-[var(--surface-2)] px-3 text-[0.8125rem] font-semibold"
              :style="{ color: 'var(--action)' }"
              @click.stop="emit('pick', iso)"
            >{{ w.blockedBy.days[k] }} {{ monthGen(w.blockedBy.days[k]).split(' ')[1] }}</button>
          </div>
        </template>
        <p v-else class="text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
          Откроется, когда закроются прошедшие дни предыдущих недель. Внесите их —
          и недели дальше раскроются сами, платить за это не нужно.
        </p>
      </div>

      <div v-else class="border-t border-[var(--line)]">
        <!-- Заперта, но своё видно: строка объясняет замок и не отбирает
             у человека уже внесённые дни. -->
        <p
          v-if="!w.open && w.blockedBy"
          class="border-b border-[var(--line)] px-3 py-2 text-[0.75rem] leading-snug text-[var(--text-muted)]"
        >
          Неделя заперта: в неделе {{ w.blockedBy.idx }} нет выручки
          за {{ w.blockedBy.days.join(', ') }}.
        </p>
        <table class="w-full table-fixed border-collapse text-[0.8125rem] [font-variant-numeric:tabular-nums]">
          <thead>
            <tr class="text-[0.6875rem] uppercase tracking-wide text-[var(--text-muted)]">
              <th class="w-[21%] px-2 py-2 text-left font-semibold">день</th>
              <th class="w-[22%] px-2 py-2 text-right font-semibold">план</th>
              <th class="w-[35%] px-2 py-2 text-right font-semibold">факт</th>
              <th class="w-[22%] px-2 py-2 text-right font-semibold">надо</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in w.rows" :key="r.dd"
              class="border-t border-[var(--line)]"
              :class="r.weekend ? 'bg-[var(--surface-2)]' : ''"
            >
              <td class="px-2 py-1.5 text-left text-[var(--text)]">
                {{ r.dd }} <span class="text-[0.6875rem] text-[var(--text-muted)]">{{ r.dowRu }}</span>
              </td>
              <td class="px-2 py-1.5 text-right text-[var(--text-secondary)]">{{ ths(r.plan) }}</td>
              <td class="px-2 py-1.5 text-right align-middle text-[var(--text)]">
                <span
                  v-if="r.full"
                  class="inline-flex w-full items-center justify-end gap-1 whitespace-nowrap rounded-full px-2 py-0.5"
                  :style="{ background: progFill(r) }"
                >{{ ths(r.fact) }}</span>
                <!-- День, вошедший в стартовую сумму. Разложен — показываем
                     его долю пунктирной плашкой: это раскладка, а не замер,
                     и заливки светофора у неё не бывает. -->
                <span
                  v-else-if="r.status === 'carry'"
                  class="inline-flex w-full items-center justify-end gap-1 whitespace-nowrap rounded-full border border-dashed border-[var(--line)] px-2 py-0.5 text-[var(--text-secondary)]"
                >
                  <template v-if="r.spread">{{ ths(r.fact) }}</template>
                  <template v-else><span class="text-[0.6875rem] text-[var(--text-muted)]">суммой</span></template>
                </span>
                <button
                  v-else-if="r.due"
                  type="button"
                  class="w-full text-right font-semibold"
                  :style="{ color: 'var(--action)' }"
                  @click.stop="emit('pick', `${m.month}-${String(r.dd).padStart(2, '0')}`)"
                >внести</button>
                <span v-else class="text-[var(--text-muted)]">—</span>
              </td>
              <td class="px-2 py-1.5 text-right align-middle font-medium text-[var(--text-secondary)]">
                <span v-if="!r.full && r.status !== 'carry'" class="whitespace-nowrap">{{ ths(r.need) }}</span>
                <span v-else class="text-[var(--text-muted)]">—</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="w.leftDays > 0 && w.hasFact"
          class="border-t border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[0.75rem] text-[var(--text-muted)]"
        >
          Осталось в неделе {{ w.leftDays }} дн — «надо» с хвостом: <b class="font-semibold text-[var(--text)]">{{ mln(w.need) }}</b>.
        </div>
      </div>
    </details>
  </section>
</template>
