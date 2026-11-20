import {
  getBannerDailyScheduleEntry,
  getTimelineStatus,
  type BannerEntry,
  type BannerFeaturedUnit,
  type BannerPoolSlot,
  type EventEntry,
  type TimelinePatch,
} from '@/domain/timeline'
import type {TimelineContentFilter} from '@/domain/timeline-routing'

import {resolveTimelineFeaturedAsset} from '../timelineDetailResolution'

export type TimelineEntry = EventEntry | BannerEntry

export interface TimelineAgendaMoment {
  at: string
  action: 'start' | 'end'
  kind: 'event' | 'banner' | 'season'
  title: string
  id?: string
}

interface TimelineAgendaPatch extends Pick<TimelinePatch, 'id' | 'title' | 'date'> {
  action: 'start' | 'end'
  campaign?: {start: string; end: string}
}

export interface TimelineAgendaGroup {
  date: Date
  moments: TimelineAgendaMoment[]
  patch?: TimelineAgendaPatch
}

function getPatchMarkers({id, title, date, endDate}: TimelinePatch): TimelineAgendaPatch[] {
  const start: TimelineAgendaPatch = {id, title, date, action: 'start'}
  if (!endDate) return [start]
  const campaign = {start: date, end: endDate}
  return [
    {...start, campaign},
    {id, title, date: endDate, action: 'end', campaign},
  ]
}

export function isAgendaSegmentHighlighted(at: string, groups: TimelineAgendaGroup[]): boolean {
  return groups.some(({patch}) => {
    const campaign = patch?.campaign
    return campaign ? campaign.start <= at && at < campaign.end : false
  })
}

export function getTimelineAgendaGroups({
  banners,
  events,
  filter,
  now,
  patches = [],
  resetDate,
}: {
  banners: BannerEntry[]
  events: EventEntry[]
  filter: TimelineContentFilter
  now: Date
  patches?: TimelinePatch[]
  resetDate?: string
}): TimelineAgendaGroup[] {
  const moments: TimelineAgendaMoment[] = []
  const entries: TimelineEntry[] = [
    ...(filter === 'banners' ? [] : events),
    ...(filter === 'events' ? [] : banners),
  ]
  for (const entry of entries) {
    const banner = isBanner(entry)
    const status = getTimelineStatus(entry.startDate, entry.endDate, now)
    if (status === 'ended') continue
    moments.push({
      action: status === 'upcoming' ? 'start' : 'end',
      at: status === 'upcoming' ? entry.startDate : entry.endDate,
      id: entry.id,
      kind: banner ? 'banner' : 'event',
      title: entry.title,
    })
  }
  if (resetDate)
    moments.push({action: 'start', at: resetDate, kind: 'season', title: 'D-Zone reset'})
  const groups = new Map<string, TimelineAgendaGroup>()
  const dayKey = (date: Date) =>
    `${String(date.getFullYear())}-${String(date.getMonth())}-${String(date.getDate())}`
  for (const moment of moments
    .filter((item) => new Date(item.at).getTime() > now.getTime())
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())) {
    const date = new Date(moment.at)
    const key = dayKey(date)
    const group = groups.get(key) ?? {date, moments: []}
    group.moments.push(moment)
    groups.set(key, group)
  }
  for (const patch of patches.flatMap(getPatchMarkers)) {
    const date = new Date(patch.date)
    if (date.getTime() <= now.getTime()) continue
    const key = dayKey(date)
    const existing = groups.get(key)
    groups.set(key, {
      date: existing && existing.date < date ? existing.date : date,
      moments: existing?.moments ?? [],
      patch,
    })
  }
  return [...groups.values()].sort((a, b) => a.date.getTime() - b.date.getTime())
}

export function getDesktopAgendaGroups(groups: TimelineAgendaGroup[]): TimelineAgendaGroup[] {
  const shown = groups.slice(0, 4)
  if (shown.some((group) => group.patch)) return shown
  const nextPatch = groups.find((group) => group.patch?.action === 'start')
  return nextPatch ? [...shown.slice(0, 3), nextPatch] : shown
}

export function isBanner(entry: TimelineEntry): entry is BannerEntry {
  return 'type' in entry
}

export function getInitialBannerRotation(banner: BannerEntry, now: Date) {
  return getTimelineStatus(banner.startDate, banner.endDate, now) === 'active'
    ? (getBannerDailyScheduleEntry(banner, now) ?? banner.dailySchedule?.at(0))
    : banner.dailySchedule?.at(0)
}

export function getDisplayBanner(banner: BannerEntry, now: Date): BannerEntry {
  const daily = getInitialBannerRotation(banner, now)
  return daily
    ? {
        ...banner,
        customTags:
          getTimelineStatus(banner.startDate, banner.endDate, now) === 'active'
            ? [
                ...(banner.customTags ?? []),
                `Day ${String(daily.day)}`,
                ...(daily.featured[0] ? [daily.featured[0].name] : []),
              ]
            : banner.customTags,
        featured: daily.featured,
        poolSlots: undefined,
      }
    : banner
}

interface BannerStageProfile {
  artwork?: 'kaleido' | 2 | 3
  selector?: true
  rules?: 'kaleido' | 'oathbound-oracle' | 'myriad-self-select'
}
const bannerStageProfiles: Record<NonNullable<BannerEntry['rulesProfile']>, BannerStageProfile> = {
  'myriad-self-select': {selector: true, rules: 'myriad-self-select'},
  'oathbound-oracle': {rules: 'oathbound-oracle'},
  kaleido: {artwork: 'kaleido', rules: 'kaleido'},
  'fated-soiree': {artwork: 3},
  'triple-soiree': {artwork: 2},
}

export function getBannerStageProfile(
  banner: BannerEntry | undefined,
): BannerStageProfile | undefined {
  return banner?.rulesProfile ? bannerStageProfiles[banner.rulesProfile] : undefined
}

export function getBannerArtworkSlots(banner: BannerEntry): BannerPoolSlot[] | undefined {
  const artwork = getBannerStageProfile(banner)?.artwork
  if (!artwork || !banner.poolSlots) return banner.poolSlots

  const groups = getPoolGroups(banner.poolSlots)
  const awakeners = groups.find(({label}) => label === 'Awakeners')?.units ?? []
  const wheels = groups.find(({label}) => label === 'Wheels')?.units ?? []
  if (artwork !== 'kaleido') {
    return [
      {pool: awakeners},
      {pool: awakeners},
      ...Array.from({length: artwork}, () => ({pool: wheels})),
    ]
  }
  const portraits = [0, 1, 2].map((index) => ({
    pool: awakeners.filter((_, i) => i % 3 === index),
  }))
  return [...portraits, {pool: wheels}]
}

export function getPoolGroups(
  slots: BannerPoolSlot[],
): {label: string; units: BannerFeaturedUnit[]}[] {
  const groups = new Map<string, Map<string, BannerFeaturedUnit>>()
  const seen = new Set<string>()
  const labeled = slots.some((slot) => slot.label)
  for (const slot of slots) {
    const units = slot.pool.flatMap((unit): BannerFeaturedUnit[] =>
      slot.linked && unit.kind === 'awakener'
        ? [unit, {name: unit.name, kind: 'wheel-auto'}]
        : [unit],
    )
    for (const unit of units) {
      const label = labeled
        ? (slot.label ?? 'Other')
        : unit.kind === 'wheel' || unit.kind === 'wheel-auto'
          ? 'Wheels'
          : 'Awakeners'
      const group = groups.get(label) ?? new Map<string, BannerFeaturedUnit>()
      const asset = resolveTimelineFeaturedAsset(unit)
      const key = `${asset.isWheel ? 'wheel' : unit.kind}:${asset.label.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      group.set(key, unit)
      groups.set(label, group)
    }
  }
  return Array.from(groups, ([label, units]) => ({label, units: [...units.values()]}))
}
