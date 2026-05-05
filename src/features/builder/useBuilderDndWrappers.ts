import {useEffect, useRef, useState} from 'react'

import type {DragEndEvent, DragOverEvent, DragStartEvent} from '@dnd-kit/core'

import {resolvePredictedDropHover} from './predicted-drop-hover'
import type {DragData, PredictedDropHover, TeamSlot} from './types'

interface CoordinatedHandlers {
  handleDragStart: (event: DragStartEvent) => void
  handleDragOver: (event: DragOverEvent) => void
  handleDragEnd: (event: DragEndEvent) => void
  handleDragCancel: () => void
}

interface UseBuilderDndWrappersArgs {
  coordinated: CoordinatedHandlers
  slotById: Map<string, TeamSlot>
}

export function useBuilderDndWrappers({coordinated, slotById}: UseBuilderDndWrappersArgs) {
  const [predictedDropHover, setPredictedDropHover] = useState<PredictedDropHover>(null)
  const suppressTeamEditRef = useRef(false)
  const suppressTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (suppressTimeoutRef.current) {
        window.clearTimeout(suppressTimeoutRef.current)
      }
    }
  }, [])

  function clearSuppressionSoon() {
    if (suppressTimeoutRef.current) {
      window.clearTimeout(suppressTimeoutRef.current)
    }
    suppressTimeoutRef.current = window.setTimeout(() => {
      suppressTeamEditRef.current = false
      suppressTimeoutRef.current = null
    }, 0)
  }

  function handleDndDragStart(event: Parameters<CoordinatedHandlers['handleDragStart']>[0]) {
    suppressTeamEditRef.current = true
    setPredictedDropHover(null)
    coordinated.handleDragStart(event)
  }

  function handleDndDragOver(event: Parameters<CoordinatedHandlers['handleDragOver']>[0]) {
    const overId = typeof event.over?.id === 'string' ? event.over.id : undefined
    const dragData = event.active.data.current as DragData | undefined
    setPredictedDropHover(resolvePredictedDropHover(dragData, overId, slotById))
    coordinated.handleDragOver(event)
  }

  function handleDndDragEnd(event: Parameters<CoordinatedHandlers['handleDragEnd']>[0]) {
    setPredictedDropHover(null)
    coordinated.handleDragEnd(event)
    clearSuppressionSoon()
  }

  function handleDndDragCancel() {
    setPredictedDropHover(null)
    coordinated.handleDragCancel()
    clearSuppressionSoon()
  }

  return {
    predictedDropHover,
    isTeamEditSuppressed: suppressTeamEditRef,
    handleDndDragStart,
    handleDndDragOver,
    handleDndDragEnd,
    handleDndDragCancel,
  }
}
