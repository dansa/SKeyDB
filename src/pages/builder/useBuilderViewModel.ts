import {useCallback, useEffect, useMemo, useState, type RefObject} from 'react'

import {
  compareCovenantsForBuildRecommendation,
  compareWheelsForBuildRecommendation,
} from '@/domain/awakener-builds'
import {getAwakenerIdentityKey} from '@/domain/awakener-identity'
import {searchAwakeners} from '@/domain/awakeners-search'
import {loadCollectionOwnership} from '@/domain/collection-ownership'
import {compareAwakenersForCollectionSort} from '@/domain/collection-sorting'
import {getCovenants} from '@/domain/covenants'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getPosseAssetById} from '@/domain/posse-assets'
import {getPosses} from '@/domain/posses'
import {searchPosses} from '@/domain/posses-search'
import {normalizeForSearch} from '@/domain/search-utils'
import {getBrowserLocalStorage} from '@/domain/storage'
import {compareWheelsForUi} from '@/domain/wheel-sort'
import {getWheelMainstatLabel, getWheels} from '@/domain/wheels'

import {loadBuilderDraft, saveBuilderDraft, type BuilderDraftPayload} from './builder-persistence'
import {allAwakeners, createEmptyTeamSlots} from './constants'
import {
  createQuickLineupSession,
  findNextQuickLineupStepIndex,
  findQuickLineupStepIndex,
  getPublicQuickLineupSession,
  getQuickLineupStepAtIndex,
  getQuickLineupStepPickerTab,
  getQuickLineupStepSelection,
  goBackQuickLineupHistory,
  goToQuickLineupStep,
  reconcileQuickLineupSessionAfterSlotsChange,
  type InternalQuickLineupSession,
} from './quick-lineup'
import {
  nextSelectionAfterCovenantRemoved,
  nextSelectionAfterWheelRemoved,
  toggleAwakenerSelection,
  toggleCovenantSelection,
  toggleWheelSelection,
} from './selection-state'
import {createInitialTeams, renameTeam} from './team-collection'
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

interface UseBuilderViewModelOptions {
  searchInputRef: RefObject<HTMLInputElement | null>
}
type TeamRenameSurface = 'header' | 'list'

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

        wheelMap.set(wheelId, {teamOrder, teamId: team.id, slotId: slot.slotId, wheelIndex})
      }
    }
  }

  return wheelMap
}

export function useBuilderViewModel({searchInputRef}: UseBuilderViewModelOptions) {
  const storage = useMemo(() => getBrowserLocalStorage(), [])
  const initialBuilderState = useMemo(() => {
    const persisted = loadBuilderDraft(storage)
    return persisted ?? createDefaultBuilderState()
  }, [storage])
  const [teams, setTeams] = useState<Team[]>(initialBuilderState.teams)
  const [activeTeamId, setActiveTeamId] = useState<string>(initialBuilderState.activeTeamId)
  const [collectionOwnership] = useState(() => loadCollectionOwnership(storage))
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [editingTeamName, setEditingTeamName] = useState('')
  const [editingTeamSurface, setEditingTeamSurface] = useState<TeamRenameSurface | null>(null)
  const [activeSelection, setActiveSelection] = useState<ActiveSelection>(null)
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
  const [quickLineupState, setQuickLineupState] = useState<InternalQuickLineupSession | null>(null)

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

  function updateActiveTeam(mutator: (team: Team) => Team) {
    setTeams((prev) => prev.map((team) => (team.id === activeTeam.id ? mutator(team) : team)))
  }

  function setActiveTeamSlots(nextSlots: TeamSlot[]) {
    updateActiveTeam((team) => ({...team, slots: nextSlots}))
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
  const awakenerIdByName = useMemo(
    () => new Map(pickerAwakeners.map((awakener) => [awakener.name, String(awakener.id)])),
    [pickerAwakeners],
  )
  const awakenerIdByNormalizedName = useMemo(
    () => new Map(pickerAwakeners.map((awakener) => [awakener.name.toLowerCase(), awakener.id])),
    [pickerAwakeners],
  )
  const ownedAwakenerLevelByName = useMemo(
    () =>
      new Map(
        pickerAwakeners.map((awakener) => {
          const awakenerId = awakenerIdByName.get(awakener.name)
          const level =
            typeof awakenerId === 'string'
              ? (collectionOwnership.ownedAwakeners[awakenerId] ?? null)
              : null
          return [awakener.name, level]
        }),
      ),
    [pickerAwakeners, awakenerIdByName, collectionOwnership.ownedAwakeners],
  )
  const awakenerLevelByName = useMemo(
    () =>
      new Map(
        pickerAwakeners.map((awakener) => {
          const awakenerId = awakenerIdByName.get(awakener.name)
          const level =
            typeof awakenerId === 'string'
              ? (collectionOwnership.awakenerLevels[awakenerId] ?? 60)
              : 60
          return [awakener.name, level]
        }),
      ),
    [pickerAwakeners, awakenerIdByName, collectionOwnership.awakenerLevels],
  )
  const ownedWheelLevelById = useMemo(
    () =>
      new Map(
        pickerWheels.map((wheel) => [wheel.id, collectionOwnership.ownedWheels[wheel.id] ?? null]),
      ),
    [pickerWheels, collectionOwnership.ownedWheels],
  )
  const ownedPosseLevelById = useMemo(
    () =>
      new Map(
        pickerPosses.map((posse) => [posse.id, collectionOwnership.ownedPosses[posse.id] ?? null]),
      ),
    [pickerPosses, collectionOwnership.ownedPosses],
  )

  const isAwakenerOwnedByName = useCallback(
    (awakenerName: string) => ownedAwakenerLevelByName.get(awakenerName) !== null,
    [ownedAwakenerLevelByName],
  )
  const isWheelOwnedById = useCallback(
    (wheelId: string) => (ownedWheelLevelById.get(wheelId) ?? null) !== null,
    [ownedWheelLevelById],
  )
  const isPosseOwnedById = useCallback(
    (posseId: string) => (ownedPosseLevelById.get(posseId) ?? null) !== null,
    [ownedPosseLevelById],
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
    awakenerIdByName: awakenerIdByNormalizedName,
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
          index: left.id,
          owned: isAwakenerOwnedByName(left.name),
          enlighten: ownedAwakenerLevelByName.get(left.name) ?? 0,
          level: awakenerLevelByName.get(left.name) ?? 60,
          rarity: left.rarity,
          realm: left.realm,
        },
        {
          label: formatAwakenerNameForUi(right.name),
          index: right.id,
          owned: isAwakenerOwnedByName(right.name),
          enlighten: ownedAwakenerLevelByName.get(right.name) ?? 0,
          level: awakenerLevelByName.get(right.name) ?? 60,
          rarity: right.rarity,
          realm: right.realm,
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
    const query = pickerSearchByTab.wheels.trim().toLowerCase()
    const normalizedQuery = normalizeForSearch(query)
    const matchedAwakenerNames =
      normalizedQuery.length > 0
        ? new Set(
            pickerAwakeners
              .filter((awakener) =>
                [awakener.name, ...awakener.aliases].some((value) =>
                  normalizeForSearch(value).includes(normalizedQuery),
                ),
              )
              .map((awakener) => awakener.name.toLowerCase()),
          )
        : null
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
    const queryFiltered = query
      ? visibleWheels.filter((wheel) => {
          if (!displayUnowned && !isWheelOwnedById(wheel.id)) {
            return false
          }
          return (
            wheel.name.toLowerCase().includes(query) ||
            wheel.rarity.toLowerCase().includes(query) ||
            wheel.realm.toLowerCase().includes(query) ||
            wheel.awakener.toLowerCase().includes(query) ||
            getWheelMainstatLabel(wheel).toLowerCase().includes(query) ||
            wheel.mainstatKey.toLowerCase().includes(query) ||
            Boolean(matchedAwakenerNames?.has(wheel.awakener.toLowerCase()))
          )
        })
      : visibleWheels
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
    pickerAwakeners,
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
    const query = pickerSearchByTab.covenants.trim().toLowerCase()
    const queryFiltered = !query
      ? pickerCovenants
      : pickerCovenants.filter(
          (covenant) =>
            covenant.name.toLowerCase().includes(query) ||
            covenant.id.toLowerCase().includes(query),
        )
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
        if (!slot.awakenerName || slot.isSupport) {
          return
        }
        const identityKey = getAwakenerIdentityKey(slot.awakenerName)
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
    const timeoutId = window.setTimeout(() => {
      saveBuilderDraft(storage, {teams, activeTeamId: effectiveActiveTeamId})
    }, BUILDER_AUTOSAVE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [storage, teams, effectiveActiveTeamId])

  const resolvedActiveSelection = useMemo(() => {
    if (!activeSelection) {
      return null
    }
    return teamSlots.some((slot) => slot.slotId === activeSelection.slotId) ? activeSelection : null
  }, [activeSelection, teamSlots])

  const slotById = activeTeamSlotById

  function beginTeamRename(
    teamId: string,
    currentName: string,
    surface: TeamRenameSurface = 'list',
  ) {
    setEditingTeamId(teamId)
    setEditingTeamName(currentName)
    setEditingTeamSurface(surface)
  }

  function cancelTeamRename() {
    setEditingTeamId(null)
    setEditingTeamName('')
    setEditingTeamSurface(null)
  }

  function commitTeamRename(teamId: string) {
    const trimmed = editingTeamName.trim()
    if (trimmed) {
      setTeams((prev) => renameTeam(prev, teamId, trimmed))
    }
    cancelTeamRename()
  }

  function handleCardClick(slotId: string) {
    if (quickLineupState) {
      jumpToQuickLineupStep({kind: 'awakener', slotId})
      return
    }
    setPickerTab('awakeners')
    setActiveSelection((prev) => toggleAwakenerSelection(prev, slotId))
  }

  function handleWheelSlotClick(slotId: string, wheelIndex: number) {
    if (quickLineupState) {
      jumpToQuickLineupStep({kind: 'wheel', slotId, wheelIndex})
      return
    }
    setPickerTab('wheels')
    setActiveSelection((prev) => toggleWheelSelection(prev, slotId, wheelIndex))
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
    setTeams(nextDraft.teams)
    setActiveTeamId(nextDraft.activeTeamId)
    saveBuilderDraft(storage, nextDraft)
  }

  function resetBuilderDraft() {
    const nextDraft = createDefaultBuilderState()
    replaceBuilderDraft(nextDraft)
    return nextDraft
  }

  function applyActiveTeamSlotMutation(
    nextSlots: TeamSlot[],
    preferredStep: Exclude<ActiveSelection, null> | {kind: 'posse'} | null = null,
    nextSelection: ActiveSelection = null,
  ) {
    setActiveTeamSlots(nextSlots)
    if (quickLineupState) {
      const nextSession = reconcileQuickLineupSessionAfterSlotsChange(
        quickLineupState,
        nextSlots,
        preferredStep,
      )
      setQuickLineupState(nextSession)
      syncQuickLineupFocus(nextSession)
      return
    }
    setActiveSelection(nextSelection)
  }

  function syncQuickLineupFocus(nextSession: InternalQuickLineupSession | null) {
    if (!nextSession) {
      setActiveSelection(null)
      return
    }

    const currentStep = getQuickLineupStepAtIndex(nextSession, nextSession.currentStepIndex)
    if (!currentStep) {
      setActiveSelection(null)
      return
    }

    setPickerTab(getQuickLineupStepPickerTab(currentStep))
    setActiveSelection(getQuickLineupStepSelection(currentStep))
  }

  function clearTeamSlot(slotId: string) {
    const result = clearSlotAssignment(teamSlots, slotId)
    applyActiveTeamSlotMutation(result.nextSlots, {kind: 'awakener', slotId}, null)
  }

  function clearTeamWheel(slotId: string, wheelIndex: number) {
    const result = clearWheelAssignment(teamSlots, slotId, wheelIndex)
    applyActiveTeamSlotMutation(
      result.nextSlots,
      {
        kind: 'wheel',
        slotId,
        wheelIndex,
      },
      nextSelectionAfterWheelRemoved(resolvedActiveSelection, slotId, wheelIndex),
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
    syncQuickLineupFocus(quickLineupState)
  }

  function startQuickLineup() {
    const nextSession = createQuickLineupSession(activeTeam)
    updateActiveTeam((team) => ({
      ...team,
      posseId: undefined,
      slots: createEmptyTeamSlots(),
    }))
    setQuickLineupState(nextSession)
    syncQuickLineupFocus(nextSession)
  }

  function advanceQuickLineupStep(nextSlotsOverride?: TeamSlot[]) {
    if (!quickLineupState) {
      return
    }

    const nextStepIndex = findNextQuickLineupStepIndex(
      quickLineupState,
      nextSlotsOverride ?? teamSlots,
    )
    if (nextStepIndex === null) {
      setQuickLineupState(null)
      setActiveSelection(null)
      return
    }

    const nextSession = goToQuickLineupStep(quickLineupState, nextStepIndex)
    if (!nextSession) {
      setQuickLineupState(null)
      setActiveSelection(null)
      return
    }

    setQuickLineupState(nextSession)
    syncQuickLineupFocus(nextSession)
  }

  function skipQuickLineupStep() {
    advanceQuickLineupStep()
  }

  function goBackQuickLineupStep() {
    if (!quickLineupState) {
      return
    }

    const nextSession = goBackQuickLineupHistory(quickLineupState)
    if (!nextSession) {
      return
    }

    setQuickLineupState(nextSession)
    syncQuickLineupFocus(nextSession)
  }

  function finishQuickLineup() {
    setQuickLineupState(null)
  }

  function cancelQuickLineup() {
    if (!quickLineupState) {
      return
    }

    const {originalTeam, teamId} = quickLineupState
    setTeams((prev) => prev.map((team) => (team.id === teamId ? originalTeam : team)))
    setQuickLineupState(null)
    setActiveSelection(null)
  }

  function jumpToQuickLineupStep(step: Exclude<ActiveSelection, null> | {kind: 'posse'}) {
    if (!quickLineupState) {
      return
    }

    const nextStepIndex = findQuickLineupStepIndex(quickLineupState, step)
    if (nextStepIndex === -1) {
      return
    }

    const nextSession = goToQuickLineupStep(quickLineupState, nextStepIndex)
    if (!nextSession) {
      return
    }

    setQuickLineupState(nextSession)
    syncQuickLineupFocus(nextSession)
  }

  const quickLineupSession: QuickLineupSession | null = useMemo(
    () => (quickLineupState ? getPublicQuickLineupSession(quickLineupState) : null),
    [quickLineupState],
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
