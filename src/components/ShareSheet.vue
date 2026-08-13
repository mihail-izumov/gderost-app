<script setup>
import { computed } from 'vue'
import ShareMonthButton from './ShareMonthButton.vue'

// Предложение поделиться месяцем. Приходит ровно в двух точках, и обе —
// момент доказанной ценности: первая полностью закрытая неделя (впервые есть
// что показать) и закрытый месяц (на руках полная картина).
//
// В онбординге такого предложения нет нарочно: в первые минуты человек сам
// ещё не доверяет своей цифре, и делиться ему нечем.
//
// Показывается один раз на повод. Закрыл — это ответ, а не отложенное «потом».

const props = defineProps({
  reason: { type: String, default: '' }, // week | month
})
defineEmits(['close'])

const TEXTS = {
  week: {
    title: 'Неделя закрыта полностью',
    lead: 'Месяц посчитан на ваших днях. Ссылка открывает эти же числа у того, кому вы её отправите.',
  },
  month: {
    title: 'Месяц закрыт',
    lead: 'Полная картина месяца. Ссылка открывает её у партнёра или на разборе — теми же числами.',
  },
}
const t = computed(() => TEXTS[props.reason] || TEXTS.week)
</script>

<template>
  <div>
    <h2 class="text-[1.0625rem] font-bold text-[var(--text)]">{{ t.title }}</h2>
    <p class="mt-1 text-[0.875rem] leading-snug text-[var(--text-secondary)]">{{ t.lead }}</p>

    <ShareMonthButton class="mt-4" tone="accent" @shared="$emit('close')" />

    <button
      type="button"
      class="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-full text-[0.9375rem] font-medium text-[var(--text-secondary)]"
      @click="$emit('close')"
    >
      Не сейчас
    </button>

    <p class="mt-3 text-[0.75rem] leading-snug text-[var(--text-muted)]">
      Месяц едет внутри ссылки. Сервера нет, но открыть её сможет любой, у кого она есть.
    </p>
  </div>
</template>
