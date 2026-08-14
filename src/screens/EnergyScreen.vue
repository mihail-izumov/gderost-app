<script setup>
import { computed, ref } from 'vue'
import { Check, ChevronRight, Target } from 'lucide-vue-next'
import ConnectProgress from '../components/energy/ConnectProgress.vue'
import EnergyBreakdown from '../components/energy/EnergyBreakdown.vue'
import ModulePassport from '../components/energy/ModulePassport.vue'
import SessionRail from '../components/energy/SessionRail.vue'
import RateRazborSheet from '../components/energy/RateRazborSheet.vue'
import BootcampBanner from '../components/energy/BootcampBanner.vue'
import RequestList from '../components/energy/RequestList.vue'
import BottomSheet from '../components/BottomSheet.vue'
import StoryOnboarding from '../components/StoryOnboarding.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { computeEnergy } from '../composables/energyModel.js'
import { ENTITY_STORY } from '../i18n/stories.js'

// «Буткемп» — вкладка, на которой человек видит, где он на дороге и чем эта
// дорога проходится.
//
// Экран стоит на одном развороте: плашка юнита с процентом, вход в цели
// и планы, лента сессий с переключателем «Сессии / Мои старты», баннер
// буткемпа. Всё остальное живёт в шторках и открывается оттуда, где о нём
// зашла речь.
//
// Карточек четырёх сущностей здесь больше нет. Уровни `N / 20` были видимой
// частью формулы, но экран от них читался вторым дашбордом: те же четыре
// числа, что на «Сегодня», плюс механика, которую надо изучать. Процент
// остался на месте и считается по той же формуле, состав открывается
// с самого числа. Расстояния между величинами уехали в «Цели и планы» —
// туда, где эти величины и правятся.
//
// Числа владельца на экране есть — значит и тон обычный: экран сообщает
// состояние и не объясняет себя абзацами.

const emit = defineEmits(['go'])

const store = useMiniStore()
const m = store.model
const state = store.state

const energy = computed(() => computeEnergy(state, m.value))

// Сессии открываются отметкой о состоявшемся разборе. Проверить её нечем,
// и заказ всё равно проходит через живого человека — отметка открывает
// возможность заказать, а не сам продукт. Отметить можно только в паспорте
// самого разбора: на чужих карточках эта кнопка читалась как отмычка.
const unlocked = computed(() => state.razborRating !== null && state.razborRating !== undefined)

const breakdownOpen = ref(false)
const rateOpen = ref(false)
const moduleOpen = ref('')
const storyOpen = ref(false)
// Лента показывает либо товар, либо своё: два списка об одном и том же,
// и переключатель дешевле второго заголовка с пустым разделом под ним.
const railMode = ref('sessions')

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

    <!-- Вход в цели и планы: числа, на которых стоит весь экран, правятся там,
         и путь до них с этой вкладки был через две другие. -->
    <button
      type="button"
      class="mt-2.5 flex min-h-[52px] w-full items-center gap-2.5 rounded-2xl bg-[var(--surface)] px-4 text-left"
      @click="emit('go', 'goals')"
    >
      <Target class="h-[18px] w-[18px] shrink-0 text-[var(--text-muted)]" :stroke-width="2" aria-hidden="true" />
      <span class="min-w-0 flex-1 text-[0.9375rem] font-semibold text-[var(--text)]">Изменить цели и планы</span>
      <ChevronRight class="h-[18px] w-[18px] shrink-0 text-[var(--text-muted)]" :stroke-width="2.5" aria-hidden="true" />
    </button>

    <!-- Переключатель режимов ленты вместо заголовка «Сессии». -->
    <div class="mb-2 mt-4 inline-flex rounded-full bg-[var(--surface-2)] p-[3px]">
      <button
        v-for="t in [{ id: 'sessions', label: 'Сессии' }, { id: 'mine', label: 'Мои старты' }]"
        :key="t.id"
        type="button"
        class="min-h-[36px] rounded-full px-3.5 text-[0.8125rem] font-semibold transition-colors"
        :style="railMode === t.id
          ? { background: 'var(--surface)', color: 'var(--text)' }
          : { color: 'var(--text-muted)' }"
        :aria-pressed="railMode === t.id ? 'true' : 'false'"
        @click="railMode = t.id"
      >{{ t.label }}</button>
    </div>

    <SessionRail
      v-if="railMode === 'sessions'"
      :energy="energy"
      :unlocked="unlocked"
      :requests="state.requests"
      :rated="unlocked"
      @open="openModule"
    />
    <RequestList v-else :requests="state.requests" @open="openModule" />

    <BootcampBanner class="mt-2.5" :ready="unlocked" @open="openModule('bootcamp')" />

    <!-- Отметка разбора появляется только после самой оценки. У человека,
         который открыл ссылку впервые, разбора не было — приглашение оценить
         его шумело бы ровно там, где продаётся первый разбор. -->
    <button
      v-if="unlocked"
      type="button"
      class="mt-2.5 flex min-h-[52px] w-full items-center justify-between gap-3 rounded-2xl bg-[var(--surface)] px-4 text-left"
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

    <!-- Сущности объясняются сторис, а не абзацем на экране. -->
    <button
      type="button"
      class="mx-auto mt-3 flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-medium text-[var(--text-muted)]"
      @click="storyOpen = true"
    >
      Что такое факт, прогноз, план и цель
    </button>

    <SiteFooter />

    <BottomSheet :open="breakdownOpen" @close="breakdownOpen = false">
      <EnergyBreakdown :energy="energy" @close="breakdownOpen = false" />
    </BottomSheet>

    <BottomSheet :open="!!moduleOpen" @close="moduleOpen = ''">
      <ModulePassport
        :module-id="moduleOpen"
        :energy="energy"
        :locked="moduleOpen !== 'razbor' && !unlocked"
        :rated="unlocked"
        @rate="fromModuleToRate"
        @close="moduleOpen = ''"
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
