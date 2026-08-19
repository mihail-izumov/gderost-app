<script setup>
import { computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import CoefRows from './CoefRows.vue'
import { L } from '../../i18n/daily.js'
import { useMiniStore } from '../../composables/useMiniStore.js'
import { shapeName } from '../../data/weekShape.js'

// Дни недели: чем именно разносится остаток плана.
//
// Полоса нейтральная — это вес, а не сигнал. Метка на полосе показывает
// средний день: без неё непонятно, сильный день или слабый.
//
// Сами строки, подпись состояния и пересчёт живут в `CoefRows`: та же
// поправка раскрывается в блоке месяца на «Прогрессе». Здесь остаётся
// заголовок раздела и имя формы кнопкой.

const props = defineProps({ m: { type: Object, required: true } })
const emit = defineEmits(['tune'])

const store = useMiniStore()
const state = store.state

const title = computed(() => shapeName(state.coef_src, state.shape_id, state.shape_from))
</script>

<template>
  <section>
    <div class="mb-3 mt-4 flex items-center gap-3">
      <h2 class="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">{{ L.coef }}</h2>
      <!-- Имя текущей формы и есть вход в настройку: отдельная ссылка внизу
           заставляла искать её после того, как вопрос уже возник здесь. -->
      <button
        type="button"
        class="ml-auto inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-3 text-[0.8125rem] font-medium text-[var(--text)]"
        @click="emit('tune')"
      >
        {{ title }}
        <ChevronDown class="h-4 w-4 text-[var(--text-muted)]" :stroke-width="2" aria-hidden="true" />
      </button>
    </div>

    <!-- Строки, подпись и пересчёт — общий компонент: та же поправка стоит
         в блоке месяца на «Прогрессе», и две копии одних строк разошлись бы
         молча. -->
    <div class="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <CoefRows :m="m" @tune="emit('tune')" />
    </div>
  </section>
</template>
