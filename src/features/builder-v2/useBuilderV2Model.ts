import {useCallback, useEffect, useMemo, useState, type SetStateAction} from 'react'

import {useStore} from 'zustand'

import {getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import {getAwakenerIdentityKeyById} from '@/domain/awakener-identity'
import type {Awakener} from '@/domain/awakeners'
import {searchAwakeners} from '@/domain/awakeners-search'
import {getCovenantAssetById} from '@/domain/covenant-assets'
import {getCovenants} from '@/domain/covenants'
import {searchCovenants} from '@/domain/covenants-search'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getPosseAssetById} from '@/domain/posse-assets'
import {getPosses, type Posse} from '@/domain/posses'
import {searchPosses} from '@/domain/posses-search'
import {getBrowserLocalStorage, safeStorageRead, safeStorageWrite} from '@/domain/storage'
import {getWheelAssetById} from '@/domain/wheel-assets'
import {compareWheelsForUi} from '@/domain/wheel-sort'
import {getWheelMainstatLabel, getWheels, type Wheel} from '@/domain/wheels'
import {searchWheels} from '@/domain/wheels-search'
import {
  builderDraftStore,
  createDefaultBuilderDraft,
  type BuilderDraftFocus,
} from '@/stores/builderDraftStore'
import {collectionOwnershipStore} from '@/stores/collectionOwnershipStore'

import {loadBuilderDraft, saveBuilderDraft} from '../builder/builder-persistence'
import type {BuilderImportExportDialogsProps} from '../builder/BuilderImportExportDialogs'
import {allAwakeners, awakenerById} from '../builder/constants'
import {getPublicQuickLineupSession} from '../builder/quick-lineup'
import {
  addTeam as addTeamToCollection,
  applyTeamTemplate,
  deleteTeam,
  isTeamEmpty,
  MAX_TEAMS,
  reorderTeams,
  resetTeam,
  type TeamTemplateId,
} from '../builder/team-collection'
import {
  assignAwakenerToFirstEmptySlot,
  assignAwakenerToSlot,
  assignCovenantToSlot,
  assignWheelToSlot,
  clearCovenantAssignment,
  clearSlotAssignment,
  clearWheelAssignment,
  swapCovenantAssignments,
  swapWheelAssignments,
  type TeamStateViolationCode,
} from '../builder/team-state'
import {applyPendingTransfer, applySupportTransfer} from '../builder/transfer-resolution'
import type {
  ActiveSelection,
  QuickLineupSession,
  QuickLineupStep,
  Team,
  TeamSlot,
  WheelUsageLocation,
} from '../builder/types'
import {useBuilderImportExport} from '../builder/useBuilderImportExport'
import {useTransferConfirm, type PendingTransfer} from '../builder/useTransferConfirm'

const BUILDER_V2_AUTOSAVE_DEBOUNCE_MS = 300
const BUILDER_ALLOW_DUPES_KEY = 'skeydb.builder.allowDupes.v1'

export type BuilderV2PickerTab = 'awakeners' | 'wheels' | 'covenants' | 'posses'
type BuilderV2TeamTarget = {kind: 'posse'} | null
type BuilderV2PendingTeamAction =
  | {kind: 'delete'; teamId: string; teamName: string}
  | {kind: 'reset'; teamId: string; teamName: string}
  | {kind: 'template'; templateId: TeamTemplateId; templateLabel: string}

export interface BuilderV2TeamSummary {
  id: string
  name: string
  isActive: boolean
  deployedCount: number
  slotNames: string[]
  slots: BuilderV2TeamSummarySlot[]
  posseName: string | null
  isEmpty: boolean
}

export interface BuilderV2TeamSummarySlot {
  slotId: string
  label: string
  name: string
  isEmpty: boolean
  isSupport: boolean
  wheelCount: number
  hasCovenant: boolean
}

export interface BuilderV2SlotView {
  slotId: string
  slotNumber: number
  slotLabel: string
  awakener: BuilderV2SlotAwakener | null
  isSelected: boolean
  isEmpty: boolean
  wheels: [string | null, string | null]
  wheelSlots: [BuilderV2WheelSlotView, BuilderV2WheelSlotView]
  covenantId?: string
  covenantName: string | null
  covenantAssetSrc: string | undefined
  isCovenantSelected: boolean
}

export interface BuilderV2SlotAwakener {
  id: string
  name: string
  displayName: string
  realm: Awakener['realm']
  level: number
  portraitSrc: string | undefined
  isSupport: boolean
}

export interface BuilderV2AwakenerOption {
  id: string
  name: string
  displayName: string
  realm: Awakener['realm']
  portraitSrc: string | undefined
  inUse: boolean
}

export interface BuilderV2WheelSlotView {
  wheelIndex: 0 | 1
  label: string
  wheelId: string | null
  wheelName: string | null
  assetSrc: string | undefined
  isSelected: boolean
}

export interface BuilderV2WheelOption {
  id: string
  name: string
  rarity: Wheel['rarity']
  realm: Wheel['realm']
  mainstat: string
  assetSrc: string | undefined
  inUse: boolean
}

export interface BuilderV2CovenantOption {
  id: string
  name: string
  assetSrc: string | undefined
  inUse: boolean
}

export interface BuilderV2PosseOption {
  id: string
  name: string
  realm: string
  assetSrc: string | undefined
  inUse: boolean
  isActive: boolean
}

export interface BuilderV2ActivePosseView {
  id: string
  name: string
  realm: string
  assetSrc: string | undefined
}

export interface BuilderV2TransferDialog {
  title: string
  message: string
  supportLabel?: string
  onSupport?: () => void
  onConfirm: () => void
}

export interface BuilderV2TeamActionDialog {
  title: string
  message: string
  confirmLabel: string
  confirmVariant?: 'primary' | 'danger'
  onConfirm: () => void
}

export interface BuilderV2Model {
  activeTeamId: string
  activeTeamName: string
  activePosse: BuilderV2ActivePosseView | null
  activeSelection: ActiveSelection
  activeTeamTarget: BuilderV2TeamTarget
  pickerTab: BuilderV2PickerTab
  selectedSlotId: string | null
  editingLabel: string
  quickLineupSession: QuickLineupSession | null
  quickLineupStepLabel: string | null
  teams: BuilderV2TeamSummary[]
  maxTeams: number
  canAddTeam: boolean
  editingTeamId: string | null
  editingTeamName: string
  slots: BuilderV2SlotView[]
  awakeners: BuilderV2AwakenerOption[]
  wheels: BuilderV2WheelOption[]
  covenants: BuilderV2CovenantOption[]
  posses: BuilderV2PosseOption[]
  searchQuery: string
  setSearchQuery: (nextQuery: string) => void
  setPickerTab: (nextTab: BuilderV2PickerTab) => void
  setActiveTeam: (teamId: string) => void
  addTeam: () => void
  beginTeamRename: (teamId: string) => void
  setEditingTeamName: (nextName: string) => void
  commitTeamRename: (teamId: string) => void
  cancelTeamRename: () => void
  requestDeleteTeam: (teamId: string) => void
  requestResetTeam: (teamId: string) => void
  requestApplyTeamTemplate: (templateId: TeamTemplateId) => void
  cancelTeamAction: () => void
  moveTeamUp: (teamId: string) => void
  moveTeamDown: (teamId: string) => void
  startQuickLineup: () => void
  skipQuickLineupStep: () => void
  goBackQuickLineupStep: () => void
  finishQuickLineup: () => void
  cancelQuickLineup: () => void
  selectAwakenerSlot: (slotId: string) => void
  selectWheelSlot: (slotId: string, wheelIndex: 0 | 1) => void
  selectCovenantSlot: (slotId: string) => void
  selectPosse: () => void
  assignAwakener: (awakenerId: string) => void
  assignWheel: (wheelId: string) => void
  assignCovenant: (covenantId: string) => void
  assignPosse: (posseId: string) => void
  removeAwakener: (slotId: string) => void
  clearWheel: (slotId: string, wheelIndex: 0 | 1) => void
  clearCovenant: (slotId: string) => void
  clearPosse: () => void
  openImportDialog: () => void
  openExportAllDialog: () => void
  openActiveTeamExportDialog: () => void
  openActiveTeamIngameExportDialog: () => void
  importExportDialogProps: BuilderImportExportDialogsProps
  transferDialog: BuilderV2TransferDialog | null
  cancelTransfer: () => void
  teamActionDialog: BuilderV2TeamActionDialog | null
  violationMessage: string | null
}

interface UseBuilderV2ModelOptions {
  showToast?: (message: string) => void
}

export function useBuilderV2Model({
  showToast = () => undefined,
}: UseBuilderV2ModelOptions = {}): BuilderV2Model {
  const storage = useMemo(() => getBrowserLocalStorage(), [])
  const [allowDuplicateAwakenerIdentities, setAllowDuplicateAwakenerIdentities] = useState(
    () => safeStorageRead(storage, BUILDER_ALLOW_DUPES_KEY) === '1',
  )
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
  const [pendingTeamAction, setPendingTeamAction] = useState<BuilderV2PendingTeamAction | null>(
    null,
  )

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_ALLOW_DUPES_KEY, allowDuplicateAwakenerIdentities ? '1' : '0')
  }, [allowDuplicateAwakenerIdentities, storage])

  const effectiveActiveTeamId = useMemo(
    () => (teams.some((team) => team.id === activeTeamId) ? activeTeamId : (teams[0]?.id ?? '')),
    [activeTeamId, teams],
  )
  const activeTeam = useMemo(
    () => teams.find((team) => team.id === effectiveActiveTeamId) ?? teams[0],
    [effectiveActiveTeamId, teams],
  )
  const activeTeamSlots = activeTeam.slots
  const allWheels = useMemo(() => [...getWheels()].sort(compareWheelsForUi), [])
  const wheelById = useMemo(() => new Map(allWheels.map((wheel) => [wheel.id, wheel])), [allWheels])
  const allCovenants = useMemo(
    () => [...getCovenants()].sort((left, right) => left.name.localeCompare(right.name)),
    [],
  )
  const covenantById = useMemo(
    () => new Map(allCovenants.map((covenant) => [covenant.id, covenant])),
    [allCovenants],
  )
  const allPosses = useMemo(
    () => [...getPosses()].sort((left, right) => left.name.localeCompare(right.name)),
    [],
  )
  const posseById = useMemo(() => new Map(allPosses.map((posse) => [posse.id, posse])), [allPosses])
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

  const usedAwakenerByIdentityKey = useMemo(() => {
    const ownership = new Map<string, string>()
    for (const team of teams) {
      for (const slot of team.slots) {
        if (!slot.awakenerId || slot.isSupport) {
          continue
        }

        const identityKey = getAwakenerIdentityKeyById(slot.awakenerId)
        if (!ownership.has(identityKey)) {
          ownership.set(identityKey, team.id)
        }
      }
    }
    return ownership
  }, [teams])
  const usedAwakenerIdentityKeys = useMemo(
    () => new Set(usedAwakenerByIdentityKey.keys()),
    [usedAwakenerByIdentityKey],
  )
  const usedWheelByTeamOrder = useMemo(() => buildUsedWheelByTeamOrder(teams), [teams])
  const usedWheelIds = useMemo(() => new Set(usedWheelByTeamOrder.keys()), [usedWheelByTeamOrder])
  const usedPosseByTeamOrder = useMemo(() => buildUsedPosseByTeamOrder(teams), [teams])
  const usedPosseIds = useMemo(() => new Set(usedPosseByTeamOrder.keys()), [usedPosseByTeamOrder])

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
          const awakenerName = slot.awakenerId
            ? formatAwakenerNameForUi(awakenerById.get(slot.awakenerId)?.name ?? 'Unknown')
            : 'Empty'
          return {
            slotId: slot.slotId,
            label: `Slot ${String(index + 1)}`,
            name: awakenerName,
            isEmpty: !slot.awakenerId,
            isSupport: Boolean(slot.isSupport),
            wheelCount: slot.wheels.filter(Boolean).length,
            hasCovenant: Boolean(slot.covenantId),
          }
        }),
        posseName: team.posseId ? (posseById.get(team.posseId)?.name ?? 'Unknown Posse') : null,
        isEmpty: isTeamEmpty(team),
      })),
    [effectiveActiveTeamId, posseById, teams],
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
          awakener: createSlotAwakenerView(slot),
          isSelected: selectedSlotId === slot.slotId,
          isEmpty: !slot.awakenerId,
          wheels: slot.wheels,
          wheelSlots: [
            createWheelSlotView(slot, slotLabel, 0, wheelById, activeSelection),
            createWheelSlotView(slot, slotLabel, 1, wheelById, activeSelection),
          ],
          covenantId: slot.covenantId,
          covenantName: covenant?.name ?? null,
          covenantAssetSrc: slot.covenantId ? getCovenantAssetById(slot.covenantId) : undefined,
          isCovenantSelected:
            activeSelection?.kind === 'covenant' && activeSelection.slotId === slot.slotId,
        }
      }),
    [activeSelection, activeTeamSlots, covenantById, selectedSlotId, wheelById],
  )

  const quickLineupSession: QuickLineupSession | null = useMemo(
    () => (quickLineupState ? getPublicQuickLineupSession(quickLineupState) : null),
    [quickLineupState],
  )
  const quickLineupStepLabel = useMemo(
    () => getQuickLineupStepLabel(quickLineupSession, slots),
    [quickLineupSession, slots],
  )

  const awakeners = useMemo<BuilderV2AwakenerOption[]>(
    () =>
      searchAwakeners(allAwakeners, searchQueryByTab.awakeners)
        .sort((left, right) =>
          formatAwakenerNameForUi(left.name).localeCompare(formatAwakenerNameForUi(right.name)),
        )
        .map((awakener) => ({
          id: awakener.id,
          name: awakener.name,
          displayName: formatAwakenerNameForUi(awakener.name),
          realm: awakener.realm,
          portraitSrc: getAwakenerPortraitAsset(awakener.name),
          inUse: usedAwakenerIdentityKeys.has(getAwakenerIdentityKeyById(awakener.id)),
        })),
    [searchQueryByTab.awakeners, usedAwakenerIdentityKeys],
  )

  const wheels = useMemo<BuilderV2WheelOption[]>(
    () =>
      searchWheels(allWheels, searchQueryByTab.wheels).map((wheel) => ({
        id: wheel.id,
        name: wheel.name,
        rarity: wheel.rarity,
        realm: wheel.realm,
        mainstat: getWheelMainstatLabel(wheel),
        assetSrc: getWheelAssetById(wheel.id),
        inUse: usedWheelIds.has(wheel.id),
      })),
    [allWheels, searchQueryByTab.wheels, usedWheelIds],
  )

  const covenants = useMemo<BuilderV2CovenantOption[]>(
    () =>
      searchCovenants(allCovenants, searchQueryByTab.covenants).map((covenant) => ({
        id: covenant.id,
        name: covenant.name,
        assetSrc: getCovenantAssetById(covenant.id),
        inUse: activeTeamSlots.some((slot) => slot.covenantId === covenant.id),
      })),
    [activeTeamSlots, allCovenants, searchQueryByTab.covenants],
  )

  const posses = useMemo<BuilderV2PosseOption[]>(
    () =>
      searchPosses(allPosses, searchQueryByTab.posses).map((posse) => ({
        id: posse.id,
        name: posse.name,
        realm: posse.realm,
        assetSrc: getPosseAssetById(posse.id),
        inUse: usedPosseIds.has(posse.id),
        isActive: activeTeam.posseId === posse.id,
      })),
    [activeTeam.posseId, allPosses, searchQueryByTab.posses, usedPosseIds],
  )

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

  const syncQuickLineupFocus = useCallback(
    (focus: BuilderDraftFocus | null) => {
      if (!focus) {
        return
      }

      if (focus.pickerTab) {
        setPickerTab(focus.pickerTab)
      }
      setActiveSelection(focus.selection)
      setActiveTeamTarget(focus.pickerTab === 'posses' && !focus.selection ? {kind: 'posse'} : null)
      setViolationMessage(null)
    },
    [setActiveSelection],
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

  const setActiveTeam = useCallback(
    (teamId: string) => {
      if (quickLineupState) {
        syncQuickLineupFocus(storeCancelQuickLineup())
      }
      setPendingTeamAction(null)
      storeCancelTeamRename()
      clearTransfer()
      setViolationMessage(null)
      setActiveTeamTarget(null)
      setActiveTeamId(teamId)
      setActiveSelection(null)
    },
    [
      clearTransfer,
      quickLineupState,
      setActiveSelection,
      setActiveTeamId,
      storeCancelTeamRename,
      storeCancelQuickLineup,
      syncQuickLineupFocus,
    ],
  )

  const clearTeamTransientState = useCallback(() => {
    if (builderDraftStore.getState().quickLineupState) {
      syncQuickLineupFocus(storeCancelQuickLineup())
    }
    clearTransfer()
    setPendingTeamAction(null)
    storeCancelTeamRename()
    setViolationMessage(null)
    setActiveTeamTarget(null)
    setActiveSelection(null)
  }, [
    clearTransfer,
    setActiveSelection,
    storeCancelQuickLineup,
    storeCancelTeamRename,
    syncQuickLineupFocus,
  ])

  const applyDeleteTeam = useCallback(
    (teamId: string) => {
      clearTeamTransientState()
      const state = builderDraftStore.getState()
      const result = deleteTeam(state.teams, teamId, state.activeTeamId)
      setTeamsInStore(result.nextTeams)
      setActiveTeamId(result.nextActiveTeamId)
    },
    [clearTeamTransientState, setActiveTeamId, setTeamsInStore],
  )

  const applyResetTeam = useCallback(
    (teamId: string) => {
      clearTeamTransientState()
      setTeamsInStore((currentTeams) => resetTeam(currentTeams, teamId))
    },
    [clearTeamTransientState, setTeamsInStore],
  )

  const addTeam = useCallback(() => {
    clearTeamTransientState()
    const result = addTeamToCollection(builderDraftStore.getState().teams)
    setTeamsInStore(result.nextTeams)
    if (result.addedTeamId) {
      setActiveTeamId(result.addedTeamId)
    }
  }, [clearTeamTransientState, setActiveTeamId, setTeamsInStore])

  const beginTeamRename = useCallback(
    (teamId: string) => {
      const team = builderDraftStore.getState().teams.find((entry) => entry.id === teamId)
      if (!team) {
        return
      }
      clearTransfer()
      setPendingTeamAction(null)
      setViolationMessage(null)
      storeBeginTeamRename(team.id, team.name, 'list')
    },
    [clearTransfer, storeBeginTeamRename],
  )

  const commitTeamRename = useCallback(
    (teamId: string) => {
      storeCommitTeamRename(teamId)
      setViolationMessage(null)
    },
    [storeCommitTeamRename],
  )

  const cancelTeamRename = useCallback(() => {
    storeCancelTeamRename()
    setViolationMessage(null)
  }, [storeCancelTeamRename])

  const requestDeleteTeam = useCallback(
    (teamId: string) => {
      const team = builderDraftStore.getState().teams.find((entry) => entry.id === teamId)
      if (!team) {
        return
      }
      clearTransfer()
      storeCancelTeamRename()
      setViolationMessage(null)
      if (isTeamEmpty(team)) {
        applyDeleteTeam(team.id)
        return
      }
      setPendingTeamAction({kind: 'delete', teamId: team.id, teamName: team.name})
    },
    [applyDeleteTeam, clearTransfer, storeCancelTeamRename],
  )

  const requestResetTeam = useCallback(
    (teamId: string) => {
      const team = builderDraftStore.getState().teams.find((entry) => entry.id === teamId)
      if (!team) {
        return
      }
      clearTransfer()
      storeCancelTeamRename()
      setViolationMessage(null)
      if (isTeamEmpty(team)) {
        applyResetTeam(team.id)
        return
      }
      setPendingTeamAction({kind: 'reset', teamId: team.id, teamName: team.name})
    },
    [applyResetTeam, clearTransfer, storeCancelTeamRename],
  )

  const requestApplyTeamTemplate = useCallback(
    (templateId: TeamTemplateId) => {
      clearTransfer()
      storeCancelTeamRename()
      setViolationMessage(null)
      const templateLabel = getTeamTemplateLabel(templateId)
      setPendingTeamAction({kind: 'template', templateId, templateLabel})
    },
    [clearTransfer, storeCancelTeamRename],
  )

  const moveTeam = useCallback(
    (teamId: string, direction: -1 | 1) => {
      clearTransfer()
      storeCancelTeamRename()
      setPendingTeamAction(null)
      setViolationMessage(null)

      const state = builderDraftStore.getState()
      const sourceIndex = state.teams.findIndex((team) => team.id === teamId)
      const targetTeam = state.teams.at(sourceIndex + direction)
      if (sourceIndex === -1 || !targetTeam) {
        return
      }

      setTeamsInStore(reorderTeams(state.teams, teamId, targetTeam.id))
      setActiveTeamId(state.activeTeamId)
    },
    [clearTransfer, setActiveTeamId, setTeamsInStore, storeCancelTeamRename],
  )

  const moveTeamUp = useCallback(
    (teamId: string) => {
      moveTeam(teamId, -1)
    },
    [moveTeam],
  )

  const moveTeamDown = useCallback(
    (teamId: string) => {
      moveTeam(teamId, 1)
    },
    [moveTeam],
  )

  const selectAwakenerSlot = useCallback(
    (slotId: string) => {
      setViolationMessage(null)
      if (quickLineupState) {
        jumpToQuickLineupStep({kind: 'awakener', slotId})
        return
      }

      setActiveTeamTarget(null)
      setPickerTab('awakeners')
      setActiveSelection((current) =>
        current?.kind === 'awakener' && current.slotId === slotId
          ? null
          : {kind: 'awakener', slotId},
      )
    },
    [jumpToQuickLineupStep, quickLineupState, setActiveSelection],
  )

  const selectWheelSlot = useCallback(
    (slotId: string, wheelIndex: 0 | 1) => {
      setViolationMessage(null)
      if (quickLineupState) {
        jumpToQuickLineupStep({kind: 'wheel', slotId, wheelIndex})
        return
      }

      setActiveTeamTarget(null)
      setPickerTab('wheels')
      setActiveSelection((current) =>
        current?.kind === 'wheel' && current.slotId === slotId && current.wheelIndex === wheelIndex
          ? null
          : {kind: 'wheel', slotId, wheelIndex},
      )
    },
    [jumpToQuickLineupStep, quickLineupState, setActiveSelection],
  )

  const selectCovenantSlot = useCallback(
    (slotId: string) => {
      setViolationMessage(null)
      if (quickLineupState) {
        jumpToQuickLineupStep({kind: 'covenant', slotId})
        return
      }

      setActiveTeamTarget(null)
      setPickerTab('covenants')
      setActiveSelection((current) =>
        current?.kind === 'covenant' && current.slotId === slotId
          ? null
          : {kind: 'covenant', slotId},
      )
    },
    [jumpToQuickLineupStep, quickLineupState, setActiveSelection],
  )

  const selectPosse = useCallback(() => {
    setViolationMessage(null)
    if (quickLineupState) {
      jumpToQuickLineupStep({kind: 'posse'})
      return
    }

    setPickerTab('posses')
    setActiveSelection(null)
    setActiveTeamTarget((current) => (current?.kind === 'posse' ? null : {kind: 'posse'}))
  }, [jumpToQuickLineupStep, quickLineupState, setActiveSelection])

  const assignAwakener = useCallback(
    (awakenerId: string) => {
      const targetSlotId = activeSelection?.kind === 'awakener' ? activeSelection.slotId : undefined
      const firstEmptySlotId = activeTeamSlots.find((slot) => !slot.awakenerId)?.slotId
      const result = targetSlotId
        ? assignAwakenerToSlot(activeTeamSlots, awakenerId, targetSlotId, awakenerById, {
            allowDuplicateIdentity: allowDuplicateAwakenerIdentities,
          })
        : assignAwakenerToFirstEmptySlot(activeTeamSlots, awakenerId, awakenerById, {
            allowDuplicateIdentity: allowDuplicateAwakenerIdentities,
          })

      if (result.violation) {
        setViolationMessage(getViolationMessage(result.violation))
        return
      }

      if (result.nextSlots === activeTeamSlots) {
        setViolationMessage('No available slot can accept that awakener.')
        return
      }

      const owningTeamId = getCrossTeamAwakenerOwner({
        activeTeamId: effectiveActiveTeamId,
        allowDuplicateAwakenerIdentities,
        awakenerId,
        slots: activeTeamSlots,
        targetSlotId,
        usedAwakenerByIdentityKey,
      })
      if (owningTeamId) {
        requestAwakenerTransfer({
          awakenerName: awakenerById.get(awakenerId)?.name ?? 'Awakener',
          awakenerId,
          canUseSupport: !activeTeamSlots.some((slot) => slot.isSupport),
          fromTeamId: owningTeamId,
          toTeamId: effectiveActiveTeamId,
          targetSlotId: targetSlotId ?? firstEmptySlotId,
        })
        setViolationMessage(null)
        setPickerTab('awakeners')
        return
      }

      clearTransfer()
      setActiveTeamSlotsInStore(result.nextSlots)
      setViolationMessage(null)
      setActiveTeamTarget(null)
      if (quickLineupState) {
        advanceQuickLineupStep(result.nextSlots)
        return
      }

      const nextSelectedSlotId = targetSlotId ?? firstEmptySlotId
      if (nextSelectedSlotId) {
        setActiveSelection({kind: 'awakener', slotId: nextSelectedSlotId})
      }
    },
    [
      activeSelection,
      activeTeamSlots,
      allowDuplicateAwakenerIdentities,
      advanceQuickLineupStep,
      clearTransfer,
      effectiveActiveTeamId,
      quickLineupState,
      requestAwakenerTransfer,
      setActiveSelection,
      setActiveTeamSlotsInStore,
      usedAwakenerByIdentityKey,
    ],
  )

  const assignWheel = useCallback(
    (wheelId: string) => {
      const target = getWheelAssignmentTarget(activeSelection, activeTeamSlots)
      if (!target) {
        setViolationMessage('Select a wheel slot or an awakened slot before assigning a wheel.')
        setPickerTab('wheels')
        return
      }

      const targetSlot = activeTeamSlots.find((slot) => slot.slotId === target.slotId)
      if (!targetSlot?.awakenerId) {
        setViolationMessage('Wheels require an awakener in that slot.')
        setPickerTab('wheels')
        return
      }

      const wheelOwner = allowDuplicateAwakenerIdentities
        ? undefined
        : usedWheelByTeamOrder.get(wheelId)
      if (
        wheelOwner?.teamId === effectiveActiveTeamId &&
        (wheelOwner.slotId !== target.slotId || wheelOwner.wheelIndex !== target.wheelIndex)
      ) {
        const result = swapWheelAssignments(
          activeTeamSlots,
          wheelOwner.slotId,
          wheelOwner.wheelIndex,
          target.slotId,
          target.wheelIndex,
        )
        setActiveTeamSlotsInStore(result.nextSlots)
        setViolationMessage(null)
        setActiveTeamTarget(null)
        if (quickLineupState) {
          advanceQuickLineupStep(result.nextSlots)
          return
        }
        if (activeSelection?.kind === 'wheel') {
          setActiveSelection({kind: 'wheel', slotId: target.slotId, wheelIndex: target.wheelIndex})
        }
        return
      }

      if (wheelOwner && wheelOwner.teamId !== effectiveActiveTeamId && !targetSlot.isSupport) {
        requestWheelTransfer({
          wheelId,
          fromTeamId: wheelOwner.teamId,
          fromSlotId: wheelOwner.slotId,
          fromWheelIndex: wheelOwner.wheelIndex,
          toTeamId: effectiveActiveTeamId,
          targetSlotId: target.slotId,
          targetWheelIndex: target.wheelIndex,
        })
        setViolationMessage(null)
        setPickerTab('wheels')
        return
      }

      const result = assignWheelToSlot(activeTeamSlots, target.slotId, target.wheelIndex, wheelId)
      if (result.nextSlots === activeTeamSlots) {
        setViolationMessage(null)
        setActiveTeamTarget(null)
        if (activeSelection?.kind === 'wheel') {
          setActiveSelection({kind: 'wheel', slotId: target.slotId, wheelIndex: target.wheelIndex})
        }
        setPickerTab('wheels')
        return
      }

      clearTransfer()
      setActiveTeamSlotsInStore(result.nextSlots)
      setViolationMessage(null)
      setActiveTeamTarget(null)
      if (quickLineupState) {
        advanceQuickLineupStep(result.nextSlots)
        return
      }
      if (activeSelection?.kind === 'wheel') {
        setActiveSelection({kind: 'wheel', slotId: target.slotId, wheelIndex: target.wheelIndex})
      }
    },
    [
      activeSelection,
      activeTeamSlots,
      allowDuplicateAwakenerIdentities,
      advanceQuickLineupStep,
      clearTransfer,
      effectiveActiveTeamId,
      quickLineupState,
      requestWheelTransfer,
      setActiveSelection,
      setActiveTeamSlotsInStore,
      usedWheelByTeamOrder,
    ],
  )

  const assignCovenant = useCallback(
    (covenantId: string) => {
      const targetSlotId = getSlotTargetFromSelection(activeSelection)
      if (!targetSlotId) {
        setViolationMessage('Select a covenant slot or awakened slot before assigning a covenant.')
        setPickerTab('covenants')
        return
      }

      const targetSlot = activeTeamSlots.find((slot) => slot.slotId === targetSlotId)
      if (!targetSlot?.awakenerId) {
        setViolationMessage('Covenants require an awakener in that slot.')
        setPickerTab('covenants')
        return
      }

      const sourceSlot = activeTeamSlots.find(
        (slot) => slot.slotId !== targetSlotId && slot.covenantId === covenantId,
      )
      const result = sourceSlot
        ? swapCovenantAssignments(activeTeamSlots, sourceSlot.slotId, targetSlotId)
        : assignCovenantToSlot(activeTeamSlots, targetSlotId, covenantId)

      if (result.nextSlots === activeTeamSlots) {
        setViolationMessage(null)
        setActiveTeamTarget(null)
        if (activeSelection?.kind === 'covenant') {
          setActiveSelection({kind: 'covenant', slotId: targetSlotId})
        }
        setPickerTab('covenants')
        return
      }

      setActiveTeamSlotsInStore(result.nextSlots)
      setViolationMessage(null)
      setActiveTeamTarget(null)
      if (quickLineupState) {
        advanceQuickLineupStep(result.nextSlots)
        return
      }
      if (activeSelection?.kind === 'covenant') {
        setActiveSelection({kind: 'covenant', slotId: targetSlotId})
      }
    },
    [
      activeSelection,
      activeTeamSlots,
      advanceQuickLineupStep,
      quickLineupState,
      setActiveSelection,
      setActiveTeamSlotsInStore,
    ],
  )

  const assignPosse = useCallback(
    (posseId: string) => {
      const owningTeamOrder = allowDuplicateAwakenerIdentities
        ? undefined
        : usedPosseByTeamOrder.get(posseId)
      const owningTeam = owningTeamOrder === undefined ? undefined : teams.at(owningTeamOrder)

      if (owningTeam && owningTeam.id !== effectiveActiveTeamId) {
        requestPosseTransfer({
          posseId,
          posseName: posseById.get(posseId)?.name ?? 'Posse',
          fromTeamId: owningTeam.id,
          toTeamId: effectiveActiveTeamId,
        })
        setViolationMessage(null)
        setPickerTab('posses')
        return
      }

      clearTransfer()
      const isQuickLineupPosseStep = quickLineupSession?.currentStep.kind === 'posse'
      updateActiveTeam((team) => ({...team, posseId}))
      setViolationMessage(null)
      setActiveSelection(null)
      setActiveTeamTarget({kind: 'posse'})
      setPickerTab('posses')
      if (isQuickLineupPosseStep) {
        advanceQuickLineupStep()
      }
    },
    [
      allowDuplicateAwakenerIdentities,
      advanceQuickLineupStep,
      clearTransfer,
      effectiveActiveTeamId,
      posseById,
      quickLineupSession,
      requestPosseTransfer,
      setActiveSelection,
      teams,
      updateActiveTeam,
      usedPosseByTeamOrder,
    ],
  )

  const removeAwakener = useCallback(
    (slotId: string) => {
      const result = clearSlotAssignment(activeTeamSlots, slotId)
      if (result.nextSlots === activeTeamSlots) {
        return
      }

      setActiveTeamSlotsInStore(result.nextSlots)
      setViolationMessage(null)
      setActiveTeamTarget(null)
      setActiveSelection({kind: 'awakener', slotId})
    },
    [activeTeamSlots, setActiveSelection, setActiveTeamSlotsInStore],
  )

  const clearWheel = useCallback(
    (slotId: string, wheelIndex: 0 | 1) => {
      const result = clearWheelAssignment(activeTeamSlots, slotId, wheelIndex)
      if (result.nextSlots === activeTeamSlots) {
        return
      }

      setActiveTeamSlotsInStore(result.nextSlots)
      setViolationMessage(null)
      setActiveTeamTarget(null)
      setActiveSelection({kind: 'wheel', slotId, wheelIndex})
    },
    [activeTeamSlots, setActiveSelection, setActiveTeamSlotsInStore],
  )

  const clearCovenant = useCallback(
    (slotId: string) => {
      const result = clearCovenantAssignment(activeTeamSlots, slotId)
      if (result.nextSlots === activeTeamSlots) {
        return
      }

      setActiveTeamSlotsInStore(result.nextSlots)
      setViolationMessage(null)
      setActiveTeamTarget(null)
      setActiveSelection({kind: 'covenant', slotId})
    },
    [activeTeamSlots, setActiveSelection, setActiveTeamSlotsInStore],
  )

  const clearPosse = useCallback(() => {
    if (!activeTeam.posseId) {
      return
    }

    updateActiveTeam((team) => ({...team, posseId: undefined}))
    setViolationMessage(null)
    setActiveSelection(null)
    setActiveTeamTarget({kind: 'posse'})
    setPickerTab('posses')
    if (quickLineupSession?.currentStep.kind === 'posse') {
      advanceQuickLineupStep()
    }
  }, [
    activeTeam.posseId,
    advanceQuickLineupStep,
    quickLineupSession,
    setActiveSelection,
    updateActiveTeam,
  ])

  const setTeamsForImportExport = useCallback((nextTeams: SetStateAction<Team[]>) => {
    builderDraftStore
      .getState()
      .setTeams((currentTeams) =>
        typeof nextTeams === 'function' ? nextTeams(currentTeams) : nextTeams,
      )
  }, [])

  const clearImportExportTransientState = useCallback(() => {
    storeFinishQuickLineup()
    setActiveSelection(null)
    setActiveTeamTarget(null)
    setViolationMessage(null)
    clearTransfer()
  }, [clearTransfer, setActiveSelection, storeFinishQuickLineup])

  const {
    openImportDialog,
    openExportAllDialog,
    openTeamExportDialog,
    openTeamIngameExportDialog,
    importExportDialogProps,
  } = useBuilderImportExport({
    teams,
    setTeams: setTeamsForImportExport,
    effectiveActiveTeamId,
    activeTeam,
    teamSlots: activeTeamSlots,
    allowDupes: allowDuplicateAwakenerIdentities,
    setAllowDupes: setAllowDuplicateAwakenerIdentities,
    setActiveTeamId,
    setActiveSelection: () => {
      clearImportExportTransientState()
    },
    clearTransfer: clearImportExportTransientState,
    clearPendingDelete: clearImportExportTransientState,
    showToast,
  })

  const openActiveTeamExportDialog = useCallback(() => {
    openTeamExportDialog(effectiveActiveTeamId)
  }, [effectiveActiveTeamId, openTeamExportDialog])

  const openActiveTeamIngameExportDialog = useCallback(() => {
    openTeamIngameExportDialog(effectiveActiveTeamId)
  }, [effectiveActiveTeamId, openTeamIngameExportDialog])

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
        setActiveTeamTarget(null)
        if (targetSlotId) {
          setActiveSelection({kind: 'awakener', slotId: targetSlotId})
        }
      } else if (transfer.kind === 'wheel') {
        setActiveTeamTarget(null)
        setActiveSelection({
          kind: 'wheel',
          slotId: transfer.targetSlotId,
          wheelIndex: transfer.targetWheelIndex === 0 ? 0 : 1,
        })
      } else {
        setActiveSelection(null)
        setActiveTeamTarget({kind: 'posse'})
        setPickerTab('posses')
      }

      if (quickLineupState) {
        syncQuickLineupFocus(storeAdvanceQuickLineupStep(nextActiveTeam.slots))
      }
    },
    [
      activeTeam,
      effectiveActiveTeamId,
      quickLineupState,
      setActiveSelection,
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

  const cancelTeamAction = useCallback(() => {
    setPendingTeamAction(null)
    setViolationMessage(null)
  }, [])

  const confirmTeamAction = useCallback(() => {
    if (!pendingTeamAction) {
      return
    }

    if (pendingTeamAction.kind === 'delete') {
      applyDeleteTeam(pendingTeamAction.teamId)
      setPendingTeamAction(null)
      return
    }

    if (pendingTeamAction.kind === 'reset') {
      applyResetTeam(pendingTeamAction.teamId)
      setPendingTeamAction(null)
      return
    }

    clearTeamTransientState()
    const result = applyTeamTemplate(
      builderDraftStore.getState().teams,
      pendingTeamAction.templateId,
    )
    setTeamsInStore(result.nextTeams)
    showToast(
      `Applied ${pendingTeamAction.templateLabel}: renamed ${String(result.renamedCount)}, created ${String(result.createdCount)}, removed ${String(result.removedCount)}.`,
    )
    setPendingTeamAction(null)
  }, [
    applyDeleteTeam,
    applyResetTeam,
    clearTeamTransientState,
    pendingTeamAction,
    setTeamsInStore,
    showToast,
  ])

  const teamActionDialog = useMemo<BuilderV2TeamActionDialog | null>(() => {
    if (!pendingTeamAction) {
      return null
    }

    if (pendingTeamAction.kind === 'delete') {
      return {
        title: `Delete ${pendingTeamAction.teamName}`,
        message: `Remove ${pendingTeamAction.teamName}? This cannot be undone.`,
        confirmLabel: 'Delete Team',
        confirmVariant: 'danger',
        onConfirm: confirmTeamAction,
      }
    }

    if (pendingTeamAction.kind === 'reset') {
      return {
        title: `Reset ${pendingTeamAction.teamName}`,
        message: `Reset ${pendingTeamAction.teamName}? This clears assigned awakeners, wheels, covenant, and posse.`,
        confirmLabel: 'Reset Team',
        confirmVariant: 'danger',
        onConfirm: confirmTeamAction,
      }
    }

    return {
      title: `Apply ${pendingTeamAction.templateLabel}`,
      message: `Apply ${pendingTeamAction.templateLabel} to your teams? Existing teams may be renamed, created, or removed when empty.`,
      confirmLabel: 'Apply',
      onConfirm: confirmTeamAction,
    }
  }, [confirmTeamAction, pendingTeamAction])

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
    maxTeams: MAX_TEAMS,
    canAddTeam: teams.length < MAX_TEAMS,
    editingTeamId,
    editingTeamName,
    slots,
    awakeners,
    wheels,
    covenants,
    posses,
    searchQuery,
    setSearchQuery,
    setPickerTab: switchPickerTab,
    setActiveTeam,
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
    assignWheel,
    assignCovenant,
    assignPosse,
    removeAwakener,
    clearWheel,
    clearCovenant,
    clearPosse,
    openImportDialog,
    openExportAllDialog,
    openActiveTeamExportDialog,
    openActiveTeamIngameExportDialog,
    importExportDialogProps,
    transferDialog,
    cancelTransfer,
    teamActionDialog,
    violationMessage,
  }
}

function createSlotAwakenerView(slot: TeamSlot): BuilderV2SlotAwakener | null {
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
    portraitSrc: getAwakenerPortraitAsset(awakener.name),
    isSupport: Boolean(slot.isSupport),
  }
}

function createWheelSlotView(
  slot: TeamSlot,
  slotLabel: string,
  wheelIndex: 0 | 1,
  wheelById: Map<string, Wheel>,
  activeSelection: ActiveSelection,
): BuilderV2WheelSlotView {
  const wheelId = slot.wheels[wheelIndex]
  const wheel = wheelId ? wheelById.get(wheelId) : undefined
  return {
    wheelIndex,
    label: `${slotLabel} Wheel ${String(wheelIndex + 1)}`,
    wheelId,
    wheelName: wheel?.name ?? null,
    assetSrc: wheelId ? getWheelAssetById(wheelId) : undefined,
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

function buildUsedPosseByTeamOrder(teams: Team[]): Map<string, number> {
  const posseMap = new Map<string, number>()
  for (const [teamOrder, team] of teams.entries()) {
    if (!team.posseId || posseMap.has(team.posseId)) {
      continue
    }

    posseMap.set(team.posseId, teamOrder)
  }

  return posseMap
}

function getFirstEmptyWheelIndex(slot: TeamSlot | undefined): 0 | 1 | null {
  if (!slot?.awakenerId) {
    return null
  }

  const firstEmptyIndex = slot.wheels.findIndex((wheelId) => !wheelId)
  return firstEmptyIndex === 0 || firstEmptyIndex === 1 ? firstEmptyIndex : null
}

function getWheelAssignmentTarget(
  activeSelection: ActiveSelection,
  slots: TeamSlot[],
): {slotId: string; wheelIndex: 0 | 1} | null {
  if (activeSelection?.kind === 'wheel') {
    return {
      slotId: activeSelection.slotId,
      wheelIndex: activeSelection.wheelIndex === 0 ? 0 : 1,
    }
  }

  if (activeSelection?.kind !== 'awakener') {
    return null
  }

  const slot = slots.find((entry) => entry.slotId === activeSelection.slotId)
  const wheelIndex = getFirstEmptyWheelIndex(slot)
  return wheelIndex === null ? null : {slotId: activeSelection.slotId, wheelIndex}
}

function getSlotTargetFromSelection(activeSelection: ActiveSelection): string | null {
  if (activeSelection?.kind === 'awakener' || activeSelection?.kind === 'covenant') {
    return activeSelection.slotId
  }

  return null
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

function getTeamTemplateLabel(templateId: TeamTemplateId): string {
  return templateId === 'DTIDE_10' ? 'D-Tide 10' : 'D-Tide 5'
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

interface CrossTeamAwakenerOwnerOptions {
  activeTeamId: string
  allowDuplicateAwakenerIdentities: boolean
  awakenerId: string
  slots: TeamSlot[]
  targetSlotId: string | undefined
  usedAwakenerByIdentityKey: Map<string, string>
}

function getCrossTeamAwakenerOwner({
  activeTeamId,
  allowDuplicateAwakenerIdentities,
  awakenerId,
  slots,
  targetSlotId,
  usedAwakenerByIdentityKey,
}: CrossTeamAwakenerOwnerOptions): string | null {
  if (allowDuplicateAwakenerIdentities) {
    return null
  }

  const targetSlot = targetSlotId ? slots.find((slot) => slot.slotId === targetSlotId) : undefined
  if (targetSlot?.isSupport) {
    return null
  }

  const owningTeamId = usedAwakenerByIdentityKey.get(getAwakenerIdentityKeyById(awakenerId))
  if (!owningTeamId || owningTeamId === activeTeamId) {
    return null
  }

  return owningTeamId
}

function getViolationMessage(violation: TeamStateViolationCode): string {
  if (violation === 'TOO_MANY_REALMS_IN_TEAM') {
    return 'A team can only contain up to 2 realms.'
  }

  return 'That assignment would break current builder rules.'
}
