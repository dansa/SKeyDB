import type { ActiveSelection } from './types'

export function toggleAwakenerSelection(previous: ActiveSelection, slotId: string): ActiveSelection {
  if (previous?.kind === 'awakener' && previous.slotId === slotId) {
    return null
  }
  return { kind: 'awakener', slotId }
}

export function toggleWheelSelection(previous: ActiveSelection, slotId: string, wheelIndex: number): ActiveSelection {
  if (previous?.kind === 'wheel' && previous.slotId === slotId && previous.wheelIndex === wheelIndex) {
    return null
  }
  return { kind: 'wheel', slotId, wheelIndex }
}

export function toggleCovenantSelection(previous: ActiveSelection, slotId: string): ActiveSelection {
  if (previous?.kind === 'covenant' && previous.slotId === slotId) {
    return null
  }
  return { kind: 'covenant', slotId }
}

export function shouldSetActiveWheelOnPickerAssign(activeSelection: ActiveSelection): boolean {
  return activeSelection?.kind === 'wheel'
}

export function nextSelectionAfterWheelSwap(
  currentSelection: ActiveSelection,
  sourceSlotId: string,
  sourceWheelIndex: number,
  targetSlotId: string,
  targetWheelIndex: number,
): ActiveSelection {
  if (currentSelection?.kind !== 'wheel') {
    return currentSelection
  }
  const isActiveSource =
    currentSelection.slotId === sourceSlotId &&
    currentSelection.wheelIndex === sourceWheelIndex
  if (isActiveSource) {
    return { kind: 'wheel', slotId: targetSlotId, wheelIndex: targetWheelIndex }
  }
  const isActiveTarget =
    currentSelection.slotId === targetSlotId &&
    currentSelection.wheelIndex === targetWheelIndex
  if (isActiveTarget) {
    return { kind: 'wheel', slotId: sourceSlotId, wheelIndex: sourceWheelIndex }
  }
  return currentSelection
}

export function nextSelectionAfterWheelRemoved(
  currentSelection: ActiveSelection,
  sourceSlotId: string,
  sourceWheelIndex: number,
): ActiveSelection {
  if (
    currentSelection?.kind === 'wheel' &&
    currentSelection.slotId === sourceSlotId &&
    currentSelection.wheelIndex === sourceWheelIndex
  ) {
    return null
  }
  return currentSelection
}

export function nextSelectionAfterCovenantSwap(
  currentSelection: ActiveSelection,
  sourceSlotId: string,
  targetSlotId: string,
): ActiveSelection {
  if (currentSelection?.kind !== 'covenant') {
    return currentSelection
  }

  if (currentSelection.slotId === sourceSlotId) {
    return { kind: 'covenant', slotId: targetSlotId }
  }

  if (currentSelection.slotId === targetSlotId) {
    return { kind: 'covenant', slotId: sourceSlotId }
  }

  return currentSelection
}

export function nextSelectionAfterCovenantRemoved(
  currentSelection: ActiveSelection,
  sourceSlotId: string,
): ActiveSelection {
  if (currentSelection?.kind === 'covenant' && currentSelection.slotId === sourceSlotId) {
    return null
  }
  return currentSelection
}
