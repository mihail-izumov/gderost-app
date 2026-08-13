<script setup>
import { ChevronDown, Lock } from 'lucide-vue-next'
import { mln, ths, thsSigned, dayGen, L, SIG_VAR } from '../../i18n/daily.js'

// Недели Пн–Вс: раскрывающийся блок с таблицей дней (план · факт · надо).
// Перенесено из рабочего Ранскейла вместе с решениями и их причинами.
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

const props = defineProps({ m: { type: Object, required: true } })
const emit = defineEmits(['pick'])
const monthGen = (dd) => dayGen(dd, props.m.month)

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
    <h2 class="mb-3 mt-2 text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">{{ L.by_weeks }}</h2>

    <details
      v-for="w in m.weeks"
      :key="w.idx"
      :open="w.open && w.rows.some((r) => r.status != null)"
      class="mb-2 overflow-hidden rounded-2xl border bg-[var(--surface)]"
      :style="{ borderColor: w.isCurrent ? 'var(--text)' : 'var(--line)' }"
    >
      <summary
        class="flex list-none flex-col gap-2 p-3 [&::-webkit-details-marker]:hidden"
        :class="w.open ? 'cursor-pointer' : 'cursor-default'"
        @click="!w.open && $event.preventDefault()"
      >
        <div class="flex items-center gap-2">
          <span class="font-semibold text-[var(--text)]">Неделя {{ w.idx }}</span>
          <span class="text-[0.75rem] text-[var(--text-muted)]">{{ w.from }}–{{ w.to }} {{ monthGen(w.to).split(' ')[1] }}</span>
          <Lock v-if="!w.open" class="ml-auto h-4 w-4 text-[var(--text-muted)]" :stroke-width="2" />
          <ChevronDown v-else class="ml-auto h-4 w-4 text-[var(--text-muted)]" :stroke-width="2" />
        </div>
        <div class="flex flex-wrap gap-x-5 gap-y-1 text-[0.75rem]">
          <span><span class="text-[var(--text-muted)]">план </span><b class="font-semibold text-[var(--text)]">{{ mln(w.plan) }}</b></span>
          <span v-if="w.hasFact"><span class="text-[var(--text-muted)]">факт </span><b class="font-semibold text-[var(--text)]">{{ mln(w.fact) }}</b></span>
          <span v-else><span class="text-[var(--text-muted)]">надо </span><b class="font-semibold text-[var(--text)]">{{ mln(w.need) }}</b></span>
          <span v-if="w.hasFact"><span class="text-[var(--text-muted)]">откл. </span><b class="font-semibold text-[var(--text-secondary)]">{{ thsSigned(w.delta) }}</b></span>
        </div>
      </summary>

      <!-- Запертая неделя объяснена словами, а не значком: замок без причины
           читается как платная стена, а платной стены здесь нет. -->
      <div v-if="!w.open" class="border-t border-[var(--line)] px-3 py-3">
        <p class="text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
          Откроется, когда закроются прошедшие дни предыдущих недель. Внесите их —
          и недели дальше раскроются сами, платить за это не нужно.
        </p>
      </div>

      <div v-else class="border-t border-[var(--line)]">
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
                <!-- День, вошедший в стартовую сумму: дневной выручки у него нет,
                     поэтому нет ни заливки, ни оценки — и не будет задним числом. -->
                <span
                  v-else-if="r.status === 'carry'"
                  class="inline-flex w-full items-center justify-end whitespace-nowrap rounded-full border border-dashed border-[var(--line)] px-2 py-0.5 text-[0.6875rem] text-[var(--text-muted)]"
                >суммой</span>
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
