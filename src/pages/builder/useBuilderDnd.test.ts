import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeWheelDropZoneId, PICKER_DROP_ZONE_ID } from './dnd-ids'
import { useBuilderDnd } from './useBuilderDnd'

function createUseBuilderDnd() {
  const onDropPickerAwakener = vi.fn()
  const onDropPickerWheel = vi.fn()
  const onDropPickerCovenant = vi.fn()
  const onDropTeamSlot = vi.fn()
  const onDropTeamWheel = vi.fn()
  const onDropTeamCovenant = vi.fn()
  const onDropTeamCovenantToSlot = vi.fn()
  const onDropTeamWheelToSlot = vi.fn()
  const onDropTeamSlotToPicker = vi.fn()
  const onDropTeamWheelToPicker = vi.fn()
  const onDropTeamCovenantToPicker = vi.fn()

  const { result } = renderHook(() =>
    useBuilderDnd({
      onDropPickerAwakener,
      onDropPickerWheel,
      onDropPickerCovenant,
      onDropTeamSlot,
      onDropTeamWheel,
      onDropTeamCovenant,
      onDropTeamCovenantToSlot,
      onDropTeamWheelToSlot,
      onDropTeamSlotToPicker,
      onDropTeamWheelToPicker,
      onDropTeamCovenantToPicker,
    }),
  )

  return {
    dnd: result.current,
    onDropPickerAwakener,
    onDropPickerWheel,
    onDropPickerCovenant,
    onDropTeamSlot,
    onDropTeamWheel,
    onDropTeamCovenant,
    onDropTeamCovenantToSlot,
    onDropTeamWheelToSlot,
    onDropTeamSlotToPicker,
    onDropTeamWheelToPicker,
    onDropTeamCovenantToPicker,
  }
}

describe('useBuilderDnd', () => {
  it('routes picker wheel drop to wheel target', () => {
    const { dnd, onDropPickerWheel } = createUseBuilderDnd()
    const wheelDropId = makeWheelDropZoneId('slot-2', 1)

    dnd.handleDragEnd({
      active: { data: { current: { kind: 'picker-wheel', wheelId: 'B01' } } },
      over: { id: wheelDropId },
    } as never)

    expect(onDropPickerWheel).toHaveBeenCalledWith('B01', 'slot-2', 1)
  })

  it('routes picker wheel drop on a team card to slot-level target', () => {
    const { dnd, onDropPickerWheel } = createUseBuilderDnd()

    dnd.handleDragEnd({
      active: { data: { current: { kind: 'picker-wheel', wheelId: 'B01' } } },
      over: { id: 'slot-3' },
    } as never)

    expect(onDropPickerWheel).toHaveBeenCalledWith('B01', 'slot-3')
  })

  it('routes picker covenant drop to covenant target', () => {
    const { dnd, onDropPickerCovenant } = createUseBuilderDnd()

    dnd.handleDragEnd({
      active: { data: { current: { kind: 'picker-covenant', covenantId: '001' } } },
      over: { id: 'dropzone:covenant:slot-2' },
    } as never)

    expect(onDropPickerCovenant).toHaveBeenCalledWith('001', 'slot-2')
  })

  it('routes team wheel drop to picker remove zone', () => {
    const { dnd, onDropTeamWheelToPicker } = createUseBuilderDnd()

    dnd.handleDragEnd({
      active: { data: { current: { kind: 'team-wheel', slotId: 'slot-1', wheelIndex: 0, wheelId: 'B01' } } },
      over: { id: PICKER_DROP_ZONE_ID },
    } as never)

    expect(onDropTeamWheelToPicker).toHaveBeenCalledWith('slot-1', 0)
  })

  it('routes team covenant drop to picker remove zone', () => {
    const { dnd, onDropTeamCovenantToPicker } = createUseBuilderDnd()

    dnd.handleDragEnd({
      active: { data: { current: { kind: 'team-covenant', slotId: 'slot-1', covenantId: '001' } } },
      over: { id: PICKER_DROP_ZONE_ID },
    } as never)

    expect(onDropTeamCovenantToPicker).toHaveBeenCalledWith('slot-1')
  })

  it('routes team wheel drop to another wheel target', () => {
    const { dnd, onDropTeamWheel } = createUseBuilderDnd()
    const wheelDropId = makeWheelDropZoneId('slot-3', 0)

    dnd.handleDragEnd({
      active: { data: { current: { kind: 'team-wheel', slotId: 'slot-1', wheelIndex: 1, wheelId: 'B01' } } },
      over: { id: wheelDropId },
    } as never)

    expect(onDropTeamWheel).toHaveBeenCalledWith('slot-1', 1, 'slot-3', 0)
  })

  it('maps picker awakener wheel-zone drops back to slot id', () => {
    const { dnd, onDropPickerAwakener } = createUseBuilderDnd()
    const wheelDropId = makeWheelDropZoneId('slot-4', 0)

    dnd.handleDragEnd({
      active: { data: { current: { kind: 'picker-awakener', awakenerName: 'goliath' } } },
      over: { id: wheelDropId },
    } as never)

    expect(onDropPickerAwakener).toHaveBeenCalledWith('goliath', 'slot-4')
  })

  it('ignores team-slot drops on non-slot ids (e.g. team rows)', () => {
    const { dnd, onDropTeamSlot, onDropTeamSlotToPicker } = createUseBuilderDnd()

    dnd.handleDragEnd({
      active: { data: { current: { kind: 'team-slot', slotId: 'slot-1', awakenerName: 'goliath' } } },
      over: { id: 'team-2' },
    } as never)

    expect(onDropTeamSlot).not.toHaveBeenCalled()
    expect(onDropTeamSlotToPicker).not.toHaveBeenCalled()
  })

  it('routes team wheel drop on a team card to slot-level target', () => {
    const { dnd, onDropTeamWheelToSlot } = createUseBuilderDnd()

    dnd.handleDragEnd({
      active: { data: { current: { kind: 'team-wheel', slotId: 'slot-1', wheelIndex: 1, wheelId: 'B01' } } },
      over: { id: 'slot-4' },
    } as never)

    expect(onDropTeamWheelToSlot).toHaveBeenCalledWith('slot-1', 1, 'slot-4')
  })

  it('routes team covenant drop on a team card to slot-level target', () => {
    const { dnd, onDropTeamCovenantToSlot } = createUseBuilderDnd()

    dnd.handleDragEnd({
      active: { data: { current: { kind: 'team-covenant', slotId: 'slot-1', covenantId: '001' } } },
      over: { id: 'slot-4' },
    } as never)

    expect(onDropTeamCovenantToSlot).toHaveBeenCalledWith('slot-1', 'slot-4')
  })

  it('routes team covenant drop to another covenant target', () => {
    const { dnd, onDropTeamCovenant } = createUseBuilderDnd()

    dnd.handleDragEnd({
      active: { data: { current: { kind: 'team-covenant', slotId: 'slot-1', covenantId: '001' } } },
      over: { id: 'dropzone:covenant:slot-3' },
    } as never)

    expect(onDropTeamCovenant).toHaveBeenCalledWith('slot-1', 'slot-3')
  })
})
