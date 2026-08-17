// Фирменные знаки рисуются CSS-маской, а не картинкой: тон задаёт фон элемента,
// поэтому один файл работает и белым на чёрном, и серым на светлом.
//
// Три вещи, которые ломались по очереди и которые трогать нельзя:
//   1. Заливка внутри svg — белая. WebKit для mask-image считает СВЕТЛОТУ,
//      а не альфу: чёрный знак = светлота 0 = замаскирован целиком, то есть
//      невидим совсем. Ровно на этом шеврон пропадал на проде.
//   2. Ширина задаётся явно. Пустой элемент без содержимого внутри flex-колонки
//      с align-items:center получает ширину по содержимому, то есть ноль —
//      знак просто не рисуется. aspect-ratio оставлен страховкой, опираться
//      на него нельзя.
//   3. viewBox шеврона обрезан по границам знака. В исходнике знак жил внутри
//      квадрата с прозрачными полями, и height задавал бокс, а не высоту знака.

const base = (import.meta.env && import.meta.env.BASE_URL) || '/'

function maskOf(file) {
  const url = `url("${base}${file}")`
  return {
    WebkitMaskImage: url, maskImage: url,
    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center', maskPosition: 'center',
    WebkitMaskSize: 'contain', maskSize: 'contain',
  }
}

// Пропорция знака шеврона из его viewBox.
export const CHEVRON_RATIO = 1080 / 923.72

/**
 * Шеврон Ранскейла заданной высоты.
 *
 * Число читается пикселями, строка берётся как есть — так знак можно задать
 * в `em` и связать его с кеглем соседнего текста. В имени продукта высота
 * шеврона равна высоте прописной буквы: свяжи их пикселями — и при смене
 * кегля они разъедутся, а поймать это на глаз уже нельзя.
 */
export function chevronStyle(height) {
  const h = typeof height === 'number'
    ? `${height}px`
    : (String(height || '').trim() || '24px')
  return {
    ...maskOf('runscale_chevron.svg'),
    height: h,
    width: `calc(${h} * ${CHEVRON_RATIO})`,
    aspectRatio: '1080 / 923.72',
  }
}

/** Логотип «Модуль роста» заданной высоты в пикселях. */
export function logoStyle(heightPx) {
  const h = Number(heightPx) || 28
  return {
    ...maskOf('runscale_logo.svg'),
    height: `${h}px`,
    width: `${Math.round(h * (1859 / 523))}px`,
  }
}
