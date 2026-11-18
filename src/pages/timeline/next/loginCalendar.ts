import type {TimelineRewardItem} from '@/domain/timeline'

function parseAmount(amount: string | undefined) {
  if (!amount) return 1
  const match = /([\d.,]+)\s*(k)?/i.exec(amount)
  if (!match) return Number.NaN
  return Number(match[1].replaceAll(',', '')) * (match[2] ? 1000 : 1)
}

/** Days that stand out from the rest of the calendar: a one-off item, or more of an item than usual. */
export function getNotableLoginDays(items: TimelineRewardItem[]): Set<number> {
  const byName = new Map<string, number[]>()
  items.forEach((item, day) => {
    byName.set(item.name, [...(byName.get(item.name) ?? []), day])
  })
  const notable = new Set<number>()
  for (const days of byName.values()) {
    if (days.length === 1) {
      if (byName.size > 1) notable.add(days[0])
      continue
    }
    const amounts = days.map((day) => parseAmount(items[day].amount))
    const counts = new Map<number, number>()
    for (const amount of amounts) counts.set(amount, (counts.get(amount) ?? 0) + 1)
    const usual = [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]
    days.forEach((day, index) => {
      if (amounts[index] > usual) notable.add(day)
    })
  }
  return notable
}
