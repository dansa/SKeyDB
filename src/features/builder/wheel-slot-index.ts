import type {WheelSlotIndex} from './types'

export function getWheelSlotIndex(wheelIndex: number): WheelSlotIndex | null {
  return wheelIndex === 0 || wheelIndex === 1 ? wheelIndex : null
}

export function toWheelSlotIndex(wheelIndex: number): WheelSlotIndex {
  return wheelIndex === 0 ? 0 : 1
}
