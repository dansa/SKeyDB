import {createContext, useContext} from 'react'

import type {DragData, PredictedDropHover} from '../types'

export interface BuilderDndStateValue {
  activeDragKind: DragData['kind'] | null
  predictedDropHover: PredictedDropHover
}

export const defaultBuilderDndState: BuilderDndStateValue = {
  activeDragKind: null,
  predictedDropHover: null,
}

export const BuilderDndStateContext = createContext<BuilderDndStateValue>(defaultBuilderDndState)

export function useBuilderDndState() {
  return useContext(BuilderDndStateContext)
}
