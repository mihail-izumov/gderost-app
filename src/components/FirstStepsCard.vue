<script setup>
import { computed } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { useMiniStore } from '../composables/useMiniStore.js'
import { todayISO } from '../composables/miniModel.js'
import { monthCap } from '../i18n/home.js'

// Первые шаги — продолжение объяснения уже на интерфейсе.
//
// Короткий вход спрашивает два числа, поэтому первый экран человек видит
// наполовину пустым. Карточка называет, чего не хватает, и ведёт прямо
// туда, где это вводится: одно действие за раз, сверху то, без чего
// приложение считает беднее всего.
//
// Исчезает сама. Пунктов не осталось — карточки нет: список из одних
// галочек живёт ради себя, а не ради человека.

const props = defineProps({
  // Модель месяца: по ней видно, что уже есть.
  m: { type: Object, required: true },
})
const emit = defineEmits(['go', 'carry'])

const store = useMiniStore()

// Месяц идёт не с первого числа, а прошлое не внесено ни днями, ни суммой:
// темп считать не из чего, и прогноз выйдет беднее правды. День закрытым
// становится только от ввода, поэтому смотрим на календарь, а не на модель.
const needsPast = computed(() => {
  const s = store.state
  if (s.carry) return false
  if (Array.isArray(s.days) && s.days.length > 0) return false
  if (!props.m || !props.m.month) return false
  return todayISO() > `${props.m.month}-01`
})

const items = computed(() => {
  const out = []
  if (props.m && props.m.realizedCount === 0 && !store.state.carry) {
    out.push({
      id: 'day',
      title: 'Внесите выручку за день',
      note: 'С первого дня появится прогноз месяца',
      go: 'day',
    })
  }
  if (needsPast.value) {
    out.push({
      id: 'carry',
      title: `Что уже заработано в ${monthCap(props.m.month).toLowerCase()}`,
      note: 'Одной суммой, чтобы прогноз считал по правде',
      go: 'carry',
    })
  }
  if (!store.state.month_goal) {
    out.push({
      id: 'goal',
      title: 'Поставьте цель месяца',
      note: 'Цель показывается рядом с планом',
      go: 'goals',
    })
  }
  return out
})
</script>

<template>
  <section v-if="items.length" class="rounded-2xl bg-[var(--surface)] px-4 py-3">
    <p class="text-[0.625rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
      Что дальше
    </p>
    <ul class="mt-1 flex flex-col">
      <li v-for="(it, i) in items" :key="it.id">
        <button
          type="button"
          class="flex min-h-[52px] w-full items-center justify-between gap-3 text-left"
          :class="i < items.length - 1 ? 'border-b border-[var(--line)]' : ''"
          @click="it.go === 'carry' ? emit('carry') : emit('go', it.go)"
        >
          <span class="min-w-0">
            <span class="block text-[0.9375rem] font-semibold text-[var(--text)]">{{ it.title }}</span>
            <span class="mt-0.5 block text-[0.75rem] leading-snug text-[var(--text-muted)]">{{ it.note }}</span>
          </span>
          <ChevronRight class="h-[18px] w-[18px] shrink-0 text-[var(--text-muted)]" :stroke-width="2.5" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </section>
</template>
