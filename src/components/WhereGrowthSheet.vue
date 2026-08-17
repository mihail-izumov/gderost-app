<script setup>
import { computed } from 'vue'
import { logoStyle } from '../composables/brandMask.js'
import { BRAND } from '../i18n/brand.js'
import { TRACK } from '../data/runscaleCounters.js'
import { formatInt, plural } from '../i18n/format.js'

// «Где Рост» — единственное место витрины, где разрешено объяснять.
//
// Экран сообщает, шторка отвечает по запросу. Вопрос «кто это считает
// и что за число на кнопке» возникает у самой кнопки — там и открывается.
//
// Модуль роста живёт здесь, а не в подвале входа. Два незнакомых имени
// на витрине делят доверие пополам, раскачивать нужно одно — Ранскейл.
// Формула «Работает на технологиях» отдаёт Модулю роста роль технологии,
// и ссылка на runscale.ru отсюда контекстна: человек не теряет приложение.
//
// Строка «растут не на словах, а на цифрах» построена как «не X, а Y» —
// конструкция, запрещённая в проекте. Здесь исключение сделано осознанно
// и записано решением: витрина противопоставляет цифру слову, и это ровно
// то, что продукт продаёт. Следующему агенту чинить её молча не нужно.

defineEmits(['close'])

const logo = logoStyle(22)

const asOf = computed(() => {
  const [y, m, d] = TRACK.asOf.split('-')
  return `${d}.${m}.${y}`
})

const countLine = computed(() =>
  `${formatInt(TRACK.businesses)} ${plural(TRACK.businesses, ...TRACK.forms)} ${TRACK.tail}`)
</script>

<template>
  <section class="pb-1">
    <h2 class="text-[1.375rem] font-bold leading-tight text-[var(--text)]">
      {{ BRAND.question }}
    </h2>

    <p class="mt-3 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
      Ранскейл анализирует динамику каждого дня и показывает, как закроется план.
    </p>
    <p class="mt-2 text-[0.9375rem] font-semibold leading-relaxed text-[var(--text)]">
      Бизнесы на Треке растут не на словах, а на цифрах.
    </p>

    <!-- Знак системы. Обёртка добирает тач-таргет до 44pt: сам знак 22px
         высотой. rel="noopener noreferrer" обязателен при target="_blank" —
         иначе открытая страница получает доступ к window.opener. -->
    <div class="mt-4 rounded-2xl bg-[var(--surface)] p-4">
      <p class="text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
        Работает на технологиях
      </p>
      <a
        :href="BRAND.siteUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-1 inline-flex min-h-[44px] items-center active:opacity-70"
        :aria-label="BRAND.siteLabel"
      >
        <span class="block bg-[var(--text)]" :style="logo" aria-hidden="true" />
      </a>
    </div>

    <!-- Дата среза стоит здесь, а не на кнопке: число на витрине читается
         без служебной подписи, а основание от него на один тап. Пока
         телеметрия не считает это сама, строка обязательна. -->
    <p class="mt-3 text-[0.75rem] leading-snug text-[var(--text-muted)]">
      {{ countLine }} — на {{ asOf }}, обновляется вручную.
    </p>

    <button
      type="button"
      class="mt-4 min-h-[52px] w-full rounded-full text-[1.0625rem] font-bold"
      :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      @click="$emit('close')"
    >Супер!</button>
  </section>
</template>
