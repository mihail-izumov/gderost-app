<script setup>
import { computed, ref } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import GrowthProof from '../components/share/GrowthProof.vue'
import BrandLockup from '../components/BrandLockup.vue'
import HonestBadge from '../components/HonestBadge.vue'
import StoryOnboarding from '../components/StoryOnboarding.vue'
import { honestStory } from '../i18n/stories.js'
import SiteFooter from '../components/SiteFooter.vue'
import { computeMini } from '../composables/miniModel.js'
import { honestLoop } from '../composables/honestLoop.js'
import { computeGaps } from '../composables/energyModel.js'
import { buildExportText, exportFileName } from '../composables/exportText.js'
import { saveText } from '../composables/saveFile.js'
import { BRAND } from '../i18n/brand.js'
import { formatRub, monthLabel, monthName, plural } from '../i18n/format.js'

// Месяц, пришедший ссылкой. Только чтение.
//
// Экран не трогает хранилище ни одной строкой: у открывшего ссылку может быть
// свой месяц, и подменить его чужим было бы худшим, что здесь можно сделать.
// Чужие данные живут в памяти вкладки и исчезают вместе с ней.
//
// Числа считаются тем же ядром, что у автора: расхождение между тем, что видит
// отправитель, и тем, что видит получатель, сделало бы ссылку бесполезной.
//
// ⚠ Экран собран вокруг одного вопроса — как месяц идёт к плану. Плашки уровня
// с дорогой ступеней здесь больше нет: на экране, который человек прислал как
// доказательство своего роста, прайс поставщика висел у него на лбу, а чужая
// шкала в процентах требовала объяснения, которого получателю дать некому.
//
// ⚠ Суммы показываются только в полном режиме ссылки. В режиме роста их нет
// и в самом адресе: деньги нормализованы к плану перед упаковкой
// (`shareLink.js`), поэтому достать выручку из ссылки не может никто.

const props = defineProps({
  state: { type: Object, required: true },
  // Предпросмотр отправителя: подвал с обращением к получателю не показывается.
  // «Рост — это команда» и приглашение посчитать свой месяц адресованы тому,
  // кому ссылку прислали; отправителю на этом шаге они мешают увидеть главное.
  preview: { type: Boolean, default: false },
})
defineEmits(['exit'])

const m = computed(() => computeMini(props.state, new Date()))
// Полный режим: суммы, расстояния между величинами и выгрузка файлом.
// Ссылки, выпущенные до появления режима, читаются полными — такими они и были.
const full = computed(() => props.state.shareMode !== 'growth')
// Петля автора: получатель видит не только числа, но и то, крутится ли
// у отправителя цикл, которым они получены.
const loop = computed(() => honestLoop(props.state, m.value))
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
const nowMonth = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
})
const monthOver = computed(() => String(props.state.month) < nowMonth.value)

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
      <!-- Марка и бизнес разведены по весу. Имя юнита у владельца может
           совпасть с маркой того, кто считал, и заголовок читался как «месяц
           компании Ранскеил». Мелкой строкой — кто считал, заголовком — чей
           это месяц. -->
      <header class="pb-3">
        <BrandLockup size="1.25rem" class="mb-2" />
        <h1 class="mt-1 text-[1.375rem] font-bold leading-tight text-[var(--text)]">
          {{ state.unit || state.company || 'Бизнес' }}, {{ monthLabel(state.month) }}
        </h1>
        <!-- Строки о приватности здесь нет. «Только чтение» экран сообщает сам —
             полей на нём не существует, а «ничего не сохраняем» отвечает
             на тревогу отправителя, которой у читателя не возникало. -->
      </header>

      <p
        v-if="monthOver"
        class="mb-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-[0.8125rem] leading-snug text-[var(--text-secondary)]"
      >Этот месяц закончился. Числа ниже — его итог.</p>

      <GrowthProof :m="m" :month-over="monthOver" />

      <!-- Статус чисел стоит сразу под главным числом: получатель видит чужой
           месяц и обязан знать, на чём тот стоит, до того как поверит проценту.
           Здесь эта плашка и есть гарантия — она отличает посчитанное от
           набранного в заметках. -->
      <div class="mt-3">
        <HonestBadge large foreign :loop="loop" @open="honestOpen = true" />
      </div>

      <section v-if="full" class="mt-3 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
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
      <ul v-if="full && visibleGaps.length" class="mt-3 flex flex-col gap-1.5">
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

      <!-- Файл живёт только в полном режиме. В режиме роста выгружать нечего:
           сумм в ссылке нет, и файл с условными величинами был бы обманом. -->
      <!-- Форма кнопки та же, что на «Сегодня»: одно действие — один вид
           во всём приложении. Заливка светлая: здесь это не главное действие
           страницы, главное стоит внизу. -->
      <button
        v-if="full"
        type="button"
        class="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[1.0625rem] font-semibold"
        :style="{ background: 'var(--graphite)', color: 'var(--ink-on-color)' }"
        @click="download"
      >
        {{ saved ? 'Готово' : 'Скачать' }}
        <span
          class="rounded px-1.5 py-0.5 text-[0.6875rem] font-semibold"
          :style="{ background: 'var(--ink-on-color)', color: 'var(--graphite)' }"
        >MD</span>
      </button>
      <p v-if="full && saveFailed" class="mt-2 text-[0.8125rem] leading-snug" :style="{ color: 'var(--negative)' }">
        Браузер не дал сохранить файл и скопировать текст. Откройте ссылку в Safari или Chrome.
      </p>

      <!-- Действие стоит в подвале, между утверждением и рефреном: человек
           дочитал чужой месяц до конца, и здесь ему предлагают свой. Кнопка
           по ширине текста — она отвечает на вопрос, который у читателя уже
           возник, и занимать всю строку ей незачем. -->
      <SiteFooter v-if="!preview">
        <button
          type="button"
          class="inline-flex min-h-[48px] items-center gap-2 rounded-full px-6 text-[0.9375rem] font-bold"
          :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
          @click="$emit('exit')"
        >
          {{ BRAND.cta(monthName(nowMonth)) }}
          <ArrowRight class="h-5 w-5 shrink-0" :stroke-width="2.5" aria-hidden="true" />
        </button>
      </SiteFooter>
      <StoryOnboarding
        :open="honestOpen"
        :slides="honestStory(loop)"
        @close="honestOpen = false"
        @done="honestOpen = false"
      />
    </div>
  </div>
</template>
