<script setup>
import { computed } from 'vue'
import { chevronMask, chevronStyle } from '../composables/brandMask.js'
import { BRAND } from '../i18n/brand.js'

// Имя продукта: шеврон · РАНСКЕИЛ · ТРЕК.
//
// ⚠ Это единственное место во всём приложении, где шеврон имеет право
// появиться. Отдельной иконкой — во вкладке, в жесте обновления, в баннере,
// где угодно — он не ставится никогда: знак марки, поставленный на место
// иконки, перестаёт быть знаком марки и начинает означать «раздел».
//
// Раньше связка стояла одним файлом `runscale-mini.svg`. Файл кончился вместе
// с прежним именем продукта, и рисовать новый ради одной строки незачем:
// набор даёт то, чего картинка не даёт никогда — знак живёт цветом токена,
// слово наследует брендовое начертание, а вся связка масштабируется одним
// кеглем.
//
// Как связка держится выверенной. Всё считается от высоты прописной буквы
// (`--cap`), а не от кегля: у прописного набора кегль включает место под
// выносные, которых здесь нет, и любая отбивка, посчитанная от него,
// оказывается кривой.
//
//   · Шеврон ровно в высоту прописной — тогда он читается буквой, а не
//     картинкой рядом со словом.
//   · Отбивка одна на оба стыка. Глаз читает «шеврон · слово · плашка» как
//     один предмет только пока промежутки равны.
//   · Плашка обнимает прописные симметрично. Там, где браузер умеет
//     `text-box`, коробка строки обрезается ровно по прописным и поля
//     задаются просто. Где не умеет — поля разведены вручную: у кириллических
//     прописных под базовой линией остаётся пустое место высотой примерно
//     в четверть кегля, и симметричные поля сажают слово в плашке слишком
//     высоко. Ровно это было видно на первой сборке.

const props = defineProps({
  // Кегль связки. Всё остальное считается от него.
  size: { type: String, default: '2.25rem' },
  // Знак шагает, пока приложение занято собой: заставка запуска, обновление.
  // Движется только шеврон — слово и плашка стоят. Марка при этом остаётся
  // маркой: анимируется связка имени целиком, а не выдернутый из неё знак.
  running: { type: Boolean, default: false },
  // Что написано в плашке. По умолчанию — комплектация, в которой человек
  // сидит; на странице верхней ступени стоит её имя. Без этого пришлось бы
  // выбирать между «шеврон отдельной картинкой» (знак марки перестаёт быть
  // знаком марки) и «связка со словом ТРЕК на странице Ультры» (названа
  // не та комплектация). Плашка меняется — и обе беды исчезают разом.
  edition: { type: String, default: '' },
  // Связка в колонку: знак сверху, под ним слово, под ним комплектация
  // рамкой. Утверждённый лочкап верхней ступени. Числа у него свои,
  // промеренные по устройствам, и от кегля соседнего текста не считаются —
  // поэтому размеры живут таблицей в стилях, а не в `size`.
  stacked: { type: Boolean, default: false },
})

// Высота прописной буквы Univers ≈ 0.73 кегля.
const CAP = '0.73em'

const chevron = computed(() => chevronStyle(CAP))
const mask = computed(() => chevronMask())

const row = computed(() => ({
  fontSize: props.size,
  gap: '0.22em',
}))
</script>

<template>
  <!-- Связка в колонку. Озвучка одна на всю связку: ярусы под `aria-hidden`,
       иначе читалка произносит имя трижды и по буквам. -->
  <div
    v-if="stacked"
    class="rs-lockup font-brand"
    role="img"
    :aria-label="`${BRAND.brandName} ${edition || 'Ультра'}`"
  >
    <span class="rs-lockup__chevron bg-[var(--text)]" :style="mask" aria-hidden="true" />
    <span class="rs-lockup__word text-[var(--text)]" aria-hidden="true">{{ BRAND.wordmark }}</span>
    <span class="rs-lockup__badge text-[var(--text)]" aria-hidden="true">
      <span>{{ edition || 'Ультра' }}</span>
    </span>
  </div>

  <div
    v-else
    class="inline-flex items-center font-brand"
    :style="row"
    role="img"
    :aria-label="edition ? `${BRAND.brandName} ${edition}` : BRAND.header"
  >
    <span
      class="block shrink-0 bg-[var(--text)]"
      :class="running ? 'gr-run' : ''"
      :style="chevron"
      aria-hidden="true"
    />
    <span class="gr-cap block text-[var(--text)]" aria-hidden="true">{{ BRAND.wordmark }}</span>
    <span class="gr-cap gr-plate block" aria-hidden="true">{{ edition || BRAND.editionMark }}</span>
  </div>
</template>

<style scoped>
/* ═══ Связка в колонку: знак → РАНСКЕИЛ → комплектация рамкой ═══
 *
 * Числа ниже промерены по скриншотам с устройств и переносятся дословно.
 * Подгонять их на глаз нельзя: расхождение ловится замером в пикселях,
 * а не ощущением. Чего здесь трогать нельзя и почему:
 *
 *   · Рамка, а не заливка, и угол прямой. Радиус на объекте высотой 27 px
 *     читается кнопкой, и знак марки выпадает в интерфейс.
 *   · У бейджа нет верхней отбивки. Ноль — не опечатка: при `line-height: 1`
 *     под прописными висит пустота под выносные элементы, и она работает
 *     зазором. «Ровное» число разложит связку на три равноудалённые строки,
 *     и «Ранскеил Ультра» перестанет читаться одним именем.
 *   · Разгонка и отрицательное поле справа ходят парой: интервал добавляется
 *     и после последней буквы, без компенсации ярус уезжает влево на пол-
 *     интервала.
 *   · Оптический сдвиг надписи в рамке разный на двух ширинах (0.095em
 *     и 0.05em) — величина зависит от того, какие метрики шрифта читает
 *     движок, а у этого файла `hhea` и `winAscent` расходятся.
 *   · Ширина знака задана явно. Пустой блок в колонке с центровкой получает
 *     ширину по содержимому, то есть ноль, и знак не рисуется вовсе.
 */
.rs-lockup {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.rs-lockup__chevron,
.rs-lockup__word,
.rs-lockup__badge {
  box-sizing: border-box;
  line-height: 1;
  text-transform: uppercase;
}

.rs-lockup__chevron {
  display: block;
  flex: none;
  height: 66px;
  width: 77px;
}

.rs-lockup__word {
  display: block;
  margin-top: 15px;
  font-size: 35px;
  letter-spacing: 0.06em;
  margin-right: -0.06em;
}

.rs-lockup__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 0;
  height: 27px;
  padding: 0 10px;
  border: 1.5px solid currentColor;
  border-radius: 0;
  font-size: 17.5px;
  letter-spacing: 0.32em;
}

.rs-lockup__badge > span {
  position: relative;
  top: 0.095em;
  margin-right: -0.32em;
}

@media (min-width: 768px) {
  .rs-lockup__chevron { height: 80px; width: 94px; }
  .rs-lockup__word { margin-top: 18px; font-size: 42px; }
  .rs-lockup__badge { height: 32px; padding: 0 12px; border-width: 2px; font-size: 21px; }
  .rs-lockup__badge > span { top: 0.05em; }
}

/* Коробка строки, обрезанная по прописным. Фолбэк — междустрочное чуть ниже
   кегля; точное совпадение даёт `text-box` там, где он есть. */
.gr-cap {
  line-height: 0.76;
}

.gr-plate {
  /* Верхнее поле больше нижнего на четверть кегля: столько пустого места
     остаётся под базовой линией внутри строки. С симметричными полями слово
     в плашке сидит высоко — это и было видно на первой сборке. */
  padding: 0.26em 0.24em 0.04em;
  border-radius: 0.18em;
  background: var(--action);
  color: var(--action-ink);
}

/* Шаг знака, пока приложение занято собой. Шеврон уходит ВВЕРХ и возвращается
   снизу: обновление — это движение вперёд, и знак ведёт человека за собой,
   а не отсчитывает загрузку вниз. Кольца и вращения здесь быть не может:
   у знака есть верх и низ, и крутящаяся марка читается значком загрузки.
   Всё в долях кегля, поэтому шаг одинаков на любом размере. */
.gr-run {
  animation: gr-chevron-run 1.15s cubic-bezier(0.32, 0.72, 0, 1) infinite;
}

@keyframes gr-chevron-run {
  0%   { transform: translateY(0); opacity: 1; }
  45%  { transform: translateY(-0.34em); opacity: 0; }
  55%  { transform: translateY(0.34em); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

/* Движение в интерфейсе отключено системой — знак остаётся на месте
   и дышит прозрачностью. Совсем без признака жизни панель читается зависшей. */
@media (prefers-reduced-motion: reduce) {
  .gr-run {
    animation: gr-chevron-breathe 1.6s ease-in-out infinite;
  }
  @keyframes gr-chevron-breathe {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }
}

@supports (text-box: trim-both cap alphabetic) {
  .gr-cap {
    text-box: trim-both cap alphabetic;
    line-height: 1;
  }
  /* Коробка обрезана ровно по прописным — поля становятся симметричными. */
  .gr-plate {
    padding: 0.16em 0.24em;
  }
}
</style>
