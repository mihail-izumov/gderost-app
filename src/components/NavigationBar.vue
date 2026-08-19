<script setup>
import { computed, ref } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'
import BusinessChip from './business/BusinessChip.vue'
import BottomSheet from './BottomSheet.vue'
import LiveClock from './LiveClock.vue'
import { useNavCaption } from '../composables/useNavCaption.js'
import { useAppRefresh } from '../composables/useAppRefresh.js'

// Шапка навигации. Перенесена из рабочего Ранскеила вместе с правилами,
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

const props = defineProps({
  title: { type: String, default: '' },
  collapsed: { type: Boolean, default: false },
  showBack: { type: Boolean, default: false },
  backLabel: { type: String, default: '' },
  leadingAction: { type: String, default: null }, // null | 'update'
  // Подпись чипа бизнеса; пусто — чипа нет
  eyebrow: { type: String, default: null },
  eyebrowName: { type: String, default: '' },
  // Компания над юнитом в раскрытом списке.
  eyebrowCompany: { type: String, default: '' },
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

// Строка контекста — чип бизнеса и капсула обновления. Она же добирает
// безопасную зону сверху; там, где её нет, зону добирает сам заголовок.
const hasContextRow = computed(() => !props.showBack
  && (!!props.eyebrow || props.leadingAction === 'update'))

// Обновление спрашивает. Кнопка чистила кэш и перезагружала страницу молча,
// и человек, задевший её пальцем, видел мигание без объяснения.
//
// В шторке два разных действия, и порядок в ней — по частоте, а не по силе.
// Сверху обычное обновление: оно проверяет версию и обычно занимает секунду.
// Снизу отдельной строкой аварийный сброс — на случай, когда обновление
// не помогло и приложение держит старую оболочку. Ход работы показывает
// панель оболочки, поэтому шторка закрывается сразу.
const updateOpen = ref(false)
const { refresh, hardReload } = useAppRefresh()

function startRefresh() {
  updateOpen.value = false
  refresh()
}
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
    v-if="!showBack && (eyebrow || leadingAction === 'update')"
    class="flex items-center gap-2 px-3 pt-[env(safe-area-inset-top)]"
  >
    <div v-if="eyebrow" class="min-w-0 flex-1">
      <BusinessChip :label="eyebrow" :name="eyebrowName" :company="eyebrowCompany" full-width />
    </div>
    <div v-else class="flex-1" aria-hidden="true"></div>
    <button
      v-if="leadingAction === 'update'"
      type="button"
      data-test="nav-update"
      class="font-label flex h-[26px] shrink-0 items-center justify-center rounded-full border px-3 text-[0.75rem] uppercase
             text-[var(--text-secondary)] active:bg-[var(--surface-2)]"
      :style="{ borderColor: 'var(--line)', '--caps-track': '0.12em' }"
      aria-label="Обновить Трек до последней версии"
      @click="updateOpen = true"
    ><span class="gr-caps">Обновить Трек</span></button>
  </div>

  <!-- Крупный заголовок в потоке. Подпись — absolute НАД ним, чтобы h1
       не сдвигался и стоял на одном месте во всех разделах.

       Безопасную зону сверху добирает строка контекста — чип бизнеса
       и капсула обновления. Там, где её нет (раздел без своего юнита),
       заголовок оказывался под статус-баром: зону приходится добирать
       здесь. Отступ тот же, поэтому заголовок стоит на одной высоте
       во всех разделах. -->
  <div
    v-if="bigTitle && (title || caption || clockTitle)"
    class="relative px-4 pb-3 text-center"
    :class="showBack ? 'pt-9' : hasContextRow ? 'pt-2' : 'pt-[calc(env(safe-area-inset-top)+1.125rem)]'"
  >
    <!-- ⚠ На заходе вглубь подпись пряталась под липкой полосой: она стоит
         `absolute` над заголовком, а полоса с кнопкой «назад» там занимает
         настоящую высоту. Отступ сверху отводит подписи её место — и на заходе
         вглубь подпись живёт ВНУТРИ этого отступа, а не над ним: отрицательный
         `top` уводил её ровно под полосу, из-за чего строка «данные от…»
         читалась наполовину. -->
    <p
      v-if="caption"
      class="pointer-events-none absolute inset-x-0 text-[0.75rem] leading-none text-[var(--text-muted)]"
      :class="showBack ? 'top-3' : '-top-2'"
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
        Данные сохранятся. Ранскеил станет полезнее.
      </p>
      <button
        type="button"
        data-test="update-soft"
        class="mt-4 min-h-[52px] w-full rounded-2xl text-[1.0625rem] font-bold"
        :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
        @click="startRefresh"
      >Обновить Трек</button>
      <!-- Отказ — тоже кнопка: голый текст рядом с залитой кнопкой читается
           подписью, а не вторым выходом. -->
      <button
        type="button"
        class="mt-2 min-h-[52px] w-full rounded-2xl border text-[1.0625rem] font-semibold text-[var(--text)]"
        :style="{ borderColor: 'var(--rim)', background: 'var(--surface)' }"
        @click="updateOpen = false"
      >Оставить</button>
      <!-- Аварийный выход. Стоит ниже отказа и набран мельче: он дороже
           обычного обновления — приложение грузится заново целиком, — и нужен
           один раз из ста. Название говорит, когда его брать. -->
      <button
        type="button"
        data-test="update-hard"
        class="mt-3 min-h-[44px] w-full text-[0.8125rem] text-[var(--text-muted)] underline underline-offset-4"
        @click="hardReload"
      >Не помогло — загрузить заново</button>
    </div>
  </BottomSheet>
</template>
