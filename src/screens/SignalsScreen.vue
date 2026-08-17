<script setup>
import { computed, ref } from 'vue'
import { Check, ChevronRight } from 'lucide-vue-next'
import ModulePassport from '../components/energy/ModulePassport.vue'
import SessionRail from '../components/energy/SessionRail.vue'
import SignalTodayCard from '../components/energy/SignalTodayCard.vue'
import RateRazborSheet from '../components/energy/RateRazborSheet.vue'
import RequestList from '../components/energy/RequestList.vue'
import BottomSheet from '../components/BottomSheet.vue'
import NumberOriginSheet from '../components/NumberOriginSheet.vue'
import StoryOnboarding from '../components/StoryOnboarding.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { computeEnergy } from '../composables/energyModel.js'
import { computeTodaySignal } from '../composables/signalModel.js'
import { ENTITY_STORY } from '../i18n/stories.js'
import { isLocked } from '../i18n/energy.js'

// «Сигналы» — вкладка предмета торговли.
//
// Ранскеил продаёт точные сигналы, которые приходят вовремя; разборы,
// буткемп и подписка — способы получать их больше и точнее. Имя вкладки
// обязывает: она начинается с сигналов, которые владелец уже получает
// бесплатно, — иначе под вывеской «Сигналы» лежал бы прайс-лист.
//
// Экран сверху вниз: живой сигнал сегодня, вход в цели и планы, лента
// из четырёх ступеней с переключателем «Разборы / Мои старты». Подписка —
// конечная точка ленты: её цена, срок и три месяца живут в паспорте,
// второго экрана у неё нет.
//
// Полоса уровня уехала на «Прогресс»: здесь она дублировала ленту ступеней —
// те же четыре шага в двух видах на одном экране. Вместе с ней уехал и состав
// энергии: расшифровка числа живёт там, где стоит число.
//
// Числа владельца на экране есть — значит и тон обычный: экран сообщает
// состояние и не объясняет себя абзацами.

const emit = defineEmits(['go'])

const store = useMiniStore()
const m = store.model
const state = store.state

const energy = computed(() => computeEnergy(state, m.value))
const signal = computed(() => computeTodaySignal(m.value))

// Серия открывается отметкой о состоявшемся разборе. Проверить её нечем,
// и заказ всё равно проходит через живого человека — отметка открывает
// возможность заказать, а не сам продукт. Отметить можно только в паспорте
// самого разбора: на чужих карточках эта кнопка читалась как отмычка.
const unlocked = computed(() => state.razborRating !== null && state.razborRating !== undefined)

const rateOpen = ref(false)
const moduleOpen = ref('')
const storyOpen = ref(false)
// Происхождение числа: ключ открытой шторки. Механика честной цифры —
// тап по числу показывает, на чём оно стоит.
const originOpen = ref('')
// Лента показывает либо товар, либо своё: два списка об одном и том же,
// и переключатель дешевле второго заголовка с пустым разделом под ним.
const railMode = ref('sessions')

function openModule(id) {
  moduleOpen.value = id
}
// Финал сторис ведёт туда, где стоит уровень: «Проверить свой уровень» —
// не совет, а дверь к числу, которое уже посчитано. Число уехало на страницу
// состояния — дверь уехала за ним.
function storyDone() {
  storyOpen.value = false
  emit('go', 'runscale')
}
</script>

<template>
  <div v-if="m" class="w-full px-4 pb-4">
    <!-- Заголовки разделов разводят экран на два разговора: что у вас сегодня
         и чем это усилить завтра. Без них карточки слипались в одну ленту. -->
    <h2 class="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">Сегодня</h2>

    <!-- Живой сигнал выше товара: полезное вперёд продаваемого. -->
    <SignalTodayCard
      :signal="signal"
      :over="store.monthOver.value"
      @origin="originOpen = $event"
      @go="emit('go', $event)"
      @method="storyOpen = true"
    />

    <h2 class="mb-2 mt-6 text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">Завтра</h2>

    <!-- Переключатель режимов ленты вместо заголовка «Сессии». Во всю ширину:
         узкая пилюля у левого края читалась подписью, а не контролом. -->
    <div class="mb-2 flex w-full rounded-full bg-[var(--surface-2)] p-[3px]">
      <button
        v-for="t in [{ id: 'sessions', label: 'Разборы' }, { id: 'mine', label: 'Мои старты' }]"
        :key="t.id"
        type="button"
        class="min-h-[40px] flex-1 rounded-full px-3.5 text-[0.9375rem] font-semibold transition-colors"
        :style="railMode === t.id
          ? { background: 'var(--surface)', color: 'var(--text)' }
          : { color: 'var(--text-muted)' }"
        :aria-pressed="railMode === t.id ? 'true' : 'false'"
        @click="railMode = t.id"
      >{{ t.label }}</button>
    </div>

    <template v-if="railMode === 'sessions'">
      <SessionRail
        :energy="energy"
        :unlocked="unlocked"
        :requests="state.requests"
        :rated="unlocked"
        @open="openModule"
      />
    </template>
    <RequestList v-else :requests="state.requests" @open="openModule" @rate="rateOpen = true" />

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
          <span class="block truncate text-[0.75rem] text-[var(--text-muted)]">Серия разборов открыта</span>
        </span>
      </span>
      <span class="shrink-0 text-[0.8125rem] font-medium" :style="{ color: 'var(--action)' }">Изменить</span>
    </button>

    <SiteFooter />

    <BottomSheet :open="!!originOpen" @close="originOpen = ''">
      <NumberOriginSheet :origin-key="originOpen" @close="originOpen = ''" />
    </BottomSheet>

    <BottomSheet :open="!!moduleOpen" @close="moduleOpen = ''">
      <ModulePassport
        :module-id="moduleOpen"
        :energy="energy"
        :locked="isLocked(moduleOpen, unlocked)"
        :rated="unlocked"
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
