import type {ActiveSelection, WheelSlotIndex} from '../builder/types'
import type {BuilderV2PickerTab, BuilderV2TeamTarget} from './BuilderV2ModelTypes'

export type BuilderV2EditingTarget = Exclude<ActiveSelection, null> | {kind: 'posse'} | null

export type BuilderV2TeamSlotEditTarget =
  | {kind: 'awakener'}
  | {kind: 'wheel'; wheelIndex: WheelSlotIndex}
  | {kind: 'covenant'}

interface BuilderV2TeamTargetSelectionState {
  activeSelection: ActiveSelection
  activeTeamId: string
  activeTeamTarget: BuilderV2TeamTarget
}

interface BuilderV2TeamTargetSelectionCommands {
  selectAwakenerSlot: (slotId: string) => void
  selectCovenantSlot: (slotId: string) => void
  selectPosse: () => void
  selectWheelSlot: (slotId: string, wheelIndex: WheelSlotIndex) => void
  setActiveTeam: (teamId: string) => void
}

export interface BuilderV2EditingState {
  activeSelection: ActiveSelection
  activeTeamTarget: BuilderV2TeamTarget
  pickerTab: BuilderV2PickerTab | null
}

export function createBuilderV2EditingState(target: BuilderV2EditingTarget): BuilderV2EditingState {
  if (!target) {
    return {
      activeSelection: null,
      activeTeamTarget: null,
      pickerTab: null,
    }
  }

  if (target.kind === 'posse') {
    return {
      activeSelection: null,
      activeTeamTarget: {kind: 'posse'},
      pickerTab: 'posses',
    }
  }

  return {
    activeSelection: target,
    activeTeamTarget: null,
    pickerTab: getPickerTabForSelection(target),
  }
}

export function getPickerTabForSelection(
  target: Exclude<ActiveSelection, null>,
): BuilderV2PickerTab {
  if (target.kind === 'wheel') {
    return 'wheels'
  }
  if (target.kind === 'covenant') {
    return 'covenants'
  }
  return 'awakeners'
}

export function getToggledBuilderV2EditingTarget(
  current: ActiveSelection,
  target: Exclude<BuilderV2EditingTarget, null | {kind: 'posse'}>,
): BuilderV2EditingTarget {
  return isSameSelection(current, target) ? null : target
}

export function isSameSelection(
  left: ActiveSelection,
  right: Exclude<ActiveSelection, null>,
): boolean {
  if (left?.kind !== right.kind || left.slotId !== right.slotId) {
    return false
  }

  if (left.kind === 'wheel' && right.kind === 'wheel') {
    return left.wheelIndex === right.wheelIndex
  }

  return left.kind !== 'wheel'
}

export function selectBuilderV2TeamSlotEditTarget({
  commands,
  slotId,
  state,
  target,
  teamId,
}: {
  commands: Pick<
    BuilderV2TeamTargetSelectionCommands,
    'selectAwakenerSlot' | 'selectCovenantSlot' | 'selectWheelSlot' | 'setActiveTeam'
  >
  slotId: string
  state: Pick<BuilderV2TeamTargetSelectionState, 'activeSelection' | 'activeTeamId'>
  target: BuilderV2TeamSlotEditTarget
  teamId: string
}): void {
  const isCurrentTarget =
    state.activeTeamId === teamId &&
    state.activeSelection?.slotId === slotId &&
    isMatchingTeamSlotTarget(state.activeSelection, target)

  if (state.activeTeamId !== teamId) {
    commands.setActiveTeam(teamId)
  }
  if (isCurrentTarget) {
    return
  }

  switch (target.kind) {
    case 'awakener':
      commands.selectAwakenerSlot(slotId)
      return
    case 'covenant':
      commands.selectCovenantSlot(slotId)
      return
    case 'wheel':
      commands.selectWheelSlot(slotId, target.wheelIndex)
  }
}

export function selectBuilderV2TeamPosseEditTarget({
  commands,
  state,
  teamId,
}: {
  commands: Pick<BuilderV2TeamTargetSelectionCommands, 'selectPosse' | 'setActiveTeam'>
  state: Pick<BuilderV2TeamTargetSelectionState, 'activeTeamId' | 'activeTeamTarget'>
  teamId: string
}): void {
  const isCurrentTarget = state.activeTeamId === teamId && state.activeTeamTarget?.kind === 'posse'

  if (state.activeTeamId !== teamId) {
    commands.setActiveTeam(teamId)
  }
  if (!isCurrentTarget) {
    commands.selectPosse()
  }
}

function isMatchingTeamSlotTarget(
  activeSelection: Exclude<ActiveSelection, null>,
  target: BuilderV2TeamSlotEditTarget,
): boolean {
  switch (target.kind) {
    case 'awakener':
      return activeSelection.kind === 'awakener'
    case 'covenant':
      return activeSelection.kind === 'covenant'
    case 'wheel':
      return activeSelection.kind === 'wheel' && activeSelection.wheelIndex === target.wheelIndex
  }
}
