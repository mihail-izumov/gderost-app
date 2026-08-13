<script setup>
// Таб-бар. Перенесён из рабочего Ранскейла: активная вкладка помечена жёлтой
// пилюлей-заливкой под иконкой, подписи монохромные. Цветом здесь говорит
// только состояние «здесь вы сейчас».
//
// Стекло на фоне — Tailwind-утилита backdrop-blur, а не своё свойство:
// autoprefixer добавляет -webkit-backdrop-filter, без которого на iOS Safari
// размытие не рисуется вовсе.
defineProps({
  tabs: { type: Array, required: true },
  active: { type: String, required: true },
})
defineEmits(['select'])
</script>

<template>
  <nav
    role="tablist"
    class="flex shrink-0 items-stretch gap-1 border-t border-[var(--line)] px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur bg-[color-mix(in_srgb,var(--bg)_82%,transparent)]"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      :aria-selected="active === tab.id"
      :aria-label="tab.label"
      class="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 py-1.5 outline-none"
      @click="$emit('select', tab.id)"
    >
      <span
        class="flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150"
        :class="active === tab.id ? 'bg-[var(--accent)]' : 'bg-transparent'"
      >
        <component
          :is="tab.icon"
          class="h-[22px] w-[22px]"
          :class="active === tab.id ? 'text-[var(--accent-ink)]' : 'text-[var(--text-muted)]'"
          :stroke-width="active === tab.id ? 2.4 : 2"
        />
      </span>
      <span
        class="whitespace-nowrap text-[0.6875rem] font-medium leading-none"
        :class="active === tab.id ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'"
      >{{ tab.label }}</span>
    </button>
  </nav>
</template>
