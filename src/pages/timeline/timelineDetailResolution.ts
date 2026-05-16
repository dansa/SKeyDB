import {getAwakenerCardAsset} from '@/domain/awakener-assets'
import {getAwakeners} from '@/domain/awakeners'
import {buildDatabaseAwakenerPath, buildDatabaseWheelPath} from '@/domain/database-paths'
import type {EntityRef} from '@/domain/entities/types'
import type {BannerFeaturedUnit} from '@/domain/timeline'
import {getWheelAssetById} from '@/domain/wheel-assets'
import {getWheels} from '@/domain/wheels'

type TimelineAwakener = ReturnType<typeof getAwakeners>[number]
type TimelineWheel = ReturnType<typeof getWheels>[number]

export interface TimelineFeaturedAsset {
  url: string | undefined
  label: string
  linkTo: string | undefined
  realmId: string | undefined
  isWheel: boolean
  detailRef: EntityRef | undefined
}

interface TimelineEntityIndexes {
  awakenerByName: Map<string, TimelineAwakener>
  signatureWheelByAwakenerName: Map<string, TimelineWheel>
  wheelByName: Map<string, TimelineWheel>
}

function getLookupKey(name: string): string {
  return name.toLowerCase()
}

function setFirstIndexedValue<T>(map: Map<string, T>, key: string, value: T) {
  if (!map.has(key)) {
    map.set(key, value)
  }
}

function buildTimelineEntityIndexes(
  awakeners: TimelineAwakener[],
  wheels: TimelineWheel[],
): TimelineEntityIndexes {
  const awakenerByName = new Map<string, TimelineAwakener>()
  const signatureWheelByAwakenerName = new Map<string, TimelineWheel>()
  const wheelByName = new Map<string, TimelineWheel>()

  awakeners.forEach((awakener) => {
    setFirstIndexedValue(awakenerByName, getLookupKey(awakener.name), awakener)
  })

  wheels.forEach((wheel) => {
    setFirstIndexedValue(wheelByName, getLookupKey(wheel.name), wheel)
    if (wheel.rarity === 'SSR') {
      setFirstIndexedValue(signatureWheelByAwakenerName, getLookupKey(wheel.awakener), wheel)
    }
  })

  return {awakenerByName, signatureWheelByAwakenerName, wheelByName}
}

const timelineEntityIndexes = buildTimelineEntityIndexes(getAwakeners(), getWheels())

export function findTimelineAwakener(name: string) {
  return timelineEntityIndexes.awakenerByName.get(getLookupKey(name))
}

export function findTimelineWheel(name: string) {
  return timelineEntityIndexes.wheelByName.get(getLookupKey(name))
}

export function findTimelineSignatureWheel(awakenerName: string) {
  return timelineEntityIndexes.signatureWheelByAwakenerName.get(getLookupKey(awakenerName))
}

export function resolveTimelineFeaturedAsset(unit: BannerFeaturedUnit): TimelineFeaturedAsset {
  const allowDetailLink = unit.detailLink !== false

  if (unit.kind === 'placeholder') {
    return {
      url: undefined,
      label: unit.name,
      linkTo: undefined,
      realmId: undefined,
      isWheel: false,
      detailRef: undefined,
    }
  }

  const wheel =
    unit.kind === 'wheel'
      ? findTimelineWheel(unit.name)
      : unit.kind === 'wheel-auto'
        ? findTimelineSignatureWheel(unit.name)
        : undefined
  const awakener = unit.kind === 'awakener' ? findTimelineAwakener(unit.name) : undefined
  const isWheel = unit.kind === 'wheel' || unit.kind === 'wheel-auto'
  const label = unit.kind === 'wheel-auto' ? (wheel?.name ?? unit.name) : unit.name

  if (unit.customArt) {
    return {
      url: unit.customArt,
      label,
      linkTo: allowDetailLink
        ? wheel
          ? buildDatabaseWheelPath(wheel)
          : awakener
            ? buildDatabaseAwakenerPath(awakener)
            : undefined
        : undefined,
      realmId: unit.realmId ?? (isWheel ? wheel?.realm : awakener?.realm),
      isWheel,
      detailRef: allowDetailLink
        ? wheel
          ? {kind: 'wheel', id: wheel.id}
          : awakener
            ? {kind: 'awakener', id: awakener.id}
            : undefined
        : undefined,
    }
  }

  if (isWheel) {
    return {
      url: wheel ? getWheelAssetById(wheel.id) : undefined,
      label,
      linkTo: allowDetailLink && wheel ? buildDatabaseWheelPath(wheel) : undefined,
      realmId: unit.realmId ?? wheel?.realm,
      isWheel: true,
      detailRef: allowDetailLink && wheel ? {kind: 'wheel', id: wheel.id} : undefined,
    }
  }

  return {
    url: getAwakenerCardAsset(unit.name),
    label: unit.name,
    linkTo: allowDetailLink && awakener ? buildDatabaseAwakenerPath(awakener) : undefined,
    realmId: unit.realmId ?? awakener?.realm,
    isWheel: false,
    detailRef: allowDetailLink && awakener ? {kind: 'awakener', id: awakener.id} : undefined,
  }
}
