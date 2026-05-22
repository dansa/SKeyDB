import type {Awakener} from '@/domain/awakeners'
import type {AwakenerSortKey, CollectionSortDirection, WheelCollectionSortKey} from '@/domain/collection-sorting'
import type {WheelMainstatFilter} from '@/domain/wheel-mainstat-filters'
import type {Wheel} from '@/domain/wheels'

import type {BuilderImportExportDialogsProps} from '../builder/BuilderImportExportDialogs'
import type {ActiveSelection, QuickLineupSession} from '../builder/types'
import type {TeamTemplateId} from '../builder/team-collection'

export type BuilderV2PickerTab = 'awakeners' | 'wheels' | 'covenants' | 'posses'
export type BuilderV2AwakenerFilter = 'ALL' | 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA'
export type BuilderV2PosseFilter =
  | 'ALL'
  | 'FADED_LEGACY'
  | 'AEQUOR'
  | 'CARO'
  | 'CHAOS'
  | 'ULTRA'
export type BuilderV2WheelRarityFilter = 'ALL' | 'SSR' | 'SR' | 'R'
export type BuilderV2TeamTarget = {kind: 'posse'} | null

export type BuilderV2PendingTeamAction =
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
  posseAssetSrc: string | undefined
  isEmpty: boolean
}

export interface BuilderV2TeamSummarySlot {
  slotId: string
  label: string
  name: string
  portraitSrc: string | undefined
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
  enlightenLevel: number | null
  cardSrc: string | undefined
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
  inUseLabel: string | null
  owned: boolean
  level: number
  enlightenLevel: number | null
  blocked: boolean
  blockReason: string | null
}

export interface BuilderV2WheelSlotView {
  wheelIndex: 0 | 1
  label: string
  wheelId: string | null
  wheelName: string | null
  assetSrc: string | undefined
  enlightenLevel: number | null
  isSelected: boolean
}

export interface BuilderV2WheelOption {
  id: string
  name: string
  rarity: Wheel['rarity']
  realm: Wheel['realm']
  mainstat: string
  mainstatKey: Wheel['mainstatKey']
  assetSrc: string | undefined
  inUse: boolean
  inUseLabel: string | null
  owned: boolean
  enlightenLevel: number | null
  recommended: boolean
  recommendationLabel: string | null
  recommendedMainstatKey: Wheel['mainstatKey'] | null
}

export interface BuilderV2CovenantOption {
  id: string
  name: string
  assetSrc: string | undefined
  inUse: boolean
  recommended: boolean
  recommendationLabel: string | null
}

export interface BuilderV2PosseOption {
  id: string
  name: string
  realm: string
  assetSrc: string | undefined
  inUse: boolean
  isActive: boolean
  owned: boolean
  recommended: boolean
  blocked: boolean
  statusLabel: string | null
}

export interface BuilderV2PickerModel {
  tab: BuilderV2PickerTab
  searchQuery: string
  awakeners: BuilderV2AwakenerOption[]
  wheels: BuilderV2WheelOption[]
  covenants: BuilderV2CovenantOption[]
  posses: BuilderV2PosseOption[]
  preferences: BuilderV2PickerPreferences
  setTab: (nextTab: BuilderV2PickerTab) => void
  setSearchQuery: (nextQuery: string) => void
  setAwakenerFilter: (nextFilter: BuilderV2AwakenerFilter) => void
  setPosseFilter: (nextFilter: BuilderV2PosseFilter) => void
  setWheelRarityFilter: (nextFilter: BuilderV2WheelRarityFilter) => void
  setWheelMainstatFilter: (nextFilter: WheelMainstatFilter) => void
  setAwakenerSortKey: (nextKey: AwakenerSortKey) => void
  toggleAwakenerSortDirection: () => void
  setAwakenerSortGroupByRealm: (nextGroupByRealm: boolean) => void
  setWheelSortKey: (nextKey: WheelCollectionSortKey) => void
  toggleWheelSortDirection: () => void
  setDisplayUnowned: (nextDisplayUnowned: boolean) => void
  setSinkUnownedToBottom: (nextSinkUnownedToBottom: boolean) => void
  setAllowDupes: (nextAllowDupes: boolean) => void
  setPromoteRecommendedGear: (nextPromoteRecommendedGear: boolean) => void
  setPromoteMatchingWheelMainstats: (nextPromoteMatchingWheelMainstats: boolean) => void
}

export interface BuilderV2PickerPreferences {
  awakenerFilter: BuilderV2AwakenerFilter
  posseFilter: BuilderV2PosseFilter
  wheelRarityFilter: BuilderV2WheelRarityFilter
  wheelMainstatFilter: WheelMainstatFilter
  awakenerSortKey: AwakenerSortKey
  awakenerSortDirection: CollectionSortDirection
  awakenerSortGroupByRealm: boolean
  wheelSortKey: WheelCollectionSortKey
  wheelSortDirection: CollectionSortDirection
  displayUnowned: boolean
  sinkUnownedToBottom: boolean
  allowDupes: boolean
  promoteRecommendedGear: boolean
  promoteMatchingWheelMainstats: boolean
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
  picker: BuilderV2PickerModel
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
