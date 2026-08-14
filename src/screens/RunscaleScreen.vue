<script setup>
import { computed, ref } from 'vue'
import SiteFooter from '../components/SiteFooter.vue'
import CountersCard from '../components/CountersCard.vue'
import BottomSheet from '../components/BottomSheet.vue'
import ModulePassport from '../components/energy/ModulePassport.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { computeEnergy } from '../composables/energyModel.js'
import { RUNSCALE_MONTHS, RUNSCALE_SPEC } from '../i18n/energy.js'

// «Подписка» — витрина работающей системы и последняя ступень дороги.
//
// Счётчики того, что уже сделано, с датой, на которую они верны: ни одного
// числа без подписи. Число без даты выглядит как сегодняшнее, и это самый
// простой способ соврать, не сказав ни слова неправды.
//
// Условия покупки стоят здесь же. Экран, который рассказывает про режим
// и молчит о цене, оставляет человека с одним способом её узнать — спросить,
// а спрашивать цену неудобно ровно тем, кто её потянет.

const store = useMiniStore()
const energy = computed(() => computeEnergy(store.state, store.model.value))
const passportOpen = ref(false)
</script>

<template>
  <div class="w-full px-4 pb-10">
    <!-- Заголовок ставит шапка приложения: второй такой же в потоке — дубль. -->
    <header>
      <p class="text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
        Система, из ядра которой собрано это приложение. Здесь она работает
        на полных данных — на собственном сборе, с проверками и живыми встречами.
      </p>
    </header>

    <div class="mt-5">
      <CountersCard caption />
    </div>

    <!-- Условия одной спецификацией, в том же виде, что в паспортах ступеней. -->
    <section class="mt-4 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
      <dl class="flex flex-col">
        <div
          v-for="(s, i) in RUNSCALE_SPEC"
          :key="s.label"
          class="flex items-baseline justify-between gap-3 py-2"
          :class="i < RUNSCALE_SPEC.length - 1 ? 'border-b border-[var(--line)]' : ''"
        >
          <dt class="shrink-0 text-[0.8125rem] font-semibold text-[var(--text)]">{{ s.label }}</dt>
          <dd class="text-right text-[0.8125rem] text-[var(--text-secondary)]">{{ s.value }}</dd>
        </div>
      </dl>
    </section>

    <section class="mt-4 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
      <h2 class="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Что происходит по месяцам
      </h2>
      <ol class="mt-3 flex flex-col gap-3">
        <li v-for="(mo, i) in RUNSCALE_MONTHS" :key="mo.id" class="flex gap-2.5">
          <span
            class="mt-[1px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full
                   text-[0.6875rem] font-bold"
            :style="{ background: 'var(--surface-2)', color: 'var(--text-muted)' }"
          >{{ i + 1 }}</span>
          <span class="min-w-0">
            <span class="block text-[0.9375rem] font-semibold text-[var(--text)]">{{ mo.title }}</span>
            <span class="mt-0.5 block text-[0.875rem] leading-snug text-[var(--text-secondary)]">{{ mo.text }}</span>
          </span>
        </li>
      </ol>
    </section>

    <section class="mt-4 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
      <h2 class="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Что стоит за счётчиками
      </h2>
      <dl class="mt-3 flex flex-col gap-3">
        <div>
          <dt class="text-[0.9375rem] font-semibold text-[var(--text)]">Чекап</dt>
          <dd class="mt-0.5 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
            Осмотр по свежим данным: выручка, поток, чек, дисциплина сдачи.
            В работающем контуре их идёт три-пять в день.
          </dd>
        </div>
        <div>
          <dt class="text-[0.9375rem] font-semibold text-[var(--text)]">Сигнал</dt>
          <dd class="mt-0.5 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
            Итог чекапа, когда нужно внимание: названа причина и названо действие.
            Без причины и действия сообщение не отправляется вовсе.
          </dd>
        </div>
        <div>
          <dt class="text-[0.9375rem] font-semibold text-[var(--text)]">Разбор</dt>
          <dd class="mt-0.5 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
            Живая встреча с командой, где числа превращаются в решения,
            а решения — в задачи с исполнителем и сроком.
          </dd>
        </div>
      </dl>
    </section>

    <section class="mt-4 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
      <h2 class="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Чем это отличается от приложения
      </h2>
      <p class="mt-2 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
        Приложение считает на том, что вы знаете. Полная система проверяет то,
        что вы вводите, и показывает то, чего вы не видите: форму вашей недели,
        посчитанную по факту, и расхождения, которые сами о себе не расскажут.
      </p>
    </section>

    <!-- Вход в состав: дочитавший до конца упирался в подвал. -->
    <button
      type="button"
      class="mt-4 min-h-[48px] w-full rounded-full text-[0.9375rem] font-bold"
      :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      @click="passportOpen = true"
    >Состав режима</button>

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
