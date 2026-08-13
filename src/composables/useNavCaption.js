// Подпись над крупным заголовком шапки («данные от 12.08.2026»).
// Модульный синглтон: экран ставит её при появлении и снимает при уходе,
// шапка про экраны ничего не знает.
//
// Подпись рендерится absolute НАД заголовком и не сдвигает его: иначе
// положение h1 гуляло бы от раздела к разделу.

import { ref } from 'vue'

const caption = ref('')

export function useNavCaption() {
  return {
    caption,
    setCaption(v) { caption.value = v || '' },
    clearCaption() { caption.value = '' },
  }
}
