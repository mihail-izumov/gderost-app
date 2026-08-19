import { createApp } from 'vue'
import './styles/main.css'
import App from './App.vue'
import { startKeyboardInset } from './composables/useKeyboardInset.js'

createApp(App).mount('#app')

// Клавиатура на iOS рисуется поверх страницы и не двигает нижний край окна:
// без этого слушателя шторка ввода оказывается под ней вместе с полем.
startKeyboardInset()

// PWA service worker — ТОЛЬКО на production-сборке (на dev не биться с HMR)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js')
      .catch(() => {})
  })
}
