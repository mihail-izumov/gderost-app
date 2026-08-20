<script setup>
import { computed, ref } from 'vue'
import { Share2, Check, Copy } from 'lucide-vue-next'
import { shareHead, shareText } from '../i18n/share.js'

// Предложение поделиться ростом. Приходит в четырёх точках — старт, третий
// день, первая полная неделя, закрытый месяц, — и каждая из них момент, когда
// человеку впервые есть что сказать. Условия — `composables/shareReason.js`,
// слова — `i18n/share.js`.
//
// Уезжает ТЕКСТ с коротким адресом, а не упакованный месяц: это приглашение
// приехать на трек, а не показ своих цифр. Отправка месяца ссылкой живёт
// отдельной кнопкой в паспорте разбора — два намерения, две кнопки.
//
// Все четыре шторки одного вида, с одной кнопкой отказа. Тон не повышается:
// если каждое проигнорированное предложение будет настойчивее предыдущего,
// человек научится не смотреть на них вовсе.
//
// «Скопировать» стоит рядом с отправкой всегда: на десктопе и в части
// браузеров системного листа нет, и без этой кнопки сообщение никуда не уедет.

const props = defineProps({
  reason: { type: String, default: '' }, // start | pace | week | month
  m: { type: Object, default: null },
})
defineEmits(['close'])

const head = computed(() => shareHead(props.reason))
const text = computed(() => shareText(props.reason, props.m))

const done = ref('')
function flash(s) {
  done.value = s
  setTimeout(() => { done.value = '' }, 2500)
}

async function send() {
  const t = text.value
  if (!t) return
  try {
    if (navigator.share) {
      await navigator.share({ text: t })
      flash('Отправлено')
    } else {
      await navigator.clipboard.writeText(t)
      flash('Текст скопирован')
    }
  } catch {
    // Отмена в системном листе — не ошибка, и говорить о ней нечего.
    if (!navigator.share) flash('Скопировать не вышло')
  }
}

async function copy() {
  const t = text.value
  if (!t) return
  try {
    await navigator.clipboard.writeText(t)
    flash('Текст скопирован')
  } catch {
    flash('Скопировать не вышло')
  }
}
</script>

<template>
  <div>
    <h2 class="text-[1.0625rem] font-bold text-[var(--text)]">{{ head }}</h2>

    <!-- Сообщение показывается целиком: человек отправляет его от своего имени,
         и увидеть, что именно уедет, он обязан до отправки, а не после. -->
    <p
      class="mt-3 whitespace-pre-line rounded-2xl p-3 text-[0.9375rem] leading-snug text-[var(--text)]"
      :style="{ background: 'var(--surface-2)' }"
    >{{ text }}</p>

    <button
      type="button"
      class="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full text-[0.9375rem] font-semibold"
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
