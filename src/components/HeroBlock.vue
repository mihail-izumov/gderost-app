<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import BrandLockup from './BrandLockup.vue'

// Блок высказывания: знак продукта, крупная фраза прописными и подпись
// категории под ней. Это голос витрины, и живёт он только на витрине —
// внутри приложения говорит интерфейс, там разделы набраны общим лекалом.
//
// Вынесен из экрана отдельным компонентом, потому что механика подгонки
// (замер, пробный кегль, выбор по длинной строке) не имеет отношения к тому,
// что стоит вокруг него, и в теле экрана она заслоняла собой сам экран.
//
// ── Почему фраза меряется, а не задаётся кеглем ─────────────────────────────
//
// Фраза занимает ширину экрана целиком. В css это не выражается: ширина
// зависит от устройства, а брендовое начертание грузится отдельно и до его
// появления фолбэк меряется по-своему. Поэтому строка меряется по факту —
// после монтирования, после `document.fonts.ready` и при каждом изменении
// ширины.
//
// Замер идёт на пробном кегле, а не на текущем: масштабировать от уже
// подогнанного значит копить ошибку с каждым пересчётом.
//
// Кегль подбирается по самой широкой строке и ставится всему блоку. Мерить
// строки по отдельности значит получить крупное «ДЕНЬ» и мелкое «ДЕЛАЕТ
// МЕСЯЦ» — слово с подписью вместо столкновения. Двух размеров
// у высказывания не бывает.

const props = defineProps({
  // Строки высказывания. Перелом задаётся здесь, а не шириной окна:
  // он смысловой — между подлежащим и сказуемым.
  lines: { type: Array, required: true },
  // Подпись категории под фразой. Пусто — подписи нет.
  tagline: { type: String, default: '' },
  // Знак продукта над фразой. На входе он стоит отдельно, в шапке экрана.
  lockup: { type: Boolean, default: false },
  maxPx: { type: Number, default: 96 },
})

const PROBE = 100

const heroBox = ref(null)
const heroText = ref(null)
const tagBox = ref(null)
const tagText = ref(null)

function widest(el) {
  const lines = el.children.length ? [...el.children] : [el]
  return lines.reduce((max, node) => Math.max(max, node.scrollWidth), 0)
}

function fit(boxRef, elRef, minPx, maxPx) {
  const box = boxRef.value
  const el = elRef.value
  if (!box || !el) return
  const avail = box.clientWidth
  if (!avail) return
  el.style.fontSize = `${PROBE}px`
  const w = widest(el)
  if (!w) return
  const size = Math.min(maxPx, Math.max(minPx, Math.floor((PROBE * avail) / w)))
  el.style.fontSize = `${size}px`
}

function fitAll() {
  fit(heroBox, heroText, 24, props.maxPx)
  fit(tagBox, tagText, 13, 19)
}

defineExpose({ fitAll })

watch(() => [props.lines, props.tagline], () => { fitAll() }, { flush: 'post' })

onMounted(() => {
  fitAll()
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitAll).catch(fitAll)
  }
  if (typeof window !== 'undefined') window.addEventListener('resize', fitAll)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('resize', fitAll)
})
</script>

<template>
  <div class="flex flex-col items-center gap-4 text-center">
    <BrandLockup v-if="lockup" size="2rem" class="mb-1" />

    <!-- Прописными, без точки: вывеска предложением не заканчивается.
         Начертание брендовое — ровно та роль, которую `tailwind.config.js`
         отводит голосу бренда. Вес 700 нарисован художником; ставить 600
         нельзя, файла такого нет и браузер размажет контуры сам. -->
    <div ref="heroBox" class="w-full">
      <h1
        ref="heroText"
        class="block font-brand leading-[1.06] tracking-[0.02em] text-[var(--text)]"
      >
        <span
          v-for="line in lines"
          :key="line"
          class="block whitespace-nowrap"
        >{{ line }}</span>
      </h1>
    </div>

    <!-- Подпись категории набрана тем же начертанием, что кнопка действия
         ниже: обе строки говорят голосом интерфейса, а не бренда, и разводить
         их разными шрифтами значит рисовать границу там, где её нет. -->
    <div v-if="tagline" ref="tagBox" class="w-full">
      <p
        ref="tagText"
        class="inline-block whitespace-nowrap font-semibold leading-snug text-[var(--text-secondary)]"
      >{{ tagline }}</p>
    </div>
  </div>
</template>
