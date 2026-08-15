<script setup>
import { ref } from 'vue'
import ShareMonthButton from './ShareMonthButton.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { saveText } from '../composables/saveFile.js'

// Карточка «Попробовать неделю».
//
// Заняла место одинокой кнопки «удалить всё». Смысл тот же — выход не заперт, —
// но сказан с другой стороны: сначала предложение поработать неделю, потом
// условие (данные только у вас), потом две возможности — унести своё и стереть
// своё. Кнопка удаления без такой рамки выглядела единственным, что здесь можно
// сделать, и приложение читалось как то, из чего хочется выйти.
//
// Выгрузка обязательна рядом с удалением: данных нет нигде, кроме этого
// устройства, значит унести их человек должен уметь до того, как сотрёт.

const store = useMiniStore()

const saved = ref(false)
const saveFailed = ref(false)
const askReset = ref(false)

// Выгрузка уходит файлом, а не в буфер: на телефоне длинный текст при вставке
// обрывается молча, а заметки подменяют дефисы на тире и ломают таблицу.
// Буфер остаётся запасным путём — если браузер не дал сохранить файл.
async function saveData() {
  const text = store.exportText()
  saveFailed.value = false
  if (saveText(text, store.exportFileName())) {
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  } catch {
    // Молчать нельзя: человек нажал и обязан узнать результат.
    saveFailed.value = true
  }
}

function reset() {
  store.reset()
  askReset.value = false
}
</script>

<template>
  <section class="rounded-2xl bg-[var(--surface)] p-5 text-center shadow-sm">
    <h2 class="text-[1.0625rem] font-bold leading-snug text-[var(--text)]">
      Попробовать неделю.<br>Расти каждый день.
    </h2>
    <p class="mx-auto mt-2 max-w-[22rem] text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
      Все данные <b class="font-semibold text-[var(--text)]">только на вашем устройстве</b>.
      Ничего не видим, никуда не отправляем, почту не просим и не пишем вам.
    </p>

    <!-- Три кнопки одного размера и одного скругления: они об одном — что
         человек может сделать со своими данными. Разводит их вес, а не форма.
         Порядок по важности: унести файлом, показать ссылкой, стереть.
         Жёлтого здесь нет — цвет данных на действии читался как «главное»
         там, где главное другое. -->
    <button
      type="button"
      class="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[1.0625rem] font-semibold"
      :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
      @click="saveData"
    >
      {{ saved ? 'Готово' : 'Скачать' }}
      <span
        class="rounded px-1.5 py-0.5 text-[0.6875rem] font-semibold"
        :style="{ background: 'var(--action-ink)', color: 'var(--action)' }"
      >MD</span>
    </button>
    <p v-if="saveFailed" class="mt-2 text-[0.8125rem] text-[var(--negative)]">
      Браузер не дал сохранить файл.
    </p>

    <ShareMonthButton class="mt-2" tone="quiet" shape="card" :icon="false" label="Поделиться" />

    <!-- Разделитель со словом посередине: дальше идёт действие другой природы,
         и оно отделено так же, как в системных экранах входа отделяют вход
         через сервис от входа паролем. -->
    <div class="my-3 flex items-center gap-3" aria-hidden="true">
      <span class="h-px flex-1 bg-[var(--line)]"></span>
      <span class="text-[0.75rem] text-[var(--text-muted)]">или</span>
      <span class="h-px flex-1 bg-[var(--line)]"></span>
    </div>

    <button
      v-if="!askReset"
      type="button"
      class="min-h-[52px] w-full rounded-2xl border-2 text-[1.0625rem] font-semibold"
      :style="{ borderColor: 'var(--negative)', color: 'var(--negative)' }"
      @click="askReset = true"
    >Всё забыть</button>

    <div v-else class="flex flex-col gap-2">
      <p class="text-[0.9375rem] text-[var(--text-secondary)]">Забыть навсегда?</p>
      <div class="flex gap-2">
        <button
          type="button"
          class="min-h-[52px] flex-1 rounded-2xl text-[1rem] font-semibold"
          :style="{ background: 'var(--negative)', color: 'var(--ink-on-color)' }"
          @click="reset"
        >Забыть</button>
        <button
          type="button"
          class="min-h-[52px] flex-1 rounded-2xl border border-[var(--line)] text-[1rem] font-medium text-[var(--text-secondary)]"
          @click="askReset = false"
        >Оставить</button>
      </div>
    </div>
  </section>
</template>
