<script setup>
import { computed, ref } from 'vue'
import { Check } from 'lucide-vue-next'
import BottomSheet from '../components/BottomSheet.vue'
import ModulePassport from '../components/energy/ModulePassport.vue'
import WeekRows from '../components/growth/WeekRows.vue'
import CurrentWeekCard from '../components/growth/CurrentWeekCard.vue'
import DaysByPlan from '../components/daily/DaysByPlan.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { useMiniStore } from '../composables/useMiniStore.js'
import { computeEnergy } from '../composables/energyModel.js'
import { todayISO } from '../composables/miniModel.js'
import { isLocked } from '../i18n/energy.js'
import { HEAD, LEVEL_ROWS } from '../i18n/growth247.js'
import { plural } from '../i18n/format.js'
import { monthOf } from '../i18n/format.js'

// «Прогресс» — страница состояния, а не витрина системы.
//
// Образец — страница расхода в Claude: прозрачно, полосами, без лишних слов.
// Экран закрывает названный пробел: владелец не видит, что вносить нужно
// каждый день, не видит своих пропусков и не понимает, почему следующая
// неделя закрыта.
//
// Сверху вниз: идущая неделя · «Важно» (когда есть повод) · недели месяца ·
// дни месяца сводкой · что уже работает.
//
// ⚠ Роли разведены жёстко: «Прогресс» — про НЕДЕЛИ и месяц, «Контроль Дня» —
// про ДНИ. Здесь видно, как сложились недели и чем они закрыты; сами дни,
// их таблица и единственная в приложении форма ввода живут там. Любая кнопка
// отсюда, зовущая внести день, уводит туда вместе с датой. Пока ввод стоял
// в обоих местах, человек не заходил в «Контроль Дня» вовсе и не видел,
// куда встала внесённая цифра.
//
// Статус с дорогой ступеней уехал на «Сигналы» — там разговор
// о том, чем усилить завтрашний день. Числа системы («Растём вместе») уехали
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

// ⚠ Ввода на этой странице нет ни одного. Любая кнопка, зовущая внести день,
// уводит в «Контроль Дня» — вместе с самим днём, чтобы форма открылась там
// уже на нужной дате.
//
// Раньше форма открывалась шторкой прямо здесь, и получалось два входа в одно
// действие: человек вносил цифру, не видел, куда она встала, и в раздел,
// сделанный ровно для дней, не заходил вовсе. Разделение теперь жёсткое —
// «Прогресс» про недели и месяц, «Контроль Дня» про дни; переход между ними
// в одну сторону и всегда с адресом.
//
// Не наступивший день не открывается: выручки за завтра не существует,
// и поле под неё — предложение её выдумать.
function openDay(iso) {
  if (iso && iso > today.value) return
  emit('go', 'day', { day: iso || '', anchor: 'hero' })
}

// Тап по неделе — посмотреть её в «Контроле Дня»: экран откроет именно эту
// неделю и подведёт к ней прокрутку. Ввода здесь по-прежнему нет.
function openWeek(idx) {
  emit('go', 'day', { week: idx, anchor: `week-${idx}` })
}
const energy = computed(() => computeEnergy(state, m.value))
const rated = computed(() => state.razborRating !== null && state.razborRating !== undefined)
const today = computed(() => todayISO())

// Заголовок списка недель называет месяц, о котором он говорит: «недели
// месяца» на закрытом августе читались бы как недели текущего календаря.
// Идущую неделю держит `CurrentWeekCard` — он же решает, что показывать,
// когда текущей недели в месяце нет.
// «Август 2026» — месяц приложения полностью, с годом: закрытый месяц
// в январе иначе читается как текущий.
const monthTitleFull = computed(() => (m.value
  ? `${monthOf(m.value.month)} ${m.value.month.slice(0, 4)}`
  : ''))

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
    <!-- Месяц, о котором идёт речь. Заголовок «Прогресс» не отвечает на вопрос
         «прогресс чего и когда», а недели без месяца читаются календарём
         устройства. Бабл стоит под заголовком и держит ответ одной строкой —
         это подпись к экрану, а не элемент управления. -->
    <div class="mb-3 flex justify-center">
      <span
        class="font-label inline-flex items-center rounded-full px-3 py-1 text-[0.75rem] uppercase text-[var(--text-secondary)]"
        :style="{ background: 'var(--surface-2)', '--caps-track': '0.1em' }"
      ><span class="gr-caps">{{ monthTitleFull }}</span></span>
    </div>

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

    <!-- 3 · Недели месяца -->
    <div class="mt-4">
      <WeekRows :m="m" :today="today" :month-title="weeksTitle" @week="openWeek" />
    </div>

    <!-- 4 · Дни по плану — тот же блок, что в сводке «Контроля Дня».
         Ссылки на него нет намеренно: он сам и есть ответ, а вход в дни
         стоит выше, у недели. Дублирования нет — компонент один. -->
    <section v-if="m.dayStats" class="mt-5">
      <DaysByPlan :stats="m.dayStats" standalone />
    </section>

    <!-- 5 · Что уже работает. Таблица вернулась сюда с «Сигналов»: она
         отвечает не «что взять дальше», а «что у меня есть», и это состояние. -->
    <section class="mt-5">
      <h2 class="text-[0.8125rem] font-bold uppercase tracking-wide text-[var(--text-muted)]">
        {{ HEAD.access }}
      </h2>
      <ul class="mt-2 overflow-hidden rounded-2xl bg-[var(--surface)]">
        <li v-for="r in LEVEL_ROWS" :key="r.id" class="border-b border-[var(--line)] last:border-b-0">
          <component
            :is="r.module ? 'button' : 'div'"
            :type="r.module ? 'button' : null"
            class="flex min-h-[48px] w-full items-center gap-3 px-4 py-2.5 text-left"
            @click="r.module ? moduleOpen = r.module : null"
          >
            <span
              v-if="r.has"
              class="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full"
              :style="{ background: 'var(--positive)' }"
              aria-hidden="true"
            >
              <Check class="h-[13px] w-[13px]" :style="{ color: 'var(--ink-on-color)' }" :stroke-width="3" />
            </span>
            <span
              v-else
              class="h-[20px] w-[20px] shrink-0 rounded-full border-2"
              :style="{ borderColor: 'var(--line)' }"
              aria-hidden="true"
            ></span>
            <span class="min-w-0 flex-1 text-[0.9375rem] leading-snug text-[var(--text)]">{{ r.what }}</span>
            <span
              v-if="!r.has"
              class="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide"
              :style="{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }"
            >{{ r.by }}</span>
          </component>
        </li>
      </ul>
    </section>

    <SiteFooter />

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
