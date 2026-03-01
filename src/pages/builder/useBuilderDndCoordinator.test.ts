import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useBuilderDndCoordinator } from './useBuilderDndCoordinator'

function createCoordinator() {
  const onTeamRowDragStart = vi.fn()
  const onTeamRowDragEnd = vi.fn()
  const onTeamRowDragCancel = vi.fn()
  const onTeamPreviewSlotDragStart = vi.fn()
  const onTeamPreviewSlotDragOver = vi.fn()
  const onTeamPreviewSlotDragEnd = vi.fn()
  const onTeamPreviewSlotDragCancel = vi.fn()
  const onTeamRowReorder = vi.fn()
  const onDragStart = vi.fn()
  const onDragOver = vi.fn()
  const onDragEnd = vi.fn()
  const onDragCancel = vi.fn()

  const { result } = renderHook(() =>
    useBuilderDndCoordinator({
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
    }),
  )

  return {
    coordinator: result.current,
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
  }
}

describe('useBuilderDndCoordinator', () => {
  it('routes team-row drag start to team-row handler only', () => {
    const { coordinator, onTeamRowDragStart, onDragStart } = createCoordinator()
    const event = { active: { data: { current: { kind: 'team-row', teamId: 'team-1' } } } }

    coordinator.handleDragStart(event as never)

    expect(onTeamRowDragStart).toHaveBeenCalledWith('team-1')
    expect(onDragStart).not.toHaveBeenCalled()
  })

  it('routes non team-row drag start to base handler', () => {
    const { coordinator, onTeamRowDragStart, onDragStart } = createCoordinator()
    const event = { active: { data: { current: { kind: 'team-slot', slotId: 'slot-1', awakenerName: 'Goliath' } } } }

    coordinator.handleDragStart(event as never)

    expect(onDragStart).toHaveBeenCalledTimes(1)
    expect(onTeamRowDragStart).not.toHaveBeenCalled()
  })

  it('routes preview-slot drag start to preview-slot handler only', () => {
    const { coordinator, onDragStart, onTeamPreviewSlotDragStart } = createCoordinator()
    const event = { active: { data: { current: { kind: 'team-preview-slot', teamId: 'team-1', slotId: 'team-1-slot-1' } } } }

    coordinator.handleDragStart(event as never)

    expect(onTeamPreviewSlotDragStart).toHaveBeenCalledWith('team-1', 'team-1-slot-1')
    expect(onDragStart).not.toHaveBeenCalled()
  })

  it('suppresses drag over for team-row drags', () => {
    const { coordinator, onDragOver } = createCoordinator()
    const teamRowEvent = { active: { data: { current: { kind: 'team-row', teamId: 'team-1' } } } }

    coordinator.handleDragOver(teamRowEvent as never)

    expect(onDragOver).not.toHaveBeenCalled()
  })

  it('routes preview-slot drag over to preview-slot handler only', () => {
    const { coordinator, onDragOver, onTeamPreviewSlotDragOver } = createCoordinator()
    const event = {
      active: { data: { current: { kind: 'team-preview-slot', teamId: 'team-1', slotId: 'team-1-slot-1' } } },
      over: { id: 'dropzone:team-preview-slot:team-2:team-2-slot-1' },
    }

    coordinator.handleDragOver(event as never)

    expect(onTeamPreviewSlotDragOver).toHaveBeenCalledWith('dropzone:team-preview-slot:team-2:team-2-slot-1')
    expect(onDragOver).not.toHaveBeenCalled()
  })

  it('reorders teams on team-row drag end with valid ids', () => {
    const { coordinator, onTeamRowDragEnd, onTeamRowReorder, onDragEnd } = createCoordinator()
    const event = {
      active: { data: { current: { kind: 'team-row', teamId: 'team-1' } } },
      over: { id: 'team-2' },
    }

    coordinator.handleDragEnd(event as never)

    expect(onTeamRowReorder).toHaveBeenCalledWith('team-1', 'team-2')
    expect(onTeamRowDragEnd).toHaveBeenCalledTimes(1)
    expect(onDragEnd).not.toHaveBeenCalled()
  })

  it('does not reorder teams on team-row drag end with missing ids', () => {
    const { coordinator, onTeamRowDragEnd, onTeamRowReorder, onDragEnd } = createCoordinator()
    const event = {
      active: { data: { current: { kind: 'team-row' } } },
      over: { id: 123 },
    }

    coordinator.handleDragEnd(event as never)

    expect(onTeamRowReorder).not.toHaveBeenCalled()
    expect(onTeamRowDragEnd).toHaveBeenCalledTimes(1)
    expect(onDragEnd).not.toHaveBeenCalled()
  })

  it('routes non team-row drag end to base handler', () => {
    const { coordinator, onTeamRowReorder, onDragEnd } = createCoordinator()
    const event = {
      active: { data: { current: { kind: 'team-slot', slotId: 'slot-1', awakenerName: 'Goliath' } } },
      over: { id: 'slot-2' },
    }

    coordinator.handleDragEnd(event as never)

    expect(onDragEnd).toHaveBeenCalledTimes(1)
    expect(onTeamRowReorder).not.toHaveBeenCalled()
  })

  it('routes preview-slot drag end to preview-slot handler only', () => {
    const { coordinator, onDragEnd, onTeamPreviewSlotDragEnd } = createCoordinator()
    const event = {
      active: { data: { current: { kind: 'team-preview-slot', teamId: 'team-1', slotId: 'team-1-slot-1' } } },
      over: { id: 'dropzone:team-preview-slot:team-2:team-2-slot-1' },
    }

    coordinator.handleDragEnd(event as never)

    expect(onTeamPreviewSlotDragEnd).toHaveBeenCalledWith('team-1', 'team-1-slot-1', 'dropzone:team-preview-slot:team-2:team-2-slot-1')
    expect(onDragEnd).not.toHaveBeenCalled()
  })

  it('forwards drag cancel handler', () => {
    const { coordinator, onDragCancel, onTeamPreviewSlotDragCancel, onTeamRowDragCancel } = createCoordinator()

    coordinator.handleDragCancel()

    expect(onTeamPreviewSlotDragCancel).toHaveBeenCalledTimes(1)
    expect(onTeamRowDragCancel).toHaveBeenCalledTimes(1)
    expect(onDragCancel).toHaveBeenCalledTimes(1)
  })
})
