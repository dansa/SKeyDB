import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useBuilderDndCoordinator } from './useBuilderDndCoordinator'

function createCoordinator() {
  const onTeamRowDragStart = vi.fn()
  const onTeamRowReorder = vi.fn()
  const onDragStart = vi.fn()
  const onDragOver = vi.fn()
  const onDragEnd = vi.fn()
  const onDragCancel = vi.fn()

  const { result } = renderHook(() =>
    useBuilderDndCoordinator({
      onTeamRowDragStart,
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

    expect(onTeamRowDragStart).toHaveBeenCalledTimes(1)
    expect(onDragStart).not.toHaveBeenCalled()
  })

  it('routes non team-row drag start to base handler', () => {
    const { coordinator, onTeamRowDragStart, onDragStart } = createCoordinator()
    const event = { active: { data: { current: { kind: 'team-slot', slotId: 'slot-1', awakenerName: 'Goliath' } } } }

    coordinator.handleDragStart(event as never)

    expect(onDragStart).toHaveBeenCalledTimes(1)
    expect(onTeamRowDragStart).not.toHaveBeenCalled()
  })

  it('suppresses drag over for team-row drags', () => {
    const { coordinator, onDragOver } = createCoordinator()
    const teamRowEvent = { active: { data: { current: { kind: 'team-row', teamId: 'team-1' } } } }

    coordinator.handleDragOver(teamRowEvent as never)

    expect(onDragOver).not.toHaveBeenCalled()
  })

  it('reorders teams on team-row drag end with valid ids', () => {
    const { coordinator, onTeamRowReorder, onDragEnd } = createCoordinator()
    const event = {
      active: { data: { current: { kind: 'team-row', teamId: 'team-1' } } },
      over: { id: 'team-2' },
    }

    coordinator.handleDragEnd(event as never)

    expect(onTeamRowReorder).toHaveBeenCalledWith('team-1', 'team-2')
    expect(onDragEnd).not.toHaveBeenCalled()
  })

  it('does not reorder teams on team-row drag end with missing ids', () => {
    const { coordinator, onTeamRowReorder, onDragEnd } = createCoordinator()
    const event = {
      active: { data: { current: { kind: 'team-row' } } },
      over: { id: 123 },
    }

    coordinator.handleDragEnd(event as never)

    expect(onTeamRowReorder).not.toHaveBeenCalled()
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

  it('forwards drag cancel handler', () => {
    const { coordinator, onDragCancel } = createCoordinator()

    coordinator.handleDragCancel()

    expect(onDragCancel).toHaveBeenCalledTimes(1)
  })
})
