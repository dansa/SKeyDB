import type {Awakener} from '@/domain/awakeners'

export interface TeamSlot {
  slotId: string
  awakenerId?: string
  realm?: Awakener['realm']
  level?: number
  isSupport?: boolean
  wheels: [string | null, string | null]
  covenantId?: string
}

export interface Team {
  id: string
  name: string
  slots: TeamSlot[]
  posseId?: string
}

export type WheelSlotIndex = 0 | 1

export interface WheelUsageLocation {
  teamOrder: number
  teamId: string
  slotId: string
  wheelIndex: WheelSlotIndex
}

export interface CovenantUsageLocation {
  teamOrder: number
  teamId: string
  slotId: string
}

export type PickerTab = 'awakeners' | 'wheels' | 'posses' | 'covenants'
export type AwakenerFilter = 'ALL' | 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA'
export type PosseFilter = 'ALL' | 'FADED_LEGACY' | 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA'
export type WheelRarityFilter = 'ALL' | 'SSR' | 'SR' | 'R'
export type WheelMainstatFilter =
  | 'ALL'
  | 'CRIT_RATE'
  | 'CRIT_DMG'
  | 'REALM_MASTERY'
  | 'DMG_AMP'
  | 'ALIEMUS_REGEN'
  | 'KEYFLARE_REGEN'
  | 'SIGIL_YIELD'
  | 'DEATH_RESISTANCE'
export type TeamPreviewMode = 'compact' | 'expanded'
export type QuickLineupStep =
  | {kind: 'awakener'; slotId: string}
  | {kind: 'wheel'; slotId: string; wheelIndex: WheelSlotIndex}
  | {kind: 'covenant'; slotId: string}
  | {kind: 'posse'}

export interface QuickLineupSession {
  isActive: true
  currentStepIndex: number
  currentStep: QuickLineupStep
  totalSteps: number
  canGoBack: boolean
}

export type ActiveSelection =
  | {kind: 'awakener'; slotId: string}
  | {kind: 'wheel'; slotId: string; wheelIndex: WheelSlotIndex}
  | {kind: 'covenant'; slotId: string}
  | null

export type PredictedDropHover =
  | {kind: 'wheel'; slotId: string; wheelIndex: WheelSlotIndex}
  | {kind: 'covenant'; slotId: string}
  | null

export type DragData =
  | {kind: 'picker-awakener'; awakenerId: string; awakenerName: string}
  | {kind: 'picker-wheel'; wheelId: string}
  | {kind: 'picker-covenant'; covenantId: string}
  | {kind: 'picker-posse'; posseId: string; posseName: string}
  | {kind: 'team-slot'; slotId: string; awakenerId: string; awakenerName: string}
  | {kind: 'team-preview-slot'; teamId: string; slotId: string}
  | {kind: 'team-wheel'; slotId: string; wheelIndex: WheelSlotIndex; wheelId: string}
  | {kind: 'team-covenant'; slotId: string; covenantId: string}
  | {kind: 'team-row'; teamId: string}
