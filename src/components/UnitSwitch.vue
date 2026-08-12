<script setup>
// Переключатель точек. Слот один, второй виден и заперт честно: возможность
// показана как возможность, а не имитируется живой кнопкой, за которой пусто.
defineProps({
  company: { type: String, default: '' },
  unit: { type: String, default: '' },
})
</script>

<template>
  <div class="flex gap-2">
    <div class="min-w-0 flex-1 rounded-xl border border-[var(--text)] bg-[var(--surface)] px-3 py-2">
      <div class="truncate text-[0.9375rem] font-semibold leading-tight text-[var(--text)]">
        {{ unit || company || 'Ваш бизнес' }}
      </div>
      <div class="truncate text-[0.75rem] text-[var(--text-muted)]">
        {{ unit && company ? company : 'единственная точка' }}
      </div>
    </div>

    <div class="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]">
      <div class="px-3 py-2 blur-[3px]" aria-hidden="true">
        <div class="text-[0.9375rem] font-semibold leading-tight text-[var(--text-muted)]">Вторая точка</div>
        <div class="text-[0.75rem] text-[var(--text-muted)]">ещё один месяц</div>
      </div>
      <div class="absolute inset-0 flex items-center justify-center px-2 text-center">
        <span class="text-[0.75rem] font-medium leading-snug text-[var(--text-secondary)]">
          Вторая точка —<br>в полной версии
        </span>
      </div>
    </div>
  </div>
</template>
