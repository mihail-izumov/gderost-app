<script setup>
// Пока экран один. Оболочка лекала (AppShell, NavigationBar, TabBar)
// подключается в GR-03, когда появится второй экран: до тех пор таб-бар
// с единственной вкладкой был бы контролом без выбора.
import StartScreen from './screens/StartScreen.vue'
</script>

<template>
  <StartScreen />
</template>
