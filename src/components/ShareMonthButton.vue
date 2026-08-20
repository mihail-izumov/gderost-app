<script setup>
import { computed, ref } from 'vue'
import { Share2, Check } from 'lucide-vue-next'
import { shareUrl } from '../composables/shareLink.js'
import { useMiniStore } from '../composables/useMiniStore.js'

// Поделиться месяцем — ссылкой, а не файлом.
//
// На телефоне работает системный лист «Поделиться»: месяц уходит в тот же
// телеграм одним касанием. Где листа нет — ссылка кладётся в буфер, и об этом
// сказано прямо, а не сообщением «скопировано» в никуда.
//
// Ссылка несёт месяц в себе (`composables/shareLink.js`): сервера нет,
// отправить её может только владелец и только тому, кому захочет.

const props = defineProps({
  // quiet — обычная строка, accent — жёлтая плашка, action — графитовая
  // кнопка отправки.
  //
  // ⚠ Графит вместо синего, и это уточнение прежнего решения. Синий в системе
  // означает обычное действие — им покрашены переходы, вкладки, «Внести».
  // Отправка месяца на разбор — не рядовой шаг, а передача своих цифр другому
  // человеку, и стоять она обязана особняком. Графит темнее любого состояния
  // рядом и не спорит с цветной плашкой «Честной цифры» над собой, ради чего
  // синий когда-то и брался.
  tone: { type: String, default: 'quiet' }, // quiet | accent | action
  label: { type: String, default: 'Поделиться месяцем' },
  // Форма подстраивается под соседей: в ряду с прямоугольными кнопками
  // пилюля читается как элемент другой природы.
  shape: { type: String, default: 'pill' }, // pill | card
  // Знак нужен там, где кнопка стоит одна среди текста, и лишний там,
  // где она в ряду одинаковых.
  icon: { type: Boolean, default: true },
  // Режим ссылки: `growth` — рост без сумм, `full` — весь месяц с числами.
  // По умолчанию стоит безопасный: цена двух ошибок разная, и лишний вопрос
  // дешевле уехавшей выручки.
  mode: { type: String, default: 'growth' },
})
const emit = defineEmits(['shared'])

const store = useMiniStore()
const done = ref('')

const url = computed(() => (typeof window === 'undefined'
  ? ''
  : shareUrl(store.state, window.location.href, props.mode)))

async function share() {
  const link = url.value
  if (!link) return
  const title = `${store.state.unit || store.state.company || 'Мой бизнес'} — месяц в Ранскеил Трек`
  try {
    if (navigator.share) {
      await navigator.share({ title, url: link })
      done.value = 'Отправлено'
    } else {
      await navigator.clipboard.writeText(link)
      done.value = 'Ссылка скопирована'
    }
    emit('shared')
  } catch {
    // Отмена в системном листе — не ошибка, и говорить о ней нечего.
    // Настоящий отказ буфера обмена сказать обязан: человек ждёт ссылку.
    if (!navigator.share) done.value = 'Скопировать не вышло'
  }
  if (done.value) setTimeout(() => { done.value = '' }, 2500)
}
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center justify-center gap-2 px-5"
    :class="shape === 'card'
      ? 'min-h-[52px] rounded-2xl text-[1.0625rem] font-semibold'
      : 'min-h-[48px] rounded-full text-[0.9375rem] font-semibold'"
    :style="tone === 'action'
      ? { background: 'var(--graphite)', color: 'var(--ink-on-color)' }
      : tone === 'accent'
        ? { background: 'var(--positive)', color: 'var(--ink-on-color)' }
        : { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--rim)' }"
    @click="share"
  >
    <template v-if="icon">
      <Check v-if="done" class="h-5 w-5" :stroke-width="2.5" aria-hidden="true" />
      <Share2 v-else class="h-5 w-5" :stroke-width="2" aria-hidden="true" />
    </template>
    {{ done || label }}
  </button>
</template>
