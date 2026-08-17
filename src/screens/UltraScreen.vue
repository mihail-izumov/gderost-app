<script setup>
import { computed, ref } from 'vue'
import HeroBlock from '../components/HeroBlock.vue'
import BottomSheet from '../components/BottomSheet.vue'
import ModulePassport from '../components/energy/ModulePassport.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { computeEnergy } from '../composables/energyModel.js'
import { MODULES, isLocked } from '../i18n/energy.js'
import { ULTRA } from '../i18n/ultra.js'

// «Ультра» — верхняя комплектация линейки, показанная тем же блоком, каким
// говорит витрина: крупная фраза прописными и подпись категории под ней.
// Блок общий (`HeroBlock`), поэтому кегль, интерлиньяж и разгонка здесь
// те же, что на входе, и правка одного места доезжает до обоих.
//
// Знака продукта над фразой нет. Внутри приложения имя «Ранскейл Трек»
// не печатается нигде: человек уже внутри, и вывеска над головой ему больше
// ничего не сообщает. Здесь она сообщала бы вдобавок неверное — страница
// про верхнюю ступень, а не про Трек.
//
// Фраза «через 30 дней бизнес растёт по плану» отменена на входе как обещание
// платформы, которому там не место (`docs/ВИТРИНА-вход.md` §5). Здесь это
// ровно её адрес: страница верхней комплектации и есть то место, где обещание
// платформы законно.
//
// Ничего нового экран не выдумывает. Ниже блока стоит паспорт ступени —
// тот же самый компонент и те же данные, что открываются шторкой с «Сигналов»
// и с «Прогресса». Второго описания одной услуги в приложении не заводится.

const store = useMiniStore()
const energy = computed(() => computeEnergy(store.state, store.model.value))
const rated = computed(() => store.state.razborRating !== null && store.state.razborRating !== undefined)

const passportOpen = ref(false)
const mod = MODULES.runscale
</script>

<template>
  <div class="flex flex-col gap-6 px-1 pb-6">
    <HeroBlock :lines="ULTRA.hero" :tagline="ULTRA.tagline" :max-px="64" />

    <p class="text-center text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
      {{ ULTRA.body }}
    </p>

    <!-- Вход в паспорт: состав, скорость, расход и заказ живут там и только
         там. Кнопка называет, что откроется, а не зовёт «узнать больше». -->
    <button
      type="button"
      class="flex w-full items-center gap-3.5 rounded-[22px] p-4 text-left"
      :style="{ background: 'var(--action)', color: 'var(--ink-on-color)' }"
      @click="passportOpen = true"
    >
      <span class="min-w-0 flex-1">
        <span class="block text-[1.0625rem] font-bold leading-tight">{{ mod.title }}</span>
        <span class="mt-1 block text-[0.8125rem] leading-snug">{{ mod.subtitle }}</span>
      </span>
    </button>

    <SiteFooter />

    <BottomSheet :open="passportOpen" @close="passportOpen = false">
      <ModulePassport
        module-id="runscale"
        :energy="energy"
        :locked="isLocked('runscale', rated)"
        :rated="rated"
        @close="passportOpen = false"
      />
    </BottomSheet>
  </div>
</template>
