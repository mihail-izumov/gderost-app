<script setup>
import { computed, ref } from 'vue'
import HandIcon from '../icons/HandIcon.vue'
import HonestBadge from '../HonestBadge.vue'
import StoryOnboarding from '../StoryOnboarding.vue'
import { honestLoop } from '../../composables/honestLoop.js'
import { honestStory } from '../../i18n/stories.js'
import { formatRub, dayLabel } from '../../i18n/format.js'
import { moduleGain } from '../../composables/energyModel.js'
import { MODULES, ORDER_STEPS, RUNSCALE_MONTHS } from '../../i18n/energy.js'
import { useMiniStore } from '../../composables/useMiniStore.js'
import { monthCap } from '../../i18n/home.js'
import ShareMonthButton from '../ShareMonthButton.vue'
import StatusChip from '../StatusChip.vue'

// Паспорт модуля: услуга описана как устройство.
//
// Три плитки — скорость, мощность, расход — и спецификация строками.
// Мощность не написана словом, а посчитана на состоянии владельца: разбор
// поднимает план и цель до середины, значит на его паспорте стоит «+10%»,
// а у того, кто перепрыгнул ступень, число будет больше. Так лестница сверху
// и паспорт говорят на одном языке.
//
// Заказ живёт здесь же: отправка данных и есть заказ, и кнопка на это одна.
// Выгрузка файлом и ссылка на сайт стояли рядом как равные действия
// и растаскивали заказ на три; файл живёт на «Сегодня», где человек работает
// со своими данными.
//
// Запертый модуль читается целиком: закрыта не информация, а заказ. Выход
// из него — «Вернусь позже»: замок снимается состоявшейся сессией, а не
// нажатием в этом окне.

const props = defineProps({
  moduleId: { type: String, required: true },
  energy: { type: Object, required: true },
  locked: { type: Boolean, default: false },
  // Разбор уже оценён: тогда предлагать отметить его второй раз незачем.
  rated: { type: Boolean, default: false },
})
defineEmits(['rate', 'close'])

const store = useMiniStore()

// Неизвестный модуль — ошибка сборки, а не состояние пользователя: паспорт
// в этом случае просто не рисуется, вместо падения на пустом объекте.
const mod = computed(() => MODULES[props.moduleId] || null)
const gain = computed(() => moduleGain(props.moduleId, props.energy))
const sent = computed(() => store.state.requests.find((r) => r.module === props.moduleId) || null)

// ⚠ Что именно уедет с заявкой. Человек отправляет не «данные вообще»,
// а месяц ровно в том состоянии, в каком он сейчас: где-то со слов, где-то
// посчитанный, местами с дырами. Петля показывает это одной плашкой — и она
// же снимает вопрос, который иначе задают на самом разборе.
//
// Сторис открывается прямо отсюда и закрывается обратно СЮДА, а не на экран
// позади: человек шёл отправлять и обязан вернуться к кнопке, а не искать
// паспорт заново.
const loop = computed(() => honestLoop(store.state, store.model.value))
const honestOpen = ref(false)
const honestSlides = computed(() => honestStory(loop.value))

// «Приносите» называет конкретный месяц владельца, а не абстрактную ссылку.
const bring = computed(() => {
  const raw = mod.value ? mod.value.bring : ''
  const month = store.model.value ? monthCap(store.model.value.month) : 'Текущий месяц'
  return raw.replace('{МЕСЯЦ}', month)
})

const tiles = computed(() => (!mod.value ? [] : [
  { label: 'Скорость', value: mod.value.speed },
  { label: 'Мощность', value: gain.value > 0 ? `+${gain.value}%` : '—' },
  {
    label: 'Расход',
    value: mod.value.price
      ? formatRub(mod.value.price) + (mod.value.priceUnit ? ' / мес' : '')
      : 'на разборе',
  },
]))
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
        <dd class="text-right text-[0.8125rem] text-[var(--text-secondary)]">{{ bring }}</dd>
      </div>
      <div class="flex items-baseline justify-between gap-3 py-2" :class="mod.signals ? 'border-b border-[var(--line)]' : ''">
        <dt class="shrink-0 text-[0.8125rem] font-semibold text-[var(--text)]">Уносите</dt>
        <dd class="text-right text-[0.8125rem] text-[var(--text-secondary)]">{{ mod.take }}</dd>
      </div>
      <!-- Предмет торговли — сигналы: у каждой ступени названо, что она
           добавляет к каналу. -->
      <div v-if="mod.signals" class="flex items-baseline justify-between gap-3 py-2">
        <dt class="shrink-0 text-[0.8125rem] font-semibold text-[var(--text)]">Сигналы</dt>
        <dd class="text-right text-[0.8125rem] text-[var(--text-secondary)]">{{ mod.signals }}</dd>
      </div>
    </dl>

    <p v-if="mod.note" class="mt-1 text-[0.75rem] leading-snug text-[var(--text-muted)]">{{ mod.note }}</p>

    <!-- Режим — единственная ступень с месяцами: подписка живёт в этом
         паспорте целиком, второго экрана у неё нет. -->
    <ol v-if="moduleId === 'runscale'" class="mt-3 flex flex-col gap-2.5">
      <li v-for="(mo, i) in RUNSCALE_MONTHS" :key="mo.id" class="flex gap-2.5">
        <span
          class="mt-[1px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-bold"
          :style="{ background: 'var(--surface-2)', color: 'var(--text-muted)' }"
        >{{ i + 1 }}</span>
        <span class="min-w-0">
          <span class="block text-[0.875rem] font-semibold text-[var(--text)]">{{ mo.title }}</span>
          <span class="mt-0.5 block text-[0.8125rem] leading-snug text-[var(--text-secondary)]">{{ mo.text }}</span>
        </span>
      </li>
    </ol>

    <!-- Буткемп — единственная ступень, которая ставит числам последний
         статус. Здесь он показан чипом «✓ проверено» — тем же, что стоит
         у чисел в шторке происхождения: обещание продукта тем же языком,
         каким приложение подписывает числа. Плашка петли сюда не годится:
         петля — состояние месяца владельца, а не свойство продукта. -->
    <div
      v-if="moduleId === 'bootcamp'"
      class="mt-3 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
      :style="{ background: 'var(--surface-2)' }"
    >
      <span class="text-[0.8125rem] leading-snug text-[var(--text-secondary)]">Числа после сверки с кассой</span>
      <StatusChip kind="verified" />
    </div>

    <!-- Заказ. Первый шаг — отправка данных: без них встречу назначать не на чем. -->
    <template v-if="!locked">
      <!-- Заявка уже отправлена: человек вернулся в паспорт и обязан увидеть
           это первым, а не отправлять второй раз, не зная о первом. -->
      <p
        v-if="sent"
        class="mt-4 rounded-xl px-3 py-2.5 text-[0.8125rem] leading-snug"
        :style="{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }"
      >
        Заявка отправлена {{ dayLabel(sent.at) }}. Ждём ответа: подтверждение
        и ссылка на оплату придут от нас.
      </p>

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

      <!-- Отправка и есть заявка: отмечаем её в тот же момент, иначе для
           человека она исчезает вместе с закрывшимся листом «Поделиться».
           Кнопка здесь одна: выгрузка файлом и ссылка на сайт стояли рядом
           как равные и растаскивали действие на три. Файл живёт на «Сегодня»,
           где человек работает со своими данными. -->
      <!-- Состояние данных перед самой кнопкой: последнее, что человек видит
           до отправки, — то, что он отправляет. -->
      <div class="mt-4">
        <HonestBadge :loop="loop" large @open="honestOpen = true" />
      </div>

      <!-- ⚠ Кнопка синяя всегда и не спорит с плашкой над ней. Плашка меняет
           цвет вместе с состоянием петли — жёлтая, зелёная, — и если красить
           кнопку тем же, единственное действие экрана то сливалось бы с ней,
           то читалось вторым состоянием. Синий здесь означает действие
           и больше ничего.
           Слово «данные» с кнопки снято: что именно уходит, сказано плашкой
           выше словами и знаком. -->
      <ShareMonthButton
        class="mt-2"
        tone="action"
        :icon="false"
        :label="sent ? 'Отправить ещё раз' : 'Отправить на разбор'"
        @shared="store.addRequest(moduleId)"
      />

      <StoryOnboarding
        :open="honestOpen"
        :slides="honestSlides"
        @close="honestOpen = false"
        @done="honestOpen = false"
      />

      <!-- Кнопки «Разбор уже был» здесь больше нет. Самоотметка открывала замок
           нажатием и ничего не значила; оценка живёт в «Моих стартах» и только
           тогда, когда разбор действительно состоялся — это знает контур заявок,
           а не человек в паспорте. -->
    </template>

    <!-- Заперто: читается целиком, заказывается после первой сессии. -->
    <template v-else>
      <div class="mt-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5" :style="{ background: 'var(--surface-2)' }">
        <HandIcon class="h-[26px] w-[26px] shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
        <span class="text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
          {{ mod.lockNote || 'Будет доступно после разбора' }}
        </span>
      </div>
      <button
        type="button"
        class="mt-2 min-h-[48px] w-full rounded-full border border-[var(--rim)] text-[0.9375rem] font-semibold text-[var(--text)]"
        @click="$emit('close')"
      >Вернусь позже</button>
    </template>
  </section>
</template>
