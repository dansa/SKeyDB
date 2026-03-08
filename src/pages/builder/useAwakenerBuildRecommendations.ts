import {useMemo} from 'react'

import {
  buildAwakenerBuildEntryMap,
  getPrimaryAwakenerBuild,
  type AwakenerBuild,
} from '@/domain/awakener-builds'
import {useAwakenerBuildEntries} from '@/domain/useAwakenerBuildEntries'

import type {ActiveSelection, TeamSlot} from './types'

interface UseAwakenerBuildRecommendationsOptions {
  activeSelection: ActiveSelection
  slotsById: Map<string, TeamSlot>
  awakenerIdByName: Map<string, number>
}

export function useAwakenerBuildRecommendations({
  activeSelection,
  slotsById,
  awakenerIdByName,
}: UseAwakenerBuildRecommendationsOptions) {
  const entries = useAwakenerBuildEntries()

  const entryMap = useMemo(() => {
    return entries ? buildAwakenerBuildEntryMap(entries) : null
  }, [entries])

  const activeSlot = useMemo(() => {
    if (!activeSelection) {
      return undefined
    }
    return slotsById.get(activeSelection.slotId)
  }, [activeSelection, slotsById])

  const activeAwakenerId = useMemo(() => {
    const awakenerName = activeSlot?.awakenerName
    if (!awakenerName) {
      return undefined
    }
    return awakenerIdByName.get(awakenerName.toLowerCase())
  }, [activeSlot, awakenerIdByName])

  const activeBuild = useMemo<AwakenerBuild | undefined>(() => {
    if (!entryMap || activeAwakenerId === undefined) {
      return undefined
    }
    return getPrimaryAwakenerBuild(entryMap.get(activeAwakenerId))
  }, [entryMap, activeAwakenerId])

  const teamRecommendedPosseIds = useMemo<Set<string>>(() => {
    if (!entryMap) {
      return new Set()
    }
    const ids = new Set<string>()
    for (const slot of slotsById.values()) {
      if (!slot.awakenerName) {
        continue
      }
      const awakId = awakenerIdByName.get(slot.awakenerName.toLowerCase())
      if (awakId === undefined) {
        continue
      }
      const build = getPrimaryAwakenerBuild(entryMap.get(awakId))
      if (build?.recommendedPosseIds) {
        for (const posseId of build.recommendedPosseIds) {
          ids.add(posseId)
        }
      }
    }
    return ids
  }, [entryMap, slotsById, awakenerIdByName])

  return {
    activeBuild,
    teamRecommendedPosseIds,
    hasLoadedBuildRecommendations: entries !== null,
  }
}
