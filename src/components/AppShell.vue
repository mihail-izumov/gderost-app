<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import NavigationBar from './NavigationBar.vue'
import TabBar from './TabBar.vue'
import CalDateIcon from './icons/CalDateIcon.vue'
import BrandLockup from './BrandLockup.vue'
import { ArrowDown } from 'lucide-vue-next'
import { useAppRefresh } from '../composables/useAppRefresh.js'
import { PULL, pullOffset, canStartPull, shouldFirePull } from '../composables/pullGesture.js'
import { takeNavTarget } from '../composables/useNavAnchor.js'

// Оболочка приложения. Перенесена из рабочего Ранскеила.
//
// Принимает конфиг вкладок, активную вкладку и опциональную под-страницу.
// Под-страница имеет приоритет над вкладкой.
//
// Скролл живёт в оболочке, а не на странице: таб-бар плавает над ней и
// не уезжает с содержимым. При смене экрана прокрутка возвращается к верху,
// крупный заголовок снова раскрывается — экран, открытый с середины, читается
// как продолжение предыдущего.
//
// Ушли ниже первого экрана — капсула таб-бара уезжает влево и на её месте
// остаётся круглая кнопка с сегодняшним числом (механика ленты Reddit):
// человек читает длинную страницу, и три подписи поверх неё отбирают полосу
// содержимого. Тап по кругу возвращает панель, возврат к верху — тоже.
//
// Потянули страницу вниз от самого верха — приложение проверяет, вышла ли
// новая версия, и ставит её. Жест привычный по мобильному браузеру, и искать
// кнопку ради этого не нужно. Устройство жеста и две аварии, которые на нём
// случились, разобраны ниже, у самих обработчиков.

const props = defineProps({
  tabs: { type: Array, required: true },
  active: { type: String, required: true },
  subView: { type: String, default: null },
  subViews: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:active', 'back'])

const activeTab = computed(() => props.tabs.find((t) => t.id === props.active) ?? props.tabs[0])

const current = computed(() => {
  if (props.subView && props.subViews[props.subView]) {
    return { ...props.subViews[props.subView], _isSub: true }
  }
  return activeTab.value
})

const scrollEl = ref(null)
const collapsed = ref(false)
const COLLAPSE_AT = 28 // px прокрутки, после которых крупный заголовок сворачивается

// Панель сворачивается заметно ниже заголовка: она должна пережить первый
// экран целиком, иначе исчезает от одного движения пальцем.
const NAV_HIDE_AT = 240
const navHidden = ref(false)
const navPinned = ref(false)

const today = computed(() => new Date().getDate())

function onScroll(e) {
  const top = e.target.scrollTop
  lastScrollAt = Date.now()
  collapsed.value = top > COLLAPSE_AT
  if (top <= NAV_HIDE_AT) {
    navHidden.value = false
    navPinned.value = false
  } else if (!navPinned.value) {
    navHidden.value = true
  }
}

function openNav() {
  navPinned.value = true
  navHidden.value = false
}

// ── Потяни-обнови ───────────────────────────────────────────────────────────
//
// Механика повторяет мобильный Chrome, и это не вкусовщина: жест человек уже
// знает оттуда, и любое отличие он читает как поломку. Сами правила —
// в `composables/pullGesture.js` чистыми функциями, под самопроверкой;
// здесь только касания и то, что видно на экране.
//
// Отпускание зовёт обновление, а не сброс кэша: сброс — аварийный инструмент,
// он живёт строкой в шторке у кнопки. Почему это важно — в комментарии
// `useAppRefresh.js`.
//
// Подтверждения у жеста нет намеренно. Данные лежат на устройстве
// и обновлением не трогаются, а модалка на жесте превращает односекундное
// действие в два шага. Беспокойство снимается строкой под стрелкой, а с ним
// работает и панель обновления: она сообщает, чем всё кончилось.
const { status: refreshStatus, busy: refreshBusy, refresh } = useAppRefresh()

const pull = ref(0)
const pullReady = computed(() => pull.value >= PULL.TRIGGER)
let pullStart = null
let pullStartX = 0
let pullStartAt = 0
let pullActive = false
let pullDrift = 0
let lastScrollAt = 0

function onTouchStart(e) {
  const t = e.touches[0]
  const can = canStartPull({
    scrollTop: scrollEl.value ? scrollEl.value.scrollTop : 0,
    sinceScrollMs: Date.now() - lastScrollAt,
    busy: refreshBusy.value,
  })
  pullStart = can ? t.clientY : null
  pullStartX = t.clientX
  pullStartAt = Date.now()
  pullActive = false
  pullDrift = 0
  pull.value = 0
}

function onTouchMove(e) {
  if (pullStart === null) return
  const t = e.touches[0]
  const dy = t.clientY - pullStart
  // Самый большой увод вбок за весь жест, а не текущий: диагональ, которую
  // палец успел выправить, всё равно была диагональю.
  pullDrift = Math.max(pullDrift, Math.abs(t.clientX - pullStartX))
  if (dy <= PULL.SLOP) {
    if (pullActive) pull.value = 0
    return
  }
  pullActive = true
  pull.value = pullOffset(dy)
  // Прокрутку отбираем только когда жест уже начался: до люфта страница
  // обязана листаться как обычно.
  if (e.cancelable) e.preventDefault()
}

function onTouchEnd() {
  const fire = pullActive && shouldFirePull({
    offset: pull.value,
    heldMs: Date.now() - pullStartAt,
    drift: pullDrift,
  })
  pullStart = null
  pullActive = false
  pull.value = 0
  if (fire) refresh()
}

// ⚠ Сдвиг содержимого задаётся ТОЛЬКО когда панель действительно выехала.
// `transform` на прокручиваемом слое делает его точкой отсчёта для всего,
// что внутри стоит `fixed`, — и плавающие кнопки экранов начинают ехать
// вместе со страницей вместо того, чтобы висеть над ней. Постоянный
// `translateY(0)` выглядит безобидно и ломает это ровно так же, как любой
// другой сдвиг: важен факт свойства, а не его значение.
//
// Высота панели сверху: пока тянут — за пальцем, пока идёт обновление —
// своя, чтобы содержимое не прыгало в момент отпускания.
const PANEL_H = 92
const panel = computed(() => (refreshBusy.value ? PANEL_H : pull.value))
// Движение за пальцем идёт без перехода, всё остальное — пружиной.
const panelLive = computed(() => !refreshBusy.value && pull.value > 0)

const REFRESH_TEXT = {
  working: 'Трек обновляется…',
  fresh: 'Трек уже последней версии',
  offline: 'Нет сети — Трек остался прежним',
}

// Смена экрана возвращает прокрутку к верху — экран, открытый с середины,
// читается продолжением предыдущего. Исключение одно: человек шёл к
// конкретному блоку, и тогда оболочка подводит его туда сама.
//
// Два кадра ожидания вместо одного: первый отдаёт разметку нового экрана,
// второй — раскрытые им блоки. Искать якорь раньше значит не найти ничего.
watch(() => [props.active, props.subView], async () => {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = 0
  collapsed.value = false
  navHidden.value = false
  navPinned.value = false
  pull.value = 0

  const target = takeNavTarget()
  if (!target || !target.anchor || !scrollEl.value) return
  await nextTick()
  requestAnimationFrame(() => {
    const el = scrollEl.value && scrollEl.value.querySelector(`[data-anchor="${target.anchor}"]`)
    if (!el) return
    // Отступ сверху — под липкую полосу: иначе блок встаёт ровно под ней
    // и первая строка читается наполовину.
    const top = el.offsetTop - 64
    scrollEl.value.scrollTo({ top: top > 0 ? top : 0, behavior: 'smooth' })
  })
})
</script>

<template>
  <div
    class="relative mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[var(--bg)]
           pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]
           md:border-x md:border-[var(--line)]"
  >
    <!-- Панель сверху. Пока тянут — индикатор жеста, дальше она же держит
         состояние обновления: без неё человек отпускает палец и смотрит
         в замерший экран, не зная, случилось что-нибудь или нет.
         Строки появляются по мере того, как под них освобождается место:
         на первых пикселях подпись обрезалась бы по половине строки. -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col items-center justify-end overflow-hidden px-6 pb-1"
      :style="{ height: `${panel}px`, transition: panelLive ? 'none' : 'height 0.28s cubic-bezier(0.32, 0.72, 0, 1)' }"
      role="status"
      aria-live="polite"
    >
      <!-- Пока приложение занято собой, на панели стоит знак марки: связка
           имени целиком, шагает только шеврон внутри неё. Порознь шеврон
           иконкой не работает нигде — здесь он и не порознь. -->
      <template v-if="refreshBusy">
        <BrandLockup size="1.125rem" :running="refreshStatus === 'working'" />
        <span class="mt-2 block text-center text-[0.8125rem] leading-tight text-[var(--text-muted)]">
          {{ REFRESH_TEXT[refreshStatus] }}
        </span>
      </template>

      <!-- Стрелка вниз, пока тянут, и вверх на пороге срабатывания: знак
           говорит, куда идёт жест, а не какой марки приложение. -->
      <template v-else>
        <ArrowDown
          class="h-[22px] w-[22px] shrink-0 transition-all duration-150"
          :class="pullReady
            ? 'rotate-180 text-[var(--action)] opacity-100'
            : 'text-[var(--text-muted)] opacity-60'"
          :stroke-width="2.5"
          aria-hidden="true"
        />
        <span
          v-if="pull >= 44"
          class="font-label mt-1 block whitespace-nowrap text-[0.75rem] uppercase tracking-[0.12em]"
          :style="{ color: pullReady ? 'var(--action)' : 'var(--text-muted)' }"
        >Обновить Трек</span>
        <!-- Строка снимает единственное беспокойство жеста — «а не потеряю ли
             я введённое». Поэтому подтверждения у жеста нет: вопрос закрыт
             до того, как он задан. -->
        <span
          v-if="pull >= 74"
          class="mt-0.5 block text-center text-[0.6875rem] leading-tight text-[var(--text-muted)]"
        >Данные сохранятся. Ранскеил станет полезнее.</span>
      </template>
    </div>

    <div
      ref="scrollEl"
      class="relative flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain pb-28"
      :style="panelLive
        ? { transform: `translateY(${panel}px)`, transition: 'none' }
        : { transform: panel > 0 ? `translateY(${panel}px)` : '', transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)' }"
      @scroll="onScroll"
      @touchstart.passive="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <NavigationBar
        :title="current.title"
        :collapsed="collapsed"
        :show-back="!!current.showBack"
        :back-label="current.backLabel || ''"
        :leading-action="current.leadingAction || null"
        :eyebrow="current.eyebrow || null"
        :eyebrow-name="current.eyebrowName || ''"
        :eyebrow-company="current.eyebrowCompany || ''"
        :clock-title="!!current.clockTitle"
        :big-title="current.bigTitle !== false"
        @back="emit('back')"
      />
      <slot />
    </div>

    <!-- Плавающая навигация. Капсула уезжает влево, на её месте остаётся
         круглая кнопка с сегодняшним числом. -->
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-4"
      style="padding-bottom: calc(env(safe-area-inset-bottom) + 0.75rem)"
    >
      <div class="relative">
        <!-- Уход и возврат идут по одной кривой и одной длительностью.
             ⚠ Прозрачность из перехода убрана намеренно. Панель одновременно
             уезжала на 120 % влево И гасла за то же время, поэтому исчезала
             задолго до того, как доезжала до края: движение читалось рывком,
             сколько бы ни длилось. Теперь она просто уходит за край экрана,
             и длительности хватает, чтобы это увидеть. -->
        <div
          class="pointer-events-auto"
          :class="navHidden ? '-translate-x-[120%]' : 'translate-x-0'"
          style="transition: transform 0.42s cubic-bezier(0.32, 0.72, 0, 1)"
        >
          <TabBar :tabs="tabs" :active="active" @select="(id) => emit('update:active', id)" />
        </div>

        <!-- Круглая кнопка на месте капсулы появляется прозрачностью, а не
             возникает кадром: два движения в одной точке экрана обязаны
             происходить с одной скоростью.
             ⚠ Проходимость пальца задаётся инлайном, а не классом. Класс
             `pointer-events-auto` в разметке и `pointer-events-none` в привязке
             спорят между собой, и побеждает не тот, что написан позже, а тот,
             что позже стоит в таблице стилей. Невидимая кнопка выигрывала спор
             и ловила тапы в левом нижнем углу — ровно там, где в таб-баре
             стоит «Сегодня»: вкладка переставала открываться. -->
        <button
          type="button"
          class="absolute bottom-0 left-0 flex h-14 w-14 items-center justify-center rounded-full shadow-lg active:opacity-90"
          :class="navHidden ? 'opacity-100' : 'opacity-0'"
          :style="{
            background: 'var(--action)',
            pointerEvents: navHidden ? 'auto' : 'none',
            transition: 'opacity 0.42s cubic-bezier(0.32, 0.72, 0, 1)',
          }"
          aria-label="Показать навигацию"
          @click="openNav"
        >
          <CalDateIcon class="h-7 w-7" :day="today" :style="{ color: 'var(--action-ink)' }" />
        </button>
      </div>
    </div>
  </div>
</template>
