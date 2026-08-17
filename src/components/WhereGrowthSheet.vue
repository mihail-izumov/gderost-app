<script setup>
import { logoStyle } from '../composables/brandMask.js'
import { BRAND } from '../i18n/brand.js'

// «Где Рост» — единственное место витрины, где разрешено объяснять.
//
// Экран сообщает, шторка отвечает по запросу. Вопрос «кто это считает»
// возникает у самой кнопки внизу входа — там она и открывается.
//
// Модуль роста живёт здесь, а не в подвале входа. Два незнакомых имени
// на витрине делят доверие пополам, раскачивать нужно одно — Ранскейл.
// Формула «Работает на технологиях» отдаёт Модулю роста роль технологии,
// и ссылка на runscale.ru отсюда контекстна: человек не теряет приложение.
//
// Строка «на цифрах, а не словах» построена как «не X, а Y» — конструкция,
// запрещённая в проекте. Здесь исключение сделано осознанно и записано
// решением: витрина противопоставляет цифру слову, и это ровно то, что
// продукт продаёт. Следующему агенту чинить её молча не нужно.
//
// Всё выключено по центру: шторка короткая, читается одним взглядом,
// и левый край, за который цепляется глаз в списке, здесь только раскачивал
// бы три коротких блока по разным осям.

defineEmits(['close'])

const logo = logoStyle(22)
</script>

<template>
  <section class="pb-1 text-center">
    <h2 class="text-[1.375rem] font-bold leading-tight text-[var(--text)]">
      {{ BRAND.question }}
    </h2>

    <p class="mt-3 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
      Ранскейл анализирует динамику каждого дня и показывает, как закроется план.
    </p>
    <p class="mt-3 text-[0.9375rem] font-semibold leading-relaxed text-[var(--text)]">
      Бизнесы в Треке растут<br>на цифрах, а не словах.
    </p>

    <!-- Знак системы. Обёртка добирает тач-таргет до 44pt: сам знак 22px
         высотой. rel="noopener noreferrer" обязателен при target="_blank" —
         иначе открытая страница получает доступ к window.opener. -->
    <div class="mt-4 flex flex-col items-center rounded-2xl bg-[var(--surface)] px-4 py-3">
      <p class="text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
        Работает на технологиях
      </p>
      <a
        :href="BRAND.siteUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex min-h-[44px] items-center justify-center active:opacity-70"
        :aria-label="BRAND.siteLabel"
      >
        <span class="block bg-[var(--text)]" :style="logo" aria-hidden="true" />
      </a>
    </div>

    <button
      type="button"
      class="mt-4 min-h-[52px] w-full rounded-full text-[1.0625rem] font-bold"
      :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      @click="$emit('close')"
    >Супер!</button>
  </section>
</template>
