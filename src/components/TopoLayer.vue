<script setup>
import { computed } from 'vue'
import topoUrl from '../assets/topo-map.svg'

// Подложка-горизонталь: топографическая карта на заднем плане карточки или
// экрана. Образец — циферблат спортивных часов: линии рельефа в цвет фона,
// на грани различимости, читаются фактурой, а не рисунком.
//
// Один файл на весь фронт, но одинаковых мест нет. У каждой подложки свой
// ключ: из него считается угол поворота, зеркало, увеличение и сдвиг, и
// полотно всегда крупнее контейнера, поэтому в окно попадает свой кусок
// рельефа. Два соседних виджета не показывают один и тот же узор, и человек
// не видит повторяющийся штамп.
//
// Цвет подложки не свой: она красится тем же чернильным токеном, что и текст
// поверх неё, и держится на прозрачности. На светлой карточке это тёмные линии
// в несколько процентов, на цветной и чёрной — белые.
//
// Слой служебный: событий не ловит, ассистивным технологиям не виден, и лежит
// ниже содержимого. Родитель обязан быть `relative isolate overflow-hidden` —
// первое даёт систему координат, второе кладёт слой под текст, третье режет
// полотно по скруглению карточки.

const props = defineProps({
  // Ключ куска карты. Разные ключи — разные углы и участки рельефа.
  seed: { type: [String, Number], default: 0 },
  // Чем красить линии. Только токен, литералов цвета здесь не бывает.
  ink: { type: String, default: 'var(--text)' },
  // Насколько проступают линии. Светлый фон терпит меньше, тёмный — больше.
  // Мера намеренно на пределе различимости: рельеф работает фактурой, и как
  // только его замечают отдельно от карточки, он начинает спорить с числом.
  opacity: { type: Number, default: 0.028 },
  // Во сколько раз полотно шире контейнера. Больше — крупнее рельеф.
  spread: { type: Number, default: 3.2 },
})

// Простая устойчивая свёртка строки в число: одна и та же карточка всегда
// получает один и тот же кусок карты, поэтому подложка не пляшет при
// перерисовке и не мигает на прокрутке.
function hash(input) {
  const s = String(input)
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

const view = computed(() => {
  const h = hash(props.seed)
  const angle = h % 360                     // весь круг: карта не имеет верха
  const flip = (h >>> 9) % 2 ? -1 : 1       // зеркало добавляет непохожести
  const zoom = 1 + ((h >>> 11) % 40) / 100  // 1,00…1,39 — плотность линий
  const dx = ((h >>> 17) % 29) - 14         // сдвиг окна по полотну, ±14 %
  const dy = ((h >>> 22) % 29) - 14
  return {
    '--topo-src': `url(${topoUrl})`,
    '--topo-ink': props.ink,
    width: `${props.spread * 100}%`,
    opacity: props.opacity,
    transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${dx}%, ${dy}%) `
      + `scale(${(zoom * flip).toFixed(3)}, ${zoom.toFixed(3)})`,
  }
})
</script>

<template>
  <span class="topo" aria-hidden="true">
    <span class="topo__canvas" :style="view"></span>
  </span>
</template>

<style scoped>
/* Маска, а не картинка: файл карты чёрный, а нам нужен любой цвет — и белый
   на зелёной ступени, и тёмный на белой карточке. Браузер без масок просто
   не показывает слой: тонированный прямоугольник вместо рельефа хуже,
   чем чистая карточка. */
.topo { display: none; }

@supports ((-webkit-mask-image: url('')) or (mask-image: url(''))) {
  .topo {
    position: absolute;
    inset: 0;
    z-index: -1;
    display: block;
    overflow: hidden;
    border-radius: inherit;
    pointer-events: none;
  }
}

.topo__canvas {
  position: absolute;
  left: 50%;
  top: 50%;
  aspect-ratio: 3 / 2;
  background: var(--topo-ink);
  -webkit-mask-image: var(--topo-src);
  mask-image: var(--topo-src);
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}
</style>
