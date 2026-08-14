<script setup>
import { computed } from 'vue'
import { Clock, ChevronRight } from 'lucide-vue-next'
import { MODULES } from '../../i18n/energy.js'
import { dayLabel } from '../../i18n/format.js'

// Мои заявки. Появляется, когда заявка есть, — до этого раздела нет.
//
// Сейчас здесь живёт ровно один факт: что и когда человек отправил. Своих
// статусов приложение не выдумывает: подтверждение и ссылку на оплату
// присылает живой человек, и рисовать «на проверке» без связи с ним значило бы
// обещать движение, которого приложение не видит. Строка «ждём ответа»
// говорит правду и ничего сверх неё.
//
// Когда появится контур заявок, статус приедет в ту же запись и встанет
// на место подписи — экран для этого уже устроен.

const props = defineProps({
  requests: { type: Array, default: () => [] },
})
defineEmits(['open'])

const rows = computed(() => props.requests
  .slice()
  .sort((a, b) => (a.at < b.at ? 1 : -1))
  .map((r) => ({
    id: r.id,
    module: r.module,
    title: (MODULES[r.module] || {}).title || r.module,
    at: r.at,
    // Статуса из контура ещё нет — стоит то, что известно наверняка.
    status: r.status || 'Отправлена',
    note: r.status ? '' : 'Ждём ответа: подтверждение и ссылка на оплату придут от нас',
  })))
</script>

<template>
  <section v-if="rows.length">
    <h2 class="mb-2 mt-5 text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
      Мои заявки
    </h2>

    <ul class="flex flex-col gap-2">
      <li v-for="r in rows" :key="r.id">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-3.5 text-left"
          @click="$emit('open', r.module)"
        >
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            :style="{ background: 'var(--surface-2)' }"
            aria-hidden="true"
          >
            <Clock class="h-[18px] w-[18px] text-[var(--text-muted)]" :stroke-width="2" />
          </span>

          <span class="min-w-0 flex-1">
            <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span class="text-[0.9375rem] font-bold text-[var(--text)]">{{ r.title }}</span>
              <span
                class="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.625rem]
                       font-medium uppercase tracking-wide"
                :style="{ background: 'var(--surface-2)', color: 'var(--text-muted)' }"
              >{{ r.status }}</span>
            </span>
            <span class="mt-0.5 block text-[0.75rem] leading-snug text-[var(--text-muted)]">
              {{ dayLabel(r.at) }}<template v-if="r.note"> · {{ r.note }}</template>
            </span>
          </span>

          <ChevronRight class="h-[18px] w-[18px] shrink-0 text-[var(--text-muted)]" :stroke-width="2.5" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </section>
</template>
