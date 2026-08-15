<script setup>
import { computed } from 'vue'
import { ChevronRight, Lock } from 'lucide-vue-next'
import { plural, weekRangeLabel } from '../../i18n/format.js'

// Недели месяца на странице состояния. Тот же расчёт, что в «Контроле Дня»:
// недели приходят из модели, второго правила недельного замка в проекте нет.
//
// Разница ролей названа вслух: в «Контроле Дня» недели — рабочий инструмент
// ввода с таблицей дней, здесь — сводка состояния со входом в тот же ввод.
// Человек приходит сюда с вопросом «почему следующая закрыта», и ответ обязан
// стоять раньше таблиц.
//
// Статус называется словом, а не угадывается по заливке: закрыта · идёт ·
// есть пропуски · заперта · впереди. Заперта — единственная, у которой есть
// причина, и причина эта всегда данные.

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

const rows = computed(() => props.m.weeks.map((w) => {
  const closed = w.days.filter((d) => d.closed).length
  const total = w.days.length
  const past = w.days[total - 1].iso < props.today
  const future = w.days[0].iso > props.today
  const status = !w.open ? 'locked'
    : w.missing > 0 ? 'gaps'
      : w.isCurrent ? 'now'
        : past ? 'done' : 'ahead'
  // Куда ведёт тап: в тот день, которого не хватает. У запертой недели это дыра
  // в неделе-причине — чинится там, а не здесь.
  const goTo = status === 'gaps' ? w.missingISO[0]
    : status === 'locked' && w.blockedBy ? w.blockedBy.iso[0]
      : status === 'now' || status === 'done' ? w.days.find((d) => !d.closed && d.iso <= props.today)?.iso || ''
        : ''
  // Цвет статуса — тот же светофор, что у дней: зелёный закрыт, жёлтый
  // требует внимания, серый ничего не утверждает. Красного у недели нет:
  // отсутствие данных — не провал плана.
  // Цвет говорит про данные, а не про выполнение плана. Зелёный отсюда убран:
  // «закрыта» означает, что дни внесены, и зелёный читался как «план сделан» —
  // про план неделя здесь не утверждает ничего. Осталась нейтраль: тёмная
  // у закрытой, синяя у идущей (активное состояние), жёлтая там, где не хватает
  // данных, серая у того, что ещё не наступило.
  const SKIN = {
    done: { bg: 'var(--text)', ink: 'var(--ink-on-color)', bar: 'var(--text)' },
    now: { bg: 'var(--action)', ink: 'var(--action-ink)', bar: 'var(--action)' },
    gaps: { bg: 'var(--warning)', ink: 'var(--accent-ink)', bar: 'var(--warning)' },
    locked: { bg: 'var(--surface-2)', ink: 'var(--text-muted)', bar: 'var(--line)' },
    ahead: { bg: 'var(--surface-2)', ink: 'var(--text-muted)', bar: 'var(--line)' },
  }
  return {
    idx: w.idx,
    range: weekRangeLabel(w.days[0].iso, w.days[total - 1].iso),
    closed,
    total,
    width: total ? Math.round((closed / total) * 100) : 0,
    status,
    label: { locked: 'ждём данные', gaps: 'есть пропуски', now: 'идёт', done: 'закрыта', ahead: 'готовимся' }[status],
    skin: SKIN[status],
    missing: w.missing,
    blockedBy: w.blockedBy,
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
          class="flex w-full min-h-[60px] items-center gap-3 px-4 py-3 text-left"
          @click="r.goTo ? emit('enter', r.goTo) : null"
        >
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-2">
              <span class="text-[0.9375rem] font-semibold text-[var(--text)]">{{ r.range }}</span>
              <span
                class="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide"
                :style="{ background: r.skin.bg, color: r.skin.ink }"
              >{{ r.label }}</span>
            </span>
            <span class="mt-1.5 block h-[6px] w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
              <span
                class="block h-full rounded-full"
                :style="{ width: `${r.width}%`, background: r.skin.bar }"
              ></span>
            </span>
            <span class="mt-1 block text-[0.75rem] text-[var(--text-muted)]">
              {{ r.closed }} из {{ r.total }} {{ plural(r.total, 'дня', 'дней', 'дней') }}
              <template v-if="r.status === 'gaps'">
                · не хватает {{ r.missing }}
              </template>
              <template v-else-if="r.status === 'locked' && r.blockedBy && r.idx === firstLocked">

                · держит неделя {{ r.blockedBy.idx }}: нет {{ r.blockedBy.days.join(', ') }}
              </template>
            </span>
          </span>
          <Lock
            v-if="r.status === 'locked'"
            class="h-[18px] w-[18px] shrink-0 text-[var(--text-muted)]"
            :stroke-width="2"
            aria-hidden="true"
          />
          <ChevronRight
            v-else-if="r.goTo"
            class="h-[18px] w-[18px] shrink-0 text-[var(--text-muted)]"
            :stroke-width="2.5"
            aria-hidden="true"
          />
        </component>
      </li>
    </ul>

    <p class="mt-2 text-[0.75rem] leading-snug text-[var(--text-muted)]">
      Неделя открывается внесёнными днями. Деньгами её не открыть — и не нужно.
    </p>
  </section>
</template>
