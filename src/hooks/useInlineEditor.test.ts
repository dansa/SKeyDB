import {act, renderHook} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {useInlineEditor} from './useInlineEditor'

describe('useInlineEditor', () => {
  it('starts not editing', () => {
    const onCommit = vi.fn()
    const {result} = renderHook(() => useInlineEditor({value: 'Team 1', onCommit}))
    expect(result.current.isEditing).toBe(false)
    expect(result.current.draftValue).toBe('')
  })

  it('beginEdit sets draft to current value and enters editing mode', () => {
    const onCommit = vi.fn()
    const {result} = renderHook(() => useInlineEditor({value: 'Team 1', onCommit}))
    act(() => {
      result.current.beginEdit()
    })
    expect(result.current.isEditing).toBe(true)
    expect(result.current.draftValue).toBe('Team 1')
  })

  it('setDraft updates the draft value', () => {
    const onCommit = vi.fn()
    const {result} = renderHook(() => useInlineEditor({value: 'Team 1', onCommit}))
    act(() => {
      result.current.beginEdit()
    })
    act(() => {
      result.current.setDraft('New Name')
    })
    expect(result.current.draftValue).toBe('New Name')
  })

  it('commit calls onCommit with draft and exits editing', () => {
    const onCommit = vi.fn()
    const {result} = renderHook(() => useInlineEditor({value: 'Team 1', onCommit}))
    act(() => {
      result.current.beginEdit()
    })
    act(() => {
      result.current.setDraft('Renamed')
    })
    act(() => {
      result.current.commit()
    })
    expect(onCommit).toHaveBeenCalledWith('Renamed')
    expect(result.current.isEditing).toBe(false)
  })

  it('commit applies validate before calling onCommit', () => {
    const onCommit = vi.fn()
    const validate = (draft: string) => draft.trim().slice(0, 10)
    const {result} = renderHook(() => useInlineEditor({value: 'Team 1', onCommit, validate}))
    act(() => {
      result.current.beginEdit()
    })
    act(() => {
      result.current.setDraft('  A Very Long Team Name  ')
    })
    act(() => {
      result.current.commit()
    })
    expect(onCommit).toHaveBeenCalledWith('A Very Lon')
  })

  it('cancel exits editing without calling onCommit', () => {
    const onCommit = vi.fn()
    const {result} = renderHook(() => useInlineEditor({value: 'Team 1', onCommit}))
    act(() => {
      result.current.beginEdit()
    })
    act(() => {
      result.current.setDraft('Changed')
    })
    act(() => {
      result.current.cancel()
    })
    expect(onCommit).not.toHaveBeenCalled()
    expect(result.current.isEditing).toBe(false)
  })

  it('beginEdit picks up new value when re-entering edit mode', () => {
    const onCommit = vi.fn()
    const {result, rerender} = renderHook(
      ({value}: {value: string}) => useInlineEditor({value, onCommit}),
      {initialProps: {value: 'Team 1'}},
    )
    act(() => {
      result.current.beginEdit()
    })
    expect(result.current.draftValue).toBe('Team 1')
    act(() => {
      result.current.cancel()
    })
    rerender({value: 'Team 2'})
    act(() => {
      result.current.beginEdit()
    })
    expect(result.current.draftValue).toBe('Team 2')
  })
})
