<script setup>
import { computed, ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import BottomSheet from '../components/BottomSheet.vue'
import ModulePassport from '../components/energy/ModulePassport.vue'
import ConnectBusinessModal from '../components/business/ConnectBusinessModal.vue'
import BrandLockup from '../components/BrandLockup.vue'
import Telemetry from '../components/growth/Telemetry.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { computeEnergy } from '../composables/energyModel.js'
import { isLocked } from '../i18n/energy.js'
import { ULTRA } from '../i18n/ultra.js'

// «Ультра» — верхняя комплектация линейки.
//
// Экран собран по общему лекалу разделов: крупный заголовок отдаёт оболочка
// (он же уезжает в липкую полосу при прокрутке), содержимое идёт секциями
// в один столбец с теми же отступами, что на «Прогрессе» и «Сигналах».
// Своей вёрстки у страницы нет — раздел, набранный по-своему, читается чужим
// приложением, даже когда каждый его блок по отдельности хорош.
//
// Прописной набор во всю ширину сюда не переехал: это голос витрины,
// а внутри приложения говорит интерфейс. Обещание «через 30 дней бизнес
// растёт по плану» отменено на входе Трека как обещание платформы, которому
// там не место (`docs/ВИТРИНА-вход.md` §5); здесь у него адрес — за ним стоит
// работа команды, а не приложение.
//
// Ничего нового экран не выдумывает. Состав ступени живёт в паспорте — том же
// компоненте и тех же данных, что открываются с «Прогресса». Второго описания
// одной услуги в приложении не заводится.
//
// «Растём вместе» переехало сюда с «Прогресса» целиком. Причина: числа системы
// отвечают на вопрос «кто вы такие», а он возникает там, где идёт разговор
// о работе команды. На странице собственного состояния он звучал в чужом
// месте — человек пришёл смотреть свои дни, а не наши.

const store = useMiniStore()
const energy = computed(() => computeEnergy(store.state, store.model.value))
const rated = computed(() => store.state.razborRating !== null && store.state.razborRating !== undefined)

const passportOpen = ref(false)
const connectOpen = ref(false)
</script>

<template>
  <div class="px-4 pb-2 pt-7">
    <!-- Знак марки страницы. Плашка называет комплектацию, о которой идёт
         речь: связка со словом «ТРЕК» назвала бы здесь не тот продукт,
         а шеврон отдельной картинкой перестал бы быть знаком марки. -->
    <div class="flex justify-center">
      <BrandLockup size="1.75rem" edition="УЛЬТРА" />
    </div>

    <!-- Обещание и абзац под ним стоят по центру, под заголовком: это одна
         речь на три строки, и левый край разложил бы её на три отдельных
         сообщения. Ниже, с плашки, выключка возвращается к левой — там
         начинается интерфейс, а не речь.

         Воздуха здесь больше, чем на рабочих разделах, и это не украшение:
         страница не про работу с цифрами, а про обещание, и обещание, зажатое
         между заголовком и синей плашкой, читается пунктом списка. -->
    <p class="mt-6 text-center text-[1.5rem] font-bold leading-tight tracking-tight text-[var(--text)]">
      {{ ULTRA.promiseLine1 }}<br>{{ ULTRA.promiseLine2 }}
    </p>
    <p class="mx-auto mt-4 max-w-[22rem] text-center text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
      {{ ULTRA.body }}
    </p>

    <!-- Вход в паспорт ступени. Подписан тем, что человек получает, а не
         именем режима: имя он прочитает внутри, когда решит посмотреть. -->
    <button
      type="button"
      class="mt-7 flex w-full items-center gap-3.5 rounded-[22px] p-4 text-left"
      :style="{ background: 'var(--action)', color: 'var(--ink-on-color)' }"
      @click="passportOpen = true"
    >
      <span class="min-w-0 flex-1 text-[1.0625rem] font-bold leading-tight">
        {{ ULTRA.bannerLine1 }}<br>{{ ULTRA.bannerLine2 }}
      </span>
      <ChevronRight
        class="h-5 w-5 shrink-0"
        :style="{ color: 'var(--ink-on-color)' }"
        :stroke-width="2.5"
        aria-hidden="true"
      />
    </button>

    <!-- Числа системы: сперва про то, что делает команда, потом чем это
         подтверждено. -->
    <div class="mt-5">
      <Telemetry @connect="connectOpen = true" />
    </div>

    <SiteFooter />

    <ConnectBusinessModal :open="connectOpen" @close="connectOpen = false" />

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
