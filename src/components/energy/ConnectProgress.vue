<script setup>
import { computed } from 'vue'
import { Info } from 'lucide-vue-next'
import ZapIcon from '../icons/ZapIcon.vue'
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

const props = defineProps({
  unit: { type: String, default: '' },
  pct: { type: Number, default: 0 },
  levelId: { type: String, default: 'mini' },
  // Идёт ли зарядка прямо сейчас: все прошедшие дни внесены — идёт, есть
  // пропуски — стоит.
  charging: { type: Boolean, default: false },
})

// ⚠ Молния и процент отвечают на РАЗНЫЕ вопросы, и путать их нельзя.
//
// Процент — оснащённость: сколько частей роста собрано и чем. Он не растёт
// от того, что владелец внёс вчерашний день; его двигают разбор, буткемп,
// работа с командой. Показывать это «зарядкой» значило бы обещать, что
// аккуратность в вводе поднимает уровень, — она его не поднимает.
//
// Молния — поток данных: питание, на котором всё считается. Пропущенные дни
// не отнимают процентов, но прогноз без них стоит на неполных данных, и это
// ровно то, о чём говорит «Честная цифра». Поэтому знак горит, пока дыр нет,
// и гаснет, как только они появились. Возвращается тем же — вводом.
const zap = computed(() => (props.charging
  ? { color: 'var(--warning)', label: 'Данные поступают' }
  : { color: 'var(--line-on-color)', label: 'Данных не хватает' }))

// Цвет этапа. Жёлтый на «Сигналах» — то же значение, что у жёлтого везде
// в приложении: мера и незавершённость. Это ступень, которую владелец уже
// прошёл собственной работой, и она единственная на дороге принадлежит ему,
// а не нам. Полоска и подпись красятся одним цветом: разный цвет у знака
// и его имени читается как два разных состояния.
function stageInk(id, isBar) {
  if (id === 'mini') return 'var(--warning)'
  if (id === props.levelId) return 'var(--ink-on-color)'
  return isBar ? 'var(--line-on-color)' : 'var(--ink-on-color-muted)'
}
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
        <!-- ⚠ Точка статуса снята. Она означала «идёт процесс», а процесса
             со стороны приложения не идёт: человек ведёт свои дни, и это
             состояние, а не операция. Строка называет то же самое прямо —
             «Рост на Треке»; «Считаем дни» описывало занятие приложения,
             а не положение владельца. -->
        <span class="mt-1 block text-[0.8125rem]" :style="{ color: 'var(--ink-on-color-muted)' }">Рост на Треке</span>
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
          <!-- Знак питания: горит, пока данные поступают, и гаснет, как только
               появились пропуски. Процент при этом не меняется — см. выше. -->
          <ZapIcon class="h-[22px] w-[22px] shrink-0" :style="{ color: zap.color }" :aria-label="zap.label" />
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
          :style="{ background: stageInk(l.id, true) }"
          aria-hidden="true"
        ></span>
        <span
          class="truncate text-[0.75rem] leading-tight"
          :style="{
            color: stageInk(l.id, false),
            fontWeight: l.id === levelId ? 700 : 400,
          }"
        >{{ l.label }}</span>
      </component>
    </ol>
  </section>
</template>
