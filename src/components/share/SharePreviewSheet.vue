<script setup>
import { computed, ref } from 'vue'
import { Share2, Check, Copy, ExternalLink } from 'lucide-vue-next'
import { shareUrl } from '../../composables/shareLink.js'
import { useMiniStore } from '../../composables/useMiniStore.js'

// Предпросмотр отправки: человек видит, что уедет, пока решение ещё можно
// изменить.
//
// ⚠ Миниатюры страницы здесь нет намеренно. Это была бы вторая вёрстка того же
// экрана, и разошлась бы она молча; первым же дефектом стало бы «в предпросмотре
// сумм не было, а получателю они уехали». Кнопка открывает НАСТОЯЩУЮ ссылку —
// ту самую, которая уйдёт.
//
// ⚠ Тумблер между отправками не запоминается. Цена двух ошибок разная: лишнее
// нажатие раздражает, забытый включённый тумблер отправляет выручку в клуб,
// и это уже не чинится.

defineEmits(['close'])

const store = useMiniStore()

// Выключен по умолчанию: безопасное положение — то, в котором суммы остаются
// у владельца.
const withSums = ref(false)
const mode = computed(() => (withSums.value ? 'full' : 'growth'))

const url = computed(() => (typeof window === 'undefined'
  ? ''
  : shareUrl(store.state, window.location.href, mode.value)))

const done = ref('')
function flash(s) {
  done.value = s
  setTimeout(() => { done.value = '' }, 2500)
}

async function send() {
  const link = url.value
  if (!link) return
  const title = `${store.state.unit || store.state.company || 'Мой бизнес'} — месяц`
  try {
    if (navigator.share) {
      await navigator.share({ title, url: link })
      flash('Отправлено')
    } else {
      await navigator.clipboard.writeText(link)
      flash('Ссылка скопирована')
    }
  } catch {
    if (!navigator.share) flash('Скопировать не вышло')
  }
}

async function copy() {
  const link = url.value
  if (!link) return
  try {
    await navigator.clipboard.writeText(link)
    flash('Ссылка скопирована')
  } catch {
    flash('Скопировать не вышло')
  }
}

function preview() {
  if (url.value) window.open(url.value, '_blank', 'noopener')
}
</script>

<template>
  <div>
    <h2 class="text-[1.0625rem] font-bold text-[var(--text)]">Что увидят по ссылке</h2>

    <ul class="mt-3 flex flex-col gap-1 text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
      <li>Процент плана и как идут дни месяца</li>
      <li>Сколько дней внесено</li>
      <li>Честная цифра — на чём стоят числа</li>
      <li v-if="withSums" class="font-semibold text-[var(--text)]">Суммы в рублях и файл месяца</li>
    </ul>

    <!-- Переключатель. Выключенное положение сказано утверждением, а не
         обещанием: суммы в этом режиме не уезжают даже внутри самой ссылки. -->
    <button
      type="button"
      class="mt-4 flex w-full items-center gap-3 rounded-2xl p-3 text-left"
      :style="{ background: 'var(--surface-2)' }"
      role="switch"
      :aria-checked="withSums"
      @click="withSums = !withSums"
    >
      <span class="min-w-0 flex-1">
        <span class="block text-[0.9375rem] font-semibold text-[var(--text)]">Показывать суммы</span>
        <span class="mt-0.5 block text-[0.8125rem] leading-snug text-[var(--text-muted)]">
          {{ withSums
            ? 'Получатель увидит выручку, план и остаток'
            : 'Суммы в ссылку не попадут' }}
        </span>
      </span>
      <span
        class="relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors"
        :style="{ background: withSums ? 'var(--action)' : 'var(--line)' }"
      >
        <span
          class="absolute top-[2px] block h-[27px] w-[27px] rounded-full transition-all"
          :style="{ left: withSums ? '22px' : '2px', background: 'var(--surface)' }"
        />
      </span>
    </button>

    <button
      type="button"
      class="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full text-[0.875rem] font-medium text-[var(--text-secondary)]"
      @click="preview"
    >
      <ExternalLink class="h-[18px] w-[18px]" :stroke-width="2" aria-hidden="true" />
      Посмотреть, как увидят
    </button>

    <button
      type="button"
      class="mt-1 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full text-[0.9375rem] font-semibold"
      :style="{ background: 'var(--graphite)', color: 'var(--ink-on-color)' }"
      @click="send"
    >
      <Check v-if="done" class="h-5 w-5" :stroke-width="2.5" aria-hidden="true" />
      <Share2 v-else class="h-5 w-5" :stroke-width="2" aria-hidden="true" />
      {{ done || 'Отправить' }}
    </button>

    <button
      type="button"
      class="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full text-[0.9375rem] font-semibold"
      :style="{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--rim)' }"
      @click="copy"
    >
      <Copy class="h-5 w-5" :stroke-width="2" aria-hidden="true" />
      Скопировать
    </button>

    <button
      type="button"
      class="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-full text-[0.9375rem] font-medium text-[var(--text-secondary)]"
      @click="$emit('close')"
    >
      Не сейчас
    </button>
  </div>
</template>
