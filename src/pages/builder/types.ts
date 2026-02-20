import type { Awakener } from '../../domain/awakeners'

export type TeamSlot = {
  slotId: string
  awakenerName?: string
  faction?: Awakener['faction']
  level?: number
  wheels: [string | null, string | null]
}

export type DragData =
  | { kind: 'picker-awakener'; awakenerName: string }
  | { kind: 'team-slot'; slotId: string; awakenerName: string }
