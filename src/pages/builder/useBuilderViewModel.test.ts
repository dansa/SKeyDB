import {createRef} from 'react'

import {act, renderHook, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {
  getAwakenerBuildEntryById,
  getPrimaryAwakenerBuild,
  loadAwakenerBuildEntries,
} from '@/domain/awakener-builds'
import {getAwakenerIdentityKey} from '@/domain/awakener-identity'
import {COLLECTION_OWNERSHIP_KEY, saveCollectionOwnership} from '@/domain/collection-ownership'
import {compareWheelsForUi} from '@/domain/wheel-sort'
import {getWheels} from '@/domain/wheels'

import {
  BUILDER_PERSISTENCE_KEY,
  clearBuilderDraft,
  saveBuilderDraft,
  type BuilderDraftPayload,
} from './builder-persistence'
import {useBuilderViewModel} from './useBuilderViewModel'

vi.mock('./useGlobalPickerSearchCapture', () => ({
  useGlobalPickerSearchCapture: vi.fn(),
}))

const BUILDER_AWAKENER_SORT_GROUP_BY_REALM_KEY = 'skeydb.builder.awakenerSortGroupByFaction.v1'
const BUILDER_AWAKENER_SORT_KEY_KEY = 'skeydb.builder.awakenerSortKey.v1'
const BUILDER_AWAKENER_SORT_DIRECTION_KEY = 'skeydb.builder.awakenerSortDirection.v1'
const BUILDER_DISPLAY_UNOWNED_KEY = 'skeydb.builder.displayUnowned.v1'
const BUILDER_PROMOTE_MATCHING_WHEEL_MAINSTATS_KEY =
  'skeydb.builder.promoteMatchingWheelMainstats.v1'
const BUILDER_PROMOTE_RECOMMENDED_GEAR_KEY = 'skeydb.builder.promoteRecommendedGear.v1'
const BUILDER_TEAM_PREVIEW_MODE_KEY = 'skeydb.builder.teamPreviewMode.v1'

function requireDefined<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw new Error('Expected value to be defined')
  }
  return value
}

async function getPrimaryBuild(awakenerId: number) {
  const entries = await loadAwakenerBuildEntries()
  return requireDefined(getPrimaryAwakenerBuild(getAwakenerBuildEntryById(awakenerId, entries)))
}

describe('useBuilderViewModel', () => {
  beforeEach(() => {
    window.localStorage.removeItem(BUILDER_PERSISTENCE_KEY)
    window.localStorage.removeItem(COLLECTION_OWNERSHIP_KEY)
    window.localStorage.removeItem(BUILDER_AWAKENER_SORT_GROUP_BY_REALM_KEY)
    window.localStorage.removeItem(BUILDER_AWAKENER_SORT_KEY_KEY)
    window.localStorage.removeItem(BUILDER_AWAKENER_SORT_DIRECTION_KEY)
    window.localStorage.removeItem(BUILDER_DISPLAY_UNOWNED_KEY)
    window.localStorage.removeItem(BUILDER_PROMOTE_MATCHING_WHEEL_MAINSTATS_KEY)
    window.localStorage.removeItem(BUILDER_PROMOTE_RECOMMENDED_GEAR_KEY)
    window.localStorage.removeItem(BUILDER_TEAM_PREVIEW_MODE_KEY)
  })

  afterEach(() => {
    window.localStorage.removeItem(BUILDER_PERSISTENCE_KEY)
    window.localStorage.removeItem(COLLECTION_OWNERSHIP_KEY)
    window.localStorage.removeItem(BUILDER_AWAKENER_SORT_GROUP_BY_REALM_KEY)
    window.localStorage.removeItem(BUILDER_AWAKENER_SORT_KEY_KEY)
    window.localStorage.removeItem(BUILDER_AWAKENER_SORT_DIRECTION_KEY)
    window.localStorage.removeItem(BUILDER_DISPLAY_UNOWNED_KEY)
    window.localStorage.removeItem(BUILDER_PROMOTE_MATCHING_WHEEL_MAINSTATS_KEY)
    window.localStorage.removeItem(BUILDER_PROMOTE_RECOMMENDED_GEAR_KEY)
    window.localStorage.removeItem(BUILDER_TEAM_PREVIEW_MODE_KEY)
  })

  it('initializes with a valid active team and slots', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    expect(result.current.teams.length).toBeGreaterThan(0)
    expect(result.current.effectiveActiveTeamId).toBe(result.current.teams[0]?.id)
    expect(result.current.teamSlots).toHaveLength(4)
    expect(result.current.pickerTab).toBe('awakeners')
  })

  it('toggles card selection and syncs picker tab to awakeners', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )
    const targetSlot = requireDefined(result.current.teamSlots[0]?.slotId)

    act(() => {
      result.current.setPickerTab('posses')
      result.current.handleCardClick(targetSlot)
    })

    expect(result.current.pickerTab).toBe('awakeners')
    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: targetSlot})

    act(() => {
      result.current.handleCardClick(targetSlot)
    })
    expect(result.current.activeSelection).toBeNull()
  })

  it('sets wheel selection and syncs picker tab to wheels', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )
    const targetSlot = requireDefined(result.current.teamSlots[0]?.slotId)

    act(() => {
      result.current.handleWheelSlotClick(targetSlot, 0)
    })

    expect(result.current.pickerTab).toBe('wheels')
    expect(result.current.activeSelection).toEqual({
      kind: 'wheel',
      slotId: targetSlot,
      wheelIndex: 0,
    })
  })

  it('sets second wheel slot selection and keeps picker tab on wheels', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )
    const targetSlot = requireDefined(result.current.teamSlots[0]?.slotId)

    act(() => {
      result.current.handleWheelSlotClick(targetSlot, 1)
    })

    expect(result.current.pickerTab).toBe('wheels')
    expect(result.current.activeSelection).toEqual({
      kind: 'wheel',
      slotId: targetSlot,
      wheelIndex: 1,
    })
  })

  it('removes an active awakener selection from a slot', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )
    const targetSlot = requireDefined(result.current.teamSlots[0]?.slotId)

    act(() => {
      result.current.setActiveTeamSlots([
        ...result.current.teamSlots.map((slot, index) =>
          index === 0
            ? {
                ...slot,
                awakenerName: 'Goliath',
                realm: 'AEQUOR',
                wheels: [null, null] as [string | null, string | null],
              }
            : slot,
        ),
      ])
    })

    act(() => {
      result.current.setActiveSelection({kind: 'awakener', slotId: targetSlot})
    })

    act(() => {
      result.current.handleRemoveActiveSelection(targetSlot)
    })

    expect(result.current.teamSlots[0]?.awakenerName).toBeUndefined()
    expect(result.current.activeSelection).toBeNull()
  })

  it('tracks used awakeners by identity key across teams', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    act(() => {
      const [firstTeam, ...rest] = result.current.teams
      result.current.setTeams([
        {
          ...firstTeam,
          slots: firstTeam.slots.map((slot, index) =>
            index === 0 ? {...slot, awakenerName: 'Ramona', realm: 'CHAOS'} : slot,
          ),
        },
        ...rest,
      ])
    })

    expect(result.current.usedAwakenerIdentityKeys.has(getAwakenerIdentityKey('Ramona'))).toBe(true)
    expect(
      result.current.usedAwakenerIdentityKeys.has(getAwakenerIdentityKey('Ramona: Timeworn')),
    ).toBe(true)
  })

  it('filters wheels by rarity and searches wheel metadata fields', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    act(() => {
      result.current.setWheelRarityFilter('R')
    })
    expect(result.current.filteredWheels.length).toBeGreaterThan(0)
    expect(result.current.filteredWheels.every((wheel) => wheel.rarity === 'R')).toBe(true)

    act(() => {
      result.current.setWheelRarityFilter('ALL')
      result.current.setPickerSearchByTab((prev) => ({...prev, wheels: 'ultra'}))
    })
    expect(result.current.filteredWheels.length).toBeGreaterThan(0)
    expect(result.current.filteredWheels.every((wheel) => wheel.realm === 'ULTRA')).toBe(true)

    act(() => {
      result.current.setPickerSearchByTab((prev) => ({...prev, wheels: 'b01'}))
    })
    expect(result.current.filteredWheels).toHaveLength(0)

    act(() => {
      result.current.setPickerSearchByTab((prev) => ({...prev, wheels: 'ghelot'}))
    })
    expect(result.current.filteredWheels.length).toBeGreaterThan(0)
    expect(
      result.current.filteredWheels.some(
        (wheel) => wheel.awakener.toLowerCase() === 'helot: catena',
      ),
    ).toBe(true)
  })

  it('sorts wheels by rarity, then realm (Chaos first), then id', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    const wheels = result.current.filteredWheels
    expect(wheels.length).toBeGreaterThan(0)

    const rarityOrder = {SSR: 0, SR: 1, R: 2} as const
    const realmOrder = {CHAOS: 0, AEQUOR: 1, CARO: 2, ULTRA: 3, NEUTRAL: 4} as const

    for (let index = 1; index < wheels.length; index += 1) {
      const prev = wheels[index - 1]
      const next = wheels[index]
      const prevRarity = rarityOrder[prev.rarity]
      const nextRarity = rarityOrder[next.rarity]
      if (prevRarity !== nextRarity) {
        expect(prevRarity).toBeLessThanOrEqual(nextRarity)
        continue
      }

      const prevRealm = realmOrder[prev.realm]
      const nextRealm = realmOrder[next.realm]
      if (prevRealm !== nextRealm) {
        expect(prevRealm).toBeLessThanOrEqual(nextRealm)
        continue
      }

      expect(
        prev.id.localeCompare(next.id, undefined, {numeric: true, sensitivity: 'base'}),
      ).toBeLessThanOrEqual(0)
    }
  })

  it('promotes recommended wheels when the active awakener slot is used as the assignment target', async () => {
    const build = await getPrimaryBuild(27)
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )
    const targetSlot = requireDefined(result.current.teamSlots[0]?.slotId)

    act(() => {
      result.current.setActiveTeamSlots(
        result.current.teamSlots.map((slot, index) =>
          index === 0
            ? {
                ...slot,
                awakenerName: 'kathigu-ra',
                realm: 'CHAOS',
                wheels: [null, null] as [string | null, string | null],
              }
            : slot,
        ),
      )
      result.current.setPickerTab('wheels')
      result.current.setActiveSelection({kind: 'awakener', slotId: targetSlot})
    })

    await waitFor(() => {
      expect(result.current.filteredWheels.slice(0, 3).map((wheel) => wheel.id)).toEqual(
        build.recommendedWheels.flatMap((group) => group.wheelIds).slice(0, 3),
      )
    })
  })

  it('keeps fallback wheel ordering when recommendation promotion is disabled', async () => {
    window.localStorage.setItem(BUILDER_PROMOTE_RECOMMENDED_GEAR_KEY, '0')
    const fallbackTopIds = [...getWheels()]
      .sort(compareWheelsForUi)
      .slice(0, 10)
      .map((wheel) => wheel.id)

    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )
    const targetSlot = requireDefined(result.current.teamSlots[0]?.slotId)

    act(() => {
      result.current.setActiveTeamSlots(
        result.current.teamSlots.map((slot, index) =>
          index === 0
            ? {
                ...slot,
                awakenerName: 'kathigu-ra',
                realm: 'CHAOS',
                wheels: [null, null] as [string | null, string | null],
              }
            : slot,
        ),
      )
      result.current.setPickerTab('wheels')
      result.current.setActiveSelection({kind: 'awakener', slotId: targetSlot})
    })

    await waitFor(() => {
      expect(result.current.filteredWheels.slice(0, 10).map((wheel) => wheel.id)).toEqual(
        fallbackTopIds,
      )
    })
  })

  it('promotes matching wheel mainstats ahead of non-matching fallback wheels when enabled', async () => {
    const build = await getPrimaryBuild(27)
    const recommendedWheelIds = new Set(build.recommendedWheels.flatMap((group) => group.wheelIds))
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )
    const targetSlot = requireDefined(result.current.teamSlots[0]?.slotId)

    act(() => {
      result.current.setActiveTeamSlots(
        result.current.teamSlots.map((slot, index) =>
          index === 0
            ? {
                ...slot,
                awakenerName: 'kathigu-ra',
                realm: 'CHAOS',
                wheels: [null, null] as [string | null, string | null],
              }
            : slot,
        ),
      )
      result.current.setPickerTab('wheels')
      result.current.setActiveSelection({kind: 'awakener', slotId: targetSlot})
      result.current.setPromoteMatchingWheelMainstats(true)
    })

    await waitFor(() => {
      const matchingWheel = result.current.filteredWheels.find(
        (wheel) =>
          !recommendedWheelIds.has(wheel.id) &&
          build.recommendedWheelMainstats?.includes(wheel.mainstatKey),
      )
      const nonMatchingWheel = result.current.filteredWheels.find(
        (wheel) =>
          !recommendedWheelIds.has(wheel.id) &&
          !build.recommendedWheelMainstats?.includes(wheel.mainstatKey),
      )

      expect(matchingWheel).toBeDefined()
      expect(nonMatchingWheel).toBeDefined()
      expect(result.current.filteredWheels.indexOf(requireDefined(matchingWheel))).toBeLessThan(
        result.current.filteredWheels.indexOf(requireDefined(nonMatchingWheel)),
      )
    })
  })

  it('promotes recommended covenants in configured order for the active slot awakener', async () => {
    const build = await getPrimaryBuild(27)
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )
    const targetSlot = requireDefined(result.current.teamSlots[0]?.slotId)

    act(() => {
      result.current.setActiveTeamSlots(
        result.current.teamSlots.map((slot, index) =>
          index === 0
            ? {
                ...slot,
                awakenerName: 'kathigu-ra',
                realm: 'CHAOS',
                wheels: [null, null] as [string | null, string | null],
              }
            : slot,
        ),
      )
      result.current.setPickerTab('covenants')
      result.current.setActiveSelection({kind: 'awakener', slotId: targetSlot})
    })

    await waitFor(() => {
      expect(result.current.filteredCovenants.slice(0, 2).map((covenant) => covenant.id)).toEqual(
        build.recommendedCovenantIds.slice(0, 2),
      )
    })
  })

  it('promotes recommended posses to the top when recommendation promotion is enabled', async () => {
    const entries = await loadAwakenerBuildEntries()
    const entry = requireDefined(getAwakenerBuildEntryById(27, entries))
    const recommendedPosseIds = requireDefined(entry.recommendedPosseIds)
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )
    const targetSlot = requireDefined(result.current.teamSlots[0]?.slotId)

    act(() => {
      result.current.setActiveTeamSlots(
        result.current.teamSlots.map((slot, index) =>
          index === 0
            ? {
                ...slot,
                awakenerName: 'kathigu-ra',
                realm: 'CHAOS',
                wheels: [null, null] as [string | null, string | null],
              }
            : slot,
        ),
      )
      result.current.setPickerTab('posses')
      result.current.setActiveSelection({kind: 'awakener', slotId: targetSlot})
      result.current.setPromoteRecommendedGear(true)
    })

    await waitFor(() => {
      expect(result.current.filteredPosses[0]?.id).toBe(recommendedPosseIds[0])
    })
  })

  it('renames a team via begin/commit flow', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )
    const teamId = requireDefined(result.current.teams[0]?.id)

    act(() => {
      result.current.beginTeamRename(teamId, 'Team 1')
    })

    act(() => {
      result.current.setEditingTeamName(' Arena Squad ')
    })

    act(() => {
      result.current.commitTeamRename(teamId)
    })

    expect(result.current.teams[0]?.name).toBe('Arena Squad')
    expect(result.current.editingTeamId).toBeNull()
    expect(result.current.editingTeamName).toBe('')
  })

  it('hydrates teams and active team from persisted builder draft', () => {
    const persistedTeams = [
      {
        id: 'team-from-storage',
        name: 'Stored Team',
        slots: [
          {
            slotId: 'slot-1',
            awakenerName: 'Goliath',
            realm: 'AEQUOR',
            level: 60,
            wheels: [null, null] as [string | null, string | null],
          },
          {slotId: 'slot-2', wheels: [null, null] as [string | null, string | null]},
          {slotId: 'slot-3', wheels: [null, null] as [string | null, string | null]},
          {slotId: 'slot-4', wheels: [null, null] as [string | null, string | null]},
        ],
      },
    ]
    saveBuilderDraft(window.localStorage, {
      teams: persistedTeams,
      activeTeamId: 'team-from-storage',
    })

    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    expect(result.current.teams[0]?.id).toBe('team-from-storage')
    expect(result.current.effectiveActiveTeamId).toBe('team-from-storage')
  })

  it('autosaves team draft changes to localStorage', () => {
    vi.useFakeTimers()

    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    act(() => {
      result.current.setTeams([
        {
          id: 'team-autosave',
          name: 'Autosave Team',
          slots: [
            {slotId: 'slot-1', wheels: [null, null] as [string | null, string | null]},
            {slotId: 'slot-2', wheels: [null, null] as [string | null, string | null]},
            {slotId: 'slot-3', wheels: [null, null] as [string | null, string | null]},
            {slotId: 'slot-4', wheels: [null, null] as [string | null, string | null]},
          ],
        },
      ])
      result.current.setActiveTeamId('team-autosave')
    })

    act(() => {
      vi.advanceTimersByTime(400)
    })

    const storedRaw = requireDefined(window.localStorage.getItem(BUILDER_PERSISTENCE_KEY))
    const parsed = JSON.parse(storedRaw) as {payload: BuilderDraftPayload}
    expect(parsed.payload.activeTeamId).toBe('team-autosave')
    expect(parsed.payload.teams[0]?.name).toBe('Autosave Team')

    vi.useRealTimers()
    clearBuilderDraft(window.localStorage)
  })

  it('hydrates ownership and keeps linked awakeners synced', () => {
    saveCollectionOwnership(window.localStorage, {
      ownedAwakeners: {'42': 5},
      awakenerLevels: {},
      ownedWheels: {},
      ownedPosses: {},
      displayUnowned: true,
    })

    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    expect(result.current.ownedAwakenerLevelByName.get('ramona')).toBe(5)
    expect(result.current.ownedAwakenerLevelByName.get('ramona: timeworn')).toBe(5)
  })

  it('hides unowned entries when builder displayUnowned is false', () => {
    saveCollectionOwnership(window.localStorage, {
      ownedAwakeners: {},
      awakenerLevels: {},
      ownedWheels: {},
      ownedPosses: {},
      displayUnowned: true,
    })
    window.localStorage.setItem(BUILDER_DISPLAY_UNOWNED_KEY, '0')

    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    expect(result.current.filteredAwakeners).toHaveLength(0)
    expect(result.current.filteredWheels).toHaveLength(0)
    expect(result.current.filteredPosses).toHaveLength(0)
  })

  it('hydrates and persists builder displayUnowned independently from collection', () => {
    saveCollectionOwnership(window.localStorage, {
      ownedAwakeners: {},
      awakenerLevels: {},
      ownedWheels: {},
      ownedPosses: {},
      displayUnowned: true,
    })
    window.localStorage.setItem(BUILDER_DISPLAY_UNOWNED_KEY, '0')

    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    expect(result.current.displayUnowned).toBe(false)

    act(() => {
      result.current.setDisplayUnowned(true)
    })

    expect(window.localStorage.getItem(BUILDER_DISPLAY_UNOWNED_KEY)).toBe('1')
  })

  it('defaults team preview mode to compact and persists expanded mode', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    expect(result.current.teamPreviewMode).toBe('compact')

    act(() => {
      result.current.setTeamPreviewMode('expanded')
    })

    expect(window.localStorage.getItem(BUILDER_TEAM_PREVIEW_MODE_KEY)).toBe('expanded')
  })

  it('starts quick lineup by snapshotting and clearing the active team, then activating the first awakener step', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    act(() => {
      result.current.setActiveTeamSlots([
        {
          slotId: 'slot-1',
          awakenerName: 'Goliath',
          realm: 'AEQUOR',
          level: 60,
          wheels: ['wheel-a', null],
          covenantId: 'covenant-a',
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ])
      result.current.updateActiveTeam((team) => ({...team, posseId: 'manor-echoes'}))
    })

    act(() => {
      result.current.startQuickLineup()
    })

    expect(result.current.quickLineupSession?.isActive).toBe(true)
    expect(result.current.quickLineupSession?.currentStepIndex).toBe(0)
    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'awakener',
      slotId: 'slot-1',
    })
    expect(result.current.pickerTab).toBe('awakeners')
    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-1'})
    expect(result.current.teamSlots).toEqual([
      {slotId: 'slot-1', wheels: [null, null]},
      {slotId: 'slot-2', wheels: [null, null]},
      {slotId: 'slot-3', wheels: [null, null]},
      {slotId: 'slot-4', wheels: [null, null]},
    ])
    expect(result.current.activeTeam.posseId).toBeUndefined()
  })

  it('skips and backs through quick lineup steps using picker-tab-aware selection targets', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    act(() => {
      result.current.startQuickLineup()
    })

    act(() => {
      result.current.skipQuickLineupStep()
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'awakener',
      slotId: 'slot-2',
    })
    expect(result.current.pickerTab).toBe('awakeners')
    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-2'})

    act(() => {
      result.current.goBackQuickLineupStep()
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'awakener',
      slotId: 'slot-1',
    })
    expect(result.current.pickerTab).toBe('awakeners')
    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-1'})
  })

  it('jumps quick lineup focus when the user selects a different slot manually', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    act(() => {
      result.current.startQuickLineup()
    })

    act(() => {
      result.current.handleCovenantSlotClick('slot-1')
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'covenant',
      slotId: 'slot-1',
    })
    expect(result.current.pickerTab).toBe('covenants')
    expect(result.current.activeSelection).toEqual({kind: 'covenant', slotId: 'slot-1'})
  })

  it('keeps the current quick lineup wheel step active when removing that wheel', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    act(() => {
      result.current.startQuickLineup()
    })

    act(() => {
      result.current.setActiveTeamSlots([
        {
          slotId: 'slot-1',
          awakenerName: 'Goliath',
          realm: 'AEQUOR',
          level: 60,
          wheels: ['wheel-a', null],
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ])
    })

    act(() => {
      result.current.advanceQuickLineupStep([
        {
          slotId: 'slot-1',
          awakenerName: 'Goliath',
          realm: 'AEQUOR',
          level: 60,
          wheels: ['wheel-a', null],
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ])
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 0,
    })

    act(() => {
      result.current.handleRemoveActiveSelection('slot-1')
    })

    expect(result.current.teamSlots[0]?.awakenerName).toBe('Goliath')
    expect(result.current.teamSlots[0]?.wheels[0]).toBeNull()
    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 0,
    })
    expect(result.current.pickerTab).toBe('wheels')
    expect(result.current.activeSelection).toEqual({kind: 'wheel', slotId: 'slot-1', wheelIndex: 0})
  })

  it('keeps the current quick lineup wheel step active when clearing that wheel through the shared wheel-clear path', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    act(() => {
      result.current.startQuickLineup()
    })

    act(() => {
      result.current.setActiveTeamSlots([
        {
          slotId: 'slot-1',
          awakenerName: 'Goliath',
          realm: 'AEQUOR',
          level: 60,
          wheels: ['wheel-a', null],
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ])
    })

    act(() => {
      result.current.advanceQuickLineupStep([
        {
          slotId: 'slot-1',
          awakenerName: 'Goliath',
          realm: 'AEQUOR',
          level: 60,
          wheels: ['wheel-a', null],
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ])
    })

    act(() => {
      result.current.clearTeamWheel('slot-1', 0)
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 0,
    })
    expect(result.current.pickerTab).toBe('wheels')
    expect(result.current.activeSelection).toEqual({kind: 'wheel', slotId: 'slot-1', wheelIndex: 0})
  })

  it('keeps quick lineup coherent when a slot is cleared through the shared slot-clear path', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    act(() => {
      result.current.startQuickLineup()
    })

    act(() => {
      result.current.setActiveTeamSlots([
        {
          slotId: 'slot-1',
          awakenerName: 'Goliath',
          realm: 'AEQUOR',
          level: 60,
          wheels: ['wheel-a', null],
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ])
    })

    act(() => {
      result.current.advanceQuickLineupStep([
        {
          slotId: 'slot-1',
          awakenerName: 'Goliath',
          realm: 'AEQUOR',
          level: 60,
          wheels: ['wheel-a', null],
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ])
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 0,
    })

    act(() => {
      result.current.clearTeamSlot('slot-1')
    })

    expect(result.current.teamSlots[0]?.awakenerName).toBeUndefined()
    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'awakener',
      slotId: 'slot-1',
    })
    expect(result.current.pickerTab).toBe('awakeners')
    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-1'})
  })

  it('jumps quick lineup to the drop target when swapping active team slots', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    act(() => {
      result.current.startQuickLineup()
    })

    act(() => {
      result.current.setActiveTeamSlots([
        {
          slotId: 'slot-1',
          awakenerName: 'Goliath',
          realm: 'AEQUOR',
          level: 60,
          wheels: [null, null],
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ])
    })

    act(() => {
      result.current.swapActiveTeamSlots('slot-1', 'slot-2')
    })

    expect(result.current.teamSlots[1]?.awakenerName).toBe('Goliath')
    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'awakener',
      slotId: 'slot-2',
    })
    expect(result.current.pickerTab).toBe('awakeners')
    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-2'})
  })

  it('falls back to the drop target awakener step when swapping slots during a quick lineup wheel step', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    act(() => {
      result.current.startQuickLineup()
    })

    act(() => {
      result.current.setActiveTeamSlots([
        {
          slotId: 'slot-1',
          awakenerName: 'Goliath',
          realm: 'AEQUOR',
          level: 60,
          wheels: ['wheel-a', null],
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ])
    })

    act(() => {
      result.current.advanceQuickLineupStep([
        {
          slotId: 'slot-1',
          awakenerName: 'Goliath',
          realm: 'AEQUOR',
          level: 60,
          wheels: ['wheel-a', null],
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ])
    })

    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'wheel',
      slotId: 'slot-1',
      wheelIndex: 0,
    })

    act(() => {
      result.current.swapActiveTeamSlots('slot-1', 'slot-2')
    })

    expect(result.current.teamSlots[1]?.awakenerName).toBe('Goliath')
    expect(result.current.quickLineupSession?.currentStep).toEqual({
      kind: 'awakener',
      slotId: 'slot-2',
    })
    expect(result.current.pickerTab).toBe('awakeners')
    expect(result.current.activeSelection).toEqual({kind: 'awakener', slotId: 'slot-2'})
  })

  it('cancels quick lineup by restoring the pre-session team snapshot', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    act(() => {
      result.current.setActiveTeamSlots([
        {
          slotId: 'slot-1',
          awakenerName: 'Goliath',
          realm: 'AEQUOR',
          level: 60,
          wheels: ['wheel-a', 'wheel-b'],
          covenantId: 'covenant-a',
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ])
      result.current.updateActiveTeam((team) => ({...team, posseId: 'manor-echoes'}))
    })

    act(() => {
      result.current.startQuickLineup()
    })

    act(() => {
      result.current.skipQuickLineupStep()
      result.current.skipQuickLineupStep()
      result.current.cancelQuickLineup()
    })

    expect(result.current.quickLineupSession).toBeNull()
    expect(result.current.teamSlots[0]).toEqual({
      slotId: 'slot-1',
      awakenerName: 'Goliath',
      realm: 'AEQUOR',
      level: 60,
      wheels: ['wheel-a', 'wheel-b'],
      covenantId: 'covenant-a',
    })
    expect(result.current.activeTeam.posseId).toBe('manor-echoes')
  })

  it('finishes quick lineup by keeping the partially built team state', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    act(() => {
      result.current.startQuickLineup()
      result.current.setActiveTeamSlots([
        {
          slotId: 'slot-1',
          awakenerName: 'Goliath',
          realm: 'AEQUOR',
          level: 60,
          wheels: [null, null],
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ])
      result.current.finishQuickLineup()
    })

    expect(result.current.quickLineupSession).toBeNull()
    expect(result.current.teamSlots[0]?.awakenerName).toBe('Goliath')
    expect(result.current.activeTeam.posseId).toBeUndefined()
  })

  it('exposes awakener sort controls for picker sorting', () => {
    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    expect(result.current.awakenerSortKey).toBe('LEVEL')
    expect(result.current.awakenerSortDirection).toBe('DESC')
    expect(result.current.awakenerSortGroupByRealm).toBe(true)

    act(() => {
      result.current.setAwakenerSortKey('RARITY')
      result.current.toggleAwakenerSortDirection()
      result.current.setAwakenerSortGroupByRealm(true)
    })

    expect(result.current.awakenerSortKey).toBe('RARITY')
    expect(result.current.awakenerSortDirection).toBe('ASC')
    expect(result.current.awakenerSortGroupByRealm).toBe(true)
  })

  it('hydrates and persists builder awakener sort config', () => {
    window.localStorage.setItem(BUILDER_AWAKENER_SORT_GROUP_BY_REALM_KEY, '1')
    window.localStorage.setItem(BUILDER_AWAKENER_SORT_KEY_KEY, 'RARITY')
    window.localStorage.setItem(BUILDER_AWAKENER_SORT_DIRECTION_KEY, 'ASC')

    const {result} = renderHook(() =>
      useBuilderViewModel({
        searchInputRef: createRef<HTMLInputElement>(),
      }),
    )

    expect(result.current.awakenerSortKey).toBe('RARITY')
    expect(result.current.awakenerSortDirection).toBe('ASC')
    expect(result.current.awakenerSortGroupByRealm).toBe(true)

    act(() => {
      result.current.setAwakenerSortKey('LEVEL')
      result.current.toggleAwakenerSortDirection()
      result.current.setAwakenerSortGroupByRealm(false)
    })

    expect(window.localStorage.getItem(BUILDER_AWAKENER_SORT_KEY_KEY)).toBe('LEVEL')
    expect(window.localStorage.getItem(BUILDER_AWAKENER_SORT_DIRECTION_KEY)).toBe('DESC')
    expect(window.localStorage.getItem(BUILDER_AWAKENER_SORT_GROUP_BY_REALM_KEY)).toBe('0')
  })
})
