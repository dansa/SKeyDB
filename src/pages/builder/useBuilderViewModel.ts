import { useCallback, useMemo, useState, type MutableRefObject } from 'react'
import { getAwakenerIdentityKey } from '../../domain/awakener-identity'
import { formatAwakenerNameForUi } from '../../domain/name-format'
import { getCovenants } from '../../domain/covenants'
import { getPosses } from '../../domain/posses'
import { getWheelMainstatLabel, getWheels } from '../../domain/wheels'
import { getPosseAssetById } from '../../domain/posse-assets'
import { searchAwakeners } from '../../domain/awakeners-search'
import { searchPosses } from '../../domain/posses-search'
import { allAwakeners } from './constants'
import { clearCovenantAssignment, clearSlotAssignment, clearWheelAssignment, getTeamFactionSet } from './team-state'
import { createInitialTeams, renameTeam } from './team-collection'
import { toggleAwakenerSelection, toggleCovenantSelection, toggleWheelSelection } from './selection-state'
import { matchesWheelMainstat } from './wheel-mainstats'
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
const WHEEL_RARITY_ORDER: Record<WheelRarityFilter, number> = {
  ALL: 99,
  SSR: 0,
  SR: 1,
  R: 2,
}

const WHEEL_FACTION_ORDER: Record<string, number> = {
  AEQUOR: 0,
  CARO: 1,
  CHAOS: 2,
  ULTRA: 3,
  NEUTRAL: 4,
}

function normalizeForSearch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

type UseBuilderViewModelOptions = {
  searchInputRef: MutableRefObject<HTMLInputElement | null>
}

export function useBuilderViewModel({ searchInputRef }: UseBuilderViewModelOptions) {
  const initialTeams = useMemo(() => createInitialTeams(), [])
  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [activeTeamId, setActiveTeamId] = useState<string>(initialTeams[0]?.id ?? '')
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
    () =>
      [...getWheels()].sort((left, right) => {
        const rarityOrderDiff = WHEEL_RARITY_ORDER[left.rarity] - WHEEL_RARITY_ORDER[right.rarity]
        if (rarityOrderDiff !== 0) {
          return rarityOrderDiff
        }
        const leftFaction = left.faction.trim().toUpperCase()
        const rightFaction = right.faction.trim().toUpperCase()
        const factionOrderDiff =
          (WHEEL_FACTION_ORDER[leftFaction] ?? 99) - (WHEEL_FACTION_ORDER[rightFaction] ?? 99)
        if (factionOrderDiff !== 0) {
          return factionOrderDiff
        }
        return left.id.localeCompare(right.id, undefined, { numeric: true, sensitivity: 'base' })
      }),
    [],
  )
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
      return searchedAwakeners
    }
    return searchedAwakeners.filter((awakener) => awakener.faction.trim().toUpperCase() === awakenerFilter)
  }, [awakenerFilter, searchedAwakeners])

  const searchedPosses = useMemo(
    () => searchPosses(pickerPosses, pickerSearchByTab.posses),
    [pickerPosses, pickerSearchByTab.posses],
  )
  const filteredPosses = useMemo(() => {
    if (posseFilter === 'ALL') {
      return searchedPosses
    }
    if (posseFilter === 'FADED_LEGACY') {
      return searchedPosses.filter((posse) => posse.isFadedLegacy)
    }
    return searchedPosses.filter((posse) => !posse.isFadedLegacy && posse.faction.trim().toUpperCase() === posseFilter)
  }, [posseFilter, searchedPosses])
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
      return wheelsByMainstat
    }
    return wheelsByMainstat.filter(
      (wheel) =>
        wheel.name.toLowerCase().includes(query) ||
        wheel.rarity.toLowerCase().includes(query) ||
        wheel.faction.toLowerCase().includes(query) ||
        wheel.awakener.toLowerCase().includes(query) ||
        getWheelMainstatLabel(wheel).toLowerCase().includes(query) ||
        wheel.mainstatKey.toLowerCase().includes(query) ||
        Boolean(matchedAwakenerNames?.has(wheel.awakener.toLowerCase())),
    )
  }, [pickerAwakeners, pickerWheels, pickerSearchByTab.wheels, wheelMainstatFilter, wheelRarityFilter])
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

  return {
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
  }
}
