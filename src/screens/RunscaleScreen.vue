<script setup>
import SiteFooter from '../components/SiteFooter.vue'
import CountersCard from '../components/CountersCard.vue'

// «Подписка» — витрина работающей системы. Не реклама и не описание планов:
// счётчики того, что уже сделано, с датой, на которую они верны.
//
// Ни одного числа без подписи. Число без даты выглядит как сегодняшнее,
// и это самый простой способ соврать, не сказав ни слова неправды.
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

    <section class="mt-4 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
      <h2 class="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Что стоит за счётчиками
      </h2>
      <dl class="mt-3 flex flex-col gap-3">
        <div>
          <dt class="text-[0.9375rem] font-semibold text-[var(--text)]">Чекап</dt>
          <dd class="mt-0.5 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
            Ежедневный осмотр бизнеса: выручка, поток, чек, дисциплина данных.
            Идёт непрерывно, его нельзя отменить или перенести.
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
        посчитанную по факту, а не принятую на веру, и расхождения, которые
        сами о себе не расскажут.
      </p>
      <p class="mt-2 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
        Прогноз и форма недели были в ваших данных всегда. Разница только в том,
        чем на них смотреть.
      </p>
    </section>
    <SiteFooter />
  </div>
</template>
