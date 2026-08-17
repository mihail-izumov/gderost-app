<script setup>
// Знак виджета «Контроль Дня» на «Сегодня». Файл прислан Михаилом
// (`daycontrol-icon.svg`) и перенесён как есть: контуры и их преобразования не трогались.
//
// Единственные добавленные атрибуты — `fill="currentColor"` на корне и
// `aria-hidden`. Цвет знака задаёт плитка виджета: она несёт статус раздела,
// и знак обязан краситься её чернилами — белым на тёмной заливке, тёмным
// на жёлтой. Толщина обводки, которую передаёт виджет, здесь ни на что
// не влияет: знак набран заливками, штрихов в нём нет.
</script>

<template>
  <svg viewBox="0 0 1080 1080" fill="currentColor" aria-hidden="true"
       style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
      <g transform="matrix(1,0,0,1,-5224.86,0)">
          <g id="daycontrol-icon" transform="matrix(0.18288,0,0,0.0257578,5224.86,0)">
              <rect x="0" y="0" width="5905.51" height="41929.1" style="fill:none;"/>
              <g transform="matrix(0.914698,0,0,1,251.877,611.466)">
                  <g transform="matrix(-23.6844,0,0,168.159,5031.07,3896.37)">
                      <path d="M59,0L117,102L59,82L0,102L59,0Z"/>
                  </g>
                  <g transform="matrix(-23.6844,0,0,168.159,3645.53,991.843)">
                      <path d="M59,213L117,112L59,132L0,112L59,213Z"/>
                  </g>
              </g>
          </g>
      </g>
  </svg>
</template>
