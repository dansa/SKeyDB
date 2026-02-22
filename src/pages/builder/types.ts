import type { Awakener } from '../../domain/awakeners'

export type TeamSlot = {
  slotId: string
  awakenerName?: string
  faction?: Awakener['faction']
  level?: number
  wheels: [string | null, string | null]
  covenantId?: string
}

export type Team = {
  id: string
  name: string
  slots: TeamSlot[]
  posseId?: string
}

export type WheelUsageLocation = {
  teamOrder: number
  teamId: string
  slotId: string
  wheelIndex: number
}

export type CovenantUsageLocation = {
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
export type ActiveSelection =
  | { kind: 'awakener'; slotId: string }
  | { kind: 'wheel'; slotId: string; wheelIndex: number }
  | { kind: 'covenant'; slotId: string }
  | null

export type PredictedDropHover =
  | { kind: 'wheel'; slotId: string; wheelIndex: number }
  | { kind: 'covenant'; slotId: string }
  | null

export type DragData =
  | { kind: 'picker-awakener'; awakenerName: string }
  | { kind: 'picker-wheel'; wheelId: string }
  | { kind: 'picker-covenant'; covenantId: string }
  | { kind: 'team-slot'; slotId: string; awakenerName: string }
  | { kind: 'team-wheel'; slotId: string; wheelIndex: number; wheelId: string }
  | { kind: 'team-covenant'; slotId: string; covenantId: string }
  | { kind: 'team-row'; teamId: string }
