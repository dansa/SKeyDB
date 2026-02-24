import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react'
import { getAwakenerIdentityKey } from '../../domain/awakener-identity'
import { formatAwakenerNameForUi } from '../../domain/name-format'
import { getCovenants } from '../../domain/covenants'
import { getPosses } from '../../domain/posses'
import { getWheelMainstatLabel, getWheels } from '../../domain/wheels'
import { compareWheelsForUi } from '../../domain/wheel-sort'
import { getBrowserLocalStorage } from '../../domain/storage'
import { getPosseAssetById } from '../../domain/posse-assets'
import {
  loadCollectionOwnership,
  saveCollectionOwnership,
  setDisplayUnowned as setCollectionDisplayUnownedState,
} from '../../domain/collection-ownership'
import { searchAwakeners } from '../../domain/awakeners-search'
import { searchPosses } from '../../domain/posses-search'
import { allAwakeners } from './constants'
import { clearCovenantAssignment, clearSlotAssignment, clearWheelAssignment, getTeamFactionSet } from './team-state'
import { createInitialTeams, renameTeam } from './team-collection'
import { toggleAwakenerSelection, toggleCovenantSelection, toggleWheelSelection } from './selection-state'
import { matchesWheelMainstat } from './wheel-mainstats'
import { loadBuilderDraft, saveBuilderDraft, type BuilderDraftPayload } from './builder-persistence'
import type {
  ActiveSelection,
  AwakenerFilter,
  PickerTab,
  PosseFilter,
  Team,
  TeamSlot,
  WheelMainstatFilter,
  WheelUsageLocation,
  WheelRarityFilter,
} from './types'
import { useGlobalPickerSearchCapture } from './useGlobalPickerSearchCapture'

const EMPTY_TEAM_SLOTS: TeamSlot[] = []
function normalizeForSearch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

type UseBuilderViewModelOptions = {
  searchInputRef: RefObject<HTMLInputElement | null>
}

const BUILDER_AUTOSAVE_DEBOUNCE_MS = 300
const COLLECTION_AUTOSAVE_DEBOUNCE_MS = 300

function createDefaultBuilderState() {
  const teams = createInitialTeams()
  return {
    teams,
    activeTeamId: teams[0]?.id ?? '',
  }
}

export function useBuilderViewModel({ searchInputRef }: UseBuilderViewModelOptions) {
  const storage = useMemo(() => getBrowserLocalStorage(), [])
  const initialBuilderState = useMemo(() => {
    const persisted = loadBuilderDraft(storage)
    return persisted ?? createDefaultBuilderState()
  }, [storage])
  const [teams, setTeams] = useState<Team[]>(initialBuilderState.teams)
  const [activeTeamId, setActiveTeamId] = useState<string>(initialBuilderState.activeTeamId)
  const [collectionOwnership, setCollectionOwnership] = useState(() => loadCollectionOwnership(storage))
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [editingTeamName, setEditingTeamName] = useState('')
  const [pickerTab, setPickerTab] = useState<PickerTab>('awakeners')
  const [awakenerFilter, setAwakenerFilter] = useState<AwakenerFilter>('ALL')
  const [posseFilter, setPosseFilter] = useState<PosseFilter>('ALL')
  const [wheelRarityFilter, setWheelRarityFilter] = useState<WheelRarityFilter>('ALL')
  const [wheelMainstatFilter, setWheelMainstatFilter] = useState<WheelMainstatFilter>('ALL')
  const [pickerSearchByTab, setPickerSearchByTab] = useState<Record<PickerTab, string>>({
    awakeners: '',
    wheels: '',
    posses: '',
    covenants: '',
  })
  const [activeSelection, setActiveSelection] = useState<ActiveSelection>(null)

  const effectiveActiveTeamId = useMemo(
    () => (teams.some((team) => team.id === activeTeamId) ? activeTeamId : (teams[0]?.id ?? '')),
    [teams, activeTeamId],
  )
  const activeTeam = useMemo(
    () => teams.find((team) => team.id === effectiveActiveTeamId) ?? teams[0],
    [teams, effectiveActiveTeamId],
  )
  const teamSlots = activeTeam?.slots ?? EMPTY_TEAM_SLOTS
  const activePosseId = activeTeam?.posseId

  function updateActiveTeam(mutator: (team: Team) => Team) {
    if (!activeTeam) {
      return
    }
    setTeams((prev) => prev.map((team) => (team.id === activeTeam.id ? mutator(team) : team)))
  }

  function setActiveTeamSlots(nextSlots: TeamSlot[]) {
    updateActiveTeam((team) => ({ ...team, slots: nextSlots }))
  }

  const pickerAwakeners = useMemo(
    () => [...allAwakeners].sort((left, right) => formatAwakenerNameForUi(left.name).localeCompare(formatAwakenerNameForUi(right.name))),
    [],
  )
  const pickerPosses = useMemo(() => [...getPosses()].sort((left, right) => left.name.localeCompare(right.name)), [])
  const pickerCovenants = useMemo(() => [...getCovenants()].sort((left, right) => left.id.localeCompare(right.id)), [])
  const pickerWheels = useMemo(
    () => [...getWheels()].sort(compareWheelsForUi),
    [],
  )
  const awakenerIdByName = useMemo(
    () => new Map(pickerAwakeners.map((awakener) => [awakener.name, String(awakener.id)])),
    [pickerAwakeners],
  )
  const ownedAwakenerLevelByName = useMemo(
    () =>
      new Map(
        pickerAwakeners.map((awakener) => {
          const awakenerId = awakenerIdByName.get(awakener.name)
          const level =
            typeof awakenerId === 'string' ? (collectionOwnership.ownedAwakeners[awakenerId] ?? null) : null
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
            typeof awakenerId === 'string' ? (collectionOwnership.awakenerLevels[awakenerId] ?? 60) : 60
          return [awakener.name, level]
        }),
      ),
    [pickerAwakeners, awakenerIdByName, collectionOwnership.awakenerLevels],
  )
  const ownedWheelLevelById = useMemo(
    () => new Map(pickerWheels.map((wheel) => [wheel.id, collectionOwnership.ownedWheels[wheel.id] ?? null])),
    [pickerWheels, collectionOwnership.ownedWheels],
  )
  const ownedPosseLevelById = useMemo(
    () => new Map(pickerPosses.map((posse) => [posse.id, collectionOwnership.ownedPosses[posse.id] ?? null])),
    [pickerPosses, collectionOwnership.ownedPosses],
  )

  const displayUnowned = collectionOwnership.displayUnowned

  const isAwakenerOwnedByName = useCallback(
    (awakenerName: string) => ownedAwakenerLevelByName.get(awakenerName) !== null,
    [ownedAwakenerLevelByName],
  )
  const isWheelOwnedById = useCallback((wheelId: string) => ownedWheelLevelById.get(wheelId) !== null, [ownedWheelLevelById])
  const isPosseOwnedById = useCallback((posseId: string) => ownedPosseLevelById.get(posseId) !== null, [ownedPosseLevelById])

  const activePosse = useMemo(
    () => pickerPosses.find((posse) => posse.id === activePosseId),
    [activePosseId, pickerPosses],
  )
  const activePosseAsset = activePosse ? getPosseAssetById(activePosse.id) : undefined
  const activeSearchQuery = pickerSearchByTab[pickerTab]

  const searchedAwakeners = useMemo(
    () => searchAwakeners(pickerAwakeners, pickerSearchByTab.awakeners),
    [pickerAwakeners, pickerSearchByTab.awakeners],
  )
  const filteredAwakeners = useMemo(() => {
    if (awakenerFilter === 'ALL') {
      return displayUnowned ? searchedAwakeners : searchedAwakeners.filter((awakener) => isAwakenerOwnedByName(awakener.name))
    }
    return searchedAwakeners.filter(
      (awakener) =>
        awakener.faction.trim().toUpperCase() === awakenerFilter &&
        (displayUnowned || isAwakenerOwnedByName(awakener.name)),
    )
  }, [awakenerFilter, searchedAwakeners, displayUnowned, isAwakenerOwnedByName])

  const searchedPosses = useMemo(
    () => searchPosses(pickerPosses, pickerSearchByTab.posses),
    [pickerPosses, pickerSearchByTab.posses],
  )
  const filteredPosses = useMemo(() => {
    if (posseFilter === 'ALL') {
      return displayUnowned ? searchedPosses : searchedPosses.filter((posse) => isPosseOwnedById(posse.id))
    }
    if (posseFilter === 'FADED_LEGACY') {
      return searchedPosses.filter((posse) => posse.isFadedLegacy && (displayUnowned || isPosseOwnedById(posse.id)))
    }
    return searchedPosses.filter(
      (posse) =>
        !posse.isFadedLegacy &&
        posse.faction.trim().toUpperCase() === posseFilter &&
        (displayUnowned || isPosseOwnedById(posse.id)),
    )
  }, [posseFilter, searchedPosses, displayUnowned, isPosseOwnedById])
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
      wheelRarityFilter === 'ALL' ? pickerWheels : pickerWheels.filter((wheel) => wheel.rarity === wheelRarityFilter)
    const wheelsByMainstat =
      wheelMainstatFilter === 'ALL'
        ? wheelsByRarity
        : wheelsByRarity.filter((wheel) => matchesWheelMainstat(wheel.mainstatKey, wheelMainstatFilter))

    if (!query) {
      return displayUnowned ? wheelsByMainstat : wheelsByMainstat.filter((wheel) => isWheelOwnedById(wheel.id))
    }
    return wheelsByMainstat.filter((wheel) => {
      if (!displayUnowned && !isWheelOwnedById(wheel.id)) {
        return false
      }
      return (
        wheel.name.toLowerCase().includes(query) ||
        wheel.rarity.toLowerCase().includes(query) ||
        wheel.faction.toLowerCase().includes(query) ||
        wheel.awakener.toLowerCase().includes(query) ||
        getWheelMainstatLabel(wheel).toLowerCase().includes(query) ||
        wheel.mainstatKey.toLowerCase().includes(query) ||
        Boolean(matchedAwakenerNames?.has(wheel.awakener.toLowerCase()))
      )
    })
  }, [pickerAwakeners, pickerWheels, pickerSearchByTab.wheels, wheelMainstatFilter, wheelRarityFilter, displayUnowned, isWheelOwnedById])
  const filteredCovenants = useMemo(() => {
    const query = pickerSearchByTab.covenants.trim().toLowerCase()
    if (!query) {
      return pickerCovenants
    }
    return pickerCovenants.filter(
      (covenant) => covenant.name.toLowerCase().includes(query) || covenant.id.toLowerCase().includes(query),
    )
  }, [pickerCovenants, pickerSearchByTab.covenants])

  const teamFactionSet = useMemo(() => getTeamFactionSet(teamSlots), [teamSlots])
  const usedAwakenerByIdentityKey = useMemo(() => {
    const identityMap = new Map<string, string>()
    teams.forEach((team) => {
      team.slots.forEach((slot) => {
        if (!slot.awakenerName) {
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
  const usedAwakenerIdentityKeys = useMemo(() => new Set(usedAwakenerByIdentityKey.keys()), [usedAwakenerByIdentityKey])
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
  const usedWheelByTeamOrder = useMemo(() => {
    const wheelMap = new Map<string, WheelUsageLocation>()
    teams.forEach((team, teamOrder) => {
      team.slots.forEach((slot) => {
        slot.wheels.forEach((wheelId, wheelIndex) => {
          if (!wheelId || wheelMap.has(wheelId)) {
            return
          }
          wheelMap.set(wheelId, { teamOrder, teamId: team.id, slotId: slot.slotId, wheelIndex })
        })
      })
    })
    return wheelMap
  }, [teams])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      saveBuilderDraft(storage, { teams, activeTeamId: effectiveActiveTeamId })
    }, BUILDER_AUTOSAVE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [storage, teams, effectiveActiveTeamId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      saveCollectionOwnership(storage, collectionOwnership)
    }, COLLECTION_AUTOSAVE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [storage, collectionOwnership])

  const appendSearchCharacter = useCallback((targetPickerTab: PickerTab, key: string) => {
    setPickerSearchByTab((prev) => ({
      ...prev,
      [targetPickerTab]: `${prev[targetPickerTab]}${key}`,
    }))
  }, [])
  useGlobalPickerSearchCapture({ pickerTab, searchInputRef, onAppendCharacter: appendSearchCharacter })

  const resolvedActiveSelection = useMemo(() => {
    if (!activeSelection) {
      return null
    }
    return teamSlots.some((slot) => slot.slotId === activeSelection.slotId) ? activeSelection : null
  }, [activeSelection, teamSlots])

  const slotById = useMemo(() => new Map(teamSlots.map((slot) => [slot.slotId, slot])), [teamSlots])

  function beginTeamRename(teamId: string, currentName: string) {
    setEditingTeamId(teamId)
    setEditingTeamName(currentName)
  }

  function cancelTeamRename() {
    setEditingTeamId(null)
    setEditingTeamName('')
  }

  function commitTeamRename(teamId: string) {
    const trimmed = editingTeamName.trim()
    if (trimmed) {
      setTeams((prev) => renameTeam(prev, teamId, trimmed))
    }
    cancelTeamRename()
  }

  function handleCardClick(slotId: string) {
    setPickerTab('awakeners')
    setActiveSelection((prev) => toggleAwakenerSelection(prev, slotId))
  }

  function handleWheelSlotClick(slotId: string, wheelIndex: number) {
    setPickerTab('wheels')
    setActiveSelection((prev) => toggleWheelSelection(prev, slotId, wheelIndex))
  }

  function handleCovenantSlotClick(slotId: string) {
    setPickerTab('covenants')
    setActiveSelection((prev) => toggleCovenantSelection(prev, slotId))
  }

  function handleRemoveActiveSelection(slotId: string) {
    if (!resolvedActiveSelection || resolvedActiveSelection.slotId !== slotId) {
      return
    }
    if (resolvedActiveSelection.kind === 'awakener') {
      const result = clearSlotAssignment(teamSlots, slotId)
      setActiveTeamSlots(result.nextSlots)
      setActiveSelection(null)
      return
    }
    if (resolvedActiveSelection.kind === 'covenant') {
      const result = clearCovenantAssignment(teamSlots, slotId)
      setActiveTeamSlots(result.nextSlots)
      setActiveSelection(null)
      return
    }
    const result = clearWheelAssignment(teamSlots, slotId, resolvedActiveSelection.wheelIndex)
    setActiveTeamSlots(result.nextSlots)
    setActiveSelection(null)
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

  function setDisplayUnowned(display: boolean) {
    setCollectionOwnership((prev) => setCollectionDisplayUnownedState(prev, display))
  }

  return {
    collectionOwnership,
    displayUnowned,
    setDisplayUnowned,
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
    filteredAwakeners,
    filteredPosses,
    filteredWheels,
    filteredCovenants,
    teamFactionSet,
    usedAwakenerByIdentityKey,
    usedAwakenerIdentityKeys,
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
    replaceBuilderDraft,
    resetBuilderDraft,
  }
}
