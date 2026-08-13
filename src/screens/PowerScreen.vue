<script setup>
import StatusChip from '../components/StatusChip.vue'

// «Сила роста» — ступень, на которой введённое перестаёт быть словами.
//
// Раздела пока нет, и это сказано прямо. Заглушка называет роль и не показывает
// ни одного придуманного экрана: показать превью того, чего не существует,
// значит начать врать ровно там, где продукт обещает не врать.
// Сроков здесь тоже нет — обещание срока стоит дороже, чем кажется.
</script>

<template>
  <div class="w-full px-4 pb-10">
    <!-- Заголовок ставит шапка приложения: второй такой же в потоке — дубль. -->
    <header>
      <p class="text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
        Здесь введённое проходит проверку и становится проверенным.
        Раздела пока нет — вот что он будет делать и почему без него ваши числа
        остаются на второй ступени.
      </p>
    </header>

    <!-- Лестница статусов: она же объясняет устройство продукта -->
    <section class="mt-5 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
      <h2 class="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Три ступени доверия к числу
      </h2>

      <ol class="mt-3 flex flex-col gap-4">
        <li>
          <div class="flex items-center gap-2">
            <StatusChip kind="said" />
            <span class="text-[0.9375rem] font-semibold text-[var(--text)]">Вы сказали</span>
          </div>
          <p class="mt-1 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
            Выручка, план, цель. Приложение принимает это как есть и нигде
            не делает вид, что проверило.
          </p>
        </li>

        <li>
          <div class="flex items-center gap-2">
            <StatusChip kind="computed" />
            <span class="text-[0.9375rem] font-semibold text-[var(--text)]">Приложение посчитало</span>
          </div>
          <p class="mt-1 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
            Прогноз месяца, разрыв, требование на сегодня, форма недели.
            Считается из ваших чисел по правилам, которые видно на экране.
            Здесь вы сейчас и находитесь.
          </p>
        </li>

        <li>
          <div class="flex items-center gap-2">
            <StatusChip kind="verified" />
            <span class="text-[0.9375rem] font-semibold text-[var(--text)]">Проверено</span>
          </div>
          <p class="mt-1 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
            Число, прошедшее собственный сбор и автоматические проверки:
            откуда взялось, сходится ли с соседними, не противоречит ли само себе.
            Этой галочки в приложении не бывает — ставить её здесь было бы нечестно.
          </p>
        </li>
      </ol>
    </section>

    <section class="mt-4 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
      <h2 class="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Что здесь появится
      </h2>
      <p class="mt-2 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
        Слой сомнения: введённое перепроверяется, расхождения находятся и
        разбираются, и число получает право на галочку. Как именно это устроено —
        отдельный разговор, и обещать его сроком мы не будем.
      </p>
      <p class="mt-2 text-[0.875rem] leading-snug text-[var(--text-secondary)]">
        До тех пор всё, что считает приложение, честно стоит на второй ступени —
        и работает: разрыв, прогноз и требование на день не становятся хуже оттого,
        что посчитаны на ваших словах.
      </p>
    </section>
  </div>
</template>
