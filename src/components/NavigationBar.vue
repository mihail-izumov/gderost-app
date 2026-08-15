<script setup>
import { ref } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'
import BusinessChip from './business/BusinessChip.vue'
import BottomSheet from './BottomSheet.vue'
import LiveClock from './LiveClock.vue'
import { useNavCaption } from '../composables/useNavCaption.js'
import { hardReload } from '../composables/useAppRefresh.js'

// Шапка навигации. Перенесена из рабочего Ранскейла вместе с правилами,
// которые там выстрадывались по одному.
//
// ⚠ Липкая полоса НЕ занимает места в потоке. Пока она умела расти с нуля
// до 44 пикселей, страница на пороге прокрутки дёргалась без остановки:
// полоса раскрывалась → содержимое уезжало вниз → `scrollTop` падал ниже
// порога → полоса схлопывалась → и так по кругу. Теперь полоса высотой ноль,
// а видимая панель лежит в ней `absolute` и появляется прозрачностью:
// высота потока не меняется никогда.
//
// Исключение — заход вглубь: там в полосе живёт кнопка «назад», она нужна
// всегда, и под неё отводится настоящая высота.
//
// Чип бизнеса и кнопка обновления стоят в потоке под полосой и уезжают вместе
// со страницей. Кнопка обновления — капсула с надписью в наборе чипа: круглая
// стрелка без подписи в приложении, где всё хранится на устройстве, читается
// как «стереть и начать заново».
//
// Крупный заголовок центрирован — сознательное отклонение от iOS-умолчания,
// перенесено как есть.

defineProps({
  title: { type: String, default: '' },
  collapsed: { type: Boolean, default: false },
  showBack: { type: Boolean, default: false },
  backLabel: { type: String, default: '' },
  leadingAction: { type: String, default: null }, // null | 'hardReload'
  // Подпись чипа бизнеса; пусто — чипа нет
  eyebrow: { type: String, default: null },
  eyebrowName: { type: String, default: '' },
  // Заголовком экрана стоит идущее время. Так подписан «Сегодня»: имя экрана
  // там ничего не добавляет к подписи в таб-баре, а дата и время отвечают
  // на его единственный вопрос — какой сейчас день.
  clockTitle: { type: Boolean, default: false },
  // Крупный заголовок в потоке. Экран может начинаться сразу с содержимого
  // и всё равно иметь имя в липкой полосе при прокрутке.
  bigTitle: { type: Boolean, default: true },
})
defineEmits(['back'])

const { caption } = useNavCaption()

// Обновление спрашивает. Кнопка чистила кэш и перезагружала страницу молча,
// и человек, задевший её пальцем, видел мигание без объяснения.
const updateOpen = ref(false)
</script>

<template>
  <header
    class="sticky top-0 z-20"
    :class="showBack ? 'pt-[env(safe-area-inset-top)]' : 'h-0'"
  >
    <div
      class="w-full pt-[env(safe-area-inset-top)] transition-opacity duration-200"
      :class="[
        showBack ? 'pt-0' : 'absolute inset-x-0 top-0',
        showBack || collapsed
          ? 'opacity-100 backdrop-blur bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] border-b border-[var(--line)]'
          : 'pointer-events-none opacity-0',
      ]"
    >
      <div class="grid h-11 w-full grid-cols-[minmax(2.75rem,1fr)_auto_minmax(2.75rem,1fr)] items-center">
        <div class="flex min-w-0 items-center justify-self-start pl-1">
          <button
            v-if="showBack"
            type="button"
            class="flex min-h-[44px] min-w-0 items-center gap-0.5 rounded-lg px-1 text-[var(--text)] active:bg-[var(--surface-2)]"
            @click="$emit('back')"
          >
            <ChevronLeft class="h-6 w-6 shrink-0" :stroke-width="2.25" />
            <span v-if="backLabel" class="truncate text-[1.0625rem] leading-none">{{ backLabel }}</span>
          </button>
          <div v-else class="min-h-[44px] min-w-[44px]" aria-hidden="true"></div>
        </div>

        <div
          data-test="nav-compact-title"
          class="pointer-events-none flex min-w-0 items-center justify-center px-2"
        >
          <LiveClock v-if="clockTitle" size="md" />
          <span v-else-if="title" class="truncate text-[1.0625rem] font-semibold text-[var(--text)]">{{ title }}</span>
        </div>

        <div class="min-h-[44px] min-w-[44px]" aria-hidden="true"></div>
      </div>
    </div>
  </header>

  <!-- Контекст экрана в потоке: чип бизнеса во всю доступную ширину
       и капсула обновления. -->
  <div
    v-if="!showBack && (eyebrow || leadingAction === 'hardReload')"
    class="flex items-center gap-2 px-3 pt-[env(safe-area-inset-top)]"
  >
    <div v-if="eyebrow" class="min-w-0 flex-1">
      <BusinessChip :label="eyebrow" :name="eyebrowName" full-width />
    </div>
    <div v-else class="flex-1" aria-hidden="true"></div>
    <button
      v-if="leadingAction === 'hardReload'"
      type="button"
      data-test="nav-hard-reload"
      class="flex h-[26px] shrink-0 items-center rounded-full border px-3 text-[0.6875rem] font-medium uppercase tracking-[0.18em]
             text-[var(--text-secondary)] active:bg-[var(--surface-2)]"
      :style="{ borderColor: 'var(--line)' }"
      aria-label="Обновить до последней версии"
      @click="updateOpen = true"
    >Обновить</button>
  </div>

  <!-- Крупный заголовок в потоке. Подпись — absolute НАД ним, чтобы h1
       не сдвигался и стоял на одном месте во всех разделах. -->
  <div v-if="bigTitle && (title || caption || clockTitle)" class="relative px-4 pb-3 pt-2 text-center">
    <p
      v-if="caption"
      class="pointer-events-none absolute inset-x-0 -top-2 text-[0.75rem] leading-none text-[var(--text-muted)]"
    >{{ caption }}</p>
    <LiveClock v-if="clockTitle" size="lg" />
    <h1 v-else-if="title" class="text-[2.125rem] font-bold leading-tight tracking-tight text-[var(--text)]">
      {{ title }}
    </h1>
  </div>

  <BottomSheet :open="updateOpen" @close="updateOpen = false">
    <div class="pb-2">
      <h2 class="text-[1.25rem] font-bold leading-tight text-[var(--text)]">Обновить до последней версии?</h2>
      <p class="mt-1.5 text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
        Данные сохранятся. Ранскейл станет полезнее.
      </p>
      <button
        type="button"
        class="mt-4 min-h-[52px] w-full rounded-2xl text-[1.0625rem] font-bold"
        :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
        @click="hardReload"
      >Обновить</button>
      <!-- Отказ — тоже кнопка: голый текст рядом с залитой кнопкой читается
           подписью, а не вторым выходом. -->
      <button
        type="button"
        class="mt-2 min-h-[52px] w-full rounded-2xl border text-[1.0625rem] font-semibold text-[var(--text)]"
        :style="{ borderColor: 'var(--rim)', background: 'var(--surface)' }"
        @click="updateOpen = false"
      >Оставить</button>
    </div>
  </BottomSheet>
</template>
