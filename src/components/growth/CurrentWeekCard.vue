<script setup>
import { computed } from 'vue'
import { plural, weekRangeLabel } from '../../i18n/format.js'

// Идущая неделя — главный блок «Прогресса».
//
// Он стоит первым и выглядит крупнее всего остального, потому что отвечает
// на вопрос, ради которого человек сюда заходит: сколько дней этой недели
// у меня уже есть и что нужно сделать сегодня. Раньше на его месте была
// строка с тонкой полосой, и на пустой неделе полоса была шириной в ноль —
// главный блок экрана выглядел пустым местом.
//
// ⚠ Блок не исчезает никогда. Прежний прятался целиком, когда текущей недели
// в месяце нет (месяц закрыт или ещё не начался), и экран начинался с пустоты
// без объяснения. Теперь при отсутствии идущей недели показывается последняя
// неделя месяца, а метка честно говорит, что она прошла.
//
// Полоса показывает долю внесённых дней и ничего больше. Про план она
// не утверждает: внесённый день — это данные, а не выполнение.

const props = defineProps({
  m: { type: Object, required: true },
  today: { type: String, required: true },
})
const emit = defineEmits(['enter'])

const week = computed(() => {
  const ws = props.m.weeks
  return ws.find((w) => w.isCurrent) || ws[ws.length - 1] || null
})

const view = computed(() => {
  const w = week.value
  if (!w) return null
  const total = w.days.length
  const closed = w.days.filter((d) => d.closed).length
  const now = !!w.isCurrent
  // Ближайший день, который можно внести: прошедший или сегодняшний, без факта.
  // Будущих дней здесь не бывает — выручки за них не существует.
  const next = w.days.find((d) => !d.closed && d.iso <= props.today)
  return {
    name: `Неделя ${w.idx}`,
    range: weekRangeLabel(w.days[0].iso, w.days[total - 1].iso),
    closed,
    total,
    now,
    width: total ? Math.round((closed / total) * 100) : 0,
    // Метка времени — та же, что в списке недель ниже: одно слово об одном.
    label: now ? 'идёт' : 'прошла',
    nextISO: next ? next.iso : '',
    // Строка состояния говорит о данных, а не о плане, и не советует.
    note: next
      ? `Не внесён ${plural(1, 'день', 'дня', 'дней')} — ${Number(next.iso.slice(8))} числа`
      : now ? 'Все прошедшие дни внесены' : 'Неделя внесена полностью',
  }
})
</script>

<template>
  <section
    v-if="view"
    class="rounded-[22px] bg-[var(--surface)] p-4"
  >
    <div class="flex items-baseline gap-2">
      <h2 class="text-[1.0625rem] font-bold leading-none text-[var(--text)]">{{ view.name }}</h2>
      <span class="text-[0.875rem] text-[var(--text-muted)]">{{ view.range }}</span>
      <span
        class="ml-auto inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide"
        :style="view.now
          ? { background: 'var(--action)', color: 'var(--action-ink)' }
          : { background: 'var(--text)', color: 'var(--ink-on-color)' }"
      >{{ view.label }}</span>
    </div>

    <!-- Счёт слэшем и крупно: это главное число блока. Подпись рядом
         с ним, а не под полосой — число без предмета читается кодом. -->
    <div class="mt-3 flex items-baseline gap-2">
      <span class="text-[2rem] font-bold leading-none tabular-nums text-[var(--text)]">
        {{ view.closed }} / {{ view.total }}
      </span>
      <span class="text-[0.8125rem] text-[var(--text-muted)]">
        {{ plural(view.total, 'день внесён', 'дня внесено', 'дней внесено') }}
      </span>
    </div>

    <span class="mt-3 block h-[10px] w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
      <span
        class="block h-full rounded-full"
        :style="{
          width: `${view.width}%`,
          background: view.now ? 'var(--action)' : 'var(--text)',
        }"
      ></span>
    </span>

    <p class="mt-2.5 text-[0.8125rem] text-[var(--text-muted)]">{{ view.note }}</p>

    <!-- Кнопка есть, только когда есть что вносить. Кнопка «внести»
         на полностью внесённой неделе открывала бы форму ради формы. -->
    <button
      v-if="view.nextISO"
      type="button"
      class="mt-3 min-h-[48px] w-full rounded-2xl text-[1rem] font-bold"
      :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      @click="emit('enter', view.nextISO)"
    >Внести день</button>
  </section>
</template>
