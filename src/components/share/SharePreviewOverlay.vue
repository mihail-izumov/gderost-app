<script setup>
import { computed, ref, watch } from 'vue'
import { ChevronLeft, Copy } from 'lucide-vue-next'
import SharedMonthScreen from '../../screens/SharedMonthScreen.vue'
import { readShared, HASH_PREFIX } from '../../composables/shareLink.js'

// Предпросмотр отправки: та самая страница, которую увидит получатель,
// и кнопка отправки прямо на ней.
//
// ⚠ Страница строится ИЗ САМОЙ ССЫЛКИ — расшифровкой того, что уедет,
// а не из состояния приложения. Вторая сборка того же экрана разошлась бы
// с настоящей молча, и первым дефектом стало бы «в предпросмотре сумм
// не было, а получателю они уехали». Здесь такое расхождение невозможно
// по устройству: показывается результат расшифровки.
//
// Открывается слоем поверх приложения, а не новой вкладкой: Safari блокирует
// открытие окна, если считает его непрошеным, и человек получил бы молчание
// в ответ на тап.

const props = defineProps({
  open: { type: Boolean, default: false },
  url: { type: String, default: '' },
})
const emit = defineEmits(['close'])

// Состояние получателя: ровно то, что лежит в ссылке.
const state = computed(() => {
  const i = props.url.indexOf(HASH_PREFIX)
  return i < 0 ? null : readShared(props.url.slice(i))
})

const done = ref('')
function flash(s) {
  done.value = s
  setTimeout(() => { done.value = '' }, 2500)
}
watch(() => props.open, (v) => { if (!v) done.value = '' })

async function send() {
  if (!props.url) return
  try {
    if (navigator.share) {
      await navigator.share({ url: props.url })
      flash('Отправлено')
    } else {
      await navigator.clipboard.writeText(props.url)
      flash('Ссылка скопирована')
    }
  } catch {
    if (!navigator.share) flash('Скопировать не вышло')
  }
}

async function copy() {
  if (!props.url) return
  try {
    await navigator.clipboard.writeText(props.url)
    flash('Ссылка скопирована')
  } catch {
    flash('Скопировать не вышло')
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && state"
      class="fixed inset-0 z-[70] overflow-y-auto"
      :style="{ background: 'var(--bg)' }"
    >
      <!-- Шапка собрана по лекалу оболочки: мобильная колонка, компактная
           строка 44 px, кнопка возврата слева, заголовок по центру. Своей
           формы у этого экрана нет — он часть приложения, а не отдельное окно. -->
      <div
        class="sticky top-0 z-10 pt-[env(safe-area-inset-top)] backdrop-blur"
        :style="{ background: 'color-mix(in srgb, var(--bg) 88%, transparent)', borderBottom: '1px solid var(--line)' }"
      >
        <div class="mx-auto w-full max-w-[430px] px-3">
          <div class="grid h-11 grid-cols-[minmax(2.75rem,1fr)_auto_minmax(2.75rem,1fr)] items-center">
            <button
              type="button"
              class="flex min-h-[44px] items-center gap-0.5 justify-self-start rounded-lg px-1 text-[var(--text)] active:bg-[var(--surface-2)]"
              @click="emit('close')"
            >
              <ChevronLeft class="h-6 w-6 shrink-0" :stroke-width="2.25" aria-hidden="true" />
              <span class="text-[1.0625rem] leading-none">Назад</span>
            </button>
            <span class="truncate px-2 text-[1.0625rem] font-semibold text-[var(--text)]">Поделиться ростом</span>
            <div class="min-h-[44px] min-w-[44px]" aria-hidden="true"></div>
          </div>
        </div>
      </div>

      <!-- Страница живая: «Честная цифра» открывается, файл скачивается —
           владелец проверяет ровно то, что получит другой человек. Выхода
           в приложение здесь нет: подвал с действием получателя в режиме
           предпросмотра не показывается. -->
      <div class="pb-[120px]">
        <SharedMonthScreen :state="state" preview />
      </div>

      <div
        class="fixed inset-x-0 bottom-0 z-10 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
        :style="{ background: 'color-mix(in srgb, var(--bg) 92%, transparent)', borderTop: '1px solid var(--line)' }"
      >
        <!-- Сетка та же, что у содержимого страницы: колонка 430 с полями
             по 16. Панель шире содержимого читалась чужим элементом. -->
        <div class="mx-auto flex w-full max-w-[430px] gap-2 px-4">
          <button
            type="button"
            class="flex min-h-[52px] flex-1 items-center justify-center rounded-2xl text-[1.0625rem] font-semibold"
            :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
            @click="send"
          >
            {{ done || 'Отправить' }}
          </button>
          <button
            type="button"
            class="flex min-h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border"
            :style="{ background: 'var(--surface)', borderColor: 'var(--rim)', color: 'var(--text)' }"
            aria-label="Скопировать ссылку"
            @click="copy"
          >
            <Copy class="h-5 w-5" :stroke-width="2" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
