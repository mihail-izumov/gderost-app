<script setup>
import { ref, computed } from 'vue'
import { ChevronDown, Lock } from 'lucide-vue-next'
import WeekWidget from './WeekWidget.vue'
import DayTable from './DayTable.vue'
import { DOW_RU } from '../composables/miniModel.js'
import { formatRubCompact, formatRub, weekRangeLabel, daysWord, dayLabel } from '../i18n/format.js'

// Недельный такт. Владелец живёт неделей: месяц слишком долго, чтобы успеть
// среагировать, день слишком коротко, чтобы делать из него выводы.
//
// Следующая неделя открывается, когда закрыты все прошедшие дни предыдущих.
// Запирают данные, а не деньги: пропущенный день вносится задним числом в любой
// момент и сам снимает замок, ноль — валидная выручка, платить ни за что не нужно.
// Смысл замка один — не смотреть вперёд, пока позади дыры, потому что на дырявых
// данных любой вывод о неделе неверен.

const props = defineProps({ m: { type: Object, required: true } })
const emit = defineEmits(['pick'])

// Текущая неделя раскрыта, остальные свёрнуты: месяц по дням — это тридцать
// строк, из которых человеку сейчас нужны семь.
const opened = ref(new Set(props.m.weeks.filter((w) => w.isCurrent).map((w) => w.idx)))

function toggle(w) {
  if (!w.open) return
  const s = new Set(opened.value)
  if (s.has(w.idx)) s.delete(w.idx)
  else s.add(w.idx)
  opened.value = s
}

const weeks = computed(() => props.m.weeks.map((w) => {
  const first = w.days[0]
  const last = w.days[w.days.length - 1]
  return {
    idx: w.idx,
    open: w.open,
    isCurrent: w.isCurrent,
    complete: w.complete,
    missing: w.missing,
    missingDays: w.days.filter((d) => d.due),
    leftDays: w.leftDays,
    plan: w.plan,
    fact: w.fact,
    hasFact: w.hasFact,
    // Против плана меряются только дни с известной дневной выручкой:
    // вошедшие суммой в недельную оценку не входят.
    partOfPlan: w.partOfPlan,
    delta: w.delta,
    range: weekRangeLabel(first.iso, last.iso),
    label: `Неделя ${w.idx} · ${weekRangeLabel(first.iso, last.iso)}`,
    rawDays: w.days,
    widgetDays: w.days.map((d) => ({
      key: d.iso,
      dow: d.dow,
      dowRu: DOW_RU[d.dow - 1],
      dd: d.dd,
      isToday: d.isToday,
      mark: d.inCarry ? 'carry' : d.entered ? sigOf(d.fact / d.plan) : 'idle',
    })),
  }
}))

function sigOf(r) {
  if (!Number.isFinite(r)) return 'idle'
  if (r >= 1) return 'good'
  if (r >= 0.85) return 'warn'
  return 'bad'
}

// Что именно держит замок: первая неделя с дырами.
const blocker = computed(() => {
  const w = weeks.value.find((x) => x.missing > 0)
  if (!w) return null
  return {
    idx: w.idx,
    days: w.missingDays.map((d) => dayLabel(d.iso)),
    firstIso: w.missingDays.length ? w.missingDays[0].iso : '',
  }
})

// Объяснение замка печатается один раз, у первой запертой недели. Повторить его
// на каждой из оставшихся значит четыре раза сказать одно и то же — верно и бесполезно.
const firstLocked = computed(() => {
  const w = weeks.value.find((x) => !x.open)
  return w ? w.idx : null
})

function weekNote(w) {
  if (w.missing) return `Не внесено: ${w.missing} ${daysWord(w.missing)}`
  if (w.leftDays) return `Впереди ${w.leftDays} ${daysWord(w.leftDays)}`
  return 'Неделя закрыта'
}

// Пилюля недели — отклонение от плана на внесённых днях. Знак несёт направление:
// цвет в приложении означает светофор и на дельту не тратится.
function weekPill(w) {
  if (!w.hasFact) return null
  if (Math.abs(w.delta) < 0.5) return 'в плане'
  return `${w.delta > 0 ? '+' : '−'}${formatRubCompact(Math.abs(w.delta))}`
}
</script>

<template>
  <section class="rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
    <h2 class="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
      Недели месяца
    </h2>
    <p class="mt-1 text-[0.75rem] leading-snug text-[var(--text-muted)]">
      Неделя — рабочий такт: недобор видно, пока его ещё можно отработать.
    </p>

    <ul class="mt-3 flex flex-col gap-2">
      <li
        v-for="w in weeks" :key="w.idx"
        class="rounded-xl border"
        :style="{ borderColor: w.isCurrent ? 'var(--text)' : 'var(--line)' }"
      >
        <!-- Шапка недели -->
        <button
          type="button"
          class="flex w-full items-center gap-2 px-3 py-2.5 text-left"
          :disabled="!w.open"
          @click="toggle(w)"
        >
          <span class="min-w-0 flex-1">
            <!-- Диапазон дат живёт в одном месте за раз: у свёрнутой недели в шапке,
                 у раскрытой — в заголовке виджета. Два одинаковых текста подряд
                 не добавляют смысла. -->
            <span class="block text-[0.9375rem] font-semibold leading-tight text-[var(--text)]">
              Неделя {{ w.idx }}
              <span v-if="!opened.has(w.idx) || !w.open" class="font-normal text-[var(--text-muted)]">
                · {{ w.range }}
              </span>
            </span>
            <span class="mt-0.5 block text-[0.75rem] text-[var(--text-muted)]">
              {{ !w.open && w.idx !== firstLocked ? `Откроется после недели ${firstLocked}` : weekNote(w) }}
            </span>
          </span>

          <span class="shrink-0 text-right">
            <span class="block font-mono text-[0.8125rem] tabular-nums text-[var(--text)]">
              {{ w.hasFact ? formatRubCompact(w.fact) : '—' }}
            </span>
            <span class="block font-mono text-[0.6875rem] tabular-nums text-[var(--text-muted)]">
              план {{ formatRubCompact(w.plan) }}
            </span>
          </span>

          <Lock v-if="!w.open" class="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
          <ChevronDown
            v-else
            class="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform"
            :style="opened.has(w.idx) ? { transform: 'rotate(180deg)' } : null"
            aria-hidden="true"
          />
        </button>

        <!-- Запертая неделя объяснена словами, а не значком -->
        <div v-if="!w.open && w.idx === firstLocked" class="border-t border-[var(--line)] px-3 py-3">
          <p class="text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
            <template v-if="blocker">
              Откроется, когда в неделе {{ blocker.idx }} появятся пропущенные дни:
              {{ blocker.days.join(', ') }}. Внесите их — и недели дальше раскроются сами,
              платить за это не нужно.
            </template>
            <template v-else>
              Откроется, когда закроются прошедшие дни предыдущих недель.
            </template>
          </p>
          <p class="mt-2 text-[0.75rem] leading-snug text-[var(--text-muted)]">
            Замок стоит не ради дисциплины: на неделе с дырами любой вывод неверен,
            а показать неверный вывод хуже, чем не показать никакого.
          </p>
          <button
            v-if="blocker && blocker.firstIso"
            type="button"
            class="mt-2 min-h-[44px] text-[0.8125rem] font-semibold"
            :style="{ color: 'var(--action)' }"
            @click="emit('pick', blocker.firstIso)"
          >Внести пропущенные дни</button>
        </div>

        <!-- Раскрытая неделя -->
        <div v-else-if="opened.has(w.idx)" class="border-t border-[var(--line)] px-3 py-3">
          <WeekWidget
            :days="w.widgetDays"
            :label="w.label"
            :note="weekNote(w)"
            :pill="weekPill(w)"
          />
          <div class="mt-3">
            <DayTable :days="w.rawDays" :legend="w.isCurrent" @pick="(iso) => emit('pick', iso)" />
          </div>
          <p v-if="w.hasFact" class="mt-2 text-[0.75rem] leading-snug text-[var(--text-muted)]">
            Против плана меряются только дни с известной дневной выручкой:
            здесь это {{ formatRub(w.fact) }} против {{ formatRub(w.partOfPlan) }}.
          </p>
        </div>
      </li>
    </ul>

    <!-- Предложение, а не единственный выход -->
    <div v-if="blocker" class="mt-3 rounded-xl bg-[var(--surface-2)] p-3">
      <p class="text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
        Дыры в неделе часто не про лень, а про то, что цифру негде взять или ей не верят.
        Это разбирается за одну встречу — «Проверка Честной цифрой». Один из выходов,
        не единственный: внести дни руками можно прямо сейчас и бесплатно.
      </p>
    </div>
  </section>
</template>
