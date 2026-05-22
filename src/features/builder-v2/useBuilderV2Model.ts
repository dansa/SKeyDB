import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type SetStateAction,
} from 'react'

import {useStore} from 'zustand'

import {
  AWAKENER_BUILD_WHEEL_TIERS,
  compareCovenantsForBuildRecommendation,
  type AwakenerBuild,
  type AwakenerBuildWheelTier,
  getCovenantRecommendationIndex,
} from '@/domain/awakener-builds'
import {getAwakenerCardAsset, getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import {getAwakenerIdentityKeyById} from '@/domain/awakener-identity'
import type {Awakener} from '@/domain/awakeners'
import {searchAwakenerResults} from '@/domain/awakeners-search'
import {
  compareAwakenersForCollectionSort,
  compareWheelsForCollectionSort,
  resolveAwakenerSortKey,
  type AwakenerSortKey,
  type CollectionSortDirection,
  type WheelCollectionSortKey,
} from '@/domain/collection-sorting'
import {getCovenantAssetById} from '@/domain/covenant-assets'
import {getCovenants, type Covenant} from '@/domain/covenants'
import {searchCovenants} from '@/domain/covenants-search'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getPosseAssetById} from '@/domain/posse-assets'
import {getPosses, type Posse} from '@/domain/posses'
import {searchPosses} from '@/domain/posses-search'
import {compareSearchRelevance, getSearchRelevanceByEntityId} from '@/domain/search-relevance'
import {getBrowserLocalStorage, safeStorageRead, safeStorageWrite} from '@/domain/storage'
import {getWheelAssetById} from '@/domain/wheel-assets'
import {matchesWheelMainstat, type WheelMainstatFilter} from '@/domain/wheel-mainstat-filters'
import {compareWheelsForUi} from '@/domain/wheel-sort'
import {getWheelMainstatLabel, getWheels, type Wheel} from '@/domain/wheels'
import {searchWheels} from '@/domain/wheels-search'
import {
  builderDraftStore,
  createDefaultBuilderDraft,
  type BuilderDraftFocus,
} from '@/stores/builderDraftStore'
import {collectionOwnershipStore} from '@/stores/collectionOwnershipStore'

import {buildBuilderV2UsageIndex} from './builder-v2-usage-index'
import type {BuilderV2AwakenerUsage} from './builder-v2-usage-index'
import type {
  BuilderV2ActivePosseView,
  BuilderV2AwakenerFilter,
  BuilderV2AwakenerOption,
  BuilderV2CovenantOption,
  BuilderV2Model,
  BuilderV2PendingTeamAction,
  BuilderV2PickerModel,
  BuilderV2PickerPreferences,
  BuilderV2PickerTab,
  BuilderV2PosseFilter,
  BuilderV2PosseOption,
  BuilderV2SlotAwakener,
  BuilderV2SlotView,
  BuilderV2TeamActionDialog,
  BuilderV2TeamSummary,
  BuilderV2TeamTarget,
  BuilderV2TransferDialog,
  BuilderV2WheelOption,
  BuilderV2WheelRarityFilter,
  BuilderV2WheelSlotView,
} from './BuilderV2ModelTypes'
import {createBuilderOwnershipProjection} from '../builder/builder-ownership-projection'
import {loadBuilderDraft, saveBuilderDraft} from '../builder/builder-persistence'
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
  getTeamRealmSet,
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
} from '../builder/types'
import {useBuilderImportExport} from '../builder/useBuilderImportExport'
import {useAwakenerBuildRecommendations} from '../builder/useAwakenerBuildRecommendations'
import {useTransferConfirm, type PendingTransfer} from '../builder/useTransferConfirm'

const BUILDER_V2_AUTOSAVE_DEBOUNCE_MS = 300
const BUILDER_ALLOW_DUPES_KEY = 'skeydb.builder.allowDupes.v1'
const BUILDER_AWAKENER_SORT_KEY_KEY = 'skeydb.builder.awakenerSortKey.v1'
const BUILDER_AWAKENER_SORT_DIRECTION_KEY = 'skeydb.builder.awakenerSortDirection.v1'
const BUILDER_AWAKENER_SORT_GROUP_BY_REALM_KEY = 'skeydb.builder.awakenerSortGroupByFaction.v1'
const BUILDER_DISPLAY_UNOWNED_KEY = 'skeydb.builder.displayUnowned.v1'
const BUILDER_PROMOTE_RECOMMENDED_GEAR_KEY = 'skeydb.builder.promoteRecommendedGear.v1'
const BUILDER_PROMOTE_MATCHING_WHEEL_MAINSTATS_KEY =
  'skeydb.builder.promoteMatchingWheelMainstats.v1'
const BUILDER_SINK_UNOWNED_TO_BOTTOM_KEY = 'skeydb.builder.sinkUnownedToBottom.v1'
const BUILDER_V2_WHEEL_SORT_KEY_KEY = 'skeydb.builderV2.wheelSortKey.v1'
const BUILDER_V2_WHEEL_SORT_DIRECTION_KEY = 'skeydb.builderV2.wheelSortDirection.v1'

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
  const [displayUnowned, setDisplayUnowned] = useState(() => {
    const stored = safeStorageRead(storage, BUILDER_DISPLAY_UNOWNED_KEY)
    return stored === '0' ? false : true
  })
  const [sinkUnownedToBottom, setSinkUnownedToBottom] = useState(
    () => safeStorageRead(storage, BUILDER_SINK_UNOWNED_TO_BOTTOM_KEY) === '1',
  )
  const [promoteRecommendedGear, setPromoteRecommendedGear] = useState(() => {
    const stored = safeStorageRead(storage, BUILDER_PROMOTE_RECOMMENDED_GEAR_KEY)
    return stored === '0' ? false : true
  })
  const [promoteMatchingWheelMainstats, setPromoteMatchingWheelMainstats] = useState(
    () => safeStorageRead(storage, BUILDER_PROMOTE_MATCHING_WHEEL_MAINSTATS_KEY) === '1',
  )
  const [awakenerFilter, setAwakenerFilter] = useState<BuilderV2AwakenerFilter>('ALL')
  const [posseFilter, setPosseFilter] = useState<BuilderV2PosseFilter>('ALL')
  const [wheelRarityFilter, setWheelRarityFilter] = useState<BuilderV2WheelRarityFilter>('ALL')
  const [wheelMainstatFilter, setWheelMainstatFilter] = useState<WheelMainstatFilter>('ALL')
  const [awakenerSortKey, setAwakenerSortKey] = useState<AwakenerSortKey>(() =>
    resolveAwakenerSortKey(safeStorageRead(storage, BUILDER_AWAKENER_SORT_KEY_KEY)),
  )
  const [awakenerSortDirection, setAwakenerSortDirection] = useState<CollectionSortDirection>(() =>
    safeStorageRead(storage, BUILDER_AWAKENER_SORT_DIRECTION_KEY) === 'ASC' ? 'ASC' : 'DESC',
  )
  const [awakenerSortGroupByRealm, setAwakenerSortGroupByRealm] = useState(() => {
    const stored = safeStorageRead(storage, BUILDER_AWAKENER_SORT_GROUP_BY_REALM_KEY)
    return stored === '0' ? false : true
  })
  const [wheelSortKey, setWheelSortKey] = useState<WheelCollectionSortKey>(() =>
    resolveWheelSortKey(safeStorageRead(storage, BUILDER_V2_WHEEL_SORT_KEY_KEY)),
  )
  const [wheelSortDirection, setWheelSortDirection] = useState<CollectionSortDirection>(() =>
    safeStorageRead(storage, BUILDER_V2_WHEEL_SORT_DIRECTION_KEY) === 'ASC' ? 'ASC' : 'DESC',
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
  const [pendingTeamAction, setPendingTeamAction] = useState<BuilderV2PendingTeamAction | null>(
    null,
  )

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_ALLOW_DUPES_KEY, allowDuplicateAwakenerIdentities ? '1' : '0')
  }, [allowDuplicateAwakenerIdentities, storage])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_DISPLAY_UNOWNED_KEY, displayUnowned ? '1' : '0')
  }, [displayUnowned, storage])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_SINK_UNOWNED_TO_BOTTOM_KEY, sinkUnownedToBottom ? '1' : '0')
  }, [sinkUnownedToBottom, storage])

  useEffect(() => {
    safeStorageWrite(
      storage,
      BUILDER_PROMOTE_RECOMMENDED_GEAR_KEY,
      promoteRecommendedGear ? '1' : '0',
    )
  }, [promoteRecommendedGear, storage])

  useEffect(() => {
    safeStorageWrite(
      storage,
      BUILDER_PROMOTE_MATCHING_WHEEL_MAINSTATS_KEY,
      promoteMatchingWheelMainstats ? '1' : '0',
    )
  }, [promoteMatchingWheelMainstats, storage])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_AWAKENER_SORT_KEY_KEY, awakenerSortKey)
  }, [awakenerSortKey, storage])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_AWAKENER_SORT_DIRECTION_KEY, awakenerSortDirection)
  }, [awakenerSortDirection, storage])

  useEffect(() => {
    safeStorageWrite(
      storage,
      BUILDER_AWAKENER_SORT_GROUP_BY_REALM_KEY,
      awakenerSortGroupByRealm ? '1' : '0',
    )
  }, [awakenerSortGroupByRealm, storage])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_V2_WHEEL_SORT_KEY_KEY, wheelSortKey)
  }, [storage, wheelSortKey])

  useEffect(() => {
    safeStorageWrite(storage, BUILDER_V2_WHEEL_SORT_DIRECTION_KEY, wheelSortDirection)
  }, [storage, wheelSortDirection])

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
  const wheelAssetById = useMemo(
    () => new Map(allWheels.map((wheel) => [wheel.id, getWheelAssetById(wheel.id)])),
    [allWheels],
  )
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
          const awakenerEntity = slot.awakenerId ? awakenerById.get(slot.awakenerId) : undefined
          const awakenerName = awakenerEntity
            ? formatAwakenerNameForUi(awakenerEntity.name)
            : slot.awakenerId
              ? 'Unknown'
              : 'Empty'
          return {
            slotId: slot.slotId,
            label: `Slot ${String(index + 1)}`,
            name: awakenerName,
            portraitSrc: awakenerEntity ? getAwakenerPortraitAsset(awakenerEntity.name) : undefined,
            isEmpty: !slot.awakenerId,
            isSupport: Boolean(slot.isSupport),
            wheelCount: slot.wheels.filter(Boolean).length,
            hasCovenant: Boolean(slot.covenantId),
          }
        }),
        posseName: team.posseId ? (posseById.get(team.posseId)?.name ?? 'Unknown Posse') : null,
        posseAssetSrc: team.posseId ? getPosseAssetById(team.posseId) : undefined,
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
          awakener: createSlotAwakenerView(slot, ownedAwakenerLevelByName),
          isSelected: selectedSlotId === slot.slotId,
          isEmpty: !slot.awakenerId,
          wheels: slot.wheels,
          wheelSlots: [
            createWheelSlotView(slot, slotLabel, 0, wheelById, activeSelection, ownedWheelLevelById),
            createWheelSlotView(slot, slotLabel, 1, wheelById, activeSelection, ownedWheelLevelById),
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
    () => (quickLineupState ? getPublicQuickLineupSession(quickLineupState) : null),
    [quickLineupState],
  )
  const quickLineupStepLabel = useMemo(
    () => getQuickLineupStepLabel(quickLineupSession, slots),
    [quickLineupSession, slots],
  )

  const activeTeamSlotById = useMemo(
    () => new Map(activeTeamSlots.map((slot) => [slot.slotId, slot])),
    [activeTeamSlots],
  )
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

    const searchResults = searchAwakenerResults(allAwakeners, searchQueryByTab.awakeners)
    const searched = searchResults.map((result) => result.entity)
    const relevanceById = getSearchRelevanceByEntityId(searchResults, searchQueryByTab.awakeners)
    const byRealm =
      awakenerFilter === 'ALL'
        ? searched
        : searched.filter((awakener) => awakener.realm.trim().toUpperCase() === awakenerFilter)
    const byOwnership = displayUnowned
      ? byRealm
      : byRealm.filter((awakener) => isAwakenerOwnedByName(awakener.name))
    const sortableAwakenerById = new Map(
      byOwnership.map((awakener) => [
        awakener.id,
        createSortableAwakenerEntry(awakener, ownedAwakenerLevelByName, awakenerLevelByName),
      ]),
    )
    const sorted = [...byOwnership].sort((left, right) => {
      const relevanceCompare = compareSearchRelevance(left, right, relevanceById)
      if (relevanceCompare !== 0) {
        return relevanceCompare
      }
      const leftSortable = sortableAwakenerById.get(left.id)
      const rightSortable = sortableAwakenerById.get(right.id)
      if (!leftSortable || !rightSortable) {
        return 0
      }
      return compareAwakenersForCollectionSort(
        leftSortable,
        rightSortable,
        {
          key: awakenerSortKey,
          direction: awakenerSortDirection,
          groupByRealm: awakenerSortGroupByRealm,
        },
      )
    })
    const visible = sinkUnownedToBottom
      ? sinkUnownedToEnd(sorted, (awakener) => isAwakenerOwnedByName(awakener.name))
      : sorted
    const teamRealmSet = getTeamRealmSet(activeTeamSlots)

    return visible.map((awakener) => {
      const identityKey = getAwakenerIdentityKeyById(awakener.id)
      const inUse = usedAwakenerIdentityKeys.has(identityKey)
      const usedTeamOrder = usageIndex.awakenerByIdentityKey.get(identityKey)?.teamOrder
      const blockedByDupes = !allowDuplicateAwakenerIdentities && inUse
      const blockedByRealm =
        teamRealmSet.size >= 2 && !teamRealmSet.has(awakener.realm.trim().toUpperCase())
      return {
        id: awakener.id,
        name: awakener.name,
        displayName: formatAwakenerNameForUi(awakener.name),
        realm: awakener.realm,
        portraitSrc: getAwakenerPortraitAsset(awakener.name),
        inUse,
        inUseLabel: usedTeamOrder === undefined ? null : `Team ${String(usedTeamOrder + 1)}`,
        owned: isAwakenerOwnedByName(awakener.name),
        level: awakenerLevelByName.get(awakener.name) ?? 60,
        enlightenLevel: ownedAwakenerLevelByName.get(awakener.name) ?? null,
        blocked: blockedByDupes || blockedByRealm,
        blockReason: blockedByDupes ? 'In use' : blockedByRealm ? 'Realm limit' : null,
      }
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

    const byRarity =
      wheelRarityFilter === 'ALL'
        ? allWheels
        : allWheels.filter((wheel) => wheel.rarity === wheelRarityFilter)
    const byMainstat =
      wheelMainstatFilter === 'ALL'
        ? byRarity
        : byRarity.filter((wheel) => matchesWheelMainstat(wheel.mainstatKey, wheelMainstatFilter))
    const visible = displayUnowned
      ? byMainstat
      : byMainstat.filter((wheel) => isWheelOwnedById(wheel.id))
    const searched = searchWheels(visible, searchQueryByTab.wheels)
    const sortableWheelById = new Map(
      searched.map((wheel) => [wheel.id, createSortableWheelEntry(wheel, ownedWheelLevelById)]),
    )
    const wheelFallbackCompare = (left: Wheel, right: Wheel) =>
      compareSortableWheels(left, right, sortableWheelById, {
        key: wheelSortKey,
        direction: wheelSortDirection,
      })
    const sorted = [...searched].sort((left, right) =>
      promoteRecommendedGear
        ? compareWheelsForCachedBuildRecommendation(left, right, {
            fallbackCompare: wheelFallbackCompare,
            promoteMainstats: promoteMatchingWheelMainstats,
            recommendationById: wheelRecommendationById,
          })
        : wheelFallbackCompare(left, right),
    )
    const ordered = sinkUnownedToBottom
      ? sinkUnownedToEnd(sorted, (wheel) => isWheelOwnedById(wheel.id))
      : sorted

    return ordered.map((wheel) => {
      const usedByTeam = usedWheelByTeamOrder.get(wheel.id)
      const recommendationMeta = wheelRecommendationById.get(wheel.id)
      const recommendationTier = recommendationMeta?.tier ?? null
      const recommendedMainstatKey =
        promoteMatchingWheelMainstats && recommendationMeta?.mainstatIndex !== undefined
          ? wheel.mainstatKey
          : null
      return {
        id: wheel.id,
        name: wheel.name,
        rarity: wheel.rarity,
        realm: wheel.realm,
        mainstat: getWheelMainstatLabel(wheel),
        mainstatKey: wheel.mainstatKey,
        assetSrc: wheelAssetById.get(wheel.id),
        inUse: usedWheelIds.has(wheel.id),
        inUseLabel: usedByTeam ? `Team ${String(usedByTeam.teamOrder + 1)}` : null,
        owned: isWheelOwnedById(wheel.id),
        enlightenLevel: ownedWheelLevelById.get(wheel.id) ?? null,
        recommended: Boolean(recommendationTier ?? recommendedMainstatKey),
        recommendationLabel: getWheelRecommendationChipLabel(recommendationTier),
        recommendedMainstatKey,
      }
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
    wheelAssetById,
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

    const searched = searchCovenants(allCovenants, searchQueryByTab.covenants)
    const sorted = [...searched].sort((left, right) =>
      promoteRecommendedGear
        ? compareCovenantsForBuildRecommendation(left, right, activeBuild, {
            fallbackCompare: compareCovenantsById,
          })
        : compareCovenantsById(left, right),
    )

    return sorted.map((covenant) => {
      const recommendationIndex = getCovenantRecommendationIndex(activeBuild, covenant.id)
      return {
        id: covenant.id,
        name: covenant.name,
        assetSrc: getCovenantAssetById(covenant.id),
        inUse: activeTeamSlots.some((slot) => slot.covenantId === covenant.id),
        recommended: recommendationIndex >= 0,
        recommendationLabel: recommendationIndex >= 0 ? `#${String(recommendationIndex + 1)}` : null,
      }
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

    const searched = searchPosses(allPosses, searchQueryByTab.posses)
    const byFilter = searched.filter((posse) => {
      if (posseFilter === 'ALL') {
        return true
      }
      if (posseFilter === 'FADED_LEGACY') {
        return posse.isFadedLegacy
      }
      return !posse.isFadedLegacy && posse.realm.trim().toUpperCase() === posseFilter
    })
    const byOwnership = displayUnowned
      ? byFilter
      : byFilter.filter((posse) => isPosseOwnedById(posse.id))
    const sorted = promoteRecommendedGear
      ? [...byOwnership].sort((left, right) => {
          const leftRecommended = teamRecommendedPosseIds.has(left.id)
          const rightRecommended = teamRecommendedPosseIds.has(right.id)
          if (leftRecommended === rightRecommended) {
            return left.name.localeCompare(right.name)
          }
          return leftRecommended ? -1 : 1
        })
      : byOwnership
    const ordered = sinkUnownedToBottom
      ? sinkUnownedToEnd(sorted, (posse) => isPosseOwnedById(posse.id))
      : sorted

    return ordered.map((posse) => {
      const usedTeamOrder = usedPosseByTeamOrder.get(posse.id)
      const inUse = usedTeamOrder !== undefined
      const isActive = activeTeam.posseId === posse.id
      const blocked = !allowDuplicateAwakenerIdentities && inUse && !isActive
      return {
        id: posse.id,
        name: posse.name,
        realm: posse.realm,
        assetSrc: getPosseAssetById(posse.id),
        inUse,
        isActive,
        owned: isPosseOwnedById(posse.id),
        recommended: teamRecommendedPosseIds.has(posse.id),
        blocked,
        statusLabel: isActive
          ? 'Active'
          : blocked
            ? `Team ${String(usedTeamOrder + 1)}`
            : !isPosseOwnedById(posse.id)
              ? 'Unowned'
              : teamRecommendedPosseIds.has(posse.id)
                ? 'Rec'
                : null,
      }
    })
  }, [
    activeTeam.posseId,
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

  const toggleAwakenerSortDirection = useCallback(() => {
    setAwakenerSortDirection((current) => (current === 'DESC' ? 'ASC' : 'DESC'))
  }, [])

  const toggleWheelSortDirection = useCallback(() => {
    setWheelSortDirection((current) => (current === 'DESC' ? 'ASC' : 'DESC'))
  }, [])

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
      setSearchQuery,
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
      startTransition(() => {
        setPickerTab('awakeners')
      })
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
      startTransition(() => {
        setPickerTab('wheels')
      })
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
      startTransition(() => {
        setPickerTab('covenants')
      })
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

    startTransition(() => {
      setPickerTab('posses')
    })
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
        usedAwakenerByIdentityKey: usageIndex.awakenerByIdentityKey,
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
      usageIndex,
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
    picker,
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

function createSortableAwakenerEntry(
  awakener: Awakener,
  ownedAwakenerLevelByName: Map<string, number | null>,
  awakenerLevelByName: Map<string, number>,
) {
  return {
    label: formatAwakenerNameForUi(awakener.name),
    index: awakener.numericId ?? Number.MAX_SAFE_INTEGER,
    owned: (ownedAwakenerLevelByName.get(awakener.name) ?? null) !== null,
    enlighten: ownedAwakenerLevelByName.get(awakener.name) ?? 0,
    level: awakenerLevelByName.get(awakener.name) ?? 60,
    rarity: awakener.rarity,
    realm: awakener.realm,
    releaseDate: awakener.releaseDate,
  }
}

function createSortableWheelEntry(wheel: Wheel, ownedWheelLevelById: Map<string, number | null>) {
  return {
    label: wheel.name,
    index: Number.parseInt(wheel.id.replace(/\D+/g, ''), 10) || Number.MAX_SAFE_INTEGER,
    owned: (ownedWheelLevelById.get(wheel.id) ?? null) !== null,
    enlighten: ownedWheelLevelById.get(wheel.id) ?? 0,
    rarity: wheel.rarity,
    realm: wheel.realm,
    mainstatLabel: getWheelMainstatLabel(wheel),
  }
}

function compareSortableWheels(
  left: Wheel,
  right: Wheel,
  sortableWheelById: Map<string, ReturnType<typeof createSortableWheelEntry>>,
  sort: {key: WheelCollectionSortKey; direction: CollectionSortDirection},
): number {
  const leftSortable = sortableWheelById.get(left.id)
  const rightSortable = sortableWheelById.get(right.id)
  if (!leftSortable || !rightSortable) {
    return 0
  }
  return compareWheelsForCollectionSort(leftSortable, rightSortable, sort)
}

interface CachedWheelRecommendation {
  bucket: number
  tier: AwakenerBuildWheelTier | null
  mainstatIndex: number | undefined
}

function createWheelRecommendationMetaById(
  build: AwakenerBuild | null | undefined,
  wheels: readonly Wheel[],
): Map<string, CachedWheelRecommendation> {
  const metaById = new Map<string, CachedWheelRecommendation>()
  const defaultBucket =
    AWAKENER_BUILD_WHEEL_TIERS.length + (build?.recommendedWheelMainstats?.length ?? 0) + 1

  if (!build) {
    metaById.set('__default__', {
      bucket: defaultBucket,
      tier: null,
      mainstatIndex: undefined,
    })
    return metaById
  }

  build.recommendedWheels.forEach((group, groupIndex) => {
    for (const wheelId of group.wheelIds) {
      metaById.set(wheelId, {
        bucket: groupIndex,
        tier: group.tier,
        mainstatIndex: undefined,
      })
    }
  })

  build.recommendedWheelMainstats?.forEach((mainstatKey, mainstatIndex) => {
    for (const wheel of wheels) {
      if (wheel.mainstatKey !== mainstatKey || metaById.has(wheel.id)) {
        continue
      }
      metaById.set(wheel.id, {
        bucket: AWAKENER_BUILD_WHEEL_TIERS.length + mainstatIndex,
        tier: null,
        mainstatIndex,
      })
    }
  })

  metaById.set('__default__', {
    bucket: defaultBucket,
    tier: null,
    mainstatIndex: undefined,
  })

  return metaById
}

function compareWheelsForCachedBuildRecommendation(
  left: Wheel,
  right: Wheel,
  options: {
    fallbackCompare: (left: Wheel, right: Wheel) => number
    promoteMainstats: boolean
    recommendationById: Map<string, CachedWheelRecommendation>
  },
): number {
  const defaultBucket =
    options.recommendationById.get('__default__')?.bucket ?? AWAKENER_BUILD_WHEEL_TIERS.length + 1
  const leftMeta = options.recommendationById.get(left.id)
  const rightMeta = options.recommendationById.get(right.id)
  const leftBucket =
    leftMeta && (leftMeta.tier || options.promoteMainstats) ? leftMeta.bucket : defaultBucket
  const rightBucket =
    rightMeta && (rightMeta.tier || options.promoteMainstats) ? rightMeta.bucket : defaultBucket

  if (leftBucket !== rightBucket) {
    return leftBucket - rightBucket
  }

  return options.fallbackCompare(left, right)
}

function compareCovenantsById(left: Covenant, right: Covenant): number {
  return left.id.localeCompare(right.id, undefined, {numeric: true, sensitivity: 'base'})
}

function resolveWheelSortKey(value: unknown): WheelCollectionSortKey {
  return value === 'ALPHABETICAL' ||
    value === 'RARITY' ||
    value === 'REALM' ||
    value === 'MAINSTAT' ||
    value === 'ENLIGHTEN'
    ? value
    : 'RARITY'
}

function getWheelRecommendationChipLabel(tier: AwakenerBuildWheelTier | null): string | null {
  switch (tier) {
    case 'BIS_SSR':
      return 'BiS'
    case 'ALT_SSR':
      return 'Alt'
    case 'BIS_SR':
      return 'BiS SR'
    case 'GOOD':
      return 'Good'
    default:
      return null
  }
}

function sinkUnownedToEnd<TEntity>(
  entries: readonly TEntity[],
  isOwned: (entry: TEntity) => boolean,
): TEntity[] {
  return [...entries].sort((left, right) => {
    const leftOwned = isOwned(left)
    const rightOwned = isOwned(right)
    if (leftOwned === rightOwned) {
      return 0
    }
    return leftOwned ? -1 : 1
  })
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
  wheelIndex: 0 | 1,
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
  usedAwakenerByIdentityKey: Map<string, BuilderV2AwakenerUsage>
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

  const owningTeamId = usedAwakenerByIdentityKey.get(
    getAwakenerIdentityKeyById(awakenerId),
  )?.teamId
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
