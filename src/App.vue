<script setup>
import { ref, computed, watch } from 'vue'
import StartScreen from './screens/StartScreen.vue'
import OnboardingScreen from './screens/OnboardingScreen.vue'
import TodayScreen from './screens/TodayScreen.vue'
import { useMiniStore } from './composables/useMiniStore.js'

// Три состояния входа: витрина → подключение бизнеса → свои цифры.
// Вернувшийся пользователь попадает сразу на свои цифры: витрину, которую
// один раз прошли, второй раз показывать незачем.
//
// Оболочка со вкладками появится вместе со вторым разделом: таб-бар с
// единственной вкладкой был бы контролом без выбора.

const store = useMiniStore()
const entered = ref(store.state.ready)

const view = computed(() => {
  if (store.state.ready) return 'today'
  return entered.value ? 'onboarding' : 'showcase'
})

// Сброс данных возвращает на витрину, а не на пустой экран приложения.
watch(() => store.state.ready, (ready) => { if (!ready) entered.value = false })
</script>

<template>
  <StartScreen v-if="view === 'showcase'" @start="entered = true" />

  <div v-else class="min-h-[100dvh] w-full flex justify-center bg-[var(--bg)]">
    <div
      class="w-full max-w-[430px] px-3
             pl-[max(0.75rem,env(safe-area-inset-left))]
             pr-[max(0.75rem,env(safe-area-inset-right))]
             pt-[max(1rem,env(safe-area-inset-top))]
             pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <OnboardingScreen v-if="view === 'onboarding'" />
      <TodayScreen v-else />
    </div>
  </div>
</template>
