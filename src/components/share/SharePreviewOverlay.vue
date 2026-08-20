<script setup>
import { computed, ref, watch } from 'vue'
import { ChevronLeft, Share2, Copy, Check } from 'lucide-vue-next'
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
      <!-- Полоса сверху говорит, что это ещё не отправка: человек смотрит
           чужими глазами и может вернуться. -->
      <div
        class="sticky top-0 z-10 flex items-center gap-2 px-3 py-2 backdrop-blur"
        :style="{ background: 'color-mix(in srgb, var(--bg) 88%, transparent)', borderBottom: '1px solid var(--line)' }"
      >
        <button
          type="button"
          class="flex min-h-[44px] items-center gap-1 pr-2 text-[0.9375rem] font-medium"
          :style="{ color: 'var(--action-text)' }"
          @click="emit('close')"
        >
          <ChevronLeft class="h-5 w-5" :stroke-width="2.5" aria-hidden="true" />
          Назад
        </button>
        <span class="ml-auto pr-1 text-[0.8125rem] text-[var(--text-muted)]">Так увидит получатель</span>
      </div>

      <!-- Кнопки экрана получателя здесь не работают: это его страница,
           а не наша. Выход в приложение под ними тоже принадлежит ему. -->
      <div class="pointer-events-none pb-[120px]">
        <SharedMonthScreen :state="state" />
      </div>

      <div
        class="fixed inset-x-0 bottom-0 z-10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
        :style="{ background: 'color-mix(in srgb, var(--bg) 92%, transparent)', borderTop: '1px solid var(--line)' }"
      >
        <div class="mx-auto flex w-full max-w-[430px] gap-2">
          <button
            type="button"
            class="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl text-[1.0625rem] font-semibold"
            :style="{ background: 'var(--graphite)', color: 'var(--ink-on-color)' }"
            @click="send"
          >
            <Check v-if="done" class="h-5 w-5" :stroke-width="2.5" aria-hidden="true" />
            <Share2 v-else class="h-5 w-5" :stroke-width="2" aria-hidden="true" />
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
