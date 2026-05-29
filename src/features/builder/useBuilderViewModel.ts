import {useEffect, useMemo, useState, type RefObject} from 'react'

import {useStore} from 'zustand'

import {
  compareCovenantsForBuildRecommendation,
  compareWheelsForBuildRecommendation,
} from '@/domain/awakener-builds'
import {getAwakenerIdentityKeyById} from '@/domain/awakener-identity'
import {searchAwakeners} from '@/domain/awakeners-search'
import {compareAwakenersForCollectionSort} from '@/domain/collection-sorting'
import {getCovenants} from '@/domain/covenants'
import {searchCovenants} from '@/domain/covenants-search'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getPosseAssetById} from '@/domain/posse-assets'
import {getPosses} from '@/domain/posses'
import {searchPosses} from '@/domain/posses-search'
import {getBrowserLocalStorage} from '@/domain/storage'
import {compareWheelsForUi} from '@/domain/wheel-sort'
import {getWheels} from '@/domain/wheels'
import {searchWheels} from '@/domain/wheels-search'
import {builderDraftStore, type BuilderDraftFocus} from '@/stores/builderDraftStore'
import {collectionOwnershipStore} from '@/stores/collectionOwnershipStore'

import {createBuilderOwnershipProjection} from './builder-ownership-projection'
import {loadBuilderDraft, saveBuilderDraft, type BuilderDraftPayload} from './builder-persistence'
import {allAwakeners} from './constants'
import {getPublicQuickLineupSession} from './quick-lineup'
import {
  nextSelectionAfterCovenantRemoved,
  nextSelectionAfterWheelRemoved,
  toggleAwakenerSelection,
  toggleCovenantSelection,
  toggleWheelSelection,
} from './selection-state'
import {createInitialTeams} from './team-collection'
import {
  clearCovenantAssignment,
  clearSlotAssignment,
  clearWheelAssignment,
  getTeamRealmSet,
  swapSlotAssignments,
} from './team-state'
import type {ActiveSelection, QuickLineupSession, Team, TeamSlot, WheelUsageLocation} from './types'
import {useAwakenerBuildRecommendations} from './useAwakenerBuildRecommendations'
import {useBuilderPreferences} from './useBuilderPreferences'
import {matchesWheelMainstat} from './wheel-mainstats'
import {getWheelSlotIndex, toWheelSlotIndex} from './wheel-slot-index'

interface UseBuilderViewModelOptions {
  searchInputRef: RefObject<HTMLInputElement | null>
}

const BUILDER_AUTOSAVE_DEBOUNCE_MS = 300

function sinkUnownedToEnd<T>(items: T[], isOwned: (item: T) => boolean): T[] {
  const owned: T[] = []
  const unowned: T[] = []
  for (const item of items) {
    if (isOwned(item)) {
      owned.push(item)
    } else {
      unowned.push(item)
    }
  }
  return [...owned, ...unowned]
}

function createDefaultBuilderState() {
  const teams = createInitialTeams()
  return {
    teams,
    activeTeamId: teams[0]?.id ?? '',
  }
}

function buildUsedWheelByTeamOrder(teams: Team[]): Map<string, WheelUsageLocation> {
  const wheelMap = new Map<string, WheelUsageLocation>()

  for (const [teamOrder, team] of teams.entries()) {
    for (const slot of team.slots) {
      if (slot.isSupport) {
        continue
      }

      for (const [wheelIndex, wheelId] of slot.wheels.entries()) {
        if (!wheelId || wheelMap.has(wheelId)) {
          continue
        }

        wheelMap.set(wheelId, {
          teamOrder,
          teamId: team.id,
          slotId: slot.slotId,
          wheelIndex: toWheelSlotIndex(wheelIndex),
        })
      }
    }
  }

  return wheelMap
}

export function useBuilderViewModel({searchInputRef}: UseBuilderViewModelOptions) {
  const storage = useMemo(() => getBrowserLocalStorage(), [])
  const [canAutosaveBuilderDraft, setCanAutosaveBuilderDraft] = useState(() => {
    const persisted = loadBuilderDraft(storage)
    const initialBuilderState =
      persisted.status === 'loaded' || persisted.status === 'loaded-legacy'
        ? persisted.draft
        : createDefaultBuilderState()
    builderDraftStore.getState().hydrateBuilderDraft(initialBuilderState)
    collectionOwnershipStore.getState().hydrate()
    return persisted.status !== 'invalid-current'
  })
  const teams = useStore(builderDraftStore, (state) => state.teams)
  const activeTeamId = useStore(builderDraftStore, (state) => state.activeTeamId)
  const setTeams = useStore(builderDraftStore, (state) => state.setTeams)
  const setActiveTeamId = useStore(builderDraftStore, (state) => state.setActiveTeamId)
  const activeSelection = useStore(builderDraftStore, (state) => state.activeSelection)
  const setActiveSelection = useStore(builderDraftStore, (state) => state.setActiveSelection)
  const editingTeamId = useStore(builderDraftStore, (state) => state.editingTeamId)
  const editingTeamName = useStore(builderDraftStore, (state) => state.editingTeamName)
  const editingTeamSurface = useStore(builderDraftStore, (state) => state.editingTeamSurface)
  const setEditingTeamName = useStore(builderDraftStore, (state) => state.setEditingTeamName)
  const beginTeamRename = useStore(builderDraftStore, (state) => state.beginTeamRename)
  const cancelTeamRename = useStore(builderDraftStore, (state) => state.cancelTeamRename)
  const commitTeamRename = useStore(builderDraftStore, (state) => state.commitTeamRename)
  const updateActiveTeam = useStore(builderDraftStore, (state) => state.updateActiveTeam)
  const setActiveTeamSlotsInStore = useStore(builderDraftStore, (state) => state.setActiveTeamSlots)
  const quickLineupState = useStore(builderDraftStore, (state) => state.quickLineupState)
  const storeReplaceBuilderDraft = useStore(builderDraftStore, (state) => state.replaceBuilderDraft)
  const storeResetBuilderDraft = useStore(builderDraftStore, (state) => state.resetBuilderDraft)
  const storeStartQuickLineup = useStore(builderDraftStore, (state) => state.startQuickLineup)
  const storeAdvanceQuickLineupStep = useStore(
    builderDraftStore,
    (state) => state.advanceQuickLineupStep,
  )
  const storeGoBackQuickLineupStep = useStore(
    builderDraftStore,
    (state) => state.goBackQuickLineupStep,
  )
  const storeFinishQuickLineup = useStore(builderDraftStore, (state) => state.finishQuickLineup)
  const storeCancelQuickLineup = useStore(builderDraftStore, (state) => state.cancelQuickLineup)
  const storeJumpToQuickLineupStep = useStore(
    builderDraftStore,
    (state) => state.jumpToQuickLineupStep,
  )
  const storeRestoreQuickLineupFocus = useStore(
    builderDraftStore,
    (state) => state.restoreQuickLineupFocus,
  )
  const reconcileQuickLineupAfterSlotsChange = useStore(
    builderDraftStore,
    (state) => state.reconcileQuickLineupAfterSlotsChange,
  )
  const collectionOwnership = useStore(collectionOwnershipStore, (state) => state.ownership)
  const {
    pickerTab,
    setPickerTab,
    awakenerFilter,
    setAwakenerFilter,
    posseFilter,
    setPosseFilter,
    wheelRarityFilter,
    setWheelRarityFilter,
    wheelMainstatFilter,
    setWheelMainstatFilter,
    awakenerSortKey,
    setAwakenerSortKey,
    awakenerSortDirection,
    toggleAwakenerSortDirection,
    awakenerSortGroupByRealm,
    setAwakenerSortGroupByRealm,
    pickerSearchByTab,
    setPickerSearchByTab,
    displayUnowned,
    setDisplayUnowned,
    sinkUnownedToBottom,
    setSinkUnownedToBottom,
    allowDupes,
    setAllowDupes,
    promoteRecommendedGear,
    setPromoteRecommendedGear,
    promoteMatchingWheelMainstats,
    setPromoteMatchingWheelMainstats,
    teamPreviewMode,
    setTeamPreviewMode,
  } = useBuilderPreferences({searchInputRef, storage})

  const effectiveActiveTeamId = useMemo(
    () => (teams.some((team) => team.id === activeTeamId) ? activeTeamId : (teams[0]?.id ?? '')),
    [teams, activeTeamId],
  )
  const activeTeam = useMemo(
    () => teams.find((team) => team.id === effectiveActiveTeamId) ?? teams[0],
    [teams, effectiveActiveTeamId],
  )
  const teamSlots = activeTeam.slots
  const activePosseId = activeTeam.posseId

  function setActiveTeamSlots(nextSlots: TeamSlot[]) {
    syncQuickLineupFocus(setActiveTeamSlotsInStore(nextSlots))
  }

  const pickerAwakeners = useMemo(
    () =>
      [...allAwakeners].sort((left, right) =>
        formatAwakenerNameForUi(left.name).localeCompare(formatAwakenerNameForUi(right.name)),
      ),
    [],
  )
  const pickerPosses = useMemo(
    () => [...getPosses()].sort((left, right) => left.name.localeCompare(right.name)),
    [],
  )
  const pickerCovenants = useMemo(
    () => [...getCovenants()].sort((left, right) => left.id.localeCompare(right.id)),
    [],
  )
  const pickerWheels = useMemo(() => [...getWheels()], [])
  const {
    ownedAwakenerLevelByName,
    awakenerLevelByName,
    ownedWheelLevelById,
    ownedPosseLevelById,
    isAwakenerOwnedByName,
    isWheelOwnedById,
    isPosseOwnedById,
  } = useMemo(
    () =>
      createBuilderOwnershipProjection({
        awakeners: pickerAwakeners,
        wheels: pickerWheels,
        posses: pickerPosses,
        ownership: collectionOwnership,
      }),
    [pickerAwakeners, pickerWheels, pickerPosses, collectionOwnership],
  )

  const activePosse = useMemo(
    () => pickerPosses.find((posse) => posse.id === activePosseId),
    [activePosseId, pickerPosses],
  )
  const activePosseAsset = activePosse ? getPosseAssetById(activePosse.id) : undefined
  const activeSearchQuery = pickerSearchByTab[pickerTab]
  const activeTeamSlotById = useMemo(
    () => new Map(teamSlots.map((slot) => [slot.slotId, slot])),
    [teamSlots],
  )
  const {activeBuild, teamRecommendedPosseIds} = useAwakenerBuildRecommendations({
    activeSelection,
    slotsById: activeTeamSlotById,
  })

  const searchedAwakeners = useMemo(
    () => searchAwakeners(pickerAwakeners, pickerSearchByTab.awakeners),
    [pickerAwakeners, pickerSearchByTab.awakeners],
  )
  const filteredAwakeners = useMemo(() => {
    const byRealm =
      awakenerFilter === 'ALL'
        ? searchedAwakeners
        : searchedAwakeners.filter(
            (awakener) => awakener.realm.trim().toUpperCase() === awakenerFilter,
          )
    const byOwnership = displayUnowned
      ? byRealm
      : byRealm.filter((awakener) => isAwakenerOwnedByName(awakener.name))

    const sorted = [...byOwnership].sort((left, right) =>
      compareAwakenersForCollectionSort(
        {
          label: formatAwakenerNameForUi(left.name),
          index: left.numericId ?? Number.MAX_SAFE_INTEGER,
          owned: isAwakenerOwnedByName(left.name),
          enlighten: ownedAwakenerLevelByName.get(left.name) ?? 0,
          level: awakenerLevelByName.get(left.name) ?? 60,
          rarity: left.rarity,
          realm: left.realm,
          releaseDate: left.releaseDate,
        },
        {
          label: formatAwakenerNameForUi(right.name),
          index: right.numericId ?? Number.MAX_SAFE_INTEGER,
          owned: isAwakenerOwnedByName(right.name),
          enlighten: ownedAwakenerLevelByName.get(right.name) ?? 0,
          level: awakenerLevelByName.get(right.name) ?? 60,
          rarity: right.rarity,
          realm: right.realm,
          releaseDate: right.releaseDate,
        },
        {
          key: awakenerSortKey,
          direction: awakenerSortDirection,
          groupByRealm: awakenerSortGroupByRealm,
        },
      ),
    )
    return sinkUnownedToBottom
      ? sinkUnownedToEnd(sorted, (awakener) => isAwakenerOwnedByName(awakener.name))
      : sorted
  }, [
    awakenerFilter,
    searchedAwakeners,
    displayUnowned,
    sinkUnownedToBottom,
    isAwakenerOwnedByName,
    ownedAwakenerLevelByName,
    awakenerLevelByName,
    awakenerSortKey,
    awakenerSortDirection,
    awakenerSortGroupByRealm,
  ])

  const searchedPosses = useMemo(
    () => searchPosses(pickerPosses, pickerSearchByTab.posses),
    [pickerPosses, pickerSearchByTab.posses],
  )
  const filteredPosses = useMemo(() => {
    let result: typeof searchedPosses
    if (posseFilter === 'ALL') {
      result = displayUnowned
        ? searchedPosses
        : searchedPosses.filter((posse) => isPosseOwnedById(posse.id))
    } else if (posseFilter === 'FADED_LEGACY') {
      result = searchedPosses.filter(
        (posse) => posse.isFadedLegacy && (displayUnowned || isPosseOwnedById(posse.id)),
      )
    } else {
      result = searchedPosses.filter(
        (posse) =>
          !posse.isFadedLegacy &&
          posse.realm.trim().toUpperCase() === posseFilter &&
          (displayUnowned || isPosseOwnedById(posse.id)),
      )
    }

    const promoted = promoteRecommendedGear
      ? [...result].sort((left, right) => {
          const leftRecommended = teamRecommendedPosseIds.has(left.id)
          const rightRecommended = teamRecommendedPosseIds.has(right.id)
          if (leftRecommended === rightRecommended) {
            return 0
          }
          return leftRecommended ? -1 : 1
        })
      : result

    return sinkUnownedToBottom
      ? sinkUnownedToEnd(promoted, (posse) => isPosseOwnedById(posse.id))
      : promoted
  }, [
    posseFilter,
    searchedPosses,
    displayUnowned,
    sinkUnownedToBottom,
    isPosseOwnedById,
    promoteRecommendedGear,
    teamRecommendedPosseIds,
  ])
  const filteredWheels = useMemo(() => {
    const wheelsByRarity =
      wheelRarityFilter === 'ALL'
        ? pickerWheels
        : pickerWheels.filter((wheel) => wheel.rarity === wheelRarityFilter)
    const wheelsByMainstat =
      wheelMainstatFilter === 'ALL'
        ? wheelsByRarity
        : wheelsByRarity.filter((wheel) =>
            matchesWheelMainstat(wheel.mainstatKey, wheelMainstatFilter),
          )

    const visibleWheels = displayUnowned
      ? wheelsByMainstat
      : wheelsByMainstat.filter((wheel) => isWheelOwnedById(wheel.id))
    const queryFiltered = searchWheels(visibleWheels, pickerSearchByTab.wheels)
    const sorted = [...queryFiltered].sort((left, right) =>
      promoteRecommendedGear
        ? compareWheelsForBuildRecommendation(left, right, {
            build: activeBuild,
            fallbackCompare: compareWheelsForUi,
            promoteMainstats: promoteMatchingWheelMainstats,
          })
        : compareWheelsForUi(left, right),
    )
    return sinkUnownedToBottom
      ? sinkUnownedToEnd(sorted, (wheel) => isWheelOwnedById(wheel.id))
      : sorted
  }, [
    pickerWheels,
    pickerSearchByTab.wheels,
    wheelMainstatFilter,
    wheelRarityFilter,
    displayUnowned,
    sinkUnownedToBottom,
    isWheelOwnedById,
    promoteRecommendedGear,
    activeBuild,
    promoteMatchingWheelMainstats,
  ])
  const filteredCovenants = useMemo(() => {
    const queryFiltered = searchCovenants(pickerCovenants, pickerSearchByTab.covenants)
    return [...queryFiltered].sort((left, right) =>
      promoteRecommendedGear
        ? compareCovenantsForBuildRecommendation(left, right, activeBuild, {
            fallbackCompare: (leftCovenant, rightCovenant) =>
              leftCovenant.id.localeCompare(rightCovenant.id, undefined, {
                numeric: true,
                sensitivity: 'base',
              }),
          })
        : left.id.localeCompare(right.id, undefined, {numeric: true, sensitivity: 'base'}),
    )
  }, [pickerCovenants, pickerSearchByTab.covenants, promoteRecommendedGear, activeBuild])

  const teamRealmSet = useMemo(() => getTeamRealmSet(teamSlots), [teamSlots])
  const usedAwakenerByIdentityKey = useMemo(() => {
    const identityMap = new Map<string, string>()
    teams.forEach((team) => {
      team.slots.forEach((slot) => {
        if (!slot.awakenerId || slot.isSupport) {
          return
        }
        const identityKey = getAwakenerIdentityKeyById(slot.awakenerId)
        if (!identityMap.has(identityKey)) {
          identityMap.set(identityKey, team.id)
        }
      })
    })
    return identityMap
  }, [teams])
  const usedAwakenerIdentityKeys = useMemo(
    () => new Set(usedAwakenerByIdentityKey.keys()),
    [usedAwakenerByIdentityKey],
  )
  const usedPosseByTeamOrder = useMemo(() => {
    const posseMap = new Map<string, number>()
    teams.forEach((team, index) => {
      if (!team.posseId || posseMap.has(team.posseId)) {
        return
      }
      posseMap.set(team.posseId, index)
    })
    return posseMap
  }, [teams])
  const usedWheelByTeamOrder = useMemo(() => buildUsedWheelByTeamOrder(teams), [teams])
  const hasSupportAwakener = useMemo(
    () => teams.some((team) => team.slots.some((slot) => slot.isSupport)),
    [teams],
  )

  useEffect(() => {
    if (!canAutosaveBuilderDraft) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      saveBuilderDraft(storage, {teams, activeTeamId: effectiveActiveTeamId})
    }, BUILDER_AUTOSAVE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [canAutosaveBuilderDraft, storage, teams, effectiveActiveTeamId])

  const resolvedActiveSelection = useMemo(() => {
    if (!activeSelection) {
      return null
    }
    return teamSlots.some((slot) => slot.slotId === activeSelection.slotId) ? activeSelection : null
  }, [activeSelection, teamSlots])

  const slotById = activeTeamSlotById

  function handleCardClick(slotId: string) {
    if (quickLineupState) {
      jumpToQuickLineupStep({kind: 'awakener', slotId})
      return
    }
    setPickerTab('awakeners')
    setActiveSelection((prev) => toggleAwakenerSelection(prev, slotId))
  }

  function handleWheelSlotClick(slotId: string, wheelIndex: number) {
    const resolvedWheelIndex = getWheelSlotIndex(wheelIndex)
    if (resolvedWheelIndex === null) {
      return
    }

    if (quickLineupState) {
      jumpToQuickLineupStep({kind: 'wheel', slotId, wheelIndex: resolvedWheelIndex})
      return
    }
    setPickerTab('wheels')
    setActiveSelection((prev) => toggleWheelSelection(prev, slotId, resolvedWheelIndex))
  }

  function handleCovenantSlotClick(slotId: string) {
    if (quickLineupState) {
      jumpToQuickLineupStep({kind: 'covenant', slotId})
      return
    }
    setPickerTab('covenants')
    setActiveSelection((prev) => toggleCovenantSelection(prev, slotId))
  }

  function handleRemoveActiveSelection(slotId: string) {
    if (resolvedActiveSelection?.slotId !== slotId) {
      return
    }
    if (resolvedActiveSelection.kind === 'awakener') {
      clearTeamSlot(slotId)
      return
    }
    if (resolvedActiveSelection.kind === 'covenant') {
      clearTeamCovenant(slotId)
      return
    }
    clearTeamWheel(slotId, resolvedActiveSelection.wheelIndex)
  }

  function replaceBuilderDraft(nextDraft: BuilderDraftPayload) {
    storeReplaceBuilderDraft(nextDraft)
    setCanAutosaveBuilderDraft(true)
    saveBuilderDraft(storage, nextDraft)
  }

  function resetBuilderDraft() {
    const nextDraft = storeResetBuilderDraft()
    setCanAutosaveBuilderDraft(true)
    saveBuilderDraft(storage, nextDraft)
    return nextDraft
  }

  function applyActiveTeamSlotMutation(
    nextSlots: TeamSlot[],
    preferredStep: Exclude<ActiveSelection, null> | {kind: 'posse'} | null = null,
    nextSelection: ActiveSelection = null,
  ) {
    updateActiveTeam((team) => ({...team, slots: nextSlots}))
    if (quickLineupState) {
      syncQuickLineupFocus(reconcileQuickLineupAfterSlotsChange(nextSlots, preferredStep))
      return
    }
    setActiveSelection(nextSelection)
  }

  function syncQuickLineupFocus(focus: BuilderDraftFocus | null) {
    if (!focus) {
      return
    }

    if (focus.pickerTab) {
      setPickerTab(focus.pickerTab)
    }
  }

  function clearTeamSlot(slotId: string) {
    const result = clearSlotAssignment(teamSlots, slotId)
    applyActiveTeamSlotMutation(result.nextSlots, {kind: 'awakener', slotId}, null)
  }

  function clearTeamWheel(slotId: string, wheelIndex: number) {
    const resolvedWheelIndex = getWheelSlotIndex(wheelIndex)
    if (resolvedWheelIndex === null) {
      return
    }

    const result = clearWheelAssignment(teamSlots, slotId, resolvedWheelIndex)
    applyActiveTeamSlotMutation(
      result.nextSlots,
      {
        kind: 'wheel',
        slotId,
        wheelIndex: resolvedWheelIndex,
      },
      nextSelectionAfterWheelRemoved(resolvedActiveSelection, slotId, resolvedWheelIndex),
    )
  }

  function clearTeamCovenant(slotId: string) {
    const result = clearCovenantAssignment(teamSlots, slotId)
    applyActiveTeamSlotMutation(
      result.nextSlots,
      {kind: 'covenant', slotId},
      nextSelectionAfterCovenantRemoved(resolvedActiveSelection, slotId),
    )
  }

  function swapActiveTeamSlots(sourceSlotId: string, targetSlotId: string) {
    const result = swapSlotAssignments(teamSlots, sourceSlotId, targetSlotId)
    applyActiveTeamSlotMutation(
      result.nextSlots,
      {kind: 'awakener', slotId: targetSlotId},
      {kind: 'awakener', slotId: targetSlotId},
    )
  }

  function restoreQuickLineupFocus() {
    syncQuickLineupFocus(storeRestoreQuickLineupFocus())
  }

  function startQuickLineup() {
    syncQuickLineupFocus(storeStartQuickLineup())
  }

  function advanceQuickLineupStep(nextSlotsOverride?: TeamSlot[]) {
    syncQuickLineupFocus(storeAdvanceQuickLineupStep(nextSlotsOverride))
  }

  function skipQuickLineupStep() {
    advanceQuickLineupStep()
  }

  function goBackQuickLineupStep() {
    syncQuickLineupFocus(storeGoBackQuickLineupStep())
  }

  function finishQuickLineup() {
    syncQuickLineupFocus(storeFinishQuickLineup())
  }

  function cancelQuickLineup() {
    syncQuickLineupFocus(storeCancelQuickLineup())
  }

  function jumpToQuickLineupStep(step: Exclude<ActiveSelection, null> | {kind: 'posse'}) {
    syncQuickLineupFocus(storeJumpToQuickLineupStep(step))
  }

  const quickLineupSession: QuickLineupSession | null = useMemo(
    () => (quickLineupState ? getPublicQuickLineupSession(quickLineupState, teamSlots) : null),
    [quickLineupState, teamSlots],
  )

  return {
    collectionOwnership,
    displayUnowned,
    setDisplayUnowned,
    sinkUnownedToBottom,
    setSinkUnownedToBottom,
    allowDupes,
    setAllowDupes,
    promoteRecommendedGear,
    setPromoteRecommendedGear,
    promoteMatchingWheelMainstats,
    setPromoteMatchingWheelMainstats,
    teamPreviewMode,
    setTeamPreviewMode,
    quickLineupSession,
    ownedAwakenerLevelByName,
    awakenerLevelByName,
    ownedWheelLevelById,
    ownedPosseLevelById,
    teams,
    setTeams,
    activeTeamId,
    setActiveTeamId,
    editingTeamId,
    editingTeamName,
    editingTeamSurface,
    setEditingTeamName,
    pickerTab,
    setPickerTab,
    awakenerFilter,
    setAwakenerFilter,
    posseFilter,
    setPosseFilter,
    wheelRarityFilter,
    setWheelRarityFilter,
    wheelMainstatFilter,
    setWheelMainstatFilter,
    awakenerSortKey,
    setAwakenerSortKey,
    awakenerSortDirection,
    toggleAwakenerSortDirection,
    awakenerSortGroupByRealm,
    setAwakenerSortGroupByRealm,
    pickerSearchByTab,
    setPickerSearchByTab,
    activeSelection,
    setActiveSelection,
    effectiveActiveTeamId,
    activeTeam,
    teamSlots,
    activePosseId,
    pickerPosses,
    activePosse,
    activePosseAsset,
    activeSearchQuery,
    activeBuild,
    teamRecommendedPosseIds,
    filteredAwakeners,
    filteredPosses,
    filteredWheels,
    filteredCovenants,
    teamRealmSet,
    usedAwakenerByIdentityKey,
    usedAwakenerIdentityKeys,
    hasSupportAwakener,
    usedPosseByTeamOrder,
    usedWheelByTeamOrder,
    resolvedActiveSelection,
    slotById,
    updateActiveTeam,
    setActiveTeamSlots,
    beginTeamRename,
    cancelTeamRename,
    commitTeamRename,
    handleCardClick,
    handleWheelSlotClick,
    handleCovenantSlotClick,
    handleRemoveActiveSelection,
    clearTeamSlot,
    clearTeamWheel,
    clearTeamCovenant,
    swapActiveTeamSlots,
    replaceBuilderDraft,
    resetBuilderDraft,
    startQuickLineup,
    advanceQuickLineupStep,
    skipQuickLineupStep,
    goBackQuickLineupStep,
    finishQuickLineup,
    cancelQuickLineup,
    restoreQuickLineupFocus,
    jumpToQuickLineupStep,
  }
}
