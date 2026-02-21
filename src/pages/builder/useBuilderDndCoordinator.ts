import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { getDragKind } from './utils'

type UseBuilderDndCoordinatorOptions = {
  onTeamRowDragStart: () => void
  onTeamRowReorder: (sourceTeamId: string, targetTeamId: string) => void
  onDragStart: (event: DragStartEvent) => void
  onDragOver: (event: DragOverEvent) => void
  onDragEnd: (event: DragEndEvent) => void
  onDragCancel: () => void
}

export function useBuilderDndCoordinator({
  onTeamRowDragStart,
  onTeamRowReorder,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDragCancel,
}: UseBuilderDndCoordinatorOptions) {
  function handleDragStart(event: DragStartEvent) {
    if (getDragKind(event.active.data.current) === 'team-row') {
      onTeamRowDragStart()
      return
    }
    onDragStart(event)
  }

  function handleDragOver(event: DragOverEvent) {
    if (getDragKind(event.active.data.current) === 'team-row') {
      return
    }
    onDragOver(event)
  }

  function handleDragEnd(event: DragEndEvent) {
    const dragData = event.active.data.current
    if (getDragKind(dragData) === 'team-row') {
      const sourceTeamId =
        typeof dragData === 'object' && dragData && 'teamId' in dragData
          ? (dragData as { teamId?: unknown }).teamId
          : undefined
      const targetTeamId = typeof event.over?.id === 'string' ? event.over.id : undefined
      if (typeof sourceTeamId === 'string' && typeof targetTeamId === 'string') {
        onTeamRowReorder(sourceTeamId, targetTeamId)
      }
      return
    }
    onDragEnd(event)
  }

  return {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel: onDragCancel,
  }
}
