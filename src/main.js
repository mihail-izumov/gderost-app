import { createApp } from 'vue'
import './styles/main.css'
import App from './App.vue'

createApp(App).mount('#app')

// PWA service worker — ТОЛЬКО на production-сборке (на dev не биться с HMR)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js')
      .catch(() => {})
  })
}
