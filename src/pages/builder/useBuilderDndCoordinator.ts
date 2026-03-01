import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { getDragKind } from './utils'

type UseBuilderDndCoordinatorOptions = {
  onTeamRowDragStart: (teamId: string) => void
  onTeamRowDragEnd: () => void
  onTeamRowDragCancel: () => void
  onTeamPreviewSlotDragStart: (teamId: string, slotId: string) => void
  onTeamPreviewSlotDragOver: (overId: string | null) => void
  onTeamPreviewSlotDragEnd: (teamId: string, slotId: string, overId: string | null) => void
  onTeamPreviewSlotDragCancel: () => void
  onTeamRowReorder: (sourceTeamId: string, targetTeamId: string) => void
  onDragStart: (event: DragStartEvent) => void
  onDragOver: (event: DragOverEvent) => void
  onDragEnd: (event: DragEndEvent) => void
  onDragCancel: () => void
}

export function useBuilderDndCoordinator({
  onTeamRowDragStart,
  onTeamRowDragEnd,
  onTeamRowDragCancel,
  onTeamPreviewSlotDragStart,
  onTeamPreviewSlotDragOver,
  onTeamPreviewSlotDragEnd,
  onTeamPreviewSlotDragCancel,
  onTeamRowReorder,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDragCancel,
}: UseBuilderDndCoordinatorOptions) {
  function handleDragStart(event: DragStartEvent) {
    const dragData = event.active.data.current
    if (getDragKind(dragData) === 'team-row') {
      const teamId =
        typeof dragData === 'object' && dragData && 'teamId' in dragData
          ? (dragData as { teamId?: unknown }).teamId
          : undefined
      if (typeof teamId === 'string') {
        onTeamRowDragStart(teamId)
      }
      return
    }
    if (getDragKind(dragData) === 'team-preview-slot') {
      const teamId =
        typeof dragData === 'object' && dragData && 'teamId' in dragData
          ? (dragData as { teamId?: unknown }).teamId
          : undefined
      const slotId =
        typeof dragData === 'object' && dragData && 'slotId' in dragData
          ? (dragData as { slotId?: unknown }).slotId
          : undefined
      if (typeof teamId === 'string' && typeof slotId === 'string') {
        onTeamPreviewSlotDragStart(teamId, slotId)
      }
      return
    }
    onDragStart(event)
  }

  function handleDragOver(event: DragOverEvent) {
    const dragData = event.active.data.current
    if (getDragKind(dragData) === 'team-row') {
      return
    }
    if (getDragKind(dragData) === 'team-preview-slot') {
      onTeamPreviewSlotDragOver(typeof event.over?.id === 'string' ? event.over.id : null)
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
      onTeamRowDragEnd()
      return
    }
    if (getDragKind(dragData) === 'team-preview-slot') {
      const teamId =
        typeof dragData === 'object' && dragData && 'teamId' in dragData
          ? (dragData as { teamId?: unknown }).teamId
          : undefined
      const slotId =
        typeof dragData === 'object' && dragData && 'slotId' in dragData
          ? (dragData as { slotId?: unknown }).slotId
          : undefined
      if (typeof teamId === 'string' && typeof slotId === 'string') {
        onTeamPreviewSlotDragEnd(teamId, slotId, typeof event.over?.id === 'string' ? event.over.id : null)
      } else {
        onTeamPreviewSlotDragEnd('', '', null)
      }
      return
    }
    onDragEnd(event)
  }

  return {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel: () => {
      onTeamPreviewSlotDragCancel()
      onTeamRowDragCancel()
      onDragCancel()
    },
  }
}
