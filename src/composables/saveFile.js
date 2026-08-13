// Сохранение текста файлом на устройство.
//
// Сети нет и не будет: файл собирается в памяти и отдаётся браузеру как есть.
// Ничего никуда не уходит, разрешений не спрашивается.
//
// Почему файл, а не только буфер обмена: длинный текст на телефоне при вставке
// обрывается молча, а заметки подменяют дефисы на тире и ломают таблицу.
// Файл переживает и то, и другое, и его можно приложить куда угодно.

export function saveText(text, filename) {
  try {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    // Ссылку освобождаем не сразу: часть браузеров читает её уже после клика.
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    return true
  } catch {
    return false
  }
}
