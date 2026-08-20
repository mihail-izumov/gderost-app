<script setup>
import { computed } from 'vue'
import { logoStyle } from '../composables/brandMask.js'
import { BRAND } from '../i18n/brand.js'
import { SHOWCASE, fill } from '../i18n/onboarding.js'
import { TRACK } from '../data/runscaleCounters.js'

// «Где Рост» — единственное место витрины, где разрешено объяснять.
//
// Экран сообщает, шторка отвечает по запросу. Вопрос «кто это считает»
// возникает у самой кнопки внизу входа — там она и открывается.
//
// Модуль роста живёт здесь, а не в подвале входа. Два незнакомых имени
// на витрине делят доверие пополам, раскачивать нужно одно — Ранскеил.
// Формула «Работает на технологиях» отдаёт Модулю роста роль технологии,
// и ссылка на runscale.ru отсюда контекстна: человек не теряет приложение.
//
// Строка «цифры, а не слова» построена как «не X, а Y» — конструкция,
// запрещённая в проекте. Здесь исключение сделано осознанно и записано
// решением: витрина противопоставляет цифру слову, и это ровно то, что
// продукт продаёт. Следующему агенту чинить её молча не нужно.
//
// Подлежащее в ней — цифры, не бизнесы. С «бизнесы растут на цифрах,
// а не словах» вторая часть теряла парный предлог и фраза хромала; когда
// подлежащим становятся цифры, «слова» встают в тот же падеж сами.
//
// Всё выключено по центру: шторка короткая, читается одним взглядом,
// и левый край, за который цепляется глаз в списке, здесь только раскачивал
// бы три коротких блока по разным осям.
//
// Дата среза стоит внизу и обязана стоять: пока телеметрия не считает число
// сама, оно «со слов», и пометка об этом от него на один тап. Снимается
// только вместе с работающим автообновлением.

defineEmits(['close'])

const logo = logoStyle(22)

const asOf = computed(() => {
  const [y, m, d] = TRACK.asOf.split('-')
  return `${d}.${m}.${y}`
})
</script>

<template>
  <section class="pb-1 text-center">
    <h2 class="text-[1.375rem] font-bold leading-tight text-[var(--text)]">
      {{ BRAND.question }}
    </h2>

    <p class="mt-3 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
      {{ SHOWCASE.whatWeDo }}
    </p>
    <p class="mt-3 text-[0.9375rem] font-semibold leading-relaxed text-[var(--text)]">
      {{ SHOWCASE.proof }}
    </p>

    <!-- Знак системы. Обёртка добирает тач-таргет до 44pt: сам знак 22px
         высотой. rel="noopener noreferrer" обязателен при target="_blank" —
         иначе открытая страница получает доступ к window.opener. -->
    <div class="mt-4 flex flex-col items-center rounded-2xl bg-[var(--surface)] px-4 py-3">
      <p class="text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
        {{ SHOWCASE.poweredBy }}
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

    <p class="mt-3 text-[0.75rem] leading-snug text-[var(--text-muted)]">
      {{ fill(SHOWCASE.countAsOf, '{дата}', asOf) }}
    </p>

    <button
      type="button"
      class="mt-4 min-h-[52px] w-full rounded-full text-[1.0625rem] font-bold"
      :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      @click="$emit('close')"
    >{{ SHOWCASE.close }}</button>
  </section>
</template>
