<script setup>
import { computed, ref } from 'vue'
import { Check, Info } from 'lucide-vue-next'
import ConnectProgress from '../components/energy/ConnectProgress.vue'
import EnergyBreakdown from '../components/energy/EnergyBreakdown.vue'
import EntityLadder from '../components/energy/EntityLadder.vue'
import ModulePassport from '../components/energy/ModulePassport.vue'
import SessionRail from '../components/energy/SessionRail.vue'
import RateRazborSheet from '../components/energy/RateRazborSheet.vue'
import BootcampBanner from '../components/energy/BootcampBanner.vue'
import RequestList from '../components/energy/RequestList.vue'
import BottomSheet from '../components/BottomSheet.vue'
import StoryOnboarding from '../components/StoryOnboarding.vue'
import ShareMonthButton from '../components/ShareMonthButton.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { computeEnergy, computeGaps } from '../composables/energyModel.js'
import { ENTITY_STORY } from '../i18n/stories.js'

// «Буткемп» — вкладка, на которой человек видит, на чём стоят его числа
// и чем каждое из них поднимается.
//
// Экран стоит на одном развороте: плашка, четыре карты, лента сессий, баннер
// буткемпа, отметка разбора и одна кнопка. Всё остальное живёт в шторках
// и открывается оттуда, где о нём зашла речь. Шторки общего вида —
// свайп вниз, кнопка внизу. Объяснение сущностей — сторис по запросу.
//
// Числа владельца на экране есть — значит и тон обычный: экран сообщает
// состояние и не объясняет себя абзацами.

const store = useMiniStore()
const m = store.model
const state = store.state

const energy = computed(() => computeEnergy(state, m.value))
const gaps = computed(() => computeGaps(m.value))

// Сессии открываются отметкой о состоявшемся разборе. Проверить её нечем,
// и заказ всё равно проходит через живого человека — отметка открывает
// возможность заказать, а не сам продукт.
const unlocked = computed(() => state.razborRating !== null && state.razborRating !== undefined)

const breakdownOpen = ref(false)
const rateOpen = ref(false)
const moduleOpen = ref('')
const storyOpen = ref(false)

function openModule(id) {
  moduleOpen.value = id
}
function fromModuleToRate() {
  moduleOpen.value = ''
  rateOpen.value = true
}
// Финал сторис ведёт к составу энергии: «Проверить свой уровень» — не совет,
// а дверь к числу, которое уже посчитано.
function storyDone() {
  storyOpen.value = false
  breakdownOpen.value = true
}
</script>

<template>
  <div v-if="m" class="w-full px-4 pb-4">
    <ConnectProgress
      :unit="state.unit || state.company"
      :pct="energy.pct"
      :level-id="energy.level.id"
      @info="breakdownOpen = true"
    />

    <EntityLadder class="mt-3" :model="m" :energy="energy" :gaps="gaps" @module="openModule" />

    <!-- Сущности объясняются сторис, а не абзацем на экране. -->
    <button
      type="button"
      class="mx-auto mt-2 flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-medium text-[var(--text-muted)]"
      @click="storyOpen = true"
    >
      <Info class="h-4 w-4" :stroke-width="2" aria-hidden="true" />
      Что такое факт, прогноз, план и цель
    </button>

    <h2 class="mb-2 mt-3 text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
      Сессии
    </h2>
    <SessionRail :energy="energy" :unlocked="unlocked" @open="openModule" />

    <BootcampBanner class="mt-2.5" @open="openModule('bootcamp')" />

    <!-- Отправленные заявки. Раздела нет, пока нет ни одной: пустой список
         «здесь появятся ваши заявки» ничего не сообщает и занимает экран. -->
    <RequestList :requests="state.requests" @open="openModule" />

    <!-- Отметка разбора появляется только после самой оценки. У человека,
         который открыл ссылку впервые, разбора не было — приглашение оценить
         его шумело бы ровно там, где продаётся первый разбор, и раскрывало
         механику замка раньше времени. Вход в оценку для клиента живёт
         в запертом паспорте сессии — там, где замок и стоит. -->
    <button
      v-if="unlocked"
      type="button"
      class="mt-2.5 flex min-h-[52px] w-full items-center justify-between gap-3 rounded-2xl border border-[var(--rim)] bg-[var(--surface)] px-4 text-left"
      @click="rateOpen = true"
    >
      <span class="flex min-w-0 items-center gap-2.5">
        <Check class="h-[18px] w-[18px] shrink-0" :style="{ color: 'var(--positive)' }" :stroke-width="2.5" aria-hidden="true" />
        <span class="min-w-0">
          <span class="block text-[0.9375rem] font-semibold text-[var(--text)]">
            Разбор оценён: {{ state.razborRating }} из 10
          </span>
          <span class="block truncate text-[0.75rem] text-[var(--text-muted)]">Сессии открыты</span>
        </span>
      </span>
      <span class="shrink-0 text-[0.8125rem] font-medium" :style="{ color: 'var(--action)' }">Изменить</span>
    </button>

    <ShareMonthButton class="mt-4" tone="accent" label="Поделиться" />

    <SiteFooter />

    <BottomSheet :open="breakdownOpen" @close="breakdownOpen = false">
      <EnergyBreakdown :energy="energy" @close="breakdownOpen = false" />
    </BottomSheet>

    <BottomSheet :open="!!moduleOpen" @close="moduleOpen = ''">
      <ModulePassport
        :module-id="moduleOpen"
        :energy="energy"
        :locked="moduleOpen !== 'razbor' && !unlocked"
        @rate="fromModuleToRate"
      />
    </BottomSheet>

    <BottomSheet :open="rateOpen" @close="rateOpen = false">
      <RateRazborSheet @close="rateOpen = false" />
    </BottomSheet>

    <StoryOnboarding
      :open="storyOpen"
      :slides="ENTITY_STORY"
      @close="storyOpen = false"
      @done="storyDone"
    />
  </div>
</template>
