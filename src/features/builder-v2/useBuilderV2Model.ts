import {startTransition, useCallback, useDeferredValue, useEffect, useMemo, useState} from 'react'

import {useStore} from 'zustand'

import {getAwakenerCardAsset, getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import {getAwakenerIdentityKeyById} from '@/domain/awakener-identity'
import {getCovenantAssetById} from '@/domain/covenant-assets'
import {getCovenants} from '@/domain/covenants'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getPosseAssetById} from '@/domain/posse-assets'
import {getPosses, type Posse} from '@/domain/posses'
import {getBrowserLocalStorage} from '@/domain/storage'
import {getWheelAssetById, getWheelMiniAssetById} from '@/domain/wheel-assets'
import type {WheelMainstatFilter} from '@/domain/wheel-mainstat-filters'
import {compareWheelsForUi} from '@/domain/wheel-sort'
import {getWheels, type Wheel} from '@/domain/wheels'
import {
  builderDraftStore,
  createDefaultBuilderDraft,
  type BuilderDraftFocus,
} from '@/stores/builderDraftStore'
import {collectionOwnershipStore} from '@/stores/collectionOwnershipStore'

import {createBuilderOwnershipProjection} from '../builder/builder-ownership-projection'
import {loadBuilderDraft, saveBuilderDraft} from '../builder/builder-persistence'
import {allAwakeners, awakenerById} from '../builder/constants'
import {getPublicQuickLineupSession} from '../builder/quick-lineup'
import {isTeamEmpty, MAX_TEAMS} from '../builder/team-collection'
import {
  assignAwakenerToSlot as assignAwakenerToTeamSlots,
  assignCovenantToSlot as assignCovenantToTeamSlots,
  assignWheelToSlot as assignWheelToTeamSlots,
  clearCovenantAssignment,
  clearSlotAssignment,
  clearWheelAssignment,
  swapCovenantAssignments,
  swapWheelAssignments,
  type TeamStateUpdateResult,
} from '../builder/team-state'
import {
  applyPendingTransfer,
  applySupportTransfer,
  clearTeamSlotTransfer,
  swapTeamSlotTransfer,
} from '../builder/transfer-resolution'
import type {
  ActiveSelection,
  QuickLineupSession,
  QuickLineupStep,
  Team,
  TeamSlot,
  WheelSlotIndex,
} from '../builder/types'
import {useAwakenerBuildRecommendations} from '../builder/useAwakenerBuildRecommendations'
import {useTransferConfirm, type PendingTransfer} from '../builder/useTransferConfirm'
import {getWheelSlotIndex} from '../builder/wheel-slot-index'
import {
  createBuilderV2EditingState,
  getToggledBuilderV2EditingTarget,
  type BuilderV2EditingTarget,
} from './builder-v2-editing-mode'
import {
  resolveAssignAwakenerCommand,
  resolveAssignAwakenerToTargetCommand,
  resolveAssignCovenantCommand,
  resolveAssignCovenantToTargetCommand,
  resolveAssignPosseCommand,
  resolveAssignWheelCommand,
  resolveAssignWheelToTargetCommand,
  resolveMoveAwakenerCommand,
  resolveMoveCovenantCommand,
  resolveMoveWheelCommand,
  resolveMoveWheelToSlotCommand,
  resolveRemoveCovenantCommand,
  resolveRemoveWheelCommand,
  type BuilderV2ResolvedLoadoutCommand,
} from './builder-v2-loadout-commands'
import {
  createBuilderV2AwakenerOptions,
  createBuilderV2CovenantOptions,
  createBuilderV2PosseOptions,
  createBuilderV2WheelOptions,
  createWheelRecommendationMetaById,
} from './builder-v2-picker-options'
import {buildBuilderV2UsageIndex} from './builder-v2-usage-index'
import type {
  BuilderV2ActivePosseView,
  BuilderV2AwakenerFilter,
  BuilderV2AwakenerOption,
  BuilderV2CovenantOption,
  BuilderV2Model,
  BuilderV2PickerClearTarget,
  BuilderV2PickerModel,
  BuilderV2PickerPreferences,
  BuilderV2PickerTab,
  BuilderV2PosseFilter,
  BuilderV2PosseOption,
  BuilderV2SlotAwakener,
  BuilderV2SlotView,
  BuilderV2TeamSummary,
  BuilderV2TeamTarget,
  BuilderV2TransferDialog,
  BuilderV2WheelOption,
  BuilderV2WheelRarityFilter,
  BuilderV2WheelSlotView,
} from './BuilderV2ModelTypes'
import {useBuilderV2ImportExportAdapter} from './useBuilderV2ImportExportAdapter'
import {useBuilderV2Preferences} from './useBuilderV2Preferences'
import {useBuilderV2TeamManagementCommands} from './useBuilderV2TeamManagementCommands'
import {useStableEvent} from './useStableEvent'

const BUILDER_V2_AUTOSAVE_DEBOUNCE_MS = 300

interface UseBuilderV2ModelOptions {
  showToast?: (message: string) => void
}

export function useBuilderV2Model({
  showToast = () => undefined,
}: UseBuilderV2ModelOptions = {}): BuilderV2Model {
  const stableShowToast = useStableEvent(showToast)
  const storage = useMemo(() => getBrowserLocalStorage(), [])
  const {
    allowDuplicateAwakenerIdentities,
    setAllowDuplicateAwakenerIdentities,
    displayUnowned,
    setDisplayUnowned,
    sinkUnownedToBottom,
    setSinkUnownedToBottom,
    promoteRecommendedGear,
    setPromoteRecommendedGear,
    promoteMatchingWheelMainstats,
    setPromoteMatchingWheelMainstats,
    awakenerSortKey,
    setAwakenerSortKey,
    awakenerSortDirection,
    toggleAwakenerSortDirection,
    awakenerSortGroupByRealm,
    setAwakenerSortGroupByRealm,
    wheelSortKey,
    setWheelSortKey,
    wheelSortDirection,
    toggleWheelSortDirection,
    teamPreviewMode,
    setTeamPreviewMode,
  } = useBuilderV2Preferences()
  const [awakenerFilter, setAwakenerFilter] = useState<BuilderV2AwakenerFilter>('ALL')
  const [posseFilter, setPosseFilter] = useState<BuilderV2PosseFilter>('ALL')
  const [wheelRarityFilter, setWheelRarityFilter] = useState<BuilderV2WheelRarityFilter>('ALL')
  const [wheelMainstatFilter, setWheelMainstatFilter] = useState<WheelMainstatFilter>('ALL')
  const [canAutosaveBuilderDraft] = useState(() => {
    const persisted = loadBuilderDraft(storage)
    const initialBuilderState =
      persisted.status === 'loaded' || persisted.status === 'loaded-legacy'
        ? persisted.draft
        : createDefaultBuilderDraft()
    builderDraftStore.getState().hydrateBuilderDraft(initialBuilderState)
    collectionOwnershipStore.getState().hydrate()
    return persisted.status !== 'invalid-current'
  })
  const [pickerTab, setPickerTab] = useState<BuilderV2PickerTab>('awakeners')
  const [searchQueryByTab, setSearchQueryByTab] = useState<Record<BuilderV2PickerTab, string>>({
    awakeners: '',
    wheels: '',
    covenants: '',
    posses: '',
  })
  const [activeTeamTarget, setActiveTeamTarget] = useState<BuilderV2TeamTarget>(null)
  const [violationMessage, setViolationMessage] = useState<string | null>(null)

  const teams = useStore(builderDraftStore, (state) => state.teams)
  const activeTeamId = useStore(builderDraftStore, (state) => state.activeTeamId)
  const setActiveTeamId = useStore(builderDraftStore, (state) => state.setActiveTeamId)
  const activeSelection = useStore(builderDraftStore, (state) => state.activeSelection)
  const setActiveSelection = useStore(builderDraftStore, (state) => state.setActiveSelection)
  const setTeamsInStore = useStore(builderDraftStore, (state) => state.setTeams)
  const updateActiveTeam = useStore(builderDraftStore, (state) => state.updateActiveTeam)
  const setActiveTeamSlotsInStore = useStore(builderDraftStore, (state) => state.setActiveTeamSlots)
  const collectionOwnership = useStore(collectionOwnershipStore, (state) => state.ownership)
  const editingTeamId = useStore(builderDraftStore, (state) => state.editingTeamId)
  const editingTeamName = useStore(builderDraftStore, (state) => state.editingTeamName)
  const storeBeginTeamRename = useStore(builderDraftStore, (state) => state.beginTeamRename)
  const setEditingTeamName = useStore(builderDraftStore, (state) => state.setEditingTeamName)
  const storeCancelTeamRename = useStore(builderDraftStore, (state) => state.cancelTeamRename)
  const storeCommitTeamRename = useStore(builderDraftStore, (state) => state.commitTeamRename)
  const quickLineupState = useStore(builderDraftStore, (state) => state.quickLineupState)
  const {
    pendingTransfer,
    requestAwakenerTransfer,
    requestPosseTransfer,
    requestWheelTransfer,
    clearTransfer,
  } = useTransferConfirm()
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
  const effectiveActiveTeamId = useMemo(
    () => (teams.some((team) => team.id === activeTeamId) ? activeTeamId : (teams[0]?.id ?? '')),
    [activeTeamId, teams],
  )
  const activeTeam = useMemo(
    () => teams.find((team) => team.id === effectiveActiveTeamId) ?? teams[0],
    [effectiveActiveTeamId, teams],
  )
  const activeTeamSlots = activeTeam.slots
  const allWheels = useMemo(() => getWheels().toSorted(compareWheelsForUi), [])
  const wheelById = useMemo(() => new Map(allWheels.map((wheel) => [wheel.id, wheel])), [allWheels])
  const allCovenants = useMemo(
    () => getCovenants().toSorted((left, right) => left.name.localeCompare(right.name)),
    [],
  )
  const covenantById = useMemo(
    () => new Map(allCovenants.map((covenant) => [covenant.id, covenant])),
    [allCovenants],
  )
  const allPosses = useMemo(
    () => getPosses().toSorted((left, right) => left.name.localeCompare(right.name)),
    [],
  )
  const posseById = useMemo(() => new Map(allPosses.map((posse) => [posse.id, posse])), [allPosses])
  const {
    ownedAwakenerLevelByName,
    awakenerLevelByName,
    ownedWheelLevelById,
    isAwakenerOwnedByName,
    isWheelOwnedById,
    isPosseOwnedById,
  } = useMemo(
    () =>
      createBuilderOwnershipProjection({
        awakeners: allAwakeners,
        wheels: allWheels,
        posses: allPosses,
        ownership: collectionOwnership,
      }),
    [allPosses, allWheels, collectionOwnership],
  )
  const searchQuery = searchQueryByTab[pickerTab]

  useEffect(() => {
    if (!canAutosaveBuilderDraft) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      saveBuilderDraft(storage, {
        activeTeamId: effectiveActiveTeamId,
        teams,
      })
    }, BUILDER_V2_AUTOSAVE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [canAutosaveBuilderDraft, effectiveActiveTeamId, storage, teams])

  const usageIndex = useMemo(() => buildBuilderV2UsageIndex(teams), [teams])
  const usedAwakenerIdentityKeys = useMemo(
    () => new Set(usageIndex.awakenerByIdentityKey.keys()),
    [usageIndex],
  )
  const usedWheelByTeamOrder = usageIndex.wheelById
  const usedWheelIds = useMemo(() => new Set(usedWheelByTeamOrder.keys()), [usedWheelByTeamOrder])
  const usedPosseByTeamOrder = usageIndex.posseById

  const selectedSlotId = activeSelection?.slotId ?? null
  const activeTeamName = activeTeam.name
  const activePosse = useMemo<BuilderV2ActivePosseView | null>(() => {
    if (!activeTeam.posseId) {
      return null
    }

    const posse = posseById.get(activeTeam.posseId)
    if (!posse) {
      return null
    }

    return createActivePosseView(posse)
  }, [activeTeam.posseId, posseById])

  const v2Teams = useMemo<BuilderV2TeamSummary[]>(
    () =>
      teams.map((team) => ({
        id: team.id,
        name: team.name,
        isActive: team.id === effectiveActiveTeamId,
        deployedCount: team.slots.filter((slot) => Boolean(slot.awakenerId)).length,
        slotNames: team.slots.map((slot) =>
          slot.awakenerId
            ? formatAwakenerNameForUi(awakenerById.get(slot.awakenerId)?.name ?? 'Unknown')
            : 'Empty',
        ),
        slots: team.slots.map((slot, index) => {
          const slotLabel = `Slot ${String(index + 1)}`
          const awakenerEntity = slot.awakenerId ? awakenerById.get(slot.awakenerId) : undefined
          const awakenerDisplayName = awakenerEntity
            ? formatAwakenerNameForUi(awakenerEntity.name)
            : slot.awakenerId
              ? 'Unknown'
              : 'Empty'
          const covenant = slot.covenantId ? covenantById.get(slot.covenantId) : undefined
          const createSummaryWheel = (
            wheelId: string | null,
          ): BuilderV2TeamSummary['slots'][number]['wheels'][number] => {
            if (!wheelId) {
              return null
            }

            const wheel = wheelById.get(wheelId)
            return {
              id: wheelId,
              name: wheel?.name ?? 'Unknown Wheel',
              miniAssetSrc: getWheelMiniAssetById(wheelId),
              assetSrc: getWheelAssetById(wheelId),
              enlightenLevel: ownedWheelLevelById.get(wheelId) ?? null,
              isOwned: isWheelOwnedById(wheelId),
            }
          }
          const wheels: BuilderV2TeamSummary['slots'][number]['wheels'] = [
            createSummaryWheel(slot.wheels[0] ?? null),
            createSummaryWheel(slot.wheels[1] ?? null),
          ]

          return {
            slotId: slot.slotId,
            label: slotLabel,
            slotNumber: index + 1,
            name: awakenerDisplayName,
            awakener: awakenerEntity
              ? {
                  id: awakenerEntity.id,
                  name: awakenerEntity.name,
                  displayName: awakenerDisplayName,
                  realm: awakenerEntity.realm,
                  level: slot.isSupport ? 90 : (slot.level ?? 60),
                  enlightenLevel: ownedAwakenerLevelByName.get(awakenerEntity.name) ?? null,
                  cardSrc: getAwakenerCardAsset(awakenerEntity.name),
                  portraitSrc: getAwakenerPortraitAsset(awakenerEntity.name),
                  isOwned: isAwakenerOwnedByName(awakenerEntity.name),
                  isSupport: Boolean(slot.isSupport),
                }
              : null,
            portraitSrc: awakenerEntity ? getAwakenerPortraitAsset(awakenerEntity.name) : undefined,
            cardSrc: awakenerEntity ? getAwakenerCardAsset(awakenerEntity.name) : undefined,
            isEmpty: !slot.awakenerId,
            isSupport: Boolean(slot.isSupport),
            wheelCount: wheels.filter(Boolean).length,
            wheels,
            hasCovenant: Boolean(slot.covenantId),
            covenant:
              slot.covenantId && covenant
                ? {
                    id: slot.covenantId,
                    name: covenant.name,
                    assetSrc: getCovenantAssetById(slot.covenantId),
                  }
                : null,
          }
        }),
        posseName: team.posseId ? (posseById.get(team.posseId)?.name ?? 'Unknown Posse') : null,
        posseRealm: team.posseId ? (posseById.get(team.posseId)?.realm ?? null) : null,
        posseAssetSrc: team.posseId ? getPosseAssetById(team.posseId) : undefined,
        isPosseOwned: team.posseId ? isPosseOwnedById(team.posseId) : true,
        isEmpty: isTeamEmpty(team),
      })),
    [
      covenantById,
      effectiveActiveTeamId,
      isAwakenerOwnedByName,
      isPosseOwnedById,
      isWheelOwnedById,
      ownedAwakenerLevelByName,
      ownedWheelLevelById,
      posseById,
      teams,
      wheelById,
    ],
  )

  const slots = useMemo<BuilderV2SlotView[]>(
    () =>
      activeTeamSlots.map((slot, index) => {
        const slotLabel = `Slot ${String(index + 1)}`
        const covenant = slot.covenantId ? covenantById.get(slot.covenantId) : undefined

        return {
          slotId: slot.slotId,
          slotNumber: index + 1,
          slotLabel,
          awakener: createSlotAwakenerView(slot, ownedAwakenerLevelByName),
          isSelected: selectedSlotId === slot.slotId,
          isEmpty: !slot.awakenerId,
          wheels: slot.wheels,
          wheelSlots: [
            createWheelSlotView(
              slot,
              slotLabel,
              0,
              wheelById,
              activeSelection,
              ownedWheelLevelById,
            ),
            createWheelSlotView(
              slot,
              slotLabel,
              1,
              wheelById,
              activeSelection,
              ownedWheelLevelById,
            ),
          ],
          covenantId: slot.covenantId,
          covenantName: covenant?.name ?? null,
          covenantAssetSrc: slot.covenantId ? getCovenantAssetById(slot.covenantId) : undefined,
          isCovenantSelected:
            activeSelection?.kind === 'covenant' && activeSelection.slotId === slot.slotId,
        }
      }),
    [
      activeSelection,
      activeTeamSlots,
      covenantById,
      ownedAwakenerLevelByName,
      ownedWheelLevelById,
      selectedSlotId,
      wheelById,
    ],
  )

  const quickLineupSession: QuickLineupSession | null = useMemo(
    () =>
      quickLineupState ? getPublicQuickLineupSession(quickLineupState, activeTeamSlots) : null,
    [activeTeamSlots, quickLineupState],
  )
  const quickLineupStepLabel = useMemo(
    () => getQuickLineupStepLabel(quickLineupSession, slots),
    [quickLineupSession, slots],
  )
  const pickerClearTarget = useMemo<BuilderV2PickerClearTarget | null>(
    () =>
      createBuilderV2PickerClearTarget({
        activePosse,
        activeSelection,
        activeTeamTarget,
        slots,
      }),
    [activePosse, activeSelection, activeTeamTarget, slots],
  )

  const activeTeamSlotById = useMemo(
    () => new Map(activeTeamSlots.map((slot) => [slot.slotId, slot])),
    [activeTeamSlots],
  )
  const hasAwakenerInCurrentActiveSlot = useCallback((slotId: string) => {
    const state = builderDraftStore.getState()
    const team =
      state.teams.find((candidate) => candidate.id === state.activeTeamId) ?? state.teams[0]
    return Boolean(team.slots.find((slot) => slot.slotId === slotId)?.awakenerId)
  }, [])
  const deferredPickerSelection = useDeferredValue(activeSelection)
  const {activeBuild, teamRecommendedPosseIds} = useAwakenerBuildRecommendations({
    activeSelection: deferredPickerSelection,
    slotsById: activeTeamSlotById,
  })
  const wheelRecommendationById = useMemo(
    () => createWheelRecommendationMetaById(activeBuild, allWheels),
    [activeBuild, allWheels],
  )

  const awakeners = useMemo<BuilderV2AwakenerOption[]>(() => {
    if (pickerTab !== 'awakeners') {
      return []
    }

    return createBuilderV2AwakenerOptions({
      allAwakeners,
      searchQuery: searchQueryByTab.awakeners,
      filter: awakenerFilter,
      displayUnowned,
      sinkUnownedToBottom,
      allowDuplicateAwakenerIdentities,
      sortKey: awakenerSortKey,
      sortDirection: awakenerSortDirection,
      sortGroupByRealm: awakenerSortGroupByRealm,
      activeTeamSlots,
      usedAwakenerIdentityKeys,
      usageAwakenerByIdentityKey: usageIndex.awakenerByIdentityKey,
      ownedAwakenerLevelByName,
      awakenerLevelByName,
      isAwakenerOwnedByName,
    })
  }, [
    activeTeamSlots,
    allowDuplicateAwakenerIdentities,
    awakenerFilter,
    awakenerLevelByName,
    awakenerSortDirection,
    awakenerSortGroupByRealm,
    awakenerSortKey,
    displayUnowned,
    isAwakenerOwnedByName,
    ownedAwakenerLevelByName,
    pickerTab,
    searchQueryByTab.awakeners,
    sinkUnownedToBottom,
    usageIndex,
    usedAwakenerIdentityKeys,
  ])

  const wheels = useMemo<BuilderV2WheelOption[]>(() => {
    if (pickerTab !== 'wheels') {
      return []
    }

    return createBuilderV2WheelOptions({
      allWheels,
      searchQuery: searchQueryByTab.wheels,
      rarityFilter: wheelRarityFilter,
      mainstatFilter: wheelMainstatFilter,
      displayUnowned,
      sinkUnownedToBottom,
      promoteRecommendedGear,
      promoteMatchingWheelMainstats,
      sortKey: wheelSortKey,
      sortDirection: wheelSortDirection,
      recommendationById: wheelRecommendationById,
      usedWheelIds,
      usedWheelByTeamOrder,
      ownedWheelLevelById,
      isWheelOwnedById,
    })
  }, [
    allWheels,
    displayUnowned,
    isWheelOwnedById,
    ownedWheelLevelById,
    pickerTab,
    promoteMatchingWheelMainstats,
    promoteRecommendedGear,
    searchQueryByTab.wheels,
    sinkUnownedToBottom,
    usedWheelIds,
    usedWheelByTeamOrder,
    wheelMainstatFilter,
    wheelRecommendationById,
    wheelRarityFilter,
    wheelSortDirection,
    wheelSortKey,
  ])

  const covenants = useMemo<BuilderV2CovenantOption[]>(() => {
    if (pickerTab !== 'covenants') {
      return []
    }

    return createBuilderV2CovenantOptions({
      allCovenants,
      searchQuery: searchQueryByTab.covenants,
      activeBuild,
      activeTeamSlots,
      promoteRecommendedGear,
    })
  }, [
    activeBuild,
    activeTeamSlots,
    allCovenants,
    pickerTab,
    promoteRecommendedGear,
    searchQueryByTab.covenants,
  ])

  const posses = useMemo<BuilderV2PosseOption[]>(() => {
    if (pickerTab !== 'posses') {
      return []
    }

    return createBuilderV2PosseOptions({
      allPosses,
      searchQuery: searchQueryByTab.posses,
      filter: posseFilter,
      activeTeam,
      allowDuplicateAwakenerIdentities,
      displayUnowned,
      sinkUnownedToBottom,
      promoteRecommendedGear,
      recommendedPosseIds: teamRecommendedPosseIds,
      usedPosseByTeamOrder,
      isPosseOwnedById,
    })
  }, [
    activeTeam,
    allowDuplicateAwakenerIdentities,
    allPosses,
    displayUnowned,
    isPosseOwnedById,
    pickerTab,
    posseFilter,
    promoteRecommendedGear,
    searchQueryByTab.posses,
    sinkUnownedToBottom,
    teamRecommendedPosseIds,
    usedPosseByTeamOrder,
  ])

  const setSearchQuery = useCallback(
    (nextQuery: string) => {
      setSearchQueryByTab((current) => ({
        ...current,
        [pickerTab]: nextQuery,
      }))
    },
    [pickerTab],
  )

  const switchPickerTab = useCallback((nextTab: BuilderV2PickerTab) => {
    setPickerTab(nextTab)
    setViolationMessage(null)
  }, [])

  const applyEditingTarget = useCallback(
    (
      target: BuilderV2EditingTarget,
      options: {
        fallbackPickerTab?: BuilderV2PickerTab
        pickerTabOverride?: BuilderV2PickerTab
        syncPickerTab?: boolean
      } = {},
    ) => {
      const nextState = createBuilderV2EditingState(target)
      setActiveSelection(nextState.activeSelection)
      setActiveTeamTarget(nextState.activeTeamTarget)
      const nextPickerTab =
        options.pickerTabOverride ?? nextState.pickerTab ?? options.fallbackPickerTab
      if (options.syncPickerTab && nextPickerTab) {
        startTransition(() => {
          setPickerTab(nextPickerTab)
        })
      }
    },
    [setActiveSelection],
  )

  const pickerPreferences = useMemo<BuilderV2PickerPreferences>(
    () => ({
      awakenerFilter,
      posseFilter,
      wheelRarityFilter,
      wheelMainstatFilter,
      awakenerSortKey,
      awakenerSortDirection,
      awakenerSortGroupByRealm,
      wheelSortKey,
      wheelSortDirection,
      displayUnowned,
      sinkUnownedToBottom,
      allowDupes: allowDuplicateAwakenerIdentities,
      promoteRecommendedGear,
      promoteMatchingWheelMainstats,
    }),
    [
      allowDuplicateAwakenerIdentities,
      awakenerFilter,
      awakenerSortDirection,
      awakenerSortGroupByRealm,
      awakenerSortKey,
      displayUnowned,
      posseFilter,
      promoteMatchingWheelMainstats,
      promoteRecommendedGear,
      sinkUnownedToBottom,
      wheelMainstatFilter,
      wheelRarityFilter,
      wheelSortDirection,
      wheelSortKey,
    ],
  )

  const picker = useMemo<BuilderV2PickerModel>(
    () => ({
      tab: pickerTab,
      searchQuery,
      awakeners,
      wheels,
      covenants,
      posses,
      preferences: pickerPreferences,
      setTab: switchPickerTab,
      setSearchQuery,
      setAwakenerFilter,
      setPosseFilter,
      setWheelRarityFilter,
      setWheelMainstatFilter,
      setAwakenerSortKey,
      toggleAwakenerSortDirection,
      setAwakenerSortGroupByRealm,
      setWheelSortKey,
      toggleWheelSortDirection,
      setDisplayUnowned,
      setSinkUnownedToBottom,
      setAllowDupes: setAllowDuplicateAwakenerIdentities,
      setPromoteRecommendedGear,
      setPromoteMatchingWheelMainstats,
    }),
    [
      awakeners,
      covenants,
      pickerPreferences,
      pickerTab,
      posses,
      searchQuery,
      setAllowDuplicateAwakenerIdentities,
      setAwakenerSortGroupByRealm,
      setAwakenerSortKey,
      setDisplayUnowned,
      setPromoteMatchingWheelMainstats,
      setPromoteRecommendedGear,
      setSearchQuery,
      setSinkUnownedToBottom,
      setWheelSortKey,
      switchPickerTab,
      toggleAwakenerSortDirection,
      toggleWheelSortDirection,
      wheels,
    ],
  )

  const syncQuickLineupFocus = useCallback(
    (focus: BuilderDraftFocus | null) => {
      if (!focus) {
        return
      }

      const nextPickerTab = focus.pickerTab
      if (nextPickerTab) {
        startTransition(() => {
          setPickerTab(nextPickerTab)
        })
      }
      applyEditingTarget(
        focus.pickerTab === 'posses' && !focus.selection ? {kind: 'posse'} : focus.selection,
      )
      setViolationMessage(null)
    },
    [applyEditingTarget],
  )

  const startQuickLineup = useCallback(() => {
    syncQuickLineupFocus(storeStartQuickLineup())
  }, [storeStartQuickLineup, syncQuickLineupFocus])

  const advanceQuickLineupStep = useCallback(
    (nextSlotsOverride?: TeamSlot[]) => {
      syncQuickLineupFocus(storeAdvanceQuickLineupStep(nextSlotsOverride))
    },
    [storeAdvanceQuickLineupStep, syncQuickLineupFocus],
  )

  const skipQuickLineupStep = useCallback(() => {
    advanceQuickLineupStep()
  }, [advanceQuickLineupStep])

  const goBackQuickLineupStep = useCallback(() => {
    syncQuickLineupFocus(storeGoBackQuickLineupStep())
  }, [storeGoBackQuickLineupStep, syncQuickLineupFocus])

  const finishQuickLineup = useCallback(() => {
    syncQuickLineupFocus(storeFinishQuickLineup())
  }, [storeFinishQuickLineup, syncQuickLineupFocus])

  const cancelQuickLineup = useCallback(() => {
    syncQuickLineupFocus(storeCancelQuickLineup())
  }, [storeCancelQuickLineup, syncQuickLineupFocus])

  const jumpToQuickLineupStep = useCallback(
    (step: QuickLineupStep) => {
      syncQuickLineupFocus(storeJumpToQuickLineupStep(step))
    },
    [storeJumpToQuickLineupStep, syncQuickLineupFocus],
  )

  const {
    setActiveTeam,
    addTeam,
    beginTeamRename,
    commitTeamRename,
    cancelTeamRename,
    requestDeleteTeam,
    requestResetTeam,
    requestApplyTeamTemplate,
    moveTeamUp,
    moveTeamDown,
    moveTeamToIndex,
    cancelTeamAction,
    teamActionDialog,
    setPendingTeamAction,
  } = useBuilderV2TeamManagementCommands({
    clearTransfer,
    applyEditingTarget,
    setActiveTeamId,
    setTeamsInStore,
    storeBeginTeamRename,
    storeCancelTeamRename,
    storeCommitTeamRename,
    storeCancelQuickLineup,
    syncQuickLineupFocus,
    setViolationMessage,
    showToast: stableShowToast,
  })

  const swapTeamSlots = useCallback(
    (sourceTeamId: string, sourceSlotId: string, targetTeamId: string, targetSlotId: string) => {
      clearTransfer()
      storeCancelTeamRename()
      setPendingTeamAction(null)

      const state = builderDraftStore.getState()
      const sourceTeam = state.teams.find((team) => team.id === sourceTeamId)
      const targetTeam = state.teams.find((team) => team.id === targetTeamId)
      if (!sourceTeam || !targetTeam) {
        return
      }

      const result = swapTeamSlotTransfer(
        state.teams,
        sourceTeamId,
        sourceSlotId,
        targetTeamId,
        targetSlotId,
        {allowDupes: allowDuplicateAwakenerIdentities},
      )
      if (result.nextTeams === state.teams) {
        if (result.violation) {
          setViolationMessage(getBuilderV2TeamSwapViolationMessage(result.violation))
        }
        return
      }

      setTeamsInStore(result.nextTeams)
      setActiveTeamId(state.activeTeamId)
      setViolationMessage(null)

      if (state.activeTeamId === targetTeamId) {
        applyEditingTarget({kind: 'awakener', slotId: targetSlotId})
        return
      }

      if (state.activeTeamId === sourceTeamId) {
        applyEditingTarget({kind: 'awakener', slotId: sourceSlotId})
      }
    },
    [
      allowDuplicateAwakenerIdentities,
      applyEditingTarget,
      clearTransfer,
      setActiveTeamId,
      setPendingTeamAction,
      setTeamsInStore,
      storeCancelTeamRename,
    ],
  )

  const assignAwakenerToTeamSlot = useCallback(
    (awakenerId: string, teamId: string, slotId: string) => {
      clearTransfer()
      storeCancelTeamRename()
      setPendingTeamAction(null)

      const state = builderDraftStore.getState()
      const targetTeam = state.teams.find((team) => team.id === teamId)
      if (!targetTeam || !awakenerById.has(awakenerId)) {
        return
      }

      const result = assignAwakenerToTeamSlots(targetTeam.slots, awakenerId, slotId, awakenerById, {
        allowDuplicateIdentity: allowDuplicateAwakenerIdentities,
      })
      if (result.violation) {
        setViolationMessage(getBuilderV2TeamSwapViolationMessage(result.violation))
        return
      }
      if (result.nextSlots === targetTeam.slots) {
        return
      }

      const targetSlot = targetTeam.slots.find((slot) => slot.slotId === slotId)
      const owningTeamId = allowDuplicateAwakenerIdentities
        ? undefined
        : usageIndex.awakenerByIdentityKey.get(getAwakenerIdentityKeyById(awakenerId))?.teamId
      if (owningTeamId && owningTeamId !== teamId && !targetSlot?.isSupport) {
        requestAwakenerTransfer({
          awakenerName: awakenerById.get(awakenerId)?.name ?? 'Awakener',
          awakenerId,
          canUseSupport: !state.teams.some((team) => team.slots.some((slot) => slot.isSupport)),
          fromTeamId: owningTeamId,
          toTeamId: teamId,
          targetSlotId: slotId,
        })
        return
      }

      setTeamsInStore(replaceTeamSlots(state.teams, teamId, result.nextSlots))
      setActiveTeamId(state.activeTeamId)
      setViolationMessage(null)
      if (state.activeTeamId === teamId) {
        applyEditingTarget({kind: 'awakener', slotId})
      }
    },
    [
      allowDuplicateAwakenerIdentities,
      applyEditingTarget,
      clearTransfer,
      requestAwakenerTransfer,
      setActiveTeamId,
      setPendingTeamAction,
      setTeamsInStore,
      storeCancelTeamRename,
      usageIndex.awakenerByIdentityKey,
    ],
  )

  const assignWheelToTeamSlot = useCallback(
    (wheelId: string, teamId: string, slotId: string, targetWheelIndex?: WheelSlotIndex) => {
      clearTransfer()
      storeCancelTeamRename()
      setPendingTeamAction(null)

      const state = builderDraftStore.getState()
      const targetTeam = state.teams.find((team) => team.id === teamId)
      const targetSlot = targetTeam?.slots.find((slot) => slot.slotId === slotId)
      const wheelIndex = targetWheelIndex ?? getFirstEmptyTeamWheelIndex(targetSlot)
      if (!targetTeam || !targetSlot || wheelIndex === null) {
        return
      }
      if (!targetSlot.awakenerId) {
        return
      }

      const wheelOwner = allowDuplicateAwakenerIdentities
        ? undefined
        : usedWheelByTeamOrder.get(wheelId)
      if (
        wheelOwner?.teamId === teamId &&
        (wheelOwner.slotId !== slotId || wheelOwner.wheelIndex !== wheelIndex)
      ) {
        const result = swapWheelAssignments(
          targetTeam.slots,
          wheelOwner.slotId,
          wheelOwner.wheelIndex,
          slotId,
          wheelIndex,
        )
        setTeamsInStore(replaceTeamSlots(state.teams, teamId, result.nextSlots))
        setActiveTeamId(state.activeTeamId)
        setViolationMessage(null)
        if (state.activeTeamId === teamId) {
          applyEditingTarget({kind: 'wheel', slotId, wheelIndex})
        }
        return
      }

      if (wheelOwner && wheelOwner.teamId !== teamId && !targetSlot.isSupport) {
        requestWheelTransfer({
          wheelId,
          fromTeamId: wheelOwner.teamId,
          fromSlotId: wheelOwner.slotId,
          fromWheelIndex: wheelOwner.wheelIndex,
          toTeamId: teamId,
          targetSlotId: slotId,
          targetWheelIndex: wheelIndex,
        })
        return
      }

      const result = assignWheelToTeamSlots(targetTeam.slots, slotId, wheelIndex, wheelId)
      if (result.nextSlots === targetTeam.slots) {
        return
      }

      setTeamsInStore(replaceTeamSlots(state.teams, teamId, result.nextSlots))
      setActiveTeamId(state.activeTeamId)
      setViolationMessage(null)
      if (state.activeTeamId === teamId) {
        applyEditingTarget({kind: 'wheel', slotId, wheelIndex})
      }
    },
    [
      allowDuplicateAwakenerIdentities,
      applyEditingTarget,
      clearTransfer,
      requestWheelTransfer,
      setActiveTeamId,
      setPendingTeamAction,
      setTeamsInStore,
      storeCancelTeamRename,
      usedWheelByTeamOrder,
    ],
  )

  const assignCovenantToTeamSlot = useCallback(
    (covenantId: string, teamId: string, slotId: string) => {
      clearTransfer()
      storeCancelTeamRename()
      setPendingTeamAction(null)

      const state = builderDraftStore.getState()
      const targetTeam = state.teams.find((team) => team.id === teamId)
      const targetSlot = targetTeam?.slots.find((slot) => slot.slotId === slotId)
      if (!targetTeam || !targetSlot?.awakenerId) {
        return
      }

      const result = assignCovenantToTeamSlots(targetTeam.slots, slotId, covenantId)
      if (result.nextSlots === targetTeam.slots) {
        return
      }

      setTeamsInStore(replaceTeamSlots(state.teams, teamId, result.nextSlots))
      setActiveTeamId(state.activeTeamId)
      setViolationMessage(null)
      if (state.activeTeamId === teamId) {
        applyEditingTarget({kind: 'covenant', slotId})
      }
    },
    [
      applyEditingTarget,
      clearTransfer,
      setActiveTeamId,
      setPendingTeamAction,
      setTeamsInStore,
      storeCancelTeamRename,
    ],
  )

  const clearTeamSlot = useCallback(
    (teamId: string, slotId: string) => {
      clearTransfer()
      storeCancelTeamRename()
      setPendingTeamAction(null)

      const state = builderDraftStore.getState()
      const nextTeams = clearTeamSlotTransfer(state.teams, teamId, slotId)
      if (nextTeams === state.teams) {
        return
      }

      setTeamsInStore(nextTeams)
      setActiveTeamId(state.activeTeamId)
      setViolationMessage(null)
      if (state.activeTeamId === teamId) {
        applyEditingTarget({kind: 'awakener', slotId})
      }
    },
    [
      applyEditingTarget,
      clearTransfer,
      setActiveTeamId,
      setPendingTeamAction,
      setTeamsInStore,
      storeCancelTeamRename,
    ],
  )

  const clearTeamWheel = useCallback(
    (teamId: string, slotId: string, wheelIndex: WheelSlotIndex) => {
      clearTransfer()
      storeCancelTeamRename()
      setPendingTeamAction(null)

      const state = builderDraftStore.getState()
      const targetTeam = state.teams.find((team) => team.id === teamId)
      if (!targetTeam) {
        return
      }

      const result = clearWheelAssignment(targetTeam.slots, slotId, wheelIndex)
      if (result.nextSlots === targetTeam.slots) {
        return
      }

      setTeamsInStore(replaceTeamSlots(state.teams, teamId, result.nextSlots))
      setActiveTeamId(state.activeTeamId)
      setViolationMessage(null)
      if (state.activeTeamId === teamId) {
        applyEditingTarget({kind: 'wheel', slotId, wheelIndex})
      }
    },
    [
      applyEditingTarget,
      clearTransfer,
      setActiveTeamId,
      setPendingTeamAction,
      setTeamsInStore,
      storeCancelTeamRename,
    ],
  )

  const moveTeamWheel = useCallback(
    (
      sourceTeamId: string,
      sourceSlotId: string,
      sourceWheelIndex: WheelSlotIndex,
      targetTeamId: string,
      targetSlotId: string,
      targetWheelIndex: WheelSlotIndex,
    ) => {
      clearTransfer()
      storeCancelTeamRename()
      setPendingTeamAction(null)

      const state = builderDraftStore.getState()
      const sourceTeam = state.teams.find((team) => team.id === sourceTeamId)
      const targetTeam = state.teams.find((team) => team.id === targetTeamId)
      if (!sourceTeam || !targetTeam) {
        return
      }

      const result =
        sourceTeamId === targetTeamId
          ? normalizeSingleTeamSlotUpdate(
              swapWheelAssignments(
                sourceTeam.slots,
                sourceSlotId,
                sourceWheelIndex,
                targetSlotId,
                targetWheelIndex,
              ),
            )
          : swapCrossTeamWheelAssignments(
              sourceTeam.slots,
              sourceSlotId,
              sourceWheelIndex,
              targetTeam.slots,
              targetSlotId,
              targetWheelIndex,
            )

      if (!result.changed) {
        return
      }

      const nextTeams =
        sourceTeamId === targetTeamId
          ? replaceTeamSlots(state.teams, sourceTeamId, result.nextSourceSlots)
          : replaceTwoTeamSlots(
              state.teams,
              sourceTeamId,
              result.nextSourceSlots,
              targetTeamId,
              result.nextTargetSlots,
            )

      setTeamsInStore(nextTeams)
      setActiveTeamId(state.activeTeamId)
      setViolationMessage(null)
      if (state.activeTeamId === targetTeamId) {
        applyEditingTarget({kind: 'wheel', slotId: targetSlotId, wheelIndex: targetWheelIndex})
        return
      }
      if (state.activeTeamId === sourceTeamId) {
        applyEditingTarget({kind: 'wheel', slotId: sourceSlotId, wheelIndex: sourceWheelIndex})
      }
    },
    [
      applyEditingTarget,
      clearTransfer,
      setActiveTeamId,
      setPendingTeamAction,
      setTeamsInStore,
      storeCancelTeamRename,
    ],
  )

  const moveTeamWheelToTeamSlot = useCallback(
    (
      sourceTeamId: string,
      sourceSlotId: string,
      sourceWheelIndex: WheelSlotIndex,
      targetTeamId: string,
      targetSlotId: string,
    ) => {
      const state = builderDraftStore.getState()
      const targetTeam = state.teams.find((team) => team.id === targetTeamId)
      const targetSlot = targetTeam?.slots.find((slot) => slot.slotId === targetSlotId)
      const targetWheelIndex = getFirstEmptyTeamWheelIndex(targetSlot)
      if (targetWheelIndex === null) {
        return
      }

      moveTeamWheel(
        sourceTeamId,
        sourceSlotId,
        sourceWheelIndex,
        targetTeamId,
        targetSlotId,
        targetWheelIndex,
      )
    },
    [moveTeamWheel],
  )

  const clearTeamCovenant = useCallback(
    (teamId: string, slotId: string) => {
      clearTransfer()
      storeCancelTeamRename()
      setPendingTeamAction(null)

      const state = builderDraftStore.getState()
      const targetTeam = state.teams.find((team) => team.id === teamId)
      if (!targetTeam) {
        return
      }

      const result = clearCovenantAssignment(targetTeam.slots, slotId)
      if (result.nextSlots === targetTeam.slots) {
        return
      }

      setTeamsInStore(replaceTeamSlots(state.teams, teamId, result.nextSlots))
      setActiveTeamId(state.activeTeamId)
      setViolationMessage(null)
      if (state.activeTeamId === teamId) {
        applyEditingTarget({kind: 'covenant', slotId})
      }
    },
    [
      applyEditingTarget,
      clearTransfer,
      setActiveTeamId,
      setPendingTeamAction,
      setTeamsInStore,
      storeCancelTeamRename,
    ],
  )

  const moveTeamCovenant = useCallback(
    (sourceTeamId: string, sourceSlotId: string, targetTeamId: string, targetSlotId: string) => {
      clearTransfer()
      storeCancelTeamRename()
      setPendingTeamAction(null)

      const state = builderDraftStore.getState()
      const sourceTeam = state.teams.find((team) => team.id === sourceTeamId)
      const targetTeam = state.teams.find((team) => team.id === targetTeamId)
      if (!sourceTeam || !targetTeam) {
        return
      }

      const result =
        sourceTeamId === targetTeamId
          ? normalizeSingleTeamSlotUpdate(
              swapCovenantAssignments(sourceTeam.slots, sourceSlotId, targetSlotId),
            )
          : swapCrossTeamCovenantAssignments(
              sourceTeam.slots,
              sourceSlotId,
              targetTeam.slots,
              targetSlotId,
            )

      if (!result.changed) {
        return
      }

      const nextTeams =
        sourceTeamId === targetTeamId
          ? replaceTeamSlots(state.teams, sourceTeamId, result.nextSourceSlots)
          : replaceTwoTeamSlots(
              state.teams,
              sourceTeamId,
              result.nextSourceSlots,
              targetTeamId,
              result.nextTargetSlots,
            )

      setTeamsInStore(nextTeams)
      setActiveTeamId(state.activeTeamId)
      setViolationMessage(null)
      if (state.activeTeamId === targetTeamId) {
        applyEditingTarget({kind: 'covenant', slotId: targetSlotId})
        return
      }
      if (state.activeTeamId === sourceTeamId) {
        applyEditingTarget({kind: 'covenant', slotId: sourceSlotId})
      }
    },
    [
      applyEditingTarget,
      clearTransfer,
      setActiveTeamId,
      setPendingTeamAction,
      setTeamsInStore,
      storeCancelTeamRename,
    ],
  )

  const selectAwakenerSlot = useCallback(
    (slotId: string) => {
      setViolationMessage(null)
      if (quickLineupState) {
        jumpToQuickLineupStep({kind: 'awakener', slotId})
        return
      }

      setActiveTeamTarget(null)
      startTransition(() => {
        setPickerTab('awakeners')
      })
      setActiveSelection(
        (current) =>
          createBuilderV2EditingState(
            getToggledBuilderV2EditingTarget(current, {kind: 'awakener', slotId}),
          ).activeSelection,
      )
    },
    [jumpToQuickLineupStep, quickLineupState, setActiveSelection],
  )

  const selectWheelSlot = useCallback(
    (slotId: string, wheelIndex: WheelSlotIndex) => {
      setViolationMessage(null)
      if (!hasAwakenerInCurrentActiveSlot(slotId)) {
        selectAwakenerSlot(slotId)
        return
      }

      if (quickLineupState) {
        jumpToQuickLineupStep({kind: 'wheel', slotId, wheelIndex})
        return
      }

      setActiveTeamTarget(null)
      startTransition(() => {
        setPickerTab('wheels')
      })
      setActiveSelection(
        (current) =>
          createBuilderV2EditingState(
            getToggledBuilderV2EditingTarget(current, {kind: 'wheel', slotId, wheelIndex}),
          ).activeSelection,
      )
    },
    [
      hasAwakenerInCurrentActiveSlot,
      jumpToQuickLineupStep,
      quickLineupState,
      selectAwakenerSlot,
      setActiveSelection,
    ],
  )

  const selectCovenantSlot = useCallback(
    (slotId: string) => {
      setViolationMessage(null)
      if (!hasAwakenerInCurrentActiveSlot(slotId)) {
        selectAwakenerSlot(slotId)
        return
      }

      if (quickLineupState) {
        jumpToQuickLineupStep({kind: 'covenant', slotId})
        return
      }

      setActiveTeamTarget(null)
      startTransition(() => {
        setPickerTab('covenants')
      })
      setActiveSelection(
        (current) =>
          createBuilderV2EditingState(
            getToggledBuilderV2EditingTarget(current, {kind: 'covenant', slotId}),
          ).activeSelection,
      )
    },
    [
      hasAwakenerInCurrentActiveSlot,
      jumpToQuickLineupStep,
      quickLineupState,
      selectAwakenerSlot,
      setActiveSelection,
    ],
  )

  const selectPosse = useCallback(() => {
    setViolationMessage(null)
    if (quickLineupState) {
      jumpToQuickLineupStep({kind: 'posse'})
      return
    }

    startTransition(() => {
      setPickerTab('posses')
    })
    setActiveSelection(null)
    setActiveTeamTarget(
      (current) =>
        createBuilderV2EditingState(current?.kind === 'posse' ? null : {kind: 'posse'})
          .activeTeamTarget,
    )
  }, [jumpToQuickLineupStep, quickLineupState, setActiveSelection])

  const applyResolvedLoadoutCommand = useCallback(
    (command: BuilderV2ResolvedLoadoutCommand) => {
      if (command.kind === 'violation') {
        setViolationMessage(command.message)
        if (command.pickerTab) {
          setPickerTab(command.pickerTab)
        }
        return
      }

      if (command.kind === 'awakener-transfer') {
        requestAwakenerTransfer({
          awakenerName: command.awakenerName,
          awakenerId: command.awakenerId,
          canUseSupport: command.canUseSupport,
          fromTeamId: command.fromTeamId,
          toTeamId: command.toTeamId,
          targetSlotId: command.targetSlotId,
        })
        setViolationMessage(null)
        setPickerTab(command.pickerTab)
        return
      }

      if (command.kind === 'wheel-transfer') {
        requestWheelTransfer({
          wheelId: command.wheelId,
          fromTeamId: command.fromTeamId,
          fromSlotId: command.fromSlotId,
          fromWheelIndex: command.fromWheelIndex,
          toTeamId: command.toTeamId,
          targetSlotId: command.targetSlotId,
          targetWheelIndex: command.targetWheelIndex,
        })
        setViolationMessage(null)
        setPickerTab(command.pickerTab)
        return
      }

      if (command.kind === 'posse-transfer') {
        requestPosseTransfer({
          posseId: command.posseId,
          posseName: command.posseName,
          fromTeamId: command.fromTeamId,
          toTeamId: command.toTeamId,
        })
        setViolationMessage(null)
        setPickerTab(command.pickerTab)
        return
      }

      if (command.kind === 'posse-assign') {
        clearTransfer()
        updateActiveTeam((team) => ({...team, posseId: command.posseId}))
        setViolationMessage(null)
        applyEditingTarget({kind: 'posse'}, {syncPickerTab: true})
        return
      }

      if (command.clearTransfer) {
        clearTransfer()
      }
      if (command.changed) {
        setActiveTeamSlotsInStore(command.nextSlots)
      }
      setViolationMessage(null)
      if (quickLineupState && command.changed) {
        advanceQuickLineupStep(command.nextSlots)
        return
      }
      applyEditingTarget(command.activeSelection, {
        pickerTabOverride: command.pickerTab,
        syncPickerTab: Boolean(command.pickerTab),
      })
    },
    [
      advanceQuickLineupStep,
      applyEditingTarget,
      clearTransfer,
      quickLineupState,
      requestAwakenerTransfer,
      requestPosseTransfer,
      requestWheelTransfer,
      setActiveTeamSlotsInStore,
      updateActiveTeam,
    ],
  )

  const assignAwakener = useCallback(
    (awakenerId: string) => {
      applyResolvedLoadoutCommand(
        resolveAssignAwakenerCommand({
          activeSelection,
          activeTeamId: effectiveActiveTeamId,
          activeTeamSlots,
          allowDuplicateAwakenerIdentities,
          awakenerById,
          awakenerId,
          usedAwakenerByIdentityKey: usageIndex.awakenerByIdentityKey,
        }),
      )
    },
    [
      activeSelection,
      activeTeamSlots,
      allowDuplicateAwakenerIdentities,
      applyResolvedLoadoutCommand,
      effectiveActiveTeamId,
      usageIndex,
    ],
  )

  const assignAwakenerToSlot = useCallback(
    (awakenerId: string, slotId: string) => {
      applyResolvedLoadoutCommand(
        resolveAssignAwakenerToTargetCommand({
          activeTeamId: effectiveActiveTeamId,
          activeTeamSlots,
          allowDuplicateAwakenerIdentities,
          awakenerById,
          awakenerId,
          targetSlotId: slotId,
          usedAwakenerByIdentityKey: usageIndex.awakenerByIdentityKey,
        }),
      )
    },
    [
      activeTeamSlots,
      allowDuplicateAwakenerIdentities,
      applyResolvedLoadoutCommand,
      effectiveActiveTeamId,
      usageIndex,
    ],
  )

  const assignWheel = useCallback(
    (wheelId: string) => {
      applyResolvedLoadoutCommand(
        resolveAssignWheelCommand({
          activeSelection,
          activeTeamId: effectiveActiveTeamId,
          activeTeamSlots,
          allowDuplicateAwakenerIdentities,
          usedWheelByTeamOrder,
          wheelId,
        }),
      )
    },
    [
      activeSelection,
      activeTeamSlots,
      allowDuplicateAwakenerIdentities,
      applyResolvedLoadoutCommand,
      effectiveActiveTeamId,
      usedWheelByTeamOrder,
    ],
  )

  const assignWheelToSlot = useCallback(
    (wheelId: string, slotId: string, wheelIndex?: WheelSlotIndex) => {
      applyResolvedLoadoutCommand(
        resolveAssignWheelToTargetCommand({
          activeTeamId: effectiveActiveTeamId,
          activeTeamSlots,
          allowDuplicateAwakenerIdentities,
          targetSlotId: slotId,
          targetWheelIndex: wheelIndex,
          usedWheelByTeamOrder,
          wheelId,
        }),
      )
    },
    [
      activeTeamSlots,
      allowDuplicateAwakenerIdentities,
      applyResolvedLoadoutCommand,
      effectiveActiveTeamId,
      usedWheelByTeamOrder,
    ],
  )

  const assignCovenant = useCallback(
    (covenantId: string) => {
      applyResolvedLoadoutCommand(
        resolveAssignCovenantCommand({
          activeSelection,
          activeTeamSlots,
          covenantId,
        }),
      )
    },
    [activeSelection, activeTeamSlots, applyResolvedLoadoutCommand],
  )

  const assignCovenantToSlot = useCallback(
    (covenantId: string, slotId: string) => {
      applyResolvedLoadoutCommand(
        resolveAssignCovenantToTargetCommand({
          activeTeamSlots,
          covenantId,
          targetSlotId: slotId,
        }),
      )
    },
    [activeTeamSlots, applyResolvedLoadoutCommand],
  )

  const assignPosse = useCallback(
    (posseId: string) => {
      applyResolvedLoadoutCommand(
        resolveAssignPosseCommand({
          activeTeamId: effectiveActiveTeamId,
          allowDuplicateAwakenerIdentities,
          posseById,
          posseId,
          teams,
          usedPosseByTeamOrder,
        }),
      )
    },
    [
      allowDuplicateAwakenerIdentities,
      applyResolvedLoadoutCommand,
      effectiveActiveTeamId,
      posseById,
      teams,
      usedPosseByTeamOrder,
    ],
  )

  const removeAwakener = useCallback(
    (slotId: string) => {
      const result = clearSlotAssignment(activeTeamSlots, slotId)
      if (!result.changed) {
        return
      }

      setActiveTeamSlotsInStore(result.nextSlots)
      setViolationMessage(null)
      applyEditingTarget({kind: 'awakener', slotId})
    },
    [activeTeamSlots, applyEditingTarget, setActiveTeamSlotsInStore],
  )

  const clearWheel = useCallback(
    (slotId: string, wheelIndex: WheelSlotIndex) => {
      applyResolvedLoadoutCommand(
        resolveRemoveWheelCommand({
          activeTeamSlots,
          slotId,
          wheelIndex,
        }),
      )
    },
    [activeTeamSlots, applyResolvedLoadoutCommand],
  )

  const moveAwakener = useCallback(
    (fromSlotId: string, toSlotId: string) => {
      applyResolvedLoadoutCommand(
        resolveMoveAwakenerCommand({
          activeTeamSlots,
          fromSlotId,
          toSlotId,
        }),
      )
    },
    [activeTeamSlots, applyResolvedLoadoutCommand],
  )

  const moveWheel = useCallback(
    (
      fromSlotId: string,
      fromWheelIndex: WheelSlotIndex,
      toSlotId: string,
      toWheelIndex: WheelSlotIndex,
    ) => {
      applyResolvedLoadoutCommand(
        resolveMoveWheelCommand({
          activeTeamSlots,
          fromSlotId,
          fromWheelIndex,
          toSlotId,
          toWheelIndex,
        }),
      )
    },
    [activeTeamSlots, applyResolvedLoadoutCommand],
  )

  const moveWheelToSlot = useCallback(
    (fromSlotId: string, fromWheelIndex: WheelSlotIndex, toSlotId: string) => {
      applyResolvedLoadoutCommand(
        resolveMoveWheelToSlotCommand({
          activeTeamSlots,
          fromSlotId,
          fromWheelIndex,
          toSlotId,
        }),
      )
    },
    [activeTeamSlots, applyResolvedLoadoutCommand],
  )

  const clearCovenant = useCallback(
    (slotId: string) => {
      applyResolvedLoadoutCommand(
        resolveRemoveCovenantCommand({
          activeTeamSlots,
          slotId,
        }),
      )
    },
    [activeTeamSlots, applyResolvedLoadoutCommand],
  )

  const moveCovenant = useCallback(
    (fromSlotId: string, toSlotId: string) => {
      applyResolvedLoadoutCommand(
        resolveMoveCovenantCommand({
          activeTeamSlots,
          fromSlotId,
          toSlotId,
        }),
      )
    },
    [activeTeamSlots, applyResolvedLoadoutCommand],
  )

  const clearPosse = useCallback(() => {
    if (!activeTeam.posseId) {
      return
    }

    updateActiveTeam((team) => ({...team, posseId: undefined}))
    setViolationMessage(null)
    applyEditingTarget({kind: 'posse'}, {syncPickerTab: true})
    if (quickLineupSession?.currentStep.kind === 'posse') {
      advanceQuickLineupStep()
    }
  }, [
    activeTeam.posseId,
    advanceQuickLineupStep,
    applyEditingTarget,
    quickLineupSession,
    updateActiveTeam,
  ])

  const clearPickerTarget = useCallback(() => {
    setViolationMessage(null)
    clearTransfer()

    if (activeTeamTarget?.kind === 'posse') {
      if (activeTeam.posseId) {
        updateActiveTeam((team) => ({...team, posseId: undefined}))
      }
      applyEditingTarget({kind: 'posse'}, {syncPickerTab: true})
      return
    }

    if (!activeSelection) {
      return
    }

    if (activeSelection.kind === 'awakener') {
      const result = clearSlotAssignment(activeTeamSlots, activeSelection.slotId)
      if (result.changed) {
        setActiveTeamSlotsInStore(result.nextSlots)
      }
      if (quickLineupState) {
        advanceQuickLineupStep(result.nextSlots)
        return
      }
      applyEditingTarget({kind: 'awakener', slotId: activeSelection.slotId}, {syncPickerTab: true})
      return
    }

    if (activeSelection.kind === 'wheel') {
      const result = clearWheelAssignment(
        activeTeamSlots,
        activeSelection.slotId,
        activeSelection.wheelIndex,
      )
      if (result.changed) {
        setActiveTeamSlotsInStore(result.nextSlots)
      }
      if (quickLineupState) {
        advanceQuickLineupStep(result.nextSlots)
        return
      }
      applyEditingTarget(
        {
          kind: 'wheel',
          slotId: activeSelection.slotId,
          wheelIndex: activeSelection.wheelIndex,
        },
        {syncPickerTab: true},
      )
      return
    }

    const result = clearCovenantAssignment(activeTeamSlots, activeSelection.slotId)
    if (result.changed) {
      setActiveTeamSlotsInStore(result.nextSlots)
    }
    if (quickLineupState) {
      advanceQuickLineupStep(result.nextSlots)
      return
    }
    applyEditingTarget({kind: 'covenant', slotId: activeSelection.slotId}, {syncPickerTab: true})
  }, [
    activeSelection,
    activeTeam.posseId,
    activeTeamSlots,
    activeTeamTarget,
    advanceQuickLineupStep,
    applyEditingTarget,
    clearTransfer,
    quickLineupState,
    setActiveTeamSlotsInStore,
    updateActiveTeam,
  ])

  const {
    openImportDialog,
    openExportAllDialog,
    openTeamExportDialog,
    openActiveTeamExportDialog,
    openActiveTeamIngameExportDialog,
    importExportDialogProps,
  } = useBuilderV2ImportExportAdapter({
    teams,
    effectiveActiveTeamId,
    activeTeam,
    activeTeamSlots,
    allowDuplicateAwakenerIdentities,
    setAllowDuplicateAwakenerIdentities,
    setActiveTeamId,
    finishQuickLineup: storeFinishQuickLineup,
    applyEditingTarget,
    clearViolationMessage: () => {
      setViolationMessage(null)
    },
    clearTransfer,
    showToast: stableShowToast,
  })

  const applyTransferTeams = useCallback(
    (nextTeams: Team[], transfer: PendingTransfer) => {
      const currentTeams = builderDraftStore.getState().teams
      if (nextTeams === currentTeams) {
        return
      }

      builderDraftStore.getState().setTeams(nextTeams)
      const nextActiveTeam =
        nextTeams.find((team) => team.id === effectiveActiveTeamId) ?? activeTeam

      setViolationMessage(null)
      if (transfer.kind === 'awakener') {
        const targetSlotId =
          transfer.targetSlotId ??
          nextActiveTeam.slots.find((slot) => slot.awakenerId === transfer.awakenerId)?.slotId
        if (targetSlotId) {
          applyEditingTarget({kind: 'awakener', slotId: targetSlotId})
        }
      } else if (transfer.kind === 'wheel') {
        const targetWheelIndex = getWheelSlotIndex(transfer.targetWheelIndex)
        if (targetWheelIndex === null) {
          return
        }

        applyEditingTarget({
          kind: 'wheel',
          slotId: transfer.targetSlotId,
          wheelIndex: targetWheelIndex,
        })
      } else {
        applyEditingTarget({kind: 'posse'}, {syncPickerTab: true})
      }

      if (quickLineupState) {
        syncQuickLineupFocus(storeAdvanceQuickLineupStep(nextActiveTeam.slots))
      }
    },
    [
      activeTeam,
      applyEditingTarget,
      effectiveActiveTeamId,
      quickLineupState,
      storeAdvanceQuickLineupStep,
      syncQuickLineupFocus,
    ],
  )

  const confirmTransfer = useCallback(() => {
    if (!pendingTransfer) {
      return
    }

    applyTransferTeams(
      applyPendingTransfer(builderDraftStore.getState().teams, pendingTransfer),
      pendingTransfer,
    )
    clearTransfer()
  }, [applyTransferTeams, clearTransfer, pendingTransfer])

  const useSupportTransfer = useCallback(() => {
    if (pendingTransfer?.kind !== 'awakener' || !pendingTransfer.canUseSupport) {
      return
    }

    applyTransferTeams(
      applySupportTransfer(builderDraftStore.getState().teams, pendingTransfer),
      pendingTransfer,
    )
    clearTransfer()
  }, [applyTransferTeams, clearTransfer, pendingTransfer])

  const transferDialog = useMemo<BuilderV2TransferDialog | null>(() => {
    if (!pendingTransfer) {
      return null
    }

    const displayName = getTransferDisplayName(pendingTransfer, wheelById)
    const fromTeamName =
      teams.find((team) => team.id === pendingTransfer.fromTeamId)?.name ?? 'another team'
    const toTeamName =
      teams.find((team) => team.id === pendingTransfer.toTeamId)?.name ?? 'active team'

    return {
      title: `Move ${displayName}`,
      message: `${displayName} is already used in ${fromTeamName}. Move to ${toTeamName}?`,
      supportLabel:
        pendingTransfer.kind === 'awakener' && pendingTransfer.canUseSupport
          ? 'Use as Support'
          : undefined,
      onSupport:
        pendingTransfer.kind === 'awakener' && pendingTransfer.canUseSupport
          ? useSupportTransfer
          : undefined,
      onConfirm: confirmTransfer,
    }
  }, [confirmTransfer, pendingTransfer, teams, useSupportTransfer, wheelById])

  const cancelTransfer = useCallback(() => {
    clearTransfer()
    setViolationMessage(null)
  }, [clearTransfer])

  const editingLabel = useMemo(
    () =>
      getEditingLabel({
        activeSelection,
        activeTeamTarget,
        activeTeamName,
        slots,
      }),
    [activeSelection, activeTeamName, activeTeamTarget, slots],
  )

  return {
    activeTeamId: effectiveActiveTeamId,
    activeTeamName,
    activePosse,
    activeSelection,
    activeTeamTarget,
    pickerTab,
    selectedSlotId,
    editingLabel,
    quickLineupSession,
    quickLineupStepLabel,
    teams: v2Teams,
    teamPreviewMode,
    maxTeams: MAX_TEAMS,
    canAddTeam: teams.length < MAX_TEAMS,
    editingTeamId,
    editingTeamName,
    slots,
    picker,
    pickerClearTarget,
    awakeners,
    wheels,
    covenants,
    posses,
    searchQuery,
    setSearchQuery,
    setPickerTab: switchPickerTab,
    setActiveTeam,
    setTeamPreviewMode,
    addTeam,
    beginTeamRename,
    setEditingTeamName,
    commitTeamRename,
    cancelTeamRename,
    requestDeleteTeam,
    requestResetTeam,
    requestApplyTeamTemplate,
    cancelTeamAction,
    moveTeamUp,
    moveTeamDown,
    moveTeamToIndex,
    swapTeamSlots,
    assignAwakenerToTeamSlot,
    assignWheelToTeamSlot,
    assignCovenantToTeamSlot,
    clearTeamSlot,
    clearTeamWheel,
    moveTeamWheel,
    moveTeamWheelToTeamSlot,
    clearTeamCovenant,
    moveTeamCovenant,
    startQuickLineup,
    skipQuickLineupStep,
    goBackQuickLineupStep,
    finishQuickLineup,
    cancelQuickLineup,
    selectAwakenerSlot,
    selectWheelSlot,
    selectCovenantSlot,
    selectPosse,
    assignAwakener,
    assignAwakenerToSlot,
    assignWheel,
    assignWheelToSlot,
    assignCovenant,
    assignCovenantToSlot,
    assignPosse,
    clearPickerTarget,
    removeAwakener,
    moveAwakener,
    clearWheel,
    moveWheel,
    moveWheelToSlot,
    clearCovenant,
    moveCovenant,
    clearPosse,
    openImportDialog,
    openExportAllDialog,
    openTeamExportDialog,
    openActiveTeamExportDialog,
    openActiveTeamIngameExportDialog,
    importExportDialogProps,
    transferDialog,
    cancelTransfer,
    teamActionDialog,
    violationMessage,
  }
}

function getBuilderV2TeamSwapViolationMessage(code: string | undefined): string {
  if (code === 'TOO_MANY_REALMS_IN_TEAM') {
    return 'A team can only contain up to 2 realms.'
  }

  return 'That swap would break current builder rules.'
}

function replaceTeamSlots(teams: Team[], teamId: string, nextSlots: TeamSlot[]): Team[] {
  return teams.map((team) => (team.id === teamId ? {...team, slots: nextSlots} : team))
}

interface TwoTeamSlotUpdateResult {
  changed: boolean
  nextSourceSlots: TeamSlot[]
  nextTargetSlots: TeamSlot[]
}

function normalizeSingleTeamSlotUpdate(result: TeamStateUpdateResult): TwoTeamSlotUpdateResult {
  return {
    changed: result.changed,
    nextSourceSlots: result.nextSlots,
    nextTargetSlots: result.nextSlots,
  }
}

function replaceTwoTeamSlots(
  teams: Team[],
  sourceTeamId: string,
  nextSourceSlots: TeamSlot[],
  targetTeamId: string,
  nextTargetSlots: TeamSlot[],
): Team[] {
  return teams.map((team) => {
    if (team.id === sourceTeamId) {
      return {...team, slots: nextSourceSlots}
    }
    if (team.id === targetTeamId) {
      return {...team, slots: nextTargetSlots}
    }
    return team
  })
}

function swapCrossTeamWheelAssignments(
  sourceSlots: TeamSlot[],
  sourceSlotId: string,
  sourceWheelIndex: WheelSlotIndex,
  targetSlots: TeamSlot[],
  targetSlotId: string,
  targetWheelIndex: WheelSlotIndex,
): TwoTeamSlotUpdateResult {
  const sourceSlot = sourceSlots.find((slot) => slot.slotId === sourceSlotId)
  const targetSlot = targetSlots.find((slot) => slot.slotId === targetSlotId)
  const sourceWheelId = sourceSlot?.wheels[sourceWheelIndex] ?? null
  if (!sourceSlot || !targetSlot?.awakenerId || !sourceWheelId) {
    return {
      changed: false,
      nextSourceSlots: sourceSlots,
      nextTargetSlots: targetSlots,
    }
  }

  const targetWheelId = targetSlot.wheels[targetWheelIndex] ?? null
  return {
    changed: true,
    nextSourceSlots: sourceSlots.map((slot) => {
      if (slot.slotId !== sourceSlotId) {
        return slot
      }
      const nextWheels = [...slot.wheels] as [string | null, string | null]
      nextWheels[sourceWheelIndex] = targetWheelId
      return {...slot, wheels: nextWheels}
    }),
    nextTargetSlots: targetSlots.map((slot) => {
      if (slot.slotId !== targetSlotId) {
        return slot
      }
      const nextWheels = [...slot.wheels] as [string | null, string | null]
      nextWheels[targetWheelIndex] = sourceWheelId
      return {...slot, wheels: nextWheels}
    }),
  }
}

function swapCrossTeamCovenantAssignments(
  sourceSlots: TeamSlot[],
  sourceSlotId: string,
  targetSlots: TeamSlot[],
  targetSlotId: string,
): TwoTeamSlotUpdateResult {
  const sourceSlot = sourceSlots.find((slot) => slot.slotId === sourceSlotId)
  const targetSlot = targetSlots.find((slot) => slot.slotId === targetSlotId)
  const sourceCovenantId = sourceSlot?.covenantId
  if (!sourceSlot || !targetSlot?.awakenerId || !sourceCovenantId) {
    return {
      changed: false,
      nextSourceSlots: sourceSlots,
      nextTargetSlots: targetSlots,
    }
  }

  return {
    changed: true,
    nextSourceSlots: sourceSlots.map((slot) =>
      slot.slotId === sourceSlotId ? {...slot, covenantId: targetSlot.covenantId} : slot,
    ),
    nextTargetSlots: targetSlots.map((slot) =>
      slot.slotId === targetSlotId ? {...slot, covenantId: sourceCovenantId} : slot,
    ),
  }
}

function getFirstEmptyTeamWheelIndex(slot: TeamSlot | undefined): WheelSlotIndex | null {
  if (!slot?.awakenerId) {
    return null
  }

  const firstEmptyIndex = slot.wheels.findIndex((wheelId) => !wheelId)
  return firstEmptyIndex === 0 || firstEmptyIndex === 1 ? firstEmptyIndex : null
}

function createSlotAwakenerView(
  slot: TeamSlot,
  ownedAwakenerLevelByName: Map<string, number | null>,
): BuilderV2SlotAwakener | null {
  if (!slot.awakenerId) {
    return null
  }

  const awakener = awakenerById.get(slot.awakenerId)
  if (!awakener) {
    return null
  }

  return {
    id: awakener.id,
    name: awakener.name,
    displayName: formatAwakenerNameForUi(awakener.name),
    realm: awakener.realm,
    level: slot.isSupport ? 90 : (slot.level ?? 60),
    enlightenLevel: ownedAwakenerLevelByName.get(awakener.name) ?? null,
    cardSrc: getAwakenerCardAsset(awakener.name),
    portraitSrc: getAwakenerPortraitAsset(awakener.name),
    isSupport: Boolean(slot.isSupport),
  }
}

function createWheelSlotView(
  slot: TeamSlot,
  slotLabel: string,
  wheelIndex: WheelSlotIndex,
  wheelById: Map<string, Wheel>,
  activeSelection: ActiveSelection,
  ownedWheelLevelById: Map<string, number | null>,
): BuilderV2WheelSlotView {
  const wheelId = slot.wheels[wheelIndex]
  const wheel = wheelId ? wheelById.get(wheelId) : undefined
  return {
    wheelIndex,
    label: `${slotLabel} Wheel ${String(wheelIndex + 1)}`,
    wheelId,
    wheelName: wheel?.name ?? null,
    miniAssetSrc: wheelId ? getWheelMiniAssetById(wheelId) : undefined,
    assetSrc: wheelId ? getWheelAssetById(wheelId) : undefined,
    enlightenLevel: wheelId ? (ownedWheelLevelById.get(wheelId) ?? null) : null,
    isSelected:
      activeSelection?.kind === 'wheel' &&
      activeSelection.slotId === slot.slotId &&
      activeSelection.wheelIndex === wheelIndex,
  }
}

function createActivePosseView(posse: Posse): BuilderV2ActivePosseView {
  return {
    id: posse.id,
    name: posse.name,
    realm: posse.realm,
    assetSrc: getPosseAssetById(posse.id),
  }
}

function createBuilderV2PickerClearTarget({
  activePosse,
  activeSelection,
  activeTeamTarget,
  slots,
}: {
  activePosse: BuilderV2ActivePosseView | null
  activeSelection: ActiveSelection
  activeTeamTarget: BuilderV2TeamTarget
  slots: BuilderV2SlotView[]
}): BuilderV2PickerClearTarget | null {
  if (activeTeamTarget?.kind === 'posse') {
    return {
      id: 'posse',
      label: 'Clear Team Posse',
      description: activePosse ? `Remove ${activePosse.name}` : 'Leave team posse empty',
      ariaLabel: activePosse ? `Clear team posse ${activePosse.name}` : 'Clear team posse',
    }
  }

  if (!activeSelection) {
    return null
  }

  const slot = slots.find((entry) => entry.slotId === activeSelection.slotId)
  if (!slot) {
    return null
  }

  if (activeSelection.kind === 'awakener') {
    return {
      id: `${slot.slotId}:awakener`,
      label: 'Clear Slot',
      description: slot.awakener
        ? `Remove ${slot.awakener.displayName} and loadout`
        : `Leave ${slot.slotLabel} empty`,
      ariaLabel: `Clear ${slot.slotLabel}`,
    }
  }

  if (activeSelection.kind === 'wheel') {
    const wheelSlot = slot.wheelSlots.find(
      (entry) => entry.wheelIndex === activeSelection.wheelIndex,
    )
    const wheelNumber = String(activeSelection.wheelIndex + 1)
    return {
      id: `${slot.slotId}:wheel:${wheelNumber}`,
      label: `Clear W${wheelNumber}`,
      description: wheelSlot?.wheelName
        ? `Remove ${wheelSlot.wheelName}`
        : `Leave ${slot.slotLabel} Wheel ${wheelNumber} empty`,
      ariaLabel: `Clear ${slot.slotLabel} Wheel ${wheelNumber}`,
    }
  }

  return {
    id: `${slot.slotId}:covenant`,
    label: 'Clear Cov',
    description: slot.covenantName
      ? `Remove ${slot.covenantName}`
      : `Leave ${slot.slotLabel} covenant empty`,
    ariaLabel: `Clear ${slot.slotLabel} Covenant`,
  }
}

function getQuickLineupStepLabel(
  quickLineupSession: QuickLineupSession | null,
  slots: BuilderV2SlotView[],
): string | null {
  const step = quickLineupSession?.currentStep
  if (!step) {
    return null
  }

  if (step.kind === 'posse') {
    return 'Team - Posse'
  }

  const slot = slots.find((entry) => entry.slotId === step.slotId)
  const slotLabel = slot?.slotLabel ?? step.slotId.replace('slot-', 'Slot ')
  if (step.kind === 'wheel') {
    return `${slotLabel} - Wheel ${String(step.wheelIndex + 1)}`
  }
  if (step.kind === 'covenant') {
    return `${slotLabel} - Covenant`
  }
  return `${slotLabel} - Awakener`
}

function getTransferDisplayName(
  pendingTransfer: PendingTransfer,
  wheelById: Map<string, Wheel>,
): string {
  if (pendingTransfer.kind === 'awakener') {
    return formatAwakenerNameForUi(pendingTransfer.itemName)
  }
  if (pendingTransfer.kind === 'wheel') {
    return wheelById.get(pendingTransfer.wheelId)?.name ?? pendingTransfer.itemName
  }
  return pendingTransfer.itemName
}

function getEditingLabel({
  activeSelection,
  activeTeamTarget,
  activeTeamName,
  slots,
}: {
  activeSelection: ActiveSelection
  activeTeamTarget: BuilderV2TeamTarget
  activeTeamName: string
  slots: BuilderV2SlotView[]
}): string {
  if (activeTeamTarget?.kind === 'posse') {
    return `Editing ${activeTeamName} - Posse`
  }

  if (!activeSelection) {
    return 'Select a slot or loadout target to begin.'
  }

  const slot = slots.find((entry) => entry.slotId === activeSelection.slotId)
  const slotLabel = slot?.slotLabel ?? activeSelection.slotId.replace('slot-', 'Slot ')
  if (activeSelection.kind === 'wheel') {
    return `Editing ${slotLabel} - Wheel ${String(activeSelection.wheelIndex + 1)}`
  }
  if (activeSelection.kind === 'covenant') {
    return `Editing ${slotLabel} - Covenant`
  }

  return `Editing ${slotLabel} - Awakener`
}
