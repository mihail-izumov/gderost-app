<script setup>
import { ref, computed, onMounted } from 'vue'
import { Share, Plus, X } from 'lucide-vue-next'

// «Откройте как приложение». Смысл не в красивой иконке: установленное на
// домашний экран открывается одним касанием, работает без сети и не теряется
// среди вкладок. Приложение, которое открывают каждый день, обязано открываться
// быстрее, чем вспоминается адрес.
//
// В уже установленном виде баннер не показывается — предлагать сделанное значит
// не заметить, что человек уже сделал.

const standalone = ref(false)
const isIOS = ref(false)
const dismissed = ref(false)
const open = ref(false)

onMounted(() => {
  if (typeof window === 'undefined') return
  standalone.value = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
  isIOS.value = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
})

const show = computed(() => !standalone.value && !dismissed.value)
</script>

<template>
  <div v-if="show">
    <div class="flex items-start gap-3 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-3">
      <div class="min-w-0 flex-1">
        <p class="text-[0.9375rem] font-semibold leading-tight text-[var(--text)]">
          Откройте как приложение
        </p>
        <p class="mt-1 text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
          С домашнего экрана открывается одним касанием и работает без сети.
        </p>
        <button
          type="button"
          class="mt-1.5 min-h-[44px] text-[0.8125rem] font-semibold"
          :style="{ color: 'var(--action)' }"
          @click="open = true"
        >Как это сделать</button>
      </div>
      <button
        type="button"
        class="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center"
        aria-label="Скрыть"
        @click="dismissed = true"
      >
        <X class="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
      </button>
    </div>

    <!-- Инструкция: три шага и ни одного лишнего слова -->
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center"
      :style="{ background: 'var(--scrim)' }"
      @click.self="open = false"
    >
      <div
        class="w-full max-w-[430px] rounded-t-2xl bg-[var(--surface)] p-4
               pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div class="flex items-start justify-between gap-3">
          <h2 class="text-[1.0625rem] font-bold leading-tight text-[var(--text)]">
            Установка на домашний экран
          </h2>
          <button
            type="button"
            class="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center"
            aria-label="Закрыть"
            @click="open = false"
          >
            <X class="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
          </button>
        </div>

        <ol v-if="isIOS" class="mt-3 flex flex-col gap-3">
          <li class="flex items-start gap-2.5">
            <Share class="mt-0.5 h-5 w-5 shrink-0 text-[var(--text-secondary)]" aria-hidden="true" />
            <span class="text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
              Нажмите «Поделиться» в нижней панели Safari
            </span>
          </li>
          <li class="flex items-start gap-2.5">
            <Plus class="mt-0.5 h-5 w-5 shrink-0 text-[var(--text-secondary)]" aria-hidden="true" />
            <span class="text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
              Выберите «На экран „Домой“»
            </span>
          </li>
          <li class="flex items-start gap-2.5">
            <span class="mt-0.5 h-5 w-5 shrink-0 text-center text-[0.9375rem] text-[var(--text-secondary)]">3</span>
            <span class="text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
              Подтвердите «Добавить» — иконка появится рядом с остальными приложениями
            </span>
          </li>
        </ol>
        <p v-else class="mt-3 text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
          В меню браузера выберите «Установить приложение» или «Добавить на главный экран».
          Пункт называется по-разному, но лежит в главном меню.
        </p>

        <p class="mt-4 text-[0.75rem] leading-snug text-[var(--text-muted)]">
          Данные останутся на устройстве и после установки. Аккаунта по-прежнему нет.
        </p>
      </div>
    </div>
  </div>
</template>
