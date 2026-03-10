export interface BannerFeaturedUnit {
  name: string
  kind: 'awakener' | 'wheel' | 'wheel-auto'
}

export interface BannerPoolSlot {
  pool: BannerFeaturedUnit[]
  linked?: boolean
}

export interface BannerEntry {
  id: string
  title: string
  type: 'awaken' | 'limited' | 'standard' | 'rerun' | 'selector' | 'wheel' | 'combo'
  description?: string
  featured?: BannerFeaturedUnit[]
  poolSlots?: BannerPoolSlot[]
  customArt?: string
  pinned?: boolean
  startDate: string
  endDate: string
}

export const EVENT_CATEGORIES = [
  'story',
  'raid',
  'battlepass',
  'gameplay-event',
  'd-tide',
  'curriculum',
  'login',
  'skin',
  'wheel-event',
  'preorder',
  'maintenance',
  'campaign',
  'collab',
  'other',
] as const

export type EventCategory = (typeof EVENT_CATEGORIES)[number]

export interface EventEntry {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  category?: EventCategory
  pinned?: boolean
  customArt?: string
  featured?: BannerFeaturedUnit[]
  pricing?: string
  artAlign?: string
}

const eventCategorySet = new Set<EventCategory>(EVENT_CATEGORIES)

export function normalizeEventCategory(category: string | undefined): EventCategory | undefined {
  if (!category) return undefined
  if (eventCategorySet.has(category as EventCategory)) return category as EventCategory
  return 'other'
}

export type TimelineStatus = 'active' | 'upcoming' | 'ended'

export function parseGameDate(dateStr: string): string {
  const match = /^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/.exec(dateStr)
  if (!match) return dateStr
  const [, y, mo, d, h, mi] = match
  return new Date(
    Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h) - 8, Number(mi)),
  ).toISOString()
}

export function getTimelineStatus(startDate: string, endDate: string, now?: Date): TimelineStatus {
  const reference = now ?? new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (reference < start) {
    return 'upcoming'
  }
  if (reference > end) {
    return 'ended'
  }
  return 'active'
}

export interface TimelineCountdown {
  days: number
  hours: number
  minutes: number
  label: string
  totalMs: number
}

export function getTimelineCountdown(
  startDate: string,
  endDate: string,
  now?: Date,
): TimelineCountdown | null {
  const reference = now ?? new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  let targetMs: number
  let label: string

  if (reference < start) {
    targetMs = start.getTime() - reference.getTime()
    label = 'Starts in'
  } else if (reference <= end) {
    targetMs = end.getTime() - reference.getTime()
    label = 'Ends in'
  } else {
    const elapsedMs = reference.getTime() - end.getTime()
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24))
    return {
      days: elapsedDays,
      hours: 0,
      minutes: 0,
      label: 'Ended',
      totalMs: -elapsedMs,
    }
  }

  const totalMinutes = Math.floor(targetMs / (1000 * 60))
  const totalHours = Math.floor(totalMinutes / 60)
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  const minutes = totalMinutes % 60

  return {days, hours, minutes, label, totalMs: targetMs}
}

export function formatCountdown(countdown: TimelineCountdown): string {
  if (countdown.totalMs < 0) {
    if (countdown.days === 0) {
      return 'Ended today'
    }
    if (countdown.days === 1) {
      return 'Ended 1 day ago'
    }
    return `Ended ${String(countdown.days)}d ago`
  }

  const parts: string[] = []
  if (countdown.days > 0) {
    parts.push(`${String(countdown.days)}d`)
  }
  if (countdown.hours > 0 || countdown.days > 0) {
    parts.push(`${String(countdown.hours)}h`)
  }
  if (countdown.days === 0) {
    parts.push(`${String(countdown.minutes)}m`)
  }

  return `${countdown.label} ${parts.join(' ')}`
}

export function sortBannersByRelevance(banners: BannerEntry[], now?: Date): BannerEntry[] {
  const reference = now ?? new Date()
  return [...banners].sort((a, b) => {
    const pinnedA = a.pinned ? 0 : 1
    const pinnedB = b.pinned ? 0 : 1
    if (pinnedA !== pinnedB) {
      return pinnedA - pinnedB
    }
    const statusA = getTimelineStatus(a.startDate, a.endDate, reference)
    const statusB = getTimelineStatus(b.startDate, b.endDate, reference)
    const order: Record<TimelineStatus, number> = {active: 0, upcoming: 1, ended: 2}
    if (order[statusA] !== order[statusB]) {
      return order[statusA] - order[statusB]
    }
    if (statusA === 'upcoming') {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    }
    if (statusA === 'ended') {
      return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    }
    return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
  })
}

export function sortEventsByRelevance(events: EventEntry[], now?: Date): EventEntry[] {
  const reference = now ?? new Date()
  return [...events].sort((a, b) => {
    const pinnedA = a.pinned ? 0 : 1
    const pinnedB = b.pinned ? 0 : 1
    if (pinnedA !== pinnedB) {
      return pinnedA - pinnedB
    }
    const statusA = getTimelineStatus(a.startDate, a.endDate, reference)
    const statusB = getTimelineStatus(b.startDate, b.endDate, reference)
    const order: Record<TimelineStatus, number> = {active: 0, upcoming: 1, ended: 2}
    if (order[statusA] !== order[statusB]) {
      return order[statusA] - order[statusB]
    }
    if (statusA === 'upcoming') {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    }
    if (statusA === 'ended') {
      return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    }
    return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
  })
}
