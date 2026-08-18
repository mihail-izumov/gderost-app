<script setup>
import { computed, ref } from 'vue'
import BottomSheet from '../components/BottomSheet.vue'
import ModulePassport from '../components/energy/ModulePassport.vue'
import AddReportForm from '../components/AddReportForm.vue'
import WeekRows from '../components/growth/WeekRows.vue'
import CurrentWeekCard from '../components/growth/CurrentWeekCard.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { computeEnergy } from '../composables/energyModel.js'
import { todayISO } from '../composables/miniModel.js'
import { isLocked } from '../i18n/energy.js'
import { HEAD } from '../i18n/growth247.js'
import { plural } from '../i18n/format.js'
import { monthOf } from '../i18n/format.js'

// «Прогресс» — страница состояния, а не витрина системы.
//
// Образец — страница расхода в Claude: прозрачно, полосами, без лишних слов.
// Экран закрывает названный пробел: владелец не видит, что вносить нужно
// каждый день, не видит своих пропусков и не понимает, почему следующая
// неделя закрыта.
//
// Сверху вниз: идущая неделя · «Важно» (когда есть повод) · недели месяца.
// Порядок правился 18.08: повод стоял первым и перебивал собой главное —
// сколько дней у человека есть и что внести сегодня.
//
// ⚠ Разговора о ступенях здесь больше нет. Статус с дорогой и таблица «что
// уже работает» уехали на «Сигналы», где идёт разговор о том, чем усилить
// завтрашний день; страница состояния осталась целиком про свои цифры.
// Числа системы («Растём вместе») уехали
// на «Ультру»: они отвечают на вопрос «кто вы такие», а он возникает там,
// где идёт разговор о работе команды. Здесь человек смотрит свои дни, а не
// наши, и страница целиком принадлежит ему.
//
// ⚠ Замок недели снимается вводом данных и никогда оплатой. Продавать снятие
// собственного замка нельзя: сначала создать препятствие, потом взять за него
// деньги — ровно то, за что метод ругает чужие калькуляторы. Разбор открывает
// не неделю, а глубину, и это стоит строкой в таблице «что уже работает».

const emit = defineEmits(['go'])

const store = useMiniStore()
const state = store.state
const m = store.model

const moduleOpen = ref('')
// Ввод дня открывается прямо здесь: человек смотрит на свои недели, и уводить
// его на другой экран ради одной цифры значит терять место, куда он смотрел.
const dayOpen = ref(false)
const dayPick = ref('')
// ⚠ Форма ввода не открывается на не наступивший день. Выручки за завтра
// не существует, и открытое поле под неё — предложение её выдумать. Раньше
// защита стояла только на том, что будущая неделя не даёт ссылки; любой
// другой вход (кнопка повода, главный блок) её обходил.
function openDay(iso) {
  if (iso && iso > today.value) return
  dayPick.value = iso || ''
  dayOpen.value = true
}
const energy = computed(() => computeEnergy(state, m.value))
const rated = computed(() => state.razborRating !== null && state.razborRating !== undefined)
const today = computed(() => todayISO())

// Заголовок списка недель называет месяц, о котором он говорит: «недели
// месяца» на закрытом августе читались бы как недели текущего календаря.
// Идущую неделю держит `CurrentWeekCard` — он же решает, что показывать,
// когда текущей недели в месяце нет.
const weeksTitle = computed(() => (m.value ? `Недели ${monthOf(m.value.month)}` : 'Недели месяца'))

// Повод-плашка. Есть пропуски в прошедших неделях — говорим о них и даём
// кнопку; повода нет — плашки нет. Пустая плашка «всё хорошо» приучает
// не читать это место вовсе.
const reason = computed(() => {
  if (!m.value) return null
  const blocked = m.value.weeks.find((w) => !w.open)
  if (blocked && blocked.blockedBy) {
    const n = blocked.blockedBy.days.length
    return {
      text: `В неделе ${blocked.blockedBy.idx} нет цифр за ${n} ${plural(n, 'день', 'дня', 'дней')}. Следующая неделя откроется, когда внесёте.`,
      iso: blocked.blockedBy.iso[0],
    }
  }
  const gap = m.value.weeks.find((w) => w.missing > 0)
  if (gap) {
    const n = gap.missing
    return {
      text: `Не внесено ${n} ${plural(n, 'день', 'дня', 'дней')}: ${gap.missingDays.join(', ')}.`,
      iso: gap.missingISO[0],
    }
  }
  return null
})
</script>

<template>
  <div v-if="m" class="w-full px-4 pb-4">
    <!-- 1 · Идущая неделя — главный блок экрана. Стоит первым: человек
         приходит сюда с вопросом «сколько дней у меня есть и что внести
         сегодня», и ответ обязан быть раньше всего остального. -->
    <CurrentWeekCard :m="m" :today="today" @enter="openDay" />

    <!-- 2 · Важно. Повод стоит под статусом и подписан как раздел: сверху
         он перебивал главный блок и читался ошибкой приложения, а не
         состоянием данных. Заголовка без повода не бывает — пустой раздел
         «Важно» приучает не читать это место вовсе. -->
    <section v-if="reason" class="mt-5">
      <h2 class="mb-2 text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
        {{ HEAD.important }}
      </h2>
      <div
        class="rounded-2xl border p-3.5"
        :style="{ borderColor: 'var(--warning)', background: 'var(--surface)' }"
      >
        <p class="text-[0.875rem] leading-snug text-[var(--text)]">{{ reason.text }}</p>
        <!-- Кнопка жёлтая, как и плашка вокруг неё: жёлтый в системе означает
             меру и незавершённость, а тут именно она — данных не хватает.
             Синий отсюда убран: он рассказывал бы про обычное действие. -->
        <button
          type="button"
          class="mt-2.5 min-h-[44px] w-full rounded-xl text-[0.9375rem] font-bold"
          :style="{ background: 'var(--warning)', color: 'var(--accent-ink)' }"
          @click="openDay(reason.iso)"
        >Внести</button>
      </div>
    </section>

    <!-- 4 · Недели месяца -->
    <div class="mt-4">
      <WeekRows :m="m" :today="today" :month-title="weeksTitle" @enter="openDay" />
    </div>

    <SiteFooter />

    <BottomSheet :open="dayOpen" @close="dayOpen = false">
      <AddReportForm :preset="dayPick" @done="dayOpen = false" />
    </BottomSheet>

    <BottomSheet :open="!!moduleOpen" @close="moduleOpen = ''">
      <ModulePassport
        :module-id="moduleOpen"
        :energy="energy"
        :locked="isLocked(moduleOpen, rated)"
        :rated="rated"
        @close="moduleOpen = ''"
      />
    </BottomSheet>
  </div>
</template>
