import {createContext, useContext} from 'react'

import {type DraggableAttributes, type DraggableSyntheticListeners} from '@dnd-kit/core'

export interface PopoverDragContextValue {
  dragListeners?: DraggableSyntheticListeners
  dragAttributes?: DraggableAttributes
  isPinned?: boolean
  onTogglePin?: () => void
}

const PopoverDragContext = createContext<PopoverDragContextValue>({})

export const PopoverDragProvider = PopoverDragContext.Provider

export function usePopoverDragContext() {
  return useContext(PopoverDragContext)
}
