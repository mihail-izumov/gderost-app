<script setup>
import { ref, computed } from 'vue'
import StatusChip from './StatusChip.vue'
import { DOW_RU } from '../composables/miniModel.js'
import { useMiniStore } from '../composables/useMiniStore.js'
import {
  WEEK_SHAPES, shapeById, shapeStatus, calibrateFromDays, observationsByDow, OBS_FOR_DATA,
} from '../data/weekShape.js'

// Форма недели — то, чем остаток плана разносится по дням. Пока она не подписана
// на экране, приложение молча выдаёт допущение за знание: человек видит требование
// на день и не догадывается, что все дни посчитаны равными.
//
// Поэтому здесь всегда видно три вещи: какая форма сейчас, откуда она взялась
// и как сделать её своей. Пересчёт по собственным данным не срабатывает сам —
// он предлагается, потому что переписать руками поставленные веса без спроса
// значит отменить решение человека за него.

const store = useMiniStore()
const state = store.state

const open = ref(false)

const current = computed(() => shapeById(state.shape_id))
const obsByDow = computed(() => observationsByDow(state.days))
const calibration = computed(() => calibrateFromDays(state.days))
const status = computed(() => shapeStatus(state.coef_src, state.days.length, state.shape_id))

// Сколько дней недели ещё не набрали нужного числа наблюдений.
const dowShort = computed(() => obsByDow.value.filter((c) => c < OBS_FOR_DATA).length)

const title = computed(() => {
  if (state.coef_src === 'data') return 'Посчитана по вашим дням'
  if (state.coef_src === 'user') return 'Ваши веса'
  return current.value.name
})

// Полоски: длина относительно самого сильного дня недели.
const maxCoef = computed(() => Math.max(...state.dow_coef.map(Number), 0.01))

function pickShape(s) {
  store.setWeekShape([...s.coef], 'preset', s.id)
}

function bump(i, delta) {
  const next = state.dow_coef.map(Number)
  next[i] = Math.max(0.1, Math.min(3, Math.round((next[i] + delta) * 100) / 100))
  store.setWeekShape(next, 'user', state.shape_id)
}

function applyCalibration() {
  if (!calibration.value) return
  store.setWeekShape(calibration.value.coef, 'data', state.shape_id)
}
</script>

<template>
  <section class="rounded-2xl border border-[var(--rim)] bg-[var(--surface)] p-4">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h2 class="text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Форма недели
          </h2>
          <StatusChip :kind="status.kind" :title="status.note" />
        </div>
        <p class="mt-1 text-[0.9375rem] font-semibold leading-tight text-[var(--text)]">{{ title }}</p>
        <p class="mt-0.5 text-[0.75rem] leading-snug text-[var(--text-muted)]">{{ status.note }}</p>
      </div>
      <button
        type="button"
        class="min-h-[44px] shrink-0 text-[0.8125rem] font-semibold"
        :style="{ color: 'var(--action)' }"
        @click="open = !open"
      >{{ open ? 'Свернуть' : 'Настроить' }}</button>
    </div>

    <!-- Веса видно всегда: подпись без картинки остаётся словами -->
    <ul class="mt-3 flex items-end gap-1.5" aria-hidden="true">
      <li v-for="(c, i) in state.dow_coef" :key="i" class="flex flex-1 flex-col items-center gap-1">
        <span
          class="w-full rounded-t"
          :style="{ height: (12 + (Number(c) / maxCoef) * 28) + 'px',
                    background: i >= 5 ? 'var(--text-secondary)' : 'var(--line)' }"
        />
        <span class="text-[0.625rem] text-[var(--text-muted)]">{{ DOW_RU[i] }}</span>
      </li>
    </ul>

    <p class="mt-2 text-[0.75rem] leading-snug text-[var(--text-muted)]">
      По этим долям остаток плана разносится по дням: чем выше столбик,
      тем больше приложение ждёт от этого дня.
    </p>

    <div v-if="open" class="mt-4 border-t border-[var(--line)] pt-4">
      <h3 class="text-[0.8125rem] font-medium text-[var(--text-secondary)]">Взять типовую форму</h3>
      <ul class="mt-2 flex flex-col gap-1.5">
        <li v-for="s in WEEK_SHAPES" :key="s.id">
          <button
            type="button"
            class="w-full rounded-xl border px-3 py-2 text-left"
            :style="{
              borderColor: state.shape_id === s.id && state.coef_src === 'preset'
                ? 'var(--text)' : 'var(--line)',
              background: 'var(--surface)',
            }"
            @click="pickShape(s)"
          >
            <span class="block text-[0.9375rem] font-medium leading-tight text-[var(--text)]">{{ s.name }}</span>
            <span class="mt-0.5 block text-[0.75rem] leading-snug text-[var(--text-muted)]">{{ s.hint }}</span>
          </button>
        </li>
      </ul>

      <h3 class="mt-5 text-[0.8125rem] font-medium text-[var(--text-secondary)]">Поправить руками</h3>
      <p class="mt-1 text-[0.75rem] leading-snug text-[var(--text-muted)]">
        Единица — обычный день. Ставьте больше там, где выручка выше.
        Правка останется допущением, пока её не подтвердят ваши данные.
      </p>
      <ul class="mt-2 flex flex-col gap-1">
        <li
          v-for="(c, i) in state.dow_coef" :key="'e' + i"
          class="flex items-center gap-3 rounded-lg px-1 py-0.5"
        >
          <span class="w-7 shrink-0 text-[0.8125rem] font-medium text-[var(--text-secondary)]">
            {{ DOW_RU[i] }}
          </span>
          <span class="flex-1 font-mono text-[0.9375rem] text-[var(--text)]">
            {{ Number(c).toFixed(2).replace('.', ',') }}
          </span>
          <span class="shrink-0 text-[0.6875rem] text-[var(--text-muted)]">
            {{ obsByDow[i] }} из {{ OBS_FOR_DATA }}
          </span>
          <button
            type="button"
            class="h-11 w-11 shrink-0 rounded-lg border border-[var(--line)] text-[1.125rem] text-[var(--text)]"
            @click="bump(i, -0.05)"
          >−</button>
          <button
            type="button"
            class="h-11 w-11 shrink-0 rounded-lg border border-[var(--line)] text-[1.125rem] text-[var(--text)]"
            @click="bump(i, 0.05)"
          >+</button>
        </li>
      </ul>

      <div class="mt-5 rounded-xl bg-[var(--surface-2)] p-3">
        <h3 class="text-[0.8125rem] font-medium text-[var(--text-secondary)]">Посчитать по своим дням</h3>
        <template v-if="calibration">
          <p class="mt-1 text-[0.8125rem] leading-snug text-[var(--text-secondary)]">
            Каждый день недели встретился в вашей выручке достаточно раз.
            Форму можно посчитать вместо того, чтобы предполагать.
          </p>
          <button
            type="button"
            class="mt-2 min-h-[44px] w-full rounded-xl text-[0.9375rem] font-semibold"
            :style="{ background: 'var(--action)', color: 'var(--action-ink)' }"
            @click="applyCalibration"
          >Пересчитать по моим данным</button>
        </template>
        <p v-else class="mt-1 text-[0.8125rem] leading-snug text-[var(--text-muted)]">
          Пока рано: {{ dowShort }} из семи дней недели встретились в ваших данных
          меньше {{ OBS_FOR_DATA }} раз. Вносите дни — форма посчитается сама собой,
          и приложение это предложит.
        </p>
      </div>
    </div>
  </section>
</template>
