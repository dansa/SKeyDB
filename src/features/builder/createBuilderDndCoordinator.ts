import type {DragEndEvent, DragOverEvent, DragStartEvent} from '@dnd-kit/core'

import {getDragKind} from './utils'

interface TeamRowDragPayload {
  teamId: string
}

interface TeamPreviewSlotDragPayload {
  teamId: string
  slotId: string
}

interface BuilderDndCoordinatorOptions {
  onTeamRowDragStart: (teamId: string) => void
  onTeamRowDragEnd?: () => void
  onTeamRowDragCancel?: () => void
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

function readStringField(value: unknown, field: 'teamId' | 'slotId'): string | undefined {
  if (typeof value !== 'object' || !value || !(field in value)) {
    return undefined
  }

  const record = value as Record<string, unknown>
  const fieldValue = record[field]
  return typeof fieldValue === 'string' ? fieldValue : undefined
}

function readTeamRowDragPayload(dragData: unknown): TeamRowDragPayload | null {
  if (getDragKind(dragData) !== 'team-row') {
    return null
  }

  const teamId = readStringField(dragData, 'teamId')
  return teamId ? {teamId} : null
}

function readTeamPreviewSlotDragPayload(dragData: unknown): TeamPreviewSlotDragPayload | null {
  if (getDragKind(dragData) !== 'team-preview-slot') {
    return null
  }

  const teamId = readStringField(dragData, 'teamId')
  const slotId = readStringField(dragData, 'slotId')
  return teamId && slotId ? {teamId, slotId} : null
}

function readOverId(overId: unknown): string | null {
  return typeof overId === 'string' ? overId : null
}

export function createBuilderDndCoordinator({
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
}: BuilderDndCoordinatorOptions) {
  function handleDragStart(event: DragStartEvent) {
    const dragData = event.active.data.current
    const teamRowDrag = readTeamRowDragPayload(dragData)
    if (teamRowDrag) {
      onTeamRowDragStart(teamRowDrag.teamId)
      return
    }

    const previewSlotDrag = readTeamPreviewSlotDragPayload(dragData)
    if (previewSlotDrag) {
      onTeamPreviewSlotDragStart(previewSlotDrag.teamId, previewSlotDrag.slotId)
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

  function handleTeamRowDragEnd(event: DragEndEvent) {
    const teamRowDrag = readTeamRowDragPayload(event.active.data.current)
    const targetTeamId = readOverId(event.over?.id)
    if (teamRowDrag && targetTeamId) {
      onTeamRowReorder(teamRowDrag.teamId, targetTeamId)
    }
    onTeamRowDragEnd?.()
  }

  function handlePreviewSlotDragEnd(event: DragEndEvent) {
    const previewSlotDrag = readTeamPreviewSlotDragPayload(event.active.data.current)
    if (previewSlotDrag) {
      onTeamPreviewSlotDragEnd(
        previewSlotDrag.teamId,
        previewSlotDrag.slotId,
        readOverId(event.over?.id),
      )
      return
    }

    onTeamPreviewSlotDragEnd('', '', null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const dragData = event.active.data.current
    if (getDragKind(dragData) === 'team-row') {
      handleTeamRowDragEnd(event)
      return
    }

    if (getDragKind(dragData) === 'team-preview-slot') {
      handlePreviewSlotDragEnd(event)
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
      onTeamRowDragCancel?.()
      onDragCancel()
    },
  }
}
