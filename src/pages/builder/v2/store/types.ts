import type {AwakenerSortKey, CollectionSortDirection} from '@/domain/collection-sorting'

import type {InternalQuickLineupSession} from '../../quick-lineup'
import type {
  PendingTransfer,
  RequestAwakenerTransfer,
  RequestPosseTransfer,
  RequestWheelTransfer,
} from '../../transfer-types'
import type {
  ActiveSelection,
  AwakenerFilter,
  PickerTab,
  PosseFilter,
  Team,
  TeamSlot,
  WheelMainstatFilter,
  WheelRarityFilter,
} from '../../types'

export interface TeamsSlice {
  teams: Team[]
  activeTeamId: string

  addTeam: () => void
  deleteTeam: (teamId: string) => void
  renameTeam: (teamId: string, name: string) => void
  reorderTeams: (sourceTeamId: string, targetTeamId: string) => void
  resetTeam: (teamId: string) => void
  applyTemplate: (templateId: 'DTIDE_5' | 'DTIDE_10') => void
  setActiveTeamId: (teamId: string) => void
  setActiveTeamSlots: (nextSlots: TeamSlot[], preferredStep?: QuickLineupStep | null) => void
  updateActiveTeam: (updater: (team: Team) => Team) => void
  setTeams: (teams: Team[]) => void
  setPosseForActiveTeam: (posseId: string | undefined) => void
}

export interface SelectionSlice {
  activeSelection: ActiveSelection
  setActiveSelection: (selection: ActiveSelection) => void
  toggleAwakenerSelection: (slotId: string) => void
  toggleWheelSelection: (slotId: string, wheelIndex: number) => void
  toggleCovenantSelection: (slotId: string) => void
  clearSelection: () => void
}

export interface PickerSlice {
  pickerTab: PickerTab
  pickerSearchByTab: Record<PickerTab, string>
  awakenerFilter: AwakenerFilter
  posseFilter: PosseFilter
  wheelRarityFilter: WheelRarityFilter
  wheelMainstatFilter: WheelMainstatFilter
  awakenerSortKey: AwakenerSortKey
  awakenerSortDirection: CollectionSortDirection
  awakenerSortGroupByRealm: boolean
  displayUnowned: boolean
  sinkUnownedToBottom: boolean
  allowDupes: boolean
  promoteRecommendedGear: boolean
  promoteMatchingWheelMainstats: boolean

  setPickerTab: (tab: PickerTab) => void
  setPickerSearchQuery: (tab: PickerTab, query: string) => void
  setAwakenerFilter: (filter: AwakenerFilter) => void
  setPosseFilter: (filter: PosseFilter) => void
  setWheelRarityFilter: (filter: WheelRarityFilter) => void
  setWheelMainstatFilter: (filter: WheelMainstatFilter) => void
  setAwakenerSortKey: (key: AwakenerSortKey) => void
  toggleAwakenerSortDirection: () => void
  setAwakenerSortGroupByRealm: (value: boolean) => void
  setDisplayUnowned: (value: boolean) => void
  setSinkUnownedToBottom: (value: boolean) => void
  setAllowDupes: (allowDupes: boolean) => void
  setPromoteRecommendedGear: (value: boolean) => void
  setPromoteMatchingWheelMainstats: (value: boolean) => void
}

export interface QuickLineupSlice {
  quickLineupSessionState: InternalQuickLineupSession | null

  setQuickLineupSessionState: (session: InternalQuickLineupSession | null) => void
  startQuickLineup: (steps: QuickLineupStep[]) => void
  finishQuickLineup: () => void
  cancelQuickLineup: () => void
  nextQuickLineupStep: (expectedStepIndex?: number) => void
  prevQuickLineupStep: (expectedStepIndex?: number) => void
  skipQuickLineupStep: (expectedStepIndex?: number) => void
  jumpToQuickLineupStep: (step: QuickLineupStep) => void
}

export interface TransferSlice {
  pendingTransfer: PendingTransfer | null

  requestAwakenerTransfer: (request: RequestAwakenerTransfer) => void
  requestPosseTransfer: (request: RequestPosseTransfer) => void
  requestWheelTransfer: (request: RequestWheelTransfer) => void
  clearTransfer: () => void
}

export interface OwnershipSlice {
  ownedAwakenerLevelByName: Map<string, number | null>
  awakenerLevelByName: Map<string, number>
  ownedWheelLevelById: Map<string, number | null>
  ownedPosseLevelById: Map<string, number | null>

  refreshCollectionOwnership: () => void
}

export type QuickLineupStep =
  | {kind: 'awakener'; slotId: string}
  | {kind: 'wheel'; slotId: string; wheelIndex: number}
  | {kind: 'covenant'; slotId: string}
  | {kind: 'posse'}

export type BuilderStore = TeamsSlice &
  SelectionSlice &
  PickerSlice &
  QuickLineupSlice &
  TransferSlice &
  OwnershipSlice

export type BuilderSet = (
  updater: BuilderStore | Partial<BuilderStore> | ((state: BuilderStore) => void),
) => void
export type BuilderGet = () => BuilderStore
