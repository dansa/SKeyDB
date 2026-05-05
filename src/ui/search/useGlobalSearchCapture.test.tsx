import {useRef} from 'react'

import {fireEvent, render} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {useGlobalSearchCapture} from './useGlobalSearchCapture'

function Harness({
  enabled = true,
  initialValue = '',
  onAppendCharacter,
  onRemoveCharacter,
  onClearSearch,
}: {
  enabled?: boolean
  initialValue?: string
  onAppendCharacter: (key: string) => void
  onRemoveCharacter: () => void
  onClearSearch: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useGlobalSearchCapture({
    enabled,
    onAppendCharacter,
    onRemoveCharacter,
    onClearSearch,
    searchInputRef: inputRef,
  })

  return <input defaultValue={initialValue} ref={inputRef} />
}

describe('useGlobalSearchCapture', () => {
  it('does not capture typing when disabled', () => {
    const onAppendCharacter = vi.fn()
    const onRemoveCharacter = vi.fn()
    const onClearSearch = vi.fn()

    render(
      <Harness
        enabled={false}
        onAppendCharacter={onAppendCharacter}
        onRemoveCharacter={onRemoveCharacter}
        onClearSearch={onClearSearch}
      />,
    )

    window.dispatchEvent(new KeyboardEvent('keydown', {key: 'a'}))

    expect(onAppendCharacter).not.toHaveBeenCalled()
    expect(onRemoveCharacter).not.toHaveBeenCalled()
    expect(onClearSearch).not.toHaveBeenCalled()
  })

  it('routes backspace into the active search input when there is text', () => {
    const onAppendCharacter = vi.fn()
    const onRemoveCharacter = vi.fn()
    const onClearSearch = vi.fn()

    render(
      <Harness
        initialValue='abc'
        onAppendCharacter={onAppendCharacter}
        onRemoveCharacter={onRemoveCharacter}
        onClearSearch={onClearSearch}
      />,
    )

    fireEvent.keyDown(window, {key: 'Backspace'})

    expect(onRemoveCharacter).toHaveBeenCalledTimes(1)
    expect(onAppendCharacter).not.toHaveBeenCalled()
    expect(onClearSearch).not.toHaveBeenCalled()
  })

  it('clears search on escape and keeps the input focused', () => {
    const onAppendCharacter = vi.fn()
    const onRemoveCharacter = vi.fn()
    const onClearSearch = vi.fn()

    const {container} = render(
      <Harness
        initialValue='abc'
        onAppendCharacter={onAppendCharacter}
        onRemoveCharacter={onRemoveCharacter}
        onClearSearch={onClearSearch}
      />,
    )

    const input = container.querySelector('input')
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Expected search input')
    }

    input.focus()
    fireEvent.keyDown(window, {key: 'Escape'})

    expect(onClearSearch).toHaveBeenCalledTimes(1)
    expect(onAppendCharacter).not.toHaveBeenCalled()
    expect(onRemoveCharacter).not.toHaveBeenCalled()
    expect(input).toHaveFocus()
  })

  it('does not force focus into the input when escape clears search from elsewhere', () => {
    const onAppendCharacter = vi.fn()
    const onRemoveCharacter = vi.fn()
    const onClearSearch = vi.fn()

    const {container} = render(
      <Harness
        initialValue='abc'
        onAppendCharacter={onAppendCharacter}
        onRemoveCharacter={onRemoveCharacter}
        onClearSearch={onClearSearch}
      />,
    )

    const input = container.querySelector('input')
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Expected search input')
    }

    fireEvent.keyDown(window, {key: 'Escape'})

    expect(onClearSearch).toHaveBeenCalledTimes(1)
    expect(input).not.toHaveFocus()
  })
})
