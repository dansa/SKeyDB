import type {ActiveSelection} from '../builder/types'
import type {BuilderV2PickerTab, BuilderV2TeamTarget} from './BuilderV2ModelTypes'

export type BuilderV2EditingTarget = Exclude<ActiveSelection, null> | {kind: 'posse'} | null

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
