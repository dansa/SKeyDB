import {renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {
  getAwakenerBuildEntries,
  getPrimaryAwakenerBuild,
  type AwakenerBuildEntry,
} from '@/domain/awakener-builds'

import type {ActiveSelection, TeamSlot} from './types'
import {useAwakenerBuildRecommendations} from './useAwakenerBuildRecommendations'

function requireEntry(
  predicate: (entry: AwakenerBuildEntry) => boolean,
  label: string,
): AwakenerBuildEntry {
  const entry = getAwakenerBuildEntries().find(predicate)
  if (!entry) {
    throw new Error(`Expected curated build entry for ${label}`)
  }
  return entry
}

describe('useAwakenerBuildRecommendations', () => {
  it('resolves the active build and aggregates team posse recommendations from cached entries', () => {
    const activeEntry = requireEntry(
      (entry) => Boolean(getPrimaryAwakenerBuild(entry)),
      'active build',
    )
    const posseEntry = requireEntry(
      (entry) => Boolean(entry.recommendedPosseIds?.length),
      'recommended posse ids',
    )
    const activeSlotId = 'slot-active'
    const slotsById = new Map<string, TeamSlot>([
      [
        activeSlotId,
        {
          slotId: activeSlotId,
          awakenerId: activeEntry.awakenerId,
          wheels: [null, null],
        },
      ],
      [
        'slot-posse',
        {
          slotId: 'slot-posse',
          awakenerId: posseEntry.awakenerId,
          wheels: [null, null],
        },
      ],
    ])
    const activeSelection: ActiveSelection = {kind: 'awakener', slotId: activeSlotId}
    const expectedPrimaryBuildId = getPrimaryAwakenerBuild(activeEntry)?.id

    const {result} = renderHook(() =>
      useAwakenerBuildRecommendations({
        activeSelection,
        slotsById,
      }),
    )

    expect(result.current.activeBuild?.id).toBe(expectedPrimaryBuildId)
    expect(result.current.teamRecommendedPosseIds).toEqual(
      new Set(posseEntry.recommendedPosseIds ?? []),
    )
  })
})
