/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      // Правило ролей шрифта из лекала:
      // ввёл или измерил компьютер → моно; сказал человек → проза (системный).
      // Брендовых начертаний пока нет, роли держатся на системных.
      fontFamily: {
        brand: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'system-ui', 'sans-serif'],
        label: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
