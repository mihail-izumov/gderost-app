<script setup>
import { ref } from 'vue'
import { ChevronLeft, RotateCw } from 'lucide-vue-next'
import BusinessChip from './business/BusinessChip.vue'
import BottomSheet from './BottomSheet.vue'
import LiveClock from './LiveClock.vue'
import { useNavCaption } from '../composables/useNavCaption.js'
import { hardReload } from '../composables/useAppRefresh.js'

// Шапка навигации. Перенесена из рабочего Ранскейла вместе с правилами,
// которые там выстрадывались по одному.
//
// Устройство: липкая полоса сверху держит только то, что обязано быть видно
// всегда, — возврат назад и компактный заголовок экрана, проявляющийся при
// прокрутке. Всё остальное живёт в потоке страницы и уезжает вместе с ней.
//
// Чип бизнеса и перезагрузка уехали из липкой полосы в поток (правка Михаила
// 15.08). Причина: прилепленные к верху, они забирали место у заголовка экрана,
// и при прокрутке в шапке стояли три разные вещи сразу. Теперь при прокрутке
// в липкой полосе появляется по центру имя экрана — одинаково на всех разделах.
// Чип занял освободившуюся ширину до кнопки перезагрузки: имя юнита длиннее
// тринадцати знаков обрезалось на ровном месте.
//
// Три колонки, центральная — `auto`: заголовок занимает свою ширину и стоит
// ровно по центру, потому что боковые `minmax(2.75rem, 1fr)` делят остаток
// поровну. На узком экране сжимается подпись «Назад», а не заголовок;
// 2.75rem = 44pt тач-таргета боковым слотам гарантированы.
//
// Стекло и фон появляются ТОЛЬКО при collapsed: на самом верху шапка
// полностью прозрачна, иначе невидимый слой размытия размывает подпись.
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
})
defineEmits(['back'])

const { caption } = useNavCaption()

// Обновление спрашивает. Кнопка чистила кэш и перезагружала страницу молча,
// и человек, задевший её пальцем, видел мигание без объяснения. Спросить —
// одно касание; сказать, что данные при этом целы, — обязанность: кнопка
// со стрелкой в приложении, где всё хранится на устройстве, читается
// как «стереть и начать заново».
const updateOpen = ref(false)
</script>

<template>
  <header
    class="sticky top-0 z-20 pt-[env(safe-area-inset-top)] transition-colors duration-200"
    :class="collapsed
      ? 'backdrop-blur bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] border-b border-[var(--line)]'
      : 'bg-transparent border-b border-transparent'"
  >
    <!-- Полоса раскрывается только когда ей есть что держать: возврат назад
         или компактный заголовок при прокрутке. Пустые 44 пикселя над экраном
         читались дыркой от верхнего края. -->
    <div
      class="grid w-full grid-cols-[minmax(2.75rem,1fr)_auto_minmax(2.75rem,1fr)] items-center overflow-hidden transition-[height] duration-200"
      :class="showBack || collapsed ? 'h-11' : 'h-0'"
    >
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
        v-if="title || clockTitle"
        data-test="nav-compact-title"
        class="pointer-events-none flex min-w-0 items-center justify-center px-2 transition-opacity duration-200"
        :class="collapsed ? 'opacity-100' : 'opacity-0'"
      >
        <LiveClock v-if="clockTitle" size="md" />
        <span v-else class="truncate text-[1.0625rem] font-semibold text-[var(--text)]">{{ title }}</span>
      </div>
      <!-- заглушка центральной колонки: без неё правый слот съезжает в центр -->
      <div v-else aria-hidden="true"></div>

      <div class="min-h-[44px] min-w-[44px]" aria-hidden="true"></div>
    </div>
  </header>

  <!-- Контекст экрана в потоке: чип бизнеса во всю ширину до кнопки обновления. -->
  <div v-if="!showBack && (eyebrow || leadingAction === 'hardReload')" class="flex items-center gap-1 px-3">
    <div v-if="eyebrow" class="min-w-0 flex-1">
      <BusinessChip :label="eyebrow" :name="eyebrowName" full-width />
    </div>
    <div v-else class="flex-1" aria-hidden="true"></div>
    <button
      v-if="leadingAction === 'hardReload'"
      type="button"
      data-test="nav-hard-reload"
      class="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-[var(--text)] active:bg-[var(--surface-2)]"
      aria-label="Обновить до последней версии"
      title="Обновить до последней версии"
      @click="updateOpen = true"
    >
      <RotateCw class="h-5 w-5" :stroke-width="2" />
    </button>
  </div>

  <!-- Крупный заголовок в потоке. Подпись — absolute НАД ним, чтобы h1
       не сдвигался и стоял на одном месте во всех разделах. -->
  <div v-if="title || caption || clockTitle" class="relative px-4 pb-3 pt-2 text-center">
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
      <button
        type="button"
        class="mt-2 min-h-[52px] w-full rounded-2xl text-[1.0625rem] font-semibold text-[var(--text-secondary)]"
        @click="updateOpen = false"
      >Оставить</button>
    </div>
  </BottomSheet>
</template>
