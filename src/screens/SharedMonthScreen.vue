<script setup>
import { computed, ref } from 'vue'
import { Download, ArrowRight, Check } from 'lucide-vue-next'
import ConnectProgress from '../components/energy/ConnectProgress.vue'
import HonestBadge from '../components/HonestBadge.vue'
import StoryOnboarding from '../components/StoryOnboarding.vue'
import { HONEST_STORY } from '../i18n/stories.js'
import SiteFooter from '../components/SiteFooter.vue'
import { computeMini } from '../composables/miniModel.js'
import { computeEnergy, computeGaps } from '../composables/energyModel.js'
import { buildExportText, exportFileName } from '../composables/exportText.js'
import { saveText } from '../composables/saveFile.js'
import { formatRub, monthLabel, plural } from '../i18n/format.js'

// Месяц, пришедший ссылкой. Только чтение.
//
// Экран не трогает хранилище ни одной строкой: у открывшего ссылку может быть
// свой месяц, и подменить его чужим было бы худшим, что здесь можно сделать.
// Чужие данные живут в памяти вкладки и исчезают вместе с ней.
//
// Числа считаются тем же ядром, что у автора: расхождение между тем, что видит
// отправитель, и тем, что видит получатель, сделало бы ссылку бесполезной.

const props = defineProps({
  state: { type: Object, required: true },
})
defineEmits(['exit'])

const m = computed(() => computeMini(props.state, new Date()))
const energy = computed(() => computeEnergy(props.state, m.value))
// Ноль не показываем: расстояния нет, и строка о нём была бы шумом.
const visibleGaps = computed(() => computeGaps(m.value).filter((g) => g.value > 0))
function gapColor(tone) {
  if (tone === 'bad') return 'var(--negative)'
  if (tone === 'good') return 'var(--positive)'
  return 'var(--text-muted)'
}
const saved = ref(false)
const saveFailed = ref(false)

// Месяц мог закончиться до того, как ссылку открыли. У автора об этом сказано
// на его экране, и получатель обязан узнать то же: иначе он примет прогноз
// прошедшего месяца за ожидание.
const monthOver = computed(() => {
  const now = new Date()
  const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return String(props.state.month) < cur
})

const rows = computed(() => {
  const x = m.value
  if (!x) return []
  return [
    { label: 'Заработано', value: formatRub(x.realizedRev) },
    { label: monthOver.value ? 'Итог месяца' : 'Прогноз месяца', value: formatRub(x.landing) },
    {
      label: monthOver.value ? (x.remainTarget > 0 ? 'Недобор до плана' : 'План закрыт') : 'Осталось до плана',
      value: monthOver.value && x.remainTarget <= 0 ? 'да' : formatRub(x.remainTarget),
    },
    {
      label: 'Дней закрыто',
      value: `${x.realizedCount} из ${x.DIM}`,
    },
  ]
})

// Запасной путь тот же, что у остальных выгрузок приложения: в части браузеров
// и во встроенных окнах мессенджеров скачивание не срабатывает, и молчать
// об этом нельзя — человек ждёт файл.
async function download() {
  const text = buildExportText(props.state, m.value)
  if (saveText(text, exportFileName(props.state))) {
    saved.value = true
    saveFailed.value = false
    setTimeout(() => { saved.value = false }, 2500)
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    saved.value = true
    saveFailed.value = false
    setTimeout(() => { saved.value = false }, 2500)
  } catch {
    saveFailed.value = true
  }
}

// Сторис «Честная цифра» открывается и здесь: шильд без объяснения был бы
// украшением, а получателю ссылки статус числа важнее всего.
const honestOpen = ref(false)
</script>

<template>
  <div v-if="m" class="min-h-[100dvh] w-full bg-[var(--bg)]">
    <div
      class="mx-auto w-full max-w-[430px] px-4
             pl-[max(1rem,env(safe-area-inset-left))]
             pr-[max(1rem,env(safe-area-inset-right))]
             pt-[max(1rem,env(safe-area-inset-top))]
             pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <!-- Экран сообщает, чей это месяц и что он не сохраняется. Одной строкой:
           это состояние, а не объяснение устройства. -->
      <header class="pb-3">
        <p class="text-[0.6875rem] uppercase tracking-wide text-[var(--text-muted)]">
          Месяц по ссылке · только чтение
        </p>
        <h1 class="mt-1 text-[1.375rem] font-bold leading-tight text-[var(--text)]">
          {{ state.unit || state.company || 'Бизнес' }}, {{ monthLabel(state.month) }}
        </h1>
        <p class="mt-1 text-[0.8125rem] text-[var(--text-muted)]">
          Данные на этом устройстве не сохраняются.
        </p>
      </header>

      <p
        v-if="monthOver"
        class="mb-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-[0.8125rem] leading-snug text-[var(--text-secondary)]"
      >Этот месяц закончился. Числа ниже — его итог.</p>

      <ConnectProgress
        :unit="state.unit || state.company"
        :pct="energy.pct"
        :level-id="energy.level.id"
      />

      <!-- Статус чисел получателю нужнее, чем автору: он видит чужой месяц
           и обязан знать, на чём тот стоит, до того как поверит цифрам. -->
      <div class="mt-3">
        <HonestBadge @open="honestOpen = true" />
      </div>

      <section class="mt-3 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
        <dl class="flex flex-col">
          <div
            v-for="(r, i) in rows"
            :key="r.label"
            class="flex items-baseline justify-between gap-3 py-2"
            :class="i < rows.length - 1 ? 'border-b border-[var(--line)]' : ''"
          >
            <dt class="text-[0.875rem] text-[var(--text-secondary)]">{{ r.label }}</dt>
            <dd class="text-[0.9375rem] font-bold tabular-nums text-[var(--text)]">{{ r.value }}</dd>
          </div>
        </dl>
        <p class="mt-2 text-[0.75rem] leading-snug text-[var(--text-muted)]">
          {{ m.enteredCount }} {{ plural(m.enteredCount, 'день', 'дня', 'дней') }} с дневной выручкой.
          Числа со слов владельца.{{ monthOver ? '' : ' Приземление посчитано при неизменном темпе.' }}
        </p>
      </section>

      <!-- Расстояния между величинами. Получатель видит их тем же списком,
           что и автор в «Целях и планах»: карточек с уровнями сущностей
           больше нет ни у кого, и расходиться этим двум экранам нельзя. -->
      <ul v-if="visibleGaps.length" class="mt-3 flex flex-col gap-1.5">
        <li
          v-for="g in visibleGaps"
          :key="g.key"
          class="flex items-center justify-center gap-2 rounded-xl bg-[var(--surface)] px-3 py-2"
        >
          <span class="text-[0.75rem] text-[var(--text-muted)]">{{ g.label }}</span>
          <span class="text-[0.8125rem] font-bold tabular-nums" :style="{ color: gapColor(g.tone) }">
            {{ formatRub(g.value) }}
          </span>
        </li>
      </ul>

      <button
        type="button"
        class="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-[var(--rim)] text-[0.9375rem] font-semibold text-[var(--text)]"
        :style="{ background: 'var(--surface)' }"
        @click="download"
      >
        <Check v-if="saved" class="h-5 w-5" :stroke-width="2.5" aria-hidden="true" />
        <Download v-else class="h-5 w-5" :stroke-width="2" aria-hidden="true" />
        {{ saved ? 'Готово' : 'Скачать месяц файлом' }}
      </button>
      <p v-if="saveFailed" class="mt-2 text-[0.8125rem] leading-snug" :style="{ color: 'var(--negative)' }">
        Браузер не дал сохранить файл и скопировать текст. Откройте ссылку в Safari или Chrome.
      </p>

      <button
        type="button"
        class="mt-2 flex min-h-[48px] w-full items-center justify-between gap-2 rounded-full px-5 text-[0.9375rem] font-bold"
        :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
        @click="$emit('exit')"
      >
        Посчитать свой месяц
        <ArrowRight class="h-5 w-5 shrink-0" :stroke-width="2.5" aria-hidden="true" />
      </button>

      <SiteFooter />
      <StoryOnboarding
        :open="honestOpen"
        :slides="HONEST_STORY"
        @close="honestOpen = false"
        @done="honestOpen = false"
      />
    </div>
  </div>
</template>
