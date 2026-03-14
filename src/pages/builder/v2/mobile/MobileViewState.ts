export interface PickerContext {
  slotId: string
  target: 'awakener' | 'wheel' | 'covenant' | 'posse'
  wheelIndex?: number
}

export type MobileView =
  | {kind: 'overview'}
  | {kind: 'focused'; slotIndex: number}
  | {kind: 'picker'; context: PickerContext}
  | {kind: 'quick-lineup'}

export const OVERVIEW_VIEW: MobileView = {kind: 'overview'}

export function focusedView(slotIndex: number): MobileView {
  return {kind: 'focused', slotIndex}
}

export function pickerView(context: PickerContext): MobileView {
  return {kind: 'picker', context}
}
