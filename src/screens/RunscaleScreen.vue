<script setup>
import { computed, ref } from 'vue'
import SiteFooter from '../components/SiteFooter.vue'
import CountersCard from '../components/CountersCard.vue'
import BottomSheet from '../components/BottomSheet.vue'
import ModulePassport from '../components/energy/ModulePassport.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { computeEnergy } from '../composables/energyModel.js'

// «Ранскейл» — показ работающей системы.
//
// Экран отвечает на один вопрос: как это работает на самом деле. Устройство
// перенесено из живого контура, а не пересказано по памяти: день от сдачи
// данных до сигнала, структура настоящего сигнала, правило тишины. Покупка
// здесь не живёт — цена и состав режима лежат в его паспорте на «Сигналах»,
// где стоит вся дорога; отсюда паспорт открывается кнопкой.
//
// Счётчики того, что уже сделано, идут с датой, на которую они верны:
// число без даты выглядит как сегодняшнее, и это самый простой способ
// соврать, не сказав ни слова неправды.

const emit = defineEmits(['go'])

const store = useMiniStore()
const energy = computed(() => computeEnergy(store.state, store.model.value))
const passportOpen = ref(false)

// День контура: такт, в котором живёт система. Перенос устройства,
// без внутренних имён и чисел клиентов.
const DAY = [
  { when: 'До утра', text: 'Приходят данные вчерашнего дня: выручка, гости, чеки.' },
  { when: 'Утро', text: 'Чекап: числа сводятся к одному основанию и проверяются. В потоке — три-пять в день.' },
  { when: 'К открытию', text: 'Управляющему уходит сигнал дня: планка, одно действие, чит-код.' },
  { when: 'Днём', text: 'Сводка сети: прогноз месяца, недобор, места по прогнозу.' },
  { when: 'Дважды в неделю', text: 'Разбор с командой: числа превращаются в решения, решения — в задачи с исполнителем и сроком.' },
]
</script>

<template>
  <div class="w-full px-4 pb-10">
    <!-- Заголовок ставит шапка приложения. Первая строка — сделка целиком. -->
    <header>
      <p class="text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
        Компания даёт данные — Ранскейл даёт точные сигналы вовремя.
        Из ядра этой системы собрано приложение, в котором вы сейчас.
      </p>
    </header>

    <div class="mt-5">
      <CountersCard caption />
    </div>

    <!-- Один день системы: откуда берётся сигнал. -->
    <section class="mt-4 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
      <h2 class="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Один день системы
      </h2>
      <ol class="mt-3 flex flex-col gap-3">
        <li v-for="step in DAY" :key="step.when" class="flex gap-2.5">
          <span class="w-[6.5rem] shrink-0 text-[0.75rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
            {{ step.when }}
          </span>
          <span class="min-w-0 text-[0.875rem] leading-snug text-[var(--text-secondary)]">{{ step.text }}</span>
        </li>
      </ol>
    </section>

    <!-- Образец сигнала: структура настоящего, числа условные. Показать
         устройство сильнее, чем описать его абстракцией. -->
    <section class="mt-4 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
      <div class="flex items-baseline justify-between gap-3">
        <h2 class="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
          Сигнал дня — образец
        </h2>
        <span class="shrink-0 text-[0.6875rem] text-[var(--text-muted)]">числа условные</span>
      </div>
      <div class="mt-3 rounded-xl bg-[var(--surface-2)] p-3">
        <p class="text-[0.875rem] font-semibold leading-snug text-[var(--text)]">
          Вторник 412 000 ₽ = 106 % плана дня — ваш лучший вторник за сезон.
        </p>
        <p class="mt-2 text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
          Взят обеими руками сразу: гостей 160 → 220 к прошлому вторнику,
          с гостя 1 000 → 1 200 ₽. Сегодня среда, надо 171 000 — цифру
          этого дня недели вы уже брали.
        </p>
        <p class="mt-2 text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
          <span class="font-bold text-[var(--text)]">Сегодня:</span>
          сумму первой покупки называет продавец и начинает с 1 500 ₽ —
          среду вы берёте суммой, а не потоком.
        </p>
        <p class="mt-2 text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
          <span class="font-bold text-[var(--text)]">Чит-код:</span>
          вчерашняя сумма с гостя на обычном потоке среды даёт 146 000 ₽ —
          больше любой вашей среды, без единого лишнего гостя.
        </p>
      </div>
    </section>

    <!-- Правило тишины — то, за что сигналам верят. -->
    <section class="mt-4 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
      <h2 class="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Правило тишины
      </h2>
      <p class="mt-2 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
        Сообщение, которое не меняет ничьё поведение, не отправляется вовсе.
        Сомнение решается в пользу молчания: пропущенный сигнал всплывёт
        завтра, выпущенный шум обесценивает соседний сигнал.
      </p>
    </section>

    <!-- Своя шкура: короче любого обещания. -->
    <section class="mt-4 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
      <h2 class="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Своя шкура
      </h2>
      <p class="mt-2 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
        Цифры своего бизнеса Ранскейл ведёт в этом же приложении.
      </p>
    </section>

    <!-- Паспорт режима — с ценой, сроком и месяцами. Покупка живёт
         на дороге, и вторая кнопка ведёт туда. -->
    <button
      type="button"
      class="mt-4 min-h-[48px] w-full rounded-full text-[0.9375rem] font-bold"
      :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      @click="passportOpen = true"
    >Состав режима</button>
    <button
      type="button"
      class="mt-2 min-h-[48px] w-full rounded-full border border-[var(--rim)] text-[0.9375rem] font-semibold text-[var(--text)]"
      @click="emit('go', 'power')"
    >Дорога к режиму</button>

    <SiteFooter />

    <BottomSheet :open="passportOpen" @close="passportOpen = false">
      <ModulePassport
        module-id="runscale"
        :energy="energy"
        :locked="true"
        @close="passportOpen = false"
      />
    </BottomSheet>
  </div>
</template>
