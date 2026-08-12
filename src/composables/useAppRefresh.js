// Жёсткая перезагрузка приложения.
//
// Установленное на домашний экран приложение живёт долго и обновляется само,
// но иногда застревает на старой версии: браузер держит закэшированную
// оболочку, и человек видит вчерашний экран без единого признака, что он
// вчерашний. Кнопка на этот случай обязана быть — искать способ «почистить кэш»
// в настройках телефона владелец бизнеса не должен.
//
// Что чистится: кэши оболочки и зарегистрированный обработчик.
// Что не трогается никогда: введённые данные. Кнопка обновляет программу,
// а не стирает работу — путать эти две вещи нельзя.

export async function hardReload() {
  if (typeof window === 'undefined') return
  try {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
  } catch {
    // Не получилось почистить — перезагружаемся всё равно: хуже не станет.
  }
  window.location.reload()
}
