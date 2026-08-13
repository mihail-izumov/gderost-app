/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      // Роли начертаний перенесены из рабочего Ранскейла.
      // @font-face — в src/styles/main.css, файлы — в public/fonts.
      // Фолбэки обязательны: font-display:swap показывает их, пока грузится брендовый.
      fontFamily: {
        // голос бренда: имя продукта, высказывание входа, крупные действия
        brand: ['"Ranscale Display"', '"Helvetica Neue Condensed"', 'Impact', 'sans-serif'],
        // ярлыки приборов: подписи блоков и категорий
        label: ['"Ranscale Label"', '"Helvetica Neue Condensed"', 'sans-serif'],
        // данные и ввод: поля, коды, цифры
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
