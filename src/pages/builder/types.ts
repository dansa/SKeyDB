import type { Awakener } from '../../domain/awakeners'

export type TeamSlot = {
  slotId: string
  awakenerName?: string
  faction?: Awakener['faction']
  level?: number
  wheels: [string | null, string | null]
}

export type Team = {
  id: string
  name: string
  slots: TeamSlot[]
  posseId?: string
}

export type PickerTab = 'awakeners' | 'wheels' | 'posses' | 'covenants'
export type AwakenerFilter = 'ALL' | 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA'
export type PosseFilter = 'ALL' | 'FADED_LEGACY' | 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA'
export type ActiveSelection =
  | { kind: 'awakener'; slotId: string }
  | { kind: 'wheel'; slotId: string; wheelIndex: number }
  | null

export type DragData =
  | { kind: 'picker-awakener'; awakenerName: string }
  | { kind: 'team-slot'; slotId: string; awakenerName: string }
  | { kind: 'team-row'; teamId: string }
