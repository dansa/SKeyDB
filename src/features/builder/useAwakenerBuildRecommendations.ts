import {useMemo} from 'react'

import {
  buildAwakenerBuildEntryMap,
  getAwakenerBuildEntries,
  getPrimaryAwakenerBuild,
  type AwakenerBuild,
} from '@/domain/awakener-builds'

import type {ActiveSelection, TeamSlot} from './types'

interface UseAwakenerBuildRecommendationsOptions {
  activeSelection: ActiveSelection
  slotsById: Map<string, TeamSlot>
}

export function useAwakenerBuildRecommendations({
  activeSelection,
  slotsById,
}: UseAwakenerBuildRecommendationsOptions) {
  const entryMap = useMemo(() => {
    return buildAwakenerBuildEntryMap(getAwakenerBuildEntries())
  }, [])

  const activeSlot = useMemo(() => {
    if (!activeSelection) {
      return undefined
    }
    return slotsById.get(activeSelection.slotId)
  }, [activeSelection, slotsById])

  const activeAwakenerId = useMemo(() => {
    const awakenerId = activeSlot?.awakenerId
    if (!awakenerId) {
      return undefined
    }
    return awakenerId
  }, [activeSlot])

  const activeBuild = useMemo<AwakenerBuild | undefined>(() => {
    if (activeAwakenerId === undefined) {
      return undefined
    }
    return getPrimaryAwakenerBuild(entryMap.get(activeAwakenerId))
  }, [entryMap, activeAwakenerId])

  const teamRecommendedPosseIds = useMemo<Set<string>>(() => {
    const ids = new Set<string>()
    for (const slot of slotsById.values()) {
      if (!slot.awakenerId) {
        continue
      }
      const entry = entryMap.get(slot.awakenerId)
      if (entry?.recommendedPosseIds) {
        for (const posseId of entry.recommendedPosseIds) {
          ids.add(posseId)
        }
      }
    }
    return ids
  }, [entryMap, slotsById])

  return {
    activeBuild,
    teamRecommendedPosseIds,
  }
}
