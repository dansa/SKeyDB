import type {TeamPreviewMode, WheelSlotIndex} from '../builder/types'
import type {BuilderV2SlotView, BuilderV2TeamSummary} from './BuilderV2ModelTypes'

export interface BuilderV2DndCommandPort {
  slots: BuilderV2SlotView[]
  teams: BuilderV2TeamSummary[]
  teamPreviewMode: TeamPreviewMode
  moveTeamToIndex: (teamId: string, nextIndex: number) => void
  swapTeamSlots: (
    sourceTeamId: string,
    sourceSlotId: string,
    targetTeamId: string,
    targetSlotId: string,
  ) => void
  assignAwakenerToTeamSlot: (awakenerId: string, teamId: string, slotId: string) => void
  assignWheelToTeamSlot: (
    wheelId: string,
    teamId: string,
    slotId: string,
    wheelIndex?: WheelSlotIndex,
  ) => void
  assignCovenantToTeamSlot: (covenantId: string, teamId: string, slotId: string) => void
  clearTeamSlot: (teamId: string, slotId: string) => void
  clearTeamWheel: (teamId: string, slotId: string, wheelIndex: WheelSlotIndex) => void
  moveTeamWheel: (
    sourceTeamId: string,
    sourceSlotId: string,
    sourceWheelIndex: WheelSlotIndex,
    targetTeamId: string,
    targetSlotId: string,
    targetWheelIndex: WheelSlotIndex,
  ) => void
  moveTeamWheelToTeamSlot: (
    sourceTeamId: string,
    sourceSlotId: string,
    sourceWheelIndex: WheelSlotIndex,
    targetTeamId: string,
    targetSlotId: string,
  ) => void
  clearTeamCovenant: (teamId: string, slotId: string) => void
  moveTeamCovenant: (
    sourceTeamId: string,
    sourceSlotId: string,
    targetTeamId: string,
    targetSlotId: string,
  ) => void
  assignAwakenerToSlot: (awakenerId: string, slotId: string) => void
  assignWheelToSlot: (wheelId: string, slotId: string, wheelIndex?: WheelSlotIndex) => void
  assignCovenantToSlot: (covenantId: string, slotId: string) => void
  assignPosse: (posseId: string) => void
  removeAwakener: (slotId: string) => void
  moveAwakener: (fromSlotId: string, toSlotId: string) => void
  clearWheel: (slotId: string, wheelIndex: WheelSlotIndex) => void
  moveWheel: (
    fromSlotId: string,
    fromWheelIndex: WheelSlotIndex,
    toSlotId: string,
    toWheelIndex: WheelSlotIndex,
  ) => void
  moveWheelToSlot: (fromSlotId: string, fromWheelIndex: WheelSlotIndex, toSlotId: string) => void
  clearCovenant: (slotId: string) => void
  moveCovenant: (fromSlotId: string, toSlotId: string) => void
}
