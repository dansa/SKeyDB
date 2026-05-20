export interface BannerFeaturedUnit {
  name: string
  kind: 'awakener' | 'wheel' | 'wheel-auto' | 'placeholder'
  customArt?: string
  realmId?: string
  detailLink?: boolean
}

export interface BannerPoolSlot {
  pool: BannerFeaturedUnit[]
  linked?: boolean
}

export const BANNER_TYPES = [
  'awaken',
  'limited',
  'standard',
  'rerun',
  'selector',
  'wheel',
  'combo',
  'premium',
] as const
export type BannerType = (typeof BANNER_TYPES)[number]

export const BANNER_TAGS = [...BANNER_TYPES, 'collab', 'preliminary'] as const
export type BannerTag = (typeof BANNER_TAGS)[number]

export interface BannerEntry {
  id: string
  title: string
  type: BannerType
  tags?: BannerTag[]
  preliminary?: boolean
  description?: string
  featured?: BannerFeaturedUnit[]
  poolSlots?: BannerPoolSlot[]
  customArt?: string
  customTags?: string[]
  pinned?: boolean
  pricing?: string
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
  'anniversary',
  'milestone',
  'preorder',
  'bundle',
  'collab',
  'maintenance',
  'other',
] as const

export type EventCategory = (typeof EVENT_CATEGORIES)[number]

export interface EventCategoryMetadata {
  label: string
  priority: number
  docsBadgeColor: string
  hideEndedFromArchive?: boolean
}

export const EVENT_CATEGORY_METADATA: Record<EventCategory, EventCategoryMetadata> = {
  story: {label: 'Story', priority: 10, docsBadgeColor: 'Amber'},
  raid: {label: 'Raid', priority: 30, docsBadgeColor: 'Red'},
  battlepass: {label: 'Battlepass', priority: 120, docsBadgeColor: 'Violet'},
  'gameplay-event': {label: 'Event', priority: 20, docsBadgeColor: 'Amber'},
  'd-tide': {label: 'D-Tide', priority: 40, docsBadgeColor: 'Red', hideEndedFromArchive: true},
  curriculum: {
    label: 'Curriculum',
    priority: 60,
    docsBadgeColor: 'Violet',
    hideEndedFromArchive: true,
  },
  login: {label: 'Login', priority: 100, docsBadgeColor: 'Teal', hideEndedFromArchive: true},
  skin: {label: 'Skin', priority: 50, docsBadgeColor: 'Violet'},
  'wheel-event': {label: 'Wheel', priority: 70, docsBadgeColor: 'Blue'},
  anniversary: {label: 'Anniversary', priority: 80, docsBadgeColor: 'Teal'},
  milestone: {label: 'Milestone', priority: 90, docsBadgeColor: 'Gold'},
  preorder: {label: 'Preorder', priority: 110, docsBadgeColor: 'Orange'},
  bundle: {label: 'Bundle', priority: 130, docsBadgeColor: 'Champagne'},
  collab: {label: 'Collab', priority: 140, docsBadgeColor: 'Violet'},
  maintenance: {label: 'Maintenance', priority: 150, docsBadgeColor: 'Slate'},
  other: {label: 'Event', priority: 999, docsBadgeColor: 'Slate'},
}

export const EVENT_CATEGORY_PRIORITY: Record<EventCategory, number> = Object.fromEntries(
  EVENT_CATEGORIES.map((category) => [category, EVENT_CATEGORY_METADATA[category].priority]),
) as Record<EventCategory, number>

export interface EventEntry {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  category?: EventCategory
  pinned?: boolean
  preliminary?: boolean
  customArt?: string
  featured?: BannerFeaturedUnit[]
  pricing?: string
  rerun?: boolean
  artAlign?: string
}

const eventCategorySet = new Set<EventCategory>(EVENT_CATEGORIES)

export function normalizeEventCategory(category: string | undefined): EventCategory | undefined {
  if (!category) return undefined
  if (eventCategorySet.has(category as EventCategory)) return category as EventCategory
  return 'other'
}

export function shouldDisplayEndedEventInArchive(event: EventEntry): boolean {
  return EVENT_CATEGORY_METADATA[event.category ?? 'other'].hideEndedFromArchive !== true
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

export interface TimelineCountdownDisplay {
  text: string
  title: string
}

const TIMELINE_DATE_DISPLAY_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000

function formatTimelineDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

function formatTimelineDisplayDate(dateStr: string, now?: Date): string {
  const date = new Date(dateStr)
  const reference = now ?? new Date()
  if (date.getUTCFullYear() === reference.getUTCFullYear()) {
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
    }).format(date)
  }
  return formatTimelineDate(dateStr)
}

function formatTimelineDisplayDateRange(startDate: string, endDate: string, now?: Date): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const reference = now ?? new Date()
  const startYear = start.getUTCFullYear()
  const endYear = end.getUTCFullYear()

  if (startYear === endYear) {
    const startText = new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
    }).format(start)
    const endText =
      endYear === reference.getUTCFullYear()
        ? new Intl.DateTimeFormat('en-US', {
            day: 'numeric',
            month: 'short',
          }).format(end)
        : formatTimelineDate(endDate)

    return `${startText} - ${endText}`
  }

  return `${formatTimelineDate(startDate)} - ${formatTimelineDate(endDate)}`
}

function formatTimelineDateRange(startDate: string, endDate: string): string {
  return `${formatTimelineDate(startDate)} - ${formatTimelineDate(endDate)}`
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

export function getTimelineCountdownDisplay(
  startDate: string,
  endDate: string,
  now?: Date,
): TimelineCountdownDisplay | null {
  const countdown = getTimelineCountdown(startDate, endDate, now)
  if (!countdown) return null

  const status = getTimelineStatus(startDate, endDate, now)
  const title = formatTimelineDateRange(startDate, endDate)

  if (Math.abs(countdown.totalMs) > TIMELINE_DATE_DISPLAY_THRESHOLD_MS) {
    if (status === 'upcoming') {
      return {text: `Starts ${formatTimelineDisplayDateRange(startDate, endDate, now)}`, title}
    }
    if (status === 'active') {
      return {text: `Ends ${formatTimelineDisplayDate(endDate, now)}`, title}
    }
    return {text: `Ended ${formatTimelineDisplayDate(endDate, now)}`, title}
  }

  return {text: formatCountdown(countdown), title}
}

function getActivePinnedPriority(pinned: boolean | undefined, status: TimelineStatus): number {
  return status === 'active' && pinned ? 0 : 1
}

export function sortBannersByRelevance(banners: BannerEntry[], now?: Date): BannerEntry[] {
  const reference = now ?? new Date()
  return [...banners].sort((a, b) => {
    const statusA = getTimelineStatus(a.startDate, a.endDate, reference)
    const statusB = getTimelineStatus(b.startDate, b.endDate, reference)
    const order: Record<TimelineStatus, number> = {active: 0, upcoming: 1, ended: 2}
    if (order[statusA] !== order[statusB]) {
      return order[statusA] - order[statusB]
    }
    const pinnedA = getActivePinnedPriority(a.pinned, statusA)
    const pinnedB = getActivePinnedPriority(b.pinned, statusB)
    if (pinnedA !== pinnedB) {
      return pinnedA - pinnedB
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
    const statusA = getTimelineStatus(a.startDate, a.endDate, reference)
    const statusB = getTimelineStatus(b.startDate, b.endDate, reference)
    const order: Record<TimelineStatus, number> = {active: 0, upcoming: 1, ended: 2}
    if (order[statusA] !== order[statusB]) {
      return order[statusA] - order[statusB]
    }
    const pinnedA = getActivePinnedPriority(a.pinned, statusA)
    const pinnedB = getActivePinnedPriority(b.pinned, statusB)
    if (pinnedA !== pinnedB) {
      return pinnedA - pinnedB
    }
    if (statusA === 'ended') {
      return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    }
    if (statusA === 'upcoming') {
      const startDateDiff = new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      if (startDateDiff !== 0) {
        return startDateDiff
      }
    }
    const catPriorityA = EVENT_CATEGORY_PRIORITY[a.category ?? 'other']
    const catPriorityB = EVENT_CATEGORY_PRIORITY[b.category ?? 'other']
    if (catPriorityA !== catPriorityB) {
      return catPriorityA - catPriorityB
    }
    if (statusA === 'upcoming') {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    }
    return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
  })
}
