<script setup>
import { Info } from 'lucide-vue-next'
import { PATH_VISIBLE } from '../../composables/energyModel.js'

// Плашка юнита со статусом подключения и прогрессом по пути к буткемпу.
//
// Статус называет то, что приложение делает прямо сейчас: считает дни,
// которые внёс владелец. Слово «Подключается» обещало процесс, которого
// со стороны приложения не идёт — подключение случается на буткемпе
// и с контрактом, а не само по себе.
//
// Сплошной шкалы под числом больше нет: она показывала ровно тот же
// процент, что стоит рядом цифрой, и первое, что человек делал на экране, —
// читал одно и то же дважды. Осталась лестница этапов: где он и куда ведёт
// дорога. Процентов у этапов нет — этап это место, а не оценка.
//
// Разбор состава открывается отсюда же: расшифровка числа стоит там, где
// стоит число, а не отдельной строкой под плашкой.

defineProps({
  unit: { type: String, default: '' },
  pct: { type: Number, default: 0 },
  levelId: { type: String, default: 'mini' },
})
defineEmits(['info', 'stage'])

// Этап пути — вход в паспорт своей ступени. «Трек» товаром не является:
// её не покупают, и кнопкой она не становится.
const STAGE_MODULE = { razbory: 'razbor', bootcamp: 'bootcamp' }

// ⚠ Подписки на этой дороге нет. Она осталась в расчёте и в паспортах,
// но здесь, на странице собственного состояния, ежемесячный режим стоял
// концом пути у человека, который вчера подключил бизнес и внёс два дня.
// Дорога, у которой видимый конец недостижим, перестаёт быть дорогой
// и читается прайсом. Дальний шаг называется словами в разборе состава —
// без цены, кнопки и обещания.
const levels = PATH_VISIBLE
</script>

<template>
  <section
    class="rounded-[22px] px-4 pb-3.5 pt-3.5"
    :style="{ background: 'var(--surface-black)', color: 'var(--ink-on-color)' }"
  >
    <div class="flex items-start justify-between gap-3">
      <span class="min-w-0">
        <span class="block truncate text-[1.0625rem] font-bold leading-tight">{{ unit || 'Ваш бизнес' }}</span>
        <span class="mt-1 flex items-center gap-1.5">
          <!-- Точка статуса — жёлтая: подключение идёт и не закончено.
               Это её единственное законное место на экране. -->
          <span
            class="inline-block h-[7px] w-[7px] rounded-full"
            :style="{ background: 'var(--warning)' }"
            aria-hidden="true"
          ></span>
          <span class="text-[0.8125rem]" :style="{ color: 'var(--ink-on-color-muted)' }">Считаем дни</span>
        </span>
      </span>

      <!-- Знак «инфо» стоит в одной строке с процентом и ровно слева от него:
           состав числа — единственное, что с этим числом можно сделать. Стоя
           напротив подписи, знак читался значком раздела. Кнопка обнимает оба
           элемента: попасть пальцем можно и по знаку, и по самой цифре. -->
      <button
        type="button"
        class="-mr-1 flex shrink-0 flex-col items-end rounded-xl px-1 py-1"
        aria-label="Из чего сложился процент"
        @click="$emit('info')"
      >
        <span class="block text-[0.625rem] uppercase tracking-wide" :style="{ color: 'var(--ink-on-color-muted)' }">
          Энергия роста
        </span>
        <span class="flex items-center gap-1.5">
          <Info class="h-5 w-5 shrink-0" :style="{ color: 'var(--ink-on-color-muted)' }" :stroke-width="2" aria-hidden="true" />
          <span class="text-[1.75rem] font-bold leading-none tabular-nums">{{ pct }}%</span>
        </span>
      </button>
    </div>

    <!-- Этапы пути. Пройденный — светлый, будущий — приглушённый; текущий подписан. -->
    <ol class="mt-3.5 flex items-start justify-between gap-1.5">
      <component
        :is="STAGE_MODULE[l.id] ? 'button' : 'li'"
        v-for="l in levels"
        :key="l.id"
        :type="STAGE_MODULE[l.id] ? 'button' : null"
        class="flex min-w-0 flex-1 flex-col text-left"
        :aria-current="l.id === levelId ? 'step' : undefined"
        @click="STAGE_MODULE[l.id] ? $emit('stage', STAGE_MODULE[l.id]) : null"
      >
        <span
          class="mb-1.5 h-[3px] w-full rounded-full"
          :style="{ background: l.id === levelId ? 'var(--ink-on-color)' : 'var(--line-on-color)' }"
          aria-hidden="true"
        ></span>
        <span
          class="truncate text-[0.75rem] leading-tight"
          :style="{
            color: l.id === levelId ? 'var(--ink-on-color)' : 'var(--ink-on-color-muted)',
            fontWeight: l.id === levelId ? 700 : 400,
          }"
        >{{ l.label }}</span>
      </component>
    </ol>
  </section>
</template>
