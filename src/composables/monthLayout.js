// monthLayout.js — ГЕОМЕТРИЯ полосы месяца. Чистый JS, без vue и DOM.
// Перенесено из рабочего Ранскейла без изменений.
//
// ЗАЧЕМ ОТДЕЛЬНЫМ МОДУЛЕМ. Полоса обязана соответствовать числам под ней —
// это не «хорошо бы», а инвариант: если сегмент врёт, виджет вреднее, чем его
// отсутствие. Пока проценты считались внутри шаблона, проверить это было
// нечем — тест мог только читать ширину уже отрисованного элемента и сверять
// со строкой. Расчёт вынесен в функцию: инварианты проверяются на числах,
// компонент их только рендерит.
//
// ИНВАРИАНТЫ (проверяются в scripts/verify-mini.mjs):
//   И-1 scaleMax = max(всех заданных значений) — иначе метка уедет за край;
//   И-2 pct(v) = v / scaleMax × 100 РОВНО, без клампов и округлений;
//   И-3 сегменты непрерывны: gapStart = factPct, gapStart + gapWidth = forecastPct;
//   И-4 порядок позиций совпадает с порядком значений;
//   И-5 значение = scaleMax → позиция ровно 100; значение null → позиция null;
//   И-6 ни одна позиция не выходит за [0, 100].

const num = (v) => (v != null && Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null)

// Позиционирование метки: центр по значению, у самого края — прижать внутрь,
// иначе половина уезжает за обрезку и читается как хвост, торчащий из полосы.
export function markStyle(pct) {
  if (pct == null) return null
  if (pct >= 99.999) return { left: '100%', transform: 'translateX(-100%)' }
  if (pct <= 0.001) return { left: '0%', transform: 'translateX(0)' }
  return { left: `${pct}%`, transform: 'translateX(-50%)' }
}

export function monthLayout(v) {
  const fact = num(v && v.fact)
  const plan = num(v && v.plan)
  const forecast = num(v && v.forecast)
  const goal = num(v && v.goal)

  const present = [fact, plan, forecast, goal].filter((x) => x != null)
  const scaleMax = present.length ? Math.max(...present) : 0
  const pct = (x) => (scaleMax && x != null ? (x / scaleMax) * 100 : null)

  const factPct = pct(fact) ?? 0
  const forecastPct = pct(forecast)
  // Прогноз по построению не меньше факта, но отрицательную ширину не пускаем:
  // один битый набор не должен рисовать сегмент задом наперёд.
  const gapWidth = forecastPct == null ? 0 : Math.max(0, forecastPct - factPct)
  // НЕДОБОР ДО ПЛАНА: от прогноза до порога. Не самостоятельная величина,
  // а остаток плана, который при текущем темпе не закрывается.
  const planPctV = pct(plan)
  const shortStart = forecastPct == null ? 0 : forecastPct
  const shortWidth = forecastPct == null || planPctV == null ? 0 : Math.max(0, planPctV - forecastPct)

  return {
    scaleMax,
    factPct,
    planPct: planPctV,
    forecastPct,
    goalPct: pct(goal),
    gapStart: factPct,
    gapWidth,
    shortStart,
    shortWidth,
    // Сравниваем ТОЧНО: сближать разные числа значило бы врать.
    planIsGoal: plan != null && goal != null && plan === goal,
    reachedPlan: plan != null && fact != null && fact >= plan,
    reachedGoal: goal != null && fact != null && fact >= goal,
    // ЦЕЛЬ = ВЕРХ ШКАЛЫ (обычный случай). Тогда отдельной метки у неё нет:
    // конец полосы и есть цель — так устроен bullet chart, эталон задаёт длину
    // шкалы, а не рисуется штрихом внутри. Метка нужна ТОЛЬКО когда цель кто-то
    // перерос и она оказалась внутри шкалы.
    goalIsEnd: goal != null && goal === scaleMax,
    empty: present.length === 0,
  }
}
