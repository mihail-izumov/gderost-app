<script setup>
import { ref, computed, watch } from 'vue'
import { CalendarCheck, ShieldCheck, Activity } from 'lucide-vue-next'
import StartScreen from './screens/StartScreen.vue'
import OnboardingScreen from './screens/OnboardingScreen.vue'
import TodayScreen from './screens/TodayScreen.vue'
import PowerScreen from './screens/PowerScreen.vue'
import RunscaleScreen from './screens/RunscaleScreen.vue'
import GoalsScreen from './screens/GoalsScreen.vue'
import TabBar from './components/TabBar.vue'
import { useMiniStore } from './composables/useMiniStore.js'

// Три состояния входа: витрина → подключение бизнеса → свои цифры.
// Вернувшийся пользователь попадает сразу на свои цифры: витрину, которую
// один раз прошли, второй раз показывать незачем.
//
// Вкладки повторяют лестницу доверия к числу — «вы сказали», «мы посчитали»,
// «проверено». Навигация тем самым сама рассказывает, как устроен продукт,
// и не требует отдельного экрана-объяснения.

const store = useMiniStore()
const entered = ref(store.state.ready)
const tab = ref('today')
// Под-страница поверх вкладки: «Цели и планы» — не четвёртый раздел, а заход
// вглубь «Сегодня», поэтому у неё кнопка назад, а не место в таб-баре.
const subView = ref('')

const TABS = [
  { id: 'today', label: 'Сегодня', icon: CalendarCheck },
  { id: 'power', label: 'Сила роста', icon: ShieldCheck },
  { id: 'runscale', label: 'Ранскейл', icon: Activity },
]

const view = computed(() => {
  if (store.state.ready) return 'app'
  return entered.value ? 'onboarding' : 'showcase'
})

// Сброс данных возвращает на витрину, а не на пустой экран приложения.
watch(() => store.state.ready, (ready) => {
  if (!ready) { entered.value = false; tab.value = 'today'; subView.value = '' }
})

// Переход из экрана: либо вкладка, либо заход вглубь.
function go(where) {
  if (where === 'goals') { subView.value = 'goals'; return }
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

  <div v-else class="min-h-[100dvh] w-full flex justify-center bg-[var(--bg)]">
    <div class="flex w-full max-w-[430px] min-h-[100dvh] flex-col">
      <main
        class="flex-1 px-3
               pl-[max(0.75rem,env(safe-area-inset-left))]
               pr-[max(0.75rem,env(safe-area-inset-right))]
               pt-[max(1rem,env(safe-area-inset-top))]"
      >
        <OnboardingScreen v-if="view === 'onboarding'" />
        <GoalsScreen v-else-if="subView === 'goals'" @back="subView = ''" />
        <template v-else>
          <TodayScreen v-if="tab === 'today'" @go="go" />
          <PowerScreen v-else-if="tab === 'power'" />
          <RunscaleScreen v-else />
        </template>
      </main>

      <!-- Таб-бар появляется вместе с приложением: во время подключения бизнеса
           переключаться некуда, и контрол без выбора только мешает. -->
      <TabBar v-if="view === 'app'" :tabs="TABS" :active="tab" @select="selectTab" />
    </div>
  </div>
</template>
