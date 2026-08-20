<script setup>
import { computed, ref } from 'vue'
import { Check } from 'lucide-vue-next'
import { shareUrl } from '../../composables/shareLink.js'
import { useMiniStore } from '../../composables/useMiniStore.js'

// Первый шаг отправки: что уедет и в каком виде.
//
// Отправки отсюда нет намеренно. Кнопка ведёт в предпросмотр — на ту самую
// страницу, которую увидит получатель, — и отправка живёт уже там. Человек
// нажимает «Отправить», глядя на то, что отправляет, а не на список из трёх
// строк, который это описывает.
//
// ⚠ Тумблер между отправками не запоминается. Цена двух ошибок разная: лишнее
// нажатие раздражает, забытый включённый тумблер отправляет выручку в клуб,
// и это уже не чинится.

const emit = defineEmits(['preview'])

const store = useMiniStore()

// Выключен по умолчанию: безопасное положение — то, в котором суммы остаются
// у владельца.
const withRevenue = ref(false)
const mode = computed(() => (withRevenue.value ? 'full' : 'growth'))

const url = computed(() => (typeof window === 'undefined'
  ? ''
  : shareUrl(store.state, window.location.href, mode.value)))

const monthWord = computed(() => {
  const ym = store.state.month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const mm = Number(String(ym).split('-')[1])
  const NAMES = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
  return NAMES[mm - 1] || 'месяца'
})

const rows = [
  'Процент плана и как идут дни месяца',
  'Сколько дней внесено',
  'Честная цифра — на чём стоят числа',
]
</script>

<template>
  <div>
    <h2 class="text-[1.0625rem] font-bold text-[var(--text)]">Поделитесь ростом</h2>

    <ul class="mt-3 flex flex-col gap-2">
      <li
        v-for="r in rows"
        :key="r"
        class="flex items-start gap-2 text-[0.9375rem] leading-snug text-[var(--text-secondary)]"
      >
        <Check
          class="mt-[2px] h-[18px] w-[18px] shrink-0"
          :stroke-width="3"
          :style="{ color: 'var(--action-text)' }"
          aria-hidden="true"
        />
        <span>{{ r }}</span>
      </li>
    </ul>

    <button
      type="button"
      class="mt-4 flex w-full items-center gap-3 rounded-2xl p-3 text-left"
      :style="{ background: 'var(--surface-2)' }"
      role="switch"
      :aria-checked="withRevenue"
      @click="withRevenue = !withRevenue"
    >
      <span class="min-w-0 flex-1">
        <span class="block text-[0.9375rem] font-semibold text-[var(--text)]">Показать выручку</span>
        <span class="mt-0.5 block text-[0.8125rem] leading-snug text-[var(--text-muted)]">
          {{ withRevenue
            ? 'Получатель увидит выручку, план и остаток'
            : `Только прогноз ${monthWord}` }}
        </span>
      </span>
      <span
        class="relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors"
        :style="{ background: withRevenue ? 'var(--action)' : 'var(--line)' }"
      >
        <span
          class="absolute top-[2px] block h-[27px] w-[27px] rounded-full transition-all"
          :style="{ left: withRevenue ? '22px' : '2px', background: 'var(--surface)' }"
        />
      </span>
    </button>

    <button
      type="button"
      class="mt-4 flex min-h-[52px] w-full items-center justify-center rounded-2xl text-[1.0625rem] font-semibold"
      :style="{ background: 'var(--graphite)', color: 'var(--ink-on-color)' }"
      @click="emit('preview', { url, mode })"
    >
      Предпросмотр
    </button>
  </div>
</template>
