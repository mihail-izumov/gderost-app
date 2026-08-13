<script setup>
import { ref, computed, watch } from 'vue'
import { CalendarCheck, ShieldCheck, Activity } from 'lucide-vue-next'
import StartScreen from './screens/StartScreen.vue'
import OnboardingScreen from './screens/OnboardingScreen.vue'
import TodayScreen from './screens/TodayScreen.vue'
import PowerScreen from './screens/PowerScreen.vue'
import RunscaleScreen from './screens/RunscaleScreen.vue'
import GoalsScreen from './screens/GoalsScreen.vue'
import DayControlScreen from './screens/DayControlScreen.vue'
import AppShell from './components/AppShell.vue'
import { useMiniStore } from './composables/useMiniStore.js'

// Три состояния входа: витрина → подключение бизнеса → свои цифры.
// Вернувшийся пользователь попадает сразу на свои цифры: витрину, которую
// один раз прошли, второй раз показывать незачем.
//
// Вкладки повторяют лестницу доверия к числу — «вы сказали», «мы посчитали»,
// «проверено». Навигация тем самым сама рассказывает, как устроен продукт,
// и не требует отдельного экрана-объяснения.
//
// Заголовка на Главной нет вовсе: имя продукта внутри приложения не пишется
// нигде, а экран и так подписан «Сегодня» в таб-баре. Вместо заголовка в шапке
// живёт чип бизнеса — постоянный контекст экрана.

const store = useMiniStore()
const entered = ref(store.state.ready)
const tab = ref('today')
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
  { id: 'power', label: 'Сила роста', icon: ShieldCheck, title: 'Сила роста' },
  { id: 'runscale', label: 'Ранскейл', icon: Activity, title: 'Ранскейл' },
])

const SUB_VIEWS = {
  day: { title: 'Контроль Дня', showBack: true, backLabel: 'Главная' },
  goals: { title: 'Цели и планы', showBack: true, backLabel: 'Главная' },
}

const view = computed(() => {
  if (store.state.ready) return 'app'
  return entered.value ? 'onboarding' : 'showcase'
})

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
  <StartScreen v-if="view === 'showcase'" @start="entered = true" />

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
    <DayControlScreen v-if="subView === 'day'" />
    <GoalsScreen v-else-if="subView === 'goals'" @back="subView = ''" />
    <template v-else>
      <TodayScreen v-if="tab === 'today'" @go="go" />
      <PowerScreen v-else-if="tab === 'power'" />
      <RunscaleScreen v-else />
    </template>
  </AppShell>
</template>
