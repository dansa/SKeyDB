import {describe, expect, it} from 'vitest'

import {getSearchCaptureAction} from './search-capture'

function createKeyboardEvent(key: string, init: KeyboardEventInit = {}) {
  return new KeyboardEvent('keydown', {key, ...init})
}

describe('search-capture', () => {
  it('returns a character action for printable keys', () => {
    expect(
      getSearchCaptureAction({
        currentSearchValue: '',
        event: createKeyboardEvent('b'),
      }),
    ).toEqual({kind: 'character', key: 'b'})
  })

  it('returns a delete action when backspace is pressed with an existing query', () => {
    expect(
      getSearchCaptureAction({
        currentSearchValue: 'beta',
        event: createKeyboardEvent('Backspace'),
      }),
    ).toEqual({kind: 'delete'})
  })

  it('returns an escape action only when escape handling is enabled', () => {
    expect(
      getSearchCaptureAction({
        currentSearchValue: 'beta',
        event: createKeyboardEvent('Escape'),
      }),
    ).toBeNull()

    expect(
      getSearchCaptureAction({
        currentSearchValue: 'beta',
        event: createKeyboardEvent('Escape'),
        allowEscape: true,
      }),
    ).toEqual({kind: 'escape'})
  })

  it('ignores modifier keys and typing targets', () => {
    expect(
      getSearchCaptureAction({
        currentSearchValue: '',
        event: createKeyboardEvent('b', {ctrlKey: true}),
      }),
    ).toBeNull()

    const input = document.createElement('input')
    const event = createKeyboardEvent('b')
    Object.defineProperty(event, 'target', {value: input})

    expect(
      getSearchCaptureAction({
        currentSearchValue: '',
        event,
      }),
    ).toBeNull()
  })
})
