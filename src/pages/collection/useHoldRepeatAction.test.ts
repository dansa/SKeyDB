import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useHoldRepeatAction } from './useHoldRepeatAction'

function createPointerEvent() {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as React.PointerEvent<HTMLButtonElement>
}

function createMouseEvent() {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as React.MouseEvent<HTMLButtonElement>
}

describe('useHoldRepeatAction', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('runs action once on normal click', () => {
    const onStep = vi.fn()
    const { result } = renderHook(() => useHoldRepeatAction({ onStep }))

    act(() => {
      result.current.onClick(createMouseEvent())
    })

    expect(onStep).toHaveBeenCalledTimes(1)
  })

  it('repeats action on hold and suppresses trailing click', () => {
    const onStep = vi.fn()
    const { result } = renderHook(() =>
      useHoldRepeatAction({ onStep, holdDelayMs: 200, repeatMs: 50 }),
    )

    act(() => {
      result.current.onPointerDown(createPointerEvent())
      vi.advanceTimersByTime(200)
      vi.advanceTimersByTime(100)
      result.current.onPointerUp()
      result.current.onClick(createMouseEvent())
    })

    expect(onStep).toHaveBeenCalledTimes(3)
  })

  it('does not run when disabled', () => {
    const onStep = vi.fn()
    const { result } = renderHook(() => useHoldRepeatAction({ onStep, disabled: true }))

    act(() => {
      result.current.onPointerDown(createPointerEvent())
      vi.advanceTimersByTime(500)
      result.current.onPointerUp()
      result.current.onClick(createMouseEvent())
    })

    expect(onStep).not.toHaveBeenCalled()
  })
})
