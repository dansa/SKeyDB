import {formatAwakenerNameForUi} from '@/domain/name-format'

import type {TeamSlot} from '../../types'
import type {QuickLineupStep} from '../store/types'

export type QuickLineupSlotTarget = 'awakener' | 'wheel-0' | 'wheel-1' | 'covenant'

export function getQuickLineupStepContextLabel(step: QuickLineupStep, slots: TeamSlot[]): string {
  if (step.kind === 'posse') {
    return 'Team Posse'
  }

  const slotIndex = slots.findIndex((slot) => slot.slotId === step.slotId)
  const slot = slotIndex === -1 ? null : slots[slotIndex]
  const slotLabel = slot?.awakenerName
    ? formatAwakenerNameForUi(slot.awakenerName)
    : `Slot ${String(slotIndex + 1)}`

  if (step.kind === 'awakener') {
    return `${slotLabel} -> Awakener`
  }
  if (step.kind === 'wheel') {
    return `${slotLabel} -> Wheel ${String(step.wheelIndex + 1)}`
  }
  return `${slotLabel} -> Covenant`
}

export function getQuickLineupActiveTarget(
  slotId: string,
  currentStep: QuickLineupStep,
): QuickLineupSlotTarget | null {
  if (currentStep.kind === 'posse' || currentStep.slotId !== slotId) {
    return null
  }

  if (currentStep.kind === 'awakener') {
    return 'awakener'
  }
  if (currentStep.kind === 'wheel') {
    return currentStep.wheelIndex === 0 ? 'wheel-0' : 'wheel-1'
  }
  return 'covenant'
}

export function isQuickLineupSlotActive(slotId: string, currentStep: QuickLineupStep): boolean {
  return getQuickLineupActiveTarget(slotId, currentStep) !== null
}

export function getQuickLineupStepForTarget(
  slotId: string,
  target: QuickLineupSlotTarget,
): QuickLineupStep {
  if (target === 'awakener') {
    return {kind: 'awakener', slotId}
  }
  if (target === 'wheel-0') {
    return {kind: 'wheel', slotId, wheelIndex: 0}
  }
  if (target === 'wheel-1') {
    return {kind: 'wheel', slotId, wheelIndex: 1}
  }
  return {kind: 'covenant', slotId}
}
