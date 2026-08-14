<script setup>
import { ref, computed, watch } from 'vue'
import { CalendarCheck, Zap, Activity } from 'lucide-vue-next'
import StartScreen from './screens/StartScreen.vue'
import OnboardingScreen from './screens/OnboardingScreen.vue'
import TodayScreen from './screens/TodayScreen.vue'
import EnergyScreen from './screens/EnergyScreen.vue'
import SharedMonthScreen from './screens/SharedMonthScreen.vue'
import RunscaleScreen from './screens/RunscaleScreen.vue'
import GoalsScreen from './screens/GoalsScreen.vue'
import DayControlScreen from './screens/DayControlScreen.vue'
import AppShell from './components/AppShell.vue'
import { useMiniStore } from './composables/useMiniStore.js'
import { readShared, hasSharePayload } from './composables/shareLink.js'

// Три состояния входа: витрина → подключение бизнеса → свои цифры.
// Вернувшийся пользователь попадает сразу на свои цифры: витрину, которую
// один раз прошли, второй раз показывать незачем.
//
// Вкладки повторяют дорогу, по которой человек идёт: «Сегодня» — песочница,
// где он ведёт свой месяц сам; «Буткемп» — подготовка и вход к инженеру;
// «Подписка» — режим, в котором система работает за него каждый день.
// Навигация тем самым сама рассказывает, как устроен продукт, и не требует
// отдельного экрана-объяснения.
//
// Заголовка на Главной нет вовсе: имя продукта внутри приложения не пишется
// нигде, а экран и так подписан «Сегодня» в таб-баре. Вместо заголовка в шапке
// живёт чип бизнеса — постоянный контекст экрана.

const store = useMiniStore()
const entered = ref(store.state.ready)
const tab = ref('today')

// Месяц, пришедший ссылкой, показывается вместо приложения и хранилища
// не касается: у открывшего может быть свой месяц, и подменять его чужим
// нельзя. Выход из просмотра — очистка адреса, дальше обычный запуск.
//
// Ссылка в мессенджере рвётся: длинный адрес переносится по строкам и часть
// теряется. Молча показать вместо чужого месяца своё приложение — оставить
// человека в уверенности, что ему прислали именно это.
const hash = () => (typeof window === 'undefined' ? '' : window.location.hash)
const shared = ref(readShared(hash()))
const sharedBroken = ref(!shared.value && hasSharePayload(hash()))

function exitShared() {
  shared.value = null
  sharedBroken.value = false
  if (typeof window !== 'undefined') {
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }
}

// Приложение уже открыто, пришла вторая ссылка — меняется только адрес,
// перезагрузки не происходит. Без этого месяц не открылся бы до обновления.
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    const next = readShared(hash())
    shared.value = next
    sharedBroken.value = !next && hasSharePayload(hash())
  })
}
// Под-страница поверх вкладки: заход вглубь «Сегодня», поэтому у неё
// кнопка назад, а не место в таб-баре.
const subView = ref('')

const TABS = computed(() => [
  {
    id: 'today',
    label: 'Сегодня',
    icon: CalendarCheck,
    title: '',
    leadingAction: 'hardReload',
    eyebrow: (store.state.unit || store.state.company || 'Ваш бизнес').toUpperCase(),
    eyebrowName: store.state.unit || store.state.company || 'Ваш бизнес',
  },
  // Чип бизнеса и перезагрузка живут и здесь: «Буткемп» говорит про тот же
  // юнит, что «Сегодня», и переключаться между ними, теряя контекст в шапке,
  // человеку незачем.
  {
    id: 'power',
    label: 'Буткемп',
    icon: Zap,
    title: 'Буткемп',
    leadingAction: 'hardReload',
    eyebrow: (store.state.unit || store.state.company || 'Ваш бизнес').toUpperCase(),
    eyebrowName: store.state.unit || store.state.company || 'Ваш бизнес',
  },
  { id: 'runscale', label: 'Подписка', icon: Activity, title: 'Рост по подписке' },
])

// Подпись назад нейтральная: «Цели и планы» открываются и с «Сегодня»,
// и с «Буткемпа», а возврат ведёт туда, откуда пришли.
const SUB_VIEWS = {
  day: { title: 'Контроль Дня', showBack: true, backLabel: 'Назад' },
  goals: { title: 'Цели и планы', showBack: true, backLabel: 'Назад' },
}

const view = computed(() => {
  if (store.state.ready) return 'app'
  return entered.value ? 'onboarding' : 'showcase'
})

// Состояние есть, а модель из него не собралась: оборванная запись или чужая
// правка хранилища. Экран с выходом вместо пустоты — раньше четыре экрана
// на `v-if` просто исчезали, и кнопка «Всё забыть» исчезала вместе с ними.
const broken = computed(() => view.value === 'app' && !store.model.value)

// Сброс данных возвращает на витрину, а не на пустой экран приложения.
watch(() => store.state.ready, (ready) => {
  if (!ready) { entered.value = false; tab.value = 'today'; subView.value = '' }
})

function go(where) {
  if (SUB_VIEWS[where]) { subView.value = where; return }
  subView.value = ''
  tab.value = where
}

function selectTab(id) {
  subView.value = ''
  tab.value = id
}
</script>

<template>
  <SharedMonthScreen v-if="shared" :state="shared" @exit="exitShared" />

  <!-- Ссылка была, месяц не открылся: сказать прямо, а не показывать
       вместо чужого месяца своё приложение. -->
  <div v-else-if="sharedBroken" class="min-h-[100dvh] w-full bg-[var(--bg)]">
    <div class="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col items-start justify-center gap-3 px-6">
      <h1 class="text-[1.375rem] font-bold leading-tight text-[var(--text)]">Ссылка не открылась</h1>
      <p class="text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
        Месяц едет внутри ссылки, и она пришла не целиком. Попросите отправить её ещё раз — файлом или заново.
      </p>
      <button
        type="button"
        class="mt-2 min-h-[48px] w-full rounded-full px-5 text-[0.9375rem] font-bold"
        :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
        @click="exitShared"
      >Посчитать свой месяц</button>
    </div>
  </div>

  <StartScreen v-else-if="view === 'showcase'" @start="entered = true" />

  <!-- Сохранённое не читается. Сказать и дать выход — вместо белого экрана. -->
  <div v-else-if="broken" class="min-h-[100dvh] w-full bg-[var(--bg)]">
    <div class="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col items-start justify-center gap-3 px-6">
      <h1 class="text-[1.375rem] font-bold leading-tight text-[var(--text)]">Сохранённые данные не читаются</h1>
      <p class="text-[0.9375rem] leading-snug text-[var(--text-secondary)]">
        Запись месяца повреждена — так бывает, если она оборвалась. Посчитать по ней нельзя.
      </p>
      <button
        type="button"
        class="mt-2 min-h-[48px] w-full rounded-full text-[0.9375rem] font-bold"
        :style="{ background: 'var(--negative)', color: 'var(--ink-on-color)' }"
        @click="store.reset()"
      >Всё забыть и начать заново</button>
    </div>
  </div>

  <!-- Подключение бизнеса идёт без оболочки: переключаться некуда,
       и таб-бар с шапкой во время ввода только мешают. -->
  <div v-else-if="view === 'onboarding'" class="min-h-[100dvh] w-full flex justify-center bg-[var(--bg)]">
    <div
      class="w-full max-w-[430px] px-4
             pl-[max(1rem,env(safe-area-inset-left))]
             pr-[max(1rem,env(safe-area-inset-right))]
             pt-[max(1rem,env(safe-area-inset-top))]"
    >
      <OnboardingScreen />
    </div>
  </div>

  <AppShell
    v-else
    :tabs="TABS"
    :active="tab"
    :sub-view="subView"
    :sub-views="SUB_VIEWS"
    @update:active="selectTab"
    @back="subView = ''"
  >
    <!-- Отказ записи виден на каждом экране: человек вводит числа и обязан
         знать, что они живут только до закрытия вкладки. -->
    <p
      v-if="store.storageFailed()"
      class="mx-4 mb-3 rounded-xl border px-3 py-2 text-[0.8125rem] leading-snug"
      :style="{ borderColor: 'var(--negative)', color: 'var(--negative)', background: 'var(--surface)' }"
    >
      Браузер не сохраняет данные — введённое живёт, пока открыта эта вкладка.
      Скачайте файл месяца или откройте сайт не в приватном режиме.
    </p>

    <DayControlScreen v-if="subView === 'day'" />
    <GoalsScreen v-else-if="subView === 'goals'" @back="subView = ''" />
    <template v-else>
      <TodayScreen v-if="tab === 'today'" @go="go" />
      <EnergyScreen v-else-if="tab === 'power'" @go="go" />
      <RunscaleScreen v-else />
    </template>
  </AppShell>
</template>
