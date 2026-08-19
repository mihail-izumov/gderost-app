<script setup>
import { computed } from 'vue'
import { Clock, ChevronRight } from 'lucide-vue-next'
import { MODULES } from '../../i18n/energy.js'
import { dayLabel } from '../../i18n/format.js'

// «Мои старты» — второй режим ленты. Здесь то, что человек уже отправил,
// и то, с чего он может начать.
//
// Своих статусов приложение не выдумывает: подтверждение и ссылку на оплату
// присылает живой человек, и рисовать «на проверке» без связи с ним значило бы
// обещать движение, которого приложение не видит. Строка «ждём ответа»
// говорит правду и ничего сверх неё.
//
// Пусто — не пустой экран: здесь стоит блок первой ступени ростом с карточку
// ленты, чтобы переключатель не приводил в дырку. Из него открывается тот же
// паспорт, что и с карточки.
//
// Оценка разбора живёт ЗДЕСЬ и только тогда, когда разбор действительно
// состоялся. Отметить его самому больше нельзя: самоотметка открывала замок
// нажатием и ничего не значила. Признак `doneAt` ставит контур заявок —
// до его появления кнопка есть в коде и не показывается ни разу.

const props = defineProps({
  requests: { type: Array, default: () => [] },
})
defineEmits(['open', 'rate'])

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
    // Разбор состоялся — это знает только контур заявок.
    happened: r.module === 'razbor' && !!r.doneAt,
  })))

const razbor = MODULES.razbor
</script>

<template>
  <section>
    <ul v-if="rows.length" class="flex flex-col gap-2">
      <li v-for="r in rows" :key="r.id">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-2xl bg-[var(--surface)] p-3.5 text-left"
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

        <!-- Разбор состоялся: оценить его можно здесь и только здесь. -->
        <button
          v-if="r.happened"
          type="button"
          class="mt-1.5 min-h-[44px] w-full rounded-2xl bg-[var(--surface)] text-[0.9375rem] font-semibold"
          :style="{ color: 'var(--action)' }"
          @click="$emit('rate')"
        >Оценить разбор</button>
      </li>
    </ul>

    <!-- Ничего не отправлено: первая ступень стоит ростом с карточку ленты. -->
    <div
      v-else
      class="flex min-h-[11rem] flex-col items-center justify-center gap-1 rounded-2xl px-5 py-6 text-center"
      :style="{ background: 'var(--surface)' }"
    >
      <!-- Заголовком стоит то, что человек получит, а кнопка называет
           предмет. «Детали» — слово ни о чём: за ним может быть что угодно,
           и нажимают его от любопытства, а не за делом. -->
      <span class="block text-[1.0625rem] font-bold leading-tight text-[var(--text)]">{{ razbor.subtitle }}</span>
      <button
        type="button"
        class="mt-3 min-h-[44px] rounded-full px-6 text-[0.9375rem] font-bold"
        :style="{ background: 'var(--positive)', color: 'var(--ink-on-color)' }"
        @click="$emit('open', 'razbor')"
      >{{ razbor.title }}</button>
    </div>
  </section>
</template>
