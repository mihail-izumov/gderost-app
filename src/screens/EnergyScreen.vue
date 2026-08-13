<script setup>
import { computed, ref } from 'vue'
import { Download, Check } from 'lucide-vue-next'
import ConnectProgress from '../components/energy/ConnectProgress.vue'
import EnergyBreakdown from '../components/energy/EnergyBreakdown.vue'
import EntityLadder from '../components/energy/EntityLadder.vue'
import ModulePassport from '../components/energy/ModulePassport.vue'
import ShareMonthButton from '../components/ShareMonthButton.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { computeEnergy, computeGaps } from '../composables/energyModel.js'
import { DRIVERS } from '../i18n/energy.js'
import { saveText } from '../composables/saveFile.js'

// «Энергия» — вкладка, на которой человек видит, на чём стоят его числа.
//
// Правило раздела: у всего здесь есть утилитарная функция. Плашка показывает,
// где он на пути; число посчитано и раскрывается составом; карты дают уровень
// каждой сущности и разрывы между ними; паспорт разбора — устройство, а не
// описание; кнопка собирает файл, с которым идут на разбор.
//
// Числа владельца на экране есть — значит и тон обычный: экран сообщает
// состояние и не объясняет себя абзацами. Прежняя заглушка этого раздела
// состояла из объяснений, потому что показывать ей было нечего.

const store = useMiniStore()
const m = store.model
const state = store.state

const energy = computed(() => computeEnergy(state, m.value))
const gaps = computed(() => computeGaps(m.value))

const breakdownOpen = ref(false)
const saved = ref(false)
const saveFailed = ref(false)

// Тот же файл, что и в «Сегодня»: другой выгрузки у месяца не бывает.
// Здесь он назван по месту — это то, с чем идут на разбор. Запасной путь
// через буфер — как в остальных выгрузках: часть браузеров скачивание
// не даёт, и молчать об этом нельзя.
async function download() {
  if (saveText(store.exportText(), store.exportFileName())) {
    saved.value = true
    saveFailed.value = false
    setTimeout(() => { saved.value = false }, 2500)
    return
  }
  try {
    await navigator.clipboard.writeText(store.exportText())
    saved.value = true
    saveFailed.value = false
    setTimeout(() => { saved.value = false }, 2500)
  } catch {
    saveFailed.value = true
  }
}
</script>

<template>
  <div v-if="m" class="w-full px-4 pb-4">
    <ConnectProgress
      :unit="state.unit || state.company"
      :pct="energy.pct"
      :level-id="energy.level.id"
    />

    <button
      type="button"
      class="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-full text-[0.875rem] font-medium"
      :style="{ color: 'var(--action)' }"
      @click="breakdownOpen = true"
    >
      Из чего сложились {{ energy.pct }}%
    </button>

    <EntityLadder class="mt-1" :model="m" :energy="energy" :gaps="gaps" />

    <!-- Драйверы: ступень, которой в приложении нет. Сказано прямо, потому что
         именно она объясняет, почему план здесь остаётся одним числом. -->
    <section class="mt-4 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
      <h2 class="text-[0.9375rem] font-bold text-[var(--text)]">{{ DRIVERS.title }}</h2>
      <p class="mt-1 text-[0.8125rem] leading-snug text-[var(--text-secondary)]">{{ DRIVERS.lead }}</p>
      <ol class="mt-3 flex flex-col gap-2">
        <li
          v-for="(row, i) in DRIVERS.rows"
          :key="i"
          class="flex gap-2.5 text-[0.8125rem] leading-snug text-[var(--text-secondary)]"
        >
          <span
            class="mt-[2px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[0.625rem] font-bold"
            :style="{ background: 'var(--surface-2)', color: 'var(--text-muted)' }"
          >{{ i + 1 }}</span>
          {{ row }}
        </li>
      </ol>
    </section>

    <div class="mt-4">
      <ModulePassport module-id="razbor" :energy="energy" />
    </div>

    <!-- Ссылка — основной способ отдать месяц: открывается одним касанием
         и показывает те же числа. Файл остаётся рядом для случая, когда месяц
         уходит в чужой разбор насовсем. -->
    <ShareMonthButton class="mt-2" tone="accent" label="Отправить ссылку на месяц" />

    <button
      type="button"
      class="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-[var(--rim)] text-[0.9375rem] font-semibold text-[var(--text)]"
      :style="{ background: 'var(--surface)' }"
      @click="download"
    >
      <Check v-if="saved" class="h-5 w-5" :stroke-width="2.5" aria-hidden="true" />
      <Download v-else class="h-5 w-5" :stroke-width="2" aria-hidden="true" />
      {{ saved ? 'Готово' : 'Собрать файл для разбора' }}
    </button>
    <p v-if="saveFailed" class="mt-2 text-[0.8125rem] leading-snug" :style="{ color: 'var(--negative)' }">
      Браузер не дал сохранить файл и скопировать текст. Откройте приложение в Safari или Chrome.
    </p>

    <SiteFooter />

    <Teleport to="body">
      <div
        v-if="breakdownOpen"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-[var(--scrim)] backdrop-blur-sm"
        role="presentation"
        @click.self="breakdownOpen = false"
      >
        <div class="max-h-[88svh] w-full max-w-[430px] overflow-y-auto rounded-t-2xl bg-[var(--bg)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <EnergyBreakdown :energy="energy" @close="breakdownOpen = false" />
        </div>
      </div>
    </Teleport>
  </div>
</template>
