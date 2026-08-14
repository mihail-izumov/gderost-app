<script setup>
import { computed, ref } from 'vue'
import { Download, Check, Lock } from 'lucide-vue-next'
import { formatRub } from '../../i18n/format.js'
import { moduleGain } from '../../composables/energyModel.js'
import { MODULES, ORDER_STEPS } from '../../i18n/energy.js'
import { bookingLink } from '../../data/contact.js'
import { useMiniStore } from '../../composables/useMiniStore.js'
import { saveText } from '../../composables/saveFile.js'
import ShareMonthButton from '../ShareMonthButton.vue'

// Паспорт модуля: услуга описана как устройство.
//
// Три плитки — скорость, мощность, расход — и спецификация строками.
// Мощность не написана словом, а посчитана на состоянии владельца: разбор
// поднимает цель с 5 до 20, значит на его паспорте стоит «+15%». Так лестница
// сверху и паспорт говорят на одном языке.
//
// Заказ живёт здесь же (D-112): отправка данных и есть заказ. Файл выгрузки
// переехал сюда с экрана — на экране он стоял отдельной кнопкой и выглядел
// как отдельное дело, хотя он часть той же отправки.
//
// Запертый модуль читается целиком: закрыта не информация, а заказ. Вместо
// замка без выхода рядом стоит действие, которым он открывается, — отметка
// о состоявшемся разборе.

const props = defineProps({
  moduleId: { type: String, required: true },
  energy: { type: Object, required: true },
  locked: { type: Boolean, default: false },
})
defineEmits(['rate'])

const store = useMiniStore()

// Неизвестный модуль — ошибка сборки, а не состояние пользователя: паспорт
// в этом случае просто не рисуется, вместо падения на пустом объекте.
const mod = computed(() => MODULES[props.moduleId] || null)
const gain = computed(() => moduleGain(props.moduleId, props.energy))
const link = computed(() => bookingLink())

const tiles = computed(() => (!mod.value ? [] : [
  { label: 'Скорость', value: mod.value.speed },
  { label: 'Мощность', value: gain.value > 0 ? `+${gain.value}%` : '—' },
  { label: 'Расход', value: mod.value.price ? formatRub(mod.value.price) : 'на разборе' },
]))

const saved = ref(false)
const saveFailed = ref(false)

async function download() {
  saveFailed.value = false
  if (saveText(store.exportText(), store.exportFileName())) {
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
    return
  }
  try {
    await navigator.clipboard.writeText(store.exportText())
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch {
    saveFailed.value = true
  }
}
</script>

<template>
  <section v-if="mod">
    <h2 class="text-[1.25rem] font-bold leading-tight text-[var(--text)]">{{ mod.title }}</h2>
    <p class="mt-1 text-[0.875rem] leading-snug text-[var(--text-secondary)]">{{ mod.subtitle }}</p>

    <!-- Три плитки. Одинаковые у всех модулей: сравниваются глазами за секунду. -->
    <div class="mt-3 grid grid-cols-3 gap-2">
      <div
        v-for="t in tiles"
        :key="t.label"
        class="rounded-xl px-2.5 py-2"
        :style="{ background: 'var(--surface-2)' }"
      >
        <span class="block text-[0.625rem] uppercase tracking-wide text-[var(--text-muted)]">{{ t.label }}</span>
        <span class="mt-0.5 block text-[0.9375rem] font-bold tabular-nums text-[var(--text)]">{{ t.value }}</span>
      </div>
    </div>

    <!-- Спецификация строками. -->
    <dl class="mt-3 flex flex-col">
      <div class="flex items-baseline justify-between gap-3 border-b border-[var(--line)] py-2">
        <dt class="shrink-0 text-[0.8125rem] font-semibold text-[var(--text)]">Команда</dt>
        <dd class="text-right text-[0.8125rem] text-[var(--text-secondary)]">{{ mod.team }}</dd>
      </div>
      <div class="flex items-baseline justify-between gap-3 border-b border-[var(--line)] py-2">
        <dt class="shrink-0 text-[0.8125rem] font-semibold text-[var(--text)]">Приносите</dt>
        <dd class="text-right text-[0.8125rem] text-[var(--text-secondary)]">{{ mod.bring }}</dd>
      </div>
      <div class="flex items-baseline justify-between gap-3 py-2">
        <dt class="shrink-0 text-[0.8125rem] font-semibold text-[var(--text)]">Уносите</dt>
        <dd class="text-right text-[0.8125rem] text-[var(--text-secondary)]">{{ mod.take }}</dd>
      </div>
    </dl>

    <p v-if="mod.note" class="mt-1 text-[0.75rem] leading-snug text-[var(--text-muted)]">{{ mod.note }}</p>

    <!-- Заказ. Первый шаг — отправка данных: без них встречу назначать не на чем. -->
    <template v-if="!locked">
      <ol class="mt-4 flex flex-col gap-2">
        <li
          v-for="(step, i) in ORDER_STEPS"
          :key="i"
          class="flex gap-2.5 text-[0.8125rem] leading-snug text-[var(--text-secondary)]"
        >
          <span
            class="mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[0.625rem] font-bold"
            :style="{ background: 'var(--surface-2)', color: 'var(--text-muted)' }"
          >{{ i + 1 }}</span>
          {{ step }}
        </li>
      </ol>

      <ShareMonthButton class="mt-3" tone="accent" label="Отправить данные" />

      <button
        type="button"
        class="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-[var(--rim)] text-[0.9375rem] font-semibold text-[var(--text)]"
        :style="{ background: 'var(--surface)' }"
        @click="download"
      >
        <Check v-if="saved" class="h-5 w-5" :stroke-width="2.5" aria-hidden="true" />
        <Download v-else class="h-5 w-5" :stroke-width="2" aria-hidden="true" />
        {{ saved ? 'Готово' : 'Собрать файл' }}
      </button>
      <p v-if="saveFailed" class="mt-2 text-[0.8125rem] leading-snug" :style="{ color: 'var(--negative)' }">
        Браузер не дал сохранить файл и скопировать текст. Откройте приложение в Safari или Chrome.
      </p>

      <a
        :href="link.url"
        target="_blank"
        rel="noopener"
        class="mt-2 flex min-h-[44px] w-full items-center justify-center text-[0.875rem] font-medium"
        :style="{ color: 'var(--action)' }"
      >{{ link.kind === 'telegram' ? 'Написать в телеграм' : 'Открыть runscale.ru' }}</a>
    </template>

    <!-- Заперто: читается целиком, заказывается после первого разбора. -->
    <template v-else>
      <div class="mt-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5" :style="{ background: 'var(--surface-2)' }">
        <Lock class="h-[18px] w-[18px] shrink-0 text-[var(--text-muted)]" :stroke-width="2" aria-hidden="true" />
        <span class="text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
          Заказывается после первого разбора.
        </span>
      </div>
      <button
        type="button"
        class="mt-2 min-h-[48px] w-full rounded-full text-[0.9375rem] font-bold"
        :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
        @click="$emit('rate')"
      >Разбор уже был</button>
    </template>
  </section>
</template>
